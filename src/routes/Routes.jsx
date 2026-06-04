import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../features/pages/LoginPage";
import DashboardPage from "../features/pages/DashboardPage";
import ModulosPage from "../features/pages/ModulosPage";
import PlanesPage from "../features/pages/PlanesPage";
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

        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default AppRoutes;
