import React, { useState, useEffect, useRef, useCallback } from "react";
    import { format, isValid, parseISO } from "date-fns";
    import { ptBR } from "date-fns/locale/pt-BR";
    import { Button } from "@/components/ui/button";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Badge } from "@/components/ui/badge";
    import { ScrollArea } from "@/components/ui/scroll-area";
    import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
    import { useToast } from "@/hooks/use-toast";
    import { cn } from "@/lib/utils";
    import { ApiConfig, useApiConfig } from "@/contexts/ApiConfigContext";
    import { PacienteData } from "@/components/pacientes/paciente-card"; // Assuming PacienteData is here
    import {
      Check,
      Paperclip,
      Mic,
      SendHorizonal,
      Image as ImageIcon,
      Video,
      File as FileIcon,
      Loader2,
      Headset,
      StopCircle,
      RefreshCw,
      XCircle,
      AlertTriangle,
      CheckCircle,
      PowerOff
    } from "lucide-react";

    // --- Helper function to safely format dates ---
    const safeFormatDate = (dateInput: Date | string | number | null | undefined, formatString: string): string => {
      if (!dateInput) return "";
      try {
        // Handle Unix timestamps (assuming seconds)
        const date = typeof dateInput === 'number'
          ? new Date(dateInput * 1000)
          : typeof dateInput === 'string'
          ? parseISO(dateInput) // Attempt to parse ISO string
          : dateInput; // Assume it's already a Date object

        // Check if the resulting date is valid
        if (date instanceof Date && !isNaN(date.getTime())) {
          return format(date, formatString, { locale: ptBR });
        }
      } catch (error) {
        console.error("Error formatting date:", dateInput, error);
      }
      // Return empty string or a placeholder if formatting fails
      return "Data inválida";
    };
    // --- End Helper ---

    // --- Interface for WhatsApp Message ---
    interface WhatsappMessage {
        key: {
            remoteJid: string;
            fromMe: boolean;
            id: string;
            participant?: string; // For group messages
        };
        messageTimestamp: number; // Unix timestamp (seconds)
        message?: {
            conversation?: string;
            extendedTextMessage?: { text: string };
            imageMessage?: { caption?: string; mimetype?: string; /* Add other fields if needed */ };
            videoMessage?: { caption?: string; mimetype?: string; /* Add other fields if needed */ };
            audioMessage?: { mimetype?: string; /* Add other fields if needed */ };
            documentMessage?: { title?: string; mimetype?: string; /* Add other fields if needed */ };
            // Add other message types as needed (location, contact, etc.)
        };
        ack?: number; // 0: pending, 1: sent (server ack), 2: delivered (device ack), 3: read (read ack)
        // Add other potential fields like pushName, broadcast, etc. if relevant
    }
    // --- End Interface ---

    type ApiStatus = "disconnected" | "connected" | "connecting" | "error" | "needs_qr";

    interface WhatsappChatProps {
      paciente: PacienteData | null;
      isActiveTab: boolean; // To trigger fetch only when tab is active
    }

    export const WhatsappChat: React.FC<WhatsappChatProps> = ({ paciente, isActiveTab }) => {
      const [message, setMessage] = useState("");
      const [isSending, setIsSending] = useState(false);
      const [isSendingMedia, setIsSendingMedia] = useState(false);
      const [isRecording, setIsRecording] = useState(false);
      const [chatMessages, setChatMessages] = useState<WhatsappMessage[]>([]);
      const [isLoadingHistory, setIsLoadingHistory] = useState(false);
      const [historyError, setHistoryError] = useState<string | null>(null);
      const { toast } = useToast();
      const { apiConfig } = useApiConfig(); // Get config from context

      const chatAreaRef = useRef<HTMLDivElement>(null);
      const imageInputRef = useRef<HTMLInputElement>(null);
      const videoInputRef = useRef<HTMLInputElement>(null);
      const audioInputRef = useRef<HTMLInputElement>(null);
      const documentInputRef = useRef<HTMLInputElement>(null);
      const mediaRecorderRef = useRef<MediaRecorder | null>(null);
      const audioChunksRef = useRef<Blob[]>([]);

      // --- Format Phone Number to JID ---
      const formatPhoneNumberToJid = (phone: string | undefined): string | null => {
          if (!phone) return null;
          let cleaned = phone.replace(/\D/g, '');
          // Basic validation for Brazilian numbers (adjust if needed)
          if (cleaned.length < 10 || cleaned.length > 13) return null;
          // Add 55 if missing (common case for 10 or 11 digits)
          if (cleaned.length === 10 || cleaned.length === 11) {
              cleaned = '55' + cleaned;
          }
          // Ensure it starts with 55
          if (!cleaned.startsWith('55')) {
             // Allow numbers that already have a country code (12 or 13 digits)
             if (cleaned.length === 12 || cleaned.length === 13) {
                // Assume country code is present
             } else {
                 return null; // Invalid format if not starting with 55 and not 12/13 digits
             }
          }
          return `${cleaned}@s.whatsapp.net`;
      };
      // --- End Format Phone Number ---

      const patientJid = paciente ? formatPhoneNumberToJid(paciente.telefone) : null;

      // --- Ensure API URL has protocol and no trailing slash ---
      const getFormattedApiUrl = useCallback((url: string | undefined): string | null => {
          if (!url) return null;
          let formattedUrl = url;
          if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
              console.warn(`[WhatsappChat] API URL ("${formattedUrl}") missing protocol. Prepending https://`);
              formattedUrl = `https://${formattedUrl}`;
          }
          return formattedUrl.replace(/\/$/, ""); // Remove trailing slash
      }, []);

      const formattedApiUrl = getFormattedApiUrl(apiConfig?.apiUrl);

      // --- Fetch Chat History ---
      const fetchChatHistory = useCallback(async (showLoadingToast = false) => {
          if (!patientJid) {
              setHistoryError("Número de telefone do paciente inválido ou não formatado corretamente para JID.");
              console.error("Fetch History Aborted: Invalid JID", paciente?.telefone);
              setChatMessages([]); // Clear messages if JID is invalid
              setIsLoadingHistory(false);
              return;
          }
          if (!formattedApiUrl || !apiConfig?.apiKey || !apiConfig?.apiInstance) {
              setHistoryError("Configuração da API (URL, Chave, Instância) não encontrada ou inválida.");
              console.error("Fetch History Aborted: Incomplete API Config", { formattedApiUrl, apiKey: apiConfig?.apiKey, apiInstance: apiConfig?.apiInstance });
              setChatMessages([]); // Clear messages if config is invalid
              setIsLoadingHistory(false);
              return;
          }

          setIsLoadingHistory(true);
          setHistoryError(null);
          if (showLoadingToast) {
              toast({ title: "Buscando histórico..." });
          }

          const endpointPath = "/chat/findMessages";
          const historyUrl = `${formattedApiUrl}${endpointPath}/${apiConfig.apiInstance}`;

          const requestBody = {
              where: { key: { remoteJid: patientJid } },
              // Optional: Add sorting and limit if API supports it
              // orderBy: { messageTimestamp: 'asc' },
              // limit: 100
          };

          console.log(`[WhatsappChat] Fetching history (POST)...`);
          console.log(`  -> Request URL: ${historyUrl}`);
          console.log(`  -> Request Body:`, JSON.stringify(requestBody));

          try {
              const response = await fetch(historyUrl, {
                  method: 'POST',
                  headers: {
                      'apikey': apiConfig.apiKey,
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(requestBody)
              });

              const rawResponseText = await response.text();
              console.log("[WhatsappChat] History Raw Response Text:", rawResponseText);

              let responseData: any;
              try {
                  responseData = JSON.parse(rawResponseText);
              } catch (jsonError) {
                  console.error("[WhatsappChat] Failed to parse history response as JSON:", jsonError);
                  throw new Error(`Falha ao processar resposta da API (Status ${response.status}): ${rawResponseText}`);
              }

              console.log("[WhatsappChat] History Parsed Response Data:", responseData);

              if (!response.ok) {
                  let errorDetail = `Erro ${response.status}`;
                  try {
                      errorDetail = responseData?.message || responseData?.error?.message || JSON.stringify(responseData) || errorDetail;
                  } catch (e) { /* ignore error */ }

                  if (response.status === 404) {
                      throw new Error(`Erro 404: Endpoint não encontrado (${endpointPath}/${apiConfig.apiInstance}). Verifique a URL base ('${formattedApiUrl}'), o caminho ('${endpointPath}'), e o nome da instância ('${apiConfig.apiInstance}') nas configurações.`);
                  }
                  throw new Error(errorDetail);
              }

              // Expecting the API to return an array of messages directly or within a property
              const messagesArray = Array.isArray(responseData)
                  ? responseData
                  : Array.isArray(responseData?.messages) // Check common property names
                  ? responseData.messages
                  : Array.isArray(responseData?.data)
                  ? responseData.data
                  : [];

              if (!Array.isArray(messagesArray)) {
                  console.error("[WhatsappChat] Unexpected history response format (expected array):", responseData);
                  throw new Error("Formato de resposta do histórico inesperado (esperava um array).");
              }

              // Sort messages by timestamp (assuming it's a number)
              messagesArray.sort((a, b) => (a.messageTimestamp || 0) - (b.messageTimestamp || 0));

              setChatMessages(messagesArray as WhatsappMessage[]);

              if (messagesArray.length === 0) {
                  console.log("[WhatsappChat] API returned success, but the processed messages array is empty.");
                  toast({ title: "Histórico Vazio", description: "Nenhuma mensagem encontrada para este contato." });
              } else {
                  toast({ title: "Histórico carregado." });
              }

          } catch (error: any) {
              console.error("[WhatsappChat] Error fetching chat history:", error);
              const errorMessage = error.message || "Não foi possível buscar o histórico.";
              setHistoryError(errorMessage);
              toast({ variant: "destructive", title: "Erro ao Buscar Histórico", description: errorMessage });
          } finally {
              setIsLoadingHistory(false);
          }
      }, [patientJid, formattedApiUrl, apiConfig, toast]);
      // --- End Fetch Chat History ---

      // --- Scroll to Bottom ---
      useEffect(() => {
          if (chatAreaRef.current) {
              // Use setTimeout to ensure scroll happens after render
              setTimeout(() => {
                  if (chatAreaRef.current) {
                     chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
                  }
              }, 0);
          }
      }, [chatMessages]); // Dependency on chatMessages ensures scroll on new messages
      // --- End Scroll to Bottom ---

      // --- Fetch history when tab becomes active or patient/config changes ---
      useEffect(() => {
          if (isActiveTab && paciente?.id && apiConfig?.apiInstance && patientJid) {
              console.log(`[WhatsappChat] Tab active for ${paciente.id}. Fetching history with config:`, apiConfig);
              fetchChatHistory(true); // Fetch with loading toast when tab becomes active
          } else {
              // Clear state if tab is not active or prerequisites are missing
              setChatMessages([]);
              setHistoryError(null);
              setIsLoadingHistory(false);
          }
          // Dependencies: only re-run if these specific values change
      }, [isActiveTab, paciente?.id, apiConfig?.apiInstance, patientJid, fetchChatHistory]);


      // --- Send Message Logic ---
      const handleSendMessage = async () => {
        if (!message.trim() || isSending || !patientJid || isRecording) {
            console.warn("[WhatsappChat] Send message aborted. Conditions not met:", { message: message.trim(), isSending, patientJid, isRecording });
            return;
        }
        if (!formattedApiUrl || !apiConfig?.apiKey || !apiConfig?.apiInstance) {
            toast({ variant: "destructive", title: "Erro de Configuração", description: "Configuração da API (URL, Chave, Instância) inválida." });
            console.error("[WhatsappChat] Send message aborted: Incomplete API Config", { formattedApiUrl, apiKey: apiConfig?.apiKey, apiInstance: apiConfig?.apiInstance });
            return;
        }

        setIsSending(true);
        toast({ title: "Enviando Mensagem..." });

        const sendUrl = `${formattedApiUrl}/message/sendText/${apiConfig.apiInstance}`;
        const payload = {
            number: patientJid, // Using the JID format
            options: { delay: 1200, presence: "composing" },
            textMessage: { text: message }
        };

        console.log(`[WhatsappChat] Sending message (POST)...`);
        console.log(`  -> Target JID: ${patientJid}`);
        console.log(`  -> API Config Used:`, { apiUrl: formattedApiUrl, apiKey: apiConfig.apiKey, apiInstance: apiConfig.apiInstance });
        console.log(`  -> Request URL: ${sendUrl}`);
        console.log(`  -> Request Body:`, JSON.stringify(payload));

        try {
            const response = await fetch(sendUrl, {
                method: 'POST',
                headers: {
                    'apikey': apiConfig.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            console.log("[WhatsappChat] Send Response Status:", response.status);
            let responseData: any;
            let errorDetail = `Erro ${response.status}`;
            try {
                responseData = await response.json();
                console.log("[WhatsappChat] Send Response Data:", responseData);
                errorDetail = responseData?.message || responseData?.error?.message || responseData?.error || JSON.stringify(responseData) || errorDetail;
            } catch (e) {
                console.error("[WhatsappChat] Failed to parse send response as JSON:", e);
                try {
                    const textResponse = await response.text();
                    console.error("[WhatsappChat] Send Raw Text Response:", textResponse);
                    errorDetail = textResponse || errorDetail;
                } catch (textErr) { console.error("[WhatsappChat] Failed to get text response either."); }
            }

            if (!response.ok) {
                throw new Error(errorDetail);
            }

            toast({ title: "Mensagem Enviada!", description: `Para: ${paciente?.telefone}` });
            setMessage(""); // Clear input field
            // Add the sent message optimistically (optional, but improves UX)
            // const optimisticMessage: WhatsappMessage = { ... };
            // setChatMessages(prev => [...prev, optimisticMessage]);
            setTimeout(() => fetchChatHistory(), 1500); // Re-fetch history after a delay
        } catch (error: any) {
            console.error("[WhatsappChat] Error sending message:", error);
            const errorMessage = error instanceof Error ? error.message : "Não foi possível enviar a mensagem.";
            toast({ variant: "destructive", title: "Erro ao Enviar", description: errorMessage });
        } finally {
            setIsSending(false);
        }
      };
      // --- End Send Message Logic ---

      // --- Send File Logic ---
      const sendFile = async (file: File, type: 'image' | 'video' | 'audio' | 'document') => {
          if (!patientJid || isSendingMedia || isRecording || !formattedApiUrl || !apiConfig?.apiKey || !apiConfig?.apiInstance) {
              console.warn("[WhatsappChat] Send file aborted. Conditions not met:", { patientJid, isSendingMedia, isRecording, formattedApiUrl, apiKey: apiConfig?.apiKey, apiInstance: apiConfig?.apiInstance });
              return;
          }
          setIsSendingMedia(true);
          toast({ title: `Enviando ${type}...` });

          const isMedia = type === 'image' || type === 'video' || type === 'audio';
          const endpointPath = isMedia ? '/message/sendMedia' : '/message/sendFile';
          const sendUrl = `${formattedApiUrl}${endpointPath}/${apiConfig.apiInstance}`;

          const formData = new FormData();
          formData.append('number', patientJid); // Send to the patient's JID
          formData.append(isMedia ? 'media' : 'file', file, file.name); // Use correct field name based on API docs
          // Add caption if needed (check API docs for field name, e.g., 'caption' or within an 'options' object)
          // if (type === 'image' || type === 'video') {
          //   formData.append('options', JSON.stringify({ caption: `Arquivo ${type}` }));
          // }

          console.log(`[WhatsappChat] Sending ${type} (${file.name}) to ${sendUrl} for JID ${patientJid}`);
          console.log(`  -> FormData contains 'number':`, formData.has('number'));
          console.log(`  -> FormData contains '${isMedia ? 'media' : 'file'}':`, formData.has(isMedia ? 'media' : 'file'));

          try {
              const response = await fetch(sendUrl, {
                  method: 'POST',
                  headers: { 'apikey': apiConfig.apiKey }, // Content-Type is set automatically for FormData
                  body: formData
              });

              console.log(`[WhatsappChat] Send ${type} Response Status:`, response.status);
              let responseData: any;
              let errorDetail = `Erro ${response.status}`;
              try {
                  responseData = await response.json();
                  console.log(`[WhatsappChat] Send ${type} Response Data:`, responseData);
                  errorDetail = responseData?.message || responseData?.error?.message || responseData?.error || JSON.stringify(responseData) || errorDetail;
              } catch (e) {
                  console.error(`[WhatsappChat] Failed to parse send ${type} response as JSON:`, e);
                  try {
                      const textResponse = await response.text();
                      console.error(`[WhatsappChat] Send ${type} Raw Text Response:`, textResponse);
                      errorDetail = textResponse || errorDetail;
                  } catch (textErr) { console.error(`[WhatsappChat] Failed to get text response either.`); }
              }

              if (!response.ok) {
                  throw new Error(errorDetail);
              }

              toast({ title: `${capitalize(type)} Enviado!`, description: `Para: ${paciente?.telefone}` });
              setTimeout(() => fetchChatHistory(), 1500); // Re-fetch after sending
          } catch (error: any) {
              console.error(`[WhatsappChat] Error sending ${type}:`, error);
              toast({ variant: "destructive", title: `Erro ao Enviar ${capitalize(type)}`, description: error.message || `Não foi possível enviar o ${type}.` });
          } finally {
              setIsSendingMedia(false);
              // Reset file inputs
              if (imageInputRef.current) imageInputRef.current.value = "";
              if (videoInputRef.current) videoInputRef.current.value = "";
              if (audioInputRef.current) audioInputRef.current.value = "";
              if (documentInputRef.current) documentInputRef.current.value = "";
          }
      };
      // --- End Send File Logic ---

      // --- Recording Logic ---
      const handleStartRecording = async () => {
          if (isRecording || !patientJid) return;

          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
              toast({ variant: "destructive", title: "Erro", description: "Gravação de áudio não suportada neste navegador." });
              return;
          }

          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              // Try common mime types, opus is generally preferred
              const mimeType = MediaRecorder.isTypeSupported('audio/ogg; codecs=opus')
                  ? 'audio/ogg; codecs=opus'
                  : MediaRecorder.isTypeSupported('audio/webm; codecs=opus')
                  ? 'audio/webm; codecs=opus'
                  : 'audio/webm'; // Fallback

              mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
              audioChunksRef.current = [];

              mediaRecorderRef.current.ondataavailable = (event) => {
                  if (event.data.size > 0) audioChunksRef.current.push(event.data);
              };

              mediaRecorderRef.current.onstop = () => {
                  const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                  const fileExtension = mimeType.includes('ogg') ? 'ogg' : 'webm';
                  const audioFile = new File([audioBlob], `audio_gravado_${Date.now()}.${fileExtension}`, { type: mimeType });
                  console.log("[WhatsappChat] Audio recording stopped. Blob size:", audioBlob.size, "File:", audioFile.name, "Type:", mimeType);
                  sendFile(audioFile, 'audio');
                  stream.getTracks().forEach(track => track.stop()); // Stop microphone access
                  setIsRecording(false);
              };

              mediaRecorderRef.current.onerror = (event) => {
                  console.error("[WhatsappChat] MediaRecorder error:", event);
                  toast({ variant: "destructive", title: "Erro na Gravação", description: "Ocorreu um erro durante a gravação." });
                  setIsRecording(false);
                  stream.getTracks().forEach(track => track.stop()); // Ensure stream is stopped on error
              };

              mediaRecorderRef.current.start();
              setIsRecording(true);
              toast({ title: "Gravando áudio...", description: "Clique no botão vermelho para parar." });

          } catch (err) {
              console.error("[WhatsappChat] Error accessing microphone:", err);
              let description = "Não foi possível acessar o microfone.";
              if (err instanceof Error && err.name === 'NotAllowedError') {
                  description = "Permissão para usar o microfone negada.";
              } else if (err instanceof Error && err.name === 'NotFoundError') {
                  description = "Nenhum microfone encontrado.";
              }
              toast({ variant: "destructive", title: "Erro de Microfone", description });
          }
      };

      const handleStopRecording = () => {
          if (mediaRecorderRef.current && isRecording) {
              mediaRecorderRef.current.stop();
              // State is set to false in the onstop handler
          }
      };
      // --- End Recording Logic ---

      const handleAttachmentClick = (type: 'image' | 'video' | 'audio' | 'document') => {
          if (isRecording || isSendingMedia) return; // Prevent opening file dialog while recording/sending
          switch (type) {
              case 'image': imageInputRef.current?.click(); break;
              case 'video': videoInputRef.current?.click(); break;
              case 'audio': audioInputRef.current?.click(); break;
              case 'document': documentInputRef.current?.click(); break;
          }
      };

      const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio' | 'document') => {
          const file = event.target.files?.[0];
          if (file) {
              sendFile(file, type);
          }
      };

      const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

      // --- Render Message Content ---
      const renderMessageContent = (msg: WhatsappMessage) => {
          const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
          if (text) {
              // Basic link detection (can be improved with regex)
              const parts = text.split(/(\s+)/); // Split by whitespace, keeping spaces
              return (
                  <p className="text-sm whitespace-pre-wrap break-words">
                      {parts.map((part, index) => {
                          if (part.startsWith('http://') || part.startsWith('https://')) {
                              return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{part}</a>;
                          }
                          return part;
                      })}
                  </p>
              );
          }
          if (msg.message?.imageMessage) {
              return <p className="text-sm italic text-gray-400">[Imagem]{msg.message.imageMessage.caption ? `: ${msg.message.imageMessage.caption}` : ''}</p>;
          }
          if (msg.message?.videoMessage) {
              return <p className="text-sm italic text-gray-400">[Vídeo]{msg.message.videoMessage.caption ? `: ${msg.message.videoMessage.caption}` : ''}</p>;
          }
          if (msg.message?.audioMessage) {
              return <p className="text-sm italic text-gray-400">[Áudio]</p>;
          }
          if (msg.message?.documentMessage) {
              return <p className="text-sm italic text-gray-400">[Documento: {msg.message.documentMessage.title || 'arquivo'}]</p>;
          }
          // Add placeholders for other types if needed
          // if (msg.message?.locationMessage) { return <p className="text-sm italic text-gray-400">[Localização]</p>; }
          // if (msg.message?.contactMessage) { return <p className="text-sm italic text-gray-400">[Contato]</p>; }

          console.log("[WhatsappChat] Unsupported message type:", msg.message ? Object.keys(msg.message) : 'No message content');
          return <p className="text-sm italic text-gray-500">[Tipo de mensagem não suportado]</p>;
      };
      // --- End Render Message Content ---

      // --- Render Message Status Ticks ---
      const renderMessageTicks = (msg: WhatsappMessage) => {
          if (!msg.key.fromMe || msg.ack === undefined || msg.ack < 1) {
              return null; // Don't show ticks for incoming or pending messages
          }
          const tickColor = msg.ack === 3 ? "text-blue-400" : "text-primary-foreground/80";
          return (
              <>
                  <Check className={cn("h-3.5 w-3.5", tickColor, msg.ack < 2 ? "opacity-60" : "")} />
                  {msg.ack >= 2 && ( // Show second tick for delivered or read
                      <Check className={cn("h-3.5 w-3.5 -ml-2.5", tickColor)} />
                  )}
              </>
          );
      };
      // --- End Render Message Status Ticks ---

      return (
        <div className="flex flex-col h-full"> {/* Use h-full for flex container */}
          {/* Hidden File Inputs */}
          <input type="file" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} accept="image/*" style={{ display: 'none' }} />
          <input type="file" ref={videoInputRef} onChange={(e) => handleFileChange(e, 'video')} accept="video/*" style={{ display: 'none' }} />
          <input type="file" ref={audioInputRef} onChange={(e) => handleFileChange(e, 'audio')} accept="audio/*" style={{ display: 'none' }} />
          <input type="file" ref={documentInputRef} onChange={(e) => handleFileChange(e, 'document')} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain" style={{ display: 'none' }} />

          {/* Chat Header */}
          <div className="px-1 pb-2 border-b mb-3 flex justify-between items-center shrink-0">
              <div>
                  <h3 className="text-lg font-medium">Chat WhatsApp</h3>
                  <p className="text-sm text-muted-foreground">{paciente?.nome || "Nenhum paciente selecionado"}</p>
                  <p className="text-xs text-muted-foreground">
                      Número: {paciente?.telefone || "Não informado"} {patientJid ? `(${patientJid.split('@')[0]})` : '(Inválido)'}
                  </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => fetchChatHistory(true)} disabled={isLoadingHistory || !patientJid} title="Atualizar Histórico">
                  <RefreshCw className={cn("h-4 w-4", isLoadingHistory && "animate-spin")} />
              </Button>
          </div>

          {/* Message Area */}
          {/* Make ScrollArea flexible and take remaining space */}
          <ScrollArea className="flex-1 mb-4 px-4 py-2 bg-muted/20 rounded-md min-h-0" ref={chatAreaRef}>
            <div className="space-y-4">
              {isLoadingHistory && (
                  <div className="text-center text-muted-foreground py-10">
                      <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Carregando histórico...
                  </div>
              )}
              {historyError && !isLoadingHistory && (
                  <div className="text-center text-destructive py-10 px-2 break-words">
                      Erro ao carregar histórico: {historyError}
                  </div>
              )}
              {!isLoadingHistory && !historyError && chatMessages.length === 0 && (
                  <div className="text-center text-muted-foreground py-10">
                      Nenhuma mensagem encontrada para este contato.
                  </div>
              )}
              {!isLoadingHistory && !historyError && chatMessages.map((msg) => (
                <div key={msg.key.id} className={cn("flex", msg.key.fromMe ? "justify-end" : "justify-start")}>
                  <div className={cn(
                      "rounded-lg py-2 px-3 max-w-[75%] shadow-sm text-left",
                      msg.key.fromMe ? "bg-primary/90 text-primary-foreground" : "bg-background border"
                  )}>
                    {renderMessageContent(msg)}
                    <div className={cn("text-xs mt-1 flex items-center gap-1", msg.key.fromMe ? "text-primary-foreground/80 justify-end" : "text-muted-foreground justify-end")}>
                        <span>{safeFormatDate(msg.messageTimestamp, "HH:mm")}</span>
                        {renderMessageTicks(msg)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="flex items-center gap-2 border-t pt-4 px-1 shrink-0">
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" title="Anexar" disabled={isSending || isSendingMedia || isRecording || !patientJid}>
                        <Paperclip className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-1">
                    <div className="grid grid-cols-2 gap-1">
                        <Button variant="ghost" size="sm" className="flex items-center justify-start gap-2" onClick={() => handleAttachmentClick('image')}><ImageIcon className="h-4 w-4 text-blue-500" /> Imagem</Button>
                        <Button variant="ghost" size="sm" className="flex items-center justify-start gap-2" onClick={() => handleAttachmentClick('video')}><Video className="h-4 w-4 text-purple-500" /> Vídeo</Button>
                        <Button variant="ghost" size="sm" className="flex items-center justify-start gap-2" onClick={() => handleAttachmentClick('audio')}><Headset className="h-4 w-4 text-orange-500" /> Áudio</Button>
                        <Button variant="ghost" size="sm" className="flex items-center justify-start gap-2" onClick={() => handleAttachmentClick('document')}><FileIcon className="h-4 w-4 text-gray-500" /> Documento</Button>
                    </div>
                </PopoverContent>
             </Popover>

            <Input
                placeholder={isRecording ? "Gravando áudio..." : "Digite sua mensagem..."}
                className="flex-1"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isSending && !isSendingMedia && !isRecording && handleSendMessage()}
                disabled={isSending || isSendingMedia || isRecording || !patientJid}
            />

            {message.trim() && !isRecording ? (
                <Button onClick={handleSendMessage} disabled={!patientJid || isSending || isSendingMedia} title="Enviar Mensagem">
                    {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
                </Button>
            ) : (
                <Button
                    variant={isRecording ? "destructive" : "ghost"}
                    size="icon"
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={!patientJid || isSending || isSendingMedia}
                    title={isRecording ? "Parar Gravação" : "Gravar Áudio"}
                >
                    {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
            )}
          </div>
        </div>
      );
    };
