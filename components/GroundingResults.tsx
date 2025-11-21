import React from 'react';
import { ExternalLink } from './Icons';
import { GroundingChunk } from '../types';

interface GroundingResultsProps {
  chunks: GroundingChunk[];
}

const GroundingResults: React.FC<GroundingResultsProps> = ({ chunks }) => {
  if (!chunks || chunks.length === 0) return null;

  // Deduplicate based on URL
  const uniqueChunks = chunks.filter((chunk, index, self) =>
    index === self.findIndex((c) => (
      c.web?.uri === chunk.web?.uri
    ))
  ).slice(0, 4); // Limit to 4 sources

  return (
    <div className="mt-8 pt-6 border-t border-white/10">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
        Sources & Citations
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {uniqueChunks.map((chunk, idx) => (
          chunk.web ? (
            <a 
              key={idx} 
              href={chunk.web.uri} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-xs text-zinc-300 hover:text-blue-300 truncate"
            >
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{chunk.web.title}</span>
            </a>
          ) : null
        ))}
      </div>
    </div>
  );
};

export default GroundingResults;