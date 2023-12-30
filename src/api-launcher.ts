import compression from "compression";
import express from "express";
import { ApiService } from "./services/api";
import { PrismaClient } from "@prisma/client";
import { AccountRepository } from "./repositories/account";
import { TransactionRepository } from "./repositories/transaction";

const port = 3000;

const prisma = new PrismaClient();
const accountRepository = new AccountRepository(prisma);
const transactionRepository = new TransactionRepository(prisma);

const transactions = new ApiService(accountRepository, transactionRepository);

const app = express();
app.use(compression());

app.get(
  "/addresses/top-by-balance",
  transactions.getTopAddresses.bind(transactions)
);
app.get(
  "/addresses/:address/transactions",
  transactions.listTransactions.bind(transactions)
);
app.get(
  "/addresses/:address/transaction-count",
  transactions.getTransactionCount.bind(transactions)
);
app.get(
  "/transactions",
  transactions.listTransactionsByValue.bind(transactions)
);

app.listen(port, () => {
  console.log(`API server is running on port ${port}`);
});
