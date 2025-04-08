import React from 'react';
    import { Button } from "@/components/ui/button";
    import { Plus } from "lucide-react";
    import { PacienteDataExtended } from '@/components/pacientes/paciente-detail-modal';
    import { ProcedimentoItem } from './ProcedimentoItem';
    import { safeFormatDate } from './utils';
    import { ScrollArea } from "@/components/ui/scroll-area";
    import { ProcedimentoConfig } from '@/components/configuracoes/ProcedimentosSettings';

    interface ProcedimentosTabProps {
      paciente: PacienteDataExtended;
      handleProcedureInputChange: (procIndex: number, field: string, value: any) => void;
      handleStatusChange: (procedimentoId: string, status: "ganho" | "perdido") => void;
      // Adicionar nova prop
      handleAgendarReagendar: (procedimentoId: string) => void;
      addProcedimento: () => void;
      configuredProcedures: ProcedimentoConfig[];
    }

    export const ProcedimentosTab: React.FC<ProcedimentosTabProps> = ({
      paciente,
      handleProcedureInputChange,
      handleStatusChange,
      handleAgendarReagendar, // Receber o novo handler
      addProcedimento,
      configuredProcedures,
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
            <ScrollArea className="h-[calc(100%-8rem)] pr-4">
              <div className="space-y-6 pb-4">
                {procedimentos.map((procedimento, index) => {
                  const formattedProcDate = safeFormatDate(procedimento.data, "yyyy-MM-dd");
                  return (
                    <ProcedimentoItem
                      key={procedimento.id || `proc-item-${index}`} // Usar index como fallback
                      procedimento={procedimento}
                      index={index}
                      handleProcedureInputChange={handleProcedureInputChange}
                      handleStatusChange={handleStatusChange}
                      handleAgendarReagendar={handleAgendarReagendar} // Passar o novo handler
                      formattedProcDate={formattedProcDate}
                      configuredProcedures={configuredProcedures}
                    />
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </>
      );
    };
