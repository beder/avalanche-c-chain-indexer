export declare namespace AvalancheTypes {
  interface Account {
    address: string;
    balance: string;
  }

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
