'use strict';

const ChainUtil = require('../chain-util');
//const { MINING_REWARD } = require('../config');
/*
{
id:"a123ewgt",
meta:{timestamp: Date.now(),
  block:"",
  address:"kbcj212ieq",
  type:"",
  network:"",
  signature:""},
data:{
  amount:9,
  from:"kbcj212ieq", 
  to:"12dfget",
  fee:0.0001,
  extra:""}
}
*/

class Transaction {
  constructor() {
    this.config = null;
    this.id = ChainUtil.id();
    this.meta = {};
    this.data = {};
  }

  setConfig(config){
    this.config = config;
  }
/*
  update(senderWallet, recipient, amount) {
    //const senderOutput = this.outputs.find(output => output.address === senderWallet.publicKey);

    if (amount > data.amount) {
      console.log(`Amount: ${amount} exceed the balance.`);
      return;
    }

    senderOutput.amount = senderOutput.amount - amount;
    this.outputs.push({ amount, address: recipient });
    Transaction.signTransaction(this, senderWallet);

    return this;
  }
*/
  static transactionWithData(senderWallet, data) {
    const transaction = new this();
    transaction.data = data;
    Transaction.signTransaction(transaction, senderWallet);
    return transaction;
  }

  static newTransaction(senderWallet, recipient, amount, fee, extra) {
    if (amount > senderWallet.balance) {
      console.log(`Amount: ${amount} exceeds balance.`);
      return;
    }

    return Transaction.transactionWithData(senderWallet, {
      amount:amount,
      from: senderWallet.publicKey,
      to:recipient,
      fee:fee,
      extra:extra
    });
  };

  static rewardTransaction(minerWallet, blockchainWallet, mining_reward) {
    return Transaction.transactionWithData(blockchainWallet, {
      amount: mining_reward, from:null, to: minerWallet.publicKey
    });
  };

  static signTransaction(transaction, senderWallet) {
    transaction.meta = {
      timestamp: Date.now(),
      address: senderWallet.publicKey,
      block:"",
      type:0,
      network:"",
      signature: senderWallet.sign(ChainUtil.hash(transaction.data))
    }
  }

  static verifyTransaction(transaction) {
    return ChainUtil.verifySignature(
      transaction.meta.address,
      transaction.meta.signature,
      ChainUtil.hash(transaction.data)
    )
  }
}

module.exports = Transaction;
