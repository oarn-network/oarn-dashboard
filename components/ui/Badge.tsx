'use client';

import { type HTMLAttributes } from 'react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'accent';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

function Badge({ children, variant = 'default', size = 'md', className = '', ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';

  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-surface text-text-muted border border-border',
    primary: 'bg-primary/20 text-primary-light border border-primary/50',
    success: 'bg-success/20 text-success border border-success/50',
    warning: 'bg-warning/20 text-warning border border-warning/50',
    error: 'bg-error/20 text-error border border-error/50',
    accent: 'bg-accent/20 text-accent border border-accent/50',
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

// Status badge for tasks
interface StatusBadgeProps {
  status: 'pending' | 'active' | 'consensus' | 'completed' | 'disputed' | 'cancelled' | 'expired';
  size?: BadgeSize;
}

function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config: Record<string, { variant: BadgeVariant; label: string }> = {
    pending: { variant: 'warning', label: 'Pending' },
    active: { variant: 'accent', label: 'Active' },
    consensus: { variant: 'accent', label: 'Consensus' },
    completed: { variant: 'success', label: 'Completed' },
    disputed: { variant: 'error', label: 'Disputed' },
    cancelled: { variant: 'error', label: 'Cancelled' },
    expired: { variant: 'error', label: 'Expired' },
  };

  const { variant, label } = config[status] || config.pending;

  return (
    <Badge variant={variant} size={size}>
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          variant === 'warning'
            ? 'bg-warning'
            : variant === 'accent'
            ? 'bg-accent'
            : variant === 'success'
            ? 'bg-success'
            : 'bg-error'
        }`}
      />
      {label}
    </Badge>
  );
}

// Framework badge
interface FrameworkBadgeProps {
  framework: 'ONNX' | 'PyTorch' | 'TensorFlow' | string;
  size?: BadgeSize;
}

function FrameworkBadge({ framework, size = 'sm' }: FrameworkBadgeProps) {
  const config: Record<string, string> = {
    ONNX: 'badge-onnx',
    PyTorch: 'badge-pytorch',
    TensorFlow: 'badge-tensorflow',
  };

  const badgeClass = config[framework] || 'bg-surface text-text-muted';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border border-transparent ${badgeClass} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      }`}
    >
      {framework}
    </span>
  );
}

export { Badge, StatusBadge, FrameworkBadge };
export type { BadgeProps, BadgeVariant, StatusBadgeProps, FrameworkBadgeProps };
