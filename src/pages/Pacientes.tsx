import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PacienteCard } from "@/components/pacientes/paciente-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Pipeline stages
const pipelineStages = [
  { id: "novo", label: "Novo" },
  { id: "contato", label: "Contato Realizado" },
  { id: "agendado", label: "Agendado" },
  { id: "atendido", label: "Atendido" },
  { id: "negociacao", label: "Em Negociação" },
  { id: "finalizado", label: "Finalizado" },
  { id: "perdido", label: "Perdido" },
  { id: "resgate", label: "Resgate" },
];

// Dados simulados de pacientes
const generatePacientes = (count = 50) => {
  const pacientes = [];
  
  for (let i = 0; i < count; i++) {
    // Distribuir pacientes entre os 8 estágios
    const stageIndex = i % 8;
    const stageName = pipelineStages[stageIndex].label;
    
    // Gerar dados aleatórios para cada paciente
    pacientes.push({
      id: `pac-${i}`,
      nome: `Paciente ${i + 1}`,
      hospital: `Hospital ${(i % 3) + 1}`,
      medico: `Dr. ${["Silva", "Santos", "Oliveira", "Costa", "Fernandes"][i % 5]} ${(i % 5) + 1}`,
      valor: 1000 + Math.floor(Math.random() * 5000),
      produtos: [
        ["Consulta", "Exame", "Cirurgia"][Math.floor(Math.random() * 3)],
        ...(Math.random() > 0.7 ? [["OCT", "Topografia", "Ceratometria"][Math.floor(Math.random() * 3)]] : [])
      ],
      convenio: ["Unimed", "Amil", "SulAmérica", "Bradesco", "Particular"][i % 5],
      telefone: `(11) 9${i % 10}${(i % 10) + 1}${i % 10}${(i % 10) + 1}-${i % 10}${(i % 10) + 1}${i % 10}${(i % 10) + 1}`,
      dataNascimento: new Date(1950 + (i % 50), i % 12, 1 + (i % 28)),
      cpf: `${100 + i}${200 + i}${300 + i}-${i % 10}${(i % 10) + 1}`,
      telefone2: Math.random() > 0.7 ? `(11) 9${i % 10}${(i % 10) + 2}${i % 10}${(i % 10) + 2}-${i % 10}${(i % 10) + 2}${i % 10}${(i % 10) + 2}` : undefined,
      email: Math.random() > 0.4 ? `paciente${i + 1}@email.com` : undefined,
      uf: "SP",
      cidade: ["São Paulo", "Campinas", "Santos", "São Bernardo", "Guarulhos"][i % 5],
      bairro: ["Centro", "Jardins", "Moema", "Pinheiros", "Itaim"][i % 5],
      origem: ["Publicidade Digital", "Evento", "Publicidade Tradicional", "Indicação"][i % 4],
      marketingData: {
        // Dados específicos baseados na origem
        fonte: ["Facebook", "Google", "Instagram", "Jornal", "TV"][i % 5],
        campanha: `Campanha ${(i % 3) + 1}`,
        conjunto: `Conjunto ${(i % 2) + 1}`,
        tipoCriativo: ["Imagem", "Vídeo", "Carrossel"][i % 3],
        tituloCriativo: `Título ${(i % 4) + 1}`,
        palavraChave: ["oftalmologista", "catarata", "cirurgia ocular", "consulta olhos"][i % 4],
        quemIndicou: `Paciente Indicador ${(i % 10) + 1}`,
        dataIndicacao: new Date(2023, i % 12, 1 + (i % 28)),
        telefoneIndicacao: `(11) 9${i % 10}${(i % 10) + 3}${i % 10}${(i % 10) + 3}-${i % 10}${(i % 10) + 3}${i % 10}${(i % 10) + 3}`,
        nomeEvento: `Evento ${(i % 3) + 1}`,
        dataEvento: new Date(2023, i % 12, 1 + (i % 28)),
        descricaoEvento: `Descrição do evento ${(i % 3) + 1}`,
      },
      procedimentos: Array(1 + (i % 3)).fill(null).map((_, j) => ({
        id: `proc-${i}-${j}`,
        tipo: ["Consulta", "Exame", "Cirurgia"][j % 3],
        hospital: `Hospital ${(i % 3) + 1}`,
        medico: `Dr. ${["Silva", "Santos", "Oliveira"][i % 3]}`,
        procedimento: ["Consulta Oftalmológica", "OCT", "Catarata", "Glaucoma", "Cirurgia Refrativa"][j % 5],
        valor: 500 + (j * 1000) + (i % 500),
        data: new Date(2023, 5 + (j % 3), 1 + (i % 28)),
        observacao: Math.random() > 0.7 ? `Observação ${j + 1}` : "",
        convenio: ["Unimed", "Amil", "SulAmérica", "Bradesco", "Particular"][i % 5],
        status: ["pendente", "ganho", "perdido"][j % 3],
      })),
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

const pacientes = generatePacientes(50);

// Agrupar pacientes por estágio
const getPacientesByStage = (stage: string) => {
  return pacientes.filter(p => p.status === stage);
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
          <div className="kanban-container">
            {pipelineStages.map((stage) => (
              <div key={stage.id} className="pipeline-column">
                <h3 className="font-medium text-sm mb-3 px-1">
                  {stage.label}
                  <span className="text-xs text-muted-foreground ml-2">
                    ({getPacientesByStage(stage.label).length})
                  </span>
                </h3>
                <div className="space-y-3">
                  {getPacientesByStage(stage.label)
                    .filter(p => 
                      searchTerm === "" || 
                      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.telefone.includes(searchTerm)
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
