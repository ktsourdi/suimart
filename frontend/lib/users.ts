import { MOCK_MODE } from './config';
import { truncateAddress } from './format';
import { mockUsers, type MockUser } from './mockData';

// How the app names a person, so the same wallet reads the same on every page:
// "You" for the connected wallet, the .sui handle for a known demo user, else a short address.

function sameAddress(a?: string | null, b?: string | null): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

/** The demo users have handles and ratings; real addresses do not. */
export function knownUser(address?: string | null): MockUser | null {
  if (!MOCK_MODE || !address) return null;
  return mockUsers.find((u) => sameAddress(u.address, address)) ?? null;
}

export type UserLabelKind = 'you' | 'handle' | 'address';

export interface UserLabel {
  label: string;
  /** 'address' labels are hex and read best in the mono font; the others are words. */
  kind: UserLabelKind;
}

export function userLabel(address?: string | null, viewer?: string | null): UserLabel {
  if (sameAddress(address, viewer)) return { label: 'You', kind: 'you' };
  const user = knownUser(address);
  if (user) return { label: user.name, kind: 'handle' };
  return { label: truncateAddress(address, 6, 4), kind: 'address' };
}

/** "You", "kestrel.sui" or "0xabcd…ef12". */
export function displayName(address?: string | null, viewer?: string | null): string {
  return userLabel(address, viewer).label;
}
