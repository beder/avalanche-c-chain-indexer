import { DecimalNumber } from "./decimal-number";
import { Expose, Transform, Type } from "class-transformer";
import { numberToHex } from "web3-utils";

class Block {
  @Expose()
  @Type(() => DecimalNumber)
  @Transform(({ value }) => numberToHex(value.toFixed(0)))
  baseFeePerGas!: string;

  @Expose()
  blockExtraData!: string;

  @Expose()
  @Type(() => DecimalNumber)
  @Transform(({ value }) => numberToHex(value.toFixed(0)))
  blockGasCost!: string;

  @Expose()
  @Type(() => DecimalNumber)
  @Transform(({ value }) => numberToHex(value.toFixed(0)))
  difficulty!: string;

  @Expose()
  @Type(() => DecimalNumber)
  @Transform(({ value }) => numberToHex(value.toFixed(0)))
  extDataGasUsed!: string;

  @Expose()
  extDataHash!: string;

  @Expose()
  extraData!: string;

  @Expose()
  @Type(() => DecimalNumber)
  @Transform(({ value }) => numberToHex(value.toFixed(0)))
  gasLimit!: string;

  @Expose()
  @Type(() => DecimalNumber)
  @Transform(({ value }) => numberToHex(value.toFixed(0)))
  gasUsed!: string;

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
  @Transform(({ value }) => numberToHex(value))
  number!: string;

  @Expose()
  parentHash!: string;

  @Expose()
  receiptsRoot!: string;

  @Expose()
  sha3Uncles!: string;

  @Expose()
  @Type(() => DecimalNumber)
  @Transform(({ value }) => numberToHex(value))
  size!: string;

  @Expose()
  stateRoot!: string;

  @Expose()
  @Transform(({ value }) => numberToHex(Math.floor(value.getTime() / 1000)))
  timestamp!: string;

  @Expose()
  @Type(() => DecimalNumber)
  @Transform(({ value }) => numberToHex(value.toFixed(0)))
  totalDifficulty!: string;

  @Expose()
  transactionsRoot!: string;
}

export { Block };
