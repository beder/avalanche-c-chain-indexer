import { cchain } from "../lib/avalanche";
import { AvalancheTypes } from "../types/avalanche";

export class Avalanche {
  async getBalance(address: string): Promise<string> {
    return this.callMethod("eth_getBalance", [address, "latest"]);
  }

  async getBlockByNumber(blockNumber: string): Promise<AvalancheTypes.Block> {
    return this.callMethod("eth_getBlockByNumber", [blockNumber, true]);
  }

  async getLatestBlockNumber(): Promise<string> {
    return this.callMethod("eth_blockNumber", []);
  }

  private async callMethod(method: string, params: any[]): Promise<any> {
    const response = await cchain.callMethod(method, params);

    return response.data.result;
  }
}
