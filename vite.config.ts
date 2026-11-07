import { agentNative } from "@agent-native/core/vite";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, type Plugin } from "vite";

import { tablerDevAlias } from "./vite.tabler-shim";

// Dev only: serve node_modules code without inline sourcemaps.
//
// Vite's dev server appends a base64 sourcemap to every JS response. For a
// dependency that has no map of its own (all pre-bundled deps, because
// @agent-native turns dep sourcemaps off) it generates an identity map that
// embeds the whole file again, on every request. Measured on /gaps: 112 of the
// 143 MB per page load were these maps, and they are rebuilt on every request
// (~2.8 s of blocking CPU for the deps alone). Too big for the browser cache, so
// even reloads re-downloaded them. Returning an empty map ({ mappings: "" }) tells Vite there is
// no map, so it sends the code alone. App code under app/ keeps its maps.
// Set UNRECALLED_DEP_SOURCEMAPS=1 to get them back when debugging a library.
function noDependencySourcemaps(): Plugin {
  return {
    name: "unrecalled:no-dependency-sourcemaps",
    apply: (_config, { command }) =>
      command === "serve" && process.env.UNRECALLED_DEP_SOURCEMAPS !== "1",
    enforce: "pre",
    transform(code, id, options) {
      if (options?.ssr || !id.includes("/node_modules/")) return null;
      const [file = "", query = ""] = id.split("?");
      if (!/\.(m?js|cjs|jsx?)$/.test(file)) return null;
      if (query && !/^(v|t)=[\w-]+(&(v|t)=[\w-]+)*$/.test(query)) return null;
      // Vite keeps the original map when code is unchanged, so add a newline.
      return { code: `${code}\n`, map: { mappings: "" } };
    },
  };
}

const reactRouterPlugins = reactRouter as unknown as () => any[];
const agentNativePlugins = agentNative as unknown as (
  options?: Parameters<typeof agentNative>[0],
) => any[];
export default defineConfig(({ command }) => ({
  // Dev only: serve the ~270 icons we use instead of all ~6,000 (4.2 MB, ~470 ms
  // to parse and run on every page load). New icon? Restart dev (see the shim).
  resolve: command === "serve" ? { alias: tablerDevAlias(process.cwd()) } : {},
  optimizeDeps: {
    entries: [
      "app/entry.client.tsx",
      "app/root.tsx",
      "app/components/layout/{Layout,Sidebar}.tsx",
      "app/components/chat/ChatRouteContent.tsx",
      "app/routes/*.tsx",
    ],
    // Dev only: these libraries are imported by @agent-native/toolkit/core,
    // which Vite serves unbundled, so each arrived as hundreds of tiny files
    // (/gaps was ~3,200 requests). Pre-bundle them into one file each.
    // Tiptap/prosemirror/yjs are left alone: duplicate copies break the editor.
    include: [
      "@agent-native/toolkit > recharts",
      "@agent-native/toolkit > date-fns",
      "@agent-native/toolkit > culori",
      "@agent-native/toolkit > react-day-picker",
      "@agent-native/toolkit > highlight.js",
      "@agent-native/toolkit > lowlight",
      "@agent-native/toolkit > vgpu",
      "@agent-native/toolkit > react-resizable-panels",
      "@agent-native/toolkit > mdast-util-from-markdown",
      "@agent-native/toolkit > mdast-util-gfm",
      "@agent-native/toolkit > micromark-extension-gfm",
      "@agent-native/core > @modelcontextprotocol/client",
    ],
  },
  plugins: [
    noDependencySourcemaps(),
    ...reactRouterPlugins(),
    ...agentNativePlugins({
      ssrStubs: ["shiki"],
    }),
  ],
}));
