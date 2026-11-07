// Top navigation: brand left, a few quiet links, then theme, agent and the
// "Scan a car" call to action.
import { AgentToggleButton } from "@agent-native/toolkit/app/chat";
import { IconArrowRight, IconMenu2 } from "@tabler/icons-react";
import { Link, useLocation } from "react-router";

import { BrandMark } from "@/components/unrecalled/premium";
import { ThemeToggle } from "@/components/unrecalled/ThemeToggle";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

const LINKS = [
  { to: "/#how", label: "How it works", match: null },
  { to: "/petitions", label: "Petitions", match: "/petitions" },
  { to: "/backtest", label: "Proof", match: "/backtest" },
  { to: "/chat", label: "Ask the agent", match: "/chat" },
];

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const { pathname } = useLocation();
  return (
    <header className="ur-topnav sticky top-0 z-30 shrink-0">
      <div className="mx-auto flex h-[72px] w-full max-w-[1280px] items-center gap-6 px-4 md:px-8">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation"
          className="-ml-1 inline-flex size-10 items-center justify-center rounded-xl text-foreground hover:bg-foreground/[0.07] lg:hidden"
        >
          <IconMenu2 className="size-5" stroke={1.8} />
        </button>
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Unrecalled home">
          <BrandMark className="size-8" />
          <span className="font-display text-[1.375rem] font-[560] tracking-[-0.035em] text-foreground [font-variation-settings:'opsz'_36]">
            Unrecalled
          </span>
        </Link>
        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => {
            const active = !!l.match && (pathname === l.match || pathname.startsWith(l.match + "/"));
            return (
              <Link
                key={l.to}
                to={l.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-[15px] tracking-[-0.01em] transition-colors",
                  active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden sm:block [&_button]:rounded-xl">
            <AgentToggleButton />
          </div>
          <div className="hidden sm:block">
            <Link to="/#scan" className="ur-btn h-11 whitespace-nowrap">
              Scan a car
              <IconArrowRight className="size-4" stroke={2} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
