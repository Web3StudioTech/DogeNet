# Dogecoin Address Balance Checker

This checks a list of Dogecoin addresses and reports which ones hold
more than 50 DOGE.

## Files
- `input.txt` — paste your RAW list here (any format!)
- `check_balances.js` — Node.js script that extracts addresses and checks balances
- `addresses_above_50_doge.csv` — created after running, contains only addresses > 50 DOGE

## How it works

You can paste your address list into `input.txt` in ANY format — including
with item numbers, commas, quotes, etc. For example, this works fine:

```
1,"DTs3E2Dov1QsJPycJDxjsmQTsfgvujuwhR
2,"DCaq8FCHVXwaiuuyHF4f9SmgzqJyatyHDM
```

The script automatically extracts only valid Dogecoin addresses (anything
matching the pattern: starts with "D", followed by 33 base58 characters)
and ignores everything else — numbers, commas, quotes, extra text, etc.

## How to run

1. Make sure you have Node.js 18 or newer installed (`node -v` to check).
2. Open a terminal in this folder.
3. Paste your address list (in any format) into `input.txt`.
4. Run:

   ```
   node check_balances.js
   ```

5. The script will print progress for every address found (this takes a
   few minutes due to the delay between API calls so the free API
   doesn't rate-limit us).
6. When finished, `addresses_above_50_doge.csv` will contain only the
   addresses with more than 50 DOGE, sorted highest balance first.

## Notes / troubleshooting

- The script uses the free public API at dogechain.info
  (`https://dogechain.info/api/v1/address/balance/{address}`).
  If that API is down or rate-limits you, you can swap in an
  alternative such as BlockCypher:
  `https://api.blockcypher.com/v1/doge/main/addrs/{address}/balance`
  (note: BlockCypher has its own rate limits for free/anonymous use).
- If you get a lot of "ERROR" lines, try increasing `DELAY_MS` in
  `check_balances.js` (e.g. from 600 to 1500).
- The threshold (50 DOGE) can be changed by editing the `THRESHOLD`
  constant near the top of `check_balances.js`.
- A sample `input.txt` (with your 475 addresses, numbered/quoted format)
  is already included so you can test it right away.
