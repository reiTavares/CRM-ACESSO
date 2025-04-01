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

    const hospitalsData: Record<string, string[]> = {
      "HODF": [
        "POTENCIAL DE ACUIDADE VISUAL – MONOCULAR",
        "RETINOGRAFIA (SO HONORARIO) – MONOCULAR",
        "TESTE DO REFLEXO VERMELHO EM RECEM NATO (TESTE DO OLHINHO)",
        "TESTE PROVOCATIVO PARA GLAUCOMA- TSH – BINOCULAR",
        "TOMOGRAFIA DE COERENCIA OPTICA – MONOCULAR",
        "ULTRA-SONOGRAFIA DIAGNOSTICA – MONOCULAR",
        "ULTRA-SONOGRAGIA BIOMICROSCOPICA – MONOCCULAR",
        "PACOTE DE EXAMES - CIRURGIA DE CATARATA (BIO/CERA/MAP/MICRO/PAQUI)",
        "PACOTE DE EXAMES - CIRURGIA REFRATIVA",
        "PACOTE DE EXAMES – PTERÍGIO",
        "PACOTE DE EXAMES PLASTICA OCULAR",
        "XANTELASMA PALPEBRAL - EXERCESE (POR LADO)",
        "INJECÃO INTRAVÍTREA DE TRIANCINOLONA - PACOTE - POR APLICAÇÃO",
        "LIFTING DE SUPERCILIO - MONOCULAR",
        "PACOTE DE CIRURGIA DE PTERIGIO + TRANSPLANTE DE CONJUNTIVA COM COLA UNILATERAL",
        "INJEÇÃO INTRAVÍTREA DE AVASTIN - MONOCULAR",
        "PACOTE DE CIRURGIA REFRATIVA TRANS-PRK AO PACOTE DE CIRURGIA REFRATIVA",
        "LASIK AO PACOTE CIRURGIA DE CATARATA / FACECTOMIA - MONOCULAR",
        "PTOSE PALPEBRAL - CORRECAO CIRURGICA ( POR LADO)",
        "IMPLANTE INTRAVÍTREO DE POLÍMERO FARMACOLÓGICO DE LIBERAÇÃO CONT. - OZURDEX - POR PROCEDIMENTO",
        "ANTIANGIOGENICOS - EYLIA/LUCENTES - POR APLICAÇÃO",
        "IMPLANTE DE ANEL INTRA-ESTROMAL- INCLUSO 2 SEGUIMENTOS DE ANEL",
        "BLEFAROPLASTIA SUPERIOR – BINOCULAR",
        "CORREÇÃO DE BOLSAS INFERIOR BIONULAR",
        "RETINOPEXIA COM INTROFLEXAO ESCLERAL - MONOCULAR",
        "VITRECTOMIA VPP + MEMBRANECTONIA +OLEO +PERFUO - MONOCULAR",
        "VITRECTOMIA VPP + MEMBRANECTONIA +FACECTOMIA COM IMPLANTE DE LIO (LIO MONOFOCAL BASICA) MONOCULAR",
        "CROSSLINKING - MONOCULAR"
      ],
    };

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

      // Available procedures based on the currently selected hospital
      const availableProcedures = hospitalsData[paciente.hospital] || [];

      useEffect(() => {
        // Reset state when initialPaciente changes
        setPaciente(initialPaciente);
      }, [initialPaciente]);

      const handleInputChange = (field: keyof PacienteData, value: any) => {
        setPaciente(prev => ({ ...prev, [field]: value }));
      };

      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle>{paciente.nome}</DialogTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => { /* Handle call */ }}>
                    <PhoneCall className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => { /* Handle save changes */ }}>
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
                      <div className="space-y-2">
                        <Label htmlFor="hospital-vinculado">Hospital Vinculado</Label>
                        <Select value={paciente.hospital} onValueChange={(value) => handleInputChange('hospital', value)}>
                          <SelectTrigger id="hospital-vinculado">
                            <SelectValue placeholder="Selecione o hospital" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(hospitalsData).map(name => (
                              <SelectItem key={name} value={name}>{name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Other input fields... */}
                    </div>
                  </div>
                  
                  {/* Procedures Column */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium mb-2">Procedimentos</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {availableProcedures.map((procedure, index) => (
                        <div key={index} className="flex items-center">
                          <span>{procedure}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="historico">
                {/* Historical content... */}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      );
    }
