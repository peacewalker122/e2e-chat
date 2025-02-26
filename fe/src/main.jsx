import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRoute from "./routes/AppRoute.jsx";
import {BrowserRouter} from "react-router";
import {AuthProvider} from "./pages/context/authContext.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <AuthProvider>
          <BrowserRouter>
              <AppRoute />
          </BrowserRouter>
      </AuthProvider>
  </StrictMode>,
)
