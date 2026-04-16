import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider, createTheme } from "@mantine/core";
import App from "./App.tsx";
import { AuthGate } from "./components/auth/AuthGate";
import "@mantine/core/styles.css";
import "./index.css";

const theme = createTheme({
  primaryColor: "blue",
  radius: { md: "12px", lg: "16px" },
  fontFamily: "'Fenomen Sans', ui-sans-serif, system-ui, sans-serif",
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <AuthGate>
        <App />
      </AuthGate>
    </MantineProvider>
  </StrictMode>,
)
