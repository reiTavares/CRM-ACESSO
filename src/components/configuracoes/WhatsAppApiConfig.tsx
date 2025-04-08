import React, { useState, useEffect, useCallback } from "react";
    import { Button } from "@/components/ui/button";
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Badge } from "@/components/ui/badge";
    import { QRCodeDisplay } from "@/components/ui/qr-code";
    import { Separator } from "@/components/ui/separator";
    import { useToast } from "@/hooks/use-toast";
    import { useApiConfig } from "@/contexts/ApiConfigContext";
    import {
        checkInstanceStatus,
        connectInstance,
        disconnectInstance,
        EvolutionApiError
    } from "@/lib/evolution-api";
    import {
      RefreshCw, Power, PowerOff, CheckCircle, XCircle, AlertTriangle, Loader2, Save
    } from "lucide-react";
    import { cn } from "@/lib/utils";

    type ApiStatus = "disconnected" | "connected" | "connecting" | "error" | "needs_qr";

    export const WhatsAppApiConfig: React.FC = () => {
        const { toast } = useToast();
        const { apiConfig, setApiConfig } = useApiConfig();

        const [apiStatus, setApiStatus] = useState<ApiStatus>("disconnected");
        const [qrCode, setQrCode] = useState<string | null>(null);
        const [isLoading, setIsLoading] = useState(false);
        const [connectionError, setConnectionError] = useState<string | null>(null);

        // Estado local para edição antes de salvar no contexto
        const [localApiUrl, setLocalApiUrl] = useState(apiConfig.apiUrl);
        const [localApiKey, setLocalApiKey] = useState(apiConfig.apiKey);
        const [localApiInstance, setLocalApiInstance] = useState(apiConfig.apiInstance);
        const [hasChanges, setHasChanges] = useState(false);

        // Verifica se a configuração da API é válida
        const isApiConfigValid = useCallback((config: typeof apiConfig) => {
            return !!config.apiUrl?.trim() && !!config.apiKey?.trim() && !!config.apiInstance?.trim();
        }, []);

        // Atualiza estado local quando o contexto muda
        useEffect(() => {
            setLocalApiUrl(apiConfig.apiUrl);
            setLocalApiKey(apiConfig.apiKey);
            setLocalApiInstance(apiConfig.apiInstance);
            setHasChanges(false); // Reseta flag ao receber novas configs do contexto
        }, [apiConfig]);

        // Rastreia mudanças nos inputs locais
        useEffect(() => {
            const changed = localApiUrl !== apiConfig.apiUrl ||
                            localApiKey !== apiConfig.apiKey ||
                            localApiInstance !== apiConfig.apiInstance;
            setHasChanges(changed);
        }, [localApiUrl, localApiKey, localApiInstance, apiConfig]);

        // --- Funções de Interação com API (movidas para cá) ---
        const fetchQrCode = useCallback(async () => {
            if (!isApiConfigValid(apiConfig)) {
                toast({ variant: "destructive", title: "Configuração Inválida", description: "Preencha URL, Chave e Instância da API." });
                setApiStatus("disconnected");
                return;
            }
            setIsLoading(true);
            setQrCode(null);
            setConnectionError(null);
            setApiStatus("connecting");
            toast({ title: "Tentando Conectar...", description: "Buscando QR Code ou status da conexão." });

            try {
                const data = await connectInstance(apiConfig);
                const base64Qr = data?.base64 || data?.qrcode?.base64 || null;
                if (base64Qr) {
                    setQrCode(base64Qr); setApiStatus("needs_qr");
                    toast({ title: "QR Code Recebido", description: "Escaneie o código com seu WhatsApp." });
                } else if (data?.instance?.state === 'open' || data?.instance?.state === 'connected') {
                    setApiStatus("connected");
                    toast({ title: "API Conectada", description: "A conexão foi estabelecida com sucesso." });
                } else {
                    console.warn("[WhatsAppApiConfig] Unexpected state after connect attempt:", data?.instance?.state, data);
                    setApiStatus("disconnected");
                    const stateMsg = data?.instance?.state ? `Estado retornado: ${data.instance.state}` : "Não foi possível obter o QR Code.";
                    setConnectionError(stateMsg);
                    toast({ variant: "destructive", title: "Falha na Conexão", description: stateMsg });
                }
            } catch (error: any) {
                console.error("[WhatsAppApiConfig] Error fetching QR Code:", error);
                setApiStatus("error");
                const errorMsg = error instanceof EvolutionApiError ? error.message : "Falha ao buscar QR Code ou conectar.";
                setConnectionError(errorMsg);
                toast({ variant: "destructive", title: "Erro na Conexão", description: errorMsg });
            } finally {
                setIsLoading(false);
            }
        }, [apiConfig, toast, isApiConfigValid]);

        const checkApiStatusHandler = useCallback(async (showToast = false) => {
            if (!isApiConfigValid(apiConfig)) {
                if (showToast) toast({ variant: "destructive", title: "Configuração Inválida", description: "Preencha URL, Chave e Instância da API." });
                setApiStatus("disconnected");
                return;
            }
            setIsLoading(true);
            setConnectionError(null);
            setQrCode(null);
            setApiStatus("connecting");
            if (showToast) toast({ title: "Verificando Status..." });

            try {
                const data = await checkInstanceStatus(apiConfig);
                const currentState = data?.instance?.state;
                switch (currentState) {
                    case 'open': case 'connected':
                        setApiStatus("connected"); if (showToast) toast({ title: "Status: Conectado" }); break;
                    case 'close':
                        setApiStatus("disconnected"); if (showToast) toast({ title: "Status: Desconectado" }); break;
                    case 'connecting':
                        setApiStatus("needs_qr"); if (showToast) toast({ title: "Status: Conectando", description: "Tentando obter QR Code..." });
                        await fetchQrCode(); break; // Tenta buscar QR
                    default:
                        console.warn("[WhatsAppApiConfig] Unexpected API state:", currentState);
                        setApiStatus("disconnected"); if (showToast) toast({ title: "Status: Desconhecido", description: `Estado retornado: ${currentState}` }); break;
                }
            } catch (error: any) {
                console.error("[WhatsAppApiConfig] Error checking API Status:", error);
                setApiStatus("error");
                const errorMsg = error instanceof EvolutionApiError ? error.message : "Falha ao verificar status da API.";
                setConnectionError(errorMsg);
                if (showToast) toast({ variant: "destructive", title: "Erro ao Verificar Status", description: errorMsg });
            } finally {
                setIsLoading(false);
            }
        }, [apiConfig, toast, isApiConfigValid, fetchQrCode]);

        const handleSaveConfig = () => {
            const newConfig = { apiUrl: localApiUrl, apiKey: localApiKey, apiInstance: localApiInstance };
            if (!isApiConfigValid(newConfig)) {
                toast({ variant: "destructive", title: "Configuração Inválida", description: "Preencha todos os campos corretamente." });
                return;
            }
            setApiConfig(newConfig); // Atualiza o contexto
            setHasChanges(false);
            toast({ title: "Configuração Salva", description: "As novas configurações da API foram aplicadas." });
            setTimeout(() => checkApiStatusHandler(true), 100); // Verifica status após salvar
        };

        const handleConnectApi = async () => {
            if (hasChanges) {
                toast({ variant: "destructive", title: "Salve as Configurações", description: "Salve as alterações antes de conectar." }); return;
            }
            await fetchQrCode();
        };

        const handleDisconnectApi = async () => {
            if (!isApiConfigValid(apiConfig)) { toast({ variant: "destructive", title: "Configuração Inválida" }); return; }
            setIsLoading(true); setConnectionError(null);
            toast({ title: "Desconectando API..." });
            try {
                const result = await disconnectInstance(apiConfig);
                setApiStatus("disconnected"); setQrCode(null);
                toast({ title: "API Desconectada", description: result.message });
            } catch (error: any) {
                console.error("[WhatsAppApiConfig] Error disconnecting API:", error);
                const errorMsg = error instanceof EvolutionApiError ? error.message : "Falha ao desconectar.";
                setConnectionError(errorMsg); setApiStatus("error");
                toast({ variant: "destructive", title: "Erro ao Desconectar", description: errorMsg });
            } finally {
                setIsLoading(false);
            }
        };

        const handleRefreshQrCode = async () => {
            if (hasChanges) {
                toast({ variant: "destructive", title: "Salve as Configurações", description: "Salve as alterações antes de verificar." }); return;
            }
            await checkApiStatusHandler(true);
        };

        // Efeito para verificar status ao montar o componente ou quando config mudar
        useEffect(() => {
            if (isApiConfigValid(apiConfig)) {
                checkApiStatusHandler(false); // Verifica sem toast inicial
            } else {
                setApiStatus("disconnected");
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [apiConfig, isApiConfigValid]); // Depende apenas da config e da função de validação

        // --- Renderizar Status da API ---
        const renderApiStatus = () => {
            switch (apiStatus) {
                case "connected": return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-4 w-4 mr-1" /> Conectado</Badge>;
                case "connecting": return <Badge variant="outline" className="text-blue-600 border-blue-300"><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Verificando...</Badge>;
                case "needs_qr": return <Badge variant="outline" className="text-yellow-600 border-yellow-400"><AlertTriangle className="h-4 w-4 mr-1" /> Escanear QR Code</Badge>;
                case "error": return <Badge variant="destructive"><XCircle className="h-4 w-4 mr-1" /> Erro</Badge>;
                case "disconnected": default: return <Badge variant="secondary"><PowerOff className="h-4 w-4 mr-1" /> Desconectado</Badge>;
            }
        };

        return (
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
                                <Input id="apiUrl" placeholder="Ex: https://evo.example.com" value={localApiUrl} onChange={(e) => setLocalApiUrl(e.target.value)} disabled={isLoading || apiStatus === 'connected'} />
                                <p className="text-xs text-muted-foreground">O endereço onde sua Evolution API está rodando.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="apiKey">Chave da API (API Key)</Label>
                                <Input id="apiKey" type="password" placeholder="Sua chave secreta da API" value={localApiKey} onChange={(e) => setLocalApiKey(e.target.value)} disabled={isLoading || apiStatus === 'connected'} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="apiInstance">Nome da Instância</Label>
                                <Input id="apiInstance" placeholder="Ex: InstanciaPrincipal" value={localApiInstance} onChange={(e) => setLocalApiInstance(e.target.value)} disabled={isLoading || apiStatus === 'connected'} />
                                <p className="text-xs text-muted-foreground">O nome da instância que você deseja usar.</p>
                            </div>
                            <Separator />
                            <Button onClick={handleSaveConfig} disabled={!hasChanges || isLoading || apiStatus === 'connected'}>
                                <Save className="mr-2 h-4 w-4" /> Salvar Configuração
                            </Button>
                            {hasChanges && <p className="text-xs text-amber-600">Você tem alterações não salvas.</p>}
                            <Separator />
                            <div className="flex flex-col sm:flex-row gap-2">
                                {apiStatus !== 'connected' && (
                                    <Button onClick={handleConnectApi} disabled={isLoading || hasChanges || !isApiConfigValid(apiConfig)}>
                                        {isLoading && apiStatus === 'connecting' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Power className="mr-2 h-4 w-4" />}
                                        {isLoading && apiStatus === 'connecting' ? 'Conectando...' : 'Conectar'}
                                    </Button>
                                )}
                                {apiStatus === 'connected' && (
                                    <Button variant="destructive" onClick={handleDisconnectApi} disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PowerOff className="mr-2 h-4 w-4" />}
                                        {isLoading ? 'Desconectando...' : 'Desconectar'}
                                    </Button>
                                )}
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
                                <Label>Status:</Label> {renderApiStatus()}
                            </div>
                            {connectionError && (apiStatus === 'error' || apiStatus === 'disconnected') && (
                                <p className="text-sm text-destructive">{connectionError}</p>
                            )}
                            <div className="flex justify-center md:justify-start">
                                <QRCodeDisplay value={qrCode} isLoading={isLoading && (apiStatus === 'connecting' || apiStatus === 'needs_qr')} error={apiStatus === 'error' ? connectionError : null} size={200} />
                            </div>
                            {apiStatus === 'needs_qr' && !isLoading && qrCode && ( <p className="text-sm text-center md:text-left text-muted-foreground"> Escaneie este código com o WhatsApp para conectar. </p> )}
                            {apiStatus === 'connected' && ( <p className="text-sm text-center md:text-left text-green-600"> Instância conectada e pronta para uso. </p> )}
                            {apiStatus === 'disconnected' && !connectionError && !isLoading && ( <p className="text-sm text-center md:text-left text-muted-foreground"> A instância está desconectada. Clique em "Conectar". </p> )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };
