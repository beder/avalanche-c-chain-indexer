import { AccountRepository } from "./repositories/account";
import { AccountService } from "./services/account";
import { ApiService } from "./services/api";
import { AvalancheService } from "./services/avalanche";
import { BlockRepository } from "./repositories/block";
import { BlockService } from "./services/block";
import { Container } from "inversify";
import { IndexerService } from "./services/indexer";
import { PrismaClient } from "@prisma/client";
import { QueueService } from "./services/queue";
import { TransactionRepository } from "./repositories/transaction";

const container = new Container({ defaultScope: "Singleton" });

container.bind(AccountRepository).toSelf();
container.bind(AccountService).toSelf();
container.bind(ApiService).toSelf();
container.bind(AvalancheService).toSelf();
container.bind(BlockRepository).toSelf();
container.bind(BlockService).toSelf();
container.bind(IndexerService).toSelf();
container.bind(PrismaClient).toDynamicValue(() => new PrismaClient());
container.bind(QueueService).toSelf();
container.bind(TransactionRepository).toSelf();

export { container };
