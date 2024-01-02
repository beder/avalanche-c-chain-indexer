import { AvalancheService } from "./avalanche";
import { numberToHex } from "web3-utils";
import { AvalancheTypes } from "../types/avalanche";
import { QueueService } from "./queue";
import { QueueTypes } from "../types/queue";
import { AccountRepository } from "../repositories/account";
import { BlockRepository } from "../repositories/block";
import { TransactionRepository } from "../repositories/transaction";

export class IndexerService {
  private avalanche: AvalancheService;
  private accountRepository: AccountRepository;
  private blockRepository: BlockRepository;
  private transactionRepository: TransactionRepository;
  private queue: QueueService;

  private batchSize = Number(process.env.INDEXER_BATCH_SIZE || 100);
  private interval = Number(process.env.INDEXER_INTERVAL || 30000);

  constructor(
    avalanche: AvalancheService,
    accountRepository: AccountRepository,
    blockRepository: BlockRepository,
    transactionRepository: TransactionRepository,
    queue: QueueService
  ) {
    this.avalanche = avalanche;
    this.accountRepository = accountRepository;
    this.blockRepository = blockRepository;
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

      console.log(
        `Indexer is running and listening for new blocks every ${this.interval}ms`
      );
    } catch (err) {
      console.error("Error indexing Avalanche", err);
    }
  }

  private async getMissingBlockNumbers(limit: number) {
    if (limit <= 0) {
      return [];
    }

    const minIndexedBlockNumber =
      await this.blockRepository.getLowestBlockNumber();

    return Array.from(
      {
        length: Math.min(limit, Number(minIndexedBlockNumber - BigInt(1))),
      },
      (_, i) => minIndexedBlockNumber - BigInt(i) - BigInt(1)
    );
  }

  private async getNewBlockNumbers(blockNumber: bigint) {
    if (await this.blockRepository.exists(blockNumber)) {
      return [];
    }

    const maxIndexedBlockNumber =
      await this.blockRepository.getHighestBlockNumber();

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
      const [accounts, blocks, transactions] = (
        await Promise.all([
          this.accountRepository.getCount(),
          this.blockRepository.getCount(),
          this.transactionRepository.getCount(),
        ])
      ).map((count: number) => count.toString().padStart(12, " "));

      console.log(
        `Accounts: ${accounts} | Blocks: ${blocks} | Transactions: ${transactions}`
      );

      const readyForNextBatch = await this.queue.readyForNextBatch(
        this.batchSize
      );

      if (!readyForNextBatch) {
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

    await this.blockRepository.createOrUpdate(block);

    await Promise.all(
      block.transactions.map((transaction) =>
        this.transactionRepository.createOrUpdate(transaction)
      )
    );

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
}
