import {
  Combine,
  Scissors,
  FileArchive,
  FileType,
  ImageDown,
  Landmark,
  TrendingUp,
  PiggyBank,
  CalendarClock,
  Receipt,
  Banknote,
  Percent,
  Wallet,
  FileImage,
  Move,
  Repeat,
  FileText,
  Calculator,
  Image as ImageIcon,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  combine: Combine,
  scissors: Scissors,
  'file-archive': FileArchive,
  'file-type': FileType,
  'image-down': ImageDown,
  landmark: Landmark,
  'trending-up': TrendingUp,
  'piggy-bank': PiggyBank,
  'calendar-clock': CalendarClock,
  receipt: Receipt,
  banknote: Banknote,
  percent: Percent,
  wallet: Wallet,
  'file-image': FileImage,
  move: Move,
  repeat: Repeat,
  'file-text': FileText,
  calculator: Calculator,
  image: ImageIcon,
};

export function ToolIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? Wrench;
  return <Icon className={className} aria-hidden="true" strokeWidth={1.75} />;
}
