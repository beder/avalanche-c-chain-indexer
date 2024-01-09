import { Account, Block, Transaction } from "../views";
import { Request, Response } from "express";
import { AccountRepository } from "../repositories/account";
import { BlockRepository } from "../repositories/block";
import { plainToInstance } from "class-transformer";
import { TransactionRepository } from "../repositories/transaction";
import { RepositoryTypes } from "../types/repository";
import { injectable } from "inversify";

@injectable()
export class ApiService {
  private accountRepository: AccountRepository;
  private blockRepository: BlockRepository;
  private transactionRepository: TransactionRepository;

  constructor(
    accountRepository: AccountRepository,
    blockRepository: BlockRepository,
    transactionRepository: TransactionRepository
  ) {
    this.accountRepository = accountRepository;
    this.blockRepository = blockRepository;
    this.transactionRepository = transactionRepository;
  }

  async listTransactions(req: Request, res: Response) {
    const { address } = req.params;

    const pagination = this.getPagination(req);

    const transactions = await this.transactionRepository.listByAddress(
      address,
      pagination
    );

    res.json(plainToInstance(Transaction, transactions));
  }

  async getTransactionCount(req: Request, res: Response) {
    const { address } = req.params;

    const count = await this.transactionRepository.getCountByAddress(address);

    res.json({ count });
  }

  async listBlocks(req: Request, res: Response) {
    const pagination = this.getPagination(req);

    const blocks = await this.blockRepository.list(pagination);

    res.json(plainToInstance(Block, blocks));
  }

  async listTransactionsByValue(req: Request, res: Response) {
    const pagination = this.getPagination(req);

    const transactions = await this.transactionRepository.listByValue(
      pagination
    );

    res.json(plainToInstance(Transaction, transactions));
  }

  async getTopAddresses(_req: Request, res: Response) {
    const addresses = await this.accountRepository.listTop();

    res.json(plainToInstance(Account, addresses));
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
