import { Toaster } from "sonner";
import AppRoutes from "./routes/Routes";
import LoaderManager from "./hooks/LoaderManager";

export default function App() {
  return (
    <>
      <AppRoutes />
      <LoaderManager />
      <Toaster
        position="top-right"
        richColors
        closeButton
        expand
        duration={4000}
      />
    </>
  );
}
