// src/index.ts
import express from "express";
import { Avalanche } from "./services/avalanche";
import { Transactions } from "./services/transactions";
import { Indexer } from "./services/indexer";
import { PrismaClient } from "@prisma/client";

const app = express();
const port = 3000;

const avalanche = new Avalanche();
const prisma = new PrismaClient();

const transactions = new Transactions(prisma);
const indexer = new Indexer(avalanche, prisma);

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

indexer.startIndexing();

app.listen(port, () => {
  console.log(`API server is running on port ${port}`);
});
