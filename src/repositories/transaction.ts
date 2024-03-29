import { PrismaClient } from "@prisma/client";
import { injectable } from "inversify";
import { RepositoryTypes } from "../types/repository";
import { getPageSize } from "../lib/repositories";

@injectable()
export class TransactionRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  getCount() {
    return this.prisma.transaction.count();
  }

  getCountByAddress(address: string) {
    const where = this.getAddressFilter(address);

    return this.prisma.transaction.count({ where });
  }

  async listByAddress(
    address: string,
    pagination: RepositoryTypes.Pagination = {}
  ) {
    const where = await this.getListByAddressFilter(address, pagination);
    const orderBy = this.getOrderByBlockAndTransaction(pagination.direction);

    return this.getTransactions(where, orderBy, pagination);
  }

  async listByBlockNumber(pagination: RepositoryTypes.Pagination = {}) {
    const where = await this.getListByBlockNumberFilter(pagination);
    const orderBy = this.getOrderByBlockAndTransaction(pagination.direction);

    return this.getTransactions(where, orderBy, pagination);
  }

  async listByValue(pagination: RepositoryTypes.Pagination = {}) {
    const where = await this.getListByValueFilter(pagination);
    const orderBy = this.getOrderByValue(pagination.direction);

    return this.getTransactions(where, orderBy, pagination);
  }

  private getAddressFilter(address: string) {
    return {
      OR: [
        {
          from: address,
        },
        {
          to: address,
        },
      ],
    };
  }

  private getTransactionByCursor(cursor?: string) {
    if (!cursor) {
      return null;
    }

    return this.prisma.transaction.findUnique({
      where: {
        hash: cursor,
      },
    });
  }

  private async getListByAddressFilter(
    address: string,
    pagination: RepositoryTypes.Pagination
  ) {
    const addressFilter = this.getAddressFilter(address);

    const blockNumberFilter = await this.getListByBlockNumberFilter(pagination);

    return Object.keys(blockNumberFilter).length === 0
      ? addressFilter
      : {
          AND: [blockNumberFilter, addressFilter],
        };
  }

  private async getListByBlockNumberFilter(
    pagination: RepositoryTypes.Pagination
  ) {
    const transaction = await this.getTransactionByCursor(pagination.cursor);

    if (!transaction) {
      return {};
    }

    const cursorOperator = pagination.direction === "backward" ? "lt" : "gt";

    return {
      OR: [
        {
          blockNumber: transaction.blockNumber,
          transactionIndex: {
            [cursorOperator]: transaction.transactionIndex,
          },
        },
        {
          blockNumber: {
            [cursorOperator]: transaction.blockNumber,
          },
        },
      ],
    };
  }

  private getOrderByBlockAndTransaction(direction?: RepositoryTypes.Direction) {
    const orderBy: "desc" | "asc" = direction === "backward" ? "desc" : "asc";

    return [
      {
        blockNumber: orderBy,
      },
      {
        transactionIndex: orderBy,
      },
    ];
  }

  private async getListByValueFilter(pagination: RepositoryTypes.Pagination) {
    const transaction = await this.getTransactionByCursor(pagination.cursor);

    if (!transaction) {
      return {};
    }

    const blockOperator = pagination.direction === "backward" ? "lt" : "gt";
    const valueOperator = pagination.direction === "backward" ? "gt" : "lt";

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

  private getOrderByValue(direction?: RepositoryTypes.Direction) {
    const valueOrderBy: "desc" | "asc" =
      direction === "backward" ? "asc" : "desc";

    return [
      {
        value: valueOrderBy,
      },
      ...this.getOrderByBlockAndTransaction(direction),
    ];
  }

  private async getTransactions(
    where: any,
    orderBy: any,
    pagination: RepositoryTypes.Pagination
  ) {
    const take = getPageSize(pagination.pageSize);

    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy,
      take,
    });

    return pagination.direction === "backward"
      ? transactions.reverse()
      : transactions;
  }
}
