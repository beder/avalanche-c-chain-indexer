import { AvalancheService } from "./avalanche";
import { numberToHex } from "web3-utils";
import { AvalancheTypes } from "../types/avalanche";
import { QueueService } from "./queue";
import { QueueTypes } from "../types/queue";
import { AccountRepository } from "../repositories/account";
import { TransactionRepository } from "../repositories/transaction";

export class IndexerService {
  private avalanche: AvalancheService;
  private accountRepository: AccountRepository;
  private transactionRepository: TransactionRepository;
  private queue: QueueService;

  private batchSize = Number(process.env.INDEXER_BATCH_SIZE || 1000);
  private interval = Number(process.env.INDEXER_INTERVAL || 1000);

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
      }, this.interval);
    } catch (err) {
      console.error("Error indexing Avalanche", err);
    }
  }

  async indexAvalanche() {
    try {
      console.log("Transactions:", await this.transactionRepository.getCount());
      console.log("Accounts:", await this.accountRepository.getCount());

      if (!(await this.queue.readyForNextBatch(this.batchSize))) {
        return;
      }

      const latestBlockNumber = await this.avalanche.getLatestBlockNumber();

      await this.indexBlocks(BigInt(latestBlockNumber));
    } catch (err) {
      console.error("Error indexing transaction", err);
    }
  }

  async indexBlocks(blockNumber: bigint) {
    const newBlockNumbers = await this.getNewBlockNumbers(blockNumber);

    const missingBlockNumbers = await this.getMissingBlockNumbers(
      this.batchSize - newBlockNumbers.length
    );

    const blockNumbers = newBlockNumbers.concat(missingBlockNumbers);

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

  async getNewBlockNumbers(blockNumber: bigint) {
    if (await this.transactionRepository.getCountByBlockNumber(blockNumber)) {
      return [];
    }

    const maxIndexedBlockNumber =
      await this.transactionRepository.getHighestBlockNumber();

    return Array.from(
      {
        length: Math.min(
          this.batchSize,
          Number(blockNumber - maxIndexedBlockNumber)
        ),
      },
      (_, i) => blockNumber - BigInt(i)
    );
  }

  async getMissingBlockNumbers(limit: number) {
    if (limit <= 0) {
      return [];
    }

    const minIndexedBlockNumber =
      await this.transactionRepository.getLowestBlockNumber();

    return Array.from(
      {
        length: Math.min(limit, Number(minIndexedBlockNumber - BigInt(1))),
      },
      (_, i) => minIndexedBlockNumber - BigInt(i) - BigInt(1)
    );
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
