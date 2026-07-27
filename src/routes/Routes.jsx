import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../features/pages/LoginPage";
import DashboardPage from "../features/pages/DashboardPage";
import ModulosPage from "../features/pages/ModulosPage";
import PlanesPage from "../features/pages/PlanesPage";
import LicenciasPage from "../features/pages/LicenciasPage";
import LaboratoriosPage from "../features/pages/LaboratoriosPage";
import CobranzasPage from "../features/pages/CobranzasPage";
import VentaOrigenPage from "../features/pages/VentaOrigenPage";
import AtribucionPage from "../features/pages/AtribucionPage";
import ServidorPage from "../features/pages/ServidorPage";
import Layout from "../layouts/Layout";
import PrivateRoute from "./PrivateRoute";

const AppRoutes = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/inicio"
          element={
            <PrivateRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/planes"
          element={
            <PrivateRoute>
              <Layout>
                <PlanesPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/modulos"
          element={
            <PrivateRoute>
              <Layout>
                <ModulosPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/licencias"
          element={
            <PrivateRoute>
              <Layout>
                <LicenciasPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/laboratorios"
          element={
            <PrivateRoute>
              <Layout>
                <LaboratoriosPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/cobranzas"
          element={
            <PrivateRoute>
              <Layout>
                <CobranzasPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/origenes-venta"
          element={
            <PrivateRoute>
              <Layout>
                <VentaOrigenPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/atribucion"
          element={
            <PrivateRoute>
              <Layout>
                <AtribucionPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/servidor"
          element={
            <PrivateRoute>
              <Layout>
                <ServidorPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default AppRoutes;
