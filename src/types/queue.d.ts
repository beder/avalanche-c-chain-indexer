import Bull from "bull";

export declare namespace QueueTypes {
  interface Account {
    address: string;
  }

  type AccountJob = Bull.Job<QueueTypes.Account>;

  interface Block {
    blockNumber: number;
  }

  type BlockJob = Bull.Job<QueueTypes.Block>;

  type AccountCallback = (job: AccountJob) => Promise<void>;

  type BlockCallback = (job: BlockJob) => Promise<void>;
}
