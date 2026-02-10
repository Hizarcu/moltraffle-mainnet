# Base Mainnet Deployment Guide

## ⚠️ CRITICAL WARNING
You are deploying to **MAINNET** with **REAL MONEY**. Follow this guide carefully.

---

## Phase 3.1: Chainlink VRF Setup

### Step 1: Create VRF Subscription

1. Go to https://vrf.chain.link/
2. Connect wallet (same wallet you'll deploy from)
3. Select **Base Mainnet** network
4. Click "Create Subscription"
5. **Save the Subscription ID** - you'll need this!

### Step 2: Fund Subscription

1. In your subscription dashboard, click "Add Funds"
2. Transfer LINK tokens to the subscription
3. **Recommended:** Start with 5-10 LINK for testing
4. Each VRF request costs ~0.05-0.1 LINK

### Step 3: Get VRF Configuration

**Base Mainnet VRF Parameters:**
```
VRF Coordinator: 0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634
Key Hash: [Get from Chainlink docs for 500 gwei gas lane]
```

Find the correct Key Hash at:
https://docs.chain.link/vrf/v2-5/supported-networks#base-mainnet

**Common Key Hashes (verify on Chainlink docs):**
- 500 gwei lane: Check Chainlink docs
- 200 gwei lane: Check Chainlink docs

---

## Phase 3.2: Environment Configuration

### Update .env File

Add these variables to your `.env`:

```bash
# Base Mainnet Configuration
BASE_RPC_URL="https://mainnet.base.org"
PRIVATE_KEY="your-private-key-here"

# Chainlink VRF Mainnet
VRF_COORDINATOR_BASE_MAINNET="0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634"
VRF_KEY_HASH_BASE_MAINNET="0x..." # Get from Chainlink docs
VRF_SUBSCRIPTION_ID_MAINNET="12345" # Your subscription ID

# BaseScan Verification
BASESCAN_API_KEY="your-basescan-api-key"
```

### Security Checklist

Before deploying:
- ✅ Deployer wallet has sufficient ETH for gas (~0.01 ETH)
- ✅ VRF subscription is funded with LINK
- ✅ Private key is from a secure wallet
- ✅ All tests passing (npm test)
- ✅ VRF parameters verified on Chainlink docs
- ✅ .env file has all required variables

---

## Phase 3.3: Deploy to Mainnet

### Step 1: Final Test Run

```bash
# Run all tests one more time
npm test

# Should show: 80 passing
```

### Step 2: Check Deployer Balance

```bash
# Check your wallet has enough ETH
npx hardhat run scripts/check-balance.js --network base
```

### Step 3: Deploy RaffleFactory

```bash
npx hardhat run scripts/deploy.js --network base
```

**Expected output:**
```
🚀 Deploying Raffle Party Platform to base (Chain ID: 8453)...
📝 Deploying contracts with account: 0x...
💰 Account balance: 0.XXX ETH

🔗 Chainlink VRF Configuration:
   Coordinator: 0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634
   Key Hash: 0x...
   Subscription ID: 12345

📦 Deploying RaffleFactory...
✅ RaffleFactory deployed to: 0x...
```

**Save this address!** This is your production RaffleFactory contract.

---

## Phase 3.4: Add VRF Consumer

**CRITICAL:** The factory cannot draw winners until you complete this step.

1. Go to https://vrf.chain.link/
2. Select your subscription
3. Click "Add Consumer"
4. Paste your RaffleFactory address
5. Confirm the transaction
6. Verify the factory appears in "Consumers" list

---

## Phase 3.5: Verify Contracts on BaseScan

### Why Verify?
- Users can read the source code
- Builds trust and transparency
- Required for public confidence

### Verify RaffleFactory

```bash
npx hardhat verify --network base \
  0xYOUR_FACTORY_ADDRESS \
  "0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634" \
  "0xYOUR_KEY_HASH" \
  YOUR_SUBSCRIPTION_ID
```

**Expected output:**
```
Successfully submitted source code for contract
contracts/RaffleFactory.sol:RaffleFactory at 0x...
https://basescan.org/address/0x...#code
```

### Verify Raffle Implementation

After creating your first raffle, verify the Raffle contract:

1. Create a test raffle
2. Get the raffle contract address from the transaction
3. Run:

```bash
npx hardhat verify --network base \
  0xYOUR_RAFFLE_ADDRESS \
  "Title" \
  "Description" \
  "Prize Description" \
  ENTRY_FEE_IN_WEI \
  DEADLINE_TIMESTAMP \
  MAX_PARTICIPANTS \
  0xCREATOR_ADDRESS \
  0xFACTORY_ADDRESS
```

---

## Phase 3.6: Test with Real Money (Small Amounts)

**DO NOT skip this step!**

### Create Test Raffle

1. Connect to your frontend (localhost:3000)
2. Switch wallet to Base mainnet
3. Create a small test raffle:
   - Entry Fee: **0.001 ETH** (very small)
   - Max Participants: 2
   - Deadline: 1 hour from now

### Test Join Raffle

1. Join with 1 ticket from deployer wallet
2. Join with 1 ticket from another wallet
3. Verify:
   - Both participants show in raffle
   - Prize pool = 0.002 ETH
   - Transaction succeeded

### Test Draw Winner

1. Wait for deadline (or fill max participants)
2. Call drawWinner()
3. Wait 1-5 minutes for VRF callback
4. Verify:
   - Winner selected correctly
   - Random number from VRF used
   - Status changed to DRAWN

### Test Claim Prize

1. Winner calls claimPrize()
2. Verify:
   - Prize transferred to winner
   - Contract balance = 0
   - Status changed to CANCELLED (preventing re-claim)

---

## Phase 3.7: Update Frontend Configuration

### Update Contract Addresses

File: `lib/contracts/addresses.ts`

```typescript
export const RAFFLE_FACTORY_ADDRESSES = {
  // Base Mainnet
  8453: {
    RaffleFactory: '0xYOUR_MAINNET_FACTORY_ADDRESS'
  },
  // Base Sepolia (Testnet)
  84532: {
    RaffleFactory: '0x12B290Ee2b741f700337680bC781492b7F2BFE37'
  }
} as const;
```

### Verify Frontend Configuration

1. Check wagmi config includes Base mainnet (chainId: 8453)
2. Test wallet connection to Base mainnet
3. Test raffle creation flow
4. Test joining a raffle
5. Test draw winner flow

---

## Phase 3.8: Post-Deployment Security Checklist

Before going live to users:

### Contract Security
- ✅ RaffleFactory verified on BaseScan
- ✅ Raffle implementation verified on BaseScan
- ✅ Factory added as VRF consumer
- ✅ VRF subscription has sufficient LINK
- ✅ All tests passing (80/80)

### Functionality Testing
- ✅ Test raffle created successfully
- ✅ Multiple users can join
- ✅ Draw winner works with VRF
- ✅ Prize claim works
- ✅ Refunds work (test cancelRaffle)
- ✅ Creation fee collected correctly

### Platform Owner Controls
- ✅ Pause mechanism tested
- ✅ Fee withdrawal works
- ✅ Only owner can pause/unpause
- ✅ Only owner can withdraw fees

### Frontend Testing
- ✅ Wallet connects to Base mainnet
- ✅ Contract addresses correct
- ✅ Raffle creation works
- ✅ Joining works
- ✅ Winner selection displays correctly
- ✅ Prize claiming works

---

## Phase 3.9: Emergency Procedures

### If Something Goes Wrong

**Pause All Raffle Creation:**
```javascript
// In Hardhat console
const factory = await ethers.getContractAt("RaffleFactory", "0xYOUR_ADDRESS");
await factory.pause();
```

**Check VRF Subscription:**
- Go to https://vrf.chain.link/
- Verify subscription is funded
- Verify factory is added as consumer
- Check request history for failures

**Check Individual Raffle:**
```javascript
const raffle = await ethers.getContractAt("Raffle", "0xRAFFLE_ADDRESS");
const details = await raffle.getRaffleDetails();
console.log(details);
```

---

## Phase 3.10: Monitoring & Maintenance

### Monitor VRF Subscription
- Check LINK balance weekly
- Top up when balance < 5 LINK
- Monitor request success rate

### Monitor Platform Fees
- Check accumulated fees:
  ```javascript
  const fees = await factory.getAccumulatedFees();
  console.log(ethers.formatEther(fees), "ETH");
  ```

- Withdraw fees periodically:
  ```javascript
  await factory.withdrawFees();
  ```

### Monitor Active Raffles
- Track total raffle count
- Monitor for stuck raffles (deadline passed, no draw)
- Check VRF fulfillment success rate

---

## Key Addresses Reference

### Base Mainnet
- **Chain ID:** 8453
- **RPC URL:** https://mainnet.base.org
- **Explorer:** https://basescan.org
- **VRF Coordinator:** 0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634

### Your Deployed Contracts
- **RaffleFactory:** [Fill in after deployment]
- **Deployment Date:** [Fill in after deployment]
- **Deployer Address:** [Fill in after deployment]
- **VRF Subscription ID:** [Fill in after deployment]

---

## Important Links

- **Chainlink VRF Dashboard:** https://vrf.chain.link/
- **BaseScan (Explorer):** https://basescan.org
- **Base Mainnet Docs:** https://docs.base.org/
- **Chainlink VRF Docs:** https://docs.chain.link/vrf/v2-5/supported-networks
- **Get LINK Tokens:** https://app.uniswap.org/ (swap ETH for LINK on Base)

---

## Quick Command Reference

```bash
# Run tests
npm test

# Deploy to mainnet
npx hardhat run scripts/deploy.js --network base

# Verify contract
npx hardhat verify --network base 0xADDRESS "constructor" "args"

# Hardhat console (mainnet)
npx hardhat console --network base

# Check factory status
const factory = await ethers.getContractAt("RaffleFactory", "0xADDRESS");
await factory.paused();
await factory.getRaffleCount();

# Pause factory (emergency)
await factory.pause();

# Unpause factory
await factory.unpause();

# Withdraw fees
await factory.withdrawFees();
```

---

## Support & Resources

- **Smart Contract Tests:** Run `npm test` (80 tests should pass)
- **Test Documentation:** See `TEST_SUITE_SUMMARY.md`
- **Validation Guide:** See `VALIDATION_SUMMARY.md`
- **AI Agent Integration:** See `AI_AGENT_GUIDE.md`

---

**Last Updated:** February 9, 2026
**Contract Version:** v2.0-security-fixes
**Status:** Ready for mainnet deployment

**⚠️ Remember: This is real money. Test thoroughly before promoting to users!**
