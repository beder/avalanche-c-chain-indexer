import { AvalancheService } from "./avalanche";
import { injectable } from "inversify";
import { numberToHex } from "web3-utils";
import { QueueService } from "./queue";
import { QueueTypes } from "../types/queue";
import { BlockRepository } from "../repositories/block";

@injectable()
export class BlockService {
  private avalanche: AvalancheService;
  private blockRepository: BlockRepository;
  private queue: QueueService;

  private batchSize = Number(process.env.INDEXER_BATCH_SIZE || 100);

  constructor(
    avalanche: AvalancheService,
    blockRepository: BlockRepository,
    queue: QueueService
  ) {
    this.avalanche = avalanche;
    this.blockRepository = blockRepository;
    this.queue = queue;
  }

  getCount() {
    return this.blockRepository.getCount();
  }

  private async getMissingBlockNumbers(limit: number) {
    if (limit <= 0) {
      return [];
    }

    const minIndexedBlockNumber =
      await this.blockRepository.getLowestBlockNumber();

    return Array.from(
      {
        length: Math.min(limit, Number(minIndexedBlockNumber - BigInt(1))),
      },
      (_, i) => minIndexedBlockNumber - BigInt(i) - BigInt(1)
    );
  }

  private async getNewBlockNumbers(blockNumber: bigint) {
    if (await this.blockRepository.exists(blockNumber)) {
      return [];
    }

    const maxIndexedBlockNumber =
      await this.blockRepository.getHighestBlockNumber();

    return Array.from(
      {
        length: Math.min(
          this.batchSize,
          Number(blockNumber - maxIndexedBlockNumber)
        ),
      },
      (_, i) => blockNumber - BigInt(i)
    );
  }

  private async indexBlock(blockNumber: number) {
    const block = await this.avalanche.getBlockByNumber(
      numberToHex(blockNumber)
    );

    await this.blockRepository.createOrUpdate(block);

    const addresses = new Set<string>();

    block.transactions.forEach((tx) => {
      addresses.add(tx.from);
      addresses.add(tx.to);
    });

    await Promise.all(
      Array.from(addresses)
        .filter(Boolean)
        .map(async (address) => this.queue.indexAccount({ address }))
    );
  }

  async indexBlocks() {
    const blockNumber = BigInt(await this.avalanche.getLatestBlockNumber());

    const newBlockNumbers = await this.getNewBlockNumbers(blockNumber);

    const missingBlockNumbers = await this.getMissingBlockNumbers(
      this.batchSize - newBlockNumbers.length
    );

    const blockNumbers = [...newBlockNumbers, ...missingBlockNumbers];

    await Promise.all(
      blockNumbers.map(async (blockNumber) => {
        await this.queue.indexBlock({ blockNumber: Number(blockNumber) });
      })
    );
  }

  async processBlock(job: QueueTypes.BlockJob) {
    const { blockNumber } = job.data;

    try {
      await this.indexBlock(blockNumber);
    } catch (err) {
      console.error("Error indexing block", err);
    }
  }
}
