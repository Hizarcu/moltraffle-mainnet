# Testing Guide - Complete Flow with Smart Contracts

## Prerequisites

### 1. WalletConnect Project ID
**Status:** ⚠️ Required

The app currently uses a placeholder WalletConnect Project ID. To connect wallets:

1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Create a free account
3. Create a new project
4. Copy the Project ID
5. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here
   ```

### 2. Smart Contract Deployment
**Status:** ✅ Deployed on Sepolia

- **RaffleFactory Address:** `0x682Ae916B80B265D15efB6898Ccaf0f82fA469A4`
- **Network:** Sepolia Testnet (Chain ID: 11155111)
- **Explorer:** https://sepolia.etherscan.io/address/0x682Ae916B80B265D15efB6898Ccaf0f82fA469A4

### 3. Test Wallet Setup
You'll need:
- MetaMask or another Web3 wallet
- Sepolia testnet configured
- Sepolia ETH for gas fees
  - Get from: https://sepoliafaucet.com/ or https://faucet.chainstack.com/sepolia-testnet-faucet

### 4. Chainlink VRF Setup
The contract needs Chainlink VRF configured:
- VRF Subscription must be funded with LINK
- Contract must be added as a consumer
- Check VRF status at: https://vrf.chain.link/

## Testing Flow

### Step 1: Connect Wallet
1. Start the dev server: `npm run dev`
2. Open http://localhost:3000
3. Click "Connect Wallet" in the top right
4. Connect to Sepolia testnet
5. Approve the connection

**Expected Result:**
- Wallet address shown in navbar
- Network badge shows "Sepolia"

### Step 2: Browse Raffles
1. Click "Explore" in navigation
2. Check the blockchain status banner at the top

**Expected Result:**
- If no raffles: Blue banner says "No on-chain raffles yet • Showing demo data"
- If raffles exist: Green banner shows "Connected to blockchain • X raffles on-chain"
- Mock raffles displayed as fallback

### Step 3: Create a Raffle
1. Click "Create Raffle" in navigation
2. Fill out the 5-step form:
   - **Step 1:** Title and Description
   - **Step 2:** Prize Description
   - **Step 3:** Entry Fee (in ETH, e.g., 0.01) and Max Participants (0 = unlimited)
   - **Step 4:** Deadline (future date/time)
   - **Step 5:** Review and confirm
3. Click "Create Raffle"
4. Confirm the transaction in your wallet
5. Wait for confirmation

**Expected Result:**
- Transaction submitted successfully
- Toast notification: "Raffle created successfully!"
- Redirected to "My Raffles" page
- New raffle appears in "Created" tab

**Gas Cost:** ~500,000 - 800,000 gas (varies)

### Step 4: Join a Raffle
1. Go to "Explore" page
2. Find an active raffle
3. Click "View Details" on the raffle card
4. Click "Join Raffle" button
5. Confirm the transaction (must send exact entry fee)
6. Wait for confirmation

**Expected Result:**
- Transaction submitted with entry fee
- Toast notification: "Joined raffle successfully!"
- Your address appears in participants list
- Badge shows "You're Participating"

**Cost:** Entry fee + gas (e.g., 0.01 ETH + ~50,000 gas)

### Step 5: Wait for Deadline
The raffle cannot be drawn until the deadline passes.

**Options to test:**
1. Create a raffle with a deadline 2 minutes in the future
2. Wait for the deadline to pass

### Step 6: Draw Winner (Creator Only)
1. After deadline passes, go to the raffle detail page
2. If you're the creator, you'll see "🎲 Draw Winner with Chainlink VRF" button
3. Click the button
4. Confirm the transaction
5. Wait for:
   - Transaction confirmation
   - Chainlink VRF to fulfill the request (can take 1-5 minutes)
6. Refresh the page to see the winner

**Expected Result:**
- VRF request submitted
- Toast: "Winner drawn successfully! Waiting for VRF response..."
- After VRF fulfillment:
  - Confetti animation 🎉
  - Winner display with full details:
    - Winner address
    - Prize pool amount
    - Random number
    - Calculation: `randomNumber % participants = winnerIndex`
    - VRF Request ID
    - Link to Chainlink Explorer

**Gas Cost:** ~200,000 - 300,000 gas + VRF fee

### Step 7: Verify Winner on Chainlink
1. On the winner display, click "Verify on Chainlink Explorer"
2. View the VRF proof on-chain
3. Verify the randomness is cryptographically secure

## Current Limitations

### What Works:
- ✅ Smart contracts deployed on Sepolia
- ✅ Create raffle functionality
- ✅ Join raffle functionality
- ✅ Draw winner with Chainlink VRF
- ✅ Winner display with proof
- ✅ All UI components built

### What Needs Setup:
- ⚠️ WalletConnect Project ID (placeholder currently)
- ⚠️ Chainlink VRF subscription must be funded
- ⚠️ Contract must be added as VRF consumer

### Known Issues:
1. **WalletConnect Errors:** You may see console warnings about `@react-native-async-storage` - these are safe to ignore, they don't affect functionality
2. **Mock Data Fallback:** The app shows demo raffles until real raffles are created on-chain
3. **Winner Index Calculation:** Currently not fetched from contract events (shows undefined)

## Troubleshooting

### "Insufficient funds" error
- Get more Sepolia ETH from a faucet
- Reduce entry fee or gas price

### "Deadline not reached" error
- Wait for the deadline to pass
- Check your system time is correct

### "Already joined" error
- You've already joined this raffle
- Try with a different wallet address

### VRF not fulfilling
- Check subscription has LINK balance
- Verify contract is added as consumer
- Check VRF coordinator is correct for Sepolia
- Wait up to 5 minutes

### Transaction failing
- Check you're on Sepolia testnet
- Verify contract address is correct
- Ensure sufficient gas limit
- Check transaction on Sepolia Etherscan

## Contract Functions Reference

### RaffleFactory
- `createRaffle(title, description, prizeDesc, entryFee, deadline, maxParticipants)`
- `getAllRaffles()` → address[]
- `getRafflesByCreator(address)` → address[]

### Raffle
- `joinRaffle()` payable → join with entry fee
- `drawWinner()` → request VRF random number
- `getRaffleInfo()` → all raffle details
- `getParticipants()` → participant addresses
- `winner()` → winner address (if drawn)

## Next Steps After Testing

1. **Deploy to mainnet** when ready (Ethereum or Avalanche)
2. **Fund VRF subscription** with enough LINK
3. **Add more features:**
   - Automatic winner selection (Chainlink Automation)
   - Email notifications
   - Social sharing
   - Raffle analytics
4. **Optimize:**
   - Use multicall for fetching multiple raffles
   - Add caching layer
   - Implement proper event indexing (TheGraph)

## Support

If you encounter issues:
1. Check Sepolia Etherscan for transaction status
2. Check browser console for error messages
3. Verify all prerequisites are met
4. Check Chainlink VRF status

## Example Test Scenario

**Quick 5-minute test:**
1. Get WalletConnect Project ID (2 min)
2. Update `.env.local` and restart server
3. Connect wallet on Sepolia
4. Create raffle with 2-minute deadline, 0.001 ETH entry fee
5. Join with a second wallet
6. Wait 2 minutes
7. Draw winner
8. View winner display with VRF proof

**Total time:** ~5-7 minutes (plus VRF fulfillment time)
**Total cost:** ~0.005 ETH in gas + entry fees (returned to winner)
