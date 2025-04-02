import React, { useState, useEffect } from "react";
    import { AppShell } from "@/components/layout/app-shell";
    import {
      Tabs,
      TabsContent,
      TabsList,
      TabsTrigger
    } from "@/components/ui/tabs";
    import { Button } from "@/components/ui/button";
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Badge } from "@/components/ui/badge";
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
    import { DataTable } from "@/components/dashboard/data-table";
    import { ColumnDef } from "@tanstack/react-table";
    import { QRCodeDisplay } from "@/components/ui/qr-code";
    import {
      ArrowUpDown,
      Building,
      FileSpreadsheet,
      PlusCircle,
      User,
      Users,
      ShieldCheck,
      Stethoscope,
      CreditCard,
      MessageSquare,
      Webhook,
      RefreshCw,
      Power,
      PowerOff,
      CheckCircle,
      XCircle,
      AlertTriangle,
      Loader2,
      Save
    } from "lucide-react";
    import { useToast } from "@/hooks/use-toast";
    import { Separator } from "@/components/ui/separator";
    import { useApiConfig } from "@/contexts/ApiConfigContext";
    // Import API service functions
    import {
        checkInstanceStatus,
        connectInstance,
        disconnectInstance,
        EvolutionApiError // Import the custom error
    } from "@/lib/evolution-api";

    // --- Types ---
    type Hospital = { id: string; nome: string; endereco: string; telefone: string; responsavel: string; contatoSCM: string; contatoAgendamento: string; }
    type Medico = { id: string; nome: string; crm: string; rqe: string; hospital: string; }
    type Usuario = { id: string; nome: string; email: string; cpf: string; nivelAcesso: "Super Admin" | "Admin" | "Gestor" | "Supervisor" | "Consultor"; }
    type Convenio = { id: string; nome: string; hospital: string; tipo: string; }
    type FonteMarketing = { id: string; nome: string; origem: "Publicidade Digital" | "Publicidade Tradicional" | "Indicação" | "Evento"; ativo: boolean; }
    type ApiStatus = "disconnected" | "connected" | "connecting" | "error" | "needs_qr";
    // --- End Types ---

    // --- Columns Definitions (Keep as before) ---
    const hospitaisColumns: ColumnDef<Hospital>[] = [ { accessorKey: "nome", header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Nome<ArrowUpDown className="ml-2 h-4 w-4" /></Button>), }, { accessorKey: "endereco", header: "Endereço", }, { accessorKey: "telefone", header: "Telefone", }, { accessorKey: "responsavel", header: "Responsável", }, { accessorKey: "contatoSCM", header: "Contato SCM", }, { accessorKey: "contatoAgendamento", header: "Contato Agendamento", }, { id: "acoes", cell: () => (<div className="flex space-x-2"><Button variant="ghost" size="sm">Editar</Button></div>), }, ];
    const medicosColumns: ColumnDef<Medico>[] = [ { accessorKey: "nome", header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Nome<ArrowUpDown className="ml-2 h-4 w-4" /></Button>), }, { accessorKey: "crm", header: "CRM", }, { accessorKey: "rqe", header: "RQE", }, { accessorKey: "hospital", header: "Hospital", }, { id: "acoes", cell: () => (<div className="flex space-x-2"><Button variant="ghost" size="sm">Editar</Button></div>), }, ];
    const usuariosColumns: ColumnDef<Usuario>[] = [ { accessorKey: "nome", header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Nome<ArrowUpDown className="ml-2 h-4 w-4" /></Button>), }, { accessorKey: "email", header: "Email", }, { accessorKey: "cpf", header: "CPF", }, { accessorKey: "nivelAcesso", header: "Nível de Acesso", cell: ({ row }) => { const nivel = row.getValue("nivelAcesso") as string; const colorMap: { [key: string]: string } = { "Super Admin": "bg-purple-100 text-purple-800", "Admin": "bg-blue-100 text-blue-800", "Gestor": "bg-green-100 text-green-800", "Supervisor": "bg-amber-100 text-amber-800", "Consultor": "bg-slate-100 text-slate-800", }; return (<Badge variant="outline" className={colorMap[nivel] ?? "bg-gray-100 text-gray-800"}>{nivel}</Badge>); }, }, { id: "acoes", cell: () => (<div className="flex space-x-2"><Button variant="ghost" size="sm">Editar</Button></div>), }, ];
    const conveniosColumns: ColumnDef<Convenio>[] = [ { accessorKey: "nome", header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Nome<ArrowUpDown className="ml-2 h-4 w-4" /></Button>), }, { accessorKey: "hospital", header: "Hospital", }, { accessorKey: "tipo", header: "Tipo", }, { id: "acoes", cell: () => (<div className="flex space-x-2"><Button variant="ghost" size="sm">Editar</Button></div>), }, ];
    const fontesMarketingColumns: ColumnDef<FonteMarketing>[] = [ { accessorKey: "nome", header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Nome<ArrowUpDown className="ml-2 h-4 w-4" /></Button>), }, { accessorKey: "origem", header: "Origem", cell: ({ row }) => { const origem = row.getValue("origem") as string; const colorMap: { [key: string]: string } = { "Publicidade Digital": "bg-blue-100 text-blue-800", "Publicidade Tradicional": "bg-amber-100 text-amber-800", "Indicação": "bg-green-100 text-green-800", "Evento": "bg-purple-100 text-purple-800", }; return (<Badge variant="outline" className={colorMap[origem] ?? "bg-gray-100 text-gray-800"}>{origem}</Badge>); }, }, { accessorKey: "ativo", header: "Status", cell: ({ row }) => { const ativo = row.getValue("ativo") as boolean; return (<Badge variant={ativo ? "default" : "outline"} className={ativo ? "" : "bg-gray-100 text-gray-800"}>{ativo ? "Ativo" : "Inativo"}</Badge>); }, }, { id: "acoes", cell: () => (<div className="flex space-x-2"><Button variant="ghost" size="sm">Editar</Button><Button variant="ghost" size="sm" className="text-destructive">Desativar</Button></div>), }, ];
    // --- End Columns Definitions ---

    // --- Sample Data (Keep as before) ---
    const hospitais: Hospital[] = [ { id: "1", nome: "Hospital São Lucas", endereco: "Rua A, 123", telefone: "(11) 1234-5678", responsavel: "João Silva", contatoSCM: "(11) 8765-4321", contatoAgendamento: "(11) 9876-5432" }, { id: "2", nome: "Hospital Santa Maria", endereco: "Av. B, 456", telefone: "(11) 2345-6789", responsavel: "Maria Santos", contatoSCM: "(11) 7654-3210", contatoAgendamento: "(11) 8765-4321" }, { id: "3", nome: "Hospital São Francisco", endereco: "Rua C, 789", telefone: "(11) 3456-7890", responsavel: "Pedro Oliveira", contatoSCM: "(11) 6543-2109", contatoAgendamento: "(11) 7654-3210" }, ];
    const medicos: Medico[] = [ { id: "1", nome: "Dr. Ricardo Silva", crm: "12345-SP", rqe: "54321", hospital: "Hospital São Lucas" }, { id: "2", nome: "Dra. Carla Santos", crm: "23456-SP", rqe: "65432", hospital: "Hospital Santa Maria" }, { id: "3", nome: "Dr. Marcos Oliveira", crm: "34567-SP", rqe: "76543", hospital: "Hospital São Francisco" }, { id: "4", nome: "Dra. Paula Costa", crm: "45678-SP", rqe: "87654", hospital: "Hospital São Lucas" }, ];
    const usuarios: Usuario[] = [ { id: "1", nome: "Admin Master", email: "admin@crm.com", cpf: "111.222.333-44", nivelAcesso: "Super Admin" }, { id: "2", nome: "Gestor de Vendas", email: "gestor@crm.com", cpf: "222.333.444-55", nivelAcesso: "Gestor" }, { id: "3", nome: "Supervisor 1", email: "supervisor1@crm.com", cpf: "333.444.555-66", nivelAcesso: "Supervisor" }, { id: "4", nome: "Consultor 1", email: "consultor1@crm.com", cpf: "444.555.666-77", nivelAcesso: "Consultor" }, { id: "5", nome: "Consultor 2", email: "consultor2@crm.com", cpf: "555.666.777-88", nivelAcesso: "Consultor" }, ];
    const convenios: Convenio[] = [ { id: "1", nome: "Unimed", hospital: "Hospital São Lucas", tipo: "Pré-pago" }, { id: "2", nome: "SulAmérica", hospital: "Hospital São Lucas", tipo: "Pós-pago" }, { id: "3", nome: "Amil", hospital: "Hospital Santa Maria", tipo: "Pré-pago" }, { id: "4", nome: "Bradesco Saúde", hospital: "Hospital Santa Maria", tipo: "Pós-pago" }, { id: "5", nome: "Porto Seguro", hospital: "Hospital São Francisco", tipo: "Pré-pago" }, ];
    const fontesMarketing: FonteMarketing[] = [ { id: "1", nome: "Facebook", origem: "Publicidade Digital", ativo: true }, { id: "2", nome: "Google", origem: "Publicidade Digital", ativo: true }, { id: "3", nome: "Instagram", origem: "Publicidade Digital", ativo: true }, { id: "4", nome: "Revista", origem: "Publicidade Tradicional", ativo: false }, { id: "5", nome: "TV", origem: "Publicidade Tradicional", ativo: true }, { id: "6", nome: "Rádio", origem: "Publicidade Tradicional", ativo: false }, { id: "7", nome: "Paciente", origem: "Indicação", ativo: true }, { id: "8", nome: "Médico", origem: "Indicação", ativo: true }, { id: "9", nome: "Feira de Saúde", origem: "Evento", ativo: true }, { id: "10", nome: "Congresso", origem: "Evento", ativo: true }, ];
    // --- End Sample Data ---


    const Configuracoes = () => {
      const { toast } = useToast();
      const { apiConfig, setApiConfig } = useApiConfig(); // Use context

      // Local state for connection status, QR code, loading, etc.
      const [apiStatus, setApiStatus] = useState<ApiStatus>("disconnected");
      const [qrCode, setQrCode] = useState<string | null>(null);
      const [isLoading, setIsLoading] = useState(false); // Single loading state
      const [connectionError, setConnectionError] = useState<string | null>(null);

      // Local state for input fields to allow editing before saving to context
      const [localApiUrl, setLocalApiUrl] = useState(apiConfig.apiUrl);
      const [localApiKey, setLocalApiKey] = useState(apiConfig.apiKey);
      const [localApiInstance, setLocalApiInstance] = useState(apiConfig.apiInstance);
      const [hasChanges, setHasChanges] = useState(false);

      // Update local state when context changes (e.g., loaded from storage)
      useEffect(() => {
          setLocalApiUrl(apiConfig.apiUrl);
          setLocalApiKey(apiConfig.apiKey);
          setLocalApiInstance(apiConfig.apiInstance);
          setHasChanges(false); // Reset changes flag when context updates externally
      }, [apiConfig]);

      // Track changes in input fields
      useEffect(() => {
          const changed = localApiUrl !== apiConfig.apiUrl ||
                          localApiKey !== apiConfig.apiKey ||
                          localApiInstance !== apiConfig.apiInstance;
          setHasChanges(changed);
      }, [localApiUrl, localApiKey, localApiInstance, apiConfig]);


      // --- Function to fetch QR Code using the service ---
      const fetchQrCode = async () => {
          setIsLoading(true);
          setQrCode(null);
          setConnectionError(null);
          setApiStatus("connecting"); // Indicate attempt

          try {
              console.log("[ConfigPage] Calling connectInstance with config:", apiConfig);
              const data = await connectInstance(apiConfig); // Use service
              console.log("[ConfigPage] connectInstance Response:", data);

              const base64Qr = data?.base64 || data?.qrcode?.base64 || null;

              if (base64Qr) {
                  setQrCode(base64Qr);
                  setApiStatus("needs_qr");
                  toast({ title: "QR Code Recebido", description: "Escaneie o código com seu WhatsApp." });
              } else if (data?.instance?.state === 'open' || data?.instance?.state === 'connected') {
                  setApiStatus("connected");
                   toast({ title: "API Conectada", description: "Conexão já estava ativa ou foi estabelecida." });
              } else {
                  console.warn("[ConfigPage] Received OK response but no QR code and not connected:", data);
                  setApiStatus("error");
                  setConnectionError("Não foi possível obter o QR Code. Verifique o status da instância ou tente novamente.");
                  toast({ variant: "destructive", title: "Erro", description: "Não foi possível obter o QR Code." });
              }

          } catch (error: any) {
              console.error("[ConfigPage] Error fetching QR Code via service:", error);
              setApiStatus("error");
              const errorMsg = error instanceof EvolutionApiError ? error.message : "Falha ao buscar QR Code.";
              setConnectionError(errorMsg);
              toast({ variant: "destructive", title: "Erro ao buscar QR Code", description: errorMsg });
          } finally {
              setIsLoading(false);
          }
      };

      // --- Function to check current connection status using the service ---
      const checkApiStatusHandler = async () => {
          setIsLoading(true);
          setConnectionError(null);
          setQrCode(null); // Clear QR while checking status
          setApiStatus("connecting");
          console.log("[ConfigPage] Checking API Status via service...");

          try {
              const data = await checkInstanceStatus(apiConfig); // Use service
              console.log("[ConfigPage] checkInstanceStatus Response:", data);
              const currentState = data?.instance?.state;

              switch (currentState) {
                  case 'open':
                  case 'connected': // Handle both 'open' and 'connected' as connected
                      setApiStatus("connected"); toast({ title: "Status: Conectado" }); break;
                  case 'close': setApiStatus("disconnected"); toast({ title: "Status: Desconectado" }); break;
                  case 'connecting': setApiStatus("needs_qr"); toast({ title: "Status: Conectando", description: "Tentando obter QR Code..." }); await fetchQrCode(); break; // Fetch QR if connecting
                  default: console.warn("[ConfigPage] Unexpected API state:", currentState); setApiStatus("disconnected"); toast({ title: "Status: Desconhecido" }); break;
              }

          } catch (error: any) {
              console.error("[ConfigPage] Error checking API Status via service:", error);
              setApiStatus("error");
              const errorMsg = error instanceof EvolutionApiError ? error.message : "Falha ao verificar status.";
              setConnectionError(errorMsg);
              toast({ variant: "destructive", title: "Erro ao Verificar Status", description: errorMsg });
          } finally {
              setIsLoading(false);
          }
      };

      // --- Save Config Handler ---
      const handleSaveConfig = () => {
          setApiConfig({
              apiUrl: localApiUrl,
              apiKey: localApiKey,
              apiInstance: localApiInstance,
          });
          setHasChanges(false);
          toast({ title: "Configuração Salva", description: "As novas configurações da API foram salvas." });
          // Re-check status after saving new config
          checkApiStatusHandler();
      };

      // --- API Interaction Functions using the service ---
      const handleConnectApi = async () => {
          if (hasChanges) {
              toast({ variant: "destructive", title: "Salve as Configurações", description: "Salve as alterações antes de conectar." });
              return;
          }
          toast({ title: "Conectando API...", description: "Tentando conectar à API Evolution." });
          await fetchQrCode(); // This now uses the service indirectly
      };

      const handleDisconnectApi = async () => {
          setIsLoading(true);
          setConnectionError(null);
          toast({ title: "Desconectando API..." });

          try {
              const result = await disconnectInstance(apiConfig); // Use service
              console.log("[ConfigPage] disconnectInstance Response:", result);
              setApiStatus("disconnected");
              setQrCode(null);
              toast({ title: "API Desconectada", description: result.message });

          } catch (error: any) {
              console.error("[ConfigPage] Error disconnecting API via service:", error);
              // Status might still be connected if disconnect failed, or error if API unreachable
              // Re-check status to be sure? Or just show error.
              // setApiStatus("error"); // Or keep previous status?
              const errorMsg = error instanceof EvolutionApiError ? error.message : "Falha ao desconectar.";
              setConnectionError(errorMsg);
              toast({ variant: "destructive", title: "Erro ao Desconectar", description: errorMsg });
          } finally {
              setIsLoading(false);
          }
      };

      const handleRefreshQrCode = async () => {
          if (hasChanges) {
              toast({ variant: "destructive", title: "Salve as Configurações", description: "Salve as alterações antes de verificar o status." });
              return;
          }
          toast({ title: "Verificando Status / Atualizando QR Code..." });
          await checkApiStatusHandler(); // Use the handler which calls the service
      };
      // --- End API Interaction Functions ---

      // --- Effect to check status on load ---
      useEffect(() => {
          console.log("[ConfigPage] Component mounted. Checking API status with config:", apiConfig);
          if (apiConfig.apiUrl && apiConfig.apiKey && apiConfig.apiInstance) {
              checkApiStatusHandler();
          } else {
              console.warn("[ConfigPage] Initial API config incomplete, skipping status check.");
              setApiStatus("disconnected"); // Assume disconnected if config is bad
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [apiConfig]); // Re-check status if apiConfig from context changes


      const handleFileUpload = () => {
        toast({ title: "Upload de arquivo", description: "Funcionalidade em desenvolvimento", });
      };

      const handleAddItem = (type: string) => {
        toast({ title: `Adicionar ${type}`, description: "Funcionalidade em desenvolvimento", });
      };

      const renderApiStatus = () => {
        switch (apiStatus) {
          case "connected":
            return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-4 w-4 mr-1" /> Conectado</Badge>;
          case "connecting":
            return <Badge variant="outline" className="text-blue-600 border-blue-300"><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Verificando...</Badge>;
          case "needs_qr":
            return <Badge variant="outline" className="text-yellow-600 border-yellow-400"><AlertTriangle className="h-4 w-4 mr-1" /> Escanear QR Code</Badge>;
          case "error":
            return <Badge variant="destructive"><XCircle className="h-4 w-4 mr-1" /> Erro</Badge>;
          case "disconnected":
          default:
            return <Badge variant="secondary"><PowerOff className="h-4 w-4 mr-1" /> Desconectado</Badge>;
        }
      };

      // --- Render Logic ---
      return (
        <AppShell>
          <div className="container mx-auto py-6 space-y-6">
            <h1 className="text-2xl font-bold">Configurações</h1>

            <Tabs defaultValue="whatsapp_api" className="space-y-4">
              <TabsList className="flex flex-wrap h-auto justify-start">
                <TabsTrigger value="whatsapp_api" className="flex items-center gap-2"><Webhook className="h-4 w-4" /><span>WhatsApp API</span></TabsTrigger>
                <TabsTrigger value="hospitais" className="flex items-center gap-2"><Building className="h-4 w-4" /><span>Hospitais</span></TabsTrigger>
                <TabsTrigger value="medicos" className="flex items-center gap-2"><Stethoscope className="h-4 w-4" /><span>Médicos</span></TabsTrigger>
                <TabsTrigger value="usuarios" className="flex items-center gap-2"><Users className="h-4 w-4" /><span>Usuários</span></TabsTrigger>
                <TabsTrigger value="convenios" className="flex items-center gap-2"><CreditCard className="h-4 w-4" /><span>Convênios</span></TabsTrigger>
                <TabsTrigger value="marketing" className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /><span>Marketing</span></TabsTrigger>
              </TabsList>

              {/* WhatsApp API Tab */}
              <TabsContent value="whatsapp_api" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuração da API Evolution (WhatsApp)</CardTitle>
                    <CardDescription>
                      Configure os detalhes para conectar à sua instância da Evolution API.
                      Use o botão "Salvar Configuração" após alterar os campos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Connection Settings */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Conexão</h3>
                        <div className="space-y-2">
                          <Label htmlFor="apiUrl">URL da API</Label>
                          <Input
                            id="apiUrl"
                            placeholder="Ex: https://evo1.profusaodigital.com"
                            value={localApiUrl} // Use local state for input
                            onChange={(e) => setLocalApiUrl(e.target.value)}
                            disabled={isLoading || apiStatus === 'connected'}
                          />
                          <p className="text-xs text-muted-foreground">O endereço onde sua Evolution API está rodando.</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apiKey">Chave da API (API Key)</Label>
                          <Input
                            id="apiKey"
                            type="password"
                            placeholder="Sua chave secreta da API"
                            value={localApiKey} // Use local state for input
                            onChange={(e) => setLocalApiKey(e.target.value)}
                            disabled={isLoading || apiStatus === 'connected'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apiInstance">Nome da Instância</Label>
                          <Input
                            id="apiInstance"
                            placeholder="Ex: Acesso Oftalmologia"
                            value={localApiInstance} // Use local state for input
                            onChange={(e) => setLocalApiInstance(e.target.value)}
                            disabled={isLoading || apiStatus === 'connected'}
                          />
                           <p className="text-xs text-muted-foreground">O nome da instância que você deseja usar.</p>
                        </div>
                         <Separator />
                         {/* Save Config Button */}
                         <Button onClick={handleSaveConfig} disabled={!hasChanges || isLoading || apiStatus === 'connected'}>
                             <Save className="mr-2 h-4 w-4" />
                             Salvar Configuração
                         </Button>
                         {hasChanges && <p className="text-xs text-amber-600">Você tem alterações não salvas.</p>}
                         <Separator />
                         <div className="flex flex-col sm:flex-row gap-2">
                            {/* Connect Button */}
                            {apiStatus !== 'connected' && (
                                <Button onClick={handleConnectApi} disabled={isLoading || hasChanges || !apiConfig.apiUrl || !apiConfig.apiKey || !apiConfig.apiInstance}>
                                    {isLoading && apiStatus === 'connecting' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Power className="mr-2 h-4 w-4" />}
                                    {isLoading && apiStatus === 'connecting' ? 'Conectando...' : 'Conectar'}
                                </Button>
                            )}
                            {/* Disconnect Button */}
                            {apiStatus === 'connected' && (
                                <Button variant="destructive" onClick={handleDisconnectApi} disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PowerOff className="mr-2 h-4 w-4" />}
                                    {isLoading ? 'Desconectando...' : 'Desconectar'}
                                </Button>
                            )}
                            {/* Refresh/Check Status Button */}
                             <Button variant="outline" onClick={handleRefreshQrCode} disabled={isLoading || hasChanges}>
                                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                {isLoading ? 'Verificando...' : 'Verificar Status / QR Code'}
                            </Button>
                         </div>
                      </div>

                      {/* Status and QR Code */}
                      <div className="space-y-4">
                         <h3 className="text-lg font-medium">Status & QR Code</h3>
                         <div className="flex items-center space-x-2">
                            <Label>Status:</Label>
                            {renderApiStatus()}
                         </div>
                         {connectionError && apiStatus === 'error' && (
                            <p className="text-sm text-destructive">{connectionError}</p>
                         )}
                         <div className="flex justify-center md:justify-start">
                            <QRCodeDisplay
                                value={qrCode}
                                isLoading={isLoading && (apiStatus === 'connecting' || apiStatus === 'needs_qr')} // Show loading specifically when fetching QR
                                error={connectionError && (apiStatus === 'needs_qr' || apiStatus === 'error') ? connectionError : null}
                                size={200}
                            />
                         </div>
                         {apiStatus === 'needs_qr' && !isLoading && qrCode && (
                            <p className="text-sm text-center md:text-left text-muted-foreground">
                                Abra o WhatsApp no seu celular e escaneie este código para conectar a instância.
                            </p>
                         )}
                         {apiStatus === 'connected' && (
                             <p className="text-sm text-center md:text-left text-green-600">
                                 Instância conectada e pronta para uso.
                             </p>
                         )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Other Tabs (Hospitais, Medicos, etc.) - Keep as they were */}
              <TabsContent value="hospitais" className="space-y-4">
                <Card className="w-full">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div><CardTitle>Hospitais Parceiros</CardTitle><CardDescription>Gerencie os hospitais parceiros.</CardDescription></div>
                      <div className="flex space-x-2"><Button variant="outline" onClick={handleFileUpload}><FileSpreadsheet className="h-4 w-4 mr-2" />Importar CSV</Button><Button onClick={() => handleAddItem("hospital")}><PlusCircle className="h-4 w-4 mr-2" />Novo Hospital</Button></div>
                    </div>
                  </CardHeader>
                  <CardContent><DataTable columns={hospitaisColumns} data={hospitais} searchPlaceholder="Filtrar hospitais..." /></CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="medicos" className="space-y-4">
                 <Card className="w-full">
                   <CardHeader>
                     <div className="flex justify-between items-center">
                       <div><CardTitle>Médicos</CardTitle><CardDescription>Gerencie os médicos cadastrados.</CardDescription></div>
                       <div className="flex space-x-2"><Button variant="outline" onClick={handleFileUpload}><FileSpreadsheet className="h-4 w-4 mr-2" />Importar CSV</Button><Button onClick={() => handleAddItem("médico")}><PlusCircle className="h-4 w-4 mr-2" />Novo Médico</Button></div>
                     </div>
                   </CardHeader>
                   <CardContent><DataTable columns={medicosColumns} data={medicos} searchPlaceholder="Filtrar médicos..." /></CardContent>
                 </Card>
              </TabsContent>

              <TabsContent value="usuarios" className="space-y-4">
                <Card className="w-full">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div><CardTitle>Usuários</CardTitle><CardDescription>Gerencie os usuários e seus níveis de acesso.</CardDescription></div>
                      <Button onClick={() => handleAddItem("usuário")}><PlusCircle className="h-4 w-4 mr-2" />Novo Usuário</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <h3 className="text-sm font-medium mb-2 flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-muted-foreground" />Níveis de Acesso</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 justify-center">Super Admin</Badge>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 justify-center">Admin</Badge>
                        <Badge variant="outline" className="bg-green-100 text-green-800 justify-center">Gestor</Badge>
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 justify-center">Supervisor</Badge>
                        <Badge variant="outline" className="bg-slate-100 text-slate-800 justify-center">Consultor</Badge>
                      </div>
                    </div>
                    <DataTable columns={usuariosColumns} data={usuarios} searchPlaceholder="Filtrar usuários..." />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="convenios" className="space-y-4">
                <Card className="w-full">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div><CardTitle>Convênios</CardTitle><CardDescription>Gerencie os convênios associados.</CardDescription></div>
                      <div className="flex space-x-2"><Button variant="outline" onClick={handleFileUpload}><FileSpreadsheet className="h-4 w-4 mr-2" />Importar CSV</Button><Button onClick={() => handleAddItem("convênio")}><PlusCircle className="h-4 w-4 mr-2" />Novo Convênio</Button></div>
                    </div>
                  </CardHeader>
                  <CardContent><DataTable columns={conveniosColumns} data={convenios} searchPlaceholder="Filtrar convênios..." /></CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="marketing" className="space-y-4">
                <Card className="w-full">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div><CardTitle>Campos de Marketing</CardTitle><CardDescription>Configure as opções para os campos de marketing.</CardDescription></div>
                      <Button onClick={() => handleAddItem("fonte de marketing")}><PlusCircle className="h-4 w-4 mr-2" />Nova Fonte</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Origens (Fixas)</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">Publicidade Digital</Badge>
                        <Badge variant="outline" className="bg-amber-100 text-amber-800">Publicidade Tradicional</Badge>
                        <Badge variant="outline" className="bg-green-100 text-green-800">Indicação</Badge>
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">Evento</Badge>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Fontes (Configuráveis)</h3>
                      <DataTable columns={fontesMarketingColumns} data={fontesMarketing} searchPlaceholder="Filtrar fontes..." />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        </AppShell>
      );
    };

    export default Configuracoes;
