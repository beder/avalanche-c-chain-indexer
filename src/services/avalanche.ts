import { cchain } from "../lib/avalanche";
import { AvalancheTypes } from "../types/avalanche";

export class Avalanche {
  async getBalance(address: string): Promise<string> {
    const response = await cchain.callMethod("eth_getBalance", [
      address,
      "latest",
    ]);

    return response.data.result;
  }

  async getBlockByNumber(blockNumber: string): Promise<AvalancheTypes.Block> {
    const response = await cchain.callMethod("eth_getBlockByNumber", [
      blockNumber,
      true,
    ]);

    return response.data.result;
  }

  async getLatestBlockNumber(): Promise<string> {
    const response = await cchain.callMethod("eth_blockNumber", []);

    return response.data.result;
  }
}
