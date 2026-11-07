// Empty state for the full /chat page: the brand crest on a glass tile, a big
// serif question, a short lede and suggestion chips that hand a
// prompt to the composer and send it.
import { IconFileText, IconMessage2, IconSearch } from "@tabler/icons-react";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/unrecalled/premium";

export const AGENT_SUGGESTIONS = [
  "Find gaps for the 2021–2023 Jeep Wrangler",
  "Explain the death wobble cluster",
  "Draft a petition for the biggest gap",
] as const;

const CHIP_ICONS: ReactNode[] = [
  <IconSearch key="s" aria-hidden="true" />,
  <IconMessage2 key="m" aria-hidden="true" />,
  <IconFileText key="f" aria-hidden="true" />,
];

/** Types `text` into the visible agent composer and submits it. */
export function sendToComposer(text: string, scope?: Element | null) {
  if (typeof document === "undefined") return;
  const root = scope ?? document;
  const editor = root.querySelector<HTMLElement>(
    '[data-agent-composer-slot="editor-input"]',
  );
  if (!editor) return;
  editor.focus();
  const selection = window.getSelection();
  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  document.execCommand("insertText", false, text);
  window.setTimeout(() => {
    editor.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
      }),
    );
  }, 60);
}

export function ChatWelcome() {
  return (
    <div className="ur-chat-welcome agentkit-chat-empty-copy">
      <div
        className="ur-chat-welcome__crest ur-pop"
        style={{ ["--ur-delay" as string]: "0ms" }}
      >
        <BrandMark className="size-9" />
      </div>
      <h1
        className="ur-display ur-reveal"
        style={{ ["--ur-delay" as string]: "80ms" }}
      >
        What should we investigate?
      </h1>
      <p
        className="ur-lede ur-reveal"
        style={{ ["--ur-delay" as string]: "140ms" }}
      >
        Name a car. I’ll read every owner complaint sent to NHTSA, find the
        problems no recall covers, and help you write the petition.
      </p>
      <div
        className="ur-chat-welcome__chips ur-reveal"
        style={{ ["--ur-delay" as string]: "200ms" }}
      >
        {AGENT_SUGGESTIONS.map((s, i) => (
          <button
            key={s}
            type="button"
            className="ur-chip"
            onClick={(e) =>
              sendToComposer(s, e.currentTarget.closest(".agentkit-chat"))
            }
          >
            {CHIP_ICONS[i]}
            {s}
          </button>
        ))}
      </div>
      <p
        className="ur-chat-welcome__trust ur-reveal"
        style={{ ["--ur-delay" as string]: "260ms" }}
      >
        <span className="ur-agent-badge">Agent</span>
        Drafts for you. You review and file; it never files.
      </p>
    </div>
  );
}
