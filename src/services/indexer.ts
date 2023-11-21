import { AvalancheService } from "./avalanche";
import { numberToHex } from "web3-utils";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { AvalancheTypes } from "../types/avalanche";
import { Job } from "bull";
import { QueueService } from "./queue";
import { QueueTypes } from "../types/queue";

export class IndexerService {
  private avalanche: AvalancheService;
  private prisma: PrismaClient;
  private queue: QueueService;

  constructor(
    avalanche: AvalancheService,
    prisma: PrismaClient,
    queue: QueueService
  ) {
    this.avalanche = avalanche;
    this.prisma = prisma;
    this.queue = queue;
  }

  async startIndexing() {
    try {
      setInterval(async () => {
        await this.indexAvalanche();
      }, 10000); // Index transactions every 1 minute
    } catch (err) {
      console.error("Error indexing Avalanche", err);
    }
  }

  async indexAvalanche() {
    try {
      const latestBlockNumber = await this.avalanche.getLatestBlockNumber();

      await this.indexBlocks(BigInt(latestBlockNumber));

      console.log("Transactions:", await this.prisma.transaction.count());
      console.log("Accounts:", await this.prisma.account.count());
    } catch (err) {
      console.error("Error indexing transaction", err);
    }
  }

  async indexBlocks(blockNumber: bigint) {
    const blockExists = await this.prisma.transaction.findFirst({
      where: {
        blockNumber,
      },
    });

    if (blockExists) {
      return;
    }

    const maxIndexedBlockNumber =
      (
        await this.prisma.transaction.findFirst({
          orderBy: {
            blockNumber: "desc",
          },
        })
      )?.blockNumber || blockNumber - BigInt(1);

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

  async processAccount(job: Job<QueueTypes.Account>) {
    const { address } = job.data;

    try {
      await this.indexAccount(address);
    } catch (err) {
      console.error("Error indexing account", err);
    }
  }

  async processBlock(job: Job<QueueTypes.Block>) {
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
          await this.prisma.transaction.upsert({
            where: {
              hash: tx.hash,
            },
            create: {
              blockNumber: BigInt(tx.blockNumber),
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              transactionIndex: Number(tx.transactionIndex),
              value: new Decimal(tx.value),
            },
            update: {},
          });
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

    await this.prisma.account.upsert({
      where: {
        address,
      },
      create: {
        address,
        balance: new Decimal(balance),
      },
      update: {
        balance: new Decimal(balance),
      },
    });
  }
}
