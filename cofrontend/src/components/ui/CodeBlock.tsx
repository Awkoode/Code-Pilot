import { useState } from 'react';
import { CopyButton } from './CopyButton';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({ code, language = 'typescript', title, showLineNumbers = true }: CodeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const lines = code.split('\n');
  const isLong = lines.length > 10;
  const displayCode = isLong && !isExpanded ? lines.slice(0, 10).join('\n') : code;

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          {title && <span className="ml-2 text-sm text-slate-400">{title}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-background px-2 py-0.5 text-xs text-slate-500">{language}</span>
          <CopyButton text={code} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm">
          <code className="font-mono text-slate-300">
            {showLineNumbers ? (
              <table className="w-full">
                <tbody>
                  {displayCode.split('\n').map((line, i) => (
                    <tr key={i}>
                      <td className="select-none pr-4 text-right text-slate-600">{i + 1}</td>
                      <td className="whitespace-pre">{line}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              displayCode
            )}
          </code>
        </pre>
      </div>
      {isLong && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full border-t border-border py-2 text-sm text-slate-400 transition-colors hover:bg-elevated hover:text-white"
        >
          {isExpanded ? 'Mostrar menos' : `Mostrar mais ${lines.length - 10} linhas`}
        </button>
      )}
    </div>
  );
}
