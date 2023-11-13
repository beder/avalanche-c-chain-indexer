import { cchain } from "../lib/avalanche";

export class Avalanche {
  async getBalance(address: string) {
    const response = await cchain.callMethod("eth_getBalance", [
      address,
      "latest",
    ]);

    return response.data.result;
  }

  async getBlockByNumber(blockNumber: string) {
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
