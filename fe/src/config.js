// Configuration for different environments
const config = {
	development: {
		wsBaseUrl: "ws://localhost:8000",
		httpBaseUrl: "http://localhost:8000",
	},
	development_traefik: {
		wsBaseUrl: "wss://localhost/ws",
		httpBaseUrl: "https://localhost/ws",
	},
	production: {
		wsBaseUrl: import.meta.env.VITE_WS_URL,
		httpBaseUrl: "https://yourdomain.com",
	},
};

// Get environment from process.env or default to development
const ENV = import.meta.env.VITE_ENV || "development";
console.log("Current environment:", ENV);

// Export the configuration
export const BASE_URL = config[ENV]?.wsBaseUrl || config.development.wsBaseUrl;
