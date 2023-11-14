import { Request, Response } from "express";
import { Account, PrismaClient, Transaction } from "@prisma/client";
import { numberToHex } from "web3-utils";

export class Transactions {
  private prisma: PrismaClient = new PrismaClient();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async listTransactions(req: Request, res: Response) {
    const { address } = req.params;

    const transactions = await this.prisma.transaction.findMany({
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

    res.json(transactions.map(this.formatTransaction));
  }

  async getTransactionCount(req: Request, res: Response) {
    const { address } = req.params;

    const transactionCount = await this.prisma.transaction.count({
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

    res.json(transactionCount);
  }

  async listTransactionsByValue(req: Request, res: Response) {
    const transactions = await this.prisma.transaction.findMany({
      orderBy: {
        value: "desc",
      },
    });

    res.json(transactions.map(this.formatTransaction));
  }

  async getTopAddresses(req: Request, res: Response) {
    const addresses = await this.prisma.account.findMany({
      take: 100,
      orderBy: {
        balance: "desc",
      },
    });

    res.json(addresses.map(this.formatAddress));
  }

  private formatAddress(address: Account) {
    const { id, ...rest } = address;

    return {
      ...rest,
      balance: numberToHex(address.balance.toFixed(0)),
    }
  }

  private formatTransaction(tx: Transaction) {
    const { id, ...rest } = tx;

    return {
      ...rest,
      blockNumber: numberToHex(tx.blockNumber),
      transactionIndex: numberToHex(tx.transactionIndex),
      value: numberToHex(tx.value.toFixed(0)),
    };
  }
}
