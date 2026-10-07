import { useState, type ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

export function Tabs({ tabs, defaultTab, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id);

  return (
    <div className={className}>
      <div
        role="tablist"
        className="flex gap-1 rounded-lg border border-border bg-surface p-1"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium
              transition-all duration-300 ease-out
              ${activeTab === tab.id
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-elevated'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`tabpanel-${tab.id}`}
            aria-labelledby={tab.id}
            className={`
              transition-all duration-300 ease-out
              ${activeTab === tab.id ? 'opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-2'}
            `}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
