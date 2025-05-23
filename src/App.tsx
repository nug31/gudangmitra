import React from "react";
import { AuthProvider } from "./contexts/AuthContext";
import AppRouter from "./router/AppRouter";
import Favicon from "./components/ui/Favicon";

function App() {
  return (
    <AuthProvider>
      <Favicon />
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
