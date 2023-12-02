'use strict';
const { Blockchain, Block, Transaction } = require('./src/blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const prompt = require('prompt-sync')();
const express = require('express');
const app = express();
const request = require('request');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const users = [
  {
    oppositeIP: 'http://localhost:2222',
    dbUrl: 'mongodb://localhost:27017/crypto',
    myPort: 1111,
    privateKey:
      '7c4c45907dec40c91bab3480c39032e90049f1a44f3e18c3e07c23e3273995cf',
  },
  {
    oppositeIP: 'http://localhost:1111',
    dbUrl: 'mongodb://localhost:27017/crypto_2',
    myPort: 2222,
    privateKey:
      'ab1743698628cfec5de5936c98c3ea4935c03d5f71a39901a2e86ece4c8a31d8',
  },
];
let userID = -1;

// Get blockchain from storage and construct it
const coin = new Blockchain();
coin.constructBlockchain();

// Choose user
console.log('Please choose user:');
console.log('1. User_1');
console.log('2. User_2');
const option = prompt('Enter an option: ');
if (Number(option) === 1) {
  userID = 0;
  console.log('Logged in to user 1.');
} else if (Number(option) === 2) {
  userID = 1;
  console.log('Logged in to user 2.');
}

// Connect mongoDB
mongoose
  .connect(users[userID].dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(
    async () => {
      console.log('DB connected');
      await sleep(500);
    },
    (err) => {
      console.log('DB connection error:' + err);
    }
  );

// Listen to port
const portNumber = users[userID].myPort;
app.listen(portNumber, function () {
  console.log('Listening on port ' + portNumber);
});

// App use
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function (req, res, next) {
  if (req.headers['content-type'] === 'application/json;') {
    req.headers['content-type'] = 'application/json';
  }
  next();
});

// Post current block.
const data = {
  url: users[userID].oppositeIP + '/postcurrentblock',
  json: true,
  body: { value: coin.getLatestBlock() },
};
request.post(data, async function (error, response, body) {
  console.log('Post current block to peers: Success');
  if (!error && response.statusCode === 200) {
    const blockchainFromPeer = response.body;
    if (
      blockchainFromPeer != null &&
      coin.chain.length < blockchainFromPeer.length
    ) {
      console.log('Synchronising blockchain...');
      await coin.blockchainJSONToDB(blockchainFromPeer);
      await coin.constructBlockchain();
      console.log('Synchronised blockchain...');
    }
  }
});

// receive current block POST
app.post(
  '/postcurrentblock',
  express.urlencoded({ extended: true }),
  async (req, res, next) => {
    try {
      console.log('Receive post current block: Success');
      const blockFromPeer = req.body;
      if (blockFromPeer.hash !== coin.getLatestBlock().hash) {
        return res.status(200).send(JSON.stringify(coin.chain));
      }
      return res.status(200);
    } catch (err) {
      console.log(err);
      return res.sendStatus(500);
    }
  }
);

// receive mined block from peer
app.post(
  '/postminedblock',
  express.urlencoded({ extended: true }),
  async (req, res, next) => {
    console.log('Received Peer mined block.');
    try {
      const block = req.body;

      // Put transactions to blockObj and DB.
      const transactiions = block.transactions;
      const transactiionObjArray = [];
      for (let i = 0; i < transactiions.length; i++) {
        const transactionObj = new Transaction(
          transactiions[i].fromAddress,
          transactiions[i].toAddress,
          transactiions[i].amount
        );
        transactionObj.setTimestamp(transactiions[i].timestamp);
        if (transactiions[i].signature != null) {
          transactionObj.signature = transactiions[i].signature;
        }
        if (transactionObj != null) {
          transactiionObjArray.push(transactionObj);
          transactionObj.saveTransactionToDB();
        }
      }

      // Create Block object
      const blockObj = new Block(
        block.timestamp,
        transactiionObjArray,
        block.previousBlockHash
      );
      blockObj.setIndex(block.index);
      blockObj.setDifficulty(block.difficulty);
      blockObj.setNonce(block.nonce);
      blockObj.setRoot(block.root);

      console.log(
        'Can you push the chain? ' + blockObj.previousBlockHash ===
          coin.getLatestBlock().hash
      );
      console.log(
        'PreviousBlockHash of BlockObj: ' +
          blockObj.previousBlockHash +
          'Current Block Hash: ' +
          coin.getLatestBlock().hash
      );
      if (blockObj.previousBlockHash === coin.getLatestBlock().hash) {
        coin.chain.push(blockObj);
        blockObj.saveBlockToDB();
      }
      return res.status(200);
    } catch (err) {
      console.log(err);
      return res.sendStatus(500);
    }
  }
);

async function main() {
  await sleep(1000);

  let isPromptDone = false;
  let option = '';
  let option2 = '';
  let targetAddress = '';
  let transferCost = '';

  // Your private key goes here
  const myKey = ec.keyFromPrivate(users[userID].privateKey);

  // From that we can calculate your public key (which doubles as your wallet address)
  const myWalletAddress = myKey.getPublic('hex');
  console.log(myWalletAddress);

  while (isPromptDone === false) {
    console.clear();
    // Print main menu
    console.log('Wecome to NodeJS Blockchain Node Demo!!');
    console.log('Wallet Address: ' + myWalletAddress);
    console.log('Mining difficulty: ' + coin.getLatestBlock().difficulty);
    console.log('Current Mining Reward: ' + coin.miningReward);
    console.log(
      'Current Wallet Balance: ' + coin.getBalanceOfAddress(myWalletAddress)
    );
    console.log('Latest Block Index: ' + coin.getLatestBlock().index);
    console.log('My Port:' + users[userID].myPort);

    console.log('==============');
    console.log('Select an action:');
    console.log('1: Show the Whole Blockchain list');
    console.log('2: Show Block Data of Specified Block in the Blockchain');
    console.log('3: Show a Transaction list in a block');
    console.log('4: Create Transaction');
    console.log('5: Show UTXO Pool');
    console.log('6. Mine Block');
    console.log('7. Check networking update');
    console.log('8. Print Neighbor List');
    console.log('0. Exit');

    option = prompt('Enter an option: ');

    if (Number(option) === 0) {
      console.clear();
      console.log('Goodbye! Run node main.js to restart program.');

      isPromptDone = true;
    } else if (Number(option) === 1) {
      console.clear();
      console.log(coin.chain);
      option2 = prompt('Press enter to exit');
    } else if (Number(option) === 2) {
      console.clear();
      option2 = prompt('Enter a block index to check its block data: ');
      console.log(coin.chain[option2]);
      option2 = prompt('Press enter to exit');
    } else if (Number(option) === 3) {
      console.clear();
      option2 = prompt('Enter a block index to check its transaction list: ');
      console.log(coin.chain[option2].transactions);
      option2 = prompt('Press enter to exit');
    } else if (Number(option) === 4) {
      console.clear();

      targetAddress = prompt('Enter sender address: ');
      transferCost = prompt('Enter money to transfer: ');
      const tx1 = new Transaction(
        myWalletAddress,
        targetAddress,
        Number(transferCost)
      );
      tx1.signTransaction(myKey);
      coin.addTransaction(tx1);

      console.log(
        'Transaction added to UTXO. Mine a block to execute the transaction.'
      );
      option2 = prompt('Press enter to exit');
    } else if (Number(option) === 5) {
      console.clear();
      console.log(coin.pendingTransactions);
      option2 = prompt('Press enter to exit');
    } else if (Number(option) === 6) {
      console.clear();
      console.log('Mining block to address ' + myWalletAddress + '...');
      await coin.minePendingTransactions(myWalletAddress);
      console.log('Block mined to address ' + myWalletAddress + ' !');

      // Post a mined block to peers
      const data = {
        url: users[userID].oppositeIP + '/postminedblock',
        json: true,
        body: coin.getLatestBlock(),
      };
      console.log(data.body);
      request.post(data, function (error, response, body) {
        console.log('Post mined block to peers: Success');
        if (!error && response.statusCode === 200) {
          console.log('Peer receive mined block: Success');
        }
      });
      await sleep(1000);
      option2 = prompt('Press enter to exit');
    } else if (Number(option) === 7) {
      console.clear();
      console.log('Check networking update:');
      await sleep(2000);
      option2 = prompt('Press enter to exit');
    } else if (Number(option) === 8) {
      console.clear();
      await sleep(1000);
      option2 = prompt('Press enter to exit');
    }
  }
  process.exit();
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

main();
