import { Avalanche } from "./avalanche";
import { toHex } from "web3-utils";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import chunk from "lodash.chunk";

export class Indexer {
  avalanche = new Avalanche();
  prisma = new PrismaClient();

  async startIndexing() {
    try {
      setInterval(async () => {
        await this.indexAvalanche();
        console.log("Indexing Avalanche...");
      }, 10000); // Index transactions every 1 minute
    } catch (err) {
      console.error("Error indexing Avalanche", err);
    }
  }

  async indexAvalanche() {
    try {
      const latestBlockNumber = await this.avalanche.getLatestBlockNumber();

      console.log("Latest block number:", BigInt(latestBlockNumber));

      console.log("Indexing blocks...");

      await this.indexBlocks(BigInt(latestBlockNumber));

      console.log("Transaction count:", await this.prisma.transaction.count());
      console.log("Account count:", await this.prisma.account.count());
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
      console.log(`Block ${blockNumber} already indexed.`);

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
    const block = await this.avalanche.getBlockByNumber(toHex(blockNumber));

    await this.indexTransactions(block.transactions);

    const addresses = new Set<string>();

    block.transactions.forEach((tx: any) => {
      addresses.add(tx.from);
      addresses.add(tx.to);
    });

    await this.indexAccounts(Array.from(addresses).filter(Boolean));

    console.log("Indexed block:", blockNumber);
  }

  async indexTransactions(transactions: any[]) {
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

          console.log("Indexed transaction:", tx.hash);
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

        console.log("Indexed account:", address);
      })
    );
  }
}
