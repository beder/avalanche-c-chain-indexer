import { PrismaClient } from "@prisma/client";
import { AvalancheTypes } from "../types/avalanche";
import { Decimal } from "@prisma/client/runtime/library";

export class BlockRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createOrUpdate(block: AvalancheTypes.Block) {
    const {
      baseFeePerGas,
      blockExtraData,
      blockGasCost,
      difficulty,
      extDataGasUsed,
      extDataHash,
      extraData,
      gasLimit,
      gasUsed,
      hash,
      logsBloom,
      miner,
      mixHash,
      nonce,
      number,
      parentHash,
      receiptsRoot,
      sha3Uncles,
      size,
      stateRoot,
      timestamp,
      totalDifficulty,
      transactionsRoot,
    } = block;

    return this.prisma.block.upsert({
      where: {
        number: BigInt(number),
      },
      create: {
        baseFeePerGas: new Decimal(baseFeePerGas),
        blockExtraData,
        blockGasCost: new Decimal(blockGasCost),
        difficulty: new Decimal(difficulty),
        extDataGasUsed: new Decimal(extDataGasUsed),
        extDataHash,
        extraData,
        gasLimit: new Decimal(gasLimit),
        gasUsed: new Decimal(gasUsed),
        hash,
        logsBloom,
        miner,
        mixHash,
        nonce,
        number: BigInt(number),
        parentHash,
        receiptsRoot,
        sha3Uncles,
        size: BigInt(size),
        stateRoot,
        timestamp: new Date(Number(timestamp) * 1000),
        totalDifficulty: new Decimal(totalDifficulty),
        transactionsRoot,
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
}