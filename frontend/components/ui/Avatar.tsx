import { useId } from 'react';
import Image from 'next/image';
import { cn } from './cn';

/* ----------------------------------------------------------------------------
   Identicon: a deterministic gradient avatar for a wallet address.
---------------------------------------------------------------------------- */

/** FNV-1a with a final avalanche mix, 32-bit. Stable across sessions and browsers. */
function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return h >>> 0;
}

export interface IdenticonPalette {
  from: string;
  to: string;
  spot: string;
  angle: number;
  spotX: number;
  spotY: number;
}

/** The colours an address maps to: two analogous hues and a light spot of the first. */
export function identiconPalette(address: string): IdenticonPalette {
  const h = hashString((address || '0x0').toLowerCase());
  const hue1 = h % 360;
  const hue2 = (hue1 + 24 + ((h >>> 9) % 48)) % 360;
  return {
    from: `hsl(${hue1} 78% 60%)`,
    to: `hsl(${hue2} 72% 34%)`,
    spot: `hsl(${(hue1 + 340) % 360} 95% 78%)`,
    angle: (h >>> 5) % 360,
    spotX: 6 + ((h >>> 13) % 28),
    spotY: 6 + ((h >>> 21) % 28),
  };
}

export interface IdenticonProps {
  address: string;
  /** Pixel size (default 32). */
  size?: number;
  /** Adds a hairline ring with a gap, for headers and large avatars. */
  ring?: boolean;
  /** Accessible label. Without it the identicon is decorative (aria-hidden). */
  label?: string;
  className?: string;
}

export function Identicon({ address, size = 32, ring = false, label, className }: IdenticonProps) {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const p = identiconPalette(address);
  const rad = (p.angle * Math.PI) / 180;
  const x1 = 0.5 - Math.cos(rad) / 2;
  const y1 = 0.5 - Math.sin(rad) / 2;

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 overflow-hidden rounded-full',
        'after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]',
        ring && 'ring-1 ring-line-strong ring-offset-2 ring-offset-bg',
        className
      )}
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 40 40" width={size} height={size} className="block" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-g`} x1={x1} y1={y1} x2={1 - x1} y2={1 - y1}>
            <stop offset="0" stopColor={p.from} />
            <stop offset="1" stopColor={p.to} />
          </linearGradient>
          <radialGradient id={`${id}-s`} cx={p.spotX / 40} cy={p.spotY / 40} r="0.55">
            <stop offset="0" stopColor={p.spot} stopOpacity="0.75" />
            <stop offset="1" stopColor={p.spot} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-h`} cx="0.3" cy="0.2" r="0.8">
            <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
            <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="40" height="40" fill={`url(#${id}-g)`} />
        <rect width="40" height="40" fill={`url(#${id}-s)`} />
        <rect width="40" height="40" fill={`url(#${id}-h)`} />
      </svg>
    </span>
  );
}

/* ----------------------------------------------------------------------------
   Avatar: an image, an identicon for an address, or an initial.
---------------------------------------------------------------------------- */

const sizePx = { sm: 32, md: 40, lg: 48, xl: 72 } as const;

interface AvatarProps {
  src?: string;
  alt: string;
  /** Used for an Identicon when there is no image. */
  address?: string;
  size?: keyof typeof sizePx;
  ring?: boolean;
  className?: string;
}

const Avatar = ({ src, alt, address, size = 'md', ring = false, className }: AvatarProps) => {
  const px = sizePx[size];

  if (!src && address) {
    return <Identicon address={address} size={px} ring={ring} label={alt} className={className} />;
  }

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-3 font-display font-semibold text-fg-muted',
        ring && 'ring-1 ring-line-strong ring-offset-2 ring-offset-bg',
        className
      )}
      style={{ width: px, height: px, fontSize: Math.round(px * 0.4) }}
    >
      {src ? (
        <Image src={src} alt={alt} width={px * 2} height={px * 2} className="h-full w-full object-cover" />
      ) : (
        <span aria-label={alt} role="img">
          {alt.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
};

export { Avatar };
export default Avatar;
