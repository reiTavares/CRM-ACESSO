import React, { Suspense } from "react";
    import { AppShell } from "@/components/layout/app-shell";
    import {
      Tabs,
      TabsContent,
      TabsList,
      TabsTrigger
    } from "@/components/ui/tabs";
    import {
      Building, Users, ShieldCheck, Stethoscope, CreditCard, MessageSquare, Webhook, Loader2,
      ClipboardList // Ícone para Procedimentos
    } from "lucide-react";

    // Importar o componente principal da API WhatsApp diretamente
    import { WhatsAppApiConfig } from "@/components/configuracoes/WhatsAppApiConfig";

    // Importar os outros componentes de forma preguiçosa (lazy)
    const HospitaisSettings = React.lazy(() => import('@/components/configuracoes/HospitaisSettings'));
    const MedicosSettings = React.lazy(() => import('@/components/configuracoes/MedicosSettings'));
    const UsuariosSettings = React.lazy(() => import('@/components/configuracoes/UsuariosSettings'));
    const ConveniosSettings = React.lazy(() => import('@/components/configuracoes/ConveniosSettings'));
    const MarketingSettings = React.lazy(() => import('@/components/configuracoes/MarketingSettings'));
    // Importar o novo componente de procedimentos
    const ProcedimentosSettings = React.lazy(() => import('@/components/configuracoes/ProcedimentosSettings'));

    // Componente de Fallback para o Suspense
    const SettingsLoadingFallback = () => (
        <div className="flex items-center justify-center p-10 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Carregando configurações...
        </div>
    );

    const Configuracoes = () => {
      return (
        <AppShell>
          <div className="container mx-auto py-6 space-y-6">
            <h1 className="text-2xl font-bold">Configurações</h1>

            <Tabs defaultValue="whatsapp_api" className="space-y-4">
              {/* Lista de Abas */}
              <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap h-auto justify-start">
                <TabsTrigger value="whatsapp_api" className="flex items-center gap-2"><Webhook className="h-4 w-4" /><span>WhatsApp API</span></TabsTrigger>
                <TabsTrigger value="hospitais" className="flex items-center gap-2"><Building className="h-4 w-4" /><span>Hospitais</span></TabsTrigger>
                <TabsTrigger value="medicos" className="flex items-center gap-2"><Stethoscope className="h-4 w-4" /><span>Médicos</span></TabsTrigger>
                {/* Adicionar Trigger para Procedimentos */}
                <TabsTrigger value="procedimentos" className="flex items-center gap-2"><ClipboardList className="h-4 w-4" /><span>Procedimentos</span></TabsTrigger>
                <TabsTrigger value="usuarios" className="flex items-center gap-2"><Users className="h-4 w-4" /><span>Usuários</span></TabsTrigger>
                <TabsTrigger value="convenios" className="flex items-center gap-2"><CreditCard className="h-4 w-4" /><span>Convênios</span></TabsTrigger>
                <TabsTrigger value="marketing" className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /><span>Marketing</span></TabsTrigger>
              </TabsList>

              {/* Conteúdo das Abas */}
              <TabsContent value="whatsapp_api" className="mt-0">
                <WhatsAppApiConfig />
              </TabsContent>

              {/* Suspense envolve os componentes carregados preguiçosamente */}
              <Suspense fallback={<SettingsLoadingFallback />}>
                  <TabsContent value="hospitais" className="mt-0">
                      <HospitaisSettings />
                  </TabsContent>
                  <TabsContent value="medicos" className="mt-0">
                      <MedicosSettings />
                  </TabsContent>
                  {/* Adicionar Content para Procedimentos */}
                  <TabsContent value="procedimentos" className="mt-0">
                      <ProcedimentosSettings />
                  </TabsContent>
                  <TabsContent value="usuarios" className="mt-0">
                      <UsuariosSettings />
                  </TabsContent>
                  <TabsContent value="convenios" className="mt-0">
                      <ConveniosSettings />
                  </TabsContent>
                  <TabsContent value="marketing" className="mt-0">
                      <MarketingSettings />
                  </TabsContent>
              </Suspense>

            </Tabs>
          </div>
        </AppShell>
      );
    };

    export default Configuracoes;
