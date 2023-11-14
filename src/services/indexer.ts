import { Avalanche } from "./avalanche";
import { numberToHex } from "web3-utils";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import chunk from "lodash.chunk";
import { AvalancheTypes } from "../types/avalanche";

export class Indexer {
  private avalanche: Avalanche;
  private prisma: PrismaClient;

  constructor(avalanche: Avalanche, prisma: PrismaClient) {
    this.avalanche = avalanche;
    this.prisma = prisma;
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

    const blockNumbersSets = chunk(blockNumbers, 5);

    for (const blockNumbersSet of blockNumbersSets) {
      await Promise.all(
        blockNumbersSet.map(async (blockNumber) => {
          await this.indexBlock(Number(blockNumber));
        })
      );
    }
  }

  async indexBlock(blockNumber: number) {
    const block = await this.avalanche.getBlockByNumber(numberToHex(blockNumber));

    await this.indexTransactions(block.transactions);

    const addresses = new Set<string>();

    block.transactions.forEach((tx) => {
      addresses.add(tx.from);
      addresses.add(tx.to);
    });

    await this.indexAccounts(Array.from(addresses).filter(Boolean));
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

  async indexAccounts(addresses: string[]) {
    await Promise.all(
      addresses.map(async (address) => {
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
      })
    );
  }
}
