import { watch } from "fs";
import { join } from "path";
import type {
	BuildConfig,
	Server,
	ServerWebSocket,
	WebSocketHandler,
	WebSocketServeOptions,
} from "bun";

declare global {
	// biome-ignore lint/style/noVar: apparently, `var` is the only way to declare a global variable https://stackoverflow.com/a/69429093
	var ws: ServerWebSocket<unknown>[];
}

if (globalThis.ws === undefined) {
	globalThis.ws = [];
}

for (const ws of globalThis.ws) {
	ws.send("reload");
}

export type StrictWebSocketServeOptions<T> = Omit<
	WebSocketServeOptions<T>,
	"fetch" | "websocket"
> & {
	fetch(request: Request, server: Server): Promise<Response> | Response;
	websocket?: WebSocketHandler<T>;
};

export type LiveReloadOptions = {
	readonly buildConfig?: BuildConfig;
	readonly watchPath?: string;
};

/**
 * Automatically reloads the browser when Bun server hot reloads
 *
 * @param serve Bun's serve options
 * @param options Live reload options
 *
 * @returns Bun's serve options with live reload scripts injected.
 *
 * @example
 *
 *	import { htmlLiveReload } from "./index.js";
 *
 *	Bun.serve(
 *		htmlLiveReload({
 *			fetch: () => {
 *				return new Response("<div>hello world!</div>", {
 *					headers: { "Content-Type": "text/html" },
 *				});
 *			},
 *			port: 8888,
 *		}),
 *	);
 */
export const htmlLiveReload = <
	WebSocketDataType,
	T extends StrictWebSocketServeOptions<WebSocketDataType>,
>(
	serve: T,
	{ buildConfig, watchPath }: LiveReloadOptions = {},
): WebSocketServeOptions<WebSocketDataType> => {
	if (buildConfig) {
		Bun.build(buildConfig).catch(console.error);
	}

	if (watchPath) {
		watch(watchPath).on("change", async (event, filename) => {
			if (event !== "change" || typeof filename !== "string") return;

			let command = "reload";
			if (Bun.file(filename).type === "text/css") {
				command = "reload-css";
			}

			if (buildConfig) {
				await Bun.build(buildConfig);
			}

			for (const it of globalThis.ws) {
				it.send(command);
			}
		});
	}

	return {
		...serve,

		fetch: async (req, server) => {
			const { pathname } = new URL(req.url);

			switch (pathname) {
				case "/_live-reload": {
					if (!server.upgrade(req)) {
						return new Response("Failed upgrading to websocket connection.", {
							status: 400,
						});
					}

					return;
				}
				case "/_live-reload.js": {
					return new Response(
						Bun.file(join(import.meta.dir, "live-reload.js")),
						{
							headers: { "Content-Type": "text/javascript; charset=utf-8" },
						},
					);
				}
				default: {
					const response = await serve.fetch(req, server);
					if (!response.headers.get("Content-Type")?.includes("text/html")) {
						return response;
					}

					const body = await response.text();
					const script = `<script src="/_live-reload.js"></script>`;
					return new Response(`${body}${script}`, response);
				}
			}
		},

		websocket: {
			...serve.websocket,

			open: async (ws) => {
				globalThis.ws = [...(globalThis.ws ?? []), ws];
				await serve.websocket?.open?.(ws);
			},

			close: async (ws, code: number, reason: string) => {
				globalThis.ws = globalThis.ws.filter((it) => it !== ws);
				await serve.websocket?.close?.(ws, code, reason);
			},
		},
	};
};
