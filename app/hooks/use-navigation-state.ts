import {
  appBasePath,
  appPathFromLocalRoute,
} from "@agent-native/core/client/api-path";
import { useAgentRouteState } from "@agent-native/core/client/navigation";

import {
  chatThreadPath,
  HOME_PATH,
  isChatPathname,
  NEW_CHAT_PATH,
  threadIdFromPath,
} from "@/lib/chat-paths";
import { TAB_ID } from "@/lib/tab-id";

export interface NavigationState {
  view?: string | undefined;
  path?: string;
  publicPath?: string;
  threadId?: string;
  vehicleId?: string | undefined;
  modeId?: string | undefined;
  petitionId?: string | undefined;
  year?: string;
  show?: string;
}

export function useNavigationState() {
  useAgentRouteState<NavigationState>({
    browserTabId: TAB_ID,
    requestSource: TAB_ID,
    getNavigationState: ({ pathname, searchParams }) =>
      navigationStateForPath(pathname, searchParams),
    getCommandPath: commandPathForNavigation,
  });
}

export function commandPathForNavigation(command: NavigationState): string {
  const fallbackPath = pathForCommand(command);
  const path = typeof command?.path === "string" ? command.path : "";
  if (!path) return fallbackPath;

  const basePath = appBasePath();
  if (!basePath) return path;

  const suffixIndex = path.search(/[?#]/);
  const pathname = suffixIndex === -1 ? path : path.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : path.slice(suffixIndex);
  const publicPath =
    typeof command?.publicPath === "string" ? command.publicPath : "";
  const publicPathSuffixIndex = publicPath.search(/[?#]/);
  const declaredPublicPath =
    publicPathSuffixIndex === -1
      ? publicPath
      : publicPath.slice(0, publicPathSuffixIndex);
  const publicViewPath = appPathFromLocalRoute(pathForView(command?.view));
  if (
    matchesPathPrefix(pathname, basePath) &&
    (matchesPathPrefix(pathname, publicViewPath) ||
      (declaredPublicPath && declaredPublicPath === pathname))
  ) {
    return `${pathname.slice(basePath.length) || "/"}${suffix}`;
  }
  return path;
}

function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function navigationStateForPath(
  pathname: string,
  searchParams?: URLSearchParams,
): NavigationState {
  const threadId = threadIdFromPath(pathname);
  const domain = domainStateForPath(pathname);
  const year = searchParams?.get("year") ?? undefined;
  const show = searchParams?.get("show") ?? undefined;
  return {
    view: domain?.view ?? viewForPath(pathname),
    path: pathname,
    publicPath: appPathFromLocalRoute(pathname),
    ...(threadId ? { threadId } : {}),
    ...(domain?.vehicleId ? { vehicleId: domain.vehicleId } : {}),
    ...(domain?.modeId ? { modeId: domain.modeId } : {}),
    ...(domain?.petitionId ? { petitionId: domain.petitionId } : {}),
    ...(domain?.view === "cluster" && year ? { year } : {}),
    ...(domain?.view === "gaps" && domain.vehicleId && show ? { show } : {}),
  };
}

function safeDecode(segment: string | undefined): string | undefined {
  if (!segment) return undefined;
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** Unrecalled routes: /gaps, /gaps/:vehicleId, /gaps/:vehicleId/:modeId, /petitions[/:id], /backtest, /rules. */
function domainStateForPath(pathname: string):
  | Pick<NavigationState, "view" | "vehicleId" | "modeId" | "petitionId">
  | null {
  const parts = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  const [root, a, b] = parts;
  if (root === "gaps") {
    if (a && b) {
      return { view: "cluster", vehicleId: safeDecode(a), modeId: safeDecode(b) };
    }
    return a ? { view: "gaps", vehicleId: safeDecode(a) } : { view: "gaps" };
  }
  if (root === "petitions") {
    return a
      ? { view: "petition", petitionId: safeDecode(a) }
      : { view: "petitions" };
  }
  if (root === "backtest") return { view: "backtest" };
  if (root === "rules") return { view: "rules" };
  return null;
}

function viewForPath(pathname: string): string {
  if (isChatPathname(pathname)) return "chat";
  if (pathname === HOME_PATH) return "home";
  if (pathname.startsWith("/database")) return "database";
  if (pathname.startsWith("/extensions")) return "extensions";
  if (pathname.startsWith("/observability")) return "observability";
  if (pathname.startsWith("/settings/agent") || pathname.startsWith("/agent")) {
    return "agent";
  }
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/team")) return "settings";
  return "chat";
}

function pathForView(view?: string): string {
  switch (view) {
    case "chat":
    case "ask":
      return NEW_CHAT_PATH;
    case "home":
      return HOME_PATH;
    case "database":
      return "/database";
    case "extensions":
      return "/extensions";
    case "observability":
      return "/observability";
    case "agent":
      return "/settings/agent";
    case "settings":
      return "/settings";
    case "team":
      return "/settings/organization";
    case "gaps":
    case "cluster":
      return "/gaps";
    case "petition":
    case "petitions":
      return "/petitions";
    case "backtest":
      return "/backtest";
    case "rules":
      return "/rules";
    default:
      return HOME_PATH;
  }
}

export function pathForCommand(command: any): string {
  const id = (v: unknown) =>
    typeof v === "string" && v.trim() ? encodeURIComponent(v.trim()) : "";
  const vehicleId = id(command?.vehicleId);
  const modeId = id(command?.modeId);
  const petitionId = id(command?.petitionId);
  switch (command?.view) {
    case "gaps":
    case "board":
      return vehicleId ? `/gaps/${vehicleId}` : "/gaps";
    case "cluster":
      if (vehicleId && modeId) return `/gaps/${vehicleId}/${modeId}`;
      return vehicleId ? `/gaps/${vehicleId}` : "/gaps";
    case "petition":
      return petitionId ? `/petitions/${petitionId}` : "/petitions";
  }
  const path = pathForView(command?.view);
  if (command?.view !== "chat" && command?.view !== "ask") return path;
  const threadId =
    typeof command?.threadId === "string" ? command.threadId.trim() : "";
  return threadId ? chatThreadPath(threadId) : path;
}
