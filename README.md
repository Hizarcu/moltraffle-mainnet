# Raffle Party Platform

A transparent, provably fair raffle platform powered by blockchain technology and Chainlink VRF.

## Features

- 🔒 **Provably Fair** - Chainlink VRF ensures cryptographically secure random winner selection
- ⚡ **Transparent** - All raffle data on-chain with verifiable winner selection
- 🎉 **Easy to Use** - Connect wallet and participate in seconds
- 🎨 **Beautiful UI** - Avalaunch-inspired design with dark theme and gradient effects

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling with custom design tokens

### Web3
- **wagmi v2** - React hooks for Ethereum
- **viem v2** - Ethereum library
- **Web3Modal v5** - Wallet connection
- **TanStack Query v5** - State management

### UI/UX
- **Framer Motion** - Animations
- **react-hook-form + Zod** - Form handling
- **react-hot-toast** - Notifications

## Getting Started

### Prerequisites

1. **Node.js 18+** installed
2. **WalletConnect Project ID** (get one at https://cloud.walletconnect.com)

### Installation

1. Clone the repository:
\`\`\`bash
cd raffle-party-platform
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create \`.env.local\` file:
\`\`\`bash
cp .env.local.example .env.local
\`\`\`

4. Edit \`.env.local\` and add your WalletConnect Project ID:
\`\`\`env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_ENABLE_TESTNET=true
\`\`\`

5. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

\`\`\`
raffle-party-platform/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   ├── explore/               # Browse raffles
│   ├── create/                # Create raffle
│   ├── my-raffles/            # User raffles
│   └── profile/               # User profile
├── components/
│   ├── providers/             # Web3, Query providers
│   ├── layout/                # Navbar, Footer
│   ├── wallet/                # Wallet components
│   ├── raffle/                # Raffle components
│   ├── forms/                 # Form components
│   └── ui/                    # Base UI components
├── lib/
│   ├── wagmi/                 # Wagmi configuration
│   ├── contracts/             # ABIs, hooks
│   ├── queries/               # TanStack Query hooks
│   ├── utils/                 # Utilities
│   └── types/                 # TypeScript types
└── public/                    # Static assets
\`\`\`

## Phase 1: Foundation ✅

- [x] Initialize Next.js 15 project
- [x] Configure Tailwind CSS with Avalaunch design
- [x] Set up Web3 providers (wagmi + Web3Modal)
- [x] Create base UI components (Button, Card, Badge, Modal)
- [x] Build layout (Navbar + Footer)
- [x] Implement wallet connection

## Phase 2: Raffle Display ✅

- [x] Define raffle TypeScript types
- [x] Create RaffleCard component with glassmorphism
- [x] Build RaffleGrid layout (responsive)
- [x] Implement CountdownTimer with live updates
- [x] Add RaffleStats and ParticipantList components
- [x] Create /explore page with status filtering
- [x] Build /room/[id] detail page with full info
- [x] Add skeleton loaders
- [x] Mock data for 6 sample raffles
- [x] Utility functions for formatting

## Next Steps

## Phase 3A: Contract Infrastructure ✅

- [x] Create placeholder ABIs (RaffleFactory, Raffle)
- [x] Build useJoinRaffle hook with transaction flow
- [x] Create JoinRaffleButton component with 5 states
- [x] Add transaction notification system (toast)
- [x] Implement gas estimation display
- [x] Update raffle detail page with join functionality
- [x] Add error handling and retry logic
- [x] Complete join raffle flow (UI ready for contracts)

## Next Steps

### Phase 3B: Real Blockchain Integration (When Contracts Ready)
- [ ] Deploy RaffleFactory and Raffle contracts to testnet
- [ ] Update contract addresses in addresses.ts
- [ ] Test with real testnet transactions
- [ ] Add contract event listeners for live updates
- [ ] Build JoinRaffleForm
- [ ] Implement transaction flow
- [ ] Add notifications

### Phase 4: Raffle Creation
- [ ] Multi-step CreateRaffleForm
- [ ] Form validation with Zod
- [ ] Contract deployment flow

### Phase 5: User Features
- [ ] My Raffles page with tabs
- [ ] Profile page with stats
- [ ] ENS name resolution

### Phase 6: Winner Display & VRF
- [ ] WinnerDisplay component
- [ ] VRF proof verification
- [ ] Chainlink Explorer links

### Phase 7: Polish
- [ ] Loading states
- [ ] Animations
- [ ] Mobile responsiveness
- [ ] Performance optimization

## Design System

### Colors
- **Primary**: Purple (#7B3FF2), Blue (#3D5AFE), Pink (#F23D8F)
- **Background**: Dark theme (#0A0E27, #141B3A, #1E2749)
- **Semantic**: Success (#00D9A3), Error (#FF5252), Warning (#FFC107)

### Typography
- Font: Inter (sans-serif)
- Scale: 12px - 48px

### UI Patterns
- Glassmorphism cards
- Gradient borders (Avalaunch style)
- Smooth animations
- Gradient buttons with glow

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [wagmi Documentation](https://wagmi.sh)
- [Chainlink VRF](https://docs.chain.link/vrf)
- [Tailwind CSS](https://tailwindcss.com/docs)

## License

MIT
