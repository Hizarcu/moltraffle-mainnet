# Quick Deployment Commands

Copy and paste these commands in order for Base mainnet deployment.

---

## Step 1: Get Base Mainnet VRF Key Hash

Go to: https://docs.chain.link/vrf/v2-5/supported-networks#base-mainnet

Find the Key Hash for Base mainnet (usually 500 gwei gas lane).

---

## Step 2: Setup VRF Subscription

1. Go to: https://vrf.chain.link/
2. Connect wallet
3. Switch to Base mainnet
4. Create subscription → Save the Subscription ID
5. Add funds → Transfer 5-10 LINK to subscription

---

## Step 3: Configure .env

Add these to your `.env` file:

```bash
# Base Mainnet RPC (or use default)
BASE_RPC_URL="https://mainnet.base.org"

# Your deployer wallet private key
PRIVATE_KEY="0x..."

# VRF Configuration (get from Chainlink docs)
VRF_COORDINATOR_BASE_MAINNET="0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634"
VRF_KEY_HASH_BASE_MAINNET="0x..." # From Chainlink docs
VRF_SUBSCRIPTION_ID_MAINNET="12345" # Your subscription ID

# BaseScan API Key (get from https://basescan.org/myapikey)
BASESCAN_API_KEY="..."
```

---

## Step 4: Pre-Deployment Checks

```bash
# Run all tests
npm test

# Expected: 80 passing

# Check deployer balance
npx hardhat run scripts/check-balance.js --network base

# Expected: At least 0.01 ETH
```

---

## Step 5: Deploy to Mainnet

```bash
npx hardhat run scripts/deploy.js --network base
```

**Save the factory address from output!**

---

## Step 6: Add VRF Consumer

1. Go to: https://vrf.chain.link/
2. Open your subscription
3. Click "Add Consumer"
4. Paste factory address from Step 5
5. Confirm transaction

---

## Step 7: Verify Contract

Replace `YOUR_FACTORY_ADDRESS`, `YOUR_KEY_HASH`, and `YOUR_SUBSCRIPTION_ID`:

```bash
npx hardhat verify --network base \
  YOUR_FACTORY_ADDRESS \
  "0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634" \
  "YOUR_KEY_HASH" \
  YOUR_SUBSCRIPTION_ID
```

---

## Step 8: Test with Small Amounts

### Create test raffle (0.001 ETH entry fee):

1. Open http://localhost:3000
2. Connect wallet to Base mainnet
3. Create raffle:
   - Entry Fee: 0.001 ETH
   - Max Participants: 2
   - Deadline: 1 hour

### Join and test:

1. Join from 2 different wallets (0.001 ETH each)
2. Wait for max participants or deadline
3. Call drawWinner()
4. Wait 1-5 minutes for VRF
5. Winner calls claimPrize()
6. Verify prize received

---

## Step 9: Verify Frontend Config

Check `lib/contracts/addresses.ts`:

```typescript
export const RAFFLE_FACTORY_ADDRESSES = {
  8453: {
    RaffleFactory: 'YOUR_MAINNET_FACTORY_ADDRESS'
  },
  // ...
}
```

---

## Emergency Commands

### Pause factory (if needed):
```bash
npx hardhat console --network base
```

Then in console:
```javascript
const factory = await ethers.getContractAt("RaffleFactory", "YOUR_ADDRESS");
await factory.pause();
```

### Unpause:
```javascript
await factory.unpause();
```

### Check status:
```javascript
await factory.paused();           // false = active, true = paused
await factory.getRaffleCount();    // Total raffles created
await factory.getAccumulatedFees(); // Fees collected
```

### Withdraw fees:
```javascript
await factory.withdrawFees();
```

---

## Monitoring Commands

### Check VRF subscription:
Go to: https://vrf.chain.link/

### Check factory on BaseScan:
https://basescan.org/address/YOUR_FACTORY_ADDRESS

### Check specific raffle:
```bash
npx hardhat console --network base
```

```javascript
const raffle = await ethers.getContractAt("Raffle", "0xRAFFLE_ADDRESS");
const details = await raffle.getRaffleDetails();
console.log(details);

await raffle.getTotalTickets();
await raffle.getPrizePool();
await raffle.status(); // 0=UPCOMING, 1=ACTIVE, 2=ENDED, 3=DRAWN, 4=CANCELLED
```

---

## Key Addresses

Fill in after deployment:

- **Factory Address:** `_______________`
- **Deployer Address:** `_______________`
- **VRF Subscription ID:** `_______________`
- **Deployment Date:** `_______________`

---

## Important Links

- **VRF Dashboard:** https://vrf.chain.link/
- **BaseScan:** https://basescan.org
- **Get LINK:** https://app.uniswap.org/ (swap ETH → LINK on Base)
- **Base Docs:** https://docs.base.org/
- **Chainlink VRF Docs:** https://docs.chain.link/vrf/v2-5/supported-networks

---

## Documentation

- Full guide: `MAINNET_DEPLOYMENT_GUIDE.md`
- Checklist: `DEPLOYMENT_CHECKLIST.md`
- Tests: `TEST_SUITE_SUMMARY.md`

---

**⚠️ Remember: This is mainnet with real money. Test thoroughly!**
