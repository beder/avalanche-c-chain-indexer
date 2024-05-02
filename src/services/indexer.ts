import { AccountService } from "./account";
import { BlockService } from "./block";
import { injectable } from "inversify";
import { QueueService } from "./queue";
import { TransactionRepository } from "../repositories/transaction";

@injectable()
export class IndexerService {
  private accountService: AccountService;
  private blockService: BlockService;
  private transactionRepository: TransactionRepository;
  private queue: QueueService;

  private batchSize = Number(process.env.INDEXER_BATCH_SIZE || 100);
  private interval = Number(process.env.INDEXER_INTERVAL || 30000);

  constructor(
    accountService: AccountService,
    blockService: BlockService,
    transactionRepository: TransactionRepository,
    queue: QueueService
  ) {
    this.accountService = accountService;
    this.blockService = blockService;
    this.transactionRepository = transactionRepository;
    this.queue = queue;
  }

  async startIndexing() {
    try {
      this.queue.processAccounts(
        this.accountService.processAccount.bind(this.accountService)
      );

      this.queue.processBlocks(
        this.blockService.processBlock.bind(this.blockService)
      );

      setInterval(() => this.indexAvalanche(), this.interval);

      console.log(
        `Indexer is running and listening for new blocks every ${this.interval}ms`
      );
    } catch (err) {
      console.error("Error indexing Avalanche", err);
    }
  }

  private async indexAvalanche() {
    try {
      const [accounts, blocks, transactions] = (
        await Promise.all([
          this.accountService.getCount(),
          this.blockService.getCount(),
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

      await this.blockService.indexBlocks();
    } catch (err) {
      console.error("Error indexing transaction", err);
    }
  }
}
