import {
  loadMarkdown,
  MemoizedMarkdownBlock,
  useMarkdownReady,
} from "@agent-native/toolkit/app/chat/chat/markdown-renderer";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

/** Renders a markdown document with the toolkit's GFM renderer (lazy-loaded). */
export function Markdown({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const ready = useMarkdownReady();
  useEffect(() => {
    loadMarkdown();
  }, []);
  return (
    <div className={cn("ur-doc", className)}>
      {ready ? (
        <MemoizedMarkdownBlock blockText={text} />
      ) : (
        <pre className="whitespace-pre-wrap font-sans">{text}</pre>
      )}
    </div>
  );
}
