import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PacienteCard, PacienteData } from "@/components/pacientes/paciente-card"; // Import PacienteData type
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

// --- New Sample Data for Hospitals and Doctors ---
const hospitalsData: Record<string, string[]> = {
  "HODF": ["Dr. João Silva", "Dra. Ana Costa", "Dr. Pedro Martins", "Dra. Carla Dias"],
  "HO Londrina": ["Dr. Carlos Souza", "Dra. Beatriz Lima", "Dr. Ricardo Alves", "Dra. Fernanda Vieira"],
  "HO Maringa": ["Dra. Mariana Ferreira", "Dr. Gustavo Pereira", "Dra. Sofia Ribeiro", "Dr. André Mendes"],
  "HOA": ["Dr. Lucas Gomes", "Dra. Julia Almeida", "Dr. Matheus Barbosa", "Dra. Isabela Castro"]
};
const hospitalNames = Object.keys(hospitalsData);
// --- End New Sample Data ---

// Helper function to generate random CPF
const generateCPF = (): string => {
  const rnd = (n: number) => Math.round(Math.random() * n);
  const n = Array(9).fill(0).map(() => rnd(9));

  let d1 = n.map((v, i) => v * (10 - i)).reduce((acc, v) => acc + v, 0) % 11;
  d1 = d1 < 2 ? 0 : 11 - d1;
  n.push(d1);

  let d2 = n.map((v, i) => v * (11 - i)).reduce((acc, v) => acc + v, 0) % 11;
  d2 = d2 < 2 ? 0 : 11 - d2;
  n.push(d2);

  return `${n.slice(0, 3).join('')}.${n.slice(3, 6).join('')}.${n.slice(6, 9).join('')}-${n.slice(9).join('')}`;
};

// Helper function to generate random Brazilian names
const generateBrazilianName = (): string => {
  const firstNames = ["Ana", "Beatriz", "Carlos", "Daniela", "Eduardo", "Fernanda", "Gustavo", "Helena", "Igor", "Juliana", "Lucas", "Mariana", "Nicolas", "Olivia", "Pedro", "Rafaela", "Sofia", "Thiago", "Valentina", "Wagner", "Xavier", "Yasmin", "Zilda", "Arthur", "Bianca", "Caio", "Debora", "Enzo", "Gabriela", "Heitor", "Isabela", "Joao", "Larissa", "Miguel", "Natalia"];
  const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Melo", "Barbosa", "Nunes", "Cardoso", "Teixeira", "Correia", "Dias", "Vieira", "Mendes", "Freitas", "Araujo", "Castro"];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
};

// Specific procedure names
const specificProcedures = [
    "Cirurgia de Catarata", 
    "Cirurgia Refrativa (Miopia)", 
    "Cirurgia Refrativa (Astigmatismo)", 
    "Cirurgia de Pterígio", 
    "Consulta Oftalmológica Geral", 
    "Exame OCT", 
    "Exame Topografia Corneana", 
    "Tratamento Glaucoma",
    "Injeção Intravítrea",
    "Crosslinking"
];

// Dados simulados de pacientes - Updated
const generatePacientes = (count = 50): PacienteData[] => { 
  const pacientes: PacienteData[] = []; 

  for (let i = 0; i < count; i++) {
    const stageIndex = i % pipelineStages.length;
    const stageName = pipelineStages[stageIndex].label;
    
    // Assign hospital and corresponding doctor
    const currentHospital = hospitalNames[i % hospitalNames.length]; 
    const doctorsForHospital = hospitalsData[currentHospital];
    const currentDoctor = doctorsForHospital[Math.floor(Math.random() * doctorsForHospital.length)];

    pacientes.push({
      id: `pac-${i}`,
      nome: generateBrazilianName(), 
      hospital: currentHospital, // Use new hospital names
      medico: currentDoctor, // Use doctor linked to hospital
      valor: 1000 + Math.floor(Math.random() * 5000),
      convenio: Math.random() < 0.8 ? "Acesso Oftalmologia" : "Bradesco", 
      telefone: `(11) 9${String(Math.random()).substring(2, 6)}-${String(Math.random()).substring(2, 6)}`, 
      dataNascimento: new Date(1950 + (i % 50), i % 12, 1 + (i % 28)),
      cpf: generateCPF(), 
      telefone2: Math.random() > 0.7 ? `(11) 9${String(Math.random()).substring(2, 6)}-${String(Math.random()).substring(2, 6)}` : undefined,
      email: Math.random() > 0.4 ? `paciente.teste${i + 1}@email.com` : undefined, 
      uf: "SP",
      cidade: ["São Paulo", "Campinas", "Santos", "São Bernardo", "Guarulhos"][i % 5],
      bairro: ["Centro", "Jardins", "Moema", "Pinheiros", "Itaim"][i % 5],
      origem: ["Publicidade Digital", "Evento", "Publicidade Tradicional", "Indicação"][i % 4],
      marketingData: { /* ... marketing data ... */ },
      procedimentos: Array(1 + (i % 3)).fill(null).map((_, j) => {
          const procedureName = specificProcedures[Math.floor(Math.random() * specificProcedures.length)];
          const procedureType = procedureName.includes("Consulta") ? "Consulta" : procedureName.includes("Exame") ? "Exame" : "Cirurgia";
          const procedureStatus = ["pendente", "ganho", "perdido"][j % 3]; 
          const procedureDoctor = doctorsForHospital[Math.floor(Math.random() * doctorsForHospital.length)]; // Assign a doctor from the same hospital
          return {
            id: `proc-${i}-${j}`,
            tipo: procedureType,
            hospital: currentHospital, // Use the patient's main hospital
            medico: procedureDoctor, // Use doctor from the same hospital
            procedimento: procedureName, 
            valor: 500 + (j * 1000) + (i % 500),
            data: new Date(2023, 5 + (j % 3), 1 + (i % 28)),
            observacao: Math.random() > 0.7 ? `Observação ${j + 1}` : "",
            convenio: Math.random() < 0.8 ? "Acesso Oftalmologia" : "Bradesco",
            status: procedureStatus,
          }
      }),
      historico: Array(2 + (i % 4)).fill(null).map((_, j) => ({
        id: `hist-${i}-${j}`,
        data: new Date(2023, 5, 1 + j + (i % 15)),
        tipo: ["Ligação", "Status", "Procedimento", "Criação", "Acompanhamento"][j % 5],
        descricao: `Descrição do histórico ${j + 1} para o paciente ${i + 1}`,
        usuario: "Admin",
      })),
      status: stageName 
    });
  }

  return pacientes;
};

const allPacientes = generatePacientes(60); // Generate more patients for 12 stages

const getPacientesByStage = (stageLabel: string): PacienteData[] => { 
  return allPacientes.filter(p => p.status === stageLabel);
};

const Pacientes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleAddNewPaciente = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O cadastro de novos pacientes estará disponível em breve.",
    });
  };

  return (
    <AppShell>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h1 className="text-2xl font-bold">Pacientes</h1>
              <div className="flex items-center w-full sm:w-auto gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar paciente..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select defaultValue="todos">
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filtrar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="este-mes">Este mês</SelectItem>
                    <SelectItem value="ultima-semana">Última semana</SelectItem>
                    <SelectItem value="hoje">Hoje</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddNewPaciente}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="kanban-container flex flex-nowrap"> 
            {pipelineStages.map((stage) => (
              <div key={stage.id} className="pipeline-column flex-shrink-0"> 
                <h3 className="font-medium text-sm mb-3 px-1 sticky top-0 bg-muted/30 z-10 pt-1 pb-1"> 
                  {stage.label}
                  <span className="text-xs text-muted-foreground ml-2">
                    ({getPacientesByStage(stage.label).length})
                  </span>
                </h3>
                <div className="space-y-3 pt-1"> 
                  {getPacientesByStage(stage.label)
                    .filter(p =>
                      searchTerm === "" ||
                      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.telefone.includes(searchTerm) ||
                      p.cpf.includes(searchTerm) 
                    )
                    .map((paciente) => (
                      <PacienteCard key={paciente.id} paciente={paciente} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Pacientes;
