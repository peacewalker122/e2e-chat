import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AppRoute from "./routes/AppRoute.jsx";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "./pages/context/authContext.jsx";
import { ChatProvider } from "./pages/context/chatContext.jsx";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<AuthProvider>
			<ChatProvider baseUrl={"http://localhost:8000"}>
				<BrowserRouter>
					<AppRoute />
				</BrowserRouter>
			</ChatProvider>
		</AuthProvider>
	</StrictMode>,
);
