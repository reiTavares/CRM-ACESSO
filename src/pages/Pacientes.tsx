import { useState, useEffect } from "react";
      import { AppShell } from "@/components/layout/app-shell";
      import { PacienteCard, PacienteData } from "@/components/pacientes/paciente-card";
      import { Button } from "@/components/ui/button";
      import { Input } from "@/components/ui/input";
      import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
      import { Plus, Search } from "lucide-react";
      import { useToast } from "@/hooks/use-toast";
      import { ScrollArea } from "@/components/ui/scroll-area";
      import { useApiConfig } from "@/contexts/ApiConfigContext"; // Import the context hook

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

      const specificProcedures = [ "Cirurgia de Catarata", "Cirurgia Refrativa (Miopia)", "Cirurgia Refrativa (Astigmatismo)", "Cirurgia de Pterígio", "Consulta Oftalmológica Geral", "Exame OCT", "Exame Topografia Corneana", "Tratamento Glaucoma", "Injeção Intravítrea", "Crosslinking" ];

      // Dados simulados de pacientes - Updated
      const generatePacientes = (count = 60): PacienteData[] => { // Increased count for more data
        const pacientes: PacienteData[] = [];
        for (let i = 0; i < count; i++) {
          const stageIndex = i % pipelineStages.length;
          const stageName = pipelineStages[stageIndex].label;
          const currentHospital = hospitalNames[i % hospitalNames.length];
          const doctorsForHospital = hospitalsData[currentHospital];
          const currentDoctor = doctorsForHospital[Math.floor(Math.random() * doctorsForHospital.length)];
          const birthYear = 1950 + Math.floor(Math.random() * 50); // Random year between 1950 and 1999
          const birthMonth = Math.floor(Math.random() * 12); // 0-11
          const birthDay = 1 + Math.floor(Math.random() * 28); // 1-28 for simplicity

          pacientes.push({
            id: `pac-${i + 1}`, // Start ID from 1
            nome: generateBrazilianName(),
            hospital: currentHospital,
            medico: currentDoctor,
            valor: 1000 + Math.floor(Math.random() * 9000), // Wider range
            convenio: ["Acesso Oftalmologia", "Bradesco", "Unimed", "SulAmérica", "Particular"][i % 5],
            telefone: `55119${String(Math.random()).substring(2, 10)}`, // More realistic format start
            dataNascimento: new Date(birthYear, birthMonth, birthDay),
            cpf: generateCPF(),
            telefone2: Math.random() > 0.7 ? `55119${String(Math.random()).substring(2, 10)}` : undefined,
            email: Math.random() > 0.4 ? `paciente.teste${i + 1}@email.com` : undefined,
            uf: ["SP", "RJ", "MG", "PR", "SC"][i % 5],
            cidade: ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Florianópolis"][i % 5],
            bairro: ["Centro", "Jardins", "Copacabana", "Savassi", "Batel"][i % 5],
            origem: ["Publicidade Digital", "Evento", "Publicidade Tradicional", "Indicação"][i % 4],
            marketingData: { /* Placeholder */ },
            procedimentos: Array(1 + Math.floor(Math.random() * 3)).fill(null).map((_, j) => { // 1 to 3 procedures
                const procedureName = specificProcedures[Math.floor(Math.random() * specificProcedures.length)];
                const procedureType = procedureName.includes("Consulta") ? "Consulta" : procedureName.includes("Exame") ? "Exame" : "Cirurgia";
                const procedureStatus = ["pendente", "ganho", "perdido"][Math.floor(Math.random() * 3)];
                const procedureDoctor = doctorsForHospital[Math.floor(Math.random() * doctorsForHospital.length)];
                const procYear = 2023 + Math.floor(Math.random() * 2); // 2023 or 2024
                const procMonth = Math.floor(Math.random() * 12);
                const procDay = 1 + Math.floor(Math.random() * 28);
                return {
                  id: `proc-${i + 1}-${j + 1}`,
                  tipo: procedureType,
                  hospital: currentHospital,
                  medico: procedureDoctor,
                  procedimento: procedureName,
                  valor: 300 + Math.floor(Math.random() * 4700),
                  data: new Date(procYear, procMonth, procDay),
                  observacao: Math.random() > 0.8 ? `Observação do procedimento ${j + 1}` : "",
                  convenio: ["Acesso Oftalmologia", "Bradesco", "Unimed", "SulAmérica", "Particular"][i % 5],
                  status: procedureStatus,
                }
            }),
            historico: Array(1 + Math.floor(Math.random() * 5)).fill(null).map((_, j) => { // 1 to 5 history items
              const histYear = 2023 + Math.floor(Math.random() * 2);
              const histMonth = Math.floor(Math.random() * 12);
              const histDay = 1 + Math.floor(Math.random() * 28);
              const histHour = Math.floor(Math.random() * 24);
              const histMin = Math.floor(Math.random() * 60);
              return {
                id: `hist-${i + 1}-${j + 1}`,
                data: new Date(histYear, histMonth, histDay, histHour, histMin),
                tipo: ["Ligação", "Status", "Procedimento", "Criação", "Acompanhamento", "Alteração"][j % 6],
                descricao: `Registro de histórico ${j + 1}. Lorem ipsum dolor sit amet.`,
                usuario: ["Admin", "Consultor 1", "Consultor 2", "Sistema"][j % 4],
              };
            }).sort((a, b) => b.data.getTime() - a.data.getTime()), // Sort history descending
            status: stageName
          });
        }
        return pacientes;
      };

      const allPacientes = generatePacientes(60);

      const getPacientesByStage = (stageLabel: string): PacienteData[] => {
        return allPacientes.filter(p => p.status === stageLabel);
      };

      const Pacientes = () => {
        const [searchTerm, setSearchTerm] = useState("");
        const { toast } = useToast();
        const { apiConfig } = useApiConfig(); // Get API config from context

        // Check if API config is valid on mount (optional, but good practice)
        useEffect(() => {
            if (!apiConfig?.apiUrl || !apiConfig?.apiKey || !apiConfig?.apiInstance) {
                toast({
                    variant: "destructive",
                    title: "Configuração da API Incompleta",
                    description: "Verifique as configurações da API do WhatsApp para usar o chat.",
                    duration: 10000 // Keep message longer
                });
            }
        }, [apiConfig, toast]);


        const handleAddNewPaciente = () => {
          toast({
            title: "Funcionalidade em desenvolvimento",
            description: "O cadastro de novos pacientes estará disponível em breve.",
          });
        };

        // Filter patients based on search term
        const filterPacientes = (pacientes: PacienteData[]) => {
            if (!searchTerm) {
                return pacientes;
            }
            const lowerSearchTerm = searchTerm.toLowerCase();
            return pacientes.filter(p =>
                p.nome.toLowerCase().includes(lowerSearchTerm) ||
                p.telefone?.includes(searchTerm) ||
                p.cpf?.includes(searchTerm)
            );
        };


        return (
          <AppShell>
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
                    const stagePacientes = getPacientesByStage(stage.label);
                    const filteredStagePacientes = filterPacientes(stagePacientes);
                    return (
                      <div key={stage.id} className="pipeline-column flex-shrink-0 w-[300px]">
                        <h3 className="font-medium text-sm mb-3 px-1 sticky top-0 bg-muted/80 backdrop-blur-sm z-10 pt-2 pb-2">
                          {stage.label}
                          <span className="text-xs text-muted-foreground ml-2">
                            ({filteredStagePacientes.length})
                          </span>
                        </h3>
                        <ScrollArea className="h-[calc(100%-4rem)] pr-2"> {/* Adjust height */}
                          <div className="space-y-3 pt-1 pb-4">
                            {filteredStagePacientes.map((paciente) => (
                              <PacienteCard
                                key={paciente.id}
                                paciente={paciente}
                                // Pass the API config from context to the card
                                apiConfig={apiConfig}
                              />
                            ))}
                            {filteredStagePacientes.length === 0 && searchTerm && (
                                <p className="text-center text-sm text-muted-foreground p-4">Nenhum paciente encontrado nesta etapa com o termo "{searchTerm}".</p>
                            )}
                             {filteredStagePacientes.length === 0 && !searchTerm && (
                                <p className="text-center text-sm text-muted-foreground p-4">Nenhum paciente nesta etapa.</p>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </AppShell>
        );
      };

      export default Pacientes;
