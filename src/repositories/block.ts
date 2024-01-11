import { PrismaClient } from "@prisma/client";
import { Block } from "../dtos/block";
import { injectable } from "inversify";
import { RepositoryTypes } from "../types/repository";
import { getPageSize } from "../lib/repositories";

@injectable()
export class BlockRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  createOrUpdate(block: Block) {
    const { number, transactions } = block;

    return this.prisma.block.upsert({
      where: { number },
      create: {
        ...block,
        ...(transactions && {
          transactions: {
            createMany: {
              data: block.transactions.map(
                ({ blockNumber, ...transaction }) => ({ ...transaction })
              ),
            },
          },
        }),
      },
      update: {},
    });
  }

  async exists(number: bigint) {
    const block = await this.prisma.block.findFirst({
      where: {
        number,
      },
    });

    return !!block;
  }

  getCount() {
    return this.prisma.block.count();
  }

  async getHighestBlockNumber() {
    const block = await this.prisma.block.findFirst({
      orderBy: {
        number: "desc",
      },
    });

    return block?.number || BigInt(0);
  }

  async getLowestBlockNumber() {
    const block = await this.prisma.block.findFirst({
      orderBy: {
        number: "asc",
      },
    });

    return block?.number || BigInt(0);
  }

  list(pagination: RepositoryTypes.Pagination) {
    const where = this.getListByNumberFilter(pagination);
    const orderBy = this.getOrderByNumber(pagination.direction);

    return this.getBlocks(where, orderBy, pagination);
  }

  private async getBlocks(
    where: any,
    orderBy: any,
    pagination: RepositoryTypes.Pagination
  ) {
    const take = getPageSize(pagination.pageSize);

    const blocks = await this.prisma.block.findMany({
      orderBy,
      take,
      where,
    });

    return pagination.direction === "backward" ? blocks.reverse() : blocks;
  }

  private getListByNumberFilter(pagination: RepositoryTypes.Pagination) {
    const { cursor, direction } = pagination;

    if (!cursor) {
      return {};
    }

    const cursorOperator = direction === "backward" ? "gt" : "lt";

    return { number: { [cursorOperator]: BigInt(cursor) } };
  }

  private getOrderByNumber(direction?: RepositoryTypes.Direction) {
    const sortOrder: "asc" | "desc" = direction === "backward" ? "asc" : "desc";

    return {
      number: sortOrder,
    };
  }
}
