import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-primary opacity-10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto text-center">
          <Badge variant="info" className="mb-6">
            Permissionless Raffle Protocol
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Create & Join
            <br />
            <span className="text-gradient">Onchain Raffles</span>
          </h1>

          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-8">
            A permissionless protocol for provably fair raffles.
            Connect your wallet, create or join raffles, and win prizes — all onchain with Chainlink VRF.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/explore">
              <Button size="lg">Explore Raffles</Button>
            </Link>
            <Link href="/create">
              <Button size="lg" variant="secondary">
                Create a Raffle
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background-secondary/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why <span className="text-gradient">Raffle Party</span>?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card variant="glass">
              <div className="text-4xl mb-4">🔓</div>
              <h3 className="text-xl font-semibold mb-2">Permissionless</h3>
              <p className="text-text-secondary">
                Anyone with a wallet can create or join raffles. No accounts, no signups — just connect and go.
              </p>
            </Card>

            <Card variant="glass">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Provably Fair</h3>
              <p className="text-text-secondary">
                Chainlink VRF ensures cryptographically secure and verifiable random winner selection.
              </p>
            </Card>

            <Card variant="glass">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">100% Payout</h3>
              <p className="text-text-secondary">
                Winner takes the entire prize pool. No commission deducted — just a small creation fee for spam prevention.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It <span className="text-gradient">Works</span>
          </h2>

          <div className="space-y-8">
            <Card variant="gradient-border">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                  <p className="text-text-secondary">
                    Connect any EVM-compatible wallet to get started. No signup or identity verification required.
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="gradient-border">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Create or Join Raffles</h3>
                  <p className="text-text-secondary">
                    Create a raffle with custom entry fees and deadlines, or join existing raffles by buying tickets.
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="gradient-border">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Winner Selected Onchain</h3>
                  <p className="text-text-secondary">
                    After the deadline, anyone can trigger the draw. Chainlink VRF selects a winner with verifiable randomness.
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="gradient-border">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Claim Your Prize</h3>
                  <p className="text-text-secondary">
                    The winner claims the entire prize pool directly from the smart contract. Fully trustless, fully onchain.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-primary/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Connect your wallet and start creating or joining raffles. No middleman, no trust required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/explore">
              <Button size="lg" className="animate-pulse-glow">
                Explore Raffles
              </Button>
            </Link>
            <Link href="/create">
              <Button size="lg" variant="secondary">
                Create a Raffle
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
