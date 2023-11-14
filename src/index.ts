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
  "/transactions/:address",
  transactions.listTransactions.bind(transactions)
);
app.get(
  "/transaction-count/:address",
  transactions.getTransactionCount.bind(transactions)
);
app.get(
  "/transactions-by-value",
  transactions.listTransactionsByValue.bind(transactions)
);
app.get("/top-addresses", transactions.getTopAddresses.bind(transactions));

indexer.startIndexing();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
