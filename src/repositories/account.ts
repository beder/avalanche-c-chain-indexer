import { PrismaClient } from "@prisma/client";
import { AvalancheTypes } from "../types/avalanche";
import { Decimal } from "@prisma/client/runtime/library";
import { injectable } from "inversify";

@injectable()
export class AccountRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  createOrUpdate(account: AvalancheTypes.Account) {
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

  getCount() {
    return this.prisma.account.count();
  }

  listTop() {
    return this.prisma.account.findMany({
      take: 100,
      orderBy: {
        balance: "desc",
      },
    });
  }
}
