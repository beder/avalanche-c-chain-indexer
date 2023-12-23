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

  async startIndexing() {
    try {
      setInterval(async () => {
        await this.indexAvalanche();
      }, this.interval);
    } catch (err) {
      console.error("Error indexing Avalanche", err);
    }
  }

  private async getMissingBlockNumbers(limit: number) {
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

  private async getNewBlockNumbers(blockNumber: bigint) {
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

  private async indexAccount(address: string) {
    const balance = await this.avalanche.getBalance(address);

    await this.accountRepository.createOrUpdate({ address, balance });
  }

  private async indexAvalanche() {
    try {
      const [transactions, accounts] = await Promise.all([
        this.transactionRepository.getCount(),
        this.accountRepository.getCount(),
      ]);

      const pad = (i: number) => i.toString().padStart(12, " ");

      console.log(
        `Transactions: ${pad(transactions)} | Accounts: ${pad(accounts)}`
      );

      if (!(await this.queue.readyForNextBatch(this.batchSize))) {
        return;
      }

      await this.indexBlocks();
    } catch (err) {
      console.error("Error indexing transaction", err);
    }
  }

  private async indexBlock(blockNumber: number) {
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

  private async indexBlocks() {
    const blockNumber = BigInt(await this.avalanche.getLatestBlockNumber());

    const newBlockNumbers = await this.getNewBlockNumbers(blockNumber);

    const missingBlockNumbers = await this.getMissingBlockNumbers(
      this.batchSize - newBlockNumbers.length
    );

    const blockNumbers = [...newBlockNumbers, ...missingBlockNumbers];

    await Promise.all(
      blockNumbers.map(async (blockNumber) => {
        await this.queue.indexBlock({ blockNumber: Number(blockNumber) });
      })
    );
  }

  private async indexTransactions(transactions: AvalancheTypes.Transaction[]) {
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
}
