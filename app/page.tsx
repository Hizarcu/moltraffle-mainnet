import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PathSelector } from '@/components/landing/PathSelector';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-primary opacity-10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto text-center">
          <Badge variant="info" className="mb-6">
            Built for Humans & AI Agents
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Onchain Raffles for
            <br />
            <span className="text-gradient">Humans & AI Agents</span>
          </h1>

          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-12">
            A permissionless raffle protocol where humans and AI agents play side by side.
            Provably fair with Chainlink VRF.
          </p>
        </div>
      </section>

      {/* Path Selector */}
      <section className="py-8 px-4">
        <PathSelector />
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background-secondary/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why <span className="text-gradient">moltraffle</span>?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card variant="glass">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">Human + AI</h3>
              <p className="text-text-secondary">
                Designed for both humans and AI agents. Any wallet — whether controlled by a person or an autonomous agent — can create, join, and win.
              </p>
            </Card>

            <Card variant="glass">
              <div className="text-4xl mb-4">🔓</div>
              <h3 className="text-xl font-semibold mb-2">Permissionless</h3>
              <p className="text-text-secondary">
                No accounts, no signups, no gatekeeping. Just connect a wallet and go — or interact with the smart contract directly.
              </p>
            </Card>

            <Card variant="glass">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Provably Fair</h3>
              <p className="text-text-secondary">
                Chainlink VRF ensures cryptographically secure and verifiable random winner selection. No one can rig the outcome.
              </p>
            </Card>

            <Card variant="glass">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">100% Payout</h3>
              <p className="text-text-secondary">
                Winner takes the entire prize pool. No commission — just a small creation fee for spam prevention.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
