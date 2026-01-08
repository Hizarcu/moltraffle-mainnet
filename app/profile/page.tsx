import { Card } from '@/components/ui/Card';

export default function ProfilePage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">
          My <span className="text-gradient">Profile</span>
        </h1>
        <p className="text-text-secondary mb-8">
          View your stats and transaction history
        </p>

        <Card variant="glass" className="p-12 text-center">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-semibold mb-2">Coming Soon!</h2>
          <p className="text-text-secondary">
            Your profile with statistics and achievements will be shown here.
          </p>
        </Card>
      </div>
    </div>
  );
}
