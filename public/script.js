let AR_TO_USD = 0;
const lastDonationElement = document.getElementById('last-donation');
const ws = new WebSocket(`ws://localhost:${window.location.port}`);

const titleElement = document.querySelector('.notification-title');
const amountElement = document.querySelector('.notification-amount');
const fromElement = document.querySelector('.notification-from');
// const timestampElement = document.querySelector('.notification-timestamp');

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Reciente';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

function formatArAmount(amount) {
  const num = parseFloat(amount);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
}

function calculateUsdValue(arAmount) {
  const arNum = parseFloat(arAmount);
  if (isNaN(arNum) || AR_TO_USD === 0) return '';

  const usdValue = arNum * AR_TO_USD;
  return `≈ $${usdValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} USD`;
}

async function updateUI(data) {
  if (!data) {
    titleElement.textContent = 'No tips yet. Send one! 💸';
    amountElement.innerHTML = '0 <span class="ar-symbol">AR</span>';
    fromElement.textContent = 'Send your first tip';
    // timestampElement.textContent = '';
    return;
  }

  await updateExchangeRate();

  const formattedAmount = formatArAmount(data.amount);
  const usdValue = calculateUsdValue(data.amount);

  titleElement.textContent = 'Last tip received 👏';
  amountElement.innerHTML = `
    <div class="amount-container">
      <span class="ar-amount">${formattedAmount}</span>
      <span class="ar-symbol">AR</span>
    </div>
    <div class="usd-value">${usdValue}</div>
  `;
  fromElement.textContent = `From: ${data.from.slice(0, 22)}... 🟢`;
  // timestampElement.textContent = formatTimestamp(data.timestamp);

  lastDonationElement.classList.remove('update-animation');
  void lastDonationElement.offsetWidth;
  lastDonationElement.classList.add('update-animation');
}

// Function to update the AR/USD exchange rate
async function updateExchangeRate() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd');
    const data = await response.json();
    if (data.arweave?.usd) {
      AR_TO_USD = data.arweave.usd;
      console.log('Updated exchange rate:', AR_TO_USD);
    }
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    // If it fails, you can use a default value
    AR_TO_USD = AR_TO_USD || 5; // Example value
  }
}

async function loadInitialData() {
  try {
    const response = await fetch('/last-donation');
    const data = await response.json();
    await updateExchangeRate();
    updateUI(data);
  } catch (error) {
    console.error('Error loading initial data:', error);
  }
}

ws.onopen = () => {
  console.log('✅ Connected to WebSocket server');
  loadInitialData();
};

ws.onmessage = async (event) => {
  try {
    const msg = JSON.parse(event.data);
    if (msg.type === 'tip') {
      await updateExchangeRate();
      updateUI(msg.data);
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
};

setInterval(updateExchangeRate, 3600000);

updateExchangeRate();