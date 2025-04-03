import { ApiConfig } from "@/contexts/ApiConfigContext";

        // --- Helper to format URL ---
        const getFormattedApiUrl = (url: string | undefined): string | null => {
            if (!url) return null;
            let formattedUrl = url;
            if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
                formattedUrl = `https://${formattedUrl}`;
            }
            return formattedUrl.replace(/\/$/, ""); // Remove trailing slash
        };

        // --- Types for API Responses (can be expanded) ---
        interface InstanceStateResponse {
            instance: {
                instanceName: string;
                state: "open" | "close" | "connecting" | "connected" | string; // Allow other potential states
                status: string;
                // ... other fields if needed
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
            base64?: string; // Sometimes QR is directly here
            // ... other fields
        }

        interface MessageSendResponse {
            key: {
                remoteJid: string;
                fromMe: boolean;
                id: string;
            };
            message: any; // Define more specifically if needed
            messageTimestamp: number;
            status: string;
            // ... other fields
        }

        // Type for the structure containing the messages array
        interface ChatHistoryPayload {
            messages: {
                total: number;
                pages: number;
                currentPage: number;
                records: WhatsappMessage[]; // The actual messages are here
            }
        }

        // Define WhatsappMessage if not imported from elsewhere
        interface WhatsappMessage {
            id?: string; // Added ID based on the new response structure
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
            // Add other fields from the new response if needed
            pushName?: string;
            messageType?: string;
            instanceId?: string;
            source?: string;
            contextInfo?: any;
            MessageUpdate?: any[]; // Array of status updates
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

        // --- Helper to handle fetch responses ---
        const handleApiResponse = async (response: Response) => {
            const responseText = await response.text();
            let responseData: any;
            try {
                responseData = JSON.parse(responseText);
            } catch (jsonError) {
                // If parsing fails but status is OK, maybe it's just a success message
                if (response.ok) return { success: true, message: responseText || response.statusText };
                // If parsing fails and status is not OK, throw error with text
                console.error(`[EvolutionAPI] Failed to parse response as JSON (Status ${response.status}):`, responseText);
                throw new EvolutionApiError(`Falha ao processar resposta da API (Status ${response.status})`, response.status, responseText);
            }

            if (!response.ok) {
                const errorDetail = responseData?.message || responseData?.error?.message || responseData?.error || JSON.stringify(responseData) || `Erro ${response.status}`;
                console.error(`[EvolutionAPI] API Error (Status ${response.status}):`, errorDetail, responseData);
                throw new EvolutionApiError(errorDetail, response.status, responseData);
            }

            return responseData;
        };


        // --- API Service Functions ---

        /**
         * Checks the connection state of a specific instance.
         */
        export const checkInstanceStatus = async (apiConfig: ApiConfig): Promise<InstanceStateResponse> => {
            const apiUrl = getFormattedApiUrl(apiConfig.apiUrl);
            if (!apiUrl || !apiConfig.apiKey || !apiConfig.apiInstance) {
                throw new EvolutionApiError("Configuração da API inválida (URL, Chave ou Instância ausente).");
            }

            const url = `${apiUrl}/instance/connectionState/${apiConfig.apiInstance}`;
            console.log(`[EvolutionAPI] Checking status: GET ${url}`);

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'apikey': apiConfig.apiKey }
                });
                return await handleApiResponse(response) as InstanceStateResponse;
            } catch (error: any) {
                console.error("[EvolutionAPI] Error in checkInstanceStatus:", error);
                if (error instanceof EvolutionApiError) throw error;
                throw new EvolutionApiError(error.message || "Erro desconhecido ao verificar status.");
            }
        };

        /**
         * Initiates connection or fetches QR code for an instance.
         */
        export const connectInstance = async (apiConfig: ApiConfig): Promise<ConnectResponse> => {
            const apiUrl = getFormattedApiUrl(apiConfig.apiUrl);
            if (!apiUrl || !apiConfig.apiKey || !apiConfig.apiInstance) {
                throw new EvolutionApiError("Configuração da API inválida (URL, Chave ou Instância ausente).");
            }

            const url = `${apiUrl}/instance/connect/${apiConfig.apiInstance}`;
            console.log(`[EvolutionAPI] Connecting/Fetching QR: GET ${url}`);

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'apikey': apiConfig.apiKey }
                });
                return await handleApiResponse(response) as ConnectResponse;
            } catch (error: any) {
                console.error("[EvolutionAPI] Error in connectInstance:", error);
                if (error instanceof EvolutionApiError) throw error;
                throw new EvolutionApiError(error.message || "Erro desconhecido ao conectar/buscar QR.");
            }
        };

        /**
         * Disconnects (logs out) an instance.
         */
        export const disconnectInstance = async (apiConfig: ApiConfig): Promise<{ success: boolean; message: string }> => {
            const apiUrl = getFormattedApiUrl(apiConfig.apiUrl);
            if (!apiUrl || !apiConfig.apiKey || !apiConfig.apiInstance) {
                throw new EvolutionApiError("Configuração da API inválida (URL, Chave ou Instância ausente).");
            }

            const url = `${apiUrl}/instance/logout/${apiConfig.apiInstance}`;
            console.log(`[EvolutionAPI] Disconnecting: DELETE ${url}`);

            try {
                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: { 'apikey': apiConfig.apiKey }
                });
                // Logout might return 200 OK with simple message or 404 if already disconnected
                if (response.status === 404) {
                     console.log("[EvolutionAPI] Instance already disconnected or not found during logout.");
                     return { success: true, message: "Instância já desconectada ou não encontrada." };
                }
                return await handleApiResponse(response); // Will throw EvolutionApiError if response.ok is false (and not 404)
            } catch (error: any) {
                console.error("[EvolutionAPI] Error in disconnectInstance:", error);
                 // Handle specific case where API might throw 404 error object for already disconnected
                 if (error instanceof EvolutionApiError && error.status === 404) {
                     console.log("[EvolutionAPI] Instance already disconnected or not found (caught as error).");
                     return { success: true, message: "Instância já desconectada ou não encontrada." };
                 }
                if (error instanceof EvolutionApiError) throw error;
                throw new EvolutionApiError(error.message || "Erro desconhecido ao desconectar.");
            }
        };

        /**
         * Sends a text message.
         * Updated payload structure based on v2 documentation example.
         */
        export const sendMessage = async (apiConfig: ApiConfig, jid: string, text: string): Promise<MessageSendResponse> => {
            const apiUrl = getFormattedApiUrl(apiConfig.apiUrl);
            if (!apiUrl || !apiConfig.apiKey || !apiConfig.apiInstance) {
                throw new EvolutionApiError("Configuração da API inválida (URL, Chave ou Instância ausente).");
            }
            if (!jid || !text) {
                throw new EvolutionApiError("Número (JID) e texto da mensagem são obrigatórios.");
            }

            const url = `${apiUrl}/message/sendText/${apiConfig.apiInstance}`;
            // Updated Payload for v2
            const payload = {
                number: jid.split('@')[0], // API v2 might expect just the number part for sendText
                text: text
                // Removed options and textMessage wrapper based on the working example
            };
            console.log(`[EvolutionAPI] Sending Text (v2): POST ${url}`);
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
                return await handleApiResponse(response) as MessageSendResponse;
            } catch (error: any) {
                console.error("[EvolutionAPI] Error in sendMessage (v2):", error);
                if (error instanceof EvolutionApiError) throw error;
                throw new EvolutionApiError(error.message || "Erro desconhecido ao enviar mensagem.");
            }
        };

        /**
         * Sends a media file (image, video, audio).
         */
        export const sendMedia = async (apiConfig: ApiConfig, jid: string, file: File, caption?: string): Promise<MessageSendResponse> => {
            const apiUrl = getFormattedApiUrl(apiConfig.apiUrl);
            if (!apiUrl || !apiConfig.apiKey || !apiConfig.apiInstance) {
                throw new EvolutionApiError("Configuração da API inválida (URL, Chave ou Instância ausente).");
            }
            if (!jid || !file) {
                throw new EvolutionApiError("Número (JID) e arquivo são obrigatórios para enviar mídia.");
            }

            const url = `${apiUrl}/message/sendMedia/${apiConfig.apiInstance}`;
            const formData = new FormData();
            formData.append('number', jid.split('@')[0]); // Send only number part? Check API docs
            formData.append('media', file, file.name); // API expects 'media' field
            if (caption) {
                // Check Evolution API docs for how to send caption with media
                // Option 1: Simple caption field
                // formData.append('caption', caption);
                // Option 2: Options object (more likely)
                 formData.append('options', JSON.stringify({ caption: caption }));
            }

            console.log(`[EvolutionAPI] Sending Media: POST ${url}`);
            console.log(`  -> JID: ${jid}, File: ${file.name}, Caption: ${caption}`);

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'apikey': apiConfig.apiKey }, // Content-Type set by browser for FormData
                    body: formData
                });
                return await handleApiResponse(response) as MessageSendResponse;
            } catch (error: any) {
                console.error("[EvolutionAPI] Error in sendMedia:", error);
                if (error instanceof EvolutionApiError) throw error;
                throw new EvolutionApiError(error.message || "Erro desconhecido ao enviar mídia.");
            }
        };

         /**
          * Sends a document file.
          */
         export const sendDocument = async (apiConfig: ApiConfig, jid: string, file: File, fileName?: string): Promise<MessageSendResponse> => {
             const apiUrl = getFormattedApiUrl(apiConfig.apiUrl);
             if (!apiUrl || !apiConfig.apiKey || !apiConfig.apiInstance) {
                 throw new EvolutionApiError("Configuração da API inválida (URL, Chave ou Instância ausente).");
             }
             if (!jid || !file) {
                 throw new EvolutionApiError("Número (JID) e arquivo são obrigatórios para enviar documento.");
             }

             // Evolution API v2 uses sendFile for documents
             const url = `${apiUrl}/message/sendFile/${apiConfig.apiInstance}`;
             const formData = new FormData();
             formData.append('number', jid.split('@')[0]); // Send only number part? Check API docs
             formData.append('file', file, fileName || file.name); // API expects 'file' field
             // Add options if needed (e.g., filename in options)
             // formData.append('options', JSON.stringify({ filename: fileName || file.name }));

             console.log(`[EvolutionAPI] Sending Document: POST ${url}`);
             console.log(`  -> JID: ${jid}, File: ${fileName || file.name}`);

             try {
                 const response = await fetch(url, {
                     method: 'POST',
                     headers: { 'apikey': apiConfig.apiKey },
                     body: formData
                 });
                 return await handleApiResponse(response) as MessageSendResponse;
             } catch (error: any) {
                 console.error("[EvolutionAPI] Error in sendDocument:", error);
                 if (error instanceof EvolutionApiError) throw error;
                 throw new EvolutionApiError(error.message || "Erro desconhecido ao enviar documento.");
             }
         };


        /**
         * Fetches chat history for a specific JID.
         * Updated response parsing based on v2 documentation example.
         * The JID passed here should already be formatted (e.g., without the 9th digit if needed).
         */
        export const fetchChatHistory = async (apiConfig: ApiConfig, formattedJid: string, limit: number = 50): Promise<WhatsappMessage[]> => {
            const apiUrl = getFormattedApiUrl(apiConfig.apiUrl);
            if (!apiUrl || !apiConfig.apiKey || !apiConfig.apiInstance) {
                throw new EvolutionApiError("Configuração da API inválida (URL, Chave ou Instância ausente).");
            }
            if (!formattedJid) {
                throw new EvolutionApiError("Número (JID formatado) é obrigatório para buscar histórico.");
            }

            const url = `${apiUrl}/chat/findMessages/${apiConfig.apiInstance}`;
            // Payload structure based on v2 example
            const payload = {
                where: { key: { remoteJid: formattedJid } },
                // Optional: Add sorting and limit if API supports it in the body
                // orderBy: { messageTimestamp: 'desc' }, // Fetch newest first?
                // limit: limit // API v2 seems to use pagination in response, maybe limit in body is ignored or works differently
            };

            console.log(`[EvolutionAPI] Fetching History (v2): POST ${url}`);
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

                const responseData = await handleApiResponse(response) as ChatHistoryPayload; // Use the new type

                // Adapt based on actual API response structure (messages.records)
                const messagesArray = responseData?.messages?.records;

                if (!Array.isArray(messagesArray)) {
                     console.error("[EvolutionAPI] Unexpected history response format (expected messages.records array):", responseData);
                     throw new EvolutionApiError("Formato de resposta do histórico inesperado.");
                }

                // Sort locally by timestamp (ascending - oldest first)
                messagesArray.sort((a, b) => (a.messageTimestamp || 0) - (b.messageTimestamp || 0));

                return messagesArray; // Already typed as WhatsappMessage[]

            } catch (error: any) {
                console.error("[EvolutionAPI] Error in fetchChatHistory (v2):", error);
                if (error instanceof EvolutionApiError) throw error;
                throw new EvolutionApiError(error.message || "Erro desconhecido ao buscar histórico.");
            }
        };
