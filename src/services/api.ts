// src/services/transactions.ts
import { Request, Response } from "express";
import { Account, Transaction } from "@prisma/client";
import { numberToHex } from "web3-utils";
import { AccountRepository } from "../repositories/account";
import { TransactionRepository } from "../repositories/transaction";
import { RepositoryTypes } from "../types/repository";

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

    const pagination = this.getPagination(req);

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
    const pagination = this.getPagination(req);

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

  private getPagination(req: Request): RepositoryTypes.Pagination {
    const { cursor, pageSize, direction } = req.query;

    return {
      ...(cursor && { cursor: String(cursor) }),
      ...(pageSize && { pageSize: Number(pageSize) }),
      ...(cursor &&
        direction && {
          direction: direction === "backward" ? "backward" : "forward",
        }),
    };
  }
}
