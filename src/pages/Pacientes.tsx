import { useState, useEffect, useCallback } from "react"; // Added useCallback
import { AppShell } from "@/components/layout/app-shell";
// Removed PacienteCard import, now rendered inside PipelineColumn
import { PacienteData } from "@/components/pacientes/paciente-card"; // Keep type import
import { PipelineColumn } from "@/components/pacientes/PipelineColumn"; // Import new component
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
  DragEndEvent, // Import DragEndEvent type
  MouseSensor, // Import MouseSensor
  TouchSensor, // Import TouchSensor
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'; // For keyboard accessibility

// Updated Pipeline stages (12 stages)
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

// Stages where totals should be shown
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

// --- Sample Data Generation (Keep as before) ---
const hospitalsData: Record<string, string[]> = { "HODF": ["Dr. João Silva", "Dra. Ana Costa"], "HO Londrina": ["Dr. Carlos Souza", "Dra. Beatriz Lima"], "HO Maringa": ["Dra. Mariana Ferreira", "Dr. Gustavo Pereira"], "HOA": ["Dr. Lucas Gomes", "Dra. Julia Almeida"] };
const hospitalNames = Object.keys(hospitalsData);
const generateCPF = (): string => { const rnd = (n: number) => Math.round(Math.random() * n); const n = Array(9).fill(0).map(() => rnd(9)); let d1 = n.map((v, i) => v * (10 - i)).reduce((acc, v) => acc + v, 0) % 11; d1 = d1 < 2 ? 0 : 11 - d1; n.push(d1); let d2 = n.map((v, i) => v * (11 - i)).reduce((acc, v) => acc + v, 0) % 11; d2 = d2 < 2 ? 0 : 11 - d2; n.push(d2); return `${n.slice(0, 3).join('')}.${n.slice(3, 6).join('')}.${n.slice(6, 9).join('')}-${n.slice(9).join('')}`; };
const generateBrazilianName = (): string => { const firstNames = ["Ana", "Beatriz", "Carlos", "Daniela", "Eduardo", "Fernanda", "Gustavo", "Helena", "Igor", "Juliana", "Lucas", "Mariana", "Nicolas", "Olivia", "Pedro", "Rafaela", "Sofia", "Thiago", "Valentina"]; const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho"]; return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`; };
const specificProcedures = [ "Cirurgia de Catarata", "Cirurgia Refrativa (Miopia)", "Cirurgia Refrativa (Astigmatismo)", "Cirurgia de Pterígio", "Consulta Oftalmológica Geral", "Exame OCT", "Exame Topografia Corneana", "Tratamento Glaucoma", "Injeção Intravítrea", "Crosslinking" ];
const generatePacientes = (count = 60): PacienteData[] => { const pacientes: PacienteData[] = []; for (let i = 0; i < count; i++) { const stageIndex = i % pipelineStages.length; const stageName = pipelineStages[stageIndex].label; const currentHospital = hospitalNames[i % hospitalNames.length]; const doctorsForHospital = hospitalsData[currentHospital]; const currentDoctor = doctorsForHospital[Math.floor(Math.random() * doctorsForHospital.length)]; const birthYear = 1950 + Math.floor(Math.random() * 50); const birthMonth = Math.floor(Math.random() * 12); const birthDay = 1 + Math.floor(Math.random() * 28); pacientes.push({ id: `pac-${i + 1}`, nome: generateBrazilianName(), hospital: currentHospital, medico: currentDoctor, valor: 1000 + Math.floor(Math.random() * 9000), convenio: ["Acesso Oftalmologia", "Bradesco", "Unimed", "SulAmérica", "Particular"][i % 5], telefone: `55119${String(Math.random()).substring(2, 10)}`, dataNascimento: new Date(birthYear, birthMonth, birthDay), cpf: generateCPF(), telefone2: Math.random() > 0.7 ? `55119${String(Math.random()).substring(2, 10)}` : undefined, email: Math.random() > 0.4 ? `paciente.teste${i + 1}@email.com` : undefined, uf: ["SP", "RJ", "MG", "PR", "SC"][i % 5], cidade: ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Florianópolis"][i % 5], bairro: ["Centro", "Jardins", "Copacabana", "Savassi", "Batel"][i % 5], origem: ["Publicidade Digital", "Evento", "Publicidade Tradicional", "Indicação"][i % 4], marketingData: {}, procedimentos: Array(1 + Math.floor(Math.random() * 3)).fill(null).map((_, j) => { const procedureName = specificProcedures[Math.floor(Math.random() * specificProcedures.length)]; const procedureType = procedureName.includes("Consulta") ? "Consulta" : procedureName.includes("Exame") ? "Exame" : "Cirurgia"; const procedureStatus = ["pendente", "ganho", "perdido"][Math.floor(Math.random() * 3)]; const procedureDoctor = doctorsForHospital[Math.floor(Math.random() * doctorsForHospital.length)]; const procYear = 2023 + Math.floor(Math.random() * 2); const procMonth = Math.floor(Math.random() * 12); const procDay = 1 + Math.floor(Math.random() * 28); return { id: `proc-${i + 1}-${j + 1}`, tipo: procedureType, hospital: currentHospital, medico: procedureDoctor, procedimento: procedureName, valor: 300 + Math.floor(Math.random() * 4700), data: new Date(procYear, procMonth, procDay), observacao: Math.random() > 0.8 ? `Observação ${j + 1}` : "", convenio: ["Acesso Oftalmologia", "Bradesco", "Unimed", "SulAmérica", "Particular"][i % 5], status: procedureStatus, } }), historico: Array(1 + Math.floor(Math.random() * 5)).fill(null).map((_, j) => { const histYear = 2023 + Math.floor(Math.random() * 2); const histMonth = Math.floor(Math.random() * 12); const histDay = 1 + Math.floor(Math.random() * 28); const histHour = Math.floor(Math.random() * 24); const histMin = Math.floor(Math.random() * 60); return { id: `hist-${i + 1}-${j + 1}`, data: new Date(histYear, histMonth, histDay, histHour, histMin), tipo: ["Ligação", "Status", "Procedimento", "Criação", "Acompanhamento", "Alteração"][j % 6], descricao: `Registro ${j + 1}.`, usuario: ["Admin", "Consultor 1", "Sistema"][j % 3], }; }).sort((a, b) => b.data.getTime() - a.data.getTime()), status: stageName }); } return pacientes; };
// --- End Sample Data Generation ---

const Pacientes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { apiConfig } = useApiConfig();
  // Use state to manage the list of patients for DnD updates
  const [pacientes, setPacientes] = useState<PacienteData[]>(() => generatePacientes(60));

  // Configure DnD sensors with activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require the mouse to move by 10 pixels before activating
      // Or press and hold for 250ms
      activationConstraint: {
        distance: 10, // Pixels
        // delay: 250, // Milliseconds - uncomment if you prefer delay-based activation
        // tolerance: 5, // Pixels tolerance for delay activation
      },
    }),
    useSensor(TouchSensor, {
      // Press delay for touch devices
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
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

  // Filter patients based on search term (operates on the current state)
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
  }, [searchTerm]); // Dependency on searchTerm

  // --- Drag End Handler ---
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Check if dropped over a valid droppable area and it's different from the start
    if (over && active.id !== over.id) {
      const pacienteId = active.id as string;
      const targetStageId = over.id as string; // This is the stage.id

      // Find the label of the target stage
      const targetStage = pipelineStages.find(stage => stage.id === targetStageId);
      if (!targetStage) {
        console.error(`Target stage with id ${targetStageId} not found!`);
        return;
      }
      const newStatusLabel = targetStage.label;

      // Update the patient's status in the state
      setPacientes((prevPacientes) =>
        prevPacientes.map((p) =>
          p.id === pacienteId ? { ...p, status: newStatusLabel } : p
        )
      );

      // Optional: Add a history entry or make an API call here to persist the change
      console.log(`Patient ${pacienteId} moved to stage ${newStatusLabel}`);
      toast({
          title: "Paciente Movido",
          description: `Paciente movido para a etapa "${newStatusLabel}".`
      })
    }
  };
  // --- End Drag End Handler ---

  // --- Calculate Stage Totals ---
  const calculateStageTotals = (stageLabel: string) => {
      const pacientesInStage = pacientes.filter(p => p.status === stageLabel);
      let totalConsulta = 0;
      let totalExame = 0;
      let totalCirurgia = 0;

      pacientesInStage.forEach(paciente => {
          paciente.procedimentos?.forEach(proc => {
              // Sum only 'pendente' or 'ganho' procedures for potential value
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
  // --- End Calculate Stage Totals ---

  return (
    <AppShell>
      {/* Wrap the interactive part with DndContext */}
      <DndContext
        sensors={sensors} // Use the configured sensors
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
                // Filter patients for the current stage *before* applying search term filter
                const pacientesInStageRaw = pacientes.filter(p => p.status === stage.label);
                // Apply search term filter to the patients already in this stage
                const filteredPacientesInStage = filterPacientes(pacientesInStageRaw);
                // Calculate totals based on *all* patients in the stage (before search filter)
                const showTotals = stagesWithTotals.includes(stage.label);
                const { totalConsulta, totalExame, totalCirurgia } = showTotals
                  ? calculateStageTotals(stage.label)
                  : { totalConsulta: 0, totalExame: 0, totalCirurgia: 0 };

                return (
                  <PipelineColumn
                    key={stage.id}
                    id={stage.id} // Pass stage.id for droppable
                    label={stage.label}
                    // Pass only the filtered patients to the column for rendering
                    pacientes={filteredPacientesInStage}
                    apiConfig={apiConfig}
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
