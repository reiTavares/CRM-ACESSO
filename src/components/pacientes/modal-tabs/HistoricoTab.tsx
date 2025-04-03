import React from 'react';
    import { ScrollArea } from "@/components/ui/scroll-area";
    import { PacienteDataExtended } from '@/components/pacientes/paciente-detail-modal'; // Assuming type is exported from modal
    import { HistoricoItem } from './HistoricoItem';

    interface HistoricoTabProps {
      paciente: PacienteDataExtended;
    }

    export const HistoricoTab: React.FC<HistoricoTabProps> = ({ paciente }) => {
      const historico = paciente.historico || [];

      return (
        <>
          <div className="sticky top-0 bg-background py-2 z-10 border-b mb-4">
            <h3 className="text-lg font-medium">Histórico</h3>
          </div>
          {historico.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum registro de histórico.</div>
          ) : (
            <ScrollArea className="h-[calc(100%-4rem)] pr-4">
              <div className="space-y-3 pb-4">
                {historico.map((item) => (
                  <HistoricoItem key={item.id} item={item} />
                ))}
              </div>
            </ScrollArea>
          )}
        </>
      );
    };
