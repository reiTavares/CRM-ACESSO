import React from 'react';
  import { cn } from "@/lib/utils";

  interface QRCodeProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string | null; // Base64 encoded QR code string or null
    size?: number;
    isLoading?: boolean;
    error?: string | null;
  }

  export const QRCodeDisplay: React.FC<QRCodeProps> = ({
    value,
    size = 256,
    isLoading = false,
    error = null,
    className,
    ...props
  }) => {
    const containerSize = size + 32; // Add padding

    return (
      <div
        className={cn(
          "relative flex items-center justify-center border rounded-md bg-background p-4",
          className
        )}
        style={{ width: containerSize, height: containerSize }}
        {...props}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2">Carregando QR Code...</span>
          </div>
        )}
        {error && !isLoading && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 z-10 text-center p-2">
             <p className="text-destructive text-sm font-medium">Erro ao carregar QR Code:</p>
             <p className="text-destructive/80 text-xs mt-1">{error}</p>
           </div>
        )}
        {!isLoading && !error && value && (
          <img
            // Ensure the base64 string is correctly formatted for the src attribute
            src={value.startsWith('data:image') ? value : `data:image/png;base64,${value}`}
            alt="QR Code para conectar WhatsApp"
            width={size}
            height={size}
            className="object-contain"
          />
        )}
         {!isLoading && !error && !value && (
           <div className="text-center text-muted-foreground">
             <p>QR Code aparecerá aqui.</p>
             <p className="text-xs mt-1">Clique em "Verificar Status / QR Code".</p>
           </div>
         )}
      </div>
    );
  };
