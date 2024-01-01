(function connect(window, document, location) {
	if (window._reload) return;

	const socket = new WebSocket(`ws://${location.host}/_live-reload`);

	socket.onopen = () => {
		console.log("🟢 Live reload enabled.");
		window._reload = socket;
	};

	socket.onclose = () => {
		console.log("🔴 Live reload disabled. Reconnecting in 1s…");
		window._reload = undefined;
		setTimeout(() => {
			connect(window, document, location);
		}, 1000);
	};

	socket.onmessage = ({ data }) => {
		switch (data) {
			case "reload":
				location.reload();
				break;
			case "reload-css":
				for (const it of document.querySelectorAll("link[rel=stylesheet]")) {
					const href = it.getAttribute("href");
					it.setAttribute("href", `${href}?v=${Date.now()}`);
				}
				break;
			default:
				console.warn("unknown live reload command:", data);
		}
	};
})(
	// @ts-ignore
	window,
	// @ts-ignore
	document,
	// @ts-ignore
	location,
);
