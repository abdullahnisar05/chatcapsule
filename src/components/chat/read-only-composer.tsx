import React from 'react';
import { Image as ImageIcon, Mic, Smile } from 'lucide-react';

export function ReadOnlyComposer() {
  return (
    <div className="p-4 z-10 bg-background">
      <div className="flex items-center gap-3 bg-surface-container-high rounded-full px-4 py-2 border border-[#262626]" aria-label="Archived conversation composer">
        <Smile className="h-6 w-6 text-on-surface-variant" aria-hidden="true" />
        <span className="flex-1 text-sm text-on-surface-variant min-h-[32px] flex items-center">
          Archived conversation — replies are disabled
        </span>
        <Mic className="h-6 w-6 text-on-surface-variant" aria-hidden="true" />
        <ImageIcon className="h-6 w-6 text-on-surface-variant" aria-hidden="true" />
      </div>
    </div>
  );
}
