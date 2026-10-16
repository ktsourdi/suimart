import { userLabel } from '../lib/users';
import { cn } from './ui/cn';

export interface UserNameProps {
  address?: string | null;
  /** The connected wallet: shown as "You". */
  viewer?: string | null;
  /** Size and colour; the font follows the label (sans for names, mono for addresses). */
  className?: string;
}

/**
 * A person as every page names them: "You", their .sui handle, or a short address.
 * The full address is always in the tooltip.
 */
export default function UserName({ address, viewer, className }: UserNameProps) {
  const { label, kind } = userLabel(address, viewer);
  return (
    <span title={address ?? undefined} className={cn('truncate', kind === 'address' ? 'font-mono' : 'font-sans', className)}>
      {label}
    </span>
  );
}

export { UserName };
