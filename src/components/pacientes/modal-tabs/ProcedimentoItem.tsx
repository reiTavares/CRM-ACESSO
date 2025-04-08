import React, { useMemo } from 'react';
    import { Badge } from "@/components/ui/badge";
    import { Button } from "@/components/ui/button";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Textarea } from "@/components/ui/textarea";
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
    import { Check, X, CalendarCheck, CalendarX } from "lucide-react"; // Adicionar ícones
    import { PacienteDataExtended } from '@/components/pacientes/paciente-detail-modal';
    import { ProcedimentoConfig } from '@/components/configuracoes/ProcedimentosSettings';
    import { cn } from '@/lib/utils';

    type Procedimento = PacienteDataExtended['procedimentos'][0];

    interface ProcedimentoItemProps {
      procedimento: Procedimento;
      index: number;
      handleProcedureInputChange: (procIndex: number, field: string, value: any) => void;
      handleStatusChange: (procedimentoId: string, status: "ganho" | "perdido") => void;
      // Adicionar nova prop
      handleAgendarReagendar: (procedimentoId: string) => void;
      formattedProcDate: string;
      configuredProcedures: ProcedimentoConfig[];
    }

    export const ProcedimentoItem: React.FC<ProcedimentoItemProps> = ({
      procedimento,
      index,
      handleProcedureInputChange,
      handleStatusChange,
      handleAgendarReagendar, // Receber o novo handler
      formattedProcDate,
      configuredProcedures,
    }) => {
      // Determina se os campos devem ser editáveis
      const isEditable = procedimento.status === 'pendente' || procedimento.status === 'Agendado'; // Permite editar se pendente ou agendado

      // Filtrar procedimentos configurados (mantido)
      const filteredProcedures = useMemo(() => { if (!procedimento.hospital) return []; return configuredProcedures.filter(p => p.hospitalVinculado === procedimento.hospital); }, [procedimento.hospital, configuredProcedures]);

      // Handler para mudança no Select (mantido)
      const handleProcedureSelectChange = (selectedValue: string) => { handleProcedureInputChange(index, 'procedimento', selectedValue); const selectedConfig = configuredProcedures.find(p => p.descricao === selectedValue && p.hospitalVinculado === procedimento.hospital); if (selectedConfig) { handleProcedureInputChange(index, 'valor', selectedConfig.preco); let tipoInferido = 'Outro'; if (selectedValue.toLowerCase().includes('consulta')) tipoInferido = 'Consulta'; else if (selectedValue.toLowerCase().includes('exame')) tipoInferido = 'Exame'; else if (selectedValue.toLowerCase().includes('cirurgia')) tipoInferido = 'Cirurgia'; handleProcedureInputChange(index, 'tipo', tipoInferido); } else { handleProcedureInputChange(index, 'tipo', 'Outro'); } };

      return (
        <div key={procedimento.id || `proc-item-${index}`} className="border rounded-lg p-4 relative shadow-sm">
          {/* Badge de Status Atualizado */}
          <div className="absolute top-2 right-2 z-10">
            {procedimento.status === "ganho" && (<Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Ganho</Badge>)}
            {procedimento.status === "perdido" && (<Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Perdido</Badge>)}
            {procedimento.status === "pendente" && (<Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente</Badge>)}
            {/* Novo status Agendado */}
            {procedimento.status === "Agendado" && (<Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Agendado</Badge>)}
          </div>

          {/* Título e Botões de Ação */}
          <div className="flex justify-between items-start mb-3 mr-20">
            <h4 className="font-medium">{procedimento.tipo || "Procedimento"}</h4>
            {/* Botões Condicionais */}
            <div className="flex space-x-2">
                {/* Botão Agendar / Reagendar */}
                {(procedimento.status === 'pendente' || procedimento.status === 'Agendado') && (
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "border-blue-200",
                            procedimento.status === 'pendente' ? "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800" : "bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                        )}
                        onClick={() => handleAgendarReagendar(procedimento.id)}
                    >
                        {procedimento.status === 'pendente' ? <CalendarCheck className="h-4 w-4 mr-1" /> : <CalendarX className="h-4 w-4 mr-1" />}
                        {procedimento.status === 'pendente' ? 'Agendar' : 'Reagendar'}
                    </Button>
                )}

                {/* Botões Ganho / Perdido (Aparecem se pendente ou agendado) */}
                {(procedimento.status === 'pendente' || procedimento.status === 'Agendado') && (
                    <>
                        <Button variant="outline" size="sm" className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200" onClick={() => handleStatusChange(procedimento.id, "ganho")}> <Check className="h-4 w-4 mr-1" /> Ganho </Button>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200" onClick={() => handleStatusChange(procedimento.id, "perdido")}> <X className="h-4 w-4 mr-1" /> Perdido </Button>
                    </>
                )}
            </div>
          </div>

          {/* Campos do Procedimento (Atualizar disabled) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Coluna 1 */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor={`procedimento-select-${index}`}>Procedimento Específico</Label>
                <Select value={procedimento.procedimento || ''} onValueChange={handleProcedureSelectChange} disabled={!isEditable || !procedimento.hospital} >
                    <SelectTrigger id={`procedimento-select-${index}`} className={cn(!procedimento.hospital && "text-muted-foreground")}> <SelectValue placeholder={procedimento.hospital ? "Selecione o procedimento" : "Selecione um hospital"} /> </SelectTrigger>
                    <SelectContent> {procedimento.hospital && filteredProcedures.length === 0 && ( <SelectItem value="" disabled>Nenhum procedimento configurado para {procedimento.hospital}.</SelectItem> )} {procedimento.hospital && filteredProcedures.map(confProc => ( <SelectItem key={confProc.id} value={confProc.descricao}> {confProc.descricao} (R$ {confProc.preco.toFixed(2)}) </SelectItem> ))} {procedimento.hospital && procedimento.procedimento && !filteredProcedures.some(fp => fp.descricao === procedimento.procedimento) && ( <SelectItem value={procedimento.procedimento} disabled> {procedimento.procedimento} (Atual) </SelectItem> )} </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"> <Label htmlFor={`hospital-proc-${index}`}>Hospital (Realização)</Label> <Input id={`hospital-proc-${index}`} value={procedimento.hospital || ''} readOnly className="bg-muted/50" placeholder="Hospital do paciente" /> </div>
              <div className="space-y-1"> <Label htmlFor={`medico-${index}`}>Médico (Realização)</Label> <Input id={`medico-${index}`} value={procedimento.medico || ''} onChange={(e) => handleProcedureInputChange(index, 'medico', e.target.value)} disabled={!isEditable} placeholder="Nome do médico" /> </div>
              <div className="space-y-1"> <Label htmlFor={`tipo-${index}`}>Tipo (Automático)</Label> <Input id={`tipo-${index}`} value={procedimento.tipo || ''} readOnly className="bg-muted/50" placeholder="Consulta, Exame, Cirurgia..." /> </div>
            </div>
            {/* Coluna 2 */}
            <div className="space-y-3">
              <div className="space-y-1"> <Label htmlFor={`valor-${index}`}>Valor (R$)</Label> <Input id={`valor-${index}`} type="number" step="0.01" value={procedimento.valor || 0} onChange={(e) => handleProcedureInputChange(index, 'valor', parseFloat(e.target.value) || 0)} disabled={!isEditable} placeholder="0.00" /> </div>
              <div className="space-y-1"> <Label htmlFor={`data-${index}`}>Data de realização</Label> <Input id={`data-${index}`} type="date" value={formattedProcDate} onChange={(e) => handleProcedureInputChange(index, 'data', e.target.value)} disabled={!isEditable} /> </div>
              <div className="space-y-1"> <Label htmlFor={`convenio-${index}`}>Convênio</Label> <Input id={`convenio-${index}`} value={procedimento.convenio || ''} onChange={(e) => handleProcedureInputChange(index, 'convenio', e.target.value)} disabled={!isEditable} placeholder="Nome do convênio" /> </div>
              <div className="space-y-1"> <Label htmlFor={`observacao-${index}`}>Observação</Label> <Textarea id={`observacao-${index}`} value={procedimento.observacao || ''} onChange={(e) => handleProcedureInputChange(index, 'observacao', e.target.value)} className="h-[72px]" disabled={!isEditable} placeholder="Detalhes adicionais..." /> </div>
            </div>
          </div>
        </div>
      );
    };
