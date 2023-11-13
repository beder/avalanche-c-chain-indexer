import { Indexer } from "./services/indexer";

async function startTransactionTracking() {
  const indexer = new Indexer();

  console.log("Starting indexer...");

  await indexer.startIndexing();
}

startTransactionTracking();
