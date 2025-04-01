import { useState, useEffect, useRef } from "react"; // Added useRef
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
  Paperclip, Mic, SendHorizonal, Image as ImageIcon, Video, File as FileIcon, Loader2, Headset // Added Headset for audio file
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
import { cn } from "@/lib/utils"; // Import cn

// --- LocalStorage Keys ---
const API_URL_KEY = 'evolutionApiUrl';
const API_KEY_KEY = 'evolutionApiKey';
const API_INSTANCE_KEY = 'evolutionApiInstance';
// --- End LocalStorage Keys ---

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

// --- Interface for API Config Props (used locally in WhatsappChat) ---
interface ApiConfigProps {
    apiUrl: string;
    apiKey: string;
    apiInstance: string;
}

// --- Refined Whatsapp Chat Component ---
const WhatsappChat = ({ paciente }: { paciente: PacienteData | null }) => { // Removed apiConfig prop
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // --- State to hold API config loaded from localStorage ---
  const [localApiConfig, setLocalApiConfig] = useState<ApiConfigProps | null>(null);

  // --- Load API Config from localStorage on mount ---
  useEffect(() => {
      const apiUrl = localStorage.getItem(API_URL_KEY);
      const apiKey = localStorage.getItem(API_KEY_KEY);
      const apiInstance = localStorage.getItem(API_INSTANCE_KEY);

      if (apiUrl && apiKey && apiInstance) {
          setLocalApiConfig({ apiUrl, apiKey, apiInstance });
          console.log("WhatsApp Chat: API Config loaded from localStorage.");
      } else {
          console.warn("WhatsApp Chat: API Config not found in localStorage.");
          // Optional: Show a persistent warning if config is missing?
      }
  }, []); // Empty dependency array ensures this runs only once

  // Placeholder for consultant name
  const consultantName = "Consultor Exemplo";

  if (!paciente) {
    return <div className="p-4 text-center text-muted-foreground">Carregando dados do paciente...</div>;
  }
  // Check if API config was loaded from localStorage
  if (!localApiConfig) {
      return <div className="p-4 text-center text-destructive">Configuração da API do WhatsApp não encontrada ou incompleta. Verifique as Configurações.</div>;
  }

  // --- Phone Number Formatting ---
  const formatPhoneNumber = (phone: string | undefined): string | null => {
      if (!phone) return null;
      let cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10 || cleaned.length === 11) {
          cleaned = '55' + cleaned;
      } else if (cleaned.length === 12 || cleaned.length === 13) {
          if (!cleaned.startsWith('55')) {
              console.warn("Phone number doesn't start with 55:", phone);
              return null;
          }
      } else {
          console.warn("Invalid phone number length:", phone);
          return null;
      }
      return cleaned;
  };
  const formattedPhoneNumber = formatPhoneNumber(paciente.telefone);
  // --- End Phone Number Formatting ---

  const handleSendMessage = async () => {
    if (!message.trim() || isSending || !formattedPhoneNumber || !localApiConfig) {
        if(!formattedPhoneNumber) toast({ variant: "destructive", title: "Erro", description: "Número de telefone inválido ou não encontrado." });
        if(!localApiConfig) toast({ variant: "destructive", title: "Erro", description: "Configuração da API não carregada." });
        return;
    };

    setIsSending(true);
    console.log("Sending message:", message, "to", formattedPhoneNumber);
    toast({ title: "Enviando Mensagem..." });

    const sendUrl = `${localApiConfig.apiUrl}/message/sendText/${localApiConfig.apiInstance}`;

    const payload = {
        number: formattedPhoneNumber,
        options: { delay: 1200, presence: "composing" },
        textMessage: { text: message }
    };

    try {
        const response = await fetch(sendUrl, {
            method: 'POST',
            headers: {
                'apikey': localApiConfig.apiKey, // Use loaded config
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const responseData = await response.json();
        if (!response.ok) {
            const errorDetail = responseData?.message || responseData?.error?.message || responseData?.error || `Erro ${response.status}`;
            throw new Error(errorDetail);
        }
        console.log("Message sent response:", responseData);
        toast({ title: "Mensagem Enviada!", description: `Para: ${paciente.telefone}` });
        setMessage("");
    } catch (error: any) {
        console.error("Error sending message:", error);
        toast({ variant: "destructive", title: "Erro ao Enviar", description: error.message || "Não foi possível enviar a mensagem." });
    } finally {
        setIsSending(false);
    }
  };

  // --- Generic File Sending Logic ---
  const sendFile = async (file: File, type: 'image' | 'video' | 'audio' | 'document') => {
      if (!formattedPhoneNumber || !localApiConfig) {
          toast({ variant: "destructive", title: "Erro", description: !formattedPhoneNumber ? "Número de telefone inválido." : "Configuração da API não carregada." });
          return;
      }

      setIsSendingMedia(true);
      toast({ title: `Enviando ${type}...` });

      const isMedia = type === 'image' || type === 'video' || type === 'audio';
      const endpoint = isMedia
          ? `${localApiConfig.apiUrl}/message/sendMedia/${localApiConfig.apiInstance}`
          : `${localApiConfig.apiUrl}/message/sendFile/${localApiConfig.apiInstance}`;

      const formData = new FormData();
      formData.append('number', formattedPhoneNumber);
      formData.append('file', file);

      console.log(`Sending ${type} to ${endpoint} for number ${formattedPhoneNumber}`);

      try {
          const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'apikey': localApiConfig.apiKey }, // Use loaded config
              body: formData
          });
          const responseData = await response.json();
          if (!response.ok) {
              const errorDetail = responseData?.message || responseData?.error?.message || responseData?.error || `Erro ${response.status}`;
              throw new Error(errorDetail);
          }
          console.log(`${type} sent response:`, responseData);
          toast({ title: `${capitalize(type)} Enviado!`, description: `Para: ${paciente.telefone}` });
      } catch (error: any) {
          console.error(`Error sending ${type}:`, error);
          toast({ variant: "destructive", title: `Erro ao Enviar ${capitalize(type)}`, description: error.message || `Não foi possível enviar o ${type}.` });
      } finally {
          setIsSendingMedia(false);
          if (type === 'image' && imageInputRef.current) imageInputRef.current.value = "";
          if (type === 'video' && videoInputRef.current) videoInputRef.current.value = "";
          if (type === 'audio' && audioInputRef.current) audioInputRef.current.value = "";
          if (type === 'document' && documentInputRef.current) documentInputRef.current.value = "";
      }
  };

  // --- Trigger File Input ---
  const handleAttachmentClick = (type: 'image' | 'video' | 'audio' | 'document') => {
      switch (type) {
          case 'image': imageInputRef.current?.click(); break;
          case 'video': videoInputRef.current?.click(); break;
          case 'audio': audioInputRef.current?.click(); break;
          case 'document': documentInputRef.current?.click(); break;
      }
  };

  // --- Handle File Selection ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio' | 'document') => {
      const file = event.target.files?.[0];
      if (file) {
          console.log(`Selected ${type} file:`, file.name, file.size);
          sendFile(file, type);
      }
  };

  // --- Placeholder for Audio Recording ---
  const handleRecordAudio = () => {
      toast({ title: "Gravar Áudio", description: "Funcionalidade de gravação pendente." });
  };

  // Helper to capitalize first letter
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="flex flex-col h-[70vh] md:h-[65vh]">
      {/* Hidden File Inputs */}
      <input type="file" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} accept="image/*" style={{ display: 'none' }} />
      <input type="file" ref={videoInputRef} onChange={(e) => handleFileChange(e, 'video')} accept="video/*" style={{ display: 'none' }} />
      <input type="file" ref={audioInputRef} onChange={(e) => handleFileChange(e, 'audio')} accept="audio/*" style={{ display: 'none' }} />
      <input type="file" ref={documentInputRef} onChange={(e) => handleFileChange(e, 'document')} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" style={{ display: 'none' }} />

      {/* Chat Header */}
      <div className="px-1 pb-2 border-b mb-3">
          <h3 className="text-lg font-medium">Chat WhatsApp</h3>
          <p className="text-sm text-muted-foreground">{paciente.nome}</p>
          <p className="text-xs text-muted-foreground">
              Número: {paciente.telefone || "Não informado"} {formattedPhoneNumber ? `(${formattedPhoneNumber})` : ''}
          </p>
      </div>

      {/* Message Area */}
      <ScrollArea className="flex-1 mb-4 px-4 py-2 bg-muted/20 rounded-md">
        <div className="space-y-4">
          {/* Example Messages */}
          <div className="flex justify-start">
            <div className="bg-background rounded-lg p-3 max-w-[75%] shadow-sm border">
              <p className="text-sm">Olá! Gostaria de mais informações sobre a cirurgia.</p>
              <p className="text-xs text-muted-foreground text-right mt-1">10:30</p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-primary/90 text-primary-foreground rounded-lg p-3 max-w-[75%] shadow-sm">
               <p className="text-sm font-medium mb-1">{consultantName}</p>
              <p className="text-sm">Claro! Qual procedimento você tem interesse?</p>
              <p className="text-xs text-primary-foreground/80 text-right mt-1">10:32</p>
            </div>
          </div>
           <div className="flex justify-start">
              <div className="bg-background rounded-lg p-2 max-w-[60%] shadow-sm border">
                  <img src="/placeholder.svg" alt="Exemplo Imagem Recebida" className="rounded max-w-full h-auto mb-1" />
                  <p className="text-xs text-muted-foreground text-right">10:35</p>
              </div>
           </div>
           <div className="flex justify-end">
              <div className="bg-primary/90 text-primary-foreground rounded-lg p-3 max-w-[75%] shadow-sm">
                 <p className="text-sm font-medium mb-1">{consultantName}</p>
                 <div className="flex items-center gap-2 bg-primary/80 p-2 rounded">
                    <FileIcon className="h-6 w-6 text-primary-foreground/80 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium">documento_exemplo.pdf</p>
                        <p className="text-xs text-primary-foreground/80">1.2 MB</p>
                    </div>
                 </div>
                 <p className="text-xs text-primary-foreground/80 text-right mt-1">10:40</p>
              </div>
           </div>
           <div className="text-center text-muted-foreground py-10">
             <p>--- Histórico de mensagens aparecerá aqui ---</p>
             <p className="text-xs mt-1">(Integração com API Evolution pendente para buscar/receber)</p>
           </div>
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="flex items-center gap-2 border-t pt-4 px-1">
         <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" title="Anexar" disabled={isSending || isSendingMedia || !localApiConfig}>
                    <Paperclip className="h-5 w-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1">
                <div className="grid grid-cols-2 gap-1">
                    <Button variant="ghost" size="sm" className="flex items-center justify-start gap-2" onClick={() => handleAttachmentClick('image')}>
                        <ImageIcon className="h-4 w-4 text-blue-500" /> Imagem
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center justify-start gap-2" onClick={() => handleAttachmentClick('video')}>
                        <Video className="h-4 w-4 text-purple-500" /> Vídeo
                    </Button>
                     <Button variant="ghost" size="sm" className="flex items-center justify-start gap-2" onClick={() => handleAttachmentClick('audio')}>
                        <Headset className="h-4 w-4 text-orange-500" /> Áudio
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center justify-start gap-2" onClick={() => handleAttachmentClick('document')}>
                        <FileIcon className="h-4 w-4 text-gray-500" /> Documento
                    </Button>
                </div>
            </PopoverContent>
         </Popover>
        <Input
            placeholder={localApiConfig ? "Digite sua mensagem..." : "API não configurada"}
            className="flex-1"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isSending && !isSendingMedia && handleSendMessage()}
            disabled={isSending || isSendingMedia || !localApiConfig}
        />
        {message.trim() ? (
            <Button onClick={handleSendMessage} disabled={!formattedPhoneNumber || isSending || isSendingMedia || !localApiConfig} title="Enviar Mensagem">
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
            </Button>
        ) : (
            <Button variant="ghost" size="icon" onClick={handleRecordAudio} disabled={!formattedPhoneNumber || isSending || isSendingMedia || !localApiConfig} title="Gravar Áudio (Pendente)">
                <Mic className="h-5 w-5" />
            </Button>
        )}
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
  // apiConfig prop is removed as WhatsappChat now reads from localStorage
}

export function PacienteDetailModal({
    open,
    onOpenChange,
    paciente: initialPaciente,
    // apiConfig prop removed
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
    if (field === 'dataNascimento' || field === 'data') {
        try {
            const dateValue = new Date(value + 'T00:00:00');
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
                    const dateValue = new Date(value + 'T00:00:00');
                    processedValue = isValid(dateValue) ? dateValue : updatedProcedimentos[procIndex].data;
                } catch (e) {
                     console.error(`Error parsing procedure date:`, value, e);
                     processedValue = updatedProcedimentos[procIndex].data;
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

  const formattedNascimento = safeFormatDate(paciente.dataNascimento, "yyyy-MM-dd");
  const formattedMarketingIndicacao = safeFormatDate(paciente.marketingData?.dataIndicacao, "dd/MM/yyyy");
  const formattedMarketingEvento = safeFormatDate(paciente.marketingData?.dataEvento, "dd/MM/yyyy");


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
             {/* WhatsappChat now reads config from localStorage internally */}
             <WhatsappChat paciente={paciente} />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="historico" className="space-y-4">
             <div>
               <h3 className="text-lg font-medium">Histórico</h3>
               {paciente.historico.length === 0 ? (
                 <div className="text-center py-8 text-muted-foreground">Nenhum registro.</div>
               ) : (
                 <ScrollArea className="h-[60vh] pr-4">
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
