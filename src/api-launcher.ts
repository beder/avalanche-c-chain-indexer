import compression from "compression";
import express from "express";
import { ApiService } from "./services/api";
import { PrismaClient } from "@prisma/client";
import { AccountRepository } from "./repositories/account";
import { BlockRepository } from "./repositories/block";
import { TransactionRepository } from "./repositories/transaction";

const port = 3000;

const prisma = new PrismaClient();
const accountRepository = new AccountRepository(prisma);
const blockRepository = new BlockRepository(prisma);
const transactionRepository = new TransactionRepository(prisma);

const apiService = new ApiService(
  accountRepository,
  blockRepository,
  transactionRepository
);

const app = express();
app.use(compression());

app.get(
  "/addresses/top-by-balance",
  apiService.getTopAddresses.bind(apiService)
);
app.get(
  "/addresses/:address/transactions",
  apiService.listTransactions.bind(apiService)
);
app.get(
  "/addresses/:address/transaction-count",
  apiService.getTransactionCount.bind(apiService)
);
app.get("/blocks", apiService.listBlocks.bind(apiService));
app.get("/transactions", apiService.listTransactionsByValue.bind(apiService));

app.listen(port, () => {
  console.log(`API server is running on port ${port}`);
});
