import React from 'react';
    import { Button } from "@/components/ui/button";
    import { Plus } from "lucide-react";
    import { PacienteDataExtended } from '@/components/pacientes/paciente-detail-modal'; // Assuming type is exported from modal
    import { ProcedimentoItem } from './ProcedimentoItem';
    import { safeFormatDate } from './utils'; // Assuming safeFormatDate is moved to utils
    import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea

    interface ProcedimentosTabProps {
      paciente: PacienteDataExtended;
      handleProcedureInputChange: (procIndex: number, field: string, value: any) => void;
      handleStatusChange: (procedimentoId: string, status: "ganho" | "perdido") => void;
      addProcedimento: () => void;
    }

    export const ProcedimentosTab: React.FC<ProcedimentosTabProps> = ({
      paciente,
      handleProcedureInputChange,
      handleStatusChange,
      addProcedimento,
    }) => {
      const procedimentos = paciente.procedimentos || [];

      return (
        <>
          <div className="flex justify-between items-center sticky top-0 bg-background py-2 z-10 border-b mb-4">
            <h3 className="text-lg font-medium">Procedimentos</h3>
            <Button onClick={addProcedimento} size="sm"><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
          </div>
          {procedimentos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum procedimento cadastrado.</div>
          ) : (
            // Wrap the list in ScrollArea
            <ScrollArea className="h-[calc(100%-8rem)] pr-4"> {/* Adjust height as needed */}
              <div className="space-y-6 pb-4">
                {procedimentos.map((procedimento, index) => {
                  const formattedProcDate = safeFormatDate(procedimento.data, "yyyy-MM-dd");
                  return (
                    <ProcedimentoItem
                      key={procedimento.id}
                      procedimento={procedimento}
                      index={index}
                      handleProcedureInputChange={handleProcedureInputChange}
                      handleStatusChange={handleStatusChange}
                      formattedProcDate={formattedProcDate}
                    />
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </>
      );
    };
