import { Decimal } from "@prisma/client/runtime/library";
import { Expose, Transform } from "class-transformer";

class Transaction {
  @Expose()
  blockHash!: string;

  @Expose()
  @Transform(({ value }) => BigInt(value))
  blockNumber!: bigint;

  @Expose()
  from!: string;

  @Expose()
  @Transform(({ value }) => new Decimal(value))
  gas!: Decimal;

  @Expose()
  @Transform(({ value }) => new Decimal(value))
  gasPrice!: Decimal;

  @Expose()
  hash!: string;

  @Expose()
  input!: string;

  @Expose()
  nonce!: string;

  @Expose()
  to!: string;

  @Expose()
  @Transform(({ value }) => Number(value))
  transactionIndex!: number;

  @Expose()
  @Transform(({ value }) => new Decimal(value))
  value!: Decimal;

  @Expose()
  type!: string;

  @Expose()
  chainId!: string;

  @Expose()
  v!: string;

  @Expose()
  r!: string;

  @Expose()
  s!: string;
}

export { Transaction };
