import { useState, useEffect } from "react";
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { Button } from "@/components/ui/button";
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
    import { PhoneCall, Save, MessageCircle, Loader2, X, StickyNote, History } from "lucide-react"; // Adicionar ícones
    import { PacienteData, PacienteDataExtended } from "@/components/pacientes/paciente-card";
    import { useToast } from "@/hooks/use-toast";
    import { cn } from "@/lib/utils";
    import { ContatoTab } from './modal-tabs/ContatoTab';
    import { ProcedimentosTab } from './modal-tabs/ProcedimentosTab';
    import { WhatsappTabWrapper } from './modal-tabs/WhatsappTabWrapper';
    import { HistoricoTab } from './modal-tabs/HistoricoTab';
    // Importar a nova aba de Notas
    import { NotasTab } from './modal-tabs/NotasTab';
    import { safeFormatDate } from './modal-tabs/utils';
    import { initialProcedimentos, ProcedimentoConfig } from "@/components/configuracoes/ProcedimentosSettings";

    // --- Mock Data (Mantido) ---
    const hospitalsData: Record<string, string[]> = { "HODF": ["Dr. João Silva", "Dra. Ana Costa", "Dr. Pedro Martins", "Dra. Carla Dias"], "HO Londrina": ["Dr. Carlos Souza", "Dra. Beatriz Lima", "Dr. Ricardo Alves", "Dra. Fernanda Vieira"], "HO Maringa": ["Dra. Mariana Ferreira", "Dr. Gustavo Pereira", "Dra. Sofia Ribeiro", "Dr. André Mendes"], "HOA": ["Dr. Lucas Gomes", "Dra. Julia Almeida", "Dr. Matheus Barbosa", "Dra. Isabela Castro"], "": [] };
    const hospitalNames = Object.keys(hospitalsData).filter(name => name !== "");
    const sampleGestores = ["Ana Gestora", "Carlos Gestor", "Beatriz Gestora"];
    const sampleConsultores = ["Consultor Logado", "Mariana Consultora", "Pedro Consultor"];
    // Simular usuário logado (pegar do contexto de auth no futuro)
    const mockLoggedInUser = { id: "user-123", nome: "Consultor Logado Exemplo" };
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

      // --- Lógica de Defaults (Adicionar inicialização de notas) ---
      const getInitialPacienteWithDefaults = (p: PacienteDataExtended | null): PacienteDataExtended | null => {
          if (!p) return null;
          const marketingDataDefaults = { /* ... */ };
          return {
              ...p,
              gestorResponsavel: p.gestorResponsavel ?? sampleGestores[Math.floor(Math.random() * sampleGestores.length)],
              consultorResponsavel: p.consultorResponsavel ?? sampleConsultores[0],
              marketingData: { /* ... */ ...(p.marketingData || {}), },
              historico: p.historico || [],
              procedimentos: p.procedimentos || [],
              notas: p.notas || [], // Inicializa notas como array vazio se não existir
          };
       };

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
      const handleStatusChange = (procedimentoId: string, status: "ganho" | "perdido") => { /* ...código mantido... */ const procDesc = paciente?.procedimentos.find(p => p.id === procedimentoId)?.procedimento || 'Procedimento'; toast({ title: `Marcar como ${status}`, description: `"${procDesc}" - Funcionalidade pendente.` }); };
      const handleAgendarReagendar = (procedimentoId: string) => { /* ...código mantido... */ setPaciente(prev => { if (!prev) return null; let newStatus: string = 'pendente'; let historicoMsg = ''; let historicoTipo = 'Reagendamento'; let toastTitle = 'Reagendamento'; let toastDesc = ''; const updatedProcedimentos = prev.procedimentos.map(p => { if (p.id === procedimentoId) { const procDesc = p.procedimento || 'Procedimento'; if (p.status === 'pendente') { newStatus = 'Agendado'; historicoMsg = `Procedimento "${procDesc}" agendado.`; historicoTipo = 'Agendamento'; toastTitle = 'Procedimento Agendado'; toastDesc = `"${procDesc}" foi marcado como agendado.`; } else if (p.status === 'Agendado') { newStatus = 'pendente'; historicoMsg = `Procedimento "${procDesc}" retornado para pendente (reagendamento).`; historicoTipo = 'Reagendamento'; toastTitle = 'Procedimento Pendente'; toastDesc = `"${procDesc}" voltou para pendente para reagendamento.`; } else { return p; } return { ...p, status: newStatus }; } return p; }); if (historicoMsg) { const histEntry = { id: `hist-${Date.now()}`, data: new Date(), tipo: historicoTipo, descricao: historicoMsg, usuario: mockLoggedInUser.nome }; toast({ title: toastTitle, description: toastDesc }); return { ...prev, procedimentos: updatedProcedimentos, historico: [histEntry, ...prev.historico] }; } return prev; }); };

      // **NOVO Handler para Adicionar Nota**
      const handleAddNota = (texto: string) => {
          setPaciente(prev => {
              if (!prev) return null;

              const newNota = {
                  id: `nota-${Date.now()}`,
                  data: new Date(), // Data atual
                  texto: texto,
                  usuario: mockLoggedInUser.nome // Usuário logado (simulado)
              };

              const newHistoricoEntry = {
                  id: `hist-${Date.now()}-nota`,
                  data: new Date(),
                  tipo: "Nota", // Novo tipo de histórico
                  descricao: `Nota adicionada: "${texto.substring(0, 50)}${texto.length > 50 ? '...' : ''}"`,
                  usuario: mockLoggedInUser.nome
              };

              toast({ title: "Nota Adicionada" });

              return {
                  ...prev,
                  notas: [newNota, ...(prev.notas || [])], // Adiciona nova nota no início
                  historico: [newHistoricoEntry, ...(prev.historico || [])] // Adiciona histórico no início
              };
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

            {/* Ajustar grid para 5 colunas */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0 overflow-hidden px-6 pb-6">
              <TabsList className="grid grid-cols-5 mb-4 shrink-0"> {/* Alterado para grid-cols-5 */}
                <TabsTrigger value="contato">Contato</TabsTrigger>
                <TabsTrigger value="procedimentos">Procedimentos</TabsTrigger>
                <TabsTrigger value="whatsapp"><MessageCircle className="h-4 w-4 mr-1"/> WhatsApp</TabsTrigger>
                {/* Nova Aba Notas */}
                <TabsTrigger value="notas"><StickyNote className="h-4 w-4 mr-1"/> Notas</TabsTrigger>
                <TabsTrigger value="historico"><History className="h-4 w-4 mr-1"/> Histórico</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto mt-0">
                  <TabsContent value="contato" className="mt-0 space-y-6 focus-visible:ring-0">
                    <ContatoTab paciente={paciente} handleInputChange={handleInputChange} handleMarketingInputChange={handleMarketingInputChange} handleHospitalChange={handleHospitalChange} handleDoctorChange={handleDoctorChange} availableDoctors={availableDoctors} hospitalNames={hospitalNames} formattedNascimento={formattedNascimento} formattedMarketingIndicacao={formattedMarketingIndicacao} formattedMarketingEvento={formattedMarketingEvento} />
                  </TabsContent>

                  <TabsContent value="procedimentos" className="mt-0 space-y-4 focus-visible:ring-0">
                    <ProcedimentosTab paciente={paciente} handleProcedureInputChange={handleProcedureInputChange} handleStatusChange={handleStatusChange} handleAgendarReagendar={handleAgendarReagendar} addProcedimento={addProcedimento} configuredProcedures={configuredProcedures} />
                  </TabsContent>

                  <TabsContent value="whatsapp" className="mt-0 flex-1 flex flex-col min-h-0 focus-visible:ring-0">
                     <WhatsappTabWrapper paciente={paciente} isActiveTab={activeTab === 'whatsapp'} />
                  </TabsContent>

                  {/* Conteúdo da Aba Notas */}
                  <TabsContent value="notas" className="mt-0 h-full focus-visible:ring-0"> {/* Adicionado h-full */}
                      <NotasTab
                          paciente={paciente}
                          onAddNota={handleAddNota}
                      />
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
