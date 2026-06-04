import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Panel de administración de licencias de DentalSoft.
// Dev server en :5174 (el ERP usa :5173) para poder correr ambos a la vez.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
  },
});
