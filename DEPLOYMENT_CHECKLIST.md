# Base Mainnet Deployment Checklist

Use this checklist to ensure safe mainnet deployment.

---

## 📋 Pre-Deployment (Do First)

### 1. VRF Setup
- [ ] Created VRF subscription at https://vrf.chain.link/
- [ ] Funded subscription with LINK (recommended: 5-10 LINK)
- [ ] Saved Subscription ID: `_______________`
- [ ] Got Key Hash from Chainlink docs: `0x_______________`

### 2. Environment Configuration
- [ ] Added `VRF_COORDINATOR_BASE_MAINNET="0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634"` to .env
- [ ] Added `VRF_KEY_HASH_BASE_MAINNET="0x..."` to .env
- [ ] Added `VRF_SUBSCRIPTION_ID_MAINNET="..."` to .env
- [ ] Added `BASESCAN_API_KEY="..."` to .env (get from https://basescan.org/myapikey)
- [ ] Verified `PRIVATE_KEY` is set in .env
- [ ] Verified `BASE_RPC_URL` is set (or using default)

### 3. Pre-Deployment Tests
```bash
# All must pass before proceeding
npm test                                    # Should show: 80 passing
npx hardhat run scripts/check-balance.js --network base  # Check you have enough ETH
```

- [ ] All 80 tests passing ✅
- [ ] Deployer has ≥0.01 ETH for gas
- [ ] VRF params verified on Chainlink docs

---

## 🚀 Deployment Steps

### 4. Deploy RaffleFactory
```bash
npx hardhat run scripts/deploy.js --network base
```

- [ ] Deployment succeeded
- [ ] RaffleFactory Address: `0x_______________`
- [ ] Deployment saved to `deployments/base.json`

### 5. Add VRF Consumer
1. Go to https://vrf.chain.link/
2. Select your subscription
3. Click "Add Consumer"
4. Paste factory address: `0x_______________`

- [ ] Factory added as VRF consumer ✅
- [ ] Factory appears in subscription's "Consumers" list

### 6. Verify Contract on BaseScan
```bash
npx hardhat verify --network base \
  YOUR_FACTORY_ADDRESS \
  "0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634" \
  "YOUR_KEY_HASH" \
  YOUR_SUBSCRIPTION_ID
```

- [ ] Contract verified successfully
- [ ] Source code visible on BaseScan: https://basescan.org/address/0x...#code

---

## 🧪 Testing with Real Money (Small Amounts)

### 7. Create Test Raffle
- [ ] Created test raffle with 0.001 ETH entry fee
- [ ] Test Raffle Address: `0x_______________`
- [ ] Max participants: 2
- [ ] Deadline: 1 hour from now

### 8. Test Join Flow
- [ ] Joined from wallet 1 with 1 ticket (0.001 ETH)
- [ ] Joined from wallet 2 with 1 ticket (0.001 ETH)
- [ ] Prize pool shows 0.002 ETH ✅

### 9. Test Draw Winner Flow
- [ ] Called drawWinner() after filling raffle
- [ ] Waited 1-5 minutes for VRF callback
- [ ] Winner selected correctly ✅
- [ ] Status changed to DRAWN ✅

### 10. Test Claim Prize
- [ ] Winner called claimPrize()
- [ ] Prize transferred successfully (0.002 ETH)
- [ ] Contract balance = 0 ✅

### 11. Test Cancel/Refund (Optional)
- [ ] Created another test raffle
- [ ] Joined with 2 wallets
- [ ] Creator called cancelRaffle()
- [ ] All participants refunded correctly ✅

---

## 🔧 Frontend Configuration

### 12. Update Contract Addresses
File: `lib/contracts/addresses.ts`

- [ ] Updated mainnet address (chainId: 8453)
- [ ] Frontend connects to Base mainnet correctly
- [ ] Raffle creation works from UI
- [ ] Joining works from UI

---

## ✅ Final Security Checklist

### Before Going Live
- [ ] All tests passing (80/80)
- [ ] Contract verified on BaseScan
- [ ] VRF consumer added and working
- [ ] Test raffle completed end-to-end successfully
- [ ] Creation fee collected correctly
- [ ] Pause mechanism tested
- [ ] Fee withdrawal tested
- [ ] Frontend pointing to correct mainnet address

### Platform Owner Controls Verified
- [ ] Can pause raffle creation
- [ ] Can unpause raffle creation
- [ ] Can withdraw accumulated fees
- [ ] Only owner can perform these actions

---

## 📝 Documentation

### 13. Save Deployment Info

Create a record with:
- Deployment Date: `_______________`
- RaffleFactory Address: `0x_______________`
- Deployer Address: `0x_______________`
- VRF Subscription ID: `_______________`
- BaseScan Verification: https://basescan.org/address/0x...#code

---

## 🚨 Emergency Procedures

### If Something Goes Wrong

**Pause All Raffles:**
```bash
npx hardhat console --network base
const factory = await ethers.getContractAt("RaffleFactory", "0xYOUR_ADDRESS");
await factory.pause();
```

**Check VRF Status:**
- Go to https://vrf.chain.link/
- Check subscription balance
- Check request history
- Verify factory is added as consumer

**Monitor LINK Balance:**
- Keep subscription funded
- Each draw costs ~0.05-0.1 LINK
- Top up when balance < 5 LINK

---

## 📊 Post-Deployment Monitoring

### Regular Checks
- [ ] VRF subscription LINK balance (weekly)
- [ ] Factory accumulated fees (weekly)
- [ ] Active raffles count
- [ ] Stuck raffles (deadline passed, no draw)
- [ ] VRF fulfillment success rate

### Maintenance Tasks
- [ ] Top up VRF subscription when needed
- [ ] Withdraw accumulated fees periodically
- [ ] Monitor gas prices for optimal withdrawal timing

---

## 🎉 Ready to Go Live?

Only proceed if ALL items above are checked ✅

### Final Confirmation
- [ ] I have tested with real money (small amounts)
- [ ] All flows work correctly end-to-end
- [ ] Contract is verified on BaseScan
- [ ] VRF is working correctly
- [ ] I understand emergency procedures
- [ ] I am ready to handle support requests

**Once all checked, you can promote to users! 🚀**

---

## 📞 Quick Reference

**VRF Dashboard:** https://vrf.chain.link/
**BaseScan Explorer:** https://basescan.org
**Factory Address:** `0x_______________`
**Subscription ID:** `_______________`

**Emergency Contacts:**
- Platform Owner: `0x_______________`
- Backup Key Holder: `0x_______________`

---

**Deployment Date:** _______________
**Completed By:** _______________
**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Live

