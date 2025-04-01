import { useState, useEffect, useRef } from "react";
    import { format, isValid, parseISO } from "date-fns";
    import { ptBR } from "date-fns/locale/pt-BR";
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { Button } from "@/components/ui/button";
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Textarea } from "@/components/ui/textarea";
    import { Separator } from "@/components/ui/separator";
    import {
      PhoneCall, Check, X, Plus, Clock, CalendarClock, FileText, Building, Save, User2, MessageCircle,
      Paperclip, Mic, SendHorizonal, Image as ImageIcon, Video, File as FileIcon, Loader2, Headset, StopCircle, RefreshCw
    } from "lucide-react";
    import { PacienteData } from "@/components/pacientes/paciente-card";
    import {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
    } from "@/components/ui/select";
    import { Badge } from "@/components/ui/badge";
    import { useToast } from "@/hooks/use-toast";
    import { ScrollArea } from "@/components/ui/scroll-area";
    import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
    import { cn } from "@/lib/utils";
    import { ApiConfig, useApiConfig } from "@/contexts/ApiConfigContext"; // Import useApiConfig

    // --- Helper function to safely format dates ---
    const safeFormatDate = (dateInput: Date | string | number | null | undefined, formatString: string): string => {
      if (!dateInput) return "";
      try {
        const date = typeof dateInput === 'number'
          ? new Date(dateInput * 1000) // Assuming Unix timestamp
          : typeof dateInput === 'string'
          ? parseISO(dateInput)
          : dateInput;

        if (date instanceof Date && !isNaN(date.getTime())) {
          return format(date, formatString, { locale: ptBR });
        }
      } catch (error) {
        console.error("Error formatting date:", dateInput, error);
      }
      return "";
    };
    // --- End Helper ---

    // --- Interface for WhatsApp Message ---
    interface WhatsappMessage {
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
            imageMessage?: { caption?: string; mimetype?: string; };
            videoMessage?: { caption?: string; mimetype?: string; };
            audioMessage?: { mimetype?: string; };
            documentMessage?: { title?: string; mimetype?: string; };
        };
        ack?: number;
    }
    // --- End Interface ---


    // --- Refined Whatsapp Chat Component ---
    const WhatsappChat = ({ paciente, isActiveTab }: { paciente: PacienteData | null, isActiveTab: boolean }) => {
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

      const consultantName = "Consultor";

      // --- Format Phone Number to JID ---
      const formatPhoneNumberToJid = (phone: string | undefined): string | null => {
          if (!phone) return null;
          let cleaned = phone.replace(/\D/g, '');
          if (cleaned.length < 10 || cleaned.length > 13) return null;
          if (cleaned.length === 10 || cleaned.length === 11) {
              cleaned = '55' + cleaned;
          }
          if (!cleaned.startsWith('55')) {
             if (cleaned.length === 12 || cleaned.length === 13) {
                // Assume country code is present
             } else {
                 return null;
             }
          }
          return `${cleaned}@s.whatsapp.net`;
      };
      // --- End Format Phone Number ---

      const patientJid = paciente ? formatPhoneNumberToJid(paciente.telefone) : null;

      // --- Fetch Chat History ---
      const fetchChatHistory = async (showLoadingToast = false) => {
          if (!patientJid) {
              setHistoryError("Número de telefone do paciente inválido ou não formatado corretamente para JID.");
              console.error("Fetch History Aborted: Invalid JID", paciente?.telefone);
              return;
          }
          if (!apiConfig || !apiConfig.apiUrl || !apiConfig.apiKey || !apiConfig.apiInstance) {
              setHistoryError("Configuração da API (URL, Chave, Instância) não encontrada no contexto.");
              console.error("Fetch History Aborted: Incomplete API Config from context", apiConfig);
              return;
          }

          setIsLoadingHistory(true);
          setHistoryError(null);
          if (showLoadingToast) {
              toast({ title: "Buscando histórico..." });
          }

          let apiUrlBase = apiConfig.apiUrl;
          if (!apiUrlBase.startsWith('http://') && !apiUrlBase.startsWith('https://')) {
              console.warn(`[WhatsappChat] apiConfig.apiUrl ("${apiUrlBase}") does not start with http:// or https://. Prepending https://`);
              apiUrlBase = `https://${apiUrlBase}`;
          }
          apiUrlBase = apiUrlBase.replace(/\/$/, "");

          const endpointPath = "/chat/findMessages";
          const historyUrl = `${apiUrlBase}${endpointPath}/${apiConfig.apiInstance}`;

          const requestBody = {
              where: {
                  key: {
                      remoteJid: patientJid
                  }
              }
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
                      throw new Error(`Erro 404: Endpoint não encontrado (${endpointPath}/${apiConfig.apiInstance}). Verifique a URL base ('${apiUrlBase}'), o caminho ('${endpointPath}'), e o nome da instância ('${apiConfig.apiInstance}') nas configurações.`);
                  }
                  throw new Error(errorDetail);
              }

              const messagesArray = Array.isArray(responseData) ? responseData : [];

              if (!Array.isArray(messagesArray)) {
                  console.error("[WhatsappChat] Unexpected history response format (expected array):", responseData);
                  throw new Error("Formato de resposta do histórico inesperado (esperava um array).");
              }

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
      };
      // --- End Fetch Chat History ---

      // --- Scroll to Bottom ---
      useEffect(() => {
          if (chatAreaRef.current) {
              setTimeout(() => {
                  if (chatAreaRef.current) {
                     chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
                  }
              }, 0);
          }
      }, [chatMessages]);
      // --- End Scroll to Bottom ---

      // --- Fetch history when tab becomes active or patient/config changes ---
      useEffect(() => {
          if (isActiveTab && paciente?.id && apiConfig?.apiInstance) {
              console.log(`[WhatsappChat] Tab active for ${paciente.id}. Fetching history with config:`, apiConfig);
              fetchChatHistory(true);
          } else {
              setChatMessages([]);
              setHistoryError(null);
              setIsLoadingHistory(false);
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [isActiveTab, paciente?.id, apiConfig]);

      // --- Send Message Logic (Added Debugging) ---
      const handleSendMessage = async () => {
        if (!message.trim() || isSending || !patientJid || isRecording) {
            console.warn("[WhatsappChat] Send message aborted. Conditions not met:", { message: message.trim(), isSending, patientJid, isRecording });
            return;
        }
        if (!apiConfig?.apiUrl || !apiConfig?.apiKey || !apiConfig?.apiInstance) {
            toast({ variant: "destructive", title: "Erro de Configuração", description: "Configuração da API (URL, Chave, Instância) inválida." });
            console.error("[WhatsappChat] Send message aborted: Incomplete API Config", apiConfig);
            return;
        }

        setIsSending(true);
        toast({ title: "Enviando Mensagem..." });

        // Ensure correct URL base
        let apiUrlBase = apiConfig.apiUrl;
        if (!apiUrlBase.startsWith('http://') && !apiUrlBase.startsWith('https://')) {
            apiUrlBase = `https://${apiUrlBase}`;
        }
        apiUrlBase = apiUrlBase.replace(/\/$/, "");

        const sendUrl = `${apiUrlBase}/message/sendText/${apiConfig.apiInstance}`;
        const payload = {
            number: patientJid, // Using the JID format
            options: { delay: 1200, presence: "composing" },
            textMessage: { text: message }
        };

        // --- Detailed Logging for Sending ---
        console.log(`[WhatsappChat] Sending message (POST)...`);
        console.log(`  -> Target JID: ${patientJid}`);
        console.log(`  -> API Config Used:`, apiConfig);
        console.log(`  -> Request URL: ${sendUrl}`);
        console.log(`  -> Request Method: POST`);
        console.log(`  -> Request Headers: { 'apikey': '${apiConfig.apiKey}', 'Content-Type': 'application/json' }`);
        console.log(`  -> Request Body:`, JSON.stringify(payload));
        // --- End Detailed Logging ---

        try {
            const response = await fetch(sendUrl, {
                method: 'POST',
                headers: {
                    'apikey': apiConfig.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            // Log status and attempt to parse response regardless of status
            console.log("[WhatsappChat] Send Response Status:", response.status);
            let responseData: any;
            let errorDetail = `Erro ${response.status}`;
            try {
                responseData = await response.json();
                console.log("[WhatsappChat] Send Response Data:", responseData);
                errorDetail = responseData?.message || responseData?.error?.message || responseData?.error || JSON.stringify(responseData) || errorDetail;
            } catch (e) {
                console.error("[WhatsappChat] Failed to parse send response as JSON:", e);
                // If JSON parsing fails, try to get text (might be HTML error page)
                try {
                    const textResponse = await response.text();
                    console.error("[WhatsappChat] Send Raw Text Response:", textResponse);
                    errorDetail = textResponse || errorDetail;
                } catch (textErr) {
                    console.error("[WhatsappChat] Failed to get text response either.");
                }
            }

            if (!response.ok) {
                // Throw the detailed error message obtained above
                throw new Error(errorDetail);
            }

            toast({ title: "Mensagem Enviada!", description: `Para: ${paciente?.telefone}` });
            setMessage("");
            setTimeout(() => fetchChatHistory(), 1500); // Re-fetch history after sending
        } catch (error: any) {
            console.error("[WhatsappChat] Error sending message:", error);
            // Use the error message directly if it's an Error object
            const errorMessage = error instanceof Error ? error.message : "Não foi possível enviar a mensagem.";
            toast({ variant: "destructive", title: "Erro ao Enviar", description: errorMessage });
        } finally {
            setIsSending(false);
        }
      };
      // --- End Send Message Logic ---

      // --- Send File Logic ---
      const sendFile = async (file: File, type: 'image' | 'video' | 'audio' | 'document') => {
          if (!patientJid || isSendingMedia || isRecording || !apiConfig?.apiUrl || !apiConfig?.apiKey || !apiConfig?.apiInstance) return;
          setIsSendingMedia(true);
          toast({ title: `Enviando ${type}...` });
          const isMedia = type === 'image' || type === 'video' || type === 'audio';
          const endpoint = isMedia ? `${apiConfig.apiUrl}/message/sendMedia/${apiConfig.apiInstance}` : `${apiConfig.apiUrl}/message/sendFile/${apiConfig.apiInstance}`;
          const formData = new FormData();
          formData.append('number', patientJid);
          formData.append('file', file, file.name);

          console.log(`[WhatsappChat] Sending ${type} (${file.name}) to ${endpoint} for JID ${patientJid}`);

          try {
              const response = await fetch(endpoint, { method: 'POST', headers: { 'apikey': apiConfig.apiKey }, body: formData });
              const responseData = await response.json();
              if (!response.ok) throw new Error(responseData?.message || responseData?.error?.message || `Erro ${response.status}`);
              toast({ title: `${capitalize(type)} Enviado!`, description: `Para: ${paciente?.telefone}` });
              setTimeout(() => fetchChatHistory(), 1500); // Re-fetch after sending
          } catch (error: any) {
              console.error(`[WhatsappChat] Error sending ${type}:`, error);
              toast({ variant: "destructive", title: `Erro ao Enviar ${capitalize(type)}`, description: error.message || `Não foi possível enviar o ${type}.` });
          } finally {
              setIsSendingMedia(false);
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
              mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/ogg; codecs=opus' });
              audioChunksRef.current = [];

              mediaRecorderRef.current.ondataavailable = (event) => {
                  if (event.data.size > 0) audioChunksRef.current.push(event.data);
              };

              mediaRecorderRef.current.onstop = () => {
                  const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg; codecs=opus' });
                  const audioFile = new File([audioBlob], `audio_gravado_${Date.now()}.ogg`, { type: 'audio/ogg; codecs=opus' });
                  console.log("[WhatsappChat] Audio recording stopped. Blob size:", audioBlob.size, "File:", audioFile.name);
                  sendFile(audioFile, 'audio');
                  stream.getTracks().forEach(track => track.stop());
                  setIsRecording(false);
              };

              mediaRecorderRef.current.onerror = (event) => {
                  console.error("[WhatsappChat] MediaRecorder error:", event);
                  toast({ variant: "destructive", title: "Erro na Gravação", description: "Ocorreu um erro." });
                  setIsRecording(false);
                  stream.getTracks().forEach(track => track.stop());
              };

              mediaRecorderRef.current.start();
              setIsRecording(true);
              toast({ title: "Gravando áudio...", description: "Clique para parar." });

          } catch (err) {
              console.error("[WhatsappChat] Error accessing microphone:", err);
              toast({ variant: "destructive", title: "Erro de Permissão", description: "Não foi possível acessar o microfone." });
          }
      };

      const handleStopRecording = () => {
          if (mediaRecorderRef.current && isRecording) {
              mediaRecorderRef.current.stop();
          }
      };
      // --- End Recording Logic ---

      const handleAttachmentClick = (type: 'image' | 'video' | 'audio' | 'document') => {
          if (isRecording) return;
          switch (type) {
              case 'image': imageInputRef.current?.click(); break;
              case 'video': videoInputRef.current?.click(); break;
              case 'audio': audioInputRef.current?.click(); break;
              case 'document': documentInputRef.current?.click(); break;
          }
      };

      const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio' | 'document') => {
          const file = event.target.files?.[0];
          if (file) sendFile(file, type);
      };

      const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

      // --- Render Message Content ---
      const renderMessageContent = (msg: WhatsappMessage) => {
          const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
          if (text) {
              return <p className="text-sm whitespace-pre-wrap break-words">{text}</p>;
          }
          if (msg.message?.imageMessage) {
              return <p className="text-sm italic">[Imagem]{msg.message.imageMessage.caption ? `: ${msg.message.imageMessage.caption}` : ''}</p>;
          }
          if (msg.message?.videoMessage) {
              return <p className="text-sm italic">[Vídeo]{msg.message.videoMessage.caption ? `: ${msg.message.videoMessage.caption}` : ''}</p>;
          }
          if (msg.message?.audioMessage) {
              return <p className="text-sm italic">[Áudio]</p>;
          }
          if (msg.message?.documentMessage) {
              return <p className="text-sm italic">[Documento: {msg.message.documentMessage.title || 'arquivo'}]</p>;
          }
          console.log("[WhatsappChat] Unsupported message type:", msg.message);
          return <p className="text-sm italic">[Tipo de mensagem não suportado]</p>;
      };
      // --- End Render Message Content ---

      return (
        <div className="flex flex-col h-[70vh] md:h-[65vh]">
          {/* Hidden File Inputs */}
          <input type="file" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} accept="image/*" style={{ display: 'none' }} />
          <input type="file" ref={videoInputRef} onChange={(e) => handleFileChange(e, 'video')} accept="video/*" style={{ display: 'none' }} />
          <input type="file" ref={audioInputRef} onChange={(e) => handleFileChange(e, 'audio')} accept="audio/*" style={{ display: 'none' }} />
          <input type="file" ref={documentInputRef} onChange={(e) => handleFileChange(e, 'document')} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" style={{ display: 'none' }} />

          {/* Chat Header */}
          <div className="px-1 pb-2 border-b mb-3 flex justify-between items-center shrink-0">
              <div>
                  <h3 className="text-lg font-medium">Chat WhatsApp</h3>
                  <p className="text-sm text-muted-foreground">{paciente?.nome}</p>
                  <p className="text-xs text-muted-foreground">
                      Número: {paciente?.telefone || "Não informado"} {patientJid ? `(${patientJid.split('@')[0]})` : '(Inválido)'}
                  </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => fetchChatHistory(true)} disabled={isLoadingHistory || !patientJid} title="Atualizar Histórico">
                  <RefreshCw className={cn("h-4 w-4", isLoadingHistory && "animate-spin")} />
              </Button>
          </div>

          {/* Message Area */}
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
                        {msg.key.fromMe && msg.ack !== undefined && msg.ack >= 1 && (
                            <Check className={cn("h-3.5 w-3.5", msg.ack >= 2 ? "" : "opacity-60")} />
                        )}
                         {msg.key.fromMe && msg.ack !== undefined && msg.ack >= 3 && (
                            <Check className="h-3.5 w-3.5 -ml-2.5 text-blue-400" />
                        )}
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
    // --- End Whatsapp Chat Component ---


    const hospitalsData: Record<string, string[]> = {
      "HODF": ["Dr. João Silva", "Dra. Ana Costa", "Dr. Pedro Martins", "Dra. Carla Dias"],
      "HO Londrina": ["Dr. Carlos Souza", "Dra. Beatriz Lima", "Dr. Ricardo Alves", "Dra. Fernanda Vieira"],
      "HO Maringa": ["Dra. Mariana Ferreira", "Dr. Gustavo Pereira", "Dra. Sofia Ribeiro", "Dr. André Mendes"],
      "HOA": ["Dr. Lucas Gomes", "Dra. Julia Almeida", "Dr. Matheus Barbosa", "Dra. Isabela Castro"],
      "": []
    };
    const hospitalNames = Object.keys(hospitalsData).filter(name => name !== "");


    interface PacienteDetailModalProps {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      paciente: PacienteData | null;
    }

    export function PacienteDetailModal({
        open,
        onOpenChange,
        paciente: initialPaciente,
    }: PacienteDetailModalProps) {
      const [activeTab, setActiveTab] = useState("contato");
      const [paciente, setPaciente] = useState<PacienteData | null>(initialPaciente);
      const { toast } = useToast();
      const { apiConfig } = useApiConfig(); // Use context here

      useEffect(() => {
          console.log(`[PacienteDetailModal for ${initialPaciente?.id}] Using apiConfig from context:`, apiConfig);
      }, [apiConfig, initialPaciente?.id, open]);


      const availableDoctors = paciente ? (hospitalsData[paciente.hospital] || []) : [];

      useEffect(() => {
        setPaciente(initialPaciente);
        if (open) {
            setActiveTab("contato");
        }
        if (initialPaciente && (!hospitalsData[initialPaciente.hospital] || !hospitalsData[initialPaciente.hospital]?.includes(initialPaciente.medico))) {
            const firstDoctor = hospitalsData[initialPaciente.hospital]?.[0] || "";
            setPaciente(currentInitial => currentInitial ? ({ ...currentInitial, medico: firstDoctor }) : null);
        }
      }, [initialPaciente, open]);


      const handleInputChange = (field: keyof PacienteData, value: any) => {
        if (field === 'dataNascimento' || field === 'data') {
            try {
                const dateValue = new Date(value + 'T00:00:00');
                if (isValid(dateValue)) {
                     setPaciente(prev => prev ? ({ ...prev, [field]: dateValue }) : null);
                } else { console.warn(`Invalid date value for ${field}:`, value); }
            } catch (e) { console.error(`Error parsing date for ${field}:`, value, e); }
        } else {
            setPaciente(prev => prev ? ({ ...prev, [field]: value }) : null);
        }
      };


      const handleProcedureInputChange = (procIndex: number, field: string, value: any) => {
         setPaciente(prev => {
            if (!prev) return null;
            const updatedProcedimentos = [...prev.procedimentos];
            if (updatedProcedimentos[procIndex]) {
                let processedValue = value;
                if (field === 'data') {
                    try {
                        const dateValue = new Date(value + 'T00:00:00');
                        processedValue = isValid(dateValue) ? dateValue : updatedProcedimentos[procIndex].data;
                    } catch (e) {
                         console.error(`Error parsing procedure date:`, value, e);
                         processedValue = updatedProcedimentos[procIndex].data;
                    }
                } else if (field === 'valor') {
                    processedValue = parseFloat(value) || 0;
                } else if (field === 'procedimento') {
                     const name = value as string;
                     const type = name.toLowerCase().includes("consulta") ? "Consulta" :
                                  name.toLowerCase().includes("exame") ? "Exame" :
                                  name.toLowerCase().includes("cirurgia") ? "Cirurgia" : "Outro";
                     (updatedProcedimentos[procIndex] as any)['tipo'] = type;
                }
                (updatedProcedimentos[procIndex] as any)[field] = processedValue;
            }
            return { ...prev, procedimentos: updatedProcedimentos };
         });
      };

      const handleHospitalChange = (newHospital: string) => {
        if (!paciente) return;
        const oldHospital = paciente.hospital;
        const oldDoctor = paciente.medico;
        if (newHospital === oldHospital) return;

        const newDoctorList = hospitalsData[newHospital] || [];
        const newSelectedDoctor = newDoctorList[0] || "";
        const updatedProcedimentos = paciente.procedimentos.map(proc =>
          proc.status !== 'ganho' && proc.status !== 'perdido' ? { ...proc, hospital: newHospital } : proc
        );
        const historyDescription = `Hospital vinculado alterado de "${oldHospital}" para "${newHospital}". Médico vinculado atualizado de "${oldDoctor}" para "${newSelectedDoctor}". Hospitais de procedimentos pendentes atualizados.`;
        const newHistoricoEntry = { id: `hist-${Date.now()}`, data: new Date(), tipo: "Alteração", descricao: historyDescription, usuario: "Sistema" };

        setPaciente(prev => prev ? ({ ...prev, hospital: newHospital, medico: newSelectedDoctor, procedimentos: updatedProcedimentos, historico: [newHistoricoEntry, ...prev.historico] }) : null);
        toast({ title: "Hospital Atualizado", description: `Hospital alterado para ${newHospital}. Médico resetado.` });
      };

      const handleDoctorChange = (newDoctor: string) => {
          if (!paciente) return;
          const oldDoctor = paciente.medico;
          if (newDoctor === oldDoctor) return;
          const newHistoricoEntry = { id: `hist-${Date.now()}`, data: new Date(), tipo: "Alteração", descricao: `Médico vinculado alterado de "${oldDoctor}" para "${newDoctor}".`, usuario: "Sistema" };
          setPaciente(prev => prev ? ({ ...prev, medico: newDoctor, historico: [newHistoricoEntry, ...prev.historico] }) : null);
          toast({ title: "Médico Atualizado", description: `Médico vinculado alterado para ${newDoctor}.` });
      }

      const handleCall = () => { toast({ title: "Ligar", description: "Funcionalidade pendente." }); };
      const handleStatusChange = (procedimentoId: string, status: "ganho" | "perdido") => { toast({ title: "Status Procedimento", description: `Alterar ${procedimentoId} para ${status} - pendente.` }); };
      const addProcedimento = () => { toast({ title: "Adicionar Procedimento", description: "Funcionalidade pendente." }); };
      const handleSaveChanges = () => { toast({ title: "Salvar Alterações", description: "Funcionalidade pendente." }); };

      if (!paciente && open) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="text-xl">Carregando...</DialogTitle></DialogHeader>
                    <div className="p-6 text-center">Carregando dados do paciente...</div>
                </DialogContent>
            </Dialog>
        );
      }
      if (!open || !paciente) {
          return null;
      }


      const formattedNascimento = safeFormatDate(paciente.dataNascimento, "yyyy-MM-dd");
      const formattedMarketingIndicacao = safeFormatDate(paciente.marketingData?.dataIndicacao, "dd/MM/yyyy");
      const formattedMarketingEvento = safeFormatDate(paciente.marketingData?.dataEvento, "dd/MM/yyyy");


      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-0 shrink-0">
              <div className="flex justify-between items-center">
                <DialogTitle className="text-xl">{paciente.nome}</DialogTitle>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={handleCall} title="Ligar para paciente"><PhoneCall className="h-4 w-4" /></Button>
                     <Button size="sm" onClick={handleSaveChanges} title="Salvar Alterações"><Save className="h-4 w-4 mr-2" /> Salvar</Button>
                </div>
              </div>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0 overflow-hidden px-6 pb-6">
              <TabsList className="grid grid-cols-4 mb-4 shrink-0">
                <TabsTrigger value="contato">Contato</TabsTrigger>
                <TabsTrigger value="procedimentos">Procedimentos</TabsTrigger>
                <TabsTrigger value="whatsapp"><MessageCircle className="h-4 w-4 mr-1"/> WhatsApp</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>

              {/* Contact Tab */}
              <TabsContent value="contato" className="space-y-6 flex-1 overflow-y-auto mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 border-r md:pr-6">
                    <h3 className="text-lg font-medium mb-2">Dados Pessoais</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-2"><Label htmlFor="hospital-vinculado">Hospital Vinculado</Label><Select value={paciente.hospital} onValueChange={handleHospitalChange}><SelectTrigger id="hospital-vinculado"><SelectValue placeholder="Selecione o hospital" /></SelectTrigger><SelectContent>{hospitalNames.map(name => (<SelectItem key={name} value={name}>{name}</SelectItem>))}</SelectContent></Select></div>
                       <div className="space-y-2"><Label htmlFor="medico-vinculado">Médico Vinculado</Label><Select value={paciente.medico} onValueChange={handleDoctorChange} disabled={!paciente.hospital}><SelectTrigger id="medico-vinculado"><SelectValue placeholder="Selecione o médico" /></SelectTrigger><SelectContent>{availableDoctors.length > 0 ? availableDoctors.map(name => (<SelectItem key={name} value={name}>{name}</SelectItem>)) : <SelectItem value="" disabled>Selecione um hospital</SelectItem>}</SelectContent></Select></div>
                      <div className="space-y-2"><Label htmlFor="nome">Nome Completo</Label><Input id="nome" value={paciente.nome || ''} onChange={(e) => handleInputChange('nome', e.target.value)} /></div>
                      <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="dataNascimento">Data de Nascimento</Label><Input id="dataNascimento" type="date" value={formattedNascimento} onChange={(e) => handleInputChange('dataNascimento', e.target.value)}/></div><div className="space-y-2"><Label htmlFor="cpf">CPF</Label><Input id="cpf" value={paciente.cpf || ''} onChange={(e) => handleInputChange('cpf', e.target.value)} /></div></div>
                      <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="telefone1">Telefone 1 (WhatsApp)</Label><Input id="telefone1" value={paciente.telefone || ''} onChange={(e) => handleInputChange('telefone', e.target.value)} /></div><div className="space-y-2"><Label htmlFor="telefone2">Telefone 2</Label><Input id="telefone2" value={paciente.telefone2 || ""} onChange={(e) => handleInputChange('telefone2', e.target.value)} /></div></div>
                      <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={paciente.email || ""} onChange={(e) => handleInputChange('email', e.target.value)} /></div>
                      <div className="grid grid-cols-3 gap-3"><div className="space-y-2"><Label htmlFor="uf">UF</Label><Input id="uf" value={paciente.uf || ''} onChange={(e) => handleInputChange('uf', e.target.value)} /></div><div className="space-y-2 col-span-2"><Label htmlFor="cidade">Cidade</Label><Input id="cidade" value={paciente.cidade || ''} onChange={(e) => handleInputChange('cidade', e.target.value)} /></div></div>
                      <div className="space-y-2"><Label htmlFor="bairro">Bairro</Label><Input id="bairro" value={paciente.bairro || ''} onChange={(e) => handleInputChange('bairro', e.target.value)} /></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                     <h3 className="text-lg font-medium mb-2">Dados de Marketing</h3>
                     <div className="grid grid-cols-1 gap-3">
                       <div className="space-y-2"><Label htmlFor="origem">Origem</Label><Select value={paciente.origem} onValueChange={(value) => handleInputChange('origem', value)}><SelectTrigger id="origem"><SelectValue placeholder="Selecione a origem" /></SelectTrigger><SelectContent><SelectItem value="Publicidade Digital">Publicidade Digital</SelectItem><SelectItem value="Evento">Evento</SelectItem><SelectItem value="Publicidade Tradicional">Publicidade Tradicional</SelectItem><SelectItem value="Indicação">Indicação</SelectItem></SelectContent></Select></div>
                       {paciente.origem === "Publicidade Digital" || paciente.origem === "Publicidade Tradicional" ? (<><div className="space-y-2"><Label>Fonte</Label><Input value={paciente.marketingData?.fonte || ""} readOnly /></div><div className="space-y-2"><Label>Campanha</Label><Input value={paciente.marketingData?.campanha || ""} readOnly /></div><div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Conjunto/Grupo</Label><Input value={paciente.marketingData?.conjunto || ""} readOnly /></div><div className="space-y-2"><Label>Tipo Criativo</Label><Input value={paciente.marketingData?.tipoCriativo || ""} readOnly /></div></div><div className="space-y-2"><Label>Título Criativo</Label><Input value={paciente.marketingData?.tituloCriativo || ""} readOnly /></div><div className="space-y-2"><Label>Palavra-chave</Label><Input value={paciente.marketingData?.palavraChave || ""} readOnly /></div></>)
                       : paciente.origem === "Indicação" ? (<><div className="space-y-2"><Label>Quem Indicou</Label><Input value={paciente.marketingData?.quemIndicou || ""} readOnly /></div><div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Data Indicação</Label><Input value={formattedMarketingIndicacao} readOnly /></div><div className="space-y-2"><Label>Telefone</Label><Input value={paciente.marketingData?.telefoneIndicacao || ""} readOnly /></div></div></>)
                       : paciente.origem === "Evento" ? (<><div className="space-y-2"><Label>Nome do Evento</Label><Input value={paciente.marketingData?.nomeEvento || ""} readOnly /></div><div className="space-y-2"><Label>Data do Evento</Label><Input value={formattedMarketingEvento} readOnly /></div><div className="space-y-2"><Label>Descrição</Label><Textarea value={paciente.marketingData?.descricaoEvento || ""} readOnly /></div></>)
                       : null}
                     </div>
                  </div>
                </div>
              </TabsContent>

              {/* Procedures Tab */}
              <TabsContent value="procedimentos" className="space-y-4 flex-1 overflow-y-auto mt-0">
                 <div className="flex justify-between items-center"><h3 className="text-lg font-medium">Procedimentos</h3><Button onClick={addProcedimento} size="sm"><Plus className="h-4 w-4 mr-1" />Adicionar</Button></div>
                 {paciente.procedimentos.length === 0 ? (<div className="text-center py-8 text-muted-foreground">Nenhum procedimento.</div>)
                 : (<div className="space-y-6">{paciente.procedimentos.map((procedimento, index) => { const formattedProcDate = safeFormatDate(procedimento.data, "yyyy-MM-dd"); return (<div key={procedimento.id} className="border rounded-lg p-4 relative"><div className="absolute top-2 right-2">{procedimento.status === "ganho" && (<Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Ganho</Badge>)}{procedimento.status === "perdido" && (<Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Perdido</Badge>)}{procedimento.status === "pendente" && (<Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente</Badge>)}</div><div className="flex justify-between items-start mb-3 mr-20"><h4 className="font-medium">{procedimento.tipo}</h4>{procedimento.status === "pendente" && (<div className="flex space-x-2"><Button variant="outline" size="sm" className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200" onClick={() => handleStatusChange(procedimento.id, "ganho")}> <Check className="h-4 w-4 mr-1" /> Ganho </Button><Button variant="outline" size="sm" className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200" onClick={() => handleStatusChange(procedimento.id, "perdido")}> <X className="h-4 w-4 mr-1" /> Perdido </Button></div>)}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-3"><div className="space-y-2"><Label htmlFor={`procedimento-${index}`}>Procedimento Específico</Label><Input id={`procedimento-${index}`} value={procedimento.procedimento || ''} onChange={(e) => handleProcedureInputChange(index, 'procedimento', e.target.value)} disabled={procedimento.status !== 'pendente'}/></div><div className="space-y-2"><Label htmlFor={`hospital-proc-${index}`}>Hospital</Label><Input id={`hospital-proc-${index}`} value={procedimento.hospital || ''} readOnly className="bg-muted/50"/></div><div className="space-y-2"><Label htmlFor={`medico-${index}`}>Médico</Label><Input id={`medico-${index}`} value={procedimento.medico || ''} onChange={(e) => handleProcedureInputChange(index, 'medico', e.target.value)} disabled={procedimento.status !== 'pendente'}/></div><div className="space-y-2"><Label htmlFor={`tipo-${index}`}>Tipo (Automático)</Label><Input id={`tipo-${index}`} value={procedimento.tipo || ''} readOnly className="bg-muted/50"/></div></div><div className="space-y-3"><div className="space-y-2"><Label htmlFor={`valor-${index}`}>Valor</Label><Input id={`valor-${index}`} type="number" value={procedimento.valor || 0} onChange={(e) => handleProcedureInputChange(index, 'valor', e.target.value)} disabled={procedimento.status !== 'pendente'}/></div><div className="space-y-2"><Label htmlFor={`data-${index}`}>Data de realização</Label><Input id={`data-${index}`} type="date" value={formattedProcDate} onChange={(e) => handleProcedureInputChange(index, 'data', e.target.value)} disabled={procedimento.status !== 'pendente'}/></div><div className="space-y-2"><Label htmlFor={`convenio-${index}`}>Convênio</Label><Input id={`convenio-${index}`} value={procedimento.convenio || ''} onChange={(e) => handleProcedureInputChange(index, 'convenio', e.target.value)} disabled={procedimento.status !== 'pendente'}/></div><div className="space-y-2"><Label htmlFor={`observacao-${index}`}>Observação</Label><Textarea id={`observacao-${index}`} value={procedimento.observacao || ''} onChange={(e) => handleProcedureInputChange(index, 'observacao', e.target.value)} className="h-[72px]" disabled={procedimento.status !== 'pendente'}/></div></div></div></div>);})}</div>)}
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="flex-1 flex flex-col min-h-0 mt-0">
             <WhatsappChat
                paciente={paciente}
                isActiveTab={activeTab === 'whatsapp'}
             />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="historico" className="space-y-4 flex-1 overflow-y-auto mt-0">
             <div>
               <h3 className="text-lg font-medium">Histórico</h3>
               {paciente.historico.length === 0 ? (<div className="text-center py-8 text-muted-foreground">Nenhum registro.</div>)
               : (<ScrollArea className="h-[calc(80vh-10rem)] pr-4"><div className="space-y-3">{paciente.historico.map((item) => (<div key={item.id} className="border rounded-lg p-3"><div className="flex items-start"><div className="mt-0.5 mr-3">{item.tipo === "Ligação" && <PhoneCall className="h-4 w-4 text-blue-500" />}{item.tipo === "Status" && <FileText className="h-4 w-4 text-green-500" />}{item.tipo === "Procedimento" && <CalendarClock className="h-4 w-4 text-purple-500" />}{item.tipo === "Criação" && <Plus className="h-4 w-4 text-indigo-500" />}{item.tipo === "Acompanhamento" && <Clock className="h-4 w-4 text-amber-500" />}{item.tipo === "Alteração" && <Building className="h-4 w-4 text-orange-500" />}</div><div className="flex-1"><div className="flex justify-between"><h4 className="font-medium text-sm">{item.tipo}</h4><span className="text-xs text-muted-foreground">{safeFormatDate(item.data, "dd/MM/yyyy HH:mm")}</span></div><p className="text-sm mt-1">{item.descricao}</p><span className="text-xs text-muted-foreground mt-1">{item.usuario}</span></div></div></div>))}</div></ScrollArea>)}
             </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
