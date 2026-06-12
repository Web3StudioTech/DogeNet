/**
 * check_balances.js
 *
 * Reads RAW pasted content from input.txt (can include item numbers,
 * commas, quotes, CSV formatting, etc.) and automatically extracts
 * only valid-looking Dogecoin addresses using a regex pattern.
 *
 * Then checks each address's balance using the dogechain.info public API
 * and prints / saves only addresses with balance > 50 DOGE.
 *
 * USAGE:
 *   1. Paste your raw list (with or without numbering/quotes/commas)
 *      into input.txt
 *   2. node check_balances.js
 *
 * REQUIREMENTS:
 *   - Node.js 18+ (has built-in fetch)
 *
 * NOTE:
 *   dogechain.info is a free public API with rate limits. This script
 *   adds a small delay between requests to avoid getting blocked.
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'input.txt');
const OUTPUT_FILE = path.join(__dirname, 'addresses_above_50_doge.csv');
const THRESHOLD = 50; // DOGE
const DELAY_MS = 600; // delay between requests to be polite to the API

// Dogecoin addresses: start with 'D', followed by 33 base58 chars
// (base58 = letters/digits except 0, O, I, l)
const DOGE_ADDRESS_REGEX = /\bD[1-9A-HJ-NP-Za-km-z]{33}\b/g;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractAddresses(rawText) {
  const matches = rawText.match(DOGE_ADDRESS_REGEX) || [];
  // de-duplicate while preserving order
  return [...new Set(matches)];
}

async function getBalance(address) {
  const url = `https://dogechain.info/api/v1/address/balance/${address}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = await res.json();
  if (data.success !== 1) {
    throw new Error(`API error: ${JSON.stringify(data)}`);
  }
  // balance is returned as a string, e.g. "123.45670000"
  return parseFloat(data.balance);
}

async function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Could not find ${INPUT_FILE}`);
    console.error(`Create input.txt and paste your address list (any format) into it.`);
    process.exit(1);
  }

  const rawText = fs.readFileSync(INPUT_FILE, 'utf-8');
  const addresses = extractAddresses(rawText);

  if (addresses.length === 0) {
    console.error('No valid Dogecoin addresses found in input.txt');
    process.exit(1);
  }

  console.log(`Found ${addresses.length} unique Dogecoin address(es) in input.txt`);
  console.log(`Checking balances (threshold: > ${THRESHOLD} DOGE)...\n`);

  const results = [];

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    let balance = null;
    let errorMsg = null;

    // simple retry logic (up to 3 attempts)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        balance = await getBalance(address);
        break;
      } catch (err) {
        errorMsg = err.message;
        if (attempt < 3) await sleep(1000 * attempt);
      }
    }

    const idx = `${i + 1}/${addresses.length}`;

    if (balance === null) {
      console.log(`[${idx}] ${address} -> ERROR: ${errorMsg}`);
    } else if (balance > THRESHOLD) {
      console.log(`[${idx}] ${address} -> ${balance} DOGE  *** ABOVE THRESHOLD ***`);
      results.push({ address, balance });
    } else {
      console.log(`[${idx}] ${address} -> ${balance} DOGE`);
    }

    await sleep(DELAY_MS);
  }

  // sort results descending by balance
  results.sort((a, b) => b.balance - a.balance);

  const csv = ['address,balance_doge', ...results.map((r) => `${r.address},${r.balance}`)].join('\n');
  fs.writeFileSync(OUTPUT_FILE, csv);

  console.log(`\n=== DONE ===`);
  console.log(`${results.length} address(es) have more than ${THRESHOLD} DOGE.`);
  console.log(`Results saved to: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
