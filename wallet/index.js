'use strict';

//const { INITIAL_BALANCE } = require('../config');
const ChainUtil = require('../chain-util');
const Transaction = require('./transaction');

class Wallet {
  constructor(config) {
    this.config = config;
    this.balance = config.get("INITIAL_BALANCE");
    this.keyPair = ChainUtil.genKeyPair();
    this.publicKey = this.keyPair.getPublic().encode('hex');
  }

  setConfig(config) {
    this.config = config;
  }

  toString() {
    return `Wallet -
        publicKey: ${this.publicKey.toString()}
        balance: ${this.balance}`
  }

  sign(dataHash) {
    return this.keyPair.sign(dataHash);
  }

  createTransaction(recipient, amount, blockchain, transactionPool, extra) {

    this.balance = this.calculateBalance(blockchain);

    if (amount > this.balance) {
      console.log(`Amount: ${amount} exceds current balance: ${this.balance}`)
      return;
    }

    let transaction = transactionPool.existingTransaction(this.publicKey);
    if (transaction) {
      transaction.update(this, recipient, amount);
    } else {
      transaction = Transaction.newTransaction(this, recipient, amount, extra);
      transactionPool.updateOrAddTransaction(transaction);
    }

    return transaction;
  }

  calculateBalance(blockchain) {
    let balance = this.balance;
    let transactions = [];
    blockchain.chain.forEach(block => {
      block.data.forEach(transaction => {
        transactions.push(transaction);
      });
    });

    let startTime = 0;
    const walletInputTxs = transactions.filter(transaction => transaction.input.address === this.publicKey);

    if (walletInputTxs.length) {
      const recentInputTx = walletInputTxs
        .reduce((prev, current) => prev.input.timestamp > current.input.timestamp ? prev : current);

      balance = recentInputTx.outputs.find(output => output.address === this.publicKey).amount;
      startTime = recentInputTx.input.timestamp;
    }

    transactions.forEach(transaction => {
      if (transaction.input.timestamp > startTime) {
        transaction.outputs.find(output => {
          if (output.address === this.publicKey) {
            balance += output.amount;
          }
        })
      }
    });

    return balance;
  }

  static blockchainWallet() {
    const blockchainWallet = new this();
    blockchainWallet.address = 'blockchain-wallet';
    return blockchainWallet;
  }

}

module.exports = Wallet;
