import { DecimalNumber } from "./decimal-number";
import { Expose, Transform, Type } from "class-transformer";
import { numberToHex } from "web3-utils";

class Account {
  @Expose()
  address!: string;

  @Expose()
  @Type(() => DecimalNumber)
  @Transform(({ value }) => numberToHex(value.toFixed(0)))
  balance!: string;
}

export { Account };
