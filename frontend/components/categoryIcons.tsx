import {
  Disc3,
  Gamepad2,
  Gem,
  Hexagon,
  Orbit,
  Palette,
  Shapes,
  Trophy,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';
import { categoryKey } from '../lib/categories';

/** One lucide icon per category id from lib/categories.ts. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  nfts: Hexagon,
  gaming: Gamepad2,
  art: Palette,
  collectibles: Gem,
  music: Disc3,
  sports: Trophy,
  'virtual-worlds': Orbit,
  other: Shapes,
};

/** Icon for a category id or display name ("NFTs", "virtual-worlds"); falls back to Shapes. */
export function categoryIcon(category?: string): LucideIcon {
  return CATEGORY_ICONS[categoryKey(category)] ?? Shapes;
}

/** <CategoryIcon category={listing.category} className="h-4 w-4" /> */
export function CategoryIcon({ category, strokeWidth = 1.75, ...props }: { category?: string } & LucideProps) {
  const Icon = categoryIcon(category);
  return <Icon aria-hidden="true" strokeWidth={strokeWidth} {...props} />;
}

export default CATEGORY_ICONS;
