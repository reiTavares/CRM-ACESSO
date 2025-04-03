import React from 'react';
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Textarea } from "@/components/ui/textarea";
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
    import { PacienteDataExtended } from '@/components/pacientes/paciente-detail-modal'; // Assuming type is exported from modal
    import { UserCog, UserCheck } from "lucide-react"; // Import necessary icons

    interface ContatoTabProps {
      paciente: PacienteDataExtended;
      handleInputChange: (field: keyof PacienteDataExtended, value: any) => void;
      handleMarketingInputChange: (field: keyof NonNullable<PacienteDataExtended['marketingData']>, value: any) => void;
      handleHospitalChange: (value: string) => void;
      handleDoctorChange: (value: string) => void;
      availableDoctors: string[];
      hospitalNames: string[];
      formattedNascimento: string;
      formattedMarketingIndicacao: string;
      formattedMarketingEvento: string;
    }

    export const ContatoTab: React.FC<ContatoTabProps> = ({
      paciente,
      handleInputChange,
      handleMarketingInputChange,
      handleHospitalChange,
      handleDoctorChange,
      availableDoctors,
      hospitalNames,
      formattedNascimento,
      formattedMarketingIndicacao,
      formattedMarketingEvento,
    }) => {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Dados Pessoais */}
          <div className="space-y-4 md:col-span-1 md:border-r md:pr-6">
            <h3 className="text-lg font-medium mb-2 border-b pb-1">Dados Pessoais</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <Label htmlFor="hospital-vinculado">Hospital Vinculado</Label>
                <Select value={paciente.hospital} onValueChange={handleHospitalChange}>
                  <SelectTrigger id="hospital-vinculado"><SelectValue placeholder="Selecione o hospital" /></SelectTrigger>
                  <SelectContent>{hospitalNames.map(name => (<SelectItem key={name} value={name}>{name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="medico-vinculado">Médico Vinculado</Label>
                <Select value={paciente.medico} onValueChange={handleDoctorChange} disabled={!paciente.hospital}>
                  <SelectTrigger id="medico-vinculado"><SelectValue placeholder="Selecione o médico" /></SelectTrigger>
                  <SelectContent>{availableDoctors.length > 0 ? availableDoctors.map(name => (<SelectItem key={name} value={name}>{name}</SelectItem>)) : <SelectItem value="" disabled>Selecione um hospital</SelectItem>}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label htmlFor="nome">Nome Completo</Label><Input id="nome" value={paciente.nome || ''} onChange={(e) => handleInputChange('nome', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label htmlFor="dataNascimento">Data de Nascimento</Label><Input id="dataNascimento" type="date" value={formattedNascimento} onChange={(e) => handleInputChange('dataNascimento', e.target.value)}/></div>
                <div className="space-y-1"><Label htmlFor="cpf">CPF</Label><Input id="cpf" value={paciente.cpf || ''} onChange={(e) => handleInputChange('cpf', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label htmlFor="telefone1">Telefone 1 (WhatsApp)</Label><Input id="telefone1" value={paciente.telefone || ''} onChange={(e) => handleInputChange('telefone', e.target.value)} /></div>
                <div className="space-y-1"><Label htmlFor="telefone2">Telefone 2</Label><Input id="telefone2" value={paciente.telefone2 || ""} onChange={(e) => handleInputChange('telefone2', e.target.value)} /></div>
              </div>
              <div className="space-y-1"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={paciente.email || ""} onChange={(e) => handleInputChange('email', e.target.value)} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label htmlFor="uf">UF</Label><Input id="uf" value={paciente.uf || ''} onChange={(e) => handleInputChange('uf', e.target.value)} /></div>
                <div className="space-y-1 col-span-2"><Label htmlFor="cidade">Cidade</Label><Input id="cidade" value={paciente.cidade || ''} onChange={(e) => handleInputChange('cidade', e.target.value)} /></div>
              </div>
              <div className="space-y-1"><Label htmlFor="bairro">Bairro</Label><Input id="bairro" value={paciente.bairro || ''} onChange={(e) => handleInputChange('bairro', e.target.value)} /></div>
            </div>
          </div>

          {/* Column 2: Marketing & Controle */}
          <div className="space-y-6 md:col-span-1">
            {/* Dados de Marketing Section */}
            <div className="space-y-4">
               <h3 className="text-lg font-medium mb-2 border-b pb-1">Dados de Marketing</h3>
               <div className="grid grid-cols-1 gap-3">
                 <div className="space-y-1">
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
                     <div className="space-y-1"><Label>Fonte</Label><Input value={paciente.marketingData?.fonte || ""} onChange={(e) => handleMarketingInputChange('fonte', e.target.value)} /></div>
                     <div className="space-y-1"><Label>Campanha</Label><Input value={paciente.marketingData?.campanha || ""} onChange={(e) => handleMarketingInputChange('campanha', e.target.value)} /></div>
                     <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1"><Label>Conjunto/Grupo</Label><Input value={paciente.marketingData?.conjunto || ""} onChange={(e) => handleMarketingInputChange('conjunto', e.target.value)} /></div>
                       <div className="space-y-1"><Label>Tipo Criativo</Label><Input value={paciente.marketingData?.tipoCriativo || ""} onChange={(e) => handleMarketingInputChange('tipoCriativo', e.target.value)} /></div>
                     </div>
                     <div className="space-y-1"><Label>Título Criativo</Label><Input value={paciente.marketingData?.tituloCriativo || ""} onChange={(e) => handleMarketingInputChange('tituloCriativo', e.target.value)} /></div>
                     <div className="space-y-1"><Label>Palavra-chave</Label><Input value={paciente.marketingData?.palavraChave || ""} onChange={(e) => handleMarketingInputChange('palavraChave', e.target.value)} /></div>
                   </>
                 ) : paciente.origem === "Indicação" ? (
                   <>
                     <div className="space-y-1"><Label>Quem Indicou</Label><Input value={paciente.marketingData?.quemIndicou || ""} onChange={(e) => handleMarketingInputChange('quemIndicou', e.target.value)} /></div>
                     <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1"><Label>Data Indicação</Label><Input type="date" value={formattedMarketingIndicacao} onChange={(e) => handleMarketingInputChange('dataIndicacao', e.target.value)} /></div>
                       <div className="space-y-1"><Label>Telefone</Label><Input value={paciente.marketingData?.telefoneIndicacao || ""} onChange={(e) => handleMarketingInputChange('telefoneIndicacao', e.target.value)} /></div>
                     </div>
                   </>
                 ) : paciente.origem === "Evento" ? (
                   <>
                     <div className="space-y-1"><Label>Nome do Evento</Label><Input value={paciente.marketingData?.nomeEvento || ""} onChange={(e) => handleMarketingInputChange('nomeEvento', e.target.value)} /></div>
                     <div className="space-y-1"><Label>Data do Evento</Label><Input type="date" value={formattedMarketingEvento} onChange={(e) => handleMarketingInputChange('dataEvento', e.target.value)} /></div>
                     <div className="space-y-1"><Label>Descrição</Label><Textarea value={paciente.marketingData?.descricaoEvento || ""} onChange={(e) => handleMarketingInputChange('descricaoEvento', e.target.value)} /></div>
                   </>
                 ) : null}
               </div>
            </div>

            {/* Dados de Controle Section */}
            <div className="space-y-4 pt-4 border-t">
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
                           placeholder="Nome do consultor"
                       />
                   </div>
               </div>
            </div>
          </div>
        </div>
      );
    };
