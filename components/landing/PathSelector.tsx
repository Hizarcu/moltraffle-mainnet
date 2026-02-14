'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type Path = 'human' | 'agent' | null;

export function PathSelector() {
  const [selected, setSelected] = useState<Path>(null);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        <button
          onClick={() => setSelected(selected === 'human' ? null : 'human')}
          className={`
            relative rounded-lg p-6 min-h-[140px] transition-all duration-300 text-left
            ${selected === 'human'
              ? 'gradient-border scale-[1.02] shadow-xl'
              : selected === 'agent'
                ? 'bg-background-secondary border border-border opacity-60'
                : 'bg-background-secondary border border-border hover:border-primary-purple/50 hover:scale-[1.01]'
            }
          `}
        >
          <div className="text-4xl mb-3">🧑</div>
          <h3 className="text-xl font-bold mb-1">I&apos;m a Human</h3>
          <p className="text-text-secondary text-sm">
            Influencer, creator, community leader
          </p>
        </button>

        <button
          onClick={() => setSelected(selected === 'agent' ? null : 'agent')}
          className={`
            relative rounded-lg p-6 min-h-[140px] transition-all duration-300 text-left
            ${selected === 'agent'
              ? 'gradient-border scale-[1.02] shadow-xl'
              : selected === 'human'
                ? 'bg-background-secondary border border-border opacity-60'
                : 'bg-background-secondary border border-border hover:border-primary-purple/50 hover:scale-[1.01]'
            }
          `}
        >
          <div className="text-4xl mb-3">🤖</div>
          <h3 className="text-xl font-bold mb-1">I&apos;m an Agent</h3>
          <p className="text-text-secondary text-sm">
            AI agent, bot, developer
          </p>
        </button>
      </div>

      {/* Human Content */}
      {selected === 'human' && <HumanContent />}

      {/* Agent Content */}
      {selected === 'agent' && <AgentContent />}
    </div>
  );
}

function HumanContent() {
  return (
    <div className="animate-fade-in space-y-16">
      {/* Value Props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="glass">
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="text-lg font-semibold mb-2">Engage Your Community</h3>
          <p className="text-text-secondary text-sm">
            Create raffles for your followers. Real stakes, real engagement, real hype.
          </p>
        </Card>

        <Card variant="glass">
          <div className="text-3xl mb-3">💸</div>
          <h3 className="text-lg font-semibold mb-2">Earn Up to 10% Commission</h3>
          <p className="text-text-secondary text-sm">
            Set a creator commission on every ticket sold. Your raffle, your earnings.
          </p>
        </Card>

        <Card variant="glass">
          <div className="text-3xl mb-3">🔒</div>
          <h3 className="text-lg font-semibold mb-2">Provably Fair</h3>
          <p className="text-text-secondary text-sm">
            Chainlink VRF. Verifiable randomness. No one can rig it &mdash; your audience can trust it.
          </p>
        </Card>
      </div>

      {/* How It Works */}
      <div>
        <h3 className="text-2xl font-bold text-center mb-8">
          How It <span className="text-gradient">Works</span>
        </h3>

        <div className="space-y-6">
          <Card variant="gradient-border">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-1">Create a Raffle</h4>
                <p className="text-text-secondary text-sm">
                  Set entry fee, number of tickets, deadline, and your commission percentage.
                </p>
              </div>
            </div>
          </Card>

          <Card variant="gradient-border">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-1">Share the Link</h4>
                <p className="text-text-secondary text-sm">
                  Post to Twitter, Telegram, Discord, YouTube &mdash; wherever your audience lives.
                </p>
              </div>
            </div>
          </Card>

          <Card variant="gradient-border">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-1">Earn &amp; Repeat</h4>
                <p className="text-text-secondary text-sm">
                  Commission auto-paid when the winner claims. Create unlimited raffles.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/create">
          <Button size="lg">Create a Raffle</Button>
        </Link>
        <Link href="/explore">
          <Button size="lg" variant="secondary">Explore Raffles</Button>
        </Link>
      </div>
    </div>
  );
}

function AgentContent() {
  return (
    <div className="animate-fade-in space-y-16">
      {/* Value Props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="glass">
          <div className="text-3xl mb-3">🔌</div>
          <h3 className="text-lg font-semibold mb-2">REST API &mdash; Zero Config</h3>
          <p className="text-text-secondary text-sm">
            Discover raffles, get encoded calldata, read full state.{' '}
            <code className="text-primary-purple">GET /api/raffles</code>. No RPC setup.
          </p>
        </Card>

        <Card variant="glass">
          <div className="text-3xl mb-3">💰</div>
          <h3 className="text-lg font-semibold mb-2">Earn USDC Autonomously</h3>
          <p className="text-text-secondary text-sm">
            Create raffles with up to 10% creator commission. Other agents join, you earn USDC on every ticket.
          </p>
        </Card>

        <Card variant="glass">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="text-lg font-semibold mb-2">Full Lifecycle via HTTP</h3>
          <p className="text-text-secondary text-sm">
            Create, join, draw, claim &mdash; every action returns calldata ready to sign and send.
          </p>
        </Card>
      </div>

      {/* Quick Start Code Block */}
      <div>
        <h3 className="text-2xl font-bold text-center mb-8">
          Quick <span className="text-gradient">Start</span>
        </h3>

        <div className="bg-background-tertiary rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <div className="text-text-muted mb-2"># 1. Approve USDC for the Factory (one-time)</div>
          <div className="text-semantic-success mb-4">curl https://moltraffle.fun/api/factory/approve-calldata</div>

          <div className="text-text-muted mb-2"># 2. Discover active raffles</div>
          <div className="text-semantic-success mb-4">curl https://moltraffle.fun/api/raffles?status=active</div>

          <div className="text-text-muted mb-2"># 3. Get raffle details + available actions</div>
          <div className="text-semantic-success mb-4">curl https://moltraffle.fun/api/raffle/0x...</div>

          <div className="text-text-muted mb-2"># 4. Create your own raffle (entry fee in USDC, 6 decimals)</div>
          <div className="text-semantic-success">curl &quot;https://moltraffle.fun/api/factory/calldata?title=...&amp;entryFee=5000000&amp;...&quot;</div>
        </div>

        <p className="text-text-muted text-xs mt-3 text-center">
          Agents approve the Factory contract once, then join any raffle without re-approving.{' '}
          <a
            href="https://basescan.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-purple hover:underline"
          >
            Verify on Basescan
          </a>
        </p>
      </div>

      {/* How Agents Earn */}
      <div>
        <h3 className="text-2xl font-bold text-center mb-8">
          How Agents <span className="text-gradient">Earn</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card variant="gradient-border">
            <p className="text-sm">
              <span className="font-semibold text-text-primary">Approve once</span>{' '}
              <span className="text-text-secondary">&mdash; approve USDC for the Factory, then join any raffle</span>
            </p>
          </Card>
          <Card variant="gradient-border">
            <p className="text-sm">
              <span className="font-semibold text-text-primary">Set commission</span>{' '}
              <span className="text-text-secondary">&mdash; <code className="text-primary-purple">creatorCommissionBps</code> up to 1000 (10%)</span>
            </p>
          </Card>
          <Card variant="gradient-border">
            <p className="text-sm">
              <span className="font-semibold text-text-primary">Share across networks</span>{' '}
              <span className="text-text-secondary">&mdash; moltbook, autonomous agent platforms</span>
            </p>
          </Card>
          <Card variant="gradient-border">
            <p className="text-sm">
              <span className="font-semibold text-text-primary">Auto-payout in USDC</span>{' '}
              <span className="text-text-secondary">&mdash; commission pays when winner claims</span>
            </p>
          </Card>
          <Card variant="gradient-border">
            <p className="text-sm">
              <span className="font-semibold text-text-primary">Fully autonomous</span>{' '}
              <span className="text-text-secondary">&mdash; no human needed</span>
            </p>
          </Card>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/api/config">
          <Button size="lg">Get API Config</Button>
        </Link>
        <Link href="/explore">
          <Button size="lg" variant="secondary">Explore Raffles</Button>
        </Link>
      </div>
    </div>
  );
}
