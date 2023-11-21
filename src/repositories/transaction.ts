import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { AvalancheTypes } from "../types/avalanche";

export class TransactionRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createOrUpdate(transaction: AvalancheTypes.Transaction) {
    const { hash, blockNumber, from, to, transactionIndex, value } =
      transaction;

    return this.prisma.transaction.upsert({
      where: {
        hash,
      },
      create: {
        blockNumber: BigInt(blockNumber),
        hash,
        from,
        to,
        transactionIndex: Number(transactionIndex),
        value: new Decimal(value),
      },
      update: {},
    });
  }

  async getCount() {
    return this.prisma.transaction.count();
  }

  async getCountByAddress(address: string) {
    return this.prisma.transaction.count({
      where: {
        OR: [
          {
            from: address,
          },
          {
            to: address,
          },
        ],
      },
    });
  }

  async getCountByBlockNumber(blockNumber: bigint) {
    return this.prisma.transaction.count({
      where: {
        blockNumber,
      },
    });
  }

  async getHighestBlockNumber() {
    const transaction = await this.prisma.transaction.findFirst({
      orderBy: {
        blockNumber: "desc",
      },
    });

    return transaction?.blockNumber || 0;
  }

  async listByAddress(address: string) {
    return this.prisma.transaction.findMany({
      where: {
        OR: [
          {
            from: address,
          },
          {
            to: address,
          },
        ],
      },
      orderBy: [
        {
          blockNumber: "asc",
        },
        {
          transactionIndex: "asc",
        },
      ],
    });
  }

  async listByValue() {
    return this.prisma.transaction.findMany({
      orderBy: {
        value: "desc",
      },
    });
  }
}
