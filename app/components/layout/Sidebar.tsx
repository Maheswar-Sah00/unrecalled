import { appPath } from "@agent-native/core/client/api-path";
import { useT } from "@agent-native/core/client/i18n";
import {
  navigateWithAgentChatViewTransition,
  useAgentChatRunningThreads,
  useChatThreads,
} from "@agent-native/toolkit/app/chat/agentkit-chat/rail";
import {
  ownDraftRows,
  OwnershipChatHistoryRail,
  useOwnershipChatHistory,
} from "@agent-native/toolkit/app/chat/ownership-history";
import { OrgSwitcher } from "@agent-native/toolkit/app/org";
import { openCommandMenu } from "@agent-native/toolkit/app/shared";
import {
  IconChartLine,
  IconEdit,
  IconFileText,
  IconListSearch,
  IconRadar,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLoader2,
  IconSearch,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BrandMark } from "@/components/unrecalled/premium";
import { ThemeToggle } from "@/components/unrecalled/ThemeToggle";
import { APP_TITLE } from "@/lib/app-config";
import { chatThreadPath, threadIdFromPath } from "@/lib/chat-paths";
import { cn } from "@/lib/utils";

const CHAT_STORAGE_KEY = "chat";
const CHAT_ACTIVE_THREAD_KEY = `agent-chat-active-thread:${CHAT_STORAGE_KEY}`;

interface SidebarProps {
  collapsed?: boolean;
  collapsible?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

function ThreadHistoryTitle({
  title,
  running,
}: {
  title: string;
  running: boolean;
}) {
  const t = useT();
  const viewportRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const measure = () => {
      const overflow = Math.max(0, content.scrollWidth - viewport.clientWidth);
      const overflowing = overflow > 1;
      setIsOverflowing(overflowing);
      content.style.setProperty("--chat-sidebar-title-shift", `${overflow}px`);
      content.style.setProperty(
        "--chat-sidebar-title-duration",
        `${Math.max(1800, overflow * 24)}ms`,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(content);
    measure();
    return () => observer.disconnect();
  }, [title]);

  return (
    <span className="chat-sidebar-thread-title-shell">
      <span
        ref={viewportRef}
        className="chat-sidebar-thread-title"
        data-overflow={isOverflowing ? "true" : "false"}
      >
        <span ref={contentRef} className="chat-sidebar-thread-title__content">
          {title}
        </span>
      </span>
      {running ? (
        <IconLoader2
          className="chat-sidebar-thread-running size-4 shrink-0 motion-safe:animate-spin"
          strokeWidth={1.8}
          role="status"
          aria-label={t(
            // i18n-key-ignore shared framework catalog
            "agentChat.status.working",
          )}
        />
      ) : null}
    </span>
  );
}

function persistedActiveThreadId() {
  try {
    return localStorage.getItem(CHAT_ACTIVE_THREAD_KEY);
  } catch {
    return null;
  }
}

function persistActiveThreadId(threadId: string) {
  try {
    localStorage.setItem(CHAT_ACTIVE_THREAD_KEY, threadId);
  } catch {}
}

const DOMAIN_LINKS = [
  { to: "/gaps", label: "Gaps", icon: IconRadar },
  { to: "/petitions", label: "Petitions", icon: IconFileText },
  { to: "/backtest", label: "Backtest", icon: IconChartLine },
  { to: "/rules", label: "Rules", icon: IconListSearch },
] as const;

const NAV_ITEM =
  "group flex items-center transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";
const NAV_IDLE =
  "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground";
const NAV_ACTIVE =
  "bg-card text-sidebar-accent-foreground shadow-[0_1px_2px_hsl(var(--foreground)/0.06),0_6px_16px_-10px_hsl(var(--foreground)/0.25)] ring-1 ring-sidebar-border";
const NAV_COLLAPSED = "size-9 justify-center rounded-xl";
const NAV_EXPANDED = "h-9 w-full gap-3 rounded-xl px-3 text-[14px] font-medium";

function DomainNavLinks({ collapsed }: { collapsed: boolean }) {
  const location = useLocation();
  return (
    <div className={cn(collapsed ? "contents" : "flex flex-col gap-1 px-3 pb-4")}>
      {DOMAIN_LINKS.map(({ to, label, icon: Icon }) => {
        const active =
          location.pathname === to || location.pathname.startsWith(`${to}/`);
        const link = (
          <Link
            key={to}
            to={to}
            aria-current={active ? "page" : undefined}
            aria-label={collapsed ? label : undefined}
            className={cn(
              NAV_ITEM,
              active ? NAV_ACTIVE : NAV_IDLE,
              collapsed ? NAV_COLLAPSED : NAV_EXPANDED,
            )}
          >
            <Icon
              className={cn(
                "size-[18px] shrink-0 transition-colors",
                active ? "text-ur-blue" : "opacity-80",
              )}
              strokeWidth={1.7}
            />
            <span className={collapsed ? "sr-only" : "truncate"}>{label}</span>
          </Link>
        );
        if (!collapsed) return link;
        return (
          <Tooltip key={to}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

function ChatThreadsSection({ collapsed }: { collapsed: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();
  const {
    threads,
    activeThreadId,
    createThread,
    switchThread,
    pinThread,
    archiveThread,
    renameThread,
    isNewThread,
  } = useChatThreads(undefined, CHAT_STORAGE_KEY, undefined, {
    autoCreate: false,
    restoreActiveThread: false,
  });
  const { workingThreadIds, observedThreadStarts } =
    useAgentChatRunningThreads();

  const localMineRows = ownDraftRows({
    threads,
    isNewThread,
    observedThreadStarts,
  });
  const history = useOwnershipChatHistory({
    getThreadUrl: (threadId) => appPath(chatThreadPath(threadId)),
    activeId:
      threadIdFromPath(location.pathname) ??
      activeThreadId ??
      persistedActiveThreadId(),
    localMineRows,
    pinned: { label: t("chat.pinned") },
    mutations: {
      pin: pinThread,
      rename: renameThread,
      archive: archiveThread,
    },
    onMutationFailed: (kind) => {
      if (kind === "archive") toast.error(t("chat.archiveFailed"));
      if (kind === "rename") toast.error(t("chat.renameFailed"));
    },
    decorateItem: (item, row) => {
      const title = row.title || row.preview || t("chat.untitledChat");
      return {
        ...item,
        title: (
          <ThreadHistoryTitle
            title={title}
            running={workingThreadIds.has(row.id)}
          />
        ),
      };
    },
  });
  const displayedActiveThreadId =
    threadIdFromPath(location.pathname) ??
    activeThreadId ??
    persistedActiveThreadId();

  function openThread(threadId: string, options?: { isNew?: boolean }) {
    switchThread(threadId);
    persistActiveThreadId(threadId);
    if (options?.isNew) {
      window.dispatchEvent(
        new CustomEvent("agent-chat:open-thread", {
          detail: { threadId, newThread: true },
        }),
      );
    }
    navigateWithAgentChatViewTransition(navigate, chatThreadPath(threadId));
    if (options?.isNew) return;
    window.requestAnimationFrame(() => {
      window.dispatchEvent(
        new CustomEvent("agent-chat:open-thread", {
          detail: { threadId, newThread: false },
        }),
      );
    });
  }

  async function handleNewChat() {
    const threadId = await createThread();
    if (threadId) openThread(threadId, { isNew: true });
  }

  const newChatButton = (
    <button
      type="button"
      onClick={() => void handleNewChat()}
      className={cn(
        NAV_ITEM,
        NAV_IDLE,
        collapsed ? NAV_COLLAPSED : NAV_EXPANDED,
      )}
      aria-label={collapsed ? t("chat.newChat") : undefined}
    >
      <IconEdit className="size-[18px] shrink-0 opacity-80" strokeWidth={1.7} />
      <span className={collapsed ? "sr-only" : "truncate"}>
        {t("chat.newChat")}
      </span>
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{newChatButton}</TooltipTrigger>
        <TooltipContent side="right">{t("chat.newChat")}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-3 pb-2">{newChatButton}</div>
      <OwnershipChatHistoryRail
        {...history}
        onNewChat={() => void handleNewChat()}
        showNewChat={false}
        activeId={displayedActiveThreadId}
        onSelect={openThread}
        onDelete={async (threadId) => {
          const wasActive =
            threadId === activeThreadId ||
            threadId === persistedActiveThreadId();
          const archived = await history.listProps.onDelete?.(threadId);
          if (archived && wasActive) await handleNewChat();
        }}
        renameMaxLength={160}
        labels={{
          options: (item) =>
            t("chat.optionsFor", { title: item.titleText ?? "" }),
          renameInput: (item) =>
            t("chat.renameThread", { title: item.titleText ?? "" }),
          rename: t("chat.renameChat"),
          pin: t("chat.pinChat"),
          unpin: t("chat.unpinChat"),
          delete: t("chat.archiveChat"),
        }}
        railLabels={{
          newChat: t("chat.newChat"),
        }}
        className="chat-sidebar-history min-h-0 flex-1"
        listClassName="pb-4"
      />
    </div>
  );
}

export function Sidebar({
  collapsed = false,
  collapsible = true,
  onCollapsedChange,
}: SidebarProps) {
  const t = useT();
  const ToggleIcon = collapsed
    ? IconLayoutSidebarLeftExpand
    : IconLayoutSidebarLeftCollapse;
  const collapseButton = collapsible ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => onCollapsedChange?.(!collapsed)}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          aria-label={
            collapsed
              ? t("navigation.expandSidebar")
              : t("navigation.collapseSidebar")
          }
        >
          <ToggleIcon className="size-4" strokeWidth={1.8} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {collapsed
          ? t("navigation.expandSidebar")
          : t("navigation.collapseSidebar")}
      </TooltipContent>
    </Tooltip>
  ) : null;
  const searchButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={openCommandMenu}
          aria-label={t("root.commandSearch")}
          className="flex size-8 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <IconSearch className="size-4" strokeWidth={1.8} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{t("root.commandSearch")}</TooltipContent>
    </Tooltip>
  );

  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      className={cn(
        "flex h-full min-w-0 shrink-0 flex-col overflow-hidden border-e border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out",
        collapsed ? "w-12" : "w-full",
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center",
          collapsed ? "justify-center px-1" : "gap-1 px-5",
        )}
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/"
                aria-label={APP_TITLE}
                className="flex size-8 items-center justify-center rounded outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <BrandMark className="size-7" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{APP_TITLE}</TooltipContent>
          </Tooltip>
        ) : (
          <>
            <Link
              to="/"
              className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <BrandMark className="size-8 shrink-0 transition-transform duration-300 group-hover:rotate-[18deg]" />
              <span className="ur-title truncate text-[1.375rem] text-sidebar-accent-foreground">
                Unrecalled
              </span>
            </Link>
          </>
        )}
      </div>

      <nav
        aria-label={t("navigation.navigation")}
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          collapsed ? "items-center gap-1.5 px-1 py-2" : "pt-2",
        )}
      >
        <DomainNavLinks collapsed={collapsed} />
        <ChatThreadsSection collapsed={collapsed} />
      </nav>

      <div className="mt-auto shrink-0 border-t border-sidebar-border/70 p-2">
        <div
          className={cn(
            collapsed
              ? "flex flex-col items-center gap-1"
              : "flex items-center gap-0.5",
          )}
        >
          <OrgSwitcher
            reserveSpace
            compact={collapsed}
            currentAppId="chat"
            className={
              collapsed
                ? "size-8 bg-transparent p-0 hover:bg-sidebar-accent"
                : "min-w-0 flex-1 h-11 rounded-lg bg-transparent px-3 py-2 text-sm text-sidebar-accent-foreground hover:bg-sidebar-accent"
            }
          />
          <ThemeToggle className="size-8 rounded-lg" />
          {searchButton}
          {collapseButton}
        </div>
      </div>
    </aside>
  );
}
