import "@abraham/reflection";
import compression from "compression";
import { container } from "./inversify.config";
import express from "express";
import { ApiService } from "./services/api";

const port = 3000;

const apiService = container.get(ApiService);

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
