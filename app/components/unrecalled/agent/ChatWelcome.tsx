// Empty state for the full /chat page: serif question, short lede and
// suggestion chips that hand a prompt to the composer and send it.
import { BrandMark } from "@/components/unrecalled/premium";

export const AGENT_SUGGESTIONS = [
  "Find gaps for the 2021–2023 Jeep Wrangler",
  "Explain the death wobble cluster",
  "Draft a petition for the biggest gap",
] as const;

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
      <div className="ur-reveal" style={{ ["--ur-delay" as string]: "0ms" }}>
        <span className="ur-chat-welcome__mark">
          <BrandMark className="size-9" />
        </span>
      </div>
      <h1
        className="ur-display ur-reveal"
        style={{ ["--ur-delay" as string]: "60ms" }}
      >
        What should we investigate?
      </h1>
      <p
        className="ur-lede ur-reveal"
        style={{ ["--ur-delay" as string]: "120ms" }}
      >
        Name a car. I’ll read every owner complaint sent to NHTSA, find the
        problems no recall covers, and help you write the petition.
      </p>
      <div
        className="ur-chat-welcome__chips ur-reveal"
        style={{ ["--ur-delay" as string]: "180ms" }}
      >
        {AGENT_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="ur-chip"
            onClick={(e) =>
              sendToComposer(s, e.currentTarget.closest(".agentkit-chat"))
            }
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
