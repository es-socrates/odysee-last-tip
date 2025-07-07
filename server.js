require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const axios = require('axios');
const wss = new WebSocket.Server({ noServer: true });

const app = express();
const PORT = process.env.PORT || 3001;
const YOUR_AR_ADDRESS = process.env.WALLET_ADDRESS;

if (!YOUR_AR_ADDRESS) {
  console.error('❌ ERROR: WALLET_ADDRESS is missing in .env');
  process.exit(1);
}

const ARWEAVE_GATEWAY = 'https://arweave.net';
let lastDonation = null;

async function getEnhancedTransactions(address) {
  try {
    const graphqlResponse = await axios.post(`${ARWEAVE_GATEWAY}/graphql`, {
      query: `
        query {
          transactions(
            recipients: ["${address}"]
            first: 100
            sort: HEIGHT_DESC
          ) {
            edges {
              node {
                id
                owner { address }
                quantity { ar }
                block { timestamp }
                tags { name value }
              }
            }
          }
        }
      `
    }, {
      timeout: 15000
    });

    if (graphqlResponse.data?.data?.transactions?.edges) {
      return graphqlResponse.data.data.transactions.edges.map(edge => ({
        id: edge.node.id,
        owner: edge.node.owner.address,
        amount: edge.node.quantity.ar,
        timestamp: edge.node.block?.timestamp,
        tags: edge.node.tags
      }));
    }

    console.log('⚠️ Using REST API as a fallback');
    const restResponse = await axios.get(`${ARWEAVE_GATEWAY}/tx/history/${address}`, {
      timeout: 15000
    });

    if (Array.isArray(restResponse.data)) {
      return restResponse.data
        .filter(tx => tx.target === address)
        .map(tx => ({
          id: tx.txid,
          owner: tx.owner,
          amount: tx.quantity / 1e12,
          timestamp: tx.block_timestamp
        }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    return [];
  }
}

async function findLatestDonation() {
  const transactions = await getEnhancedTransactions(YOUR_AR_ADDRESS);
  
  if (transactions.length === 0) {
    console.log('ℹ️ No transactions found for address');
    return null;
  }

  const sortedTxs = transactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  for (const tx of sortedTxs) {
    const amount = Number(tx.amount);
    
    if (!isNaN(amount) && amount > 0) {
      console.log(`✅ Found valid deposit: ${amount} AR from ${tx.owner.slice(0, 6)}...`);
      return {
        from: tx.owner,
        amount: amount.toString(),
        txId: tx.id,
        timestamp: tx.timestamp
      };
    }
  }

  return null;
}

function shouldUpdateDonation(newDonation) {
  if (!lastDonation) return true;
  return newDonation.txId !== lastDonation.txId;
}

async function updateLatestDonation() {
  const donation = await findLatestDonation();
  if (donation && shouldUpdateDonation(donation)) {
    lastDonation = donation;
    notifyFrontend(donation);
  }
}

function notifyFrontend(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'tip',
        data: {
          from: data.from,
          amount: data.amount,
          txId: data.txId,
          timestamp: data.timestamp
        }
      }));
    }
  });
}

// Endpoints
app.get('/last-donation', (_req, res) => {
  res.json(lastDonation || { message: "No deposit found" });
});

app.get('/refresh', async (_req, res) => {
  await updateLatestDonation();
  res.json({ success: true, lastDonation });
});

app.use(express.static('public'));

const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`👛 Monitoring address: ${YOUR_AR_ADDRESS}`);
  
  await updateLatestDonation();
  setInterval(updateLatestDonation, 60000); // Check every minute
});

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, ws => {
    wss.emit('connection', ws, req);
  });
});