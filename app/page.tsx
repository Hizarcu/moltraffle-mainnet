import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RaffleGrid } from '@/components/raffle/RaffleGrid';
import { getFeaturedRaffles } from '@/lib/utils/mockData';

export default function Home() {
  const featuredRaffles = getFeaturedRaffles(3);
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-primary opacity-10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto text-center">
          <Badge variant="info" className="mb-6">
            Powered by Chainlink VRF
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-gradient">Transparent</span> Raffle
            <br />
            Platform
          </h1>

          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-8">
            Create and participate in provably fair raffles powered by blockchain technology.
            Every winner is selected using Chainlink VRF for complete transparency.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/explore">
              <Button size="lg">Explore Raffles</Button>
            </Link>
            <Link href="/create">
              <Button size="lg" variant="secondary">Create Raffle</Button>
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
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Provably Fair</h3>
              <p className="text-text-secondary">
                Chainlink VRF ensures cryptographically secure and verifiable random winner selection.
              </p>
            </Card>

            <Card variant="glass">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Instant & Transparent</h3>
              <p className="text-text-secondary">
                All raffle data is on-chain. Verify any winner selection on Chainlink Explorer.
              </p>
            </Card>

            <Card variant="glass">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
              <p className="text-text-secondary">
                Create or join raffles in seconds. Connect your wallet and start participating.
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
                  <h3 className="text-lg font-semibold mb-2">Create or Join a Raffle</h3>
                  <p className="text-text-secondary">
                    Browse active raffles or create your own. Set entry fees, deadlines, and prizes.
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
                  <h3 className="text-lg font-semibold mb-2">Wait for Deadline</h3>
                  <p className="text-text-secondary">
                    Participants join by paying the entry fee. Track participation in real-time.
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
                  <h3 className="text-lg font-semibold mb-2">Winner Selection</h3>
                  <p className="text-text-secondary">
                    Chainlink VRF automatically selects a winner using verifiable randomness. Completely transparent and tamper-proof.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Raffles */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Featured <span className="text-gradient">Raffles</span>
            </h2>
            <p className="text-text-secondary">
              Check out these active raffles and join now
            </p>
          </div>

          <RaffleGrid raffles={featuredRaffles} />

          <div className="text-center mt-8">
            <Link href="/explore">
              <Button size="lg" variant="secondary">
                View All Raffles
              </Button>
            </Link>
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
            Connect your wallet and explore amazing raffles or create your own.
          </p>
          <Link href="/explore">
            <Button size="lg" className="animate-pulse-glow">
              Explore Raffles Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
