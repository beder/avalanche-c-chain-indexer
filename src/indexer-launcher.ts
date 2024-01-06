import "@abraham/reflection";
import { container } from "./inversify.config";
import { IndexerService } from "./services/indexer";

const indexer = container.get(IndexerService);

indexer.startIndexing();
