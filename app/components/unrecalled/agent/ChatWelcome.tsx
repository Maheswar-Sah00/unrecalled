// Empty state for the full /chat page: the brand crest on a glass tile, a big
// serif question, a short lede and suggestion chips that hand a
// prompt to the composer and send it.
import { IconFileText, IconMessage2, IconSearch } from "@tabler/icons-react";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/unrecalled/premium";

export const AGENT_SUGGESTIONS = [
  "Is my 2021 Wrangler’s steering shake covered?",
  "What problems do 2021 Tesla Model 3 owners report that nobody fixes?",
  "Draft a petition for the Jeep Wrangler death wobble",
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
        What’s wrong with your car?
      </h1>
      <p
        className="ur-lede ur-reveal"
        style={{ ["--ur-delay" as string]: "140ms" }}
      >
        Tell me your car and what it’s doing. I’ll check what owners report to
        NHTSA, whether a recall covers it, and draft a petition if nothing does.
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
        Drafts for you. You read it and send it; it never sends anything.
      </p>
    </div>
  );
}
