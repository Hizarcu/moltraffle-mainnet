import { Raffle } from '@/lib/types/raffle';
import { formatNumber } from '@/lib/utils/formatting';

interface RaffleStatsProps {
  raffle: Raffle;
}

export function RaffleStats({ raffle }: RaffleStatsProps) {
  const fillPercentage = raffle.maxParticipants
    ? (raffle.currentParticipants / raffle.maxParticipants) * 100
    : 0;

  const stats = [
    {
      label: 'Entry Fee',
      value: raffle.entryFeeFormatted,
      color: 'text-primary-purple',
    },
    {
      label: 'Prize Pool',
      value: raffle.totalPrizePoolFormatted,
      color: 'text-semantic-success',
    },
    {
      label: 'Participants',
      value: raffle.maxParticipants
        ? `${formatNumber(raffle.currentParticipants)} / ${formatNumber(raffle.maxParticipants)}`
        : formatNumber(raffle.currentParticipants),
      color: 'text-text-primary',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-4">
            <div className="text-text-muted text-sm mb-1">{stat.label}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar (if max participants set) */}
      {raffle.maxParticipants && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">Fill Rate</span>
            <span className="text-sm font-semibold">
              {Math.round(fillPercentage)}%
            </span>
          </div>
          <div className="w-full h-3 bg-background-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary transition-all duration-300"
              style={{ width: `${Math.min(fillPercentage, 100)}%` }}
            />
          </div>
          {fillPercentage >= 100 && (
            <p className="text-sm text-semantic-warning mt-2">
              Maximum participants reached
            </p>
          )}
        </div>
      )}
    </div>
  );
}
