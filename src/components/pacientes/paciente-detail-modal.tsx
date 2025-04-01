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
    Paperclip, Mic, SendHorizonal, Image as ImageIcon, Video, File as FileIcon, Loader2 // Added Loader2
  } from "lucide-react";
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
  import { ScrollArea } from "@/components/ui/scroll-area"; // For chat messages
  import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // For attachment options

  // --- Helper function to safely format dates ---
  const safeFormatDate = (dateInput: Date | string | null | undefined, formatString: string): string => {
    if (!dateInput) return "";
    try {
      const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
      if (date instanceof Date && !isNaN(date.getTime())) {
        return format(date, formatString, { locale: ptBR });
      }
    } catch (error) {
      console.error("Error formatting date:", dateInput, error);
    }
    return "";
  };
  // --- End Helper ---

  // --- Interface for API Config Props ---
  interface ApiConfigProps {
      apiUrl: string;
      apiKey: string;
      apiInstance: string;
  }

  // --- Refined Whatsapp Chat Component ---
  const WhatsappChat = ({ paciente, apiConfig }: { paciente: PacienteData | null, apiConfig: ApiConfigProps | null }) => {
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();

    // Placeholder for actual chat messages state (fetch from API)
    // const [chatMessages, setChatMessages] = useState<any[]>([]);
    // Placeholder for consultant name
    const consultantName = "Consultor Exemplo"; // Replace with actual logic

    if (!paciente) {
      return <div className="p-4 text-center text-muted-foreground">Carregando dados do paciente...</div>;
    }
    // Check if API config is provided
    if (!apiConfig || !apiConfig.apiUrl || !apiConfig.apiKey || !apiConfig.apiInstance) {
        return <div className="p-4 text-center text-destructive">Configuração da API do WhatsApp não encontrada ou incompleta. Verifique as Configurações.</div>;
    }

    const handleSendMessage = async () => {
      // Basic validation
      if (!message.trim() || isSending || !paciente.telefone) {
          if(!paciente.telefone) toast({ variant: "destructive", title: "Erro", description: "Número de telefone do paciente não encontrado." });
          return;
      };

      setIsSending(true);
      console.log("Sending message:", message, "to", paciente.telefone);
      toast({ title: "Enviando Mensagem..." });

      const sendUrl = `${apiConfig.apiUrl}/message/sendText/${apiConfig.apiInstance}`;
      // Ensure phone number is in the correct format (e.g., 55119XXXXXXXX)
      // You might need a library or function to normalize phone numbers
      const formattedPhoneNumber = paciente.telefone.replace(/\D/g, ''); // Basic non-digit removal

      const payload = {
          number: formattedPhoneNumber,
          options: {
              delay: 1200,
              presence: "composing"
          },
          textMessage: {
              text: message
          }
      };

      try {
          const response = await fetch(sendUrl, {
              method: 'POST',
              headers: {
                  'apikey': apiConfig.apiKey,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
          });

          const responseData = await response.json();

          if (!response.ok) {
              // Try to get a more specific error message
              const errorDetail = responseData?.message || responseData?.error?.message || responseData?.error || `Erro ${response.status}`;
              throw new Error(errorDetail);
          }

          console.log("Message sent response:", responseData);
          toast({ title: "Mensagem Enviada!", description: `Para: ${paciente.telefone}` });
          setMessage(""); // Clear input on success
          // TODO: Trigger a refresh of the chat messages list
      } catch (error: any) {
          console.error("Error sending message:", error);
          toast({ variant: "destructive", title: "Erro ao Enviar", description: error.message || "Não foi possível enviar a mensagem." });
      } finally {
          setIsSending(false);
      }
    };

    const handleSendAttachment = (type: 'image' | 'video' | 'audio' | 'document') => {
      console.log(`Attempting to send ${type} attachment to`, paciente.telefone);
      toast({ title: `Enviar ${type} (Simulado)`, description: `Funcionalidade pendente para ${paciente.telefone}` });
      // --- !!! Implement file input and actual API call here !!! ---
      // 1. Trigger a hidden file input: `<input type="file" accept="..." />`
      // 2. On file selection, create FormData: `const formData = new FormData(); formData.append('file', selectedFile); formData.append('number', formattedPhoneNumber); ... (add other options)`
      // 3. Send fetch request with FormData (adjust headers - remove Content-Type or set to multipart/form-data)
      // Example endpoint: POST /message/sendMedia/{instanceName} or POST /message/sendFile/{instanceName}
    };

    return (
      <div className="flex flex-col h-[65vh]"> {/* Maintain height */}
        <h3 className="text-lg font-medium mb-1 px-1">Chat WhatsApp com {paciente.nome}</h3>
        <p className="text-xs text-muted-foreground mb-3 px-1">Número: {paciente.telefone || "Não informado"}</p>
        <ScrollArea className="flex-1 border rounded-md p-4 mb-4 bg-muted/20">
          {/* Placeholder for chat messages */}
          <div className="space-y-4">
            {/* Example Received Message */}
            <div className="flex justify-start">
              <div className="bg-background rounded-lg p-3 max-w-[75%] shadow-sm">
                <p className="text-sm">Olá! Gostaria de mais informações sobre a cirurgia.</p>
                <p className="text-xs text-muted-foreground text-right mt-1">10:30</p>
              </div>
            </div>
            {/* Example Sent Message */}
            <div className="flex justify-end">
              <div className="bg-primary/90 text-primary-foreground rounded-lg p-3 max-w-[75%] shadow-sm">
                 <p className="text-sm font-medium mb-1">{consultantName}</p>
                <p className="text-sm">Claro! Qual procedimento você tem interesse?</p>
                <p className="text-xs text-primary-foreground/80 text-right mt-1">10:32</p>
              </div>
            </div>
             <div className="text-center text-muted-foreground py-10">
               <p>--- Histórico de mensagens aparecerá aqui ---</p>
               <p className="text-xs mt-1">(Integração com API Evolution pendente para buscar/receber)</p>
             </div>
          </div>
          {/* End Placeholder */}
        </ScrollArea>
        <div className="flex items-center gap-2 border-t pt-4">
           <Popover>
              <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" title="Anexar" disabled={isSending}>
                      <Paperclip className="h-5 w-5" />
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                  <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Enviar Imagem" onClick={() => handleSendAttachment('image')}>
                          <ImageIcon className="h-5 w-5 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Enviar Vídeo" onClick={() => handleSendAttachment('video')}>
                          <Video className="h-5 w-5 text-purple-500" />
                      </Button>
                       <Button variant="ghost" size="icon" title="Enviar Áudio" onClick={() => handleSendAttachment('audio')}>
                          <Mic className="h-5 w-5 text-red-500" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Enviar Documento" onClick={() => handleSendAttachment('document')}>
                          <FileIcon className="h-5 w-5 text-gray-500" />
                      </Button>
                  </div>
              </PopoverContent>
           </Popover>
          <Input
              placeholder="Digite sua mensagem..."
              className="flex-1"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
              disabled={isSending}
          />
          <Button onClick={handleSendMessage} disabled={!message.trim() || isSending} title="Enviar Mensagem">
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    );
  };
  // --- End Whatsapp Chat Component ---


  const hospitalsData: Record<string, string[]> = {
    "HODF": ["Dr. João Silva", "Dra. Ana Costa", "Dr. Pedro Martins", "Dra. Carla Dias"],
    "HO Londrina": ["Dr. Carlos Souza", "Dra. Beatriz Lima", "Dr. Ricardo Alves", "Dra. Fernanda Vieira"],
    "HO Maringa": ["Dra. Mariana Ferreira", "Dr. Gustavo Pereira", "Dra. Sofia Ribeiro", "Dr. André Mendes"],
    "HOA": ["Dr. Lucas Gomes", "Dra. Julia Almeida", "Dr. Matheus Barbosa", "Dra. Isabela Castro"],
    "": []
  };
  const hospitalNames = Object.keys(hospitalsData).filter(name => name !== "");


  interface PacienteDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    paciente: PacienteData | null;
    // --- Add API config props ---
    apiConfig?: ApiConfigProps | null; // Make optional for now
  }

  export function PacienteDetailModal({
      open,
      onOpenChange,
      paciente: initialPaciente,
      apiConfig // Receive API config
  }: PacienteDetailModalProps) {
    const [activeTab, setActiveTab] = useState("contato");
    const [paciente, setPaciente] = useState<PacienteData | null>(initialPaciente);
    const { toast } = useToast();

    const availableDoctors = paciente ? (hospitalsData[paciente.hospital] || []) : [];

    useEffect(() => {
      setPaciente(initialPaciente);
      if (open) {
          setActiveTab("contato");
      }
      if (initialPaciente && !hospitalsData[initialPaciente.hospital]?.includes(initialPaciente.medico)) {
          const firstDoctor = hospitalsData[initialPaciente.hospital]?.[0] || "";
          setPaciente(prev => prev ? ({ ...prev, medico: firstDoctor }) : null);
      }
    }, [initialPaciente, open]);


    const handleInputChange = (field: keyof PacienteData, value: any) => {
      if (field === 'dataNascimento' || field === 'data') { // Assuming 'data' might be another date field somewhere
          try {
              // Attempt to create a date object correctly from yyyy-mm-dd string
              const dateValue = new Date(value + 'T00:00:00'); // Treat as local time
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
                      const dateValue = new Date(value + 'T00:00:00'); // Treat as local time
                      processedValue = isValid(dateValue) ? dateValue : updatedProcedimentos[procIndex].data; // Keep old if invalid
                  } catch (e) {
                       console.error(`Error parsing procedure date:`, value, e);
                       processedValue = updatedProcedimentos[procIndex].data; // Keep old on error
                  }
              } else if (field === 'valor') {
                  processedValue = parseFloat(value) || 0;
              } else if (field === 'procedimento') {
                   const name = value as string;
                   const type = name.includes("Consulta") ? "Consulta" : name.includes("Exame") ? "Exame" : "Cirurgia";
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
      const historyDescription = `Hospital vinculado alterado de "${oldHospital}" para "${newHospital}". Médico vinculado atualizado de "${oldDoctor}" para "${newSelectedDoctor}". Hospitais de procedimentos pendentes atualizados.`;
      const newHistoricoEntry = { id: Date.now().toString(), data: new Date(), tipo: "Alteração", descricao: historyDescription, usuario: "Admin" };

      setPaciente(prev => prev ? ({ ...prev, hospital: newHospital, medico: newSelectedDoctor, procedimentos: updatedProcedimentos, historico: [newHistoricoEntry, ...prev.historico] }) : null);
      toast({ title: "Hospital Atualizado", description: `Hospital alterado para ${newHospital}. Médico resetado.` });
    };

    const handleDoctorChange = (newDoctor: string) => {
        if (!paciente) return;
        const oldDoctor = paciente.medico;
        if (newDoctor === oldDoctor) return;
        const newHistoricoEntry = { id: Date.now().toString(), data: new Date(), tipo: "Alteração", descricao: `Médico vinculado alterado de "${oldDoctor}" para "${newDoctor}".`, usuario: "Admin" };
        setPaciente(prev => prev ? ({ ...prev, medico: newDoctor, historico: [newHistoricoEntry, ...prev.historico] }) : null);
        toast({ title: "Médico Atualizado", description: `Médico vinculado alterado para ${newDoctor}.` });
    }

    const handleCall = () => { toast({ title: "Ligar", description: "Funcionalidade pendente." }); };
    const handleStatusChange = (procedimentoId: string, status: "ganho" | "perdido") => { toast({ title: "Status Procedimento", description: `Alterar ${procedimentoId} para ${status} - pendente.` }); };
    const addProcedimento = () => { toast({ title: "Adicionar Procedimento", description: "Funcionalidade pendente." }); };
    const handleSaveChanges = () => { toast({ title: "Salvar Alterações", description: "Funcionalidade pendente." }); };

    if (!paciente) {
      return (
          <Dialog open={open} onOpenChange={onOpenChange}>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                      <DialogTitle className="text-xl">Carregando...</DialogTitle>
                  </DialogHeader>
                  <div className="p-6 text-center">Carregando dados do paciente...</div>
              </DialogContent>
          </Dialog>
      );
    }

    // Safely format dates before rendering
    const formattedNascimento = safeFormatDate(paciente.dataNascimento, "yyyy-MM-dd");
    const formattedMarketingIndicacao = safeFormatDate(paciente.marketingData?.dataIndicacao, "dd/MM/yyyy");
    const formattedMarketingEvento = safeFormatDate(paciente.marketingData?.dataEvento, "dd/MM/yyyy");


    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="contato">Contato</TabsTrigger>
              <TabsTrigger value="procedimentos">Procedimentos</TabsTrigger>
              <TabsTrigger value="whatsapp">
                  <MessageCircle className="h-4 w-4 mr-1"/> WhatsApp
              </TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            {/* Contact Tab */}
            <TabsContent value="contato" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dados Pessoais */}
                <div className="space-y-4 border-r md:pr-6">
                  <h3 className="text-lg font-medium mb-2">Dados Pessoais</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="hospital-vinculado">Hospital Vinculado</Label>
                      <Select value={paciente.hospital} onValueChange={handleHospitalChange}>
                          <SelectTrigger id="hospital-vinculado"><SelectValue placeholder="Selecione o hospital" /></SelectTrigger>
                          <SelectContent>{hospitalNames.map(name => (<SelectItem key={name} value={name}>{name}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="medico-vinculado">Médico Vinculado</Label>
                      <Select value={paciente.medico} onValueChange={handleDoctorChange} disabled={!paciente.hospital}>
                          <SelectTrigger id="medico-vinculado"><SelectValue placeholder="Selecione o médico" /></SelectTrigger>
                          <SelectContent>
                              {availableDoctors.length > 0
                                  ? availableDoctors.map(name => (<SelectItem key={name} value={name}>{name}</SelectItem>))
                                  : <SelectItem value="" disabled>Selecione um hospital</SelectItem>}
                          </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input id="nome" value={paciente.nome || ''} onChange={(e) => handleInputChange('nome', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                        <Input
                          id="dataNascimento"
                          type="date"
                          value={formattedNascimento}
                          onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input id="cpf" value={paciente.cpf || ''} onChange={(e) => handleInputChange('cpf', e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="telefone1">Telefone 1 (WhatsApp)</Label>
                        <Input id="telefone1" value={paciente.telefone || ''} onChange={(e) => handleInputChange('telefone', e.target.value)} />
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
                        <Input id="uf" value={paciente.uf || ''} onChange={(e) => handleInputChange('uf', e.target.value)} />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="cidade">Cidade</Label>
                        <Input id="cidade" value={paciente.cidade || ''} onChange={(e) => handleInputChange('cidade', e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input id="bairro" value={paciente.bairro || ''} onChange={(e) => handleInputChange('bairro', e.target.value)} />
                    </div>
                  </div>
                </div>
                {/* Dados Marketing */}
                <div className="space-y-4">
                   <h3 className="text-lg font-medium mb-2">Dados de Marketing</h3>
                   <div className="grid grid-cols-1 gap-3">
                     <div className="space-y-2">
                       <Label htmlFor="origem">Origem</Label>
                        <Select value={paciente.origem} onValueChange={(value) => handleInputChange('origem', value)}>
                           <SelectTrigger id="origem"><SelectValue placeholder="Selecione a origem" /></SelectTrigger>
                           <SelectContent>
                               <SelectItem value="Publicidade Digital">Publicidade Digital</SelectItem>
                               <SelectItem value="Evento">Evento</SelectItem>
                               <SelectItem value="Publicidade Tradicional">Publicidade Tradicional</SelectItem>
                               <SelectItem value="Indicação">Indicação</SelectItem>
                           </SelectContent>
                       </Select>
                     </div>
                     {/* Conditional Fields */}
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
                           <div className="space-y-2"><Label>Data Indicação</Label><Input value={formattedMarketingIndicacao} readOnly /></div>
                           <div className="space-y-2"><Label>Telefone</Label><Input value={paciente.marketingData?.telefoneIndicacao || ""} readOnly /></div>
                         </div>
                       </>
                     ) : paciente.origem === "Evento" ? (
                       <>
                         <div className="space-y-2"><Label>Nome do Evento</Label><Input value={paciente.marketingData?.nomeEvento || ""} readOnly /></div>
                         <div className="space-y-2"><Label>Data do Evento</Label><Input value={formattedMarketingEvento} readOnly /></div>
                         <div className="space-y-2"><Label>Descrição</Label><Textarea value={paciente.marketingData?.descricaoEvento || ""} readOnly /></div>
                       </>
                     ) : null}
                   </div>
                </div>
              </div>
            </TabsContent>

            {/* Procedures Tab */}
            <TabsContent value="procedimentos" className="space-y-4">
               <div className="flex justify-between items-center">
                 <h3 className="text-lg font-medium">Procedimentos</h3>
                 <Button onClick={addProcedimento} size="sm"><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
               </div>
               {paciente.procedimentos.length === 0 ? (
                 <div className="text-center py-8 text-muted-foreground">Nenhum procedimento.</div>
               ) : (
                 <div className="space-y-6">
                   {paciente.procedimentos.map((procedimento, index) => {
                      const formattedProcDate = safeFormatDate(procedimento.data, "yyyy-MM-dd");
                      return (
                         <div key={procedimento.id} className="border rounded-lg p-4 relative">
                            <div className="absolute top-2 right-2">
                               {procedimento.status === "ganho" && (<Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Ganho</Badge>)}
                               {procedimento.status === "perdido" && (<Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Perdido</Badge>)}
                                {procedimento.status === "pendente" && (<Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente</Badge>)}
                            </div>
                           <div className="flex justify-between items-start mb-3 mr-20">
                             <h4 className="font-medium">{procedimento.tipo}</h4>
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
                                 <Input id={`procedimento-${index}`} value={procedimento.procedimento || ''} onChange={(e) => handleProcedureInputChange(index, 'procedimento', e.target.value)} disabled={procedimento.status !== 'pendente'}/>
                               </div>
                               <div className="space-y-2">
                                 <Label htmlFor={`hospital-proc-${index}`}>Hospital</Label>
                                 <Input id={`hospital-proc-${index}`} value={procedimento.hospital || ''} readOnly className="bg-muted/50"/>
                               </div>
                               <div className="space-y-2">
                                 <Label htmlFor={`medico-${index}`}>Médico</Label>
                                 <Input id={`medico-${index}`} value={procedimento.medico || ''} onChange={(e) => handleProcedureInputChange(index, 'medico', e.target.value)} disabled={procedimento.status !== 'pendente'}/>
                               </div>
                                <div className="space-y-2">
                                 <Label htmlFor={`tipo-${index}`}>Tipo (Automático)</Label>
                                 <Input id={`tipo-${index}`} value={procedimento.tipo || ''} readOnly className="bg-muted/50"/>
                               </div>
                             </div>
                             <div className="space-y-3">
                               <div className="space-y-2">
                                 <Label htmlFor={`valor-${index}`}>Valor</Label>
                                 <Input id={`valor-${index}`} type="number" value={procedimento.valor || 0} onChange={(e) => handleProcedureInputChange(index, 'valor', e.target.value)} disabled={procedimento.status !== 'pendente'}/>
                               </div>
                               <div className="space-y-2">
                                 <Label htmlFor={`data-${index}`}>Data de realização</Label>
                                 <Input
                                   id={`data-${index}`}
                                   type="date"
                                   value={formattedProcDate}
                                   onChange={(e) => handleProcedureInputChange(index, 'data', e.target.value)}
                                   disabled={procedimento.status !== 'pendente'}
                                 />
                               </div>
                               <div className="space-y-2">
                                 <Label htmlFor={`convenio-${index}`}>Convênio</Label>
                                 <Input id={`convenio-${index}`} value={procedimento.convenio || ''} onChange={(e) => handleProcedureInputChange(index, 'convenio', e.target.value)} disabled={procedimento.status !== 'pendente'}/>
                               </div>
                               <div className="space-y-2">
                                 <Label htmlFor={`observacao-${index}`}>Observação</Label>
                                 <Textarea id={`observacao-${index}`} value={procedimento.observacao || ''} onChange={(e) => handleProcedureInputChange(index, 'observacao', e.target.value)} className="h-[72px]" disabled={procedimento.status !== 'pendente'}/>
                               </div>
                             </div>
                           </div>
                         </div>
                      );
                   })}
                 </div>
               )}
            </TabsContent>

            {/* WhatsApp Tab */}
            <TabsContent value="whatsapp" className="space-y-4">
               {/* Pass the API config to the chat component */}
               <WhatsappChat paciente={paciente} apiConfig={apiConfig || null} />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="historico" className="space-y-4">
               <div>
                 <h3 className="text-lg font-medium">Histórico</h3>
                 {paciente.historico.length === 0 ? (
                   <div className="text-center py-8 text-muted-foreground">Nenhum registro.</div>
                 ) : (
                   <ScrollArea className="h-[60vh] pr-4"> {/* Added ScrollArea */}
                     <div className="space-y-3">
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
                                   {safeFormatDate(item.data, "dd/MM/yyyy HH:mm")}
                                 </span>
                               </div>
                               <p className="text-sm mt-1">{item.descricao}</p>
                               <span className="text-xs text-muted-foreground mt-1">{item.usuario}</span>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   </ScrollArea>
                 )}
               </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  }
