import Bull from "bull";
import { QueueTypes } from "../types/queue";

export class QueueService {
  private accountsQueue: Bull.Queue;
  private blocksQueue: Bull.Queue;

  private gracePeriod = Number(process.env.QUEUE_CLEAN_GRACE_PERIOD || 3600000);
  private concurrency = Number(process.env.QUEUE_CONCURRENCY || 10);

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
    this.accountsQueue.clean(this.gracePeriod, "completed");

    const timestamp = new Date().toISOString().substring(0, 13);

    const jobId = `${account.address}-${timestamp}`;

    if (await this.accountsQueue.getJob(jobId)) {
      return;
    }

    await this.accountsQueue.add(account, { jobId });
  }

  async indexBlock(block: QueueTypes.Block) {
    this.blocksQueue.clean(this.gracePeriod, "completed");
    this.blocksQueue.add(block);
  }

  async processAccounts(callback: QueueTypes.AccountCallback) {
    this.accountsQueue.process(this.concurrency / 10, callback);
  }

  async processBlocks(callback: QueueTypes.BlockCallback) {
    this.blocksQueue.process(this.concurrency, callback);
  }

  async readyForNextBatch(batchSize: number) {
    const [accountJobCounts, blockJobCounts] = await Promise.all([
      this.accountsQueue.getJobCounts(),
      this.blocksQueue.getJobCounts(),
    ]);

    return accountJobCounts.waiting + blockJobCounts.waiting < batchSize / 10;
  }
}
