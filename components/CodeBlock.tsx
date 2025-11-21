import React, { useState } from 'react';
import { Copy, Check } from './Icons';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'python' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-white/10 bg-[#0d0d10]">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <span className="text-xs font-mono text-zinc-400 lowercase">{language}</span>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-zinc-400 hover:text-white"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono text-blue-100">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;