import { join } from "path";
import { Serve } from "bun";
import { htmlLiveReload } from "../index.js";

const serve: Serve = {
	fetch: (request: Request) => {
		const url = new URL(request.url);

		switch (url.pathname) {
			case "/":
				return new Response(Bun.file(join(import.meta.dir, "index.html")), {
					headers: { "Content-Type": "text/html; charset=utf-8" },
				});
			case "/style.css":
				return new Response(Bun.file(join(import.meta.dir, "style.css")));
			default:
				return new Response("Not found", { status: 404 });
		}
	},
	port: 8888,
};

const server = Bun.serve(htmlLiveReload(serve, { watchPath: import.meta.dir }));

console.info(`🚀 Example server running on ${server.url}`);
