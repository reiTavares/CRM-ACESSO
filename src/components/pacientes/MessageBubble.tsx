import React from 'react';
    import { cn } from "@/lib/utils";
    import { Check } from "lucide-react";
    import { safeFormatDate } from './modal-tabs/utils'; // Assuming safeFormatDate is moved to utils

    // Assuming WhatsappMessage type is defined/imported correctly
    import { WhatsappMessage } from './whatsapp-chat'; // Adjust path if needed

    interface MessageBubbleProps {
      msg: WhatsappMessage;
    }

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
        if (msg.message?.imageMessage) { return <p className="text-sm italic text-gray-400">[Imagem]{msg.message.imageMessage.caption ? `: ${msg.message.imageMessage.caption}` : ''}</p>; }
        if (msg.message?.videoMessage) { return <p className="text-sm italic text-gray-400">[Vídeo]{msg.message.videoMessage.caption ? `: ${msg.message.videoMessage.caption}` : ''}</p>; }
        if (msg.message?.audioMessage) { return <p className="text-sm italic text-gray-400">[Áudio]{msg.message.audioMessage.ptt ? ' (PTT)' : ''}</p>; }
        if (msg.message?.documentMessage) { return <p className="text-sm italic text-gray-400">[Documento: {msg.message.documentMessage.title || 'arquivo'}]</p>; }
        console.log("[WhatsappChat] Unsupported message type:", msg.message ? Object.keys(msg.message) : 'No message content');
        return <p className="text-sm italic text-gray-500">[Tipo de mensagem não suportado]</p>;
    };

    const renderMessageTicks = (msg: WhatsappMessage) => {
        if (!msg.key.fromMe || msg.ack === undefined || msg.ack < 1) return null;
        const tickColor = msg.ack === 3 ? "text-blue-400" : "text-primary-foreground/80";
        return ( <> <Check className={cn("h-3.5 w-3.5", tickColor, msg.ack < 2 ? "opacity-60" : "")} /> {msg.ack >= 2 && ( <Check className={cn("h-3.5 w-3.5 -ml-2.5", tickColor)} /> )} </> );
    };

    export const MessageBubble: React.FC<MessageBubbleProps> = ({ msg }) => {
      return (
        <div key={msg.key.id + msg.messageTimestamp} className={cn("flex", msg.key.fromMe ? "justify-end" : "justify-start")}>
          <div className={cn( "rounded-lg py-2 px-3 max-w-[75%] shadow-sm text-left", msg.key.fromMe ? "bg-primary/90 text-primary-foreground" : "bg-background border" )}>
            {renderMessageContent(msg)}
            <div className={cn("text-xs mt-1 flex items-center gap-1", msg.key.fromMe ? "text-primary-foreground/80 justify-end" : "text-muted-foreground justify-end")}>
              <span>{safeFormatDate(msg.messageTimestamp, "HH:mm")}</span>
              {renderMessageTicks(msg)}
            </div>
          </div>
        </div>
      );
    };
