import { PrismaClient } from "@prisma/client";
import { AvalancheTypes } from "../types/avalanche";
import { Decimal } from "@prisma/client/runtime/library";

export class AccountRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createOrUpdate(account: AvalancheTypes.Account) {
    const { address, balance } = account;

    return this.prisma.account.upsert({
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

  async getCount() {
    return this.prisma.account.count();
  }

  async listTop() {
    return this.prisma.account.findMany({
      take: 100,
      orderBy: {
        balance: "desc",
      },
    });
  }
}
