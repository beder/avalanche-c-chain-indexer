import { AvalancheService } from "./services/avalanche";
import { IndexerService } from "./services/indexer";
import { PrismaClient } from "@prisma/client";
import { QueueService } from "./services/queue";
import { TransactionRepository } from "./repositories/transaction";
import { AccountRepository } from "./repositories/account";

const avalanche = new AvalancheService();
const prisma = new PrismaClient();
const queue = new QueueService();
const accountRepository = new AccountRepository(prisma);
const transactionRepository = new TransactionRepository(prisma);

const indexer = new IndexerService(
  avalanche,
  accountRepository,
  transactionRepository,
  queue
);

indexer.startIndexing();

queue.processAccounts(indexer.processAccount.bind(indexer));
queue.processBlocks(indexer.processBlock.bind(indexer));
