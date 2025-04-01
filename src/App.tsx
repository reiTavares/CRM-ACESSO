import { Toaster } from "@/components/ui/toaster";
      import { Toaster as Sonner } from "@/components/ui/sonner";
      import { TooltipProvider } from "@/components/ui/tooltip";
      import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
      import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
      import Login from "./pages/Login";
      import Dashboard from "./pages/Dashboard";
      import Pacientes from "./pages/Pacientes";
      import Configuracoes from "./pages/Configuracoes";
      import NotFound from "./pages/NotFound";
      import { ApiConfigProvider } from "@/contexts/ApiConfigContext"; // Import the provider

      const queryClient = new QueryClient();

      const App = () => (
        // Wrap the entire application or relevant parts with the provider
        <ApiConfigProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Login />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/pacientes" element={<Pacientes />} />
                  {/* Removed /atividades, /produtos, /parceiros routes */}
                  <Route path="/configuracoes" element={<Configuracoes />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </ApiConfigProvider>
      );

      export default App;
