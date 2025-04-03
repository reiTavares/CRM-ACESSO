import { useState, useEffect } from "react";
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { Button } from "@/components/ui/button";
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
    import { PhoneCall, Save, MessageCircle, Loader2 } from "lucide-react";
    import { PacienteData } from "@/components/pacientes/paciente-card";
    import { useToast } from "@/hooks/use-toast";
    import { cn } from "@/lib/utils";
    // Import new tab components
    import { ContatoTab } from './modal-tabs/ContatoTab';
    import { ProcedimentosTab } from './modal-tabs/ProcedimentosTab';
    import { WhatsappTabWrapper } from './modal-tabs/WhatsappTabWrapper';
    import { HistoricoTab } from './modal-tabs/HistoricoTab';
    import { safeFormatDate } from './modal-tabs/utils';

    // --- Mock Data (Keep only necessary parts here) ---
    const hospitalsData: Record<string, string[]> = {
      "HODF": ["Dr. João Silva", "Dra. Ana Costa", "Dr. Pedro Martins", "Dra. Carla Dias"],
      "HO Londrina": ["Dr. Carlos Souza", "Dra. Beatriz Lima", "Dr. Ricardo Alves", "Dra. Fernanda Vieira"],
      "HO Maringa": ["Dra. Mariana Ferreira", "Dr. Gustavo Pereira", "Dra. Sofia Ribeiro", "Dr. André Mendes"],
      "HOA": ["Dr. Lucas Gomes", "Dra. Julia Almeida", "Dr. Matheus Barbosa", "Dra. Isabela Castro"],
      "": []
    };
    const hospitalNames = Object.keys(hospitalsData).filter(name => name !== "");
    const sampleGestores = ["Ana Gestora", "Carlos Gestor", "Beatriz Gestora"];
    const sampleConsultores = ["Consultor Logado", "Mariana Consultora", "Pedro Consultor"];
    // --- End Mock Data ---

    // --- Updated Interface (Export for use in tabs) ---
    export interface PacienteDataExtended extends PacienteData {
        gestorResponsavel?: string;
        consultorResponsavel?: string;
        marketingData?: {
            fonte?: string;
            campanha?: string;
            conjunto?: string;
            tipoCriativo?: string;
            tituloCriativo?: string;
            palavraChave?: string;
            quemIndicou?: string;
            dataIndicacao?: Date | string | null;
            telefoneIndicacao?: string;
            nomeEvento?: string;
            dataEvento?: Date | string | null;
            descricaoEvento?: string;
        };
    }
    // --- End Interface ---

    interface PacienteDetailModalProps {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      paciente: PacienteDataExtended | null;
    }

    export function PacienteDetailModal({
        open,
        onOpenChange,
        paciente: initialPaciente,
    }: PacienteDetailModalProps) {
      const [activeTab, setActiveTab] = useState("contato");
      const [paciente, setPaciente] = useState<PacienteDataExtended | null>(null);
      const { toast } = useToast();

      const availableDoctors = paciente ? (hospitalsData[paciente.hospital] || []) : [];

      // --- Populate initial state with sample data if missing ---
      const getInitialPacienteWithDefaults = (p: PacienteDataExtended | null): PacienteDataExtended | null => {
          if (!p) return null;
          // Simplified for brevity, assumes marketingDataDefaults logic is correct
          const marketingDataDefaults = {
              fonte: p.origem === 'Publicidade Digital' ? 'Facebook Ads' : p.origem === 'Publicidade Tradicional' ? 'Revista Local' : undefined,
              campanha: p.origem === 'Publicidade Digital' ? 'Campanha Catarata Junho' : undefined,
              conjunto: p.origem === 'Publicidade Digital' ? 'Grupo Interesse 50+' : undefined,
              tipoCriativo: p.origem === 'Publicidade Digital' ? 'Video Depoimento' : undefined,
              tituloCriativo: p.origem === 'Publicidade Digital' ? 'Volte a Enxergar Bem' : undefined,
              palavraChave: p.origem === 'Publicidade Digital' ? 'cirurgia catarata preço' : undefined,
              quemIndicou: p.origem === 'Indicação' ? 'Dr. Carlos Pereira' : undefined,
              dataIndicacao: p.origem === 'Indicação' ? new Date(2024, 5, 10) : undefined,
              telefoneIndicacao: p.origem === 'Indicação' ? '(11) 98877-6655' : undefined,
              nomeEvento: p.origem === 'Evento' ? 'Feira da Saúde Local' : undefined,
              dataEvento: p.origem === 'Evento' ? new Date(2024, 4, 15) : undefined,
              descricaoEvento: p.origem === 'Evento' ? 'Participação no stand da Acesso Oftalmologia.' : undefined
          };
          return {
              ...p,
              gestorResponsavel: p.gestorResponsavel ?? sampleGestores[Math.floor(Math.random() * sampleGestores.length)],
              consultorResponsavel: p.consultorResponsavel ?? sampleConsultores[0],
              marketingData: {
                  ...marketingDataDefaults,
                  ...(p.marketingData || {}),
              },
              historico: p.historico || [],
              procedimentos: p.procedimentos || [],
          };
      };

      // Update local paciente state
      useEffect(() => {
        const pacienteComDefaults = getInitialPacienteWithDefaults(initialPaciente);
        setPaciente(pacienteComDefaults);
        if (open) {
            setActiveTab("contato"); // Reset to first tab on open
        }
        // Reset doctor if hospital changes or doctor is invalid for hospital
        if (pacienteComDefaults && (!hospitalsData[pacienteComDefaults.hospital] || !hospitalsData[pacienteComDefaults.hospital]?.includes(pacienteComDefaults.medico))) {
            const firstDoctor = hospitalsData[pacienteComDefaults.hospital]?.[0] || "";
            // Use functional update to avoid stale state issues
            setPaciente(current => current ? ({ ...current, medico: firstDoctor }) : null);
        }
      }, [initialPaciente, open]); // Rerun when modal opens or initial patient changes

      // --- Input Handlers (Keep logic, pass down as props) ---
      const handleInputChange = (field: keyof PacienteDataExtended, value: any) => {
        setPaciente(prev => prev ? ({ ...prev, [field]: value }) : null);
        // Add specific date handling if needed
      };

      const handleMarketingInputChange = (field: keyof NonNullable<PacienteDataExtended['marketingData']>, value: any) => {
          setPaciente(prev => {
              if (!prev) return null;
              // Add date parsing logic here if needed
              return {
                  ...prev,
                  marketingData: {
                      ...(prev.marketingData || {}),
                      [field]: value,
                  }
              };
          });
      };

      const handleProcedureInputChange = (procIndex: number, field: string, value: any) => {
         setPaciente(prev => {
            if (!prev) return null;
            const updatedProcedimentos = (prev.procedimentos || []).map((proc, index) => {
                if (index !== procIndex) return proc;
                // Add date/number parsing logic here
                const updatedProc = { ...proc, [field]: value };
                // Add type update logic here
                return updatedProc;
            });
            return { ...prev, procedimentos: updatedProcedimentos };
         });
      };

      const handleHospitalChange = (newHospital: string) => {
        if (!paciente || newHospital === paciente.hospital) return;
        const oldHospital = paciente.hospital;
        const oldDoctor = paciente.medico;
        const newDoctorList = hospitalsData[newHospital] || [];
        const newSelectedDoctor = newDoctorList[0] || "";
        const updatedProcedimentos = (paciente.procedimentos || []).map(proc =>
          proc.status !== 'ganho' && proc.status !== 'perdido' ? { ...proc, hospital: newHospital } : proc
        );
        const historyDescription = `Hospital vinculado alterado de "${oldHospital || 'N/A'}" para "${newHospital}". Médico vinculado atualizado de "${oldDoctor || 'N/A'}" para "${newSelectedDoctor || 'N/A'}". Hospitais de procedimentos pendentes atualizados.`;
        const newHistoricoEntry = { id: `hist-${Date.now()}`, data: new Date(), tipo: "Alteração", descricao: historyDescription, usuario: "Sistema" };

        setPaciente(prev => prev ? ({
            ...prev,
            hospital: newHospital,
            medico: newSelectedDoctor,
            procedimentos: updatedProcedimentos,
            historico: [newHistoricoEntry, ...(prev.historico || [])]
        }) : null);
        toast({ title: "Hospital Atualizado", description: `Hospital alterado para ${newHospital}. Médico resetado para ${newSelectedDoctor || 'nenhum'}.` });
      };

      const handleDoctorChange = (newDoctor: string) => {
          if (!paciente || newDoctor === paciente.medico) return;
          const oldDoctor = paciente.medico;
          const newHistoricoEntry = { id: `hist-${Date.now()}`, data: new Date(), tipo: "Alteração", descricao: `Médico vinculado alterado de "${oldDoctor || 'N/A'}" para "${newDoctor}".`, usuario: "Sistema" };
          setPaciente(prev => prev ? ({
              ...prev,
              medico: newDoctor,
              historico: [newHistoricoEntry, ...(prev.historico || [])]
          }) : null);
          toast({ title: "Médico Atualizado", description: `Médico vinculado alterado para ${newDoctor}.` });
      }
      // --- End Input Handlers ---

      // --- Action Handlers (Keep logic, pass down as props) ---
      const handleCall = () => { toast({ title: "Ligar", description: "Funcionalidade pendente." }); };
      const handleStatusChange = (procedimentoId: string, status: "ganho" | "perdido") => { toast({ title: "Status Procedimento", description: `Alterar ${procedimentoId} para ${status} - pendente.` }); };
      const addProcedimento = () => { toast({ title: "Adicionar Procedimento", description: "Funcionalidade pendente." }); };
      const handleSaveChanges = () => {
          console.log("Saving changes for paciente:", paciente);
          toast({ title: "Alterações Salvas (Simulado)" });
      };
      // --- End Action Handlers ---

      // --- Render Logic ---
      if (!open) return null;

      if (!paciente) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-0 shrink-0"><DialogTitle className="text-xl">Carregando...</DialogTitle></DialogHeader>
                    <div className="p-6 text-center flex-1 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-2">Carregando...</span>
                    </div>
                </DialogContent>
            </Dialog>
        );
      }

      // Format dates needed by ContatoTab
      const formattedNascimento = safeFormatDate(paciente.dataNascimento, "yyyy-MM-dd");
      const formattedMarketingIndicacao = safeFormatDate(paciente.marketingData?.dataIndicacao, "yyyy-MM-dd");
      const formattedMarketingEvento = safeFormatDate(paciente.marketingData?.dataEvento, "yyyy-MM-dd");

      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-0 shrink-0">
              <div className="flex justify-between items-center">
                <DialogTitle className="text-xl">{paciente.nome}</DialogTitle>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={handleCall} title="Ligar"><PhoneCall className="h-4 w-4" /></Button>
                     <Button size="sm" onClick={handleSaveChanges} title="Salvar"><Save className="h-4 w-4 mr-2" /> Salvar</Button>
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

              {/* Render Tab Components */}
              <TabsContent value="contato" className="flex-1 overflow-y-auto mt-0 space-y-6">
                <ContatoTab
                  paciente={paciente}
                  handleInputChange={handleInputChange}
                  handleMarketingInputChange={handleMarketingInputChange}
                  handleHospitalChange={handleHospitalChange}
                  handleDoctorChange={handleDoctorChange}
                  availableDoctors={availableDoctors}
                  hospitalNames={hospitalNames}
                  formattedNascimento={formattedNascimento}
                  formattedMarketingIndicacao={formattedMarketingIndicacao}
                  formattedMarketingEvento={formattedMarketingEvento}
                />
              </TabsContent>

              <TabsContent value="procedimentos" className="flex-1 overflow-y-auto mt-0 space-y-4">
                <ProcedimentosTab
                  paciente={paciente}
                  handleProcedureInputChange={handleProcedureInputChange}
                  handleStatusChange={handleStatusChange}
                  addProcedimento={addProcedimento}
                />
              </TabsContent>

              <TabsContent value="whatsapp" className="flex-1 flex flex-col min-h-0 mt-0">
                 <WhatsappTabWrapper
                    paciente={paciente}
                    isActiveTab={activeTab === 'whatsapp'}
                 />
              </TabsContent>

              <TabsContent value="historico" className="flex-1 overflow-y-auto mt-0 space-y-4">
                <HistoricoTab paciente={paciente} />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      );
    }
