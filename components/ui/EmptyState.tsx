'use client';

import Link from 'next/link';
import { Button } from './Button';
import { Card } from './Card';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon = '📭',
}: EmptyStateProps) {
  return (
    <Card className="p-12 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button>{actionLabel}</Button>
        </Link>
      )}
    </Card>
  );
}
