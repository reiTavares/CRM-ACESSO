import React from 'react';
    import { Badge } from "@/components/ui/badge";
    import { Button } from "@/components/ui/button";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Textarea } from "@/components/ui/textarea";
    import { Check, X } from "lucide-react";
    import { PacienteDataExtended } from '@/components/pacientes/paciente-detail-modal'; // Assuming type is exported from modal

    type Procedimento = PacienteDataExtended['procedimentos'][0];

    interface ProcedimentoItemProps {
      procedimento: Procedimento;
      index: number;
      handleProcedureInputChange: (procIndex: number, field: string, value: any) => void;
      handleStatusChange: (procedimentoId: string, status: "ganho" | "perdido") => void;
      formattedProcDate: string;
    }

    export const ProcedimentoItem: React.FC<ProcedimentoItemProps> = ({
      procedimento,
      index,
      handleProcedureInputChange,
      handleStatusChange,
      formattedProcDate,
    }) => {
      const isPendente = procedimento.status === 'pendente';

      return (
        <div key={procedimento.id} className="border rounded-lg p-4 relative shadow-sm">
          <div className="absolute top-2 right-2">
            {procedimento.status === "ganho" && (<Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Ganho</Badge>)}
            {procedimento.status === "perdido" && (<Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Perdido</Badge>)}
            {procedimento.status === "pendente" && (<Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente</Badge>)}
          </div>
          <div className="flex justify-between items-start mb-3 mr-20">
            <h4 className="font-medium">{procedimento.tipo}</h4>
            {isPendente && (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200" onClick={() => handleStatusChange(procedimento.id, "ganho")}> <Check className="h-4 w-4 mr-1" /> Ganho </Button>
                <Button variant="outline" size="sm" className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200" onClick={() => handleStatusChange(procedimento.id, "perdido")}> <X className="h-4 w-4 mr-1" /> Perdido </Button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="space-y-1"><Label htmlFor={`procedimento-${index}`}>Procedimento Específico</Label><Input id={`procedimento-${index}`} value={procedimento.procedimento || ''} onChange={(e) => handleProcedureInputChange(index, 'procedimento', e.target.value)} disabled={!isPendente}/></div>
              <div className="space-y-1"><Label htmlFor={`hospital-proc-${index}`}>Hospital</Label><Input id={`hospital-proc-${index}`} value={procedimento.hospital || ''} readOnly className="bg-muted/50"/></div>
              <div className="space-y-1"><Label htmlFor={`medico-${index}`}>Médico</Label><Input id={`medico-${index}`} value={procedimento.medico || ''} onChange={(e) => handleProcedureInputChange(index, 'medico', e.target.value)} disabled={!isPendente}/></div>
              <div className="space-y-1"><Label htmlFor={`tipo-${index}`}>Tipo (Automático)</Label><Input id={`tipo-${index}`} value={procedimento.tipo || ''} readOnly className="bg-muted/50"/></div>
            </div>
            <div className="space-y-3">
              <div className="space-y-1"><Label htmlFor={`valor-${index}`}>Valor</Label><Input id={`valor-${index}`} type="number" value={procedimento.valor || 0} onChange={(e) => handleProcedureInputChange(index, 'valor', e.target.value)} disabled={!isPendente}/></div>
              <div className="space-y-1"><Label htmlFor={`data-${index}`}>Data de realização</Label><Input id={`data-${index}`} type="date" value={formattedProcDate} onChange={(e) => handleProcedureInputChange(index, 'data', e.target.value)} disabled={!isPendente}/></div>
              <div className="space-y-1"><Label htmlFor={`convenio-${index}`}>Convênio</Label><Input id={`convenio-${index}`} value={procedimento.convenio || ''} onChange={(e) => handleProcedureInputChange(index, 'convenio', e.target.value)} disabled={!isPendente}/></div>
              <div className="space-y-1"><Label htmlFor={`observacao-${index}`}>Observação</Label><Textarea id={`observacao-${index}`} value={procedimento.observacao || ''} onChange={(e) => handleProcedureInputChange(index, 'observacao', e.target.value)} className="h-[72px]" disabled={!isPendente}/></div>
            </div>
          </div>
        </div>
      );
    };
