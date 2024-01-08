import { Block } from "../dtos/block";
import { cchain } from "../lib/avalanche";
import { injectable } from "inversify";
import { plainToInstance } from "class-transformer";

@injectable()
export class AvalancheService {
  async getBalance(address: string): Promise<string> {
    return this.callMethod("eth_getBalance", [address, "latest"]);
  }

  async getBlockByNumber(blockNumber: string): Promise<Block> {
    const block = await this.callMethod("eth_getBlockByNumber", [
      blockNumber,
      true,
    ]);

    return plainToInstance(Block, block, {
      excludeExtraneousValues: true,
    });
  }

  async getLatestBlockNumber(): Promise<string> {
    return this.callMethod("eth_blockNumber", []);
  }

  private async callMethod(method: string, params: any[]): Promise<any> {
    const response = await cchain.callMethod(method, params);

    return response.data.result;
  }
}
