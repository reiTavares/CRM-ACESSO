import { useState, useEffect, useCallback } from "react";
    import { AppShell } from "@/components/layout/app-shell";
    import { PacienteData } from "@/components/pacientes/paciente-card"; // Ensure PacienteData is exported from here or a shared types file
    import { PipelineColumn } from "@/components/pacientes/PipelineColumn";
    import { Button } from "@/components/ui/button";
    import { Input } from "@/components/ui/input";
    import { Plus, Search } from "lucide-react";
    import { useToast } from "@/hooks/use-toast";
    import { useApiConfig } from "@/contexts/ApiConfigContext";
    import {
      DndContext,
      closestCenter,
      PointerSensor,
      KeyboardSensor,
      useSensor,
      useSensors,
      DragEndEvent,
      MouseSensor,
      TouchSensor,
    } from '@dnd-kit/core';
    import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

    const pipelineStages = [
      { id: "lead", label: "Lead Recebido" },
      { id: "tentativa", label: "Tentativa de Contato" },
      { id: "contato", label: "Contato Realizado" },
      { id: "agendamento_consulta", label: "Agendamento de Consulta" },
      { id: "consulta_realizada", label: "Consulta Realizada" },
      { id: "agendamento_exames", label: "Agendamento de Exames" },
      { id: "exames_realizados", label: "Exames Realizados" },
      { id: "agendamento_cirurgia_smc", label: "Agendamento Cirurgia (SMC)" },
      { id: "cirurgia_1_olho", label: "1º Olho - Cirurgia Realizada" },
      { id: "agendamento_cirurgia_2_olho", label: "Agendamento Cirurgia 2º Olho" },
      { id: "cirurgia_2_olho", label: "2º Olho - Cirurgia Realizada" },
      { id: "resgate", label: "Resgate" },
    ];

    const stagesWithTotals = [
      "Agendamento de Consulta",
      "Consulta Realizada",
      "Agendamento de Exames",
      "Exames Realizados",
      "Agendamento Cirurgia (SMC)",
      "1º Olho - Cirurgia Realizada",
      "Agendamento Cirurgia 2º Olho",
      "2º Olho - Cirurgia Realizada",
    ];

    // --- Sample Data Generation (Modified) ---
    const hospitalsData: Record<string, string[]> = { "HODF": ["Dr. João Silva", "Dra. Ana Costa"], "HO Londrina": ["Dr. Carlos Souza", "Dra. Beatriz Lima"], "HO Maringa": ["Dra. Mariana Ferreira", "Dr. Gustavo Pereira"], "HOA": ["Dr. Lucas Gomes", "Dra. Julia Almeida"] };
    const hospitalNames = Object.keys(hospitalsData);
    const generateCPF = (): string => { const rnd = (n: number) => Math.round(Math.random() * n); const n = Array(9).fill(0).map(() => rnd(9)); let d1 = n.map((v, i) => v * (10 - i)).reduce((acc, v) => acc + v, 0) % 11; d1 = d1 < 2 ? 0 : 11 - d1; n.push(d1); let d2 = n.map((v, i) => v * (11 - i)).reduce((acc, v) => acc + v, 0) % 11; d2 = d2 < 2 ? 0 : 11 - d2; n.push(d2); return `${n.slice(0, 3).join('')}.${n.slice(3, 6).join('')}.${n.slice(6, 9).join('')}-${n.slice(9).join('')}`; };
    const generateBrazilianName = (): string => { const firstNames = ["Ana", "Beatriz", "Carlos", "Daniela", "Eduardo", "Fernanda", "Gustavo", "Helena", "Igor", "Juliana", "Lucas", "Mariana", "Nicolas", "Olivia", "Pedro", "Rafaela", "Sofia", "Thiago", "Valentina"]; const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho"]; return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`; };
    const specificProcedures = [ "Cirurgia de Catarata", "Cirurgia Refrativa (Miopia)", "Cirurgia Refrativa (Astigmatismo)", "Cirurgia de Pterígio", "Consulta Oftalmológica Geral", "Exame OCT", "Exame Topografia Corneana", "Tratamento Glaucoma", "Injeção Intravítrea", "Crosslinking" ];
    const gestores = ["Alice Rodrigues", "Bruno Carvalho", "Camila Lima"];
    const consultores = ["Diego Martins", "Elisa Gomes", "Fábio Costa"]; // Simula usuários logados

    const generatePacientes = (count = 60): PacienteData[] => {
        const pacientes: PacienteData[] = [];
        const testPhoneNumber = "5561981115413"; // User's test number

        for (let i = 0; i < count; i++) {
            const stageIndex = i % pipelineStages.length;
            const stageName = pipelineStages[stageIndex].label;
            const currentHospital = hospitalNames[i % hospitalNames.length];
            const doctorsForHospital = hospitalsData[currentHospital];
            const currentDoctor = doctorsForHospital[Math.floor(Math.random() * doctorsForHospital.length)];
            const birthYear = 1950 + Math.floor(Math.random() * 50);
            const birthMonth = Math.floor(Math.random() * 12);
            const birthDay = 1 + Math.floor(Math.random() * 28);
            const currentPhoneNumber = i === 0 ? testPhoneNumber : `55119${String(Math.random()).substring(2, 10)}`;
            const origem = ["Publicidade Digital", "Evento", "Publicidade Tradicional", "Indicação"][i % 4] as PacienteData['origem'];

            // Generate Marketing Data based on Origem
            let marketingData: any = {};
            switch (origem) {
                case "Publicidade Digital":
                    marketingData = {
                        fonte: ["Facebook", "Google Ads", "Instagram"][i % 3],
                        campanha: `Campanha ${['Verão', 'Inverno', 'Institucional'][i % 3]} 2024`,
                        conjunto: `Conjunto ${i % 5 + 1}`,
                        tipoCriativo: ["Imagem", "Vídeo", "Carrossel"][i % 3],
                        tituloCriativo: `Anúncio ${i % 10 + 1}`,
                        palavraChave: Math.random() > 0.5 ? `oftalmologista ${['perto', 'consulta', 'cirurgia'][i % 3]}` : undefined,
                    };
                    break;
                case "Publicidade Tradicional":
                     marketingData = {
                         fonte: ["Revista Veja", "TV Globo", "Rádio CBN"][i % 3],
                         campanha: `Campanha Tradicional ${i % 2 + 1}`,
                     };
                     break;
                case "Indicação":
                    marketingData = {
                        quemIndicou: generateBrazilianName(),
                        dataIndicacao: new Date(2024, i % 12, (i % 28) + 1),
                        telefoneIndicacao: `55119${String(Math.random()).substring(2, 10)}`,
                    };
                    break;
                case "Evento":
                    marketingData = {
                        nomeEvento: `Feira de Saúde ${2023 + (i % 2)}`,
                        dataEvento: new Date(2023 + (i % 2), 5 + (i % 6), (i % 28) + 1),
                        descricaoEvento: `Evento realizado no ${['Shopping Center', 'Parque da Cidade'][i % 2]}.`,
                    };
                    break;
            }

            pacientes.push({
                id: `pac-${i + 1}`,
                nome: i === 0 ? "Paciente Teste" : generateBrazilianName(),
                hospital: currentHospital,
                medico: currentDoctor,
                valor: 1000 + Math.floor(Math.random() * 9000), // Valor geral (pode ser removido se procedimentos sempre tiverem valor)
                convenio: ["Acesso Oftalmologia", "Bradesco", "Unimed", "SulAmérica", "Particular"][i % 5],
                telefone: currentPhoneNumber,
                dataNascimento: new Date(birthYear, birthMonth, birthDay),
                cpf: generateCPF(),
                telefone2: Math.random() > 0.7 ? `55119${String(Math.random()).substring(2, 10)}` : undefined,
                email: Math.random() > 0.4 ? `paciente.teste${i + 1}@email.com` : undefined,
                uf: ["SP", "RJ", "MG", "PR", "SC"][i % 5],
                cidade: ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Florianópolis"][i % 5],
                bairro: ["Centro", "Jardins", "Copacabana", "Savassi", "Batel"][i % 5],
                origem: origem,
                marketingData: marketingData, // Add generated marketing data
                gestorResponsavel: gestores[i % gestores.length], // Add gestor
                consultorResponsavel: consultores[i % consultores.length], // Add consultor (simulates logged-in user for now)
                procedimentos: Array(1 + Math.floor(Math.random() * 3)).fill(null).map((_, j) => { const procedureName = specificProcedures[Math.floor(Math.random() * specificProcedures.length)]; const procedureType = procedureName.includes("Consulta") ? "Consulta" : procedureName.includes("Exame") ? "Exame" : "Cirurgia"; const procedureStatus = ["pendente", "ganho", "perdido"][Math.floor(Math.random() * 3)]; const procedureDoctor = doctorsForHospital[Math.floor(Math.random() * doctorsForHospital.length)]; const procYear = 2023 + Math.floor(Math.random() * 2); const procMonth = Math.floor(Math.random() * 12); const procDay = 1 + Math.floor(Math.random() * 28); return { id: `proc-${i + 1}-${j + 1}`, tipo: procedureType, hospital: currentHospital, medico: procedureDoctor, procedimento: procedureName, valor: 300 + Math.floor(Math.random() * 4700), data: new Date(procYear, procMonth, procDay), observacao: Math.random() > 0.8 ? `Observação ${j + 1}` : "", convenio: ["Acesso Oftalmologia", "Bradesco", "Unimed", "SulAmérica", "Particular"][i % 5], status: procedureStatus, } }),
                historico: Array(1 + Math.floor(Math.random() * 5)).fill(null).map((_, j) => { const histYear = 2023 + Math.floor(Math.random() * 2); const histMonth = Math.floor(Math.random() * 12); const histDay = 1 + Math.floor(Math.random() * 28); const histHour = Math.floor(Math.random() * 24); const histMin = Math.floor(Math.random() * 60); return { id: `hist-${i + 1}-${j + 1}`, data: new Date(histYear, histMonth, histDay, histHour, histMin), tipo: ["Ligação", "Status", "Procedimento", "Criação", "Acompanhamento", "Alteração"][j % 6], descricao: `Registro ${j + 1}.`, usuario: ["Admin", "Consultor 1", "Sistema"][j % 3], }; }).sort((a, b) => b.data.getTime() - a.data.getTime()),
                status: stageName
            });
        }
        return pacientes;
    };
    // --- End Sample Data Generation ---

    const Pacientes = () => {
      const [searchTerm, setSearchTerm] = useState("");
      const { toast } = useToast();
      const { apiConfig } = useApiConfig();
      const [pacientes, setPacientes] = useState<PacienteData[]>(() => generatePacientes(60));

      const sensors = useSensors(
        useSensor(PointerSensor, {
          activationConstraint: { distance: 10, },
        }),
        useSensor(TouchSensor, {
          activationConstraint: { delay: 250, tolerance: 5, },
        }),
        useSensor(KeyboardSensor, {
          coordinateGetter: sortableKeyboardCoordinates,
        })
      );

      useEffect(() => {
          console.log("[Pacientes Page] Received apiConfig from context:", apiConfig);
          if (!apiConfig?.apiUrl || !apiConfig?.apiKey || !apiConfig?.apiInstance) {
              console.warn("[Pacientes Page] API Config from context seems incomplete.");
          }
      }, [apiConfig]);

      const handleAddNewPaciente = () => {
        toast({
          title: "Funcionalidade em desenvolvimento",
          description: "O cadastro de novos pacientes estará disponível em breve.",
        });
      };

      const filterPacientes = useCallback((pacientesToFilter: PacienteData[]) => {
          if (!searchTerm) {
              return pacientesToFilter;
          }
          const lowerSearchTerm = searchTerm.toLowerCase();
          return pacientesToFilter.filter(p =>
              p.nome.toLowerCase().includes(lowerSearchTerm) ||
              p.telefone?.includes(searchTerm) ||
              p.cpf?.includes(searchTerm)
          );
      }, [searchTerm]);

      const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
          const pacienteId = active.id as string;
          const targetStageId = over.id as string;

          const targetStage = pipelineStages.find(stage => stage.id === targetStageId);
          if (!targetStage) {
            console.error(`Target stage with id ${targetStageId} not found!`);
            return;
          }
          const newStatusLabel = targetStage.label;

          setPacientes((prevPacientes) =>
            prevPacientes.map((p) =>
              p.id === pacienteId ? { ...p, status: newStatusLabel } : p
            )
          );

          console.log(`Patient ${pacienteId} moved to stage ${newStatusLabel}`);
          toast({
              title: "Paciente Movido",
              description: `Paciente movido para a etapa "${newStatusLabel}".`
          })
        }
      };

      const calculateStageTotals = (stageLabel: string) => {
          const pacientesInStage = pacientes.filter(p => p.status === stageLabel);
          let totalConsulta = 0;
          let totalExame = 0;
          let totalCirurgia = 0;

          pacientesInStage.forEach(paciente => {
              paciente.procedimentos?.forEach(proc => {
                  // Consider only 'ganho' (won) or 'pendente' (pending) for totals
                  if (proc.status === 'pendente' || proc.status === 'ganho') {
                      if (proc.tipo === 'Consulta') {
                          totalConsulta += proc.valor || 0;
                      } else if (proc.tipo === 'Exame') {
                          totalExame += proc.valor || 0;
                      } else if (proc.tipo === 'Cirurgia') {
                          totalCirurgia += proc.valor || 0;
                      }
                  }
              });
          });

          return { totalConsulta, totalExame, totalCirurgia };
      };

      return (
        <AppShell>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 border-b sticky top-0 bg-background z-20">
                <div className="container mx-auto">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold">Pacientes</h1>
                    <div className="flex items-center w-full sm:w-auto gap-2">
                      <div className="relative flex-1 sm:flex-none sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar paciente..."
                          className="pl-8 w-full"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleAddNewPaciente}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kanban Board */}
              <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="kanban-container flex flex-nowrap h-full">
                  {pipelineStages.map((stage) => {
                    const pacientesInStageRaw = pacientes.filter(p => p.status === stage.label);
                    const filteredPacientesInStage = filterPacientes(pacientesInStageRaw);
                    const showTotals = stagesWithTotals.includes(stage.label);
                    const { totalConsulta, totalExame, totalCirurgia } = showTotals
                      ? calculateStageTotals(stage.label)
                      : { totalConsulta: 0, totalExame: 0, totalCirurgia: 0 };

                    return (
                      <PipelineColumn
                        key={stage.id}
                        id={stage.id}
                        label={stage.label}
                        pacientes={filteredPacientesInStage}
                        apiConfig={apiConfig} // Pass config to column -> card -> modal -> whatsapp
                        totalConsulta={totalConsulta}
                        totalExame={totalExame}
                        totalCirurgia={totalCirurgia}
                        showTotals={showTotals}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </DndContext>
        </AppShell>
      );
    };

    export default Pacientes;
