import React from 'react';
      import { useDroppable } from '@dnd-kit/core';
      import { cn } from '@/lib/utils';
      import { PacienteCard, PacienteDataExtended } from './paciente-card'; // Usar tipo estendido
      import { ScrollArea } from '@/components/ui/scroll-area';
      import { ApiConfig } from '@/contexts/ApiConfigContext';

      interface PipelineColumnProps {
        id: string;
        label: string;
        pacientes: PacienteDataExtended[]; // Usar tipo estendido
        apiConfig: ApiConfig | null;
        totalConsulta: number;
        totalExame: number;
        totalCirurgia: number;
        showTotals: boolean;
        onOpenPacienteModal: (paciente: PacienteDataExtended) => void;
        // Adicionar searchTerm como prop opcional
        searchTerm?: string;
      }

      export function PipelineColumn({
        id,
        label,
        pacientes,
        apiConfig,
        totalConsulta,
        totalExame,
        totalCirurgia,
        showTotals,
        onOpenPacienteModal,
        searchTerm, // Receber searchTerm
      }: PipelineColumnProps) {
        const { setNodeRef, isOver } = useDroppable({
          id: id,
        });

        // Verifica se há um termo de busca ativo
        const isFiltering = !!searchTerm?.trim();

        return (
          <div
            ref={setNodeRef}
            className={cn(
              "pipeline-column flex-shrink-0 w-[300px] transition-colors duration-200",
              isOver ? 'bg-primary/10' : 'bg-muted/30'
            )}
          >
            {/* Header da Coluna */}
            <div className="font-medium text-sm mb-3 px-2 sticky top-0 bg-muted/80 backdrop-blur-sm z-10 pt-2 pb-2 border-b">
              {label}
              <span className="text-xs text-muted-foreground ml-2">
                ({pacientes.length}) {/* Mostra contagem dos filtrados */}
              </span>
              {showTotals && (
                <div className="text-xs mt-1 space-y-0.5">
                  {totalConsulta > 0 && ( <div className="flex justify-between items-center text-blue-600"> <span>Consultas:</span> <span>R$ {totalConsulta.toLocaleString('pt-BR')}</span> </div> )}
                   {totalExame > 0 && ( <div className="flex justify-between items-center text-purple-600"> <span>Exames:</span> <span>R$ {totalExame.toLocaleString('pt-BR')}</span> </div> )}
                   {totalCirurgia > 0 && ( <div className="flex justify-between items-center text-green-600"> <span>Cirurgias:</span> <span>R$ {totalCirurgia.toLocaleString('pt-BR')}</span> </div> )}
                </div>
              )}
            </div>

            {/* Conteúdo da Coluna (Scroll) */}
            <ScrollArea className="h-[calc(100%-5rem)] px-2">
              <div className="space-y-3 pt-1 pb-4">
                {pacientes.length > 0 ? (
                  pacientes.map((paciente) => (
                    <PacienteCard
                      key={paciente.id}
                      paciente={paciente}
                      apiConfig={apiConfig}
                      onOpenModal={() => onOpenPacienteModal(paciente)}
                    />
                  ))
                ) : (
                  // Usar a prop searchTerm para a mensagem
                  <p className="text-center text-sm text-muted-foreground p-4">
                    Nenhum paciente nesta etapa{isFiltering ? ' (com filtro ativo)' : ''}.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        );
      }
