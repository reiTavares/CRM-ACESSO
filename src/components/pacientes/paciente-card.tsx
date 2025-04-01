import { User, Building, User2, CreditCard, Phone, BookText, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { PacienteDetailModal } from "@/components/pacientes/paciente-detail-modal";
import { cn } from "@/lib/utils";
import { ApiConfig } from "@/contexts/ApiConfigContext";
import { useDraggable } from '@dnd-kit/core'; // Import useDraggable
import { CSS } from '@dnd-kit/utilities'; // Import CSS utilities

// Keep the interface definition
export interface PacienteData {
  id: string;
  nome: string;
  hospital: string;
  medico: string;
  valor: number; // This seems like a general value, not procedure specific? Keep for now.
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
  procedimentos: {
    id: string;
    tipo: string; // "Consulta", "Exame", "Cirurgia"
    hospital: string;
    medico: string;
    procedimento: string;
    valor: number; // Value specific to this procedure
    data: Date;
    observacao: string;
    convenio: string;
    status: string; // "pendente", "ganho", "perdido"
  }[];
  historico: any[];
  status: string; // Pipeline stage label
}

interface PacienteCardProps {
  paciente: PacienteData;
  className?: string;
  apiConfig: ApiConfig | null;
}

export function PacienteCard({ paciente, className, apiConfig }: PacienteCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // --- Draggable Setup ---
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging, // State to know if the card is being dragged
  } = useDraggable({
    id: paciente.id, // Unique ID for the draggable item
    data: { // Optional: Pass data associated with the draggable item
      type: 'PacienteCard',
      paciente: paciente,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform), // Apply transform for smooth movement
    opacity: isDragging ? 0.5 : 1, // Make card semi-transparent while dragging
    zIndex: isDragging ? 100 : 'auto', // Ensure dragged card is on top
    touchAction: 'none', // Recommended for better touch interaction
  };
  // --- End Draggable Setup ---

  useEffect(() => {
      // console.log(`[PacienteCard ${paciente.id}] Received apiConfig prop:`, apiConfig);
  }, [apiConfig, paciente.id]);

  const statusClass = {
    "Lead Recebido": "bg-gray-400",
    "Tentativa de Contato": "bg-yellow-400",
    "Contato Realizado": "bg-blue-400",
    "Agendamento de Consulta": "bg-cyan-400",
    "Consulta Realizada": "bg-indigo-400",
    "Agendamento de Exames": "bg-purple-400",
    "Exames Realizados": "bg-pink-400",
    "Agendamento Cirurgia (SMC)": "bg-rose-400",
    "1º Olho - Cirurgia Realizada": "bg-green-500",
    "Agendamento Cirurgia 2º Olho": "bg-lime-400",
    "2º Olho - Cirurgia Realizada": "bg-emerald-500",
    "Resgate": "bg-orange-400",
  };

  // Use procedure value if available, otherwise fallback (or show N/A)
  const displayValue = paciente.procedimentos?.length > 0
    ? paciente.procedimentos[0].valor // Display value of the first procedure for simplicity
    : paciente.valor; // Fallback to the general valor if no procedures

  const procedureToDisplay = paciente.procedimentos?.length > 0
    ? paciente.procedimentos[0].procedimento
    : "N/A";

  const status = paciente.status;
  const currentStatusClass = statusClass[status as keyof typeof statusClass] || 'bg-gray-300';

  // --- Click Handler ---
  // This function now only sets the state to show the modal.
  // The drag listeners handle the drag initiation.
  const handleCardClick = () => {
      // We only open the modal if the card is NOT being dragged.
      // The activationConstraint in the sensor configuration handles the delay.
      // If the user clicks and holds/moves beyond the constraint, isDragging becomes true.
      // If the user just clicks quickly, isDragging remains false, and the modal opens.
      if (!isDragging) {
          setShowDetails(true);
      }
  };
  // --- End Click Handler ---

  return (
    <>
      <Card
        ref={setNodeRef} // Attach ref for dnd-kit
        style={style} // Apply dragging styles
        {...listeners} // Attach drag listeners
        {...attributes} // Attach drag attributes (like draggable=true)
        className={cn(
          "relative overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-grab", // Keep cursor grab
          isDragging ? 'ring-2 ring-primary ring-offset-2' : '', // Add ring when dragging
          className
        )}
        // Use the new click handler
        onClick={handleCardClick}
      >
        {/* Status Indicator */}
        <div
          className={cn("card-status", currentStatusClass)}
          title={status}
        />
        <CardContent className="pt-4 px-4">
          <div className="space-y-3">
            {/* Hospital */}
            <div className="flex items-center text-xs text-muted-foreground">
              <Building className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="font-medium truncate">{paciente.hospital}</span>
            </div>

            {/* Name */}
            <h3 className="font-medium truncate text-primary">{paciente.nome}</h3>

            {/* Doctor */}
            <div className="flex items-center text-xs text-muted-foreground">
              <User2 className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{paciente.medico}</span>
            </div>

            {/* Details Section */}
            <div className="space-y-1 border-t pt-2 mt-2">
              {/* Procedure */}
              <div className="flex items-center text-xs">
                 <Stethoscope className="h-3 w-3 mr-1 flex-shrink-0 text-indigo-500" />
                 <span className="font-medium truncate">{procedureToDisplay}</span>
              </div>
              {/* Value */}
              <div className="flex items-center text-xs">
                <CreditCard className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="font-medium">
                  R$ {typeof displayValue === 'number' ? displayValue.toLocaleString('pt-BR') : 'N/A'}
                </span>
              </div>
              {/* Convenio */}
              <div className="flex items-center text-xs text-muted-foreground">
                <BookText className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{paciente.convenio}</span>
              </div>
              {/* Phone */}
              <div className="flex items-center text-xs text-muted-foreground">
                <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                <span>{paciente.telefone}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal rendering */}
      <PacienteDetailModal
        open={showDetails}
        onOpenChange={setShowDetails}
        paciente={paciente}
        apiConfig={apiConfig}
      />
    </>
  );
}
