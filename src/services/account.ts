import { AvalancheService } from "./avalanche";
import { injectable } from "inversify";
import { QueueTypes } from "../types/queue";
import { AccountRepository } from "../repositories/account";

@injectable()
export class AccountService {
  private avalanche: AvalancheService;
  private accountRepository: AccountRepository;

  constructor(
    avalanche: AvalancheService,
    accountRepository: AccountRepository
  ) {
    this.avalanche = avalanche;
    this.accountRepository = accountRepository;
  }

  getCount() {
    return this.accountRepository.getCount();
  }

  async indexAccount(address: string) {
    const balance = await this.avalanche.getBalance(address);

    await this.accountRepository.createOrUpdate({ address, balance });
  }

  async processAccount(job: QueueTypes.AccountJob) {
    const { address } = job.data;

    try {
      await this.indexAccount(address);
    } catch (err) {
      console.error("Error indexing account", err);
    }
  }
}
