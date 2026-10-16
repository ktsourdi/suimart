'use client';

import {
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  Ref,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import Select from './Select';
import { cn } from './cn';

/* ----------------------------------------------------------------------------
   Dropdown (legacy API): a styled native select. Kept for older markup.
---------------------------------------------------------------------------- */
interface DropdownProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Accessible name when there is no visible label. */
  'aria-label'?: string;
}

const Dropdown = ({ options, value, onChange, placeholder, className, ...rest }: DropdownProps) => (
  <Select
    options={options}
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    containerClassName={className}
    aria-label={rest['aria-label']}
  />
);

export default Dropdown;

/* ----------------------------------------------------------------------------
   Menu: an accessible popover menu (wallet menu, overflow actions).

   <Menu
     align="end"
     trigger={(props) => <button {...props} className="...">Open</button>}
   >
     <MenuItem icon={UserRound} href="/profile">View profile</MenuItem>
     <MenuSeparator />
     <MenuItem icon={LogOut} tone="danger" onSelect={disconnect}>Disconnect</MenuItem>
   </Menu>
---------------------------------------------------------------------------- */

export interface MenuTriggerProps {
  ref: Ref<HTMLButtonElement>;
  id: string;
  type: 'button';
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
  'aria-controls': string | undefined;
  onClick: () => void;
  onKeyDown: (e: ReactKeyboardEvent<HTMLButtonElement>) => void;
}

interface MenuContextValue {
  close: (focusTrigger?: boolean) => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

function menuItems(panel: HTMLElement | null): HTMLElement[] {
  return Array.from(panel?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []);
}

export interface MenuProps {
  trigger: (props: MenuTriggerProps) => ReactNode;
  children: ReactNode;
  /** Optional non-interactive block at the top of the panel (e.g. account summary). */
  header?: ReactNode;
  /** Which edge of the trigger the panel lines up with. */
  align?: 'start' | 'end';
  /** Accessible name of the menu. */
  label?: string;
  className?: string;
  panelClassName?: string;
}

export function Menu({ trigger, children, header, align = 'end', label, className, panelClassName }: MenuProps) {
  const [open, setOpen] = useState(false);
  const baseId = useId();
  const triggerId = `menu-trigger-${baseId}`;
  const panelId = `menu-panel-${baseId}`;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const focusOnOpen = useRef<'first' | 'last'>('first');

  const items = () => menuItems(panelRef.current);

  const close = useCallback((focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }, []);

  // Focus the first (or last) item when the menu opens.
  useEffect(() => {
    if (!open) return;
    const list = menuItems(panelRef.current);
    const target = focusOnOpen.current === 'last' ? list[list.length - 1] : list[0];
    target?.focus();
  }, [open]);

  // Close on outside pointer down.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const onTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      focusOnOpen.current = e.key === 'ArrowUp' ? 'last' : 'first';
      setOpen(true);
    }
  };

  const onPanelKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLElement);
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        list[(index + 1) % list.length]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        list[(index - 1 + list.length) % list.length]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        list[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        list[list.length - 1]?.focus();
        break;
      case 'Escape':
        e.preventDefault();
        close(true);
        break;
      case 'Tab':
        close(false);
        break;
    }
  };

  return (
    <MenuContext.Provider value={{ close }}>
      <div ref={wrapperRef} className={cn('relative inline-flex', className)}>
        {trigger({
          ref: triggerRef,
          id: triggerId,
          type: 'button',
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          'aria-controls': open ? panelId : undefined,
          onClick: () => {
            focusOnOpen.current = 'first';
            setOpen((v) => !v);
          },
          onKeyDown: onTriggerKeyDown,
        })}
        {open && (
          <div
            ref={panelRef}
            id={panelId}
            role="menu"
            aria-label={label}
            aria-labelledby={label ? undefined : triggerId}
            onKeyDown={onPanelKeyDown}
            className={cn(
              'absolute top-full z-50 mt-2 min-w-[15rem] rounded-xl border border-line-strong bg-surface-2/95 p-1.5 shadow-popover backdrop-blur-xl motion-safe:animate-pop-in',
              align === 'end' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
              panelClassName
            )}
          >
            {header && (
              <div role="presentation" className="mb-1.5 border-b border-line px-2.5 pb-2.5 pt-1.5">
                {header}
              </div>
            )}
            {children}
          </div>
        )}
      </div>
    </MenuContext.Provider>
  );
}

export interface MenuItemProps {
  children: ReactNode;
  icon?: LucideIcon;
  /** Navigates with next/link. */
  href?: string;
  /** Opens in a new tab (external links). */
  external?: boolean;
  onSelect?: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
  /** Right-aligned hint (a shortcut, a count). */
  hint?: ReactNode;
}

export function MenuItem({ children, icon: Icon, href, external, onSelect, tone = 'default', disabled, hint }: MenuItemProps) {
  const ctx = useContext(MenuContext);
  const classes = cn(
    'flex h-9 w-full cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 text-left text-sm outline-none transition-colors',
    tone === 'danger'
      ? 'text-danger hover:bg-danger/10 focus:bg-danger/10'
      : 'text-fg-muted hover:bg-surface-3 hover:text-fg focus:bg-surface-3 focus:text-fg',
    disabled && 'pointer-events-none opacity-50'
  );
  const content = (
    <>
      {Icon && <Icon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.75} />}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint && <span className="shrink-0 text-xs text-fg-subtle">{hint}</span>}
    </>
  );

  if (href && !disabled) {
    if (external) {
      return (
        <a role="menuitem" tabIndex={-1} href={href} target="_blank" rel="noreferrer" className={classes} onClick={() => ctx?.close(false)}>
          {content}
        </a>
      );
    }
    return (
      <Link role="menuitem" tabIndex={-1} href={href} className={classes} onClick={() => ctx?.close(false)}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      className={classes}
      onClick={() => {
        if (disabled) return;
        onSelect?.();
        ctx?.close(true);
      }}
    >
      {content}
    </button>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="my-1.5 h-px bg-line" />;
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="eyebrow px-2.5 pb-1 pt-2">{children}</div>;
}
