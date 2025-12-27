import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/src/App";
import { AuthSProvider } from "./components/src/contexts/AuthContext";
import { ThemeProvider } from "./components/src/contexts/ThemeContext";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthSProvider>
        <App />
      </AuthSProvider>
    </ThemeProvider>
  </React.StrictMode>
);
