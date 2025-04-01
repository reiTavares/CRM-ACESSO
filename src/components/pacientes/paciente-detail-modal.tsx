import { useState, useEffect } from "react";
    import { format, isValid, parseISO } from "date-fns";
    import { ptBR } from "date-fns/locale/pt-BR";
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { Button } from "@/components/ui/button";
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Textarea } from "@/components/ui/textarea";
    import { Separator } from "@/components/ui/separator";
    import {
      PhoneCall, Check, X, Plus, Clock, CalendarClock, FileText, Building, Save, User2, MessageCircle,
      Loader2, UserCog, UserCheck // Added icons for new fields
    } from "lucide-react";
    // Assuming PacienteData is defined elsewhere or implicitly updated
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
    import { ScrollArea } from "@/components/ui/scroll-area";
    import { cn } from "@/lib/utils";
    import { WhatsappChat } from "@/components/pacientes/whatsapp-chat";

    // --- Helper function to safely format dates ---
    const safeFormatDate = (dateInput: Date | string | number | null | undefined, formatString: string): string => {
      if (!dateInput) return "";
      try {
        const date = typeof dateInput === 'number'
          ? new Date(dateInput * 1000)
          : typeof dateInput === 'string'
          ? parseISO(dateInput)
          : dateInput;

        if (date instanceof Date && !isNaN(date.getTime())) {
          return format(date, formatString, { locale: ptBR });
        }
      } catch (error) {
        console.error("Error formatting date:", dateInput, error);
      }
      return "";
    };
    // --- End Helper ---

    // --- Mock Data (Keep or fetch from API) ---
    const hospitalsData: Record<string, string[]> = {
      "HODF": ["Dr. João Silva", "Dra. Ana Costa", "Dr. Pedro Martins", "Dra. Carla Dias"],
      "HO Londrina": ["Dr. Carlos Souza", "Dra. Beatriz Lima", "Dr. Ricardo Alves", "Dra. Fernanda Vieira"],
      "HO Maringa": ["Dra. Mariana Ferreira", "Dr. Gustavo Pereira", "Dra. Sofia Ribeiro", "Dr. André Mendes"],
      "HOA": ["Dr. Lucas Gomes", "Dra. Julia Almeida", "Dr. Matheus Barbosa", "Dra. Isabela Castro"],
      "": []
    };
    const hospitalNames = Object.keys(hospitalsData).filter(name => name !== "");
    const sampleGestores = ["Ana Gestora", "Carlos Gestor", "Beatriz Gestora"];
    const sampleConsultores = ["Consultor Logado", "Mariana Consultora", "Pedro Consultor"]; // Placeholder for logged-in user
    // --- End Mock Data ---

    // --- Updated Interface (Conceptually, should match paciente-card.tsx) ---
    interface PacienteDataExtended extends PacienteData {
        gestorResponsavel?: string;
        consultorResponsavel?: string;
        marketingData?: { // Ensure marketingData structure is defined
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
      paciente: PacienteDataExtended | null; // Use extended interface
    }

    export function PacienteDetailModal({
        open,
        onOpenChange,
        paciente: initialPaciente,
    }: PacienteDetailModalProps) {
      const [activeTab, setActiveTab] = useState("contato");
      const [paciente, setPaciente] = useState<PacienteDataExtended | null>(null); // Use extended interface
      const { toast } = useToast();

      const availableDoctors = paciente ? (hospitalsData[paciente.hospital] || []) : [];

      // --- Populate initial state with sample data if missing ---
      const getInitialPacienteWithDefaults = (p: PacienteDataExtended | null): PacienteDataExtended | null => {
          if (!p) return null;

          // Add sample marketing data if missing or empty
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
              descricaoEvento: p.origem === 'Evento' ? 'Participação no stand da Acesso Oftalmologia.' : undefined,
          };

          return {
              ...p,
              gestorResponsavel: p.gestorResponsavel ?? sampleGestores[Math.floor(Math.random() * sampleGestores.length)],
              consultorResponsavel: p.consultorResponsavel ?? sampleConsultores[Math.floor(Math.random() * sampleConsultores.length)], // Replace with logged-in user logic later
              marketingData: {
                  ...marketingDataDefaults, // Apply defaults first
                  ...(p.marketingData || {}), // Override with existing data if present
              },
              historico: p.historico || [], // Ensure historico is always an array
              procedimentos: p.procedimentos || [], // Ensure procedimentos is always an array
          };
      };


      // Update local paciente state when the prop changes or modal opens
      useEffect(() => {
        const pacienteComDefaults = getInitialPacienteWithDefaults(initialPaciente);
        setPaciente(pacienteComDefaults);

        if (open) {
            setActiveTab("contato"); // Reset to first tab on open
        }
        // Reset doctor if hospital changes or doctor is invalid for the hospital
        if (pacienteComDefaults && (!hospitalsData[pacienteComDefaults.hospital] || !hospitalsData[pacienteComDefaults.hospital]?.includes(pacienteComDefaults.medico))) {
            const firstDoctor = hospitalsData[pacienteComDefaults.hospital]?.[0] || "";
            // Update the state based on the initial prop
            setPaciente(currentInitial => currentInitial ? ({ ...currentInitial, medico: firstDoctor }) : null);
        }
      }, [initialPaciente, open]);


      // --- Input Handlers for Paciente Data (Non-WhatsApp) ---
      const handleInputChange = (field: keyof PacienteDataExtended, value: any) => {
        if (field === 'dataNascimento') {
            try {
                const dateValue = new Date(value + 'T00:00:00Z');
                if (isValid(dateValue)) {
                     setPaciente(prev => prev ? ({ ...prev, [field]: dateValue }) : null);
                } else { console.warn(`Invalid date value for ${field}:`, value); }
            } catch (e) { console.error(`Error parsing date for ${field}:`, value, e); }
        } else {
            setPaciente(prev => prev ? ({ ...prev, [field]: value }) : null);
        }
      };

      const handleProcedureInputChange = (procIndex: number, field: string, value: any) => {
         setPaciente(prev => {
            if (!prev) return null;
            const updatedProcedimentos = [...prev.procedimentos];
            if (updatedProcedimentos[procIndex]) {
                let processedValue = value;
                if (field === 'data') {
                    try {
                        const dateValue = new Date(value + 'T00:00:00Z');
                        processedValue = isValid(dateValue) ? dateValue : updatedProcedimentos[procIndex].data;
                    } catch (e) {
                         console.error(`Error parsing procedure date:`, value, e);
                         processedValue = updatedProcedimentos[procIndex].data;
                    }
                } else if (field === 'valor') {
                    processedValue = parseFloat(value) || 0;
                } else if (field === 'procedimento') {
                     const name = value as string;
                     const type = name.toLowerCase().includes("consulta") ? "Consulta" :
                                  name.toLowerCase().includes("exame") ? "Exame" :
                                  name.toLowerCase().includes("cirurgia") ? "Cirurgia" : "Outro";
                     (updatedProcedimentos[procIndex] as any)['tipo'] = type;
                }
                (updatedProcedimentos[procIndex] as any)[field] = processedValue;
            }
            return { ...prev, procedimentos: updatedProcedimentos };
         });
      };

      const handleHospitalChange = (newHospital: string) => {
        if (!paciente) return;
        const oldHospital = paciente.hospital;
        const oldDoctor = paciente.medico;
        if (newHospital === oldHospital) return;

        const newDoctorList = hospitalsData[newHospital] || [];
        const newSelectedDoctor = newDoctorList[0] || "";
        const updatedProcedimentos = paciente.procedimentos.map(proc =>
          proc.status !== 'ganho' && proc.status !== 'perdido' ? { ...proc, hospital: newHospital } : proc
        );
        const historyDescription = `Hospital vinculado alterado de "${oldHospital || 'N/A'}" para "${newHospital}". Médico vinculado atualizado de "${oldDoctor || 'N/A'}" para "${newSelectedDoctor || 'N/A'}". Hospitais de procedimentos pendentes atualizados.`;
        const newHistoricoEntry = { id: `hist-${Date.now()}`, data: new Date(), tipo: "Alteração", descricao: historyDescription, usuario: "Sistema" };

        setPaciente(prev => prev ? ({
            ...prev,
            hospital: newHospital,
            medico: newSelectedDoctor,
            procedimentos: updatedProcedimentos,
            historico: [newHistoricoEntry, ...(prev.historico || [])] // Ensure historico exists
        }) : null);

        toast({ title: "Hospital Atualizado", description: `Hospital alterado para ${newHospital}. Médico resetado para ${newSelectedDoctor || 'nenhum'}.` });
      };

      const handleDoctorChange = (newDoctor: string) => {
          if (!paciente) return;
          const oldDoctor = paciente.medico;
          if (newDoctor === oldDoctor) return;
          const newHistoricoEntry = { id: `hist-${Date.now()}`, data: new Date(), tipo: "Alteração", descricao: `Médico vinculado alterado de "${oldDoctor || 'N/A'}" para "${newDoctor}".`, usuario: "Sistema" };
          setPaciente(prev => prev ? ({
              ...prev,
              medico: newDoctor,
              historico: [newHistoricoEntry, ...(prev.historico || [])] // Ensure historico exists
          }) : null);
          toast({ title: "Médico Atualizado", description: `Médico vinculado alterado para ${newDoctor}.` });
      }
      // --- End Input Handlers ---

      // --- Action Handlers ---
      const handleCall = () => { toast({ title: "Ligar", description: "Funcionalidade pendente." }); };
      const handleStatusChange = (procedimentoId: string, status: "ganho" | "perdido") => { toast({ title: "Status Procedimento", description: `Alterar ${procedimentoId} para ${status} - pendente.` }); };
      const addProcedimento = () => { toast({ title: "Adicionar Procedimento", description: "Funcionalidade pendente." }); };

      const handleSaveChanges = () => {
          // TODO: Implement actual API call to save the patient data
          console.log("Saving changes for paciente:", paciente);
          // Simulate API call success
          toast({
              title: "Alterações Salvas (Simulado)",
              description: "Os dados do paciente foram atualizados.",
          });
          // Optionally close the modal after saving:
          // onOpenChange(false);
      };
      // --- End Action Handlers ---

      // --- Render Logic ---
      if (!open) {
          return null;
      }

      if (!paciente) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-0 shrink-0">
                        <DialogTitle className="text-xl">Carregando...</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 text-center flex-1 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Carregando dados do paciente...</span>
                    </div>
                </DialogContent>
            </Dialog>
        );
      }

      const formattedNascimento = safeFormatDate(paciente.dataNascimento, "yyyy-MM-dd");
      const formattedMarketingIndicacao = safeFormatDate(paciente.marketingData?.dataIndicacao, "dd/MM/yyyy");
      const formattedMarketingEvento = safeFormatDate(paciente.marketingData?.dataEvento, "dd/MM/yyyy");

      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-0 shrink-0">
              <div className="flex justify-between items-center">
                <DialogTitle className="text-xl">{paciente.nome}</DialogTitle>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={handleCall} title="Ligar para paciente"><PhoneCall className="h-4 w-4" /></Button>
                     <Button size="sm" onClick={handleSaveChanges} title="Salvar Alterações"><Save className="h-4 w-4 mr-2" /> Salvar</Button>
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

              {/* Contact Tab */}
              <TabsContent value="contato" className="flex-1 overflow-y-auto mt-0 space-y-6">
                {/* Use a single grid for all sections in this tab */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* Dados Pessoais (Column 1) */}
                  <div className="space-y-4 md:col-span-1">
                    <h3 className="text-lg font-medium mb-2 border-b pb-1">Dados Pessoais</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1"><Label htmlFor="hospital-vinculado">Hospital Vinculado</Label><Select value={paciente.hospital} onValueChange={handleHospitalChange}><SelectTrigger id="hospital-vinculado"><SelectValue placeholder="Selecione o hospital" /></SelectTrigger><SelectContent>{hospitalNames.map(name => (<SelectItem key={name} value={name}>{name}</SelectItem>))}</SelectContent></Select></div>
                       <div className="space-y-1"><Label htmlFor="medico-vinculado">Médico Vinculado</Label><Select value={paciente.medico} onValueChange={handleDoctorChange} disabled={!paciente.hospital}><SelectTrigger id="medico-vinculado"><SelectValue placeholder="Selecione o médico" /></SelectTrigger><SelectContent>{availableDoctors.length > 0 ? availableDoctors.map(name => (<SelectItem key={name} value={name}>{name}</SelectItem>)) : <SelectItem value="" disabled>Selecione um hospital</SelectItem>}</SelectContent></Select></div>
                      <div className="space-y-1"><Label htmlFor="nome">Nome Completo</Label><Input id="nome" value={paciente.nome || ''} onChange={(e) => handleInputChange('nome', e.target.value)} /></div>
                      <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="dataNascimento">Data de Nascimento</Label><Input id="dataNascimento" type="date" value={formattedNascimento} onChange={(e) => handleInputChange('dataNascimento', e.target.value)}/></div><div className="space-y-1"><Label htmlFor="cpf">CPF</Label><Input id="cpf" value={paciente.cpf || ''} onChange={(e) => handleInputChange('cpf', e.target.value)} /></div></div>
                      <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="telefone1">Telefone 1 (WhatsApp)</Label><Input id="telefone1" value={paciente.telefone || ''} onChange={(e) => handleInputChange('telefone', e.target.value)} /></div><div className="space-y-1"><Label htmlFor="telefone2">Telefone 2</Label><Input id="telefone2" value={paciente.telefone2 || ""} onChange={(e) => handleInputChange('telefone2', e.target.value)} /></div></div>
                      <div className="space-y-1"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={paciente.email || ""} onChange={(e) => handleInputChange('email', e.target.value)} /></div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1"><Label htmlFor="uf">UF</Label><Input id="uf" value={paciente.uf || ''} onChange={(e) => handleInputChange('uf', e.target.value)} /></div>
                        <div className="space-y-1 col-span-2"><Label htmlFor="cidade">Cidade</Label><Input id="cidade" value={paciente.cidade || ''} onChange={(e) => handleInputChange('cidade', e.target.value)} /></div>
                      </div>
                      <div className="space-y-1"><Label htmlFor="bairro">Bairro</Label><Input id="bairro" value={paciente.bairro || ''} onChange={(e) => handleInputChange('bairro', e.target.value)} /></div>
                    </div>
                  </div>

                  {/* Dados de Marketing (Column 2) */}
                  <div className="space-y-4 md:col-span-1">
                     <h3 className="text-lg font-medium mb-2 border-b pb-1">Dados de Marketing</h3>
                     <div className="grid grid-cols-1 gap-3">
                       <div className="space-y-1"><Label htmlFor="origem">Origem</Label><Select value={paciente.origem} onValueChange={(value) => handleInputChange('origem', value)}><SelectTrigger id="origem"><SelectValue placeholder="Selecione a origem" /></SelectTrigger><SelectContent><SelectItem value="Publicidade Digital">Publicidade Digital</SelectItem><SelectItem value="Evento">Evento</SelectItem><SelectItem value="Publicidade Tradicional">Publicidade Tradicional</SelectItem><SelectItem value="Indicação">Indicação</SelectItem></SelectContent></Select></div>
                       {/* Conditional rendering - Fields are now editable */}
                       {paciente.origem === "Publicidade Digital" || paciente.origem === "Publicidade Tradicional" ? (
                         <>
                           <div className="space-y-1"><Label>Fonte</Label><Input value={paciente.marketingData?.fonte || ""} onChange={(e) => handleInputChange('marketingData', {...paciente.marketingData, fonte: e.target.value})} /></div>
                           <div className="space-y-1"><Label>Campanha</Label><Input value={paciente.marketingData?.campanha || ""} onChange={(e) => handleInputChange('marketingData', {...paciente.marketingData, campanha: e.target.value})} /></div>
                           <div className="grid grid-cols-2 gap-3">
                             <div className="space-y-1"><Label>Conjunto/Grupo</Label><Input value={paciente.marketingData?.conjunto || ""} onChange={(e) => handleInputChange('marketingData', {...paciente.marketingData, conjunto: e.target.value})} /></div>
                             <div className="space-y-1"><Label>Tipo Criativo</Label><Input value={paciente.marketingData?.tipoCriativo || ""} onChange={(e) => handleInputChange('marketingData', {...paciente.marketingData, tipoCriativo: e.target.value})} /></div>
                           </div>
                           <div className="space-y-1"><Label>Título Criativo</Label><Input value={paciente.marketingData?.tituloCriativo || ""} onChange={(e) => handleInputChange('marketingData', {...paciente.marketingData, tituloCriativo: e.target.value})} /></div>
                           <div className="space-y-1"><Label>Palavra-chave</Label><Input value={paciente.marketingData?.palavraChave || ""} onChange={(e) => handleInputChange('marketingData', {...paciente.marketingData, palavraChave: e.target.value})} /></div>
                         </>
                       ) : paciente.origem === "Indicação" ? (
                         <>
                           <div className="space-y-1"><Label>Quem Indicou</Label><Input value={paciente.marketingData?.quemIndicou || ""} onChange={(e) => handleInputChange('marketingData', {...paciente.marketingData, quemIndicou: e.target.value})} /></div>
                           <div className="grid grid-cols-2 gap-3">
                             {/* Date inputs for marketing need careful handling */}
                             <div className="space-y-1"><Label>Data Indicação</Label><Input type="date" value={safeFormatDate(paciente.marketingData?.dataIndicacao, "yyyy-MM-dd")} onChange={(e) => handleInputChange('marketingData', {...paciente.marketingData, dataIndicacao: e.target.value ? new Date(e.target.value + 'T00:00:00Z') : null})} /></div>
                             <div className="space-y-1"><Label>Telefone</Label><Input value={paciente.marketingData?.telefoneIndicacao || ""} onChange={(e) => handleInputChange('marketingData', {...paciente.marketingData, telefoneIndicacao: e.target.value})} /></div>
                           </div>
                         </>
                       ) : paciente.origem === "Evento" ? (
                         <>
                           <div className="space-y-1"><Label>Nome do Evento</Label><Input value={paciente.marketingData?.nomeEvento || ""} onChange={(e) => handleInputChange('marketingData', {...paciente.marketingData, nomeEvento: e.target.value})} /></div>
                           <div className="space-y-1"><Label>Data do Evento</Label><Input type="date" value={safeFormatDate(paciente.marketingData?.dataEvento, "yyyy-MM-dd")} onChange={(e) => handleInputChange('marketingData', {...paciente.marketingData, dataEvento: e.target.value ? new Date(e.target.value + 'T00:00:00Z') : null})} /></div>
                           <div className="space-y-1"><Label>Descrição</Label><Textarea value={paciente.marketingData?.descricaoEvento || ""} onChange={(e) => handleInputChange('marketingData', {...paciente.marketingData, descricaoEvento: e.target.value})} /></div>
                         </>
                       ) : null}
                     </div>
                  </div>

                   {/* Dados de Controle (Column 3) */}
                   <div className="space-y-4 md:col-span-1">
                       <h3 className="text-lg font-medium mb-2 border-b pb-1">Dados de Controle</h3>
                       <div className="grid grid-cols-1 gap-3">
                           <div className="space-y-1">
                               <Label htmlFor="gestorResponsavel" className="flex items-center"><UserCog className="h-4 w-4 mr-1 text-muted-foreground"/> Gestor Responsável</Label>
                               <Input
                                   id="gestorResponsavel"
                                   value={paciente.gestorResponsavel || ''}
                                   onChange={(e) => handleInputChange('gestorResponsavel', e.target.value)}
                                   placeholder="Nome do gestor"
                               />
                           </div>
                           <div className="space-y-1">
                               <Label htmlFor="consultorResponsavel" className="flex items-center"><UserCheck className="h-4 w-4 mr-1 text-muted-foreground"/> Consultor Responsável</Label>
                               <Input
                                   id="consultorResponsavel"
                                   value={paciente.consultorResponsavel || ''}
                                   onChange={(e) => handleInputChange('consultorResponsavel', e.target.value)}
                                   placeholder="Nome do consultor (usuário logado)"
                                   // readOnly // Could be readOnly if always set by system
                               />
                               <p className="text-xs text-muted-foreground">Normalmente preenchido pelo sistema.</p>
                           </div>
                       </div>
                   </div>

                </div>
              </TabsContent>

              {/* Procedures Tab */}
              <TabsContent value="procedimentos" className="flex-1 overflow-y-auto mt-0 space-y-4">
                 <div className="flex justify-between items-center sticky top-0 bg-background py-2 z-10 border-b mb-4">
                    <h3 className="text-lg font-medium">Procedimentos</h3>
                    <Button onClick={addProcedimento} size="sm"><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
                 </div>
                 {paciente.procedimentos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Nenhum procedimento cadastrado.</div>
                 ) : (
                    <div className="space-y-6 pb-4">
                        {paciente.procedimentos.map((procedimento, index) => {
                            const formattedProcDate = safeFormatDate(procedimento.data, "yyyy-MM-dd");
                            return (
                                <div key={procedimento.id} className="border rounded-lg p-4 relative shadow-sm">
                                    {/* Status Badge */}
                                    <div className="absolute top-2 right-2">
                                        {procedimento.status === "ganho" && (<Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Ganho</Badge>)}
                                        {procedimento.status === "perdido" && (<Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Perdido</Badge>)}
                                        {procedimento.status === "pendente" && (<Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente</Badge>)}
                                    </div>
                                    {/* Header and Actions */}
                                    <div className="flex justify-between items-start mb-3 mr-20"> {/* Added margin-right */}
                                        <h4 className="font-medium">{procedimento.tipo}</h4>
                                        {procedimento.status === "pendente" && (
                                            <div className="flex space-x-2">
                                                <Button variant="outline" size="sm" className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200" onClick={() => handleStatusChange(procedimento.id, "ganho")}> <Check className="h-4 w-4 mr-1" /> Ganho </Button>
                                                <Button variant="outline" size="sm" className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200" onClick={() => handleStatusChange(procedimento.id, "perdido")}> <X className="h-4 w-4 mr-1" /> Perdido </Button>
                                            </div>
                                        )}
                                    </div>
                                    {/* Form Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Left Column */}
                                        <div className="space-y-3">
                                            <div className="space-y-1"><Label htmlFor={`procedimento-${index}`}>Procedimento Específico</Label><Input id={`procedimento-${index}`} value={procedimento.procedimento || ''} onChange={(e) => handleProcedureInputChange(index, 'procedimento', e.target.value)} disabled={procedimento.status !== 'pendente'}/></div>
                                            <div className="space-y-1"><Label htmlFor={`hospital-proc-${index}`}>Hospital</Label><Input id={`hospital-proc-${index}`} value={procedimento.hospital || ''} readOnly className="bg-muted/50"/></div>
                                            <div className="space-y-1"><Label htmlFor={`medico-${index}`}>Médico</Label><Input id={`medico-${index}`} value={procedimento.medico || ''} onChange={(e) => handleProcedureInputChange(index, 'medico', e.target.value)} disabled={procedimento.status !== 'pendente'}/></div>
                                            <div className="space-y-1"><Label htmlFor={`tipo-${index}`}>Tipo (Automático)</Label><Input id={`tipo-${index}`} value={procedimento.tipo || ''} readOnly className="bg-muted/50"/></div>
                                        </div>
                                        {/* Right Column */}
                                        <div className="space-y-3">
                                            <div className="space-y-1"><Label htmlFor={`valor-${index}`}>Valor</Label><Input id={`valor-${index}`} type="number" value={procedimento.valor || 0} onChange={(e) => handleProcedureInputChange(index, 'valor', e.target.value)} disabled={procedimento.status !== 'pendente'}/></div>
                                            <div className="space-y-1"><Label htmlFor={`data-${index}`}>Data de realização</Label><Input id={`data-${index}`} type="date" value={formattedProcDate} onChange={(e) => handleProcedureInputChange(index, 'data', e.target.value)} disabled={procedimento.status !== 'pendente'}/></div>
                                            <div className="space-y-1"><Label htmlFor={`convenio-${index}`}>Convênio</Label><Input id={`convenio-${index}`} value={procedimento.convenio || ''} onChange={(e) => handleProcedureInputChange(index, 'convenio', e.target.value)} disabled={procedimento.status !== 'pendente'}/></div>
                                            <div className="space-y-1"><Label htmlFor={`observacao-${index}`}>Observação</Label><Textarea id={`observacao-${index}`} value={procedimento.observacao || ''} onChange={(e) => handleProcedureInputChange(index, 'observacao', e.target.value)} className="h-[72px]" disabled={procedimento.status !== 'pendente'}/></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 )}
              </TabsContent>

              {/* WhatsApp Tab - Uses the dedicated component */}
              <TabsContent value="whatsapp" className="flex-1 flex flex-col min-h-0 mt-0">
                 <WhatsappChat
                    paciente={paciente}
                    isActiveTab={activeTab === 'whatsapp'}
                 />
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="historico" className="flex-1 overflow-y-auto mt-0 space-y-4">
                 <div className="sticky top-0 bg-background py-2 z-10 border-b mb-4">
                   <h3 className="text-lg font-medium">Histórico</h3>
                 </div>
                 {(paciente.historico || []).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Nenhum registro de histórico.</div>
                 ) : (
                    <ScrollArea className="h-[calc(100%-4rem)] pr-4"> {/* Adjust height */}
                        <div className="space-y-3 pb-4">
                            {(paciente.historico || []).map((item) => (
                                <div key={item.id} className="border rounded-lg p-3 shadow-sm">
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
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-medium text-sm">{item.tipo}</h4>
                                                <span className="text-xs text-muted-foreground">{safeFormatDate(item.data, "dd/MM/yyyy HH:mm")}</span>
                                            </div>
                                            <p className="text-sm mt-1">{item.descricao}</p>
                                            <span className="text-xs text-muted-foreground mt-1 block text-right">por: {item.usuario}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                 )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      );
    }
