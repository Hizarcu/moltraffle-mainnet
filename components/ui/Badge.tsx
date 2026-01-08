import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'error' | 'warning' | 'info' | 'default';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium';

    const variantStyles = {
      success: 'bg-semantic-success/20 text-semantic-success border border-semantic-success/30',
      error: 'bg-semantic-error/20 text-semantic-error border border-semantic-error/30',
      warning: 'bg-semantic-warning/20 text-semantic-warning border border-semantic-warning/30',
      info: 'bg-semantic-info/20 text-semantic-info border border-semantic-info/30',
      default: 'bg-background-tertiary text-text-secondary border border-border',
    };

    return (
      <span
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
