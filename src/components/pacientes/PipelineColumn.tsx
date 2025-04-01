import React from 'react';
      import { useDroppable } from '@dnd-kit/core';
      import { cn } from '@/lib/utils';
      import { PacienteCard, PacienteData } from './paciente-card';
      import { ScrollArea } from '@/components/ui/scroll-area';
      import { ApiConfig } from '@/contexts/ApiConfigContext'; // Import ApiConfig type

      interface PipelineColumnProps {
        id: string; // Stage ID (e.g., 'lead', 'contato')
        label: string; // Stage Label (e.g., 'Lead Recebido')
        pacientes: PacienteData[];
        apiConfig: ApiConfig | null;
        totalConsulta: number;
        totalExame: number;
        totalCirurgia: number;
        showTotals: boolean;
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
      }: PipelineColumnProps) {
        const { setNodeRef, isOver } = useDroppable({
          id: id, // Use the stage ID as the droppable identifier
        });

        return (
          <div
            ref={setNodeRef}
            className={cn(
              "pipeline-column flex-shrink-0 w-[300px] transition-colors duration-200",
              isOver ? 'bg-primary/10' : 'bg-muted/30' // Highlight when dragging over
            )}
          >
            {/* Column Header */}
            <div className="font-medium text-sm mb-3 px-2 sticky top-0 bg-muted/80 backdrop-blur-sm z-10 pt-2 pb-2 border-b">
              {label}
              <span className="text-xs text-muted-foreground ml-2">
                ({pacientes.length})
              </span>
              {/* Display Totals */}
              {showTotals && (
                <div className="text-xs mt-1 space-y-0.5">
                  {totalConsulta > 0 && (
                     <div className="flex justify-between items-center text-blue-600">
                       <span>Consultas:</span>
                       <span>R$ {totalConsulta.toLocaleString('pt-BR')}</span>
                     </div>
                  )}
                   {totalExame > 0 && (
                     <div className="flex justify-between items-center text-purple-600">
                       <span>Exames:</span>
                       <span>R$ {totalExame.toLocaleString('pt-BR')}</span>
                     </div>
                   )}
                   {totalCirurgia > 0 && (
                     <div className="flex justify-between items-center text-green-600">
                       <span>Cirurgias:</span>
                       <span>R$ {totalCirurgia.toLocaleString('pt-BR')}</span>
                     </div>
                   )}
                </div>
              )}
            </div>

            {/* Column Content (Scrollable Area) */}
            <ScrollArea className="h-[calc(100%-5rem)] px-2"> {/* Adjust height based on header */}
              <div className="space-y-3 pt-1 pb-4">
                {pacientes.length > 0 ? (
                  pacientes.map((paciente) => (
                    <PacienteCard
                      key={paciente.id}
                      paciente={paciente}
                      apiConfig={apiConfig}
                    />
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground p-4">
                    Nenhum paciente nesta etapa.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        );
      }
