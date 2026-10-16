import Link from 'next/link';
import { ArrowUpRight, FileCode2, Github } from 'lucide-react';
import { MOCK_MODE, SUI_NETWORK } from '../lib/config';
import { Logo } from './SiteHeader';

const EXTERNAL_LINKS = [
  { href: 'https://github.com/ktsourdi/suimart', label: 'GitHub', icon: Github },
  {
    href: 'https://github.com/ktsourdi/suimart/blob/main/contracts/sources/Suimart.move',
    label: 'Move contract',
    icon: FileCode2,
  },
];

const NETWORK_LABEL = SUI_NETWORK.charAt(0).toUpperCase() + SUI_NETWORK.slice(1);

const NAV_LINKS = [
  { href: '/', label: 'Explore' },
  { href: '/sell', label: 'Sell' },
  { href: '/profile', label: 'Profile' },
];

const linkClasses =
  'focus-ring inline-flex items-center gap-2 rounded-md text-sm text-fg-muted transition-colors hover:text-fg';

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line sm:mt-24">
      <div className="container-page py-12">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-6 text-fg-muted">
              A peer-to-peer marketplace on Sui. Demo build: listings and the wallet are simulated.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:gap-16">
            <div>
              <p className="eyebrow">Marketplace</p>
              <ul className="mt-4 space-y-3">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={linkClasses}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow">Source</p>
              <ul className="mt-4 space-y-3">
                {EXTERNAL_LINKS.map((l) => {
                  const Icon = l.icon;
                  return (
                    <li key={l.href}>
                      <a href={l.href} target="_blank" rel="noreferrer" className={linkClasses}>
                        <Icon aria-hidden="true" className="h-4 w-4 text-fg-subtle" strokeWidth={1.75} />
                        {l.label}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col-reverse gap-4 border-t border-line pt-6 text-[13px] text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <a
            href="https://www.hellenicweb3.com"
            target="_blank"
            rel="noreferrer"
            className="focus-ring group inline-flex items-center gap-1 rounded-md transition-colors hover:text-fg"
          >
            Built by Hellenic Web3
            <ArrowUpRight
              aria-hidden="true"
              className="h-3.5 w-3.5 transition-transform duration-200 motion-safe:group-hover:-translate-y-px motion-safe:group-hover:translate-x-px"
              strokeWidth={1.75}
            />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <p className="inline-flex items-center gap-2">
            <span aria-hidden="true" className={MOCK_MODE ? 'h-1.5 w-1.5 rounded-full bg-warning' : 'h-1.5 w-1.5 rounded-full bg-success'} />
            <span>
              {MOCK_MODE ? 'Demo mode' : 'Live'} on Sui {NETWORK_LABEL}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export { SiteFooter };
