import Bull from "bull";
import { QueueTypes } from "../types/queue";

export class QueueService {
  private accountsQueue: Bull.Queue;
  private blocksQueue: Bull.Queue;

  private options = {
    redis: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    },
  };

  constructor() {
    this.accountsQueue = new Bull("accounts", this.options);
    this.blocksQueue = new Bull("blocks", this.options);
  }

  async indexAccount(account: QueueTypes.Account) {
    this.accountsQueue.add(account);
  }

  async indexBlock(block: QueueTypes.Block) {
    this.blocksQueue.add(block);
  }

  async processAccounts(
    callback: (job: Bull.Job<QueueTypes.Account>) => Promise<void>
  ) {
    this.accountsQueue.process(callback);
  }

  async processBlocks(
    callback: (job: Bull.Job<QueueTypes.Block>) => Promise<void>
  ) {
    this.blocksQueue.process(callback);
  }
}
