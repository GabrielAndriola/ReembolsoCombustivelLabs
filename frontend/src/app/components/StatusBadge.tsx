import React from 'react';
import { Check, Clock, X } from 'lucide-react';
import { Badge } from './ui/badge';

interface StatusBadgeProps {
  status: 'approved' | 'pending' | 'rejected';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = {
    approved: {
      label: 'Aprovado',
      icon: Check,
      variant: 'default' as const,
      className: 'border-transparent bg-[#1F63D8] text-white shadow-sm'
    },
    pending: {
      label: 'Pendente',
      icon: Clock,
      variant: 'secondary' as const,
      className: 'border-[#A9D9F5] bg-[#EAF7FF] text-[#21456E] shadow-sm'
    },
    rejected: {
      label: 'Rejeitado',
      icon: X,
      variant: 'destructive' as const,
      className: ''
    }
  };

  const { label, icon: Icon, variant, className } = config[status];

  return (
    <Badge variant={variant} className={`gap-1 ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
};
