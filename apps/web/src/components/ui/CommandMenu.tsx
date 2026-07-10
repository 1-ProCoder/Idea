import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  LayoutDashboard,
  PhoneCall,
  Search,
  Settings as SettingsIcon,
  Users,
  type LucideIcon,
} from 'lucide-react';

type CommandItem = {
  key: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  run: () => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CommandMenu({ open, onClose }: Props) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);

  const items = useMemo<CommandItem[]>(
    () => [
      {
        key: 'go:dashboard',
        label: 'Go to Dashboard',
        hint: '⌘1',
        icon: LayoutDashboard,
        run: () => navigate('/dashboard'),
      },
      {
        key: 'go:calls',
        label: 'Go to Calls',
        hint: '⌘2',
        icon: PhoneCall,
        run: () => navigate('/calls'),
      },
      {
        key: 'go:technicians',
        label: 'Go to Technicians',
        hint: '⌘3',
        icon: Users,
        run: () => navigate('/technicians'),
      },
      {
        key: 'go:schedule',
        label: 'Go to Schedule',
        hint: '⌘4',
        icon: Calendar,
        run: () => navigate('/schedule'),
      },
      {
        key: 'go:settings',
        label: 'Go to Settings',
        hint: '⌘5',
        icon: SettingsIcon,
        run: () => navigate('/settings'),
      },
    ],
    [navigate],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) => i.label.toLowerCase().includes(q) || i.key.toLowerCase().includes(q),
    );
  }, [items, query]);

  // Reset filter + focus when opened.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setHighlight(0);
    // Focus the input after the dialog mounts.
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (highlight >= filtered.length) setHighlight(0);
  }, [filtered, highlight, open]);

  if (!open) return null;

  function run(item: CommandItem) {
    item.run();
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command menu"
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm cursor-default"
      />
      <div className="relative w-full max-w-xl glass-card-strong rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
        <div className="flex items-center gap-2 px-4 h-12 border-b border-white/[0.08]">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a destination, action…"
            className="flex-1 h-12 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlight((h) => Math.min(filtered.length - 1, h + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlight((h) => Math.max(0, h - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                const it = filtered[highlight];
                if (it) run(it);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] text-muted-foreground">
            esc
          </kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              No matches.
            </li>
          )}
          {filtered.map((it, idx) => {
            const Icon = it.icon;
            const isActive = idx === highlight;
            return (
              <li key={it.key}>
                <button
                  type="button"
                  onClick={() => run(it)}
                  onMouseEnter={() => setHighlight(idx)}
                  className={[
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    isActive
                      ? 'bg-white/[0.06] text-foreground'
                      : 'text-muted-foreground hover:bg-white/[0.04]',
                  ].join(' ')}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-sm font-medium">
                    {it.label}
                  </span>
                  {it.hint && (
                    <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] text-muted-foreground">
                      {it.hint}
                    </kbd>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
