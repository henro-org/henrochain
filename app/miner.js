'use strict';
const Wallet = require('../wallet');
const Transaction = require('../wallet/transaction');

class Miner {

  constructor(blockchain, transactionPool, wallet, p2pServer, config) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.p2pServer = p2pServer;
    this.config = config;
  }

  mine() {
    const validTransactions = this.transactionPool.validTransactions();
    // include a reward for the miner
    validTransactions.push(
      Transaction.rewardTransaction(this.wallet, Wallet.blockchainWallet(), this.config.get("MINING_REWARD"))
    );
    // create a block consisting of the valid transactions
    const block = this.blockchain.addBlock(validTransactions);

    // synchronize chains in the pper-to-peer server
    this.p2pServer.syncChains();

    // clear the transaction pool
    this.transactionPool.clear();

    // broadcast to every miner to clear their transaction pools
    this.p2pServer.broadcastClearTransactions();

    return block;
  }

}

module.exports = Miner;
