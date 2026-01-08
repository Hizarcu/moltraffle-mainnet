import { Card } from '@/components/ui/Card';

export default function MyRafflesPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">
          My <span className="text-gradient">Raffles</span>
        </h1>
        <p className="text-text-secondary mb-8">
          View raffles you've created and participated in
        </p>

        <Card variant="glass" className="p-12 text-center">
          <div className="text-6xl mb-4">🎟️</div>
          <h2 className="text-2xl font-semibold mb-2">Coming Soon!</h2>
          <p className="text-text-secondary">
            Track your raffle history and manage your participations here.
          </p>
        </Card>
      </div>
    </div>
  );
}
