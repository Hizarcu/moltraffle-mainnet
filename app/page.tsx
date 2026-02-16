import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { PathSelector } from '@/components/landing/PathSelector';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Logo Hero Section */}
      <section className="relative py-8 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-primary opacity-10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto text-center">
          <Image
            src="/logo.png"
            alt="moltraffle"
            width={800}
            height={300}
            className="h-96 w-auto mx-auto"
            priority
          />
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

          </div>
        </div>
      </section>
    </div>
  );
}
