import { User, Building, CreditCard, Phone, BookText, Stethoscope, UserCheck, Eye } from "lucide-react";
    import { Button } from "@/components/ui/button";
    import { Card, CardContent } from "@/components/ui/card";
    // Remover useState e useEffect daqui, o modal será controlado pela página pai
    // import { useState, useEffect } from "react";
    // Remover import do Modal daqui
    // import { PacienteDetailModal } from "@/components/pacientes/paciente-detail-modal";
    import { cn } from "@/lib/utils";
    import { ApiConfig } from "@/contexts/ApiConfigContext";
    import { useDraggable } from '@dnd-kit/core';
    import { CSS } from '@dnd-kit/utilities';

    // Interface Estendida (se ainda não estiver importada/definida)
    export interface PacienteDataExtended extends PacienteData {
        gestorResponsavel?: string;
        consultorResponsavel?: string;
        marketingData?: {
            fonte?: string; campanha?: string; conjunto?: string; tipoCriativo?: string; tituloCriativo?: string; palavraChave?: string; quemIndicou?: string; dataIndicacao?: Date | string | null; telefoneIndicacao?: string; nomeEvento?: string; dataEvento?: Date | string | null; descricaoEvento?: string;
        };
    }

    // Interface PacienteData (se ainda não estiver importada/definida)
    export interface PacienteData {
      id: string; nome: string; hospital: string; medico: string; valor: number; convenio: string; telefone: string; dataNascimento: Date | string | null; cpf: string; telefone2?: string; email?: string; uf: string; cidade: string; bairro: string; origem: "Publicidade Digital" | "Evento" | "Publicidade Tradicional" | "Indicação"; marketingData: any; // Simplificado, usar PacienteDataExtended
      gestorResponsavel: string; consultorResponsavel: string; procedimentos: { id: string; tipo: string; hospital: string; medico: string; procedimento: string; valor: number; data: Date | string | null; observacao: string; convenio: string; status: string; }[]; historico: { id: string; data: Date | string | null; tipo: string; descricao: string; usuario: string; }[]; status: string;
    }


    interface PacienteCardProps {
      paciente: PacienteDataExtended; // Usar tipo estendido
      className?: string;
      apiConfig: ApiConfig | null;
      // Nova prop para sinalizar clique e abrir modal
      onOpenModal: () => void;
    }

    export function PacienteCard({ paciente, className, apiConfig, onOpenModal }: PacienteCardProps) {
      // Remover estado local do modal
      // const [showDetails, setShowDetails] = useState(false);

      // --- Draggable Setup (Mantido) ---
      const { attributes, listeners, setNodeRef, transform, isDragging, } = useDraggable({ id: paciente.id, data: { type: 'PacienteCard', paciente: paciente }, });
      const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 100 : 'auto', touchAction: 'none', };
      // --- Fim Draggable Setup ---

      // Log API config (Mantido, opcional)
      // useEffect(() => { console.log(`[PacienteCard ${paciente.id}] Received apiConfig:`, apiConfig); }, [apiConfig, paciente.id]);

      // Lógica de Status e Valor (Mantida)
      const statusClass = { "Lead Recebido": "bg-gray-400", "Tentativa de Contato": "bg-yellow-400", "Contato Realizado": "bg-blue-400", "Agendamento de Consulta": "bg-cyan-400", "Consulta Realizada": "bg-indigo-400", "Agendamento de Exames": "bg-purple-400", "Exames Realizados": "bg-pink-400", "Agendamento Cirurgia (SMC)": "bg-rose-400", "1º Olho - Cirurgia Realizada": "bg-green-500", "Agendamento Cirurgia 2º Olho": "bg-lime-400", "2º Olho - Cirurgia Realizada": "bg-emerald-500", "Resgate": "bg-orange-400", };
      const displayValue = paciente.procedimentos?.length > 0 ? paciente.procedimentos[0].valor : paciente.valor;
      const procedureToDisplay = paciente.procedimentos?.length > 0 ? paciente.procedimentos[0].procedimento : "N/A";
      const status = paciente.status;
      const currentStatusClass = statusClass[status as keyof typeof statusClass] || 'bg-gray-300';

      // --- Click Handler Atualizado ---
      const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
          // Evita abrir modal se estiver arrastando ou clicando em um botão/link dentro do card (se houver)
          if (isDragging) return;
          // Verifica se o clique foi diretamente no card e não em um elemento interativo filho
          if (event.target === event.currentTarget || !((event.target as HTMLElement).closest('button, a'))) {
             onOpenModal(); // Chama a função passada pela página pai
          }
      };
      // --- Fim Click Handler ---

      return (
        <>
          {/* Card Draggable */}
          <Card
            ref={setNodeRef}
            style={style}
            {...listeners} // Aplicar listeners ao elemento que deve ser arrastado
            {...attributes} // Aplicar atributos ao elemento que deve ser arrastado
            className={cn(
              "relative overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-grab", // Manter cursor-grab
              isDragging ? 'ring-2 ring-primary ring-offset-2' : '',
              className
            )}
            onClick={handleCardClick} // Chama o handler atualizado no clique
            // Adicionar role e aria-describedby pode melhorar acessibilidade
            role="button" // Indica que é clicável
            tabIndex={0} // Torna focável pelo teclado
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenModal(); }} // Abrir com Enter/Espaço
            aria-describedby={`paciente-desc-${paciente.id}`} // Associar com descrição
          >
            {/* Status Indicator */}
            <div className={cn("absolute left-0 top-0 h-full w-1", currentStatusClass)} title={status} />

            {/* Conteúdo do Card */}
            <CardContent className="pt-4 pl-3 pr-4">
              <div className="space-y-3">
                {/* Hospital */}
                <div className="flex items-center text-xs text-muted-foreground"> <Building className="h-3 w-3 mr-1 flex-shrink-0" /> <span className="font-medium truncate">{paciente.hospital}</span> </div>
                {/* Nome */}
                <h3 id={`paciente-desc-${paciente.id}`} className="font-medium truncate text-primary">{paciente.nome}</h3> {/* ID para aria-describedby */}
                {/* Médico */}
                <div className="flex items-center text-xs text-muted-foreground"> <Stethoscope className="h-3 w-3 mr-1 flex-shrink-0" /> <span className="truncate">{paciente.medico}</span> </div>
                {/* Consultor */}
                <div className="flex items-center text-xs text-muted-foreground"> <UserCheck className="h-3 w-3 mr-1 flex-shrink-0 text-green-600" /> <span className="truncate">{paciente.consultorResponsavel || 'N/A'}</span> </div>
                {/* Detalhes */}
                <div className="space-y-1 border-t pt-2 mt-2">
                  {/* Procedimento */}
                  <div className="flex items-center text-xs"> <Eye className="h-3 w-3 mr-1 flex-shrink-0 text-indigo-500" /> <span className="font-medium truncate">{procedureToDisplay}</span> </div>
                  {/* Valor */}
                  <div className="flex items-center text-xs"> <CreditCard className="h-3 w-3 mr-1 flex-shrink-0" /> <span className="font-medium"> R$ {typeof displayValue === 'number' ? displayValue.toLocaleString('pt-BR') : 'N/A'} </span> </div>
                  {/* Convênio */}
                  <div className="flex items-center text-xs text-muted-foreground"> <BookText className="h-3 w-3 mr-1 flex-shrink-0" /> <span className="truncate">{paciente.convenio}</span> </div>
                  {/* Telefone */}
                  <div className="flex items-center text-xs text-muted-foreground"> <Phone className="h-3 w-3 mr-1 flex-shrink-0" /> <span>{paciente.telefone}</span> </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* O Modal NÃO é mais renderizado aqui. Ele é renderizado na página Pacientes.tsx */}
          {/*
          <PacienteDetailModal
            open={showDetails}
            onOpenChange={setShowDetails}
            paciente={paciente}
            onSave={???} // A função onSave viria da página pai
          />
          */}
        </>
      );
    }
