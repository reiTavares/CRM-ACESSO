import React from 'react';
    import { Button } from "@/components/ui/button";
    import { Input } from "@/components/ui/input";
    import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
    import {
      Paperclip, Mic, SendHorizonal, Image as ImageIcon, Video, File as FileIcon,
      Loader2, Headset, StopCircle
    } from "lucide-react";

    interface ChatInputAreaProps {
      message: string;
      setMessage: (value: string) => void;
      isSending: boolean;
      isSendingMedia: boolean;
      isRecording: boolean;
      patientJidForSending: string | null;
      handleSendMessage: () => void;
      handleStartRecording: () => void;
      handleStopRecording: () => void;
      handleAttachmentClick: (type: 'image' | 'video' | 'audio' | 'document') => void;
    }

    export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
      message,
      setMessage,
      isSending,
      isSendingMedia,
      isRecording,
      patientJidForSending,
      handleSendMessage,
      handleStartRecording,
      handleStopRecording,
      handleAttachmentClick,
    }) => {
      return (
        <div className="sticky bottom-0 bg-background border-t pt-4 px-1 shrink-0">
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
      );
    };
