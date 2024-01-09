import { DecimalNumber } from "./decimal-number";
import { Expose, Transform, Type } from "class-transformer";
import { numberToHex } from "web3-utils";

class Transaction {
  @Expose()
  blockHash?: string;

  @Expose()
  @Transform(({ value }) => (value ? numberToHex(value) : undefined))
  blockNumber?: string;

  @Expose()
  from!: string;

  @Expose()
  @Type(() => DecimalNumber)
  @Transform(({ value }) => numberToHex(value.toFixed(0)))
  gas!: string;

  @Expose()
  @Type(() => DecimalNumber)
  @Transform(({ value }) => numberToHex(value.toFixed(0)))
  gasPrice!: string;

  @Expose()
  hash!: string;

  @Expose()
  input!: string;

  @Expose()
  nonce!: string;

  @Expose()
  to!: string;

  @Expose()
  @Transform(({ value }) => (value ? numberToHex(value) : undefined))
  transactionIndex?: string;

  @Expose()
  @Type(() => DecimalNumber)
  @Transform(({ value }) => numberToHex(value.toFixed(0)))
  value!: string;

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
