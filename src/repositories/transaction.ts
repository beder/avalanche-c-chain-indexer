import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { AvalancheTypes } from "../types/avalanche";
import { RepositoryTypes } from "../types/repository";

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

  async listByAddress(
    address: string,
    pagination: RepositoryTypes.Pagination = {}
  ) {
    const { pageSize, direction } = pagination;

    const cursorConditions = await this.getListByAddressCursorConditions(
      pagination
    );

    const orderBy = direction === "backward" ? "desc" : "asc";

    const where = {
      AND: [
        cursorConditions,
        {
          OR: [
            {
              from: address,
            },
            {
              to: address,
            },
          ],
        },
      ],
    };

    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: [
        {
          blockNumber: orderBy,
        },
        {
          transactionIndex: orderBy,
        },
      ],
      take: pageSize || 1000,
    });

    return direction === "backward" ? transactions.reverse() : transactions;
  }

  async listByValue(pagination: RepositoryTypes.Pagination = {}) {
    const { pageSize, direction } = pagination;

    const blockOrderBy = direction === "backward" ? "desc" : "asc";
    const valueOrderBy = direction === "backward" ? "asc" : "desc";

    const where = await this.getListByValueCursorConditions(pagination);

    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: [
        {
          value: valueOrderBy,
        },
        {
          blockNumber: blockOrderBy,
        },
        {
          transactionIndex: blockOrderBy,
        },
      ],
      take: pageSize,
    });

    return direction === "backward" ? transactions.reverse() : transactions;
  }

  private async getListByAddressCursorConditions(
    pagination?: RepositoryTypes.Pagination
  ) {
    if (!pagination?.cursor) {
      return {};
    }

    const cursorTransaction = await this.getTransaction(pagination.cursor);

    if (!cursorTransaction) {
      return {};
    }

    const { direction } = pagination;

    const cursorOperator = direction === "backward" ? "lt" : "gt";

    return {
      OR: [
        {
          blockNumber: cursorTransaction.blockNumber,
          transactionIndex: {
            [cursorOperator]: cursorTransaction.transactionIndex,
          },
        },
        {
          blockNumber: {
            [cursorOperator]: cursorTransaction.blockNumber,
          },
        },
      ],
    };
  }

  private async getListByValueCursorConditions(
    pagination?: RepositoryTypes.Pagination
  ) {
    if (!pagination?.cursor) {
      return {};
    }

    const transaction = await this.getTransaction(pagination.cursor);

    if (!transaction) {
      return {};
    }

    const { direction } = pagination;

    const blockOperator = direction === "backward" ? "lt" : "gt";
    const valueOperator = direction === "backward" ? "gt" : "lt";

    return {
      OR: [
        {
          blockNumber: transaction.blockNumber,
          transactionIndex: {
            [blockOperator]: transaction.transactionIndex,
          },
          value: transaction.value,
        },
        {
          blockNumber: {
            [blockOperator]: transaction.blockNumber,
          },
          value: transaction.value,
        },
        {
          value: {
            [valueOperator]: transaction.value,
          },
        },
      ],
    };
  }

  private async getTransaction(hash: string) {
    return this.prisma.transaction.findUnique({
      where: {
        hash,
      },
    });
  }
}
