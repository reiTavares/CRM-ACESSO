import { useState, useEffect } from "react"; 
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PhoneCall, Check, X, Plus, Clock, CalendarClock, FileText, Building, Save, User2 } from "lucide-react"; // Added User2
import { PacienteData } from "@/components/pacientes/paciente-card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Define hospital/doctor data structure locally for the modal (ideally passed via props/context)
const hospitalsData: Record<string, string[]> = {
  "HODF": ["Dr. João Silva", "Dra. Ana Costa", "Dr. Pedro Martins", "Dra. Carla Dias"],
  "HO Londrina": ["Dr. Carlos Souza", "Dra. Beatriz Lima", "Dr. Ricardo Alves", "Dra. Fernanda Vieira"],
  "HO Maringa": ["Dra. Mariana Ferreira", "Dr. Gustavo Pereira", "Dra. Sofia Ribeiro", "Dr. André Mendes"],
  "HOA": ["Dr. Lucas Gomes", "Dra. Julia Almeida", "Dr. Matheus Barbosa", "Dra. Isabela Castro"],
  // Add a fallback or handle cases where hospital might not be in the list
  "": [] 
};
const hospitalNames = Object.keys(hospitalsData).filter(name => name !== ""); // Exclude empty key


interface PacienteDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: PacienteData;
}

export function PacienteDetailModal({ 
    open, 
    onOpenChange, 
    paciente: initialPaciente 
}: PacienteDetailModalProps) {
  const [activeTab, setActiveTab] = useState("contato");
  const [paciente, setPaciente] = useState<PacienteData>(initialPaciente); 
  const { toast } = useToast();

  // Available doctors based on the currently selected hospital
  const availableDoctors = hospitalsData[paciente.hospital] || [];

  useEffect(() => {
    // Reset state when initialPaciente changes
    setPaciente(initialPaciente);
    // Ensure the initially selected doctor is valid for the initial hospital
    if (!hospitalsData[initialPaciente.hospital]?.includes(initialPaciente.medico)) {
        // If invalid, maybe select the first available doctor or leave blank
        const firstDoctor = hospitalsData[initialPaciente.hospital]?.[0] || "";
        setPaciente(prev => ({ ...prev, medico: firstDoctor }));
    }
  }, [initialPaciente]);


  const handleInputChange = (field: keyof PacienteData, value: any) => {
    setPaciente(prev => ({ ...prev, [field]: value }));
  };

  const handleProcedureInputChange = (procIndex: number, field: string, value: any) => {
     setPaciente(prev => {
        const updatedProcedimentos = [...prev.procedimentos];
        if (updatedProcedimentos[procIndex]) {
            (updatedProcedimentos[procIndex] as any)[field] = value;
            // Auto-update procedure type based on name
            if (field === 'procedimento') {
                 const name = value as string;
                 const type = name.includes("Consulta") ? "Consulta" : name.includes("Exame") ? "Exame" : "Cirurgia";
                 (updatedProcedimentos[procIndex] as any)['tipo'] = type;
            }
        }
        return { ...prev, procedimentos: updatedProcedimentos };
     });
  };

  // --- Hospital Change Logic ---
  const handleHospitalChange = (newHospital: string) => {
    const oldHospital = paciente.hospital; 
    const oldDoctor = paciente.medico;

    if (newHospital === oldHospital) return; 

    // Reset doctor when hospital changes - select the first available or empty
    const newDoctorList = hospitalsData[newHospital] || [];
    const newSelectedDoctor = newDoctorList[0] || ""; // Default to first doctor or empty string

    const updatedProcedimentos = paciente.procedimentos.map(proc => {
      if (proc.status !== 'ganho' && proc.status !== 'perdido') {
        // Also update the doctor for pending procedures if needed, or keep existing?
        // Let's keep the existing doctor for now unless explicitly changed later.
        return { ...proc, hospital: newHospital }; 
      }
      return proc; 
    });

    const historyDescription = `Hospital vinculado alterado de "${oldHospital}" para "${newHospital}". Médico vinculado atualizado de "${oldDoctor}" para "${newSelectedDoctor}". Hospitais de procedimentos pendentes atualizados.`;

    const newHistoricoEntry = {
      id: Date.now().toString(),
      data: new Date(),
      tipo: "Alteração",
      descricao: historyDescription,
      usuario: "Admin", 
    };

    setPaciente(prev => ({
      ...prev,
      hospital: newHospital,
      medico: newSelectedDoctor, // Update the main doctor
      procedimentos: updatedProcedimentos,
      historico: [newHistoricoEntry, ...prev.historico] 
    }));

    toast({
      title: "Hospital Atualizado",
      description: `Hospital alterado para ${newHospital}. Médico resetado.`,
    });
  };
  // --- End Hospital Change Logic ---

  // --- Doctor Change Logic ---
  const handleDoctorChange = (newDoctor: string) => {
      const oldDoctor = paciente.medico;
      if (newDoctor === oldDoctor) return;

      const newHistoricoEntry = {
        id: Date.now().toString(),
        data: new Date(),
        tipo: "Alteração",
        descricao: `Médico vinculado alterado de "${oldDoctor}" para "${newDoctor}".`,
        usuario: "Admin", 
      };

      setPaciente(prev => ({
          ...prev,
          medico: newDoctor,
          historico: [newHistoricoEntry, ...prev.historico]
      }));
       toast({
          title: "Médico Atualizado",
          description: `Médico vinculado alterado para ${newDoctor}.`,
      });
  }
  // --- End Doctor Change Logic ---


  const handleCall = () => { /* ... */ };
  const handleStatusChange = (procedimentoId: string, status: "ganho" | "perdido") => { /* ... */ };
  const addProcedimento = () => { /* ... */ };
  const handleSaveChanges = () => { /* ... */ };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">{paciente.nome}</DialogTitle>
            <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handleCall} title="Ligar para paciente">
                  <PhoneCall className="h-4 w-4" />
                </Button>
                 <Button size="sm" onClick={handleSaveChanges} title="Salvar Alterações">
                    <Save className="h-4 w-4 mr-2" /> Salvar
                 </Button>
            </div>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="contato">Contato</TabsTrigger>
            <TabsTrigger value="procedimentos">Procedimentos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>
          
          <TabsContent value="contato" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
              {/* Dados Pessoais Column */}
              <div className="space-y-4 border-r md:pr-6"> 
                <h3 className="text-lg font-medium mb-2">Dados Pessoais</h3>
                <div className="grid grid-cols-1 gap-3">
                  {/* Hospital Vinculado - Select */}
                  <div className="space-y-2">
                    <Label htmlFor="hospital-vinculado">Hospital Vinculado</Label>
                    <Select value={paciente.hospital} onValueChange={handleHospitalChange}>
                        <SelectTrigger id="hospital-vinculado">
                            <SelectValue placeholder="Selecione o hospital" />
                        </SelectTrigger>
                        <SelectContent>
                            {hospitalNames.map(name => (
                                <SelectItem key={name} value={name}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                   {/* Médico Vinculado - Select */}
                   <div className="space-y-2">
                    <Label htmlFor="medico-vinculado">Médico Vinculado</Label>
                    <Select value={paciente.medico} onValueChange={handleDoctorChange} disabled={!paciente.hospital}>
                        <SelectTrigger id="medico-vinculado">
                            <SelectValue placeholder="Selecione o médico" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableDoctors.length > 0 ? (
                                availableDoctors.map(name => (
                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                ))
                            ) : (
                                <SelectItem value="" disabled>Selecione um hospital primeiro</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input id="nome" value={paciente.nome} onChange={(e) => handleInputChange('nome', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                      <Input 
                        id="dataNascimento" 
                        type="date" 
                        value={format(paciente.dataNascimento, "yyyy-MM-dd")} 
                        onChange={(e) => handleInputChange('dataNascimento', new Date(e.target.value + 'T00:00:00'))} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input id="cpf" value={paciente.cpf} onChange={(e) => handleInputChange('cpf', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="telefone1">Telefone 1</Label>
                      <Input id="telefone1" value={paciente.telefone} onChange={(e) => handleInputChange('telefone', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone2">Telefone 2</Label>
                      <Input id="telefone2" value={paciente.telefone2 || ""} onChange={(e) => handleInputChange('telefone2', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" value={paciente.email || ""} onChange={(e) => handleInputChange('email', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="uf">UF</Label>
                      <Input id="uf" value={paciente.uf} onChange={(e) => handleInputChange('uf', e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input id="cidade" value={paciente.cidade} onChange={(e) => handleInputChange('cidade', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input id="bairro" value={paciente.bairro} onChange={(e) => handleInputChange('bairro', e.target.value)} />
                  </div>
                </div>
              </div>
              
              {/* Marketing Data Column */}
              <div className="space-y-4">
                 {/* ... (Marketing fields remain the same) ... */}
                 <h3 className="text-lg font-medium mb-2">Dados de Marketing</h3>
                 <div className="grid grid-cols-1 gap-3">
                   <div className="space-y-2">
                     <Label htmlFor="origem">Origem</Label>
                      <Select value={paciente.origem} onValueChange={(value) => handleInputChange('origem', value)}>
                         <SelectTrigger id="origem">
                             <SelectValue placeholder="Selecione a origem" />
                         </SelectTrigger>
                         <SelectContent>
                             <SelectItem value="Publicidade Digital">Publicidade Digital</SelectItem>
                             <SelectItem value="Evento">Evento</SelectItem>
                             <SelectItem value="Publicidade Tradicional">Publicidade Tradicional</SelectItem>
                             <SelectItem value="Indicação">Indicação</SelectItem>
                         </SelectContent>
                     </Select>
                   </div>
                   
                   {paciente.origem === "Publicidade Digital" || paciente.origem === "Publicidade Tradicional" ? (
                     <>
                       <div className="space-y-2"><Label>Fonte</Label><Input value={paciente.marketingData?.fonte || ""} readOnly /></div>
                       <div className="space-y-2"><Label>Campanha</Label><Input value={paciente.marketingData?.campanha || ""} readOnly /></div>
                       <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-2"><Label>Conjunto/Grupo</Label><Input value={paciente.marketingData?.conjunto || ""} readOnly /></div>
                         <div className="space-y-2"><Label>Tipo Criativo</Label><Input value={paciente.marketingData?.tipoCriativo || ""} readOnly /></div>
                       </div>
                       <div className="space-y-2"><Label>Título Criativo</Label><Input value={paciente.marketingData?.tituloCriativo || ""} readOnly /></div>
                       <div className="space-y-2"><Label>Palavra-chave</Label><Input value={paciente.marketingData?.palavraChave || ""} readOnly /></div>
                     </>
                   ) : paciente.origem === "Indicação" ? (
                     <>
                       <div className="space-y-2"><Label>Quem Indicou</Label><Input value={paciente.marketingData?.quemIndicou || ""} readOnly /></div>
                       <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-2"><Label>Data Indicação</Label><Input value={paciente.marketingData?.dataIndicacao ? format(new Date(paciente.marketingData.dataIndicacao), "dd/MM/yyyy", { locale: ptBR }) : ""} readOnly /></div>
                         <div className="space-y-2"><Label>Telefone</Label><Input value={paciente.marketingData?.telefoneIndicacao || ""} readOnly /></div>
                       </div>
                     </>
                   ) : paciente.origem === "Evento" ? (
                     <>
                       <div className="space-y-2"><Label>Nome do Evento</Label><Input value={paciente.marketingData?.nomeEvento || ""} readOnly /></div>
                       <div className="space-y-2"><Label>Data do Evento</Label><Input value={paciente.marketingData?.dataEvento ? format(new Date(paciente.marketingData.dataEvento), "dd/MM/yyyy", { locale: ptBR }) : ""} readOnly /></div>
                       <div className="space-y-2"><Label>Descrição</Label><Textarea value={paciente.marketingData?.descricaoEvento || ""} readOnly /></div>
                     </>
                   ) : null}
                 </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="procedimentos" className="space-y-4">
             {/* ... (Procedimentos content remains largely the same, but hospital is read-only) ... */}
             <div className="flex justify-between items-center">
               <h3 className="text-lg font-medium">Procedimentos</h3>
               <Button onClick={addProcedimento} size="sm">
                 <Plus className="h-4 w-4 mr-1" />
                 Adicionar
               </Button>
             </div>
             
             {paciente.procedimentos.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground">
                 Nenhum procedimento cadastrado.
               </div>
             ) : (
               <div className="space-y-6">
                 {paciente.procedimentos.map((procedimento, index) => (
                   <div key={procedimento.id} className="border rounded-lg p-4 relative"> 
                      <div className="absolute top-2 right-2">
                         {procedimento.status === "ganho" && (<Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Ganho</Badge>)}
                         {procedimento.status === "perdido" && (<Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Perdido</Badge>)}
                          {procedimento.status === "pendente" && (<Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente</Badge>)}
                      </div>

                     <div className="flex justify-between items-start mb-3 mr-20"> 
                       <h4 className="font-medium">
                         {procedimento.tipo} 
                       </h4>
                       
                       {procedimento.status === "pendente" && (
                         <div className="flex space-x-2">
                           <Button variant="outline" size="sm" className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200" onClick={() => handleStatusChange(procedimento.id, "ganho")}> <Check className="h-4 w-4 mr-1" /> Ganho </Button>
                           <Button variant="outline" size="sm" className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200" onClick={() => handleStatusChange(procedimento.id, "perdido")}> <X className="h-4 w-4 mr-1" /> Perdido </Button>
                         </div>
                       )}
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-3">
                         <div className="space-y-2">
                           <Label htmlFor={`procedimento-${index}`}>Procedimento Específico</Label>
                           <Input id={`procedimento-${index}`} value={procedimento.procedimento} onChange={(e) => handleProcedureInputChange(index, 'procedimento', e.target.value)} disabled={procedimento.status === 'ganho' || procedimento.status === 'perdido'}/>
                         </div>
                         <div className="space-y-2">
                           <Label htmlFor={`hospital-proc-${index}`}>Hospital</Label>
                           <Input id={`hospital-proc-${index}`} value={procedimento.hospital} readOnly className="bg-muted/50"/>
                         </div>
                         <div className="space-y-2">
                           <Label htmlFor={`medico-${index}`}>Médico</Label>
                           {/* Consider making this a Select based on procedure.hospital if needed */}
                           <Input id={`medico-${index}`} value={procedimento.medico} onChange={(e) => handleProcedureInputChange(index, 'medico', e.target.value)} disabled={procedimento.status === 'ganho' || procedimento.status === 'perdido'}/>
                         </div>
                          <div className="space-y-2">
                           <Label htmlFor={`tipo-${index}`}>Tipo (Automático)</Label>
                           <Input id={`tipo-${index}`} value={procedimento.tipo} readOnly className="bg-muted/50"/>
                         </div>
                       </div>
                       
                       <div className="space-y-3">
                         <div className="space-y-2">
                           <Label htmlFor={`valor-${index}`}>Valor</Label>
                           <Input id={`valor-${index}`} type="number" value={procedimento.valor} onChange={(e) => handleProcedureInputChange(index, 'valor', parseFloat(e.target.value) || 0)} disabled={procedimento.status === 'ganho' || procedimento.status === 'perdido'}/>
                         </div>
                         <div className="space-y-2">
                           <Label htmlFor={`data-${index}`}>Data de realização</Label>
                           <Input id={`data-${index}`} type="date" value={format(new Date(procedimento.data), "yyyy-MM-dd")} onChange={(e) => handleProcedureInputChange(index, 'data', new Date(e.target.value + 'T00:00:00'))} disabled={procedimento.status === 'ganho' || procedimento.status === 'perdido'}/>
                         </div>
                         <div className="space-y-2">
                           <Label htmlFor={`convenio-${index}`}>Convênio</Label>
                           <Input id={`convenio-${index}`} value={procedimento.convenio} onChange={(e) => handleProcedureInputChange(index, 'convenio', e.target.value)} disabled={procedimento.status === 'ganho' || procedimento.status === 'perdido'}/>
                         </div>
                         <div className="space-y-2">
                           <Label htmlFor={`observacao-${index}`}>Observação</Label>
                           <Textarea id={`observacao-${index}`} value={procedimento.observacao} onChange={(e) => handleProcedureInputChange(index, 'observacao', e.target.value)} className="h-[72px]" disabled={procedimento.status === 'ganho' || procedimento.status === 'perdido'}/>
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </TabsContent>
          
          <TabsContent value="historico">
             {/* ... (History content remains the same) ... */}
             <div className="space-y-4">
               <h3 className="text-lg font-medium">Histórico</h3>
               
               {paciente.historico.length === 0 ? (
                 <div className="text-center py-8 text-muted-foreground">
                   Nenhum registro no histórico.
                 </div>
               ) : (
                 <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2"> 
                   {paciente.historico.map((item) => (
                     <div key={item.id} className="border rounded-lg p-3">
                       <div className="flex items-start">
                         <div className="mt-0.5 mr-3">
                           {item.tipo === "Ligação" && <PhoneCall className="h-4 w-4 text-blue-500" />}
                           {item.tipo === "Status" && <FileText className="h-4 w-4 text-green-500" />}
                           {item.tipo === "Procedimento" && <CalendarClock className="h-4 w-4 text-purple-500" />}
                           {item.tipo === "Criação" && <Plus className="h-4 w-4 text-indigo-500" />}
                           {item.tipo === "Acompanhamento" && <Clock className="h-4 w-4 text-amber-500" />}
                           {item.tipo === "Alteração" && <Building className="h-4 w-4 text-orange-500" />} 
                         </div>
                         
                         <div className="flex-1">
                           <div className="flex justify-between">
                             <h4 className="font-medium text-sm">{item.tipo}</h4>
                             <span className="text-xs text-muted-foreground">
                               {format(new Date(item.data), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                             </span>
                           </div>
                           <p className="text-sm mt-1">{item.descricao}</p>
                           <span className="text-xs text-muted-foreground mt-1">{item.usuario}</span>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
