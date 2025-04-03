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
        import { PacienteData } from "@/components/pacientes/paciente-card";
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
        import {
            fetchChatHistory,
            sendMessage,
            sendMedia,
            sendDocument,
            EvolutionApiError
        } from "@/lib/evolution-api";

        // --- Helper function to safely format dates ---
        const safeFormatDate = (dateInput: Date | string | number | null | undefined, formatString: string): string => {
          if (!dateInput) return "";
          try {
            const date = typeof dateInput === 'number'
              ? new Date(dateInput * 1000) // Assume Unix timestamp in seconds
              : typeof dateInput === 'string'
              ? parseISO(dateInput)
              : dateInput;

            if (date instanceof Date && !isNaN(date.getTime())) {
              return format(date, formatString, { locale: ptBR });
            }
          } catch (error) {
            console.error("Error formatting date:", dateInput, error);
          }
          return "Data inválida";
        };
        // --- End Helper ---

        // --- Interface for WhatsApp Message (ensure it matches the one in evolution-api.ts) ---
        interface WhatsappMessage {
            id?: string;
            key: {
                remoteJid: string;
                fromMe: boolean;
                id: string;
                participant?: string;
            };
            messageTimestamp: number; // Unix timestamp (seconds)
            message?: {
                conversation?: string;
                extendedTextMessage?: { text: string };
                imageMessage?: { caption?: string; mimetype?: string; mediaUrl?: string; };
                videoMessage?: { caption?: string; mimetype?: string; mediaUrl?: string; };
                audioMessage?: { mimetype?: string; mediaUrl?: string; ptt?: boolean; };
                documentMessage?: { title?: string; mimetype?: string; mediaUrl?: string; };
            };
            ack?: number; // 0: pending, 1: sent (server ack), 2: delivered (device ack), 3: read (read ack)
            pushName?: string;
            messageType?: string;
            instanceId?: string;
            source?: string;
            contextInfo?: any;
            MessageUpdate?: any[];
        }
        // --- End Interface ---

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
          const [isLoadingHistory, setIsLoadingHistory] = useState<false>(false);
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

          // --- Format Phone Number to JID (for sending) ---
          const formatPhoneNumberToJid = (phone: string | undefined): string | null => {
              if (!phone) return null;
              let cleaned = phone.replace(/\D/g, '');
              if (cleaned.length < 10 || cleaned.length > 13) return null; // Basic validation
              // Ensure 55 prefix for Brazilian numbers
              if ((cleaned.length === 10 || cleaned.length === 11) && !cleaned.startsWith('55')) {
                  cleaned = '55' + cleaned;
              }
              // If it has 12 or 13 digits and starts with 55, assume it's correct
              if (cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
                 return `${cleaned}@s.whatsapp.net`;
              }
              // Add other country code logic if needed
              return null; // Return null if format is unexpected
          };
          // --- End Format Phone Number ---

          // --- Format JID for History Fetch (Remove 9th digit for BR numbers) ---
          const formatJidForHistory = (jid: string | null): string | null => {
              if (!jid) return null;
              const match = jid.match(/^55(\d{2})(9?)(\d{8})@s\.whatsapp\.net$/);
              if (match) {
                  // It's a Brazilian number (55 + 2 area code + optional 9 + 8 digits)
                  const areaCode = match[1];
                  const mainNumber = match[3];
                  return `55${areaCode}${mainNumber}@s.whatsapp.net`;
              }
              // Not a Brazilian mobile number in the expected format, return original
              return jid;
          };
          // --- End Format JID for History ---

          const patientJidForSending = paciente ? formatPhoneNumberToJid(paciente.telefone) : null;
          const patientJidForHistory = formatJidForHistory(patientJidForSending); // Format specifically for history

          // --- Fetch Chat History using Service ---
          const fetchChatHistoryHandler = useCallback(async (showLoadingToast = false) => {
              // Use the specifically formatted JID for history
              if (!patientJidForHistory) {
                  setHistoryError("Número de telefone do paciente inválido ou não formatado corretamente para buscar histórico.");
                  setChatMessages([]);
                  setIsLoadingHistory(false);
                  return;
              }
              if (!apiConfig?.apiUrl || !apiConfig?.apiKey || !apiConfig?.apiInstance) {
                  setHistoryError("Configuração da API (URL, Chave, Instância) não encontrada ou inválida.");
                  setChatMessages([]);
                  setIsLoadingHistory(false);
                  return;
              }

              setIsLoadingHistory(true);
              setHistoryError(null);
              if (showLoadingToast) {
                  toast({ title: "Buscando histórico..." });
              }

              try {
                  console.log(`[WhatsappChat] Fetching history via service for formatted JID: ${patientJidForHistory}`);
                  const messages = await fetchChatHistory(apiConfig, patientJidForHistory); // Use service with formatted JID
                  setChatMessages(messages);

                  if (messages.length === 0) {
                      toast({ title: "Histórico Vazio", description: "Nenhuma mensagem encontrada para este contato." });
                  } else {
                      toast({ title: "Histórico carregado." });
                  }

              } catch (error: any) {
                  console.error("[WhatsappChat] Error fetching chat history via service:", error);
                  const errorMessage = error instanceof EvolutionApiError ? error.message : "Não foi possível buscar o histórico.";
                  setHistoryError(errorMessage);
                  toast({ variant: "destructive", title: "Erro ao Buscar Histórico", description: errorMessage });
              } finally {
                  setIsLoadingHistory(false);
              }
          }, [patientJidForHistory, apiConfig, toast]); // Depend on the formatted JID
          // --- End Fetch Chat History ---

          // --- Scroll to Bottom - useEffect with chatMessages dependency ---
          useEffect(() => {
              if (chatAreaRef.current) {
                  chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
              }
          }, [chatMessages]);
          // --- End Scroll to Bottom ---

          // --- Fetch history when tab becomes active or patient/config changes ---
          useEffect(() => {
              if (isActiveTab && paciente?.id && apiConfig?.apiInstance && patientJidForHistory) {
                  console.log(`[WhatsappChat] Tab active for ${paciente.id}. Fetching history with config:`, apiConfig);
                  fetchChatHistoryHandler(true); // Use the handler
              } else {
                  setChatMessages([]);
                  setHistoryError(null);
                  setIsLoadingHistory(false);
              }
          }, [isActiveTab, paciente?.id, apiConfig?.apiInstance, patientJidForHistory, fetchChatHistoryHandler]);


          // --- Send Message Logic using Service ---
          const handleSendMessage = async () => {
            // Use the JID formatted for sending
            if (!message.trim() || isSending || !patientJidForSending || isRecording) return;
            if (!apiConfig?.apiUrl || !apiConfig?.apiKey || !apiConfig?.apiInstance) {
                toast({ variant: "destructive", title: "Erro de Configuração", description: "Configuração da API inválida." });
                return;
            }

            setIsSending(true);
            toast({ title: "Enviando Mensagem..." });

            try {
                console.log(`[WhatsappChat] Sending message via service to JID: ${patientJidForSending}`);
                await sendMessage(apiConfig, patientJidForSending, message); // Use service with sending JID
                toast({ title: "Mensagem Enviada!", description: `Para: ${paciente?.telefone}` });
                setMessage("");
                setTimeout(() => fetchChatHistoryHandler(), 1500); // Re-fetch history
            } catch (error: any) {
                console.error("[WhatsappChat] Error sending message via service:", error);
                const errorMessage = error instanceof EvolutionApiError ? error.message : "Não foi possível enviar a mensagem.";
                toast({ variant: "destructive", title: "Erro ao Enviar", description: errorMessage });
            } finally {
                setIsSending(false);
            }
          };
          // --- End Send Message Logic ---

          // --- Send File Logic using Service ---
          const sendFileHandler = async (file: File, type: 'image' | 'video' | 'audio' | 'document') => {
              // Use the JID formatted for sending
              if (!patientJidForSending || isSendingMedia || isRecording || !apiConfig?.apiUrl || !apiConfig?.apiKey || !apiConfig?.apiInstance) return;

              setIsSendingMedia(true);
              toast({ title: `Enviando ${type}...` });

              try {
                  console.log(`[WhatsappChat] Sending ${type} via service to JID: ${patientJidForSending}`);
                  if (type === 'image' || type === 'video' || type === 'audio') {
                      await sendMedia(apiConfig, patientJidForSending, file); // Use sendMedia service function
                  } else {
                      await sendDocument(apiConfig, patientJidForSending, file); // Use sendDocument service function
                  }
                  toast({ title: `${capitalize(type)} Enviado!`, description: `Para: ${paciente?.telefone}` });
                  setTimeout(() => fetchChatHistoryHandler(), 1500);
              } catch (error: any) { // <-- Added missing opening brace {
                  console.error(`[WhatsappChat] Error sending ${type} via service:`, error);
                  const errorMessage = error instanceof EvolutionApiError ? error.message : `Não foi possível enviar o ${type}.`;
                  toast({ variant: "destructive", title: `Erro ao Enviar ${capitalize(type)}`, description: errorMessage });
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
              // Use the JID formatted for sending
              if (isRecording || !patientJidForSending) return;
              if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                  toast({ variant: "destructive", title: "Erro", description: "Gravação de áudio não suportada." });
                  return;
              }
              try {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                  const mimeType = MediaRecorder.isTypeSupported('audio/ogg; codecs=opus') ? 'audio/ogg; codecs=opus' : 'audio/webm';
                  mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
                  audioChunksRef.current = [];
                  mediaRecorderRef.current.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
                  mediaRecorderRef.current.onstop = () => {
                      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                      const fileExtension = mimeType.includes('ogg') ? 'ogg' : 'webm';
                      const audioFile = new File([audioBlob], `audio_gravado_${Date.now()}.${fileExtension}`, { type: mimeType });
                      sendFileHandler(audioFile, 'audio'); // Use the handler
                      stream.getTracks().forEach(track => track.stop());
                      setIsRecording(false);
                  };
                  mediaRecorderRef.current.onerror = (event) => { console.error("[WhatsappChat] MediaRecorder error:", event); toast({ variant: "destructive", title: "Erro na Gravação" }); setIsRecording(false); stream.getTracks().forEach(track => track.stop()); };
                  mediaRecorderRef.current.start();
                  setIsRecording(true);
                  toast({ title: "Gravando áudio..." });
              } catch (err: any) {
                  console.error("[WhatsappChat] Error accessing microphone:", err);
                  let description = "Não foi possível acessar o microfone.";
                  if (err.name === 'NotAllowedError') description = "Permissão negada.";
                  else if (err.name === 'NotFoundError') description = "Microfone não encontrado.";
                  toast({ variant: "destructive", title: "Erro de Microfone", description });
              }
          };

          const handleStopRecording = () => {
              if (mediaRecorderRef.current && isRecording) {
                  mediaRecorderRef.current.stop();
              }
          };
          // --- End Recording Logic ---

          const handleAttachmentClick = (type: 'image' | 'video' | 'audio' | 'document') => {
              if (isRecording || isSendingMedia) return;
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
                  sendFileHandler(file, type); // Use the handler
              }
          };

          const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

          // --- Render Message Content (Keep as before) ---
          const renderMessageContent = (msg: WhatsappMessage) => {
              const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
              if (text) {
                  const parts = text.split(/(\s+)/);
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
              if (msg.message?.imageMessage) { return <p className="text-sm italic text-gray-400">[Imagem]{msg.message.imageMessage.caption ? `: ${msg.message.caption}` : ''}</p>; }
              if (msg.message?.videoMessage) { return <p className="text-sm italic text-gray-400">[Vídeo]{msg.message.videoMessage.caption ? `: ${msg.message.videoMessage.caption}` : ''}</p>; }
              if (msg.message?.audioMessage) { return <p className="text-sm italic text-gray-400">[Áudio]{msg.message.audioMessage.ptt ? ' (PTT)' : ''}</p>; }
              if (msg.message?.documentMessage) { return <p className="text-sm italic text-gray-400">[Documento: {msg.message.documentMessage.title || 'arquivo'}]</p>; }
              console.log("[WhatsappChat] Unsupported message type:", msg.message ? Object.keys(msg.message) : 'No message content');
              return <p className="text-sm italic text-gray-500">[Tipo de mensagem não suportado]</p>;
          };
          // --- End Render Message Content ---

          // --- Render Message Status Ticks (Keep as before) ---
          const renderMessageTicks = (msg: WhatsappMessage) => {
              if (!msg.key.fromMe || msg.ack === undefined || msg.ack < 1) return null;
              const tickColor = msg.ack === 3 ? "text-blue-400" : "text-primary-foreground/80";
              return ( <> <Check className={cn("h-3.5 w-3.5", tickColor, msg.ack < 2 ? "opacity-60" : "")} /> {msg.ack >= 2 && ( <Check className={cn("h-3.5 w-3.5 -ml-2.5", tickColor)} /> )} </> );
          };
          // --- End Render Message Status Ticks ---

          return (
            <div className="flex flex-col h-full"> {/* Ensure main container is flex column */}
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
                          Número: {paciente?.telefone || "Não informado"} {patientJidForSending ? `(${patientJidForSending.split('@')[0]})` : '(Inválido)'}
                      </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => fetchChatHistoryHandler(true)} disabled={isLoadingHistory || !patientJidForHistory} title="Atualizar Histórico">
                      <RefreshCw className={cn("h-4 w-4", isLoadingHistory && "animate-spin")} />
                  </Button>
              </div>

              {/* Message Area - Flexbox with ScrollArea */}
              <div className="flex-1 flex flex-col"> {/* flex-col here */}
                <ScrollArea className="px-4 py-2 bg-muted/20 rounded-md min-h-0 overflow-y-auto flex-1"> {/* flex-1 here */}
                  <div className="space-y-4">
                    {isLoadingHistory && ( <div className="text-center text-muted-foreground py-10"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Carregando histórico...</div> )}
                    {historyError && !isLoadingHistory && ( <div className="text-center text-destructive py-10 px-2 break-words">Erro ao carregar histórico: {historyError}</div> )}
                    {!isLoadingHistory && !historyError && chatMessages.length === 0 && ( <div className="text-center text-muted-foreground py-10">Nenhuma mensagem encontrada.</div> )}
                    {!isLoadingHistory && !historyError && chatMessages.map((msg) => (
                      <div key={msg.key.id + msg.messageTimestamp} className={cn("flex", msg.key.fromMe ? "justify-end" : "justify-start")}> {/* Added timestamp to key for potential duplicates */}
                        <div className={cn( "rounded-lg py-2 px-3 max-w-[75%] shadow-sm text-left", msg.key.fromMe ? "bg-primary/90 text-primary-foreground" : "bg-background border" )}>
                          {renderMessageContent(msg)}
                          <div className={cn("text-xs mt-1 flex items-center gap-1", msg.key.fromMe ? "text-primary-foreground/80 justify-end" : "text-muted-foreground justify-end")}>
                              {/* Use messageTimestamp for display */}
                              <span>{safeFormatDate(msg.messageTimestamp, "HH:mm")}</span>
                              {renderMessageTicks(msg)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Input Area - Sticky Positioning */}
              <div className="sticky bottom-0 bg-background border-t pt-4 px-1 shrink-0"> {/* position: sticky */}
                <div className="flex items-center gap-2">
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" title="Anexar" disabled={isSending || isSendingMedia || isRecording || !patientJidForSending}>
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
                      disabled={isSending || isSendingMedia || isRecording || !patientJidForSending}
                  />

                  {message.trim() && !isRecording ? (
                      <Button onClick={handleSendMessage} disabled={!patientJidForSending || isSending || isSendingMedia} title="Enviar Mensagem">
                          {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
                      </Button>
                  ) : (
                      <Button
                          variant={isRecording ? "destructive" : "ghost"}
                          size="icon"
                          onClick={isRecording ? handleStopRecording : handleStartRecording}
                          disabled={!patientJidForSending || isSending || isSendingMedia}
                          title={isRecording ? "Parar Gravação" : "Gravar Áudio"}
                      >
                          {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </Button>
                  )}
                </div>
              </div>
            </div>
          );
        };
