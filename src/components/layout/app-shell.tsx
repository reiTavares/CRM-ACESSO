import React from "react";
    import { useNavigate, useLocation } from "react-router-dom";
    import {
      Home,
      LogOut,
      Menu,
      Settings,
      Users,
      PanelLeftClose,
      PanelRightClose
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
      SidebarProvider,
      useSidebar,
      SidebarMenuButtonSpan // Importar o Span específico
    } from "@/components/ui/sidebar";
    import { useToast } from "@/hooks/use-toast";

    interface AppShellProps {
      children: React.ReactNode;
    }

    // Componente interno para acessar o contexto
    function AppShellInternal({ children }: AppShellProps) {
      const { state: sidebarState, toggleSidebar } = useSidebar();
      const collapsed = sidebarState === 'collapsed';

      const location = useLocation();
      const navigate = useNavigate();
      const { toast } = useToast();

      const handleLogout = () => {
        toast({ title: "Logout realizado", description: "Você foi desconectado com sucesso" });
        navigate("/");
      };

      const isActive = (path: string) => location.pathname === path;

      return (
          <div className="h-screen flex overflow-hidden bg-background">
            {/* Sidebar */}
            <Sidebar className="border-r h-screen" collapsible="icon">
              {/* Header da Sidebar */}
              <SidebarHeader className="h-14 flex items-center justify-center px-2">
                <div className={cn("flex items-center justify-center")}>
                  <img
                    src="https://comercial.acessooftalmologia.com.br/storage/u6fzUpkGUZmHIr7udopIxQAJdtV0N6FE98IVs5tV.png"
                    alt="CRM Acesso Oftalmologia Logo"
                    className={cn("h-8 w-auto transition-all")}
                  />
                </div>
              </SidebarHeader>

              {/* Conteúdo da Sidebar */}
              <SidebarContent>
                <SidebarMenu>
                  {/* Botão Recolher/Expandir */}
                  <SidebarMenuItem>
                     <SidebarMenuButton
                       variant="ghost"
                       onClick={toggleSidebar}
                       className="w-full justify-center md:justify-start"
                       tooltip={collapsed ? "Expandir menu" : "Recolher menu"}
                     >
                       {/* **GARANTIR FRAGMENTO AQUI** */}
                       <>
                         {collapsed ? <PanelRightClose className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                         <SidebarMenuButtonSpan>{collapsed ? "" : "Recolher"}</SidebarMenuButtonSpan>
                       </>
                     </SidebarMenuButton>
                  </SidebarMenuItem>

                  <div className="px-2 my-1"> <hr className="border-sidebar-border" /> </div>

                  {/* Botões de Navegação */}
                  <SidebarMenuItem className={cn(isActive("/dashboard") && "bg-accent")}>
                    <SidebarMenuButton onClick={() => navigate("/dashboard")} tooltip="Dashboard">
                      {/* **GARANTIR FRAGMENTO AQUI** */}
                      <>
                        <Home className="h-5 w-5" />
                        <SidebarMenuButtonSpan>Dashboard</SidebarMenuButtonSpan>
                      </>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem className={cn(isActive("/pacientes") && "bg-accent")}>
                    <SidebarMenuButton onClick={() => navigate("/pacientes")} tooltip="Pacientes">
                      {/* **GARANTIR FRAGMENTO AQUI** */}
                      <>
                        <Users className="h-5 w-5" />
                        <SidebarMenuButtonSpan>Pacientes</SidebarMenuButtonSpan>
                      </>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem className={cn(isActive("/configuracoes") && "bg-accent")}>
                    <SidebarMenuButton onClick={() => navigate("/configuracoes")} tooltip="Configurações">
                      {/* **GARANTIR FRAGMENTO AQUI** */}
                      <>
                        <Settings className="h-5 w-5" />
                        <SidebarMenuButtonSpan>Configurações</SidebarMenuButtonSpan>
                      </>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarContent>

              {/* Footer da Sidebar */}
              <SidebarFooter className="px-3 py-2">
                <SidebarMenuButton variant="ghost" onClick={handleLogout} tooltip="Sair">
                  {/* **GARANTIR FRAGMENTO AQUI** */}
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    <SidebarMenuButtonSpan>Sair</SidebarMenuButtonSpan>
                  </>
                </SidebarMenuButton>
              </SidebarFooter>
            </Sidebar>

            {/* Conteúdo Principal */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
              {/* Header Principal */}
              <header className="h-14 border-b flex items-center px-6">
                {/* Botão de menu mobile */}
                <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
                   <Menu className="h-5 w-5" />
                   <span className="sr-only">Abrir/Fechar Menu</span>
                </Button>
                {/* Informações do usuário (placeholder) */}
                <div className="ml-auto flex items-center space-x-4">
                   <span className="text-sm font-medium">Admin</span>
                </div>
              </header>
              {/* Área de Conteúdo da Página */}
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
          </div>
      );
    }

    // Componente Principal Exportado com Provider
    export function AppShell({ children }: AppShellProps) {
      return (
        <SidebarProvider>
          <AppShellInternal>{children}</AppShellInternal>
        </SidebarProvider>
      )
    }
