import React, { useState, useEffect, useRef, useCallback } from "react";
    import { Button } from "@/components/ui/button";
    import { ScrollArea } from "@/components/ui/scroll-area";
    import { useToast } from "@/hooks/use-toast";
    import { cn } from "@/lib/utils";
    import { ApiConfig, useApiConfig } from "@/contexts/ApiConfigContext";
    import { PacienteData } from "@/components/pacientes/paciente-card";
    import { Loader2, RefreshCw, AlertCircle } from "lucide-react"; // Adicionado AlertCircle
    import {
        fetchChatHistory,
        sendMessage,
        sendMedia,
        sendDocument,
        EvolutionApiError // Importar erro customizado
    } from "@/lib/evolution-api";
    import { MessageBubble } from './MessageBubble';
    import { ChatInputArea } from './ChatInputArea';

    // Interface para WhatsApp Message (mantida como antes)
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
      const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
      const [historyError, setHistoryError] = useState<string | null>(null);
      const { toast } = useToast();
      const { apiConfig } = useApiConfig(); // Usar contexto para config da API

      const chatAreaRef = useRef<HTMLDivElement>(null);
      const imageInputRef = useRef<HTMLInputElement>(null);
      const videoInputRef = useRef<HTMLInputElement>(null);
      const audioInputRef = useRef<HTMLInputElement>(null);
      const documentInputRef = useRef<HTMLInputElement>(null);
      const mediaRecorderRef = useRef<MediaRecorder | null>(null);
      const audioChunksRef = useRef<Blob[]>([]);

      // --- Validação da Configuração da API ---
      const isApiConfigValid = useCallback(() => {
          return !!apiConfig?.apiUrl?.trim() && !!apiConfig?.apiKey?.trim() && !!apiConfig?.apiInstance?.trim();
      }, [apiConfig]);

      // --- Funções de Formatação JID (mantidas) ---
      const formatPhoneNumberToJid = (phone: string | undefined): string | null => {
          if (!phone) return null;
          let cleaned = phone.replace(/\D/g, '');
          if (cleaned.length < 10 || cleaned.length > 13) return null; // Ajuste para incluir números de 10 a 13 dígitos
          // Adiciona 55 se não começar com ele (para números brasileiros)
          if (!cleaned.startsWith('55') && (cleaned.length === 10 || cleaned.length === 11)) {
              cleaned = '55' + cleaned;
          }
          // Verifica se tem o formato 55 + DDD (2) + 9 (opcional) + Número (8)
          if (cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
             // Remove o 9º dígito se tiver 13 caracteres (55 + DDD + 9 + 8 dígitos)
             // A API pode ou não precisar disso, depende da implementação dela.
             // Esta lógica assume que a API *não* quer o 9º dígito para envio/histórico.
             // if (cleaned.length === 13 && cleaned[4] === '9') {
             //    cleaned = cleaned.substring(0, 4) + cleaned.substring(5);
             // }
             return `${cleaned}@s.whatsapp.net`;
          }
          console.warn(`[WhatsappChat] Telefone inválido para JID: ${phone}`);
          return null; // Retorna null se não corresponder ao formato esperado
      };

      // Função para formatar JID para busca de histórico (remove 9º dígito se existir)
      // Esta função pode ser desnecessária se a API aceitar o JID completo.
      const formatJidForHistory = (jid: string | null): string | null => {
          if (!jid) return null;
          // Exemplo: 5561981115413@s.whatsapp.net -> 556181115413@s.whatsapp.net
          const match = jid.match(/^55(\d{2})(9)(\d{8})@s\.whatsapp\.net$/);
          if (match) {
              console.log(`[WhatsappChat] Formatando JID para histórico (removendo 9): ${jid}`);
              return `55${match[1]}${match[3]}@s.whatsapp.net`;
          }
          return jid; // Retorna o JID original se não tiver 9º dígito
      };

      const patientJidForSending = paciente ? formatPhoneNumberToJid(paciente.telefone) : null;
      // Usar JID formatado (sem 9) para histórico, se necessário pela API
      // const patientJidForHistory = formatJidForHistory(patientJidForSending);
      // Ou usar o mesmo JID para ambos se a API lidar com isso:
      const patientJidForHistory = patientJidForSending;


      // --- Callbacks da API com Tratamento de Erro Melhorado ---
      const fetchChatHistoryHandler = useCallback(async (showLoadingToast = false) => {
          if (!patientJidForHistory) {
              setHistoryError("Número de telefone do paciente inválido ou ausente.");
              setChatMessages([]); // Limpa mensagens se JID for inválido
              return;
          }
          if (!isApiConfigValid()) {
              setHistoryError("Configuração da API inválida. Verifique as configurações.");
              setChatMessages([]);
              return;
          }

          setIsLoadingHistory(true);
          setHistoryError(null); // Limpa erro anterior
          if (showLoadingToast) toast({ title: "Buscando histórico..." });

          try {
              console.log(`[WhatsappChat] Fetching history for JID: ${patientJidForHistory}`);
              const messages = await fetchChatHistory(apiConfig, patientJidForHistory);
              setChatMessages(messages);
              if (messages.length === 0 && showLoadingToast) {
                  toast({ title: "Histórico Vazio", description: "Nenhuma mensagem encontrada para este contato." });
              } else if (showLoadingToast) {
                  toast({ title: "Histórico Carregado" });
              }
          } catch (error: any) {
              console.error("[WhatsappChat] Error fetching chat history:", error);
              const errorMessage = error instanceof EvolutionApiError ? error.message : "Não foi possível buscar o histórico.";
              setHistoryError(errorMessage); // Define a mensagem de erro para exibição
              setChatMessages([]); // Limpa mensagens em caso de erro
              toast({ variant: "destructive", title: "Erro ao Buscar Histórico", description: errorMessage });
          } finally {
              setIsLoadingHistory(false);
          }
      }, [patientJidForHistory, apiConfig, toast, isApiConfigValid]); // Adicionado isApiConfigValid

      const handleSendMessage = async () => {
          if (!message.trim() || isSending || !patientJidForSending || isRecording) return;
          if (!isApiConfigValid()) {
              toast({ variant: "destructive", title: "Configuração Inválida", description: "Verifique as configurações da API antes de enviar." });
              return;
          }

          setIsSending(true);
          toast({ title: "Enviando Mensagem..." });

          try {
              console.log(`[WhatsappChat] Sending message to JID: ${patientJidForSending}`);
              await sendMessage(apiConfig, patientJidForSending, message);
              toast({ title: "Mensagem Enviada!" });
              setMessage("");
              // Atualiza o histórico após um pequeno delay para a mensagem ser processada pela API
              setTimeout(() => fetchChatHistoryHandler(false), 1500); // Atualiza sem toast de loading
          } catch (error: any) {
              console.error("[WhatsappChat] Error sending message:", error);
              const errorMessage = error instanceof EvolutionApiError ? error.message : "Não foi possível enviar a mensagem.";
              toast({ variant: "destructive", title: "Erro ao Enviar", description: errorMessage });
          } finally {
              setIsSending(false);
          }
      };

      const sendFileHandler = async (file: File, type: 'image' | 'video' | 'audio' | 'document') => {
          if (!patientJidForSending || isSendingMedia || isRecording) return;
           if (!isApiConfigValid()) {
               toast({ variant: "destructive", title: "Configuração Inválida", description: "Verifique as configurações da API antes de enviar." });
               return;
           }

          setIsSendingMedia(true);
          const typeName = type.charAt(0).toUpperCase() + type.slice(1);
          toast({ title: `Enviando ${typeName}...` });

          try {
              console.log(`[WhatsappChat] Sending ${type} to JID: ${patientJidForSending}`);
              if (type === 'image' || type === 'video' || type === 'audio') {
                  await sendMedia(apiConfig, patientJidForSending, file);
              } else {
                  await sendDocument(apiConfig, patientJidForSending, file);
              }
              toast({ title: `${typeName} Enviado!` });
              setTimeout(() => fetchChatHistoryHandler(false), 1500); // Atualiza sem toast de loading
          } catch (error: any) {
              console.error(`[WhatsappChat] Error sending ${type}:`, error);
              const errorMessage = error instanceof EvolutionApiError ? error.message : `Não foi possível enviar o ${type}.`;
              toast({ variant: "destructive", title: `Erro ao Enviar ${typeName}`, description: errorMessage });
          } finally {
              setIsSendingMedia(false);
              // Limpa o valor do input correspondente
              if (type === 'image' && imageInputRef.current) imageInputRef.current.value = "";
              if (type === 'video' && videoInputRef.current) videoInputRef.current.value = "";
              if (type === 'audio' && audioInputRef.current) audioInputRef.current.value = "";
              if (type === 'document' && documentInputRef.current) documentInputRef.current.value = "";
          }
      };

      const handleStartRecording = async () => {
          if (isRecording || !patientJidForSending) return;
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
              toast({ variant: "destructive", title: "Erro de Gravação", description: "Seu navegador não suporta gravação de áudio." });
              return;
          }
          if (!isApiConfigValid()) {
               toast({ variant: "destructive", title: "Configuração Inválida", description: "Verifique as configurações da API." });
               return;
           }

          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const mimeType = MediaRecorder.isTypeSupported('audio/ogg; codecs=opus') ? 'audio/ogg; codecs=opus' : 'audio/webm';
              mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
              audioChunksRef.current = [];

              mediaRecorderRef.current.ondataavailable = (event) => {
                  if (event.data.size > 0) audioChunksRef.current.push(event.data);
              };

              mediaRecorderRef.current.onstop = () => {
                  const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                  const fileExtension = mimeType.includes('ogg') ? 'ogg' : 'webm';
                  const audioFile = new File([audioBlob], `audio_gravado_${Date.now()}.${fileExtension}`, { type: mimeType });
                  sendFileHandler(audioFile, 'audio'); // Chama o handler unificado
                  stream.getTracks().forEach(track => track.stop()); // Para a stream
                  setIsRecording(false); // Reseta estado de gravação
              };

              mediaRecorderRef.current.onerror = (event: Event) => {
                  console.error("[WhatsappChat] MediaRecorder error:", event);
                  toast({ variant: "destructive", title: "Erro de Gravação", description: "Ocorreu um erro durante a gravação." });
                  stream.getTracks().forEach(track => track.stop());
                  setIsRecording(false);
              };

              mediaRecorderRef.current.start();
              setIsRecording(true);
              toast({ title: "Gravando áudio..." });
          } catch (err: any) {
              console.error("[WhatsappChat] Error starting recording:", err);
              let description = "Não foi possível iniciar a gravação.";
              if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                  description = "Permissão para usar o microfone negada.";
              } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                  description = "Nenhum microfone encontrado.";
              } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                   description = "Não foi possível ler o microfone. Está sendo usado por outro app?";
              }
              toast({ variant: "destructive", title: "Erro de Microfone", description });
              setIsRecording(false); // Garante que o estado seja resetado
          }
      };

      const handleStopRecording = () => {
          if (mediaRecorderRef.current && isRecording) {
              mediaRecorderRef.current.stop();
              // O onstop handler cuidará do envio e reset do estado
          }
      };

      // --- Efeitos ---
      // Scroll para o fim ao receber novas mensagens
      useEffect(() => {
          if (chatAreaRef.current) {
              chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
          }
      }, [chatMessages]);

      // Busca histórico quando a aba/paciente/config muda
      useEffect(() => {
          if (isActiveTab && paciente?.id && isApiConfigValid()) {
              console.log(`[WhatsappChat] Tab ativa, paciente ${paciente.id}, config válida. Buscando histórico.`);
              fetchChatHistoryHandler(true); // Busca com toast de loading
          } else {
              console.log(`[WhatsappChat] Limpando chat. Tab ativa: ${isActiveTab}, Paciente ID: ${paciente?.id}, Config Válida: ${isApiConfigValid()}`);
              setChatMessages([]);
              setHistoryError(null);
              setIsLoadingHistory(false);
              // Se a config for inválida e a tab estiver ativa, mostra o erro
              if (isActiveTab && !isApiConfigValid()) {
                  setHistoryError("Configuração da API inválida. Verifique as configurações.");
              } else if (isActiveTab && !paciente?.telefone) {
                   setHistoryError("Paciente sem número de telefone válido.");
              }
          }
      // Adicionado isApiConfigValid como dependência
      }, [isActiveTab, paciente?.id, paciente?.telefone, apiConfig, fetchChatHistoryHandler, isApiConfigValid]);

      // --- Handlers para Input Area ---
      const handleAttachmentClick = (type: 'image' | 'video' | 'audio' | 'document') => {
          if (isRecording || isSendingMedia || !patientJidForSending) return;
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
           // Limpa o input para permitir selecionar o mesmo arquivo novamente
           event.target.value = '';
      };
      // --- Fim Handlers Input Area ---

      // --- Renderização ---
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
              <Button variant="ghost" size="icon" onClick={() => fetchChatHistoryHandler(true)} disabled={isLoadingHistory || !patientJidForHistory || !isApiConfigValid()} title="Atualizar Histórico">
                  <RefreshCw className={cn("h-4 w-4", isLoadingHistory && "animate-spin")} />
              </Button>
          </div>

          {/* Message Area */}
          <div className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 px-4 py-2 bg-muted/20 rounded-md min-h-0 overflow-y-auto" ref={chatAreaRef}>
              <div className="space-y-4">
                {isLoadingHistory && ( <div className="text-center text-muted-foreground py-10 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando histórico...</div> )}
                {/* Exibe erro de histórico de forma mais proeminente */}
                {historyError && !isLoadingHistory && (
                    <div className="text-center text-destructive py-10 px-2 break-words flex flex-col items-center justify-center">
                        <AlertCircle className="h-6 w-6 mb-2" />
                        <span className="font-medium">Erro ao carregar histórico:</span>
                        <span>{historyError}</span>
                    </div>
                )}
                {!isLoadingHistory && !historyError && chatMessages.length === 0 && ( <div className="text-center text-muted-foreground py-10">Nenhuma mensagem encontrada.</div> )}
                {!isLoadingHistory && !historyError && chatMessages.map((msg) => (
                  // Usar timestamp + id como chave para maior unicidade
                  <MessageBubble key={`${msg.messageTimestamp}-${msg.key.id}`} msg={msg} />
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
            // Desabilita input se JID for inválido ou config for inválida
            patientJidForSending={isApiConfigValid() ? patientJidForSending : null}
            handleSendMessage={handleSendMessage}
            handleStartRecording={handleStartRecording}
            handleStopRecording={handleStopRecording}
            handleAttachmentClick={handleAttachmentClick}
          />
        </div>
      );
    };
