import { ApiConfig } from "@/contexts/ApiConfigContext";

    // --- Helper to format URL ---
    const getFormattedApiUrl = (url: string | undefined): string | null => {
        if (!url) return null;
        let formattedUrl = url.trim(); // Remover espaços em branco extras
        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
            formattedUrl = `https://${formattedUrl}`;
        }
        return formattedUrl.replace(/\/$/, ""); // Remove trailing slash
    };

    // --- Types for API Responses (mantidas como antes, podem ser expandidas) ---
    interface InstanceStateResponse {
        instance: {
            instanceName: string;
            state: "open" | "close" | "connecting" | "connected" | string;
            status: string;
        };
    }

    interface ConnectResponse {
        instance: {
            instanceName: string;
            state: string;
            status: string;
        };
        qrcode?: {
            base64?: string;
            urlCode?: string;
        };
        base64?: string;
    }

    interface MessageSendResponse {
        key: {
            remoteJid: string;
            fromMe: boolean;
            id: string;
        };
        message: any;
        messageTimestamp: number;
        status: string;
    }

    interface ChatHistoryPayload {
        messages: {
            total: number;
            pages: number;
            currentPage: number;
            records: WhatsappMessage[];
        }
    }

    // Mantido exportado caso seja usado em outros lugares
    export interface WhatsappMessage {
        id?: string;
        key: {
            remoteJid: string;
            fromMe: boolean;
            id: string;
            participant?: string;
        };
        messageTimestamp: number;
        message?: {
            conversation?: string;
            extendedTextMessage?: { text: string };
            imageMessage?: { caption?: string; mimetype?: string; mediaUrl?: string; };
            videoMessage?: { caption?: string; mimetype?: string; mediaUrl?: string; };
            audioMessage?: { mimetype?: string; mediaUrl?: string; ptt?: boolean; };
            documentMessage?: { title?: string; mimetype?: string; mediaUrl?: string; };
        };
        ack?: number;
        pushName?: string;
        messageType?: string;
        instanceId?: string;
        source?: string;
        contextInfo?: any;
        MessageUpdate?: any[];
    }

    // --- API Error Class ---
    export class EvolutionApiError extends Error {
        status?: number;
        details?: any;

        constructor(message: string, status?: number, details?: any) {
            super(message);
            this.name = "EvolutionApiError";
            this.status = status;
            this.details = details;
        }
    }

    // --- Helper Refatorado para lidar com respostas fetch ---
    const handleApiResponse = async (response: Response, context: string = "API Call") => {
        const responseText = await response.text();
        let responseData: any;

        if (!response.ok) {
            // Tentativa de parsear JSON mesmo em erro para obter detalhes
            try {
                responseData = JSON.parse(responseText);
            } catch (jsonError) {
                // Se falhar o parse do erro, usa o texto da resposta
                console.error(`[EvolutionAPI - ${context}] API Error (Status ${response.status}, Non-JSON):`, responseText);
                throw new EvolutionApiError(
                    `Erro ${response.status}: ${response.statusText || 'Erro desconhecido na API'}`,
                    response.status,
                    responseText
                );
            }
            // Extrai a mensagem de erro do JSON, se possível
            const errorDetail = responseData?.message || responseData?.error?.message || responseData?.error || JSON.stringify(responseData);
            console.error(`[EvolutionAPI - ${context}] API Error (Status ${response.status}):`, errorDetail, responseData);
            throw new EvolutionApiError(
                typeof errorDetail === 'string' ? errorDetail : `Erro ${response.status}`,
                response.status,
                responseData
            );
        }

        // Se a resposta for OK (2xx), tenta parsear como JSON
        try {
            responseData = JSON.parse(responseText);
            return responseData;
        } catch (jsonError) {
            // Se a resposta for OK mas não for JSON válido, isso é um erro inesperado
            console.error(`[EvolutionAPI - ${context}] Invalid JSON response for OK status (Status ${response.status}):`, responseText);
            throw new EvolutionApiError(
                `Formato de resposta inesperado da API (esperado JSON, recebido texto)`,
                response.status,
                responseText
            );
        }
    };


    // --- API Service Functions (usando handleApiResponse refatorado) ---

    export const checkInstanceStatus = async (apiConfig: ApiConfig): Promise<InstanceStateResponse> => {
        const apiUrl = getFormattedApiUrl(apiConfig.apiUrl);
        if (!apiUrl || !apiConfig.apiKey || !apiConfig.apiInstance) {
            throw new EvolutionApiError("Configuração da API inválida (URL, Chave ou Instância ausente).");
        }
        const url = `${apiUrl}/instance/connectionState/${apiConfig.apiInstance}`;
        const context = "checkInstanceStatus";
        console.log(`[EvolutionAPI - ${context}] Checking status: GET ${url}`);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'apikey': apiConfig.apiKey }
            });
            return await handleApiResponse(response, context) as InstanceStateResponse;
        } catch (error: any) {
            console.error(`[EvolutionAPI - ${context}] Error:`, error);
            if (error instanceof EvolutionApiError) throw error;
            throw new EvolutionApiError(error.message || "Erro desconhecido ao verificar status.", undefined, error);
        }
    };

    export const connectInstance = async (apiConfig: ApiConfig): Promise<ConnectResponse> => {
        const apiUrl = getFormattedApiUrl(apiConfig.apiUrl);
        if (!apiUrl || !apiConfig.apiKey || !apiConfig.apiInstance) {
            throw new EvolutionApiError("Configuração da API inválida (URL, Chave ou Instância ausente).");
        }
        const url = `${apiUrl}/instance/connect/${apiConfig.apiInstance}`;
        const context = "connectInstance";
        console.log(`[EvolutionAPI - ${context}] Connecting/Fetching QR: GET ${url}`);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'apikey': apiConfig.apiKey }
            });
            return await handleApiResponse(response, context) as ConnectResponse;
        } catch (error: any) {
            console.error(`[EvolutionAPI - ${context}] Error:`, error);
            if (error instanceof EvolutionApiError) throw error;
            throw new EvolutionApiError(error.message || "Erro desconhecido ao conectar/buscar QR.", undefined, error);
        }
    };

    export const disconnectInstance = async (apiConfig: ApiConfig): Promise<{ success: boolean; message: string }> => {
        const apiUrl = getFormattedApiUrl(apiConfig.apiUrl);
        if (!apiUrl || !apiConfig.apiKey || !apiConfig.apiInstance) {
            throw new EvolutionApiError("Configuração da API inválida (URL, Chave ou Instância ausente).");
        }
        const url = `${apiUrl}/instance/logout/${apiConfig.apiInstance}`;
        const context = "disconnectInstance";
        console.log(`[EvolutionAPI - ${context}] Disconnecting: DELETE ${url}`);

        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'apikey': apiConfig.apiKey }
            });
            // Logout pode retornar 200 OK com mensagem simples ou 404 se já desconectado
            if (response.status === 404) {
                 console.log(`[EvolutionAPI - ${context}] Instance already disconnected or not found.`);
                 // Retornar um objeto compatível com o esperado em caso de sucesso
                 return { success: true, message: "Instância já desconectada ou não encontrada." };
            }
            // Para status 200 ou outros, usa handleApiResponse que espera JSON
            // Se a API retornar texto simples no 200, handleApiResponse lançará erro
            // Ajuste handleApiResponse ou a API se necessário para respostas 200 não-JSON
            const result = await handleApiResponse(response, context);
            // Assume que a resposta de sucesso tem uma estrutura como { message: "..." }
            return { success: true, message: result.message || "Desconectado com sucesso" };

        } catch (error: any) {
            // Trata erro 404 capturado por handleApiResponse
             if (error instanceof EvolutionApiError && error.status === 404) {
                 console.log(`[EvolutionAPI - ${context}] Instance already disconnected or not found (caught as error).`);
                 return { success: true, message: "Instância já desconectada ou não encontrada." };
             }
            console.error(`[EvolutionAPI - ${context}] Error:`, error);
            if (error instanceof EvolutionApiError) throw error;
            throw new EvolutionApiError(error.message || "Erro desconhecido ao desconectar.", undefined, error);
        }
    };

    export const sendMessage = async (apiConfig: ApiConfig, jid: string, text: string): Promise<MessageSendResponse> => {
        const apiUrl = getFormattedApiUrl(apiConfig.apiUrl);
        if (!apiUrl || !apiConfig.apiKey || !apiConfig.apiInstance) {
            throw new EvolutionApiError("Configuração da API inválida (URL, Chave ou Instância ausente).");
        }
        if (!jid || !text) {
            throw new EvolutionApiError("Número (JID) e texto da mensagem são obrigatórios.");
        }

        // NOTA: Verificar documentação da API para confirmar se é esperado apenas o número ou JID completo.
        const numberToSend = jid.split('@')[0];
        const url = `${apiUrl}/message/sendText/${apiConfig.apiInstance}`;
        const payload = {
            number: numberToSend,
            text: text
        };
        const context = "sendMessage";
        console.log(`[EvolutionAPI - ${context}] Sending Text: POST ${url}`);
        console.log(`  -> Payload:`, JSON.stringify(payload));

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'apikey': apiConfig.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            return await handleApiResponse(response, context) as MessageSendResponse;
        } catch (error: any) {
            console.error(`[EvolutionAPI - ${context}] Error:`, error);
            if (error instanceof EvolutionApiError) throw error;
            throw new EvolutionApiError(error.message || "Erro desconhecido ao enviar mensagem.", undefined, error);
        }
    };

    export const sendMedia = async (apiConfig: ApiConfig, jid: string, file: File, caption?: string): Promise<MessageSendResponse> => {
        const apiUrl = getFormattedApiUrl(apiConfig.apiUrl);
        if (!apiUrl || !apiConfig.apiKey || !apiConfig.apiInstance) {
            throw new EvolutionApiError("Configuração da API inválida (URL, Chave ou Instância ausente).");
        }
        if (!jid || !file) {
            throw new EvolutionApiError("Número (JID) e arquivo são obrigatórios para enviar mídia.");
        }

        // NOTA: Verificar documentação da API para formato do JID e como enviar caption.
        const numberToSend = jid.split('@')[0];
        const url = `${apiUrl}/message/sendMedia/${apiConfig.apiInstance}`;
        const formData = new FormData();
        formData.append('number', numberToSend);
        formData.append('media', file, file.name); // Campo 'media' conforme documentação comum
        if (caption) {
            // Tentativa comum: enviar caption dentro de um objeto 'options' JSON
            formData.append('options', JSON.stringify({ caption: caption }));
        }
        const context = "sendMedia";
        console.log(`[EvolutionAPI - ${context}] Sending Media: POST ${url}`);
        console.log(`  -> JID: ${jid}, File: ${file.name}, Caption: ${caption}`);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'apikey': apiConfig.apiKey }, // Content-Type definido pelo browser para FormData
                body: formData
            });
            return await handleApiResponse(response, context) as MessageSendResponse;
        } catch (error: any) {
            console.error(`[EvolutionAPI - ${context}] Error:`, error);
            if (error instanceof EvolutionApiError) throw error;
            throw new EvolutionApiError(error.message || "Erro desconhecido ao enviar mídia.", undefined, error);
        }
    };

     export const sendDocument = async (apiConfig: ApiConfig, jid: string, file: File, fileName?: string): Promise<MessageSendResponse> => {
         const apiUrl = getFormattedApiUrl(apiConfig.apiUrl);
         if (!apiUrl || !apiConfig.apiKey || !apiConfig.apiInstance) {
             throw new EvolutionApiError("Configuração da API inválida (URL, Chave ou Instância ausente).");
         }
         if (!jid || !file) {
             throw new EvolutionApiError("Número (JID) e arquivo são obrigatórios para enviar documento.");
         }

         // NOTA: Verificar documentação da API para formato do JID e nome do campo ('file' ou 'document').
         const numberToSend = jid.split('@')[0];
         // Endpoint comum para documentos é sendFile
         const url = `${apiUrl}/message/sendFile/${apiConfig.apiInstance}`;
         const formData = new FormData();
         formData.append('number', numberToSend);
         formData.append('file', file, fileName || file.name); // Campo 'file' é comum
         // Adicionar 'options' se necessário para filename, etc.
         // formData.append('options', JSON.stringify({ filename: fileName || file.name }));
         const context = "sendDocument";
         console.log(`[EvolutionAPI - ${context}] Sending Document: POST ${url}`);
         console.log(`  -> JID: ${jid}, File: ${fileName || file.name}`);

         try {
             const response = await fetch(url, {
                 method: 'POST',
                 headers: { 'apikey': apiConfig.apiKey },
                 body: formData
             });
             return await handleApiResponse(response, context) as MessageSendResponse;
         } catch (error: any) {
             console.error(`[EvolutionAPI - ${context}] Error:`, error);
             if (error instanceof EvolutionApiError) throw error;
             throw new EvolutionApiError(error.message || "Erro desconhecido ao enviar documento.", undefined, error);
         }
     };


    export const fetchChatHistory = async (apiConfig: ApiConfig, formattedJid: string, limit: number = 100): Promise<WhatsappMessage[]> => {
        const apiUrl = getFormattedApiUrl(apiConfig.apiUrl);
        if (!apiUrl || !apiConfig.apiKey || !apiConfig.apiInstance) {
            throw new EvolutionApiError("Configuração da API inválida (URL, Chave ou Instância ausente).");
        }
        if (!formattedJid) {
            throw new EvolutionApiError("Número (JID formatado) é obrigatório para buscar histórico.");
        }

        // NOTA: Estrutura do payload e endpoint podem variar com a versão da API.
        const url = `${apiUrl}/chat/findMessages/${apiConfig.apiInstance}`;
        const payload = {
            where: { key: { remoteJid: formattedJid } },
            // A API pode usar query params para paginação/limite em vez do body
            // Ex: /chat/findMessages/INSTANCE?jid=...&limit=100&page=1
            // Verificar documentação! O payload abaixo é uma suposição.
            // limit: limit // Adicionar limite se suportado no body
            // orderBy: { messageTimestamp: 'desc' } // Adicionar ordenação se suportado
        };
        const context = "fetchChatHistory";
        console.log(`[EvolutionAPI - ${context}] Fetching History: POST ${url}`);
        console.log(`  -> Payload:`, JSON.stringify(payload));

        try {
            const response = await fetch(url, {
                method: 'POST', // Ou GET com query params, dependendo da API
                headers: {
                    'apikey': apiConfig.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload) // Remover se usar GET
            });

            const responseData = await handleApiResponse(response, context) as ChatHistoryPayload;

            // Acessa o array de mensagens dentro da estrutura esperada
            const messagesArray = responseData?.messages?.records;

            if (!Array.isArray(messagesArray)) {
                 console.error(`[EvolutionAPI - ${context}] Unexpected history response format (expected messages.records array):`, responseData);
                 // Retorna array vazio em caso de formato inesperado mas sem erro HTTP
                 return [];
                 // Ou lança erro: throw new EvolutionApiError("Formato de resposta do histórico inesperado.");
            }

            // Ordena localmente por timestamp (ascendente - mais antigo primeiro) para exibição
            messagesArray.sort((a, b) => (a.messageTimestamp || 0) - (b.messageTimestamp || 0));

            return messagesArray;

        } catch (error: any) {
            console.error(`[EvolutionAPI - ${context}] Error:`, error);
            if (error instanceof EvolutionApiError) throw error;
            throw new EvolutionApiError(error.message || "Erro desconhecido ao buscar histórico.", undefined, error);
        }
    };
