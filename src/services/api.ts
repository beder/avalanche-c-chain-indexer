// src/services/transactions.ts
import { Request, Response } from "express";
import { Account, Transaction } from "@prisma/client";
import { numberToHex } from "web3-utils";
import { AccountRepository } from "../repositories/account";
import { TransactionRepository } from "../repositories/transaction";

export class ApiService {
  private accountRepository: AccountRepository;
  private transactionRepository: TransactionRepository;

  constructor(
    accountRepository: AccountRepository,
    transactionRepository: TransactionRepository
  ) {
    this.accountRepository = accountRepository;
    this.transactionRepository = transactionRepository;
  }

  async listTransactions(req: Request, res: Response) {
    const { address } = req.params;

    const pagination = this.getPaginationParams(req);

    const transactions = await this.transactionRepository.listByAddress(
      address,
      pagination
    );

    res.json(transactions.map(this.formatTransaction));
  }

  async getTransactionCount(req: Request, res: Response) {
    const { address } = req.params;

    const count = await this.transactionRepository.getCountByAddress(address);

    res.json({ count });
  }

  async listTransactionsByValue(req: Request, res: Response) {
    const pagination = this.getPaginationParams(req);

    const transactions = await this.transactionRepository.listByValue(
      pagination
    );

    res.json(transactions.map(this.formatTransaction));
  }

  async getTopAddresses(req: Request, res: Response) {
    const addresses = await this.accountRepository.listTop();

    res.json(addresses.map(this.formatAddress));
  }

  private formatAddress(address: Account) {
    const { id, ...rest } = address;

    return {
      ...rest,
      balance: numberToHex(address.balance.toFixed(0)),
    };
  }

  private formatTransaction(tx: Transaction) {
    const { id, ...rest } = tx;

    return {
      ...rest,
      blockNumber: numberToHex(tx.blockNumber),
      transactionIndex: numberToHex(tx.transactionIndex),
      value: numberToHex(tx.value.toFixed(0)),
    };
  }

  private getPaginationParams(req: Request) {
    const { cursor, pageSize, direction } = req.query;

    const take = pageSize ? Number(pageSize) : 1000;

    const validatedDirection = ["forward", "backward"].includes(
      direction as string
    )
      ? (direction as "backward" | "forward")
      : "forward";

    return {
      cursor: cursor as string,
      pageSize: take,
      direction: validatedDirection,
    };
  }
}
