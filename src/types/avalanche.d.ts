export declare namespace AvalancheTypes {
  interface Block {
    transactions: Transaction[];
  }

  interface Transaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    blockNumber: string;
    transactionIndex: string;
  }
}
