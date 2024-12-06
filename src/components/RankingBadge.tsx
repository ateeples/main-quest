import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RankingBadgeProps {
  label: string;
  value?: string;
  type: 'area' | 'population';
}

export function RankingBadge({ label, value = 'Loading...', type }: RankingBadgeProps) {
  const getVariant = () => {
    if (type === 'area') {
      switch (value) {
        case 'Urban':
          return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
        case 'Suburban':
          return 'bg-green-100 text-green-800 hover:bg-green-200';
        case 'Rural':
          return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
        default:
          return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      }
    }
    return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
      <span className="text-sm text-muted-foreground whitespace-nowrap">{label}:</span>
      <Badge variant="secondary" className={cn('text-sm whitespace-nowrap', getVariant())}>
        {value}
      </Badge>
    </div>
  );
}