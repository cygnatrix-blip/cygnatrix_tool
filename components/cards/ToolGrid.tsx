import type { ToolConfig } from '@/types/tool';
import { ToolCard } from './ToolCard';
import { cn } from '@/lib/cn';

export function ToolGrid({
  tools,
  showCategory = false,
  className,
}: {
  tools: ToolConfig[];
  showCategory?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} showCategory={showCategory} />
      ))}
    </div>
  );
}
