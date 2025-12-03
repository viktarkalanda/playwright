const MAIN_SCRIPT_PATTERN = /<script[^>]+src="([^"]*main\.[^"]+\.js)"/i;
const MAIN_STYLE_PATTERN = /<link[^>]+href="([^"]*main\.[^"]+\.css)"/i;

export interface DiscoveredAssets {
  scriptPath: string | null;
  stylePath: string | null;
}

export function discoverMainAssets(html: string): DiscoveredAssets {
  const scriptMatch = html.match(MAIN_SCRIPT_PATTERN);
  const styleMatch = html.match(MAIN_STYLE_PATTERN);

  return {
    scriptPath: scriptMatch?.[1] ?? null,
    stylePath: styleMatch?.[1] ?? null,
  };
}
