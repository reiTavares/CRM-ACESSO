import { useState, useEffect } from "react";
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { Button } from "@/components/ui/button";
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
    import { PhoneCall, Save, MessageCircle, Loader2, X } from "lucide-react"; // Adicionado X para botão Fechar
    import { PacienteData } from "@/components/pacientes/paciente-card";
    import { useToast } from "@/hooks/use-toast";
    import { cn } from "@/lib/utils";
    import { ContatoTab } from './modal-tabs/ContatoTab';
    import { ProcedimentosTab } from './modal-tabs/ProcedimentosTab';
    import { WhatsappTabWrapper } from './modal-tabs/WhatsappTabWrapper';
    import { HistoricoTab } from './modal-tabs/HistoricoTab';
    import { safeFormatDate } from './modal-tabs/utils';

    // --- Mock Data (Mantido) ---
    const hospitalsData: Record<string, string[]> = { "HODF": ["Dr. João Silva", "Dra. Ana Costa", "Dr. Pedro Martins", "Dra. Carla Dias"], "HO Londrina": ["Dr. Carlos Souza", "Dra. Beatriz Lima", "Dr. Ricardo Alves", "Dra. Fernanda Vieira"], "HO Maringa": ["Dra. Mariana Ferreira", "Dr. Gustavo Pereira", "Dra. Sofia Ribeiro", "Dr. André Mendes"], "HOA": ["Dr. Lucas Gomes", "Dra. Julia Almeida", "Dr. Matheus Barbosa", "Dra. Isabela Castro"], "": [] };
    const hospitalNames = Object.keys(hospitalsData).filter(name => name !== "");
    const sampleGestores = ["Ana Gestora", "Carlos Gestor", "Beatriz Gestora"];
    const sampleConsultores = ["Consultor Logado", "Mariana Consultora", "Pedro Consultor"];
    // --- Fim Mock Data ---

    // --- Interface Estendida (Mantida) ---
    export interface PacienteDataExtended extends PacienteData {
        gestorResponsavel?: string;
        consultorResponsavel?: string;
        marketingData?: {
            fonte?: string; campanha?: string; conjunto?: string; tipoCriativo?: string; tituloCriativo?: string; palavraChave?: string; quemIndicou?: string; dataIndicacao?: Date | string | null; telefoneIndicacao?: string; nomeEvento?: string; dataEvento?: Date | string | null; descricaoEvento?: string;
        };
    }
    // --- Fim Interface ---

    interface PacienteDetailModalProps {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      paciente: PacienteDataExtended | null;
      // Nova prop para lidar com o salvamento bem-sucedido
      // Retorna Promise para permitir feedback de loading/erro da operação de salvar
      onSave: (updatedPaciente: PacienteDataExtended) => Promise<void>;
    }

    export function PacienteDetailModal({
        open,
        onOpenChange,
        paciente: initialPaciente,
        onSave, // Recebe a função de salvar da página pai
    }: PacienteDetailModalProps) {
      const [activeTab, setActiveTab] = useState("contato");
      const [paciente, setPaciente] = useState<PacienteDataExtended | null>(null);
      const [isSaving, setIsSaving] = useState(false); // Estado para loading do botão salvar
      const { toast } = useToast();

      const availableDoctors = paciente ? (hospitalsData[paciente.hospital] || []) : [];

      // --- Lógica de Defaults (Mantida) ---
      const getInitialPacienteWithDefaults = (p: PacienteDataExtended | null): PacienteDataExtended | null => {
          if (!p) return null;
          const marketingDataDefaults = { fonte: p.origem === 'Publicidade Digital' ? 'Facebook Ads' : p.origem === 'Publicidade Tradicional' ? 'Revista Local' : undefined, campanha: p.origem === 'Publicidade Digital' ? 'Campanha Catarata Junho' : undefined, conjunto: p.origem === 'Publicidade Digital' ? 'Grupo Interesse 50+' : undefined, tipoCriativo: p.origem === 'Publicidade Digital' ? 'Video Depoimento' : undefined, tituloCriativo: p.origem === 'Publicidade Digital' ? 'Volte a Enxergar Bem' : undefined, palavraChave: p.origem === 'Publicidade Digital' ? 'cirurgia catarata preço' : undefined, quemIndicou: p.origem === 'Indicação' ? 'Dr. Carlos Pereira' : undefined, dataIndicacao: p.origem === 'Indicação' ? new Date(2024, 5, 10) : undefined, telefoneIndicacao: p.origem === 'Indicação' ? '(11) 98877-6655' : undefined, nomeEvento: p.origem === 'Evento' ? 'Feira da Saúde Local' : undefined, dataEvento: p.origem === 'Evento' ? new Date(2024, 4, 15) : undefined, descricaoEvento: p.origem === 'Evento' ? 'Participação no stand da Acesso Oftalmologia.' : undefined };
          return {
              ...p,
              gestorResponsavel: p.gestorResponsavel ?? sampleGestores[Math.floor(Math.random() * sampleGestores.length)],
              consultorResponsavel: p.consultorResponsavel ?? sampleConsultores[0],
              marketingData: { ...marketingDataDefaults, ...(p.marketingData || {}), },
              historico: p.historico || [],
              procedimentos: p.procedimentos || [],
          };
      };

      // --- Atualiza Estado Local ao Mudar Paciente ou Abrir Modal ---
      useEffect(() => {
        // Cria uma cópia profunda para evitar mutações no objeto original passado por prop
        const pacienteComDefaults = getInitialPacienteWithDefaults(initialPaciente ? JSON.parse(JSON.stringify(initialPaciente)) : null);
        setPaciente(pacienteComDefaults);

        if (open) {
            setActiveTab("contato"); // Reseta para a primeira aba ao abrir
            setIsSaving(false); // Reseta estado de salvamento
        }

        // Lógica de reset do médico (mantida)
        if (pacienteComDefaults && (!hospitalsData[pacienteComDefaults.hospital] || !hospitalsData[pacienteComDefaults.hospital]?.includes(pacienteComDefaults.medico))) {
            const firstDoctor = hospitalsData[pacienteComDefaults.hospital]?.[0] || "";
            setPaciente(current => current ? ({ ...current, medico: firstDoctor }) : null);
        }
      }, [initialPaciente, open]); // Depende de initialPaciente e open

      // --- Handlers de Input (Mantidos, mas atenção ao tipo Date) ---
      const handleInputChange = (field: keyof PacienteDataExtended, value: any) => {
        // Se o campo for uma data e o valor vier de um input type="date" (string),
        // pode ser necessário converter para Date aqui, ou garantir que o tipo
        // em PacienteDataExtended aceite string | Date. Por simplicidade,
        // manteremos como está, assumindo que a conversão final ocorre antes do save real.
        setPaciente(prev => prev ? ({ ...prev, [field]: value }) : null);
      };

      const handleMarketingInputChange = (field: keyof NonNullable<PacienteDataExtended['marketingData']>, value: any) => {
          setPaciente(prev => {
              if (!prev) return null;
              // Mesma observação sobre datas que handleInputChange
              return {
                  ...prev,
                  marketingData: { ...(prev.marketingData || {}), [field]: value, }
              };
          });
      };

      const handleProcedureInputChange = (procIndex: number, field: string, value: any) => {
         setPaciente(prev => {
            if (!prev) return null;
            const updatedProcedimentos = (prev.procedimentos || []).map((proc, index) => {
                if (index !== procIndex) return proc;
                // Mesma observação sobre datas e números (converter de string se necessário)
                const updatedProc = { ...proc, [field]: value };
                // Lógica para atualizar tipo (Consulta/Exame/Cirurgia) se necessário
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
      // --- Fim Handlers de Input ---

      // --- Handlers de Ação (Placeholder e Salvar) ---
      const handleCall = () => { toast({ title: "Ligar", description: "Funcionalidade pendente." }); };
      const handleStatusChange = (procedimentoId: string, status: "ganho" | "perdido") => { toast({ title: "Status Procedimento", description: `Alterar ${procedimentoId} para ${status} - pendente.` }); };
      const addProcedimento = () => { toast({ title: "Adicionar Procedimento", description: "Funcionalidade pendente." }); };

      // Handler de Salvamento Atualizado
      const handleSaveChanges = async () => {
          if (!paciente) return;
          setIsSaving(true);
          console.log("Saving changes for paciente:", paciente);

          try {
              // Chama a função passada por prop, que deve retornar uma Promise
              await onSave(paciente);
              toast({ title: "Alterações Salvas", description: "Os dados do paciente foram atualizados." });
              onOpenChange(false); // Fecha o modal em caso de sucesso
          } catch (error: any) {
              console.error("Erro ao salvar alterações:", error);
              toast({
                  variant: "destructive",
                  title: "Erro ao Salvar",
                  description: `Não foi possível salvar as alterações. ${error.message || ''}`
              });
              // Mantém o modal aberto em caso de erro
          } finally {
              setIsSaving(false); // Finaliza o estado de salvamento
          }
      };
      // --- Fim Handlers de Ação ---

      // --- Render Logic ---
      if (!open) return null; // Não renderiza nada se não estiver aberto

      // Indicador de loading se o paciente ainda não foi carregado (pouco provável com o useEffect)
      if (!paciente) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-0 shrink-0"><DialogTitle className="text-xl">Carregando...</DialogTitle></DialogHeader>
                    <div className="p-6 text-center flex-1 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-2">Carregando dados do paciente...</span>
                    </div>
                </DialogContent>
            </Dialog>
        );
      }

      // Formata datas necessárias para a ContatoTab
      const formattedNascimento = safeFormatDate(paciente.dataNascimento, "yyyy-MM-dd");
      const formattedMarketingIndicacao = safeFormatDate(paciente.marketingData?.dataIndicacao, "yyyy-MM-dd");
      const formattedMarketingEvento = safeFormatDate(paciente.marketingData?.dataEvento, "yyyy-MM-dd");

      return (
        // Usar onOpenChange para o Dialog permite fechar clicando fora ou no X padrão
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            {/* Header com Título e Botões */}
            <DialogHeader className="p-6 pb-4 border-b shrink-0">
              <div className="flex justify-between items-center">
                <DialogTitle className="text-xl">{paciente.nome}</DialogTitle>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCall} title="Ligar (Pendente)"><PhoneCall className="h-4 w-4" /></Button>
                    <Button size="sm" onClick={handleSaveChanges} disabled={isSaving} title="Salvar Alterações">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        {isSaving ? "Salvando..." : "Salvar"}
                    </Button>
                    {/* Botão X explícito (opcional, pois o Dialog já tem um) */}
                    {/* <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}><X className="h-4 w-4" /></Button> */}
                </div>
              </div>
            </DialogHeader>

            {/* Conteúdo com Abas */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0 overflow-hidden px-6 pb-6">
              {/* Lista de Abas */}
              <TabsList className="grid grid-cols-4 mb-4 shrink-0">
                <TabsTrigger value="contato">Contato</TabsTrigger>
                <TabsTrigger value="procedimentos">Procedimentos</TabsTrigger>
                <TabsTrigger value="whatsapp"><MessageCircle className="h-4 w-4 mr-1"/> WhatsApp</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>

              {/* Conteúdo das Abas */}
              <div className="flex-1 overflow-y-auto mt-0"> {/* Container para scroll */}
                  <TabsContent value="contato" className="mt-0 space-y-6 focus-visible:ring-0">
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

                  <TabsContent value="procedimentos" className="mt-0 space-y-4 focus-visible:ring-0">
                    <ProcedimentosTab
                      paciente={paciente}
                      handleProcedureInputChange={handleProcedureInputChange}
                      handleStatusChange={handleStatusChange}
                      addProcedimento={addProcedimento}
                    />
                  </TabsContent>

                  {/* Wrapper para WhatsappTab para controlar renderização/ativação */}
                  <TabsContent value="whatsapp" className="mt-0 flex-1 flex flex-col min-h-0 focus-visible:ring-0">
                     <WhatsappTabWrapper
                        paciente={paciente}
                        isActiveTab={activeTab === 'whatsapp'}
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
