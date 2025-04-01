import React, { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Activity, 
  ChevronLeft, 
  ClipboardList, 
  Home, 
  LogOut, 
  Menu, 
  Settings, 
  ShoppingBag, 
  Users, 
  HandshakeIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    });
    navigate("/");
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <SidebarProvider>
      <div className="h-screen flex overflow-hidden bg-background">
        <Sidebar className="border-r h-screen">
          <SidebarHeader className="h-14 flex items-center px-4">
            <div className={cn("flex items-center space-x-2", collapsed && "justify-center")}>
              <span className={cn("font-bold text-lg", collapsed && "hidden")}>CRM Médico</span>
            </div>
            <div className="ml-auto">
              <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
                <ChevronLeft className={cn("h-4 w-4", collapsed && "rotate-180")} />
              </Button>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem className={cn(isActive("/dashboard") && "bg-accent")}>
                <SidebarMenuButton onClick={() => navigate("/dashboard")}>
                  <Home className="h-5 w-5" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className={cn(isActive("/pacientes") && "bg-accent")}>
                <SidebarMenuButton onClick={() => navigate("/pacientes")}>
                  <Users className="h-5 w-5" />
                  <span>Pacientes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className={cn(isActive("/atividades") && "bg-accent")}>
                <SidebarMenuButton onClick={() => navigate("/atividades")}>
                  <Activity className="h-5 w-5" />
                  <span>Atividades</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className={cn(isActive("/produtos") && "bg-accent")}>
                <SidebarMenuButton onClick={() => navigate("/produtos")}>
                  <ShoppingBag className="h-5 w-5" />
                  <span>Produtos e Serviços</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className={cn(isActive("/parceiros") && "bg-accent")}>
                <SidebarMenuButton onClick={() => navigate("/parceiros")}>
                  <HandshakeIcon className="h-5 w-5" />
                  <span>Parceiros</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className={cn(isActive("/configuracoes") && "bg-accent")}>
                <SidebarMenuButton onClick={() => navigate("/configuracoes")}>
                  <Settings className="h-5 w-5" />
                  <span>Configurações</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="px-3 py-2">
            <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <header className="h-14 border-b flex items-center px-6">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="ml-auto flex items-center space-x-4">
              <span className="text-sm font-medium">Admin</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
