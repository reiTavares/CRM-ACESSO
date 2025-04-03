import React from 'react';
    import { PhoneCall, FileText, CalendarClock, Plus, Clock, Building } from "lucide-react";
    import { PacienteDataExtended } from '@/components/pacientes/paciente-detail-modal'; // Assuming type is exported from modal
    import { safeFormatDate } from './utils'; // Assuming safeFormatDate is moved to utils

    type Historico = PacienteDataExtended['historico'][0];

    interface HistoricoItemProps {
      item: Historico;
    }

    const renderIcon = (tipo: string) => {
      switch (tipo) {
        case "Ligação": return <PhoneCall className="h-4 w-4 text-blue-500" />;
        case "Status": return <FileText className="h-4 w-4 text-green-500" />;
        case "Procedimento": return <CalendarClock className="h-4 w-4 text-purple-500" />;
        case "Criação": return <Plus className="h-4 w-4 text-indigo-500" />;
        case "Acompanhamento": return <Clock className="h-4 w-4 text-amber-500" />;
        case "Alteração": return <Building className="h-4 w-4 text-orange-500" />;
        default: return null;
      }
    };

    export const HistoricoItem: React.FC<HistoricoItemProps> = ({ item }) => {
      return (
        <div key={item.id} className="border rounded-lg p-3 shadow-sm">
          <div className="flex items-start">
            <div className="mt-0.5 mr-3">
              {renderIcon(item.tipo)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-sm">{item.tipo}</h4>
                <span className="text-xs text-muted-foreground">{safeFormatDate(item.data, "dd/MM/yyyy HH:mm")}</span>
              </div>
              <p className="text-sm mt-1">{item.descricao}</p>
              <span className="text-xs text-muted-foreground mt-1 block text-right">por: {item.usuario}</span>
            </div>
          </div>
        </div>
      );
    };
