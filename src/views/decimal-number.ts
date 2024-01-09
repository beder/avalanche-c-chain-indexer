import { Decimal } from "@prisma/client/runtime/library";

export class DecimalNumber extends Decimal {
  constructor(value = 0) {
    super(value);
  }
}
