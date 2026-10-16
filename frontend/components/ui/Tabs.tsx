'use client';

import { KeyboardEvent, ReactNode, useId, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from './cn';

export interface TabItem {
  id: string;
  label: ReactNode;
  /** Panel content. Omit it to render only the tab bar and show content yourself. */
  content?: ReactNode;
  /** Small count pill after the label. */
  count?: number;
  icon?: LucideIcon;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'underline' | 'pills';
  /** Accessible name of the tab list. */
  label?: string;
  className?: string;
  listClassName?: string;
  panelClassName?: string;
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg';
// Tab rows scroll sideways, which clips an outer ring: draw it inside instead.
const insetFocusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent';

/** Moves focus with the arrow keys across a row of buttons and selects the target. */
function useRovingKeys<T extends string>(ids: T[], current: T, select: (id: T) => void, isDisabled: (id: T) => boolean) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const enabled = ids.filter((id) => !isDisabled(id));
    if (enabled.length === 0) return;
    const index = Math.max(0, enabled.indexOf(current));
    let next: T | undefined;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = enabled[(index + 1) % enabled.length];
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = enabled[(index - 1 + enabled.length) % enabled.length];
    else if (e.key === 'Home') next = enabled[0];
    else if (e.key === 'End') next = enabled[enabled.length - 1];
    if (next === undefined) return;
    e.preventDefault();
    select(next);
    refs.current[next]?.focus();
  };
  return { refs, onKeyDown };
}

const Tabs = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'underline',
  label,
  className,
  listClassName,
  panelClassName,
}: TabsProps) => {
  const baseId = useId();
  const { refs, onKeyDown } = useRovingKeys(
    tabs.map((t) => t.id),
    activeTab,
    onTabChange,
    (id) => !!tabs.find((t) => t.id === id)?.disabled
  );
  const active = tabs.find((t) => t.id === activeTab);
  const pills = variant === 'pills';

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        className={cn(
          'no-scrollbar flex overflow-x-auto',
          pills ? 'inline-flex max-w-full gap-1 rounded-control border border-line bg-surface p-1' : 'gap-6 border-b border-line',
          listClassName
        )}
      >
        {tabs.map((tab) => {
          const selected = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[tab.id] = el;
              }}
              id={`${baseId}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={tab.content !== undefined ? `${baseId}-panel-${tab.id}` : undefined}
              tabIndex={selected ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={onKeyDown}
              className={cn(
                'relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-40',
                insetFocusRing,
                pills
                  ? cn(
                      'h-8 rounded-lg px-3 text-[13px]',
                      selected ? 'bg-surface-3 text-fg shadow-inset-line' : 'text-fg-muted hover:text-fg'
                    )
                  : cn(
                      'h-11 rounded-t-md text-sm after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:transition-colors',
                      selected ? 'text-fg after:bg-accent' : 'text-fg-subtle after:bg-transparent hover:text-fg-muted'
                    )
              )}
            >
              {Icon && <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />}
              {tab.label}
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums',
                    selected ? 'bg-accent/15 text-accent' : 'bg-surface-3 text-fg-muted'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {active && active.content !== undefined && (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${active.id}`}
          aria-labelledby={`${baseId}-tab-${active.id}`}
          tabIndex={0}
          className={cn('mt-6 rounded-md focus-visible:outline-none', panelClassName)}
        >
          {active.content}
        </div>
      )}
    </div>
  );
};

export default Tabs;
export { Tabs };

/* ----------------------------------------------------------------------------
   SegmentedControl: a radio group that looks like pills (Fixed price / Auction).
---------------------------------------------------------------------------- */
export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name of the group (required when there is no visible label). */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  size?: 'sm' | 'md';
  /** Stretch to the container width with equal segments. */
  fullWidth?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className,
  ...aria
}: SegmentedControlProps<T>) {
  const { refs, onKeyDown } = useRovingKeys(
    options.map((o) => o.value),
    value,
    onChange,
    (v) => !!options.find((o) => o.value === v)?.disabled
  );

  return (
    <div
      role="radiogroup"
      aria-label={aria['aria-label']}
      aria-labelledby={aria['aria-labelledby']}
      className={cn(
        'gap-1 rounded-control border border-line-strong bg-surface p-1',
        fullWidth ? 'grid w-full auto-cols-fr grid-flow-col' : 'inline-flex',
        className
      )}
    >
      {options.map((o) => {
        const checked = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[o.value] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            onKeyDown={onKeyDown}
            className={cn(
              'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-40',
              focusRing,
              size === 'sm' ? 'h-7 px-2.5 text-[13px]' : 'h-9 px-3.5 text-sm',
              checked ? 'bg-surface-3 text-fg shadow-[inset_0_1px_0_0_rgb(255_255_255/0.06),0_1px_2px_0_rgb(0_0_0/0.4)]' : 'text-fg-muted hover:text-fg'
            )}
          >
            {Icon && <Icon aria-hidden="true" className={cn('h-4 w-4', checked ? 'text-accent' : '')} strokeWidth={1.75} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
