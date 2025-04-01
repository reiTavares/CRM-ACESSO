import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PhoneCall, Check, X, Plus, Clock, CalendarClock, FileText } from "lucide-react";
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

interface PacienteDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: PacienteData;
}

export function PacienteDetailModal({ open, onOpenChange, paciente }: PacienteDetailModalProps) {
  const [activeTab, setActiveTab] = useState("contato");
  const { toast } = useToast();

  const handleCall = () => {
    // Simulate API call
    toast({
      title: "Ligação iniciada",
      description: `Ligando para ${paciente.nome} (${paciente.telefone})`,
    });
    
    // Add to history
    const newHistorico = [...paciente.historico];
    newHistorico.unshift({
      id: Date.now().toString(),
      data: new Date(),
      tipo: "Ligação",
      descricao: "Ligação realizada",
      usuario: "Admin",
    });
    
    paciente.historico = newHistorico;
  };
  
  const handleStatusChange = (procedimentoId: string, status: "ganho" | "perdido") => {
    // Find and update procedure
    const procedimento = paciente.procedimentos.find(p => p.id === procedimentoId);
    if (procedimento) {
      procedimento.status = status;
      
      // Add to history
      const newHistorico = [...paciente.historico];
      newHistorico.unshift({
        id: Date.now().toString(),
        data: new Date(),
        tipo: "Status",
        descricao: `Procedimento ${procedimento.tipo} marcado como ${status === "ganho" ? "GANHO" : "PERDIDO"}`,
        usuario: "Admin",
      });
      
      paciente.historico = newHistorico;
      
      toast({
        title: `Procedimento ${status === "ganho" ? "ganho" : "perdido"}`,
        description: `${procedimento.tipo} foi marcado como ${status === "ganho" ? "ganho" : "perdido"}`,
        variant: status === "ganho" ? "default" : "destructive",
      });
    }
  };
  
  const addProcedimento = () => {
    const newId = Date.now().toString();
    const newProcedimento = {
      id: newId,
      tipo: "Consulta",
      hospital: "",
      medico: "",
      procedimento: "",
      valor: 0,
      data: new Date(),
      observacao: "",
      convenio: "",
      status: "pendente",
    };
    
    paciente.procedimentos.push(newProcedimento);
    
    // Add to history
    const newHistorico = [...paciente.historico];
    newHistorico.unshift({
      id: Date.now().toString(),
      data: new Date(),
      tipo: "Procedimento",
      descricao: "Novo procedimento adicionado",
      usuario: "Admin",
    });
    
    paciente.historico = newHistorico;
    
    toast({
      title: "Procedimento adicionado",
      description: "Novo procedimento adicionado com sucesso",
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">{paciente.nome}</DialogTitle>
            <Button variant="outline" size="icon" onClick={handleCall}>
              <PhoneCall className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="contato">Contato</TabsTrigger>
            <TabsTrigger value="procedimentos">Procedimentos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>
          
          <TabsContent value="contato" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Dados Pessoais</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input id="nome" value={paciente.nome} readOnly />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                        <Input 
                          id="dataNascimento" 
                          value={format(paciente.dataNascimento, "dd/MM/yyyy", { locale: ptBR })} 
                          readOnly 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input id="cpf" value={paciente.cpf} readOnly />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="telefone1">Telefone 1</Label>
                        <Input id="telefone1" value={paciente.telefone} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone2">Telefone 2</Label>
                        <Input id="telefone2" value={paciente.telefone2 || ""} readOnly />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input id="email" value={paciente.email || ""} readOnly />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="uf">UF</Label>
                        <Input id="uf" value={paciente.uf} readOnly />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="cidade">Cidade</Label>
                        <Input id="cidade" value={paciente.cidade} readOnly />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input id="bairro" value={paciente.bairro} readOnly />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Dados de Marketing</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="origem">Origem</Label>
                      <Input id="origem" value={paciente.origem} readOnly />
                    </div>
                    
                    {paciente.origem === "Publicidade Digital" || paciente.origem === "Publicidade Tradicional" ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="fonte">Fonte</Label>
                          <Input 
                            id="fonte" 
                            value={paciente.marketingData?.fonte || ""} 
                            readOnly 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="campanha">Campanha</Label>
                          <Input 
                            id="campanha" 
                            value={paciente.marketingData?.campanha || ""} 
                            readOnly 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="conjunto">Conjunto/Grupo</Label>
                            <Input 
                              id="conjunto" 
                              value={paciente.marketingData?.conjunto || ""} 
                              readOnly 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tipoCriativo">Tipo Criativo</Label>
                            <Input 
                              id="tipoCriativo" 
                              value={paciente.marketingData?.tipoCriativo || ""} 
                              readOnly 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tituloCriativo">Título Criativo</Label>
                          <Input 
                            id="tituloCriativo" 
                            value={paciente.marketingData?.tituloCriativo || ""} 
                            readOnly 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="palavraChave">Palavra-chave</Label>
                          <Input 
                            id="palavraChave" 
                            value={paciente.marketingData?.palavraChave || ""} 
                            readOnly 
                          />
                        </div>
                      </>
                    ) : paciente.origem === "Indicação" ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="quemIndicou">Quem Indicou</Label>
                          <Input 
                            id="quemIndicou" 
                            value={paciente.marketingData?.quemIndicou || ""} 
                            readOnly 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="dataIndicacao">Data Indicação</Label>
                            <Input 
                              id="dataIndicacao" 
                              value={paciente.marketingData?.dataIndicacao ? 
                                format(new Date(paciente.marketingData.dataIndicacao), "dd/MM/yyyy", { locale: ptBR }) : 
                                ""
                              }
                              readOnly 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="telefoneIndicacao">Telefone</Label>
                            <Input 
                              id="telefoneIndicacao" 
                              value={paciente.marketingData?.telefoneIndicacao || ""} 
                              readOnly 
                            />
                          </div>
                        </div>
                      </>
                    ) : paciente.origem === "Evento" ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="nomeEvento">Nome do Evento</Label>
                          <Input 
                            id="nomeEvento" 
                            value={paciente.marketingData?.nomeEvento || ""} 
                            readOnly 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dataEvento">Data do Evento</Label>
                          <Input 
                            id="dataEvento" 
                            value={paciente.marketingData?.dataEvento ? 
                              format(new Date(paciente.marketingData.dataEvento), "dd/MM/yyyy", { locale: ptBR }) : 
                              ""
                            }
                            readOnly 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="descricaoEvento">Descrição</Label>
                          <Textarea 
                            id="descricaoEvento" 
                            value={paciente.marketingData?.descricaoEvento || ""} 
                            readOnly 
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="procedimentos" className="space-y-4">
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
                  <div key={procedimento.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">
                        {procedimento.tipo}
                        {procedimento.status === "ganho" && (
                          <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
                            Ganho
                          </Badge>
                        )}
                        {procedimento.status === "perdido" && (
                          <Badge variant="outline" className="ml-2 bg-red-100 text-red-800">
                            Perdido
                          </Badge>
                        )}
                      </h4>
                      
                      {procedimento.status === "pendente" && (
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                            onClick={() => handleStatusChange(procedimento.id, "ganho")}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Ganho
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                            onClick={() => handleStatusChange(procedimento.id, "perdido")}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Perdido
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`tipo-${index}`}>Tipo de Procedimento</Label>
                          <Select defaultValue={procedimento.tipo}>
                            <SelectTrigger id={`tipo-${index}`}>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Consulta">Consulta</SelectItem>
                              <SelectItem value="Exame">Exame</SelectItem>
                              <SelectItem value="Cirurgia">Cirurgia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`hospital-${index}`}>Hospital</Label>
                          <Input id={`hospital-${index}`} value={procedimento.hospital} />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`medico-${index}`}>Médico</Label>
                          <Input id={`medico-${index}`} value={procedimento.medico} />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`procedimento-${index}`}>Procedimento específico</Label>
                          <Input id={`procedimento-${index}`} value={procedimento.procedimento} />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`valor-${index}`}>Valor</Label>
                          <Input 
                            id={`valor-${index}`} 
                            type="number" 
                            value={procedimento.valor} 
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`data-${index}`}>Data de realização</Label>
                          <Input 
                            id={`data-${index}`} 
                            type="date" 
                            value={format(new Date(procedimento.data), "yyyy-MM-dd")} 
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`convenio-${index}`}>Convênio</Label>
                          <Input id={`convenio-${index}`} value={procedimento.convenio} />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`observacao-${index}`}>Observação</Label>
                          <Textarea 
                            id={`observacao-${index}`} 
                            value={procedimento.observacao} 
                            className="h-[72px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="historico">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Histórico</h3>
              
              {paciente.historico.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum registro no histórico.
                </div>
              ) : (
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
