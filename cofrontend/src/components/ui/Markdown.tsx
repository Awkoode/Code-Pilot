import { useMemo } from 'react';

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className = '' }: MarkdownProps) {
  const html = useMemo(() => {
    // Simple markdown parser for basic formatting
    return content
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-white mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-white mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="rounded bg-surface px-1.5 py-0.5 font-mono text-sm text-primary">$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre class="rounded-lg bg-surface p-4 overflow-x-auto font-mono text-sm text-slate-300 my-4"><code>$1</code></pre>')
      .replace(/^\- (.*$)/gim, '<li class="ml-4 text-slate-300">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 text-slate-300">$1</li>')
      .replace(/\n\n/g, '</p><p class="mt-4 text-slate-300">')
      .replace(/\n/g, '<br/>');
  }, [content]);

  return (
    <div
      className={`prose prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: `<p class="text-slate-300">${html}</p>` }}
    />
  );
}
