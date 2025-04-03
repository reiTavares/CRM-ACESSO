import React, { useState, useEffect, useRef, useCallback } from "react";
    import { Button } from "@/components/ui/button";
    import { ScrollArea } from "@/components/ui/scroll-area";
    import { useToast } from "@/hooks/use-toast";
    import { cn } from "@/lib/utils";
    import { ApiConfig, useApiConfig } from "@/contexts/ApiConfigContext";
    import { PacienteData } from "@/components/pacientes/paciente-card";
    import { Loader2, RefreshCw } from "lucide-react";
    import {
        fetchChatHistory,
        sendMessage,
        sendMedia,
        sendDocument,
        EvolutionApiError
    } from "@/lib/evolution-api";
    import { MessageBubble } from './MessageBubble'; // Import new component
    import { ChatInputArea } from './ChatInputArea'; // Import new component

    // Interface for WhatsApp Message (keep it consistent)
    export interface WhatsappMessage { // Export if needed by MessageBubble
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

    interface WhatsappChatProps {
      paciente: PacienteData | null;
      isActiveTab: boolean;
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
      const { apiConfig } = useApiConfig();

      const chatAreaRef = useRef<HTMLDivElement>(null);
      const imageInputRef = useRef<HTMLInputElement>(null);
      const videoInputRef = useRef<HTMLInputElement>(null);
      const audioInputRef = useRef<HTMLInputElement>(null);
      const documentInputRef = useRef<HTMLInputElement>(null);
      const mediaRecorderRef = useRef<MediaRecorder | null>(null);
      const audioChunksRef = useRef<Blob[]>([]);

      // --- JID Formatting Functions (Keep as before) ---
      const formatPhoneNumberToJid = (phone: string | undefined): string | null => {
          if (!phone) return null;
          let cleaned = phone.replace(/\D/g, '');
          if (cleaned.length < 10 || cleaned.length > 13) return null;
          if ((cleaned.length === 10 || cleaned.length === 11) && !cleaned.startsWith('55')) {
              cleaned = '55' + cleaned;
          }
          if (cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
             return `${cleaned}@s.whatsapp.net`;
          }
          return null;
      };
      const formatJidForHistory = (jid: string | null): string | null => {
          if (!jid) return null;
          const match = jid.match(/^55(\d{2})(9?)(\d{8})@s\.whatsapp\.net$/);
          if (match) {
              const areaCode = match[1];
              const mainNumber = match[3];
              return `55${areaCode}${mainNumber}@s.whatsapp.net`;
          }
          return jid;
      };

      const patientJidForSending = paciente ? formatPhoneNumberToJid(paciente.telefone) : null;
      const patientJidForHistory = formatJidForHistory(patientJidForSending);

      // --- API Callbacks (Keep as before, ensure they use correct JIDs) ---
      const fetchChatHistoryHandler = useCallback(async (showLoadingToast = false) => {
          if (!patientJidForHistory) { /* ... */ return; }
          if (!apiConfig?.apiUrl || !apiConfig?.apiKey || !apiConfig?.apiInstance) { /* ... */ return; }
          setIsLoadingHistory(true);
          setHistoryError(null);
          if (showLoadingToast) toast({ title: "Buscando histórico..." });
          try {
              const messages = await fetchChatHistory(apiConfig, patientJidForHistory);
              setChatMessages(messages);
              if (messages.length === 0) toast({ title: "Histórico Vazio" });
              else toast({ title: "Histórico carregado." });
          } catch (error: any) {
              const errorMessage = error instanceof EvolutionApiError ? error.message : "Não foi possível buscar o histórico.";
              setHistoryError(errorMessage);
              toast({ variant: "destructive", title: "Erro ao Buscar Histórico", description: errorMessage });
          } finally {
              setIsLoadingHistory(false);
          }
      }, [patientJidForHistory, apiConfig, toast]);

      const handleSendMessage = async () => {
          if (!message.trim() || isSending || !patientJidForSending || isRecording) return;
          if (!apiConfig?.apiUrl || !apiConfig?.apiKey || !apiConfig?.apiInstance) { /* ... */ return; }
          setIsSending(true);
          toast({ title: "Enviando Mensagem..." });
          try {
              await sendMessage(apiConfig, patientJidForSending, message);
              toast({ title: "Mensagem Enviada!" });
              setMessage("");
              setTimeout(() => fetchChatHistoryHandler(), 1500);
          } catch (error: any) {
              const errorMessage = error instanceof EvolutionApiError ? error.message : "Não foi possível enviar a mensagem.";
              toast({ variant: "destructive", title: "Erro ao Enviar", description: errorMessage });
          } finally {
              setIsSending(false);
          }
      };

      const sendFileHandler = async (file: File, type: 'image' | 'video' | 'audio' | 'document') => {
          if (!patientJidForSending || isSendingMedia || isRecording || !apiConfig?.apiUrl || !apiConfig?.apiKey || !apiConfig?.apiInstance) return;
          setIsSendingMedia(true);
          toast({ title: `Enviando ${type}...` });
          try {
              if (type === 'image' || type === 'video' || type === 'audio') {
                  await sendMedia(apiConfig, patientJidForSending, file);
              } else {
                  await sendDocument(apiConfig, patientJidForSending, file);
              }
              toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} Enviado!` });
              setTimeout(() => fetchChatHistoryHandler(), 1500);
          } catch (error: any) {
              const errorMessage = error instanceof EvolutionApiError ? error.message : `Não foi possível enviar o ${type}.`;
              toast({ variant: "destructive", title: `Erro ao Enviar ${type.charAt(0).toUpperCase() + type.slice(1)}`, description: errorMessage });
          } finally {
              setIsSendingMedia(false);
              if (imageInputRef.current) imageInputRef.current.value = "";
              if (videoInputRef.current) videoInputRef.current.value = "";
              if (audioInputRef.current) audioInputRef.current.value = "";
              if (documentInputRef.current) documentInputRef.current.value = "";
          }
      };

      const handleStartRecording = async () => {
          if (isRecording || !patientJidForSending) return;
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { /* ... */ return; }
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
                  sendFileHandler(audioFile, 'audio');
                  stream.getTracks().forEach(track => track.stop());
                  setIsRecording(false);
              };
              mediaRecorderRef.current.onerror = (event) => { /* ... */ setIsRecording(false); stream.getTracks().forEach(track => track.stop()); };
              mediaRecorderRef.current.start();
              setIsRecording(true);
              toast({ title: "Gravando áudio..." });
          } catch (err: any) {
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

      // --- Effects (Keep as before) ---
      useEffect(() => {
          if (chatAreaRef.current) {
              chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
          }
      }, [chatMessages]);
      useEffect(() => {
          if (isActiveTab && paciente?.id && apiConfig?.apiInstance && patientJidForHistory) {
              fetchChatHistoryHandler(true);
          } else {
              setChatMessages([]);
              setHistoryError(null);
              setIsLoadingHistory(false);
          }
      }, [isActiveTab, paciente?.id, apiConfig?.apiInstance, patientJidForHistory, fetchChatHistoryHandler]);

      // --- Event Handlers for Input Area ---
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
              sendFileHandler(file, type);
          }
      };
      // --- End Event Handlers ---

      return (
        <div className="flex flex-col h-full">
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

          {/* Message Area */}
          <div className="flex-1 flex flex-col min-h-0"> {/* Ensure flex column and min-h-0 */}
            <ScrollArea className="flex-1 px-4 py-2 bg-muted/20 rounded-md min-h-0 overflow-y-auto" ref={chatAreaRef}> {/* flex-1 here */}
              <div className="space-y-4"> {/* Removed flex-grow */}
                {isLoadingHistory && ( <div className="text-center text-muted-foreground py-10"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Carregando histórico...</div> )}
                {historyError && !isLoadingHistory && ( <div className="text-center text-destructive py-10 px-2 break-words">Erro ao carregar histórico: {historyError}</div> )}
                {!isLoadingHistory && !historyError && chatMessages.length === 0 && ( <div className="text-center text-muted-foreground py-10">Nenhuma mensagem encontrada.</div> )}
                {!isLoadingHistory && !historyError && chatMessages.map((msg) => (
                  <MessageBubble key={msg.key.id + msg.messageTimestamp} msg={msg} />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Input Area */}
          <ChatInputArea
            message={message}
            setMessage={setMessage}
            isSending={isSending}
            isSendingMedia={isSendingMedia}
            isRecording={isRecording}
            patientJidForSending={patientJidForSending}
            handleSendMessage={handleSendMessage}
            handleStartRecording={handleStartRecording}
            handleStopRecording={handleStopRecording}
            handleAttachmentClick={handleAttachmentClick}
          />
        </div>
      );
    };
