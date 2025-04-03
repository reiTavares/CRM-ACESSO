import { User, Building, CreditCard, Phone, BookText, Stethoscope, UserCheck, Eye } from "lucide-react"; // Removed User2, Added Eye
    import { Button } from "@/components/ui/button";
    import { Card, CardContent } from "@/components/ui/card";
    import { useState, useEffect } from "react";
    import { PacienteDetailModal } from "@/components/pacientes/paciente-detail-modal";
    import { cn } from "@/lib/utils";
    import { ApiConfig } from "@/contexts/ApiConfigContext";
    import { useDraggable } from '@dnd-kit/core';
    import { CSS } from '@dnd-kit/utilities';

    // Updated Interface to include new fields
    export interface PacienteData {
      id: string;
      nome: string;
      hospital: string;
      medico: string;
      valor: number; // General value (consider if needed)
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
      marketingData: { // Structure for marketing data
        fonte?: string;
        campanha?: string;
        conjunto?: string;
        tipoCriativo?: string;
        tituloCriativo?: string;
        palavraChave?: string;
        quemIndicou?: string;
        dataIndicacao?: Date;
        telefoneIndicacao?: string;
        nomeEvento?: string;
        dataEvento?: Date;
        descricaoEvento?: string;
      };
      gestorResponsavel: string; // New field
      consultorResponsavel: string; // New field
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
      historico: {
        id: string;
        data: Date;
        tipo: string;
        descricao: string;
        usuario: string;
      }[];
      status: string; // Pipeline stage label
    }


    interface PacienteCardProps {
      paciente: PacienteData;
      className?: string;
      apiConfig: ApiConfig | null; // Keep passing this down for now if needed elsewhere, though WhatsappChat uses context
    }

    export function PacienteCard({ paciente, className, apiConfig }: PacienteCardProps) {
      const [showDetails, setShowDetails] = useState(false);

      // --- Draggable Setup ---
      const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
      } = useDraggable({
        id: paciente.id,
        data: { type: 'PacienteCard', paciente: paciente },
      });

      const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 'auto',
        touchAction: 'none',
      };
      // --- End Draggable Setup ---

      // Log API config received (optional debugging)
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
      const handleCardClick = () => {
          if (!isDragging) {
              setShowDetails(true);
          }
      };
      // --- End Click Handler ---

      return (
        <>
          <Card
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
              "relative overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-grab",
              isDragging ? 'ring-2 ring-primary ring-offset-2' : '',
              className
            )}
            onClick={handleCardClick}
          >
            {/* Status Indicator */}
            <div
              className={cn("absolute left-0 top-0 h-full w-1", currentStatusClass)}
              title={status}
            />
            <CardContent className="pt-4 pl-3 pr-4"> {/* Adjusted padding */}
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
                  <Stethoscope className="h-3 w-3 mr-1 flex-shrink-0" /> {/* Changed icon */}
                  <span className="truncate">{paciente.medico}</span>
                </div>

                {/* Consultor Responsável */}
                <div className="flex items-center text-xs text-muted-foreground">
                  <UserCheck className="h-3 w-3 mr-1 flex-shrink-0 text-green-600" />
                  <span className="truncate">{paciente.consultorResponsavel || 'N/A'}</span>
                </div>

                {/* Details Section */}
                <div className="space-y-1 border-t pt-2 mt-2">
                  {/* Procedure */}
                  <div className="flex items-center text-xs">
                     <Eye className="h-3 w-3 mr-1 flex-shrink-0 text-indigo-500" /> {/* Changed icon */}
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
            // apiConfig prop is removed here as the modal itself doesn't need it directly
          />
        </>
      );
    }
