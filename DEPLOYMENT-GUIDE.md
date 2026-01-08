# 🚀 Deployment Guide - Avalanche Fuji Testnet

Complete guide to deploy your Raffle Party Platform to Avalanche Fuji testnet.

---

## 📋 Prerequisites

### 1. Get AVAX Testnet Tokens

**Option A: Core Wallet Faucet (Recommended)**
1. Install [Core Wallet](https://core.app/)
2. Create wallet and switch to Fuji Testnet
3. Go to https://core.app/tools/testnet-faucet/
4. Enter your address and get 2 AVAX (free, daily)

**Option B: ChainLink Faucet**
1. Go to https://faucets.chain.link/fuji
2. Connect your wallet
3. Get 1 AVAX (requires GitHub account)

**Option C: Avalanche Faucet**
1. Go to https://faucet.avax.network/
2. Enter your address
3. Get 0.5 AVAX

### 2. Get LINK Tokens (For Chainlink VRF)

**Fuji LINK Faucet:**
1. Go to https://faucets.chain.link/fuji
2. Connect your wallet
3. Request 10 LINK tokens
4. Or swap AVAX for LINK on TraderJoe testnet

### 3. Set Up Wallet

**Export Your Private Key:**

**MetaMask:**
1. Click account → Account Details → Show Private Key
2. Enter password
3. Copy private key

**⚠️ SECURITY WARNING:**
- NEVER share your mainnet private key
- This is testnet only
- Create a new wallet for testing if needed

---

## 🔧 Configuration

### 1. Create Environment File

```bash
cp .env.contracts .env
```

### 2. Edit `.env` File

```bash
# Add your testnet wallet private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Optional: Add Snowtrace API key for verification
SNOWTRACE_API_KEY=your_api_key

# VRF Subscription ID (leave empty for now, will add after deployment)
VRF_SUBSCRIPTION_ID=
```

**Get Snowtrace API Key (Optional but Recommended):**
1. Go to https://snowtrace.io/register
2. Create account
3. Go to API-KEYs section
4. Generate new API key
5. Copy to `.env`

---

## 🚀 Deployment Process

### Step 1: Compile Contracts

```bash
npx hardhat compile
```

**Expected Output:**
```
Compiled 3 Solidity files successfully
```

### Step 2: Create Chainlink VRF Subscription

**Before deploying, set up Chainlink VRF:**

1. **Go to Chainlink VRF:**
   - Visit https://vrf.chain.link/
   - Connect your wallet
   - Select "Avalanche Fuji" network

2. **Create Subscription:**
   - Click "Create Subscription"
   - Confirm transaction (costs ~0.001 AVAX)
   - Note your Subscription ID

3. **Fund Subscription:**
   - Click "Add Funds"
   - Add 5 LINK tokens minimum
   - Confirm transaction

4. **Update `.env`:**
   ```bash
   VRF_SUBSCRIPTION_ID=YOUR_SUBSCRIPTION_ID
   ```

### Step 3: Deploy to Fuji

```bash
npx hardhat run scripts/deploy.ts --network fuji
```

**Expected Output:**
```
🚀 Deploying Raffle Party Platform to Avalanche Fuji...

📝 Deploying contracts with account: 0x...
💰 Account balance: 2.0 AVAX

🔗 Chainlink VRF Configuration:
   Coordinator: 0x2eD832Ba664535e5886b75D64C46EB9a228C2610
   Key Hash: 0x354d2f95da55398f44b7cff77da56283d9c6c829a4bdf1bbcaf2ad6a4d081f61
   Subscription ID: 123

📦 Deploying RaffleFactory...
✅ RaffleFactory deployed to: 0xYourContractAddress

📄 Deployment info saved to: deployments/fuji.json
🔄 Updating frontend contract addresses...
✅ Frontend addresses updated!

🎉 Deployment Complete!
```

### Step 4: Add Contract as VRF Consumer

**Back on https://vrf.chain.link/:**

1. Click your subscription
2. Click "Add Consumer"
3. Paste your `RaffleFactory` contract address
4. Confirm transaction

✅ **Your contract can now request randomness!**

---

## ✅ Verification (Optional but Recommended)

### Verify Contract on Snowtrace

```bash
npx hardhat verify --network fuji YOUR_CONTRACT_ADDRESS "0x2eD832Ba664535e5886b75D64C46EB9a228C2610" "0x354d2f95da55398f44b7cff77da56283d9c6c829a4bdf1bbcaf2ad6a4d081f61" YOUR_SUBSCRIPTION_ID
```

**Replace:**
- `YOUR_CONTRACT_ADDRESS` - From deployment output
- `YOUR_SUBSCRIPTION_ID` - Your VRF subscription ID

**Expected Output:**
```
Successfully verified contract RaffleFactory on Snowtrace.
https://testnet.snowtrace.io/address/YOUR_CONTRACT_ADDRESS#code
```

---

## 🧪 Testing Your Deployment

### 1. Update Frontend

Your `lib/contracts/addresses.ts` should now have:

```typescript
43113: { // Fuji Testnet
  RaffleFactory: '0xYourActualContractAddress',
},
```

### 2. Test in Browser

1. **Start dev server:** `npm run dev`
2. **Open browser:** http://localhost:3000
3. **Connect wallet** (make sure you're on Fuji testnet)
4. **Go to any raffle:** http://localhost:3000/room/1
5. **Click "Join Raffle"**
6. **Sign transaction**
7. **Wait for confirmation**
8. **Success!** 🎉

---

## 🐛 Troubleshooting

### Error: "Insufficient funds for gas"
**Solution:** Get more AVAX from faucet

### Error: "Nonce too high"
**Solution:** Reset account in MetaMask (Settings → Advanced → Reset Account)

### Error: "VRF subscription not found"
**Solution:**
1. Check subscription ID in `.env`
2. Ensure subscription is funded with LINK
3. Redeploy with correct ID

### Error: "Contract not found"
**Solution:**
1. Check you're on Fuji network in MetaMask
2. Verify contract address in `addresses.ts`
3. Wait a few seconds for propagation

### Transaction Fails: "execution reverted"
**Solutions:**
- Check wallet has enough AVAX for entry fee + gas
- Verify raffle hasn't ended
- Ensure you haven't already joined
- Check raffle isn't full

---

## 💰 Cost Breakdown

### One-Time Costs:
- **Create VRF Subscription:** ~0.001 AVAX
- **Deploy RaffleFactory:** ~0.1 AVAX
- **Verify Contract:** Free
- **Add VRF Consumer:** ~0.001 AVAX

### Per-Raffle Costs:
- **Create Raffle:** ~0.05 AVAX
- **Join Raffle:** Entry fee + ~0.001 AVAX gas
- **Draw Winner (VRF):** ~0.5 LINK + ~0.01 AVAX gas

### Total to Get Started:
- **2 AVAX** (from faucet)
- **10 LINK** (from faucet)
- **Time:** 15-20 minutes

---

## 📝 Post-Deployment Checklist

- [ ] RaffleFactory deployed to Fuji
- [ ] Contract address updated in `addresses.ts`
- [ ] VRF subscription created and funded
- [ ] Contract added as VRF consumer
- [ ] Contract verified on Snowtrace (optional)
- [ ] Test raffle joined successfully
- [ ] Frontend connected to testnet

---

## 🎉 Success!

Your raffle platform is now live on Avalanche Fuji testnet!

**Next Steps:**
1. Share testnet link with friends to test
2. Create test raffles
3. Join and test winner selection
4. Gather feedback
5. Deploy to mainnet when ready

**Mainnet Deployment:**
- Same process, use `--network avalanche`
- **Use real funds cautiously**
- Audit contracts before mainnet
- Consider using multi-sig wallet

---

## 📚 Resources

- **Avalanche Docs:** https://docs.avax.network/
- **Chainlink VRF:** https://docs.chain.link/vrf/
- **Snowtrace (Explorer):** https://testnet.snowtrace.io/
- **Core Wallet:** https://core.app/
- **Hardhat Docs:** https://hardhat.org/

---

## 🆘 Need Help?

Common issues and solutions:
1. **Gas too low:** Increase gas in hardhat.config.ts
2. **LINK insufficient:** Get more from faucet
3. **Contract errors:** Check Solidity version (0.8.24)
4. **VRF not working:** Verify subscription setup

**Check deployment logs:** `deployments/fuji.json`

---

**Ready to deploy? Run:** `npx hardhat run scripts/deploy.ts --network fuji` 🚀
