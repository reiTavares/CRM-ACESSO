import { User, Building, User2, CreditCard, Phone, BookText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { PacienteDetailModal } from "@/components/pacientes/paciente-detail-modal";
import { cn } from "@/lib/utils";

export interface PacienteData {
  id: string;
  nome: string;
  hospital: string;
  medico: string;
  valor: number;
  produtos: string[];
  convenio: string;
  telefone: string;
  dataNascimento: Date;
  cpf: string;
  telefone2?: string;
  email?: string;
  uf: string;
  cidade: string;
  bairro: string;
  origem: "Publicidade Digital" | "Evento" | "Publicidade Tradicional" | "Indicação";
  marketingData: any;
  procedimentos: any[];
  historico: any[];
  status: string;
}

interface PacienteCardProps {
  paciente: PacienteData;
  className?: string;
}

export function PacienteCard({ paciente, className }: PacienteCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const statusClass = {
    "Novo": "card-status-novo",
    "Contato Realizado": "card-status-contato",
    "Agendado": "card-status-agendado",
    "Atendido": "card-status-atendido",
    "Em Negociação": "card-status-negociacao",
    "Finalizado": "card-status-finalizado",
    "Perdido": "card-status-perdido",
    "Resgate": "card-status-resgate",
  };

  return (
    <>
      <Card 
        className={cn("relative overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer", className)}
        onClick={() => setShowDetails(true)}
      >
        <div className={cn("card-status", statusClass[paciente.status as keyof typeof statusClass])} />
        <CardContent className="pt-4 px-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="font-medium truncate text-primary">{paciente.nome}</h3>
              <div className="flex items-center text-xs text-muted-foreground">
                <Building className="h-3 w-3 mr-1" />
                <span className="truncate">{paciente.hospital}</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <User2 className="h-3 w-3 mr-1" />
                <span className="truncate">{paciente.medico}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center text-xs">
                <CreditCard className="h-3 w-3 mr-1" />
                <span className="font-medium">R$ {paciente.valor.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <BookText className="h-3 w-3 mr-1" />
                <span className="truncate">{paciente.convenio}</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Phone className="h-3 w-3 mr-1" />
                <span>{paciente.telefone}</span>
              </div>
            </div>
            
            {paciente.produtos.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {paciente.produtos.map((produto, i) => (
                  <span 
                    key={i}
                    className="inline-flex text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded"
                  >
                    {produto}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <PacienteDetailModal 
        open={showDetails} 
        onOpenChange={setShowDetails} 
        paciente={paciente} 
      />
    </>
  );
}
