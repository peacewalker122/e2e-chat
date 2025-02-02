import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
	root: "src",
	build: {
		outDir: "../dist",
		rollupOptions: {
			input: {
				main: resolve(__dirname, "src/index.html"),
				chat: resolve(__dirname, "src/chat.html"),
			},
		},
	},
	server: {
		port: 3000,
		proxy: {
			"/ws": {
				target: "ws://localhost:8000",
				ws: true,
			},
		},
	},
});
