import { useState, useEffect } from "react";
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { Button } from "@/components/ui/button";
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
    import { PhoneCall, Save, MessageCircle, Loader2, X } from "lucide-react";
    import { PacienteData, PacienteDataExtended } from "@/components/pacientes/paciente-card";
    import { useToast } from "@/hooks/use-toast";
    import { cn } from "@/lib/utils";
    import { ContatoTab } from './modal-tabs/ContatoTab';
    import { ProcedimentosTab } from './modal-tabs/ProcedimentosTab';
    import { WhatsappTabWrapper } from './modal-tabs/WhatsappTabWrapper';
    import { HistoricoTab } from './modal-tabs/HistoricoTab';
    import { safeFormatDate } from './modal-tabs/utils';
    import { initialProcedimentos, ProcedimentoConfig } from "@/components/configuracoes/ProcedimentosSettings";

    // --- Mock Data (Mantido) ---
    const hospitalsData: Record<string, string[]> = { "HODF": ["Dr. João Silva", "Dra. Ana Costa", "Dr. Pedro Martins", "Dra. Carla Dias"], "HO Londrina": ["Dr. Carlos Souza", "Dra. Beatriz Lima", "Dr. Ricardo Alves", "Dra. Fernanda Vieira"], "HO Maringa": ["Dra. Mariana Ferreira", "Dr. Gustavo Pereira", "Dra. Sofia Ribeiro", "Dr. André Mendes"], "HOA": ["Dr. Lucas Gomes", "Dra. Julia Almeida", "Dr. Matheus Barbosa", "Dra. Isabela Castro"], "": [] };
    const hospitalNames = Object.keys(hospitalsData).filter(name => name !== "");
    const sampleGestores = ["Ana Gestora", "Carlos Gestor", "Beatriz Gestora"];
    const sampleConsultores = ["Consultor Logado", "Mariana Consultora", "Pedro Consultor"]; // Simula usuário logado
    // --- Fim Mock Data ---

    interface PacienteDetailModalProps {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      paciente: PacienteDataExtended | null;
      onSave: (updatedPaciente: PacienteDataExtended) => Promise<void>;
      configuredProcedures: ProcedimentoConfig[];
    }

    export function PacienteDetailModal({
        open,
        onOpenChange,
        paciente: initialPaciente,
        onSave,
        configuredProcedures,
    }: PacienteDetailModalProps) {
      const [activeTab, setActiveTab] = useState("contato");
      const [paciente, setPaciente] = useState<PacienteDataExtended | null>(null);
      const [isSaving, setIsSaving] = useState(false);
      const { toast } = useToast();

      const availableDoctors = paciente ? (hospitalsData[paciente.hospital] || []) : [];

      // --- Lógica de Defaults (Mantida) ---
      const getInitialPacienteWithDefaults = (p: PacienteDataExtended | null): PacienteDataExtended | null => { /* ...código mantido... */ if (!p) return null; const marketingDataDefaults = { fonte: p.origem === 'Publicidade Digital' ? 'Facebook Ads' : p.origem === 'Publicidade Tradicional' ? 'Revista Local' : undefined, campanha: p.origem === 'Publicidade Digital' ? 'Campanha Catarata Junho' : undefined, conjunto: p.origem === 'Publicidade Digital' ? 'Grupo Interesse 50+' : undefined, tipoCriativo: p.origem === 'Publicidade Digital' ? 'Video Depoimento' : undefined, tituloCriativo: p.origem === 'Publicidade Digital' ? 'Volte a Enxergar Bem' : undefined, palavraChave: p.origem === 'Publicidade Digital' ? 'cirurgia catarata preço' : undefined, quemIndicou: p.origem === 'Indicação' ? 'Dr. Carlos Pereira' : undefined, dataIndicacao: p.origem === 'Indicação' ? new Date(2024, 5, 10) : undefined, telefoneIndicacao: p.origem === 'Indicação' ? '(11) 98877-6655' : undefined, nomeEvento: p.origem === 'Evento' ? 'Feira da Saúde Local' : undefined, dataEvento: p.origem === 'Evento' ? new Date(2024, 4, 15) : undefined, descricaoEvento: p.origem === 'Evento' ? 'Participação no stand da Acesso Oftalmologia.' : undefined }; return { ...p, gestorResponsavel: p.gestorResponsavel ?? sampleGestores[Math.floor(Math.random() * sampleGestores.length)], consultorResponsavel: p.consultorResponsavel ?? sampleConsultores[0], marketingData: { ...marketingDataDefaults, ...(p.marketingData || {}), }, historico: p.historico || [], procedimentos: p.procedimentos || [], }; };

      // --- Atualiza Estado Local (Mantido) ---
      useEffect(() => { /* ...código mantido... */ const pacienteComDefaults = getInitialPacienteWithDefaults(initialPaciente ? JSON.parse(JSON.stringify(initialPaciente)) : null); setPaciente(pacienteComDefaults); if (open) { setActiveTab("contato"); setIsSaving(false); } if (pacienteComDefaults && (!hospitalsData[pacienteComDefaults.hospital] || !hospitalsData[pacienteComDefaults.hospital]?.includes(pacienteComDefaults.medico))) { const firstDoctor = hospitalsData[pacienteComDefaults.hospital]?.[0] || ""; setPaciente(current => current ? ({ ...current, medico: firstDoctor }) : null); } }, [initialPaciente, open]);

      // --- Handlers de Input (Mantidos) ---
      const handleInputChange = (field: keyof PacienteDataExtended, value: any) => { setPaciente(prev => prev ? ({ ...prev, [field]: value }) : null); };
      const handleMarketingInputChange = (field: keyof NonNullable<PacienteDataExtended['marketingData']>, value: any) => { setPaciente(prev => { if (!prev) return null; return { ...prev, marketingData: { ...(prev.marketingData || {}), [field]: value, } }; }); };
      const handleProcedureInputChange = (procIndex: number, field: string, value: any) => { setPaciente(prev => { if (!prev) return null; const updatedProcedimentos = (prev.procedimentos || []).map((proc, index) => { if (index !== procIndex) return proc; const updatedProc = { ...proc, [field]: value }; if (field === 'procedimento' && typeof value === 'string') { if (value.toLowerCase().includes('consulta')) updatedProc.tipo = 'Consulta'; else if (value.toLowerCase().includes('exame')) updatedProc.tipo = 'Exame'; else if (value.toLowerCase().includes('cirurgia')) updatedProc.tipo = 'Cirurgia'; else updatedProc.tipo = 'Outro'; } return updatedProc; }); return { ...prev, procedimentos: updatedProcedimentos }; }); };
      const handleHospitalChange = (newHospital: string) => { /* ...código mantido... */ if (!paciente || newHospital === paciente.hospital) return; const oldHospital = paciente.hospital; const oldDoctor = paciente.medico; const newDoctorList = hospitalsData[newHospital] || []; const newSelectedDoctor = newDoctorList[0] || ""; const updatedProcedimentos = (paciente.procedimentos || []).map(proc => proc.status !== 'ganho' && proc.status !== 'perdido' ? { ...proc, hospital: newHospital } : proc); const historyDescription = `Hospital vinculado alterado de "${oldHospital || 'N/A'}" para "${newHospital}". Médico vinculado atualizado de "${oldDoctor || 'N/A'}" para "${newSelectedDoctor || 'N/A'}". Hospitais de procedimentos pendentes atualizados.`; const newHistoricoEntry = { id: `hist-${Date.now()}`, data: new Date(), tipo: "Alteração", descricao: historyDescription, usuario: "Sistema" }; setPaciente(prev => prev ? ({ ...prev, hospital: newHospital, medico: newSelectedDoctor, procedimentos: updatedProcedimentos, historico: [newHistoricoEntry, ...(prev.historico || [])] }) : null); toast({ title: "Hospital Atualizado", description: `Hospital alterado para ${newHospital}. Médico resetado para ${newSelectedDoctor || 'nenhum'}.` }); };
      const handleDoctorChange = (newDoctor: string) => { /* ...código mantido... */ if (!paciente || newDoctor === paciente.medico) return; const oldDoctor = paciente.medico; const newHistoricoEntry = { id: `hist-${Date.now()}`, data: new Date(), tipo: "Alteração", descricao: `Médico vinculado alterado de "${oldDoctor || 'N/A'}" para "${newDoctor}".`, usuario: "Sistema" }; setPaciente(prev => prev ? ({ ...prev, medico: newDoctor, historico: [newHistoricoEntry, ...(prev.historico || [])] }) : null); toast({ title: "Médico Atualizado", description: `Médico vinculado alterado para ${newDoctor}.` }); }

      // --- Handlers de Ação ---
      const handleCall = () => { toast({ title: "Ligar", description: "Pendente." }); };
      const addProcedimento = () => { toast({ title: "Adicionar Procedimento", description: "Pendente." }); };
      const handleSaveChanges = async () => { /* ...código mantido... */ if (!paciente) return; setIsSaving(true); console.log("Saving:", paciente); try { await onSave(paciente); toast({ title: "Alterações Salvas" }); onOpenChange(false); } catch (error: any) { console.error("Erro ao salvar:", error); toast({ variant: "destructive", title: "Erro ao Salvar", description: error.message || '' }); } finally { setIsSaving(false); } };

      // Handler para Ganho/Perdido (mantido como placeholder)
      const handleStatusChange = (procedimentoId: string, status: "ganho" | "perdido") => {
          // TODO: Implementar lógica real de API e atualização de estado
          const procDesc = paciente?.procedimentos.find(p => p.id === procedimentoId)?.procedimento || 'Procedimento';
          toast({ title: `Marcar como ${status}`, description: `"${procDesc}" - Funcionalidade pendente.` });
          // Exemplo de como seria a atualização de estado (após sucesso da API):
          // setPaciente(prev => {
          //   if (!prev) return null;
          //   const updatedProcedimentos = prev.procedimentos.map(p =>
          //     p.id === procedimentoId ? { ...p, status: status } : p
          //   );
          //   const histEntry = { id: `hist-${Date.now()}`, data: new Date(), tipo: "Status", descricao: `Procedimento "${procDesc}" marcado como ${status}.`, usuario: "Consultor Logado" };
          //   return { ...prev, procedimentos: updatedProcedimentos, historico: [histEntry, ...prev.historico] };
          // });
      };

      // NOVO Handler para Agendar/Reagendar
      const handleAgendarReagendar = (procedimentoId: string) => {
          setPaciente(prev => {
              if (!prev) return null;

              let newStatus: string = 'pendente'; // Default para reagendar
              let historicoMsg = '';
              let historicoTipo = 'Reagendamento';
              let toastTitle = 'Reagendamento';
              let toastDesc = '';

              const updatedProcedimentos = prev.procedimentos.map(p => {
                  if (p.id === procedimentoId) {
                      const procDesc = p.procedimento || 'Procedimento';
                      if (p.status === 'pendente') {
                          newStatus = 'Agendado';
                          historicoMsg = `Procedimento "${procDesc}" agendado.`;
                          historicoTipo = 'Agendamento';
                          toastTitle = 'Procedimento Agendado';
                          toastDesc = `"${procDesc}" foi marcado como agendado.`;
                      } else if (p.status === 'Agendado') {
                          newStatus = 'pendente'; // Volta para pendente
                          historicoMsg = `Procedimento "${procDesc}" retornado para pendente (reagendamento).`;
                          historicoTipo = 'Reagendamento';
                          toastTitle = 'Procedimento Pendente';
                          toastDesc = `"${procDesc}" voltou para pendente para reagendamento.`;
                      } else {
                          // Não faz nada se já for ganho/perdido
                          return p;
                      }
                      return { ...p, status: newStatus };
                  }
                  return p;
              });

              // Só adiciona histórico e mostra toast se houve mudança
              if (historicoMsg) {
                  const histEntry = {
                      id: `hist-${Date.now()}`,
                      data: new Date(),
                      tipo: historicoTipo,
                      descricao: historicoMsg,
                      usuario: sampleConsultores[0] // Usar usuário logado real
                  };
                  toast({ title: toastTitle, description: toastDesc });
                  return { ...prev, procedimentos: updatedProcedimentos, historico: [histEntry, ...prev.historico] };
              }

              return prev; // Retorna estado anterior se não houve mudança
          });
      };
      // --- Fim Handlers de Ação ---

      // --- Render Logic ---
      if (!open) return null;
      if (!paciente) { /* ...código de loading mantido... */ return ( <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0"><DialogHeader className="p-6 pb-0 shrink-0"><DialogTitle className="text-xl">Carregando...</DialogTitle></DialogHeader><div className="p-6 text-center flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-2">Carregando...</span></div></DialogContent></Dialog> ); }

      const formattedNascimento = safeFormatDate(paciente.dataNascimento, "yyyy-MM-dd");
      const formattedMarketingIndicacao = safeFormatDate(paciente.marketingData?.dataIndicacao, "yyyy-MM-dd");
      const formattedMarketingEvento = safeFormatDate(paciente.marketingData?.dataEvento, "yyyy-MM-dd");

      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-4 border-b shrink-0">
              <div className="flex justify-between items-center">
                <DialogTitle className="text-xl">{paciente.nome}</DialogTitle>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCall} title="Ligar (Pendente)"><PhoneCall className="h-4 w-4" /></Button>
                    <Button size="sm" onClick={handleSaveChanges} disabled={isSaving} title="Salvar Alterações"> {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} {isSaving ? "Salvando..." : "Salvar"} </Button>
                </div>
              </div>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0 overflow-hidden px-6 pb-6">
              <TabsList className="grid grid-cols-4 mb-4 shrink-0">
                <TabsTrigger value="contato">Contato</TabsTrigger>
                <TabsTrigger value="procedimentos">Procedimentos</TabsTrigger>
                <TabsTrigger value="whatsapp"><MessageCircle className="h-4 w-4 mr-1"/> WhatsApp</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto mt-0">
                  <TabsContent value="contato" className="mt-0 space-y-6 focus-visible:ring-0">
                    <ContatoTab paciente={paciente} handleInputChange={handleInputChange} handleMarketingInputChange={handleMarketingInputChange} handleHospitalChange={handleHospitalChange} handleDoctorChange={handleDoctorChange} availableDoctors={availableDoctors} hospitalNames={hospitalNames} formattedNascimento={formattedNascimento} formattedMarketingIndicacao={formattedMarketingIndicacao} formattedMarketingEvento={formattedMarketingEvento} />
                  </TabsContent>

                  <TabsContent value="procedimentos" className="mt-0 space-y-4 focus-visible:ring-0">
                    <ProcedimentosTab
                      paciente={paciente}
                      handleProcedureInputChange={handleProcedureInputChange}
                      handleStatusChange={handleStatusChange} // Para Ganho/Perdido
                      handleAgendarReagendar={handleAgendarReagendar} // Passa o novo handler
                      addProcedimento={addProcedimento}
                      configuredProcedures={configuredProcedures}
                    />
                  </TabsContent>

                  <TabsContent value="whatsapp" className="mt-0 flex-1 flex flex-col min-h-0 focus-visible:ring-0">
                     <WhatsappTabWrapper paciente={paciente} isActiveTab={activeTab === 'whatsapp'} />
                  </TabsContent>

                  <TabsContent value="historico" className="mt-0 space-y-4 focus-visible:ring-0">
                    <HistoricoTab paciente={paciente} />
                  </TabsContent>
              </div>
            </Tabs>
          </DialogContent>
        </Dialog>
      );
    }
