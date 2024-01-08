import { Expose, Transform, Type } from "class-transformer";
import { Decimal } from "@prisma/client/runtime/library";
import { Transaction } from "./transaction";

class Block {
  @Expose()
  @Transform(({ value }) => new Decimal(value))
  baseFeePerGas!: Decimal;

  @Expose()
  blockExtraData!: string;

  @Expose()
  @Transform(({ value }) => new Decimal(value))
  blockGasCost!: Decimal;

  @Expose()
  @Transform(({ value }) => new Decimal(value))
  difficulty!: Decimal;

  @Expose()
  @Transform(({ value }) => new Decimal(value))
  extDataGasUsed!: Decimal;

  @Expose()
  extDataHash!: string;

  @Expose()
  extraData!: string;

  @Expose()
  @Transform(({ value }) => new Decimal(value))
  gasLimit!: Decimal;

  @Expose()
  @Transform(({ value }) => new Decimal(value))
  gasUsed!: Decimal;

  @Expose()
  hash!: string;

  @Expose()
  logsBloom!: string;

  @Expose()
  miner!: string;

  @Expose()
  mixHash!: string;

  @Expose()
  nonce!: string;

  @Expose()
  @Transform(({ value }) => BigInt(value))
  number!: bigint;

  @Expose()
  parentHash!: string;

  @Expose()
  receiptsRoot!: string;

  @Expose()
  sha3Uncles!: string;

  @Expose()
  @Transform(({ value }) => BigInt(value))
  size!: bigint;

  @Expose()
  stateRoot!: string;

  @Expose()
  @Transform(({ value }) => new Date(Number(value) * 1000))
  timestamp!: Date;

  @Expose()
  @Transform(({ value }) => new Decimal(value))
  totalDifficulty!: Decimal;

  @Expose()
  transactionsRoot!: string;

  @Expose()
  @Type(() => Transaction)
  transactions!: Transaction[];
}

export { Block };
