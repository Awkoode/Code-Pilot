import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarItem {
  id: string;
  label: string;
  icon?: ReactNode;
  to?: string;
  badge?: string | number;
  children?: SidebarItem[];
}

interface SidebarProps {
  items: SidebarItem[];
  title?: string;
  logo?: ReactNode;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ items, title, logo, collapsed = false, onToggle }: SidebarProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isActive = (to?: string) => {
    if (!to) return false;
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <aside
      className={`
        flex h-screen flex-col border-r border-border bg-surface transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            {logo}
            {title && <span className="font-bold text-white">{title}</span>}
          </div>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-elevated hover:text-white"
          >
            <svg
              className={`h-5 w-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {items.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.has(item.id);
            const active = isActive(item.to);

            return (
              <li key={item.id}>
                {item.to ? (
                  <Link
                    to={item.to}
                    className={`
                      flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
                      transition-all duration-200
                      ${active
                        ? 'bg-primary/10 text-primary'
                        : 'text-slate-400 hover:bg-elevated hover:text-white'
                      }
                    `}
                    title={collapsed ? item.label : undefined}
                  >
                    {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                ) : (
                  <button
                    onClick={() => hasChildren && toggleExpanded(item.id)}
                    className={`
                      flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
                      transition-all duration-200
                      ${active
                        ? 'bg-primary/10 text-primary'
                        : 'text-slate-400 hover:bg-elevated hover:text-white'
                      }
                    `}
                    title={collapsed ? item.label : undefined}
                  >
                    {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {hasChildren && (
                          <svg
                            className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </>
                    )}
                  </button>
                )}
                {hasChildren && isExpanded && !collapsed && (
                  <ul className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
                    {item.children!.map((child) => (
                      <li key={child.id}>
                        <Link
                          to={child.to!}
                          className={`
                            flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm
                            transition-all duration-200
                            ${isActive(child.to)
                              ? 'bg-primary/10 text-primary'
                              : 'text-slate-500 hover:bg-elevated hover:text-white'
                            }
                          `}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
