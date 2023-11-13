import { Avalanche } from "./avalanche";
import { toHex } from "web3-utils";

export class Indexer {
  avalanche = new Avalanche();

  database = new Map();

  async startIndexing() {
    try {
      setInterval(async () => {
        await this.indexAvalanche();
        console.log("Indexing Avalanche...");
      }, 10000); // Index transactions every 1 minute
    } catch (err) {
      console.error("Error indexing Avalanche", err);
    }
  }

  async indexAvalanche() {
    try {
      const latestBlockNumber = await this.avalanche.getLatestBlockNumber();

      console.log("Latest block number:", latestBlockNumber);

      console.log("Indexing blocks...");

      await this.indexBlocks(latestBlockNumber);

      console.log("Block count:", this.database.get("blocks").size);
      console.log("Transaction count:", this.database.get("transactions").size);
      console.log("Account count:", this.database.get("accounts").size);
    } catch (err) {
      console.error("Error indexing transaction", err);
    }
  }

  async indexBlocks(blockNumber: string) {
    //
    // Check if block is already indexed. If so, return.
    // If not, index the block and add it and any blocks with a lower number to the database.
    // blockNumber is in hex format, so convert it to a number.
    //
    const blocks = this.database.get("blocks") || new Map();

    if (blocks.has(blockNumber)) {
      console.log(`Block ${blockNumber} already indexed.`);

      return;
    }

    if (blocks.size === 0) {
      await this.indexBlock(blockNumber);

      return;
    }

    let key = parseInt(blockNumber, 16);

    while (!blocks.has(toHex(key - 1))) {
      console.log(`Block ${toHex(key - 1)} not indexed yet.`);

      key--;
    }

    for (let i = key; i <= parseInt(blockNumber, 16); i++) {
      const indexedBlockNumber = toHex(i);

      await this.indexBlock(indexedBlockNumber);
    }
  }

  async indexBlock(blockNumber: string) {
    const blocks = this.database.get("blocks") || new Map();

    const block = await this.avalanche.getBlockByNumber(blockNumber);

    console.log("Indexed block:", blockNumber);

    blocks.set(blockNumber, blockNumber);

    await this.indexTransactions(block.transactions);

    const addresses = new Set<string>();

    block.transactions.forEach((tx: any) => {
      addresses.add(tx.from);
      addresses.add(tx.to);
    });

    await this.indexAccounts(Array.from(addresses));

    this.database.set("blocks", blocks);
  }

  async indexTransactions(transactions: any[]) {
    const txs = this.database.get("transactions") || new Map();

    transactions.forEach((tx) => {
      console.log("Indexed transaction:", tx.hash);

      txs.set(tx.hash, tx);
    });

    this.database.set("transactions", txs);
  }

  async indexAccounts(addresses: string[]) {
    const accounts = this.database.get("accounts") || new Map();

    addresses.forEach(async (address) => {
      const balance = await this.avalanche.getBalance(address);

      console.log(`Balance of ${address}:`, balance);

      accounts.set(address, balance);
    });

    this.database.set("accounts", accounts);
  }
}
