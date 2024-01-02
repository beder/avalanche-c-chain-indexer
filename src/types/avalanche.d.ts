export declare namespace AvalancheTypes {
  interface Account {
    address: string;
    balance: string;
  }

  interface Block {
    baseFeePerGas: string;
    blockExtraData: string;
    blockGasCost: string;
    difficulty: string;
    extDataGasUsed: string;
    extDataHash: string;
    extraData: string;
    gasLimit: string;
    gasUsed: string;
    hash: string;
    logsBloom: string;
    miner: string;
    mixHash: string;
    nonce: string;
    number: string;
    parentHash: string;
    receiptsRoot: string;
    sha3Uncles: string;
    size: string;
    stateRoot: string;
    timestamp: string;
    totalDifficulty: string;
    transactions: Transaction[];
    transactionsRoot: string;
    uncles: string[];
  }

  interface Transaction {
    blockHash: string;
    blockNumber: string;
    from: string;
    gas: string;
    gasPrice: string;
    hash: string;
    input: string;
    nonce: string;
    to: string;
    transactionIndex: string;
    value: string;
    type: string;
    chainId: string;
    v: string;
    r: string;
    s: string;
  }
}
