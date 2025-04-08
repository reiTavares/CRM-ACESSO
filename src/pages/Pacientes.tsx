import { useState, useEffect, useCallback } from "react";
    import { AppShell } from "@/components/layout/app-shell";
    import { PacienteData, PacienteDataExtended } from "@/components/pacientes/paciente-card";
    import { PipelineColumn } from "@/components/pacientes/PipelineColumn";
    import { Button } from "@/components/ui/button";
    import { Input } from "@/components/ui/input";
    // Importar Dialog e DialogTrigger
    import { Dialog, DialogTrigger } from "@/components/ui/dialog";
    import { Plus, Search, Loader2 } from "lucide-react";
    import { useToast } from "@/hooks/use-toast";
    import { useApiConfig } from "@/contexts/ApiConfigContext";
    import {
      DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent,
    } from '@dnd-kit/core';
    import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
    import { PacienteDetailModal } from "@/components/pacientes/paciente-detail-modal";
    import { NewPacienteModal } from "@/components/pacientes/NewPacienteModal"; // Importa o conteúdo do modal
    import { initialProcedimentos, ProcedimentoConfig } from "@/components/configuracoes/ProcedimentosSettings";

    // --- Constantes e Dados Mockados (Mantidos) ---
    const pipelineStages = [ { id: "lead", label: "Lead Recebido" }, { id: "tentativa", label: "Tentativa de Contato" }, { id: "contato", label: "Contato Realizado" }, { id: "agendamento_consulta", label: "Agendamento de Consulta" }, { id: "consulta_realizada", label: "Consulta Realizada" }, { id: "agendamento_exames", label: "Agendamento de Exames" }, { id: "exames_realizados", label: "Exames Realizados" }, { id: "agendamento_cirurgia_smc", label: "Agendamento Cirurgia (SMC)" }, { id: "cirurgia_1_olho", label: "1º Olho - Cirurgia Realizada" }, { id: "agendamento_cirurgia_2_olho", label: "Agendamento Cirurgia 2º Olho" }, { id: "cirurgia_2_olho", label: "2º Olho - Cirurgia Realizada" }, { id: "resgate", label: "Resgate" }, ];
    const stagesWithTotals = [ "Agendamento de Consulta", "Consulta Realizada", "Agendamento de Exames", "Exames Realizados", "Agendamento Cirurgia (SMC)", "1º Olho - Cirurgia Realizada", "Agendamento Cirurgia 2º Olho", "2º Olho - Cirurgia Realizada", ];
    const hospitalsData: Record<string, string[]> = { "HODF": ["Dr. João Silva", "Dra. Ana Costa"], "HO Londrina": ["Dr. Carlos Souza", "Dra. Beatriz Lima"], "HO Maringa": ["Dra. Mariana Ferreira", "Dr. Gustavo Pereira"], "HOA": ["Dr. Lucas Gomes", "Dra. Julia Almeida"] };
    const hospitalNames = Object.keys(hospitalsData);
    const generateCPF = (): string => { const rnd = (n: number) => Math.round(Math.random() * n); const n = Array(9).fill(0).map(() => rnd(9)); let d1 = n.map((v, i) => v * (10 - i)).reduce((acc, v) => acc + v, 0) % 11; d1 = d1 < 2 ? 0 : 11 - d1; n.push(d1); let d2 = n.map((v, i) => v * (11 - i)).reduce((acc, v) => acc + v, 0) % 11; d2 = d2 < 2 ? 0 : 11 - d2; n.push(d2); return `${n.slice(0, 3).join('')}.${n.slice(3, 6).join('')}.${n.slice(6, 9).join('')}-${n.slice(9).join('')}`; };
    const generateBrazilianName = (): string => { const firstNames = ["Ana", "Beatriz", "Carlos", "Daniela", "Eduardo", "Fernanda", "Gustavo", "Helena", "Igor", "Juliana", "Lucas", "Mariana", "Nicolas", "Olivia", "Pedro", "Rafaela", "Sofia", "Thiago", "Valentina"]; const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho"]; return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`; };
    const specificProcedures = [ "Cirurgia de Catarata", "Cirurgia Refrativa (Miopia)", "Cirurgia Refrativa (Astigmatismo)", "Cirurgia de Pterígio", "Consulta Oftalmológica Geral", "Exame OCT", "Exame Topografia Corneana", "Tratamento Glaucoma", "Injeção Intravítrea", "Crosslinking" ];
    const gestores = ["Alice Rodrigues", "Bruno Carvalho", "Camila Lima"];
    const consultores = ["Diego Martins", "Elisa Gomes", "Fábio Costa"];
    const mockLoggedInUser = { id: "user-123", nome: "Consultor Logado Exemplo" };

    const generatePacientes = (count = 60): PacienteDataExtended[] => { /* ...código mantido... */ const pacientes: PacienteDataExtended[] = []; const testPhoneNumber = "5561981115413"; for (let i = 0; i < count; i++) { const stageIndex = i % pipelineStages.length; const stageName = pipelineStages[stageIndex].label; const currentHospital = hospitalNames[i % hospitalNames.length]; const doctorsForHospital = hospitalsData[currentHospital]; const currentDoctor = doctorsForHospital[Math.floor(Math.random() * doctorsForHospital.length)]; const birthYear = 1950 + Math.floor(Math.random() * 50); const birthMonth = Math.floor(Math.random() * 12); const birthDay = 1 + Math.floor(Math.random() * 28); const currentPhoneNumber = i === 0 ? testPhoneNumber : `55119${String(Math.random()).substring(2, 10)}`; const origem = ["Publicidade Digital", "Evento", "Publicidade Tradicional", "Indicação"][i % 4] as PacienteData['origem']; let marketingData: any = {}; switch (origem) { case "Publicidade Digital": marketingData = { fonte: ["Facebook", "Google Ads", "Instagram"][i % 3], campanha: `Campanha ${['Verão', 'Inverno', 'Institucional'][i % 3]} 2024`, conjunto: `Conjunto ${i % 5 + 1}`, tipoCriativo: ["Imagem", "Vídeo", "Carrossel"][i % 3], tituloCriativo: `Anúncio ${i % 10 + 1}`, palavraChave: Math.random() > 0.5 ? `oftalmologista ${['perto', 'consulta', 'cirurgia'][i % 3]}` : undefined, }; break; case "Publicidade Tradicional": marketingData = { fonte: ["Revista Veja", "TV Globo", "Rádio CBN"][i % 3], campanha: `Campanha Tradicional ${i % 2 + 1}`, }; break; case "Indicação": marketingData = { quemIndicou: generateBrazilianName(), dataIndicacao: new Date(2024, i % 12, (i % 28) + 1), telefoneIndicacao: `55119${String(Math.random()).substring(2, 10)}`, }; break; case "Evento": marketingData = { nomeEvento: `Feira de Saúde ${2023 + (i % 2)}`, dataEvento: new Date(2023 + (i % 2), 5 + (i % 6), (i % 28) + 1), descricaoEvento: `Evento realizado no ${['Shopping Center', 'Parque da Cidade'][i % 2]}.`, }; break; } pacientes.push({ id: `pac-${i + 1}`, nome: i === 0 ? "Paciente Teste" : generateBrazilianName(), hospital: currentHospital, medico: currentDoctor, valor: 1000 + Math.floor(Math.random() * 9000), convenio: ["Acesso Oftalmologia", "Bradesco", "Unimed", "SulAmérica", "Particular"][i % 5], telefone: currentPhoneNumber, dataNascimento: new Date(birthYear, birthMonth, birthDay), cpf: generateCPF(), telefone2: Math.random() > 0.7 ? `55119${String(Math.random()).substring(2, 10)}` : undefined, email: Math.random() > 0.4 ? `paciente.teste${i + 1}@email.com` : undefined, uf: ["SP", "RJ", "MG", "PR", "SC"][i % 5], cidade: ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Florianópolis"][i % 5], bairro: ["Centro", "Jardins", "Copacabana", "Savassi", "Batel"][i % 5], origem: origem, marketingData: marketingData, gestorResponsavel: gestores[i % gestores.length], consultorResponsavel: consultores[i % consultores.length], quemCriou: consultores[i % consultores.length], procedimentos: Array(1 + Math.floor(Math.random() * 3)).fill(null).map((_, j) => { const procHospital = currentHospital; const procDoctor = doctorsForHospital[Math.floor(Math.random() * doctorsForHospital.length)]; const procedureName = specificProcedures[Math.floor(Math.random() * specificProcedures.length)]; const procedureType = procedureName.includes("Consulta") ? "Consulta" : procedureName.includes("Exame") ? "Exame" : "Cirurgia"; const procedureStatus = ["pendente", "ganho", "perdido"][Math.floor(Math.random() * 3)]; const procYear = 2023 + Math.floor(Math.random() * 2); const procMonth = Math.floor(Math.random() * 12); const procDay = 1 + Math.floor(Math.random() * 28); return { id: `proc-${i + 1}-${j + 1}`, tipo: procedureType, hospital: procHospital, medico: procDoctor, procedimento: procedureName, valor: 300 + Math.floor(Math.random() * 4700), data: new Date(procYear, procMonth, procDay), observacao: Math.random() > 0.8 ? `Observação ${j + 1}` : "", convenio: ["Acesso Oftalmologia", "Bradesco", "Unimed", "SulAmérica", "Particular"][i % 5], status: procedureStatus, } }), historico: Array(1 + Math.floor(Math.random() * 5)).fill(null).map((_, j) => { const histYear = 2023 + Math.floor(Math.random() * 2); const histMonth = Math.floor(Math.random() * 12); const histDay = 1 + Math.floor(Math.random() * 28); const histHour = Math.floor(Math.random() * 24); const histMin = Math.floor(Math.random() * 60); return { id: `hist-${i + 1}-${j + 1}`, data: new Date(histYear, histMonth, histDay, histHour, histMin), tipo: ["Ligação", "Status", "Procedimento", "Criação", "Acompanhamento", "Alteração"][j % 6], descricao: `Registro ${j + 1}.`, usuario: ["Admin", "Consultor 1", "Sistema"][j % 3], }; }).sort((a, b) => b.data.getTime() - a.data.getTime()), status: stageName }); } return pacientes; };

    const Pacientes = () => {
      const [searchTerm, setSearchTerm] = useState("");
      const { toast } = useToast();
      const { apiConfig } = useApiConfig();
      const [pacientes, setPacientes] = useState<PacienteDataExtended[]>([]);
      const [isLoading, setIsLoading] = useState(true);
      const [isUpdating, setIsUpdating] = useState<string | null>(null);
      const [selectedPaciente, setSelectedPaciente] = useState<PacienteDataExtended | null>(null);
      const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
      // **REMOVER:** Estado de controle do modal de novo paciente
      // const [isNewPacienteModalOpen, setIsNewPacienteModalOpen] = useState(false);
      const [configuredProcedures] = useState<ProcedimentoConfig[]>(initialProcedimentos);

      const sensors = useSensors( useSensor(PointerSensor, { activationConstraint: { distance: 8 }, }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates, }) );

      useEffect(() => { setIsLoading(true); const timer = setTimeout(() => { setPacientes(generatePacientes(60)); setIsLoading(false); }, 1500); return () => clearTimeout(timer); }, []);
      useEffect(() => { console.log("[Pacientes Page] Received apiConfig:", apiConfig); if (!apiConfig?.apiUrl || !apiConfig?.apiKey || !apiConfig?.apiInstance) { console.warn("[Pacientes Page] API Config incomplete."); } }, [apiConfig]);

      const handleOpenDetailModal = (paciente: PacienteDataExtended) => { setSelectedPaciente(paciente); setIsDetailModalOpen(true); };
      const handleSavePaciente = async (updatedPaciente: PacienteDataExtended): Promise<void> => { console.log("[Pacientes Page] Saving edited:", updatedPaciente); await new Promise(resolve => setTimeout(resolve, 500)); setPacientes(prev => prev.map(p => p.id === updatedPaciente.id ? updatedPaciente : p)); console.log("[Pacientes Page] Local state updated."); };

      // **REMOVER:** handleOpenNewPacienteModal
      // const handleOpenNewPacienteModal = () => { setIsNewPacienteModalOpen(true); };

      // Salvar Novo Paciente (Callback do NewPacienteModal)
      const handleAddNewPacienteSave = async (
          newPacienteData: Omit<PacienteDataExtended, 'id' | 'status'>,
          closeModal?: () => void // Função opcional para fechar o modal
        ): Promise<void> => {
          console.log("[Pacientes Page] Saving new:", newPacienteData);
          // *** PLACEHOLDER PARA API CALL (POST) ***
          await new Promise(resolve => setTimeout(resolve, 500));

          const createdPaciente: PacienteDataExtended = {
              ...newPacienteData,
              id: `pac-${Date.now()}`,
              status: pipelineStages[0].label,
              consultorResponsavel: mockLoggedInUser.nome,
              quemCriou: mockLoggedInUser.nome,
              historico: [{ id: `hist-${Date.now()}`, data: new Date(), tipo: "Criação", descricao: `Lead criado por ${mockLoggedInUser.nome}.`, usuario: mockLoggedInUser.nome }, ...(newPacienteData.historico || [])]
          };

          setPacientes(prevPacientes => [createdPaciente, ...prevPacientes]);
          console.log("[Pacientes Page] New paciente added:", createdPaciente);
          toast({ title: "Paciente Criado", description: `"${createdPaciente.nome}" foi adicionado ao pipeline.` });
          closeModal?.(); // Chama a função para fechar, se fornecida
      };


      const filterPacientes = useCallback((pacientesToFilter: PacienteDataExtended[]) => { if (!searchTerm) return pacientesToFilter; const lowerSearchTerm = searchTerm.toLowerCase().trim(); if (!lowerSearchTerm) return pacientesToFilter; return pacientesToFilter.filter(p => p.nome.toLowerCase().includes(lowerSearchTerm) || p.telefone?.replace(/\D/g, '').includes(lowerSearchTerm.replace(/\D/g, '')) || p.cpf?.replace(/\D/g, '').includes(lowerSearchTerm.replace(/\D/g, '')) ); }, [searchTerm]);
      const handleDragEnd = async (event: DragEndEvent) => { /* ...código mantido... */ const { active, over } = event; if (over && active.id !== over.id) { const pacienteId = active.id as string; const targetStageId = over.id as string; const targetStage = pipelineStages.find(stage => stage.id === targetStageId); if (!targetStage) return; const newStatusLabel = targetStage.label; const originalPaciente = pacientes.find(p => p.id === pacienteId); const originalStatus = originalPaciente?.status; if (!originalPaciente) return; setPacientes(prev => prev.map(p => p.id === pacienteId ? { ...p, status: newStatusLabel } : p)); setIsUpdating(pacienteId); console.log(`[Pacientes Page] Movendo ${pacienteId} para ${newStatusLabel} (Otimista)`); try { console.log(`[Pacientes Page] Simulando API PATCH /api/pacientes/${pacienteId}/status com status=${newStatusLabel}`); await new Promise(resolve => setTimeout(resolve, 1000)); toast({ title: "Paciente Movido", description: `Status atualizado para "${newStatusLabel}".` }); } catch (error: any) { console.error(`[Pacientes Page] Erro DND ${pacienteId}:`, error); toast({ variant: "destructive", title: "Erro ao Mover", description: `Não foi possível atualizar o status. ${error.message || ''}` }); setPacientes(prev => prev.map(p => p.id === pacienteId ? { ...originalPaciente, status: originalStatus || p.status } : p)); } finally { setIsUpdating(null); } } };
      const calculateStageTotals = (stageLabel: string) => { /* ...código mantido... */ const pacientesInStage = pacientes.filter(p => p.status === stageLabel); let totalConsulta = 0, totalExame = 0, totalCirurgia = 0; pacientesInStage.forEach(pac => { pac.procedimentos?.forEach(proc => { if (proc.status === 'pendente' || proc.status === 'ganho') { if (proc.tipo === 'Consulta') totalConsulta += proc.valor || 0; else if (proc.tipo === 'Exame') totalExame += proc.valor || 0; else if (proc.tipo === 'Cirurgia') totalCirurgia += proc.valor || 0; } }); }); return { totalConsulta, totalExame, totalCirurgia }; };

      return (
        <AppShell>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 border-b sticky top-0 bg-background z-20"> <div className="container mx-auto"> <div className="flex flex-col sm:flex-row items-center justify-between gap-4"> <h1 className="text-2xl font-bold">Pipeline de Pacientes</h1> <div className="flex items-center w-full sm:w-auto gap-2"> <div className="relative flex-1 sm:flex-none sm:w-64"> <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /> <Input type="search" placeholder="Buscar por nome, tel ou CPF..." className="pl-8 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /> </div>

              {/* **CORREÇÃO:** Usar Dialog e DialogTrigger para o botão Novo Paciente */}
              <Dialog>
                  <DialogTrigger asChild>
                      {/* **REMOVIDO:** Fragmento desnecessário aqui */}
                      <Button>
                          <Plus className="h-4 w-4 mr-2" /> Novo Paciente
                      </Button>
                  </DialogTrigger>
                  {/* Renderizar o CONTEÚDO do modal aqui */}
                  <NewPacienteModal onSave={handleAddNewPacienteSave} />
              </Dialog>

              </div> </div> </div> </div>
              {/* Kanban Board */}
              <div className="flex-1 overflow-x-auto overflow-y-hidden">
                {isLoading ? ( <div className="flex items-center justify-center h-full"> <Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2 text-muted-foreground">Carregando...</span> </div>
                ) : pacientes.length === 0 && !searchTerm ? ( <div className="flex items-center justify-center h-full"> <p className="text-muted-foreground">Nenhum paciente.</p> </div>
                ) : (
                  <div className="kanban-container flex flex-nowrap h-full">
                    {pipelineStages.map((stage) => {
                      const pacientesNestaColuna = pacientes.filter(p => p.status === stage.label);
                      const pacientesFiltradosParaRenderizar = filterPacientes(pacientesNestaColuna);
                      const showTotals = stagesWithTotals.includes(stage.label);
                      const { totalConsulta, totalExame, totalCirurgia } = showTotals ? calculateStageTotals(stage.label) : { totalConsulta: 0, totalExame: 0, totalCirurgia: 0 };
                      return ( <PipelineColumn key={stage.id} id={stage.id} label={stage.label} pacientes={pacientesFiltradosParaRenderizar} apiConfig={apiConfig} totalConsulta={totalConsulta} totalExame={totalExame} totalCirurgia={totalCirurgia} showTotals={showTotals} onOpenPacienteModal={handleOpenDetailModal} searchTerm={searchTerm} /> );
                    })}
                  </div>
                )}
              </div>
            </div>
          </DndContext>
          {/* Modal de Detalhes (Controlado por estado separado) */}
          <PacienteDetailModal open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen} paciente={selectedPaciente} onSave={handleSavePaciente} configuredProcedures={configuredProcedures} />

          {/* **REMOVIDO:** Renderização separada do NewPacienteModal */}
          {/* <NewPacienteModal open={isNewPacienteModalOpen} onOpenChange={setIsNewPacienteModalOpen} onSave={handleAddNewPacienteSave} /> */}

        </AppShell>
      );
    };

    export default Pacientes;
