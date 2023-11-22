import { AvalancheService } from "./avalanche";
import { numberToHex } from "web3-utils";
import { AvalancheTypes } from "../types/avalanche";
import { Job } from "bull";
import { QueueService } from "./queue";
import { QueueTypes } from "../types/queue";
import { AccountRepository } from "../repositories/account";
import { TransactionRepository } from "../repositories/transaction";

export class IndexerService {
  private avalanche: AvalancheService;
  private accountRepository: AccountRepository;
  private transactionRepository: TransactionRepository;
  private queue: QueueService;

  constructor(
    avalanche: AvalancheService,
    accountRepository: AccountRepository,
    transactionRepository: TransactionRepository,
    queue: QueueService
  ) {
    this.avalanche = avalanche;
    this.accountRepository = accountRepository;
    this.transactionRepository = transactionRepository;
    this.queue = queue;
  }

  async startIndexing() {
    try {
      setInterval(async () => {
        await this.indexAvalanche();
      }, Number(process.env.INDEXER_INTERVAL || 60000));
    } catch (err) {
      console.error("Error indexing Avalanche", err);
    }
  }

  async indexAvalanche() {
    try {
      const latestBlockNumber = await this.avalanche.getLatestBlockNumber();

      await this.indexBlocks(BigInt(latestBlockNumber));

      console.log("Transactions:", await this.transactionRepository.getCount());
      console.log("Accounts:", await this.accountRepository.getCount());
    } catch (err) {
      console.error("Error indexing transaction", err);
    }
  }

  async indexBlocks(blockNumber: bigint) {
    const blockCount = await this.transactionRepository.getCountByBlockNumber(
      blockNumber
    );

    if (blockCount) {
      return;
    }

    const maxIndexedBlockNumber =
      (await this.transactionRepository.getHighestBlockNumber()) ||
      blockNumber - BigInt(1);

    const blockNumbers = Array.from(
      { length: Number(blockNumber - maxIndexedBlockNumber) },
      (_, i) => maxIndexedBlockNumber + BigInt(i + 1)
    );

    await Promise.all(
      blockNumbers.map(async (blockNumber) => {
        await this.queue.indexBlock({ blockNumber: Number(blockNumber) });
      })
    );
  }

  async processAccount(job: QueueTypes.AccountJob) {
    const { address } = job.data;

    try {
      await this.indexAccount(address);
    } catch (err) {
      console.error("Error indexing account", err);
    }
  }

  async processBlock(job: QueueTypes.BlockJob) {
    const { blockNumber } = job.data;

    try {
      await this.indexBlock(blockNumber);
    } catch (err) {
      console.error("Error indexing block", err);
    }
  }

  async indexBlock(blockNumber: number) {
    const block = await this.avalanche.getBlockByNumber(
      numberToHex(blockNumber)
    );

    await this.indexTransactions(block.transactions);

    const addresses = new Set<string>();

    block.transactions.forEach((tx) => {
      addresses.add(tx.from);
      addresses.add(tx.to);
    });

    await Promise.all(
      Array.from(addresses)
        .filter(Boolean)
        .map(async (address) => this.queue.indexAccount({ address }))
    );
  }

  async indexTransactions(transactions: AvalancheTypes.Transaction[]) {
    await Promise.all(
      transactions.map(async (tx) => {
        try {
          await this.transactionRepository.createOrUpdate(tx);
        } catch (err) {
          console.error("Error indexing transaction", err);

          console.dir({ tx }, { depth: null, colors: true });

          throw err;
        }
      })
    );
  }

  async indexAccount(address: string) {
    const balance = await this.avalanche.getBalance(address);

    await this.accountRepository.createOrUpdate({ address, balance });
  }
}
