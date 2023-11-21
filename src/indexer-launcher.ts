import { AvalancheService } from "./services/avalanche";
import { IndexerService } from "./services/indexer";
import { PrismaClient } from "@prisma/client";
import { QueueService } from "./services/queue";

const avalanche = new AvalancheService();
const prisma = new PrismaClient();
const queue = new QueueService();
const indexer = new IndexerService(avalanche, prisma, queue);

indexer.startIndexing();

queue.processAccounts(indexer.processAccount.bind(indexer));
queue.processBlocks(indexer.processBlock.bind(indexer));
