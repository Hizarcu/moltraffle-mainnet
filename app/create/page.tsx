import { Card } from '@/components/ui/Card';

export default function CreatePage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">
          Create <span className="text-gradient">Raffle</span>
        </h1>
        <p className="text-text-secondary mb-8">
          Set up your own raffle with custom rules and prizes
        </p>

        <Card variant="glass" className="p-12 text-center">
          <div className="text-6xl mb-4">✨</div>
          <h2 className="text-2xl font-semibold mb-2">Coming Soon!</h2>
          <p className="text-text-secondary">
            Create your own raffles with our easy-to-use multi-step form.
          </p>
        </Card>
      </div>
    </div>
  );
}
