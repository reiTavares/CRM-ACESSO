import React, { ReactNode } from "react"; // Removed useState
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home, 
  LogOut, 
  Menu, 
  Settings, 
  Users, 
  PanelLeftClose, // Icon for collapse
  PanelRightClose // Icon for expand
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
  useSidebar, // Import useSidebar hook
  SidebarMenuButtonSpan // Import the span component
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

interface AppShellProps {
  children: ReactNode;
}

// Inner component to access sidebar context for state
function AppShellInternal({ children }: AppShellProps) {
  // Use the state and toggle function from the context provider
  const { state: sidebarState, toggleSidebar } = useSidebar(); 
  const collapsed = sidebarState === 'collapsed'; // Derive boolean state from context

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
      <div className="h-screen flex overflow-hidden bg-background">
        {/* Sidebar component reacts to context state via data-state */}
        {/* Ensure collapsible="icon" is set */}
        <Sidebar className="border-r h-screen" collapsible="icon"> 
          <SidebarHeader className="h-14 flex items-center justify-center px-2"> 
            <div className={cn("flex items-center justify-center")}>
              <img 
                src="https://comercial.acessooftalmologia.com.br/storage/u6fzUpkGUZmHIr7udopIxQAJdtV0N6FE98IVs5tV.png" 
                alt="CRM Acesso Oftalmologia Logo" 
                className={cn("h-8 w-auto transition-all")} 
              />
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarMenu>
              {/* Collapse/Expand Button - Use toggleSidebar from context */}
              <SidebarMenuItem>
                 <SidebarMenuButton 
                   variant="ghost" 
                   onClick={toggleSidebar} // Use context toggle function
                   className="w-full justify-center md:justify-start" 
                   tooltip={collapsed ? "Expandir menu" : "Recolher menu"}
                 >
                   {/* Use derived collapsed state to determine icon */}
                   {collapsed ? <PanelRightClose className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                   {/* Use SidebarMenuButtonSpan for text */}
                   <SidebarMenuButtonSpan>{collapsed ? "" : "Recolher"}</SidebarMenuButtonSpan> 
                 </SidebarMenuButton>
              </SidebarMenuItem>

              <div className="px-2 my-1"> <hr className="border-sidebar-border" /> </div>

              <SidebarMenuItem className={cn(isActive("/dashboard") && "bg-accent")}> 
                <SidebarMenuButton onClick={() => navigate("/dashboard")} tooltip="Dashboard"> 
                  <Home className="h-5 w-5" /> 
                  {/* Use SidebarMenuButtonSpan for text */}
                  <SidebarMenuButtonSpan>Dashboard</SidebarMenuButtonSpan> 
                </SidebarMenuButton> 
              </SidebarMenuItem>
              <SidebarMenuItem className={cn(isActive("/pacientes") && "bg-accent")}> 
                <SidebarMenuButton onClick={() => navigate("/pacientes")} tooltip="Pacientes"> 
                  <Users className="h-5 w-5" /> 
                  {/* Use SidebarMenuButtonSpan for text */}
                  <SidebarMenuButtonSpan>Pacientes</SidebarMenuButtonSpan> 
                </SidebarMenuButton> 
              </SidebarMenuItem>
              <SidebarMenuItem className={cn(isActive("/configuracoes") && "bg-accent")}> 
                <SidebarMenuButton onClick={() => navigate("/configuracoes")} tooltip="Configurações"> 
                  <Settings className="h-5 w-5" /> 
                  {/* Use SidebarMenuButtonSpan for text */}
                  <SidebarMenuButtonSpan>Configurações</SidebarMenuButtonSpan> 
                </SidebarMenuButton> 
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="px-3 py-2"> 
            <SidebarMenuButton variant="ghost" onClick={handleLogout} tooltip="Sair"> 
              <LogOut className="mr-2 h-4 w-4" /> 
              {/* Use SidebarMenuButtonSpan for text */}
              <SidebarMenuButtonSpan>Sair</SidebarMenuButtonSpan> 
            </SidebarMenuButton> 
          </SidebarFooter>
        </Sidebar>
        
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden"> 
          <header className="h-14 border-b flex items-center px-6"> 
            <Button variant="ghost" size="icon" className="md:hidden"> <Menu className="h-5 w-5" /> </Button> 
            <div className="ml-auto flex items-center space-x-4"> <span className="text-sm font-medium">Admin</span> </div> 
          </header> 
          <main className="flex-1 overflow-auto"> {children} </main> 
        </div>
      </div>
  );
}


// Main export wraps the internal component with the provider
export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppShellInternal>{children}</AppShellInternal>
    </SidebarProvider>
  )
}
