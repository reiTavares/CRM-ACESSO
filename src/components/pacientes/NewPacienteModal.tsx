import React, { useState, useEffect } from 'react';
    import { Button } from "@/components/ui/button";
    // Importar apenas os componentes de CONTEÚDO do Dialog
    import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
    import { Loader2, Save, UserPlus } from "lucide-react";
    import { useToast } from "@/hooks/use-toast";
    import { cn } from '@/lib/utils';
    import { PacienteDataExtended } from './paciente-card';

    const mockHospitalNames = ["HODF", "HO Londrina", "HO Maringa", "HOA", "Hospital São Lucas", "Hospital Santa Maria", "Hospital São Francisco"];
    const mockAllDoctorNames = ["Dr. João Silva", "Dra. Ana Costa", "Dr. Carlos Souza", "Dra. Beatriz Lima", "Dra. Mariana Ferreira", "Dr. Gustavo Pereira", "Dr. Lucas Gomes", "Dra. Julia Almeida"];
    const origemOptions = ["Publicidade Digital", "Evento", "Publicidade Tradicional", "Indicação"];

    type NewPacienteFormData = Omit<PacienteDataExtended, 'id' | 'status' | 'procedimentos' | 'historico' | 'valor' | 'marketingData' | 'consultorResponsavel' | 'gestorResponsavel' | 'quemCriou'>;

    interface NewPacienteModalProps {
        // Não precisa mais de open/onOpenChange
        onSave: (newPacienteData: Omit<PacienteDataExtended, 'id' | 'status'>, closeModal?: () => void) => Promise<void>;
    }

    const initialFormData: NewPacienteFormData = {
        nome: '', hospital: '', medico: '', convenio: '', telefone: '', dataNascimento: null, cpf: '', telefone2: '', email: '', uf: '', cidade: '', bairro: '', origem: "Publicidade Digital",
    };

    // Este componente renderiza APENAS o CONTEÚDO do Dialog
    export const NewPacienteModal: React.FC<NewPacienteModalProps> = ({ onSave }) => {
        const { toast } = useToast();
        const [formData, setFormData] = useState<NewPacienteFormData>(initialFormData);
        const [isSaving, setIsSaving] = useState(false);
        const [formErrors, setFormErrors] = useState<Partial<Record<keyof NewPacienteFormData, string>>>({});

        // Resetar form quando o conteúdo é montado (quando o Dialog abre)
        useEffect(() => {
            setFormData(initialFormData);
            setFormErrors({});
            setIsSaving(false);
        }, []);

        const validateForm = (): boolean => { /* ...código mantido... */ const errors: Partial<Record<keyof NewPacienteFormData, string>> = {}; if (!formData.nome.trim()) errors.nome = "Nome é obrigatório."; if (!formData.telefone.trim()) errors.telefone = "Telefone 1 (WhatsApp) é obrigatório."; if (!formData.hospital) errors.hospital = "Hospital vinculado é obrigatório."; if (!formData.origem) errors.origem = "Origem é obrigatória."; setFormErrors(errors); return Object.keys(errors).length === 0; };
        const handleInputChange = (field: keyof NewPacienteFormData, value: string | Date | null) => { /* ...código mantido... */ setFormData(prev => ({ ...prev, [field]: value })); if (formErrors[field]) { setFormErrors(prev => ({ ...prev, [field]: undefined })); } };
        const handleSelectChange = (field: keyof NewPacienteFormData, value: string) => { /* ...código mantido... */ setFormData(prev => ({ ...prev, [field]: value })); if (formErrors[field]) { setFormErrors(prev => ({ ...prev, [field]: undefined })); } };

        const handleSubmit = async (event: React.FormEvent) => {
            event.preventDefault();
            if (!validateForm()) { toast({ variant: "destructive", title: "Erro de Validação", description: "Corrija os campos indicados." }); return; }
            setIsSaving(true);
            try {
                const dataToSave: Omit<PacienteDataExtended, 'id' | 'status' | 'consultorResponsavel' | 'gestorResponsavel' | 'quemCriou'> = { ...formData, telefone2: formData.telefone2 || undefined, email: formData.email || undefined, procedimentos: [], historico: [], valor: 0, marketingData: {}, dataNascimento: formData.dataNascimento ? new Date(formData.dataNascimento + 'T00:00:00') : null, };
                const completeDataForSave: Omit<PacienteDataExtended, 'id' | 'status'> = { ...dataToSave, consultorResponsavel: '', gestorResponsavel: '', quemCriou: '', };

                // Encontrar o botão DialogClose mais próximo e obter uma função para clicá-lo
                const dialogContentElement = (event.target as HTMLFormElement).closest('div[role="dialog"]');
                const closeButton = dialogContentElement?.querySelector('[data-radix-dialog-close]');
                const closeModalFn = closeButton ? () => (closeButton as HTMLElement).click() : undefined;

                await onSave(completeDataForSave, closeModalFn);
                // O fechamento agora é responsabilidade do onSave ou do DialogClose
            } catch (error: any) {
                console.error("Erro ao salvar novo paciente:", error);
                toast({ variant: "destructive", title: "Erro ao Salvar", description: `Não foi possível criar o paciente. ${error.message || ''}` });
            } finally {
                setIsSaving(false);
            }
        };

        const availableDoctors = formData.hospital ? mockAllDoctorNames : [];

        // Retorna APENAS o DialogContent e seus filhos
        return (
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={handleSubmit}>
                    <DialogHeader> <DialogTitle className="flex items-center"> <UserPlus className="mr-2 h-5 w-5" /> Novo Paciente </DialogTitle> <DialogDescription> Preencha os dados principais. Campos com * são obrigatórios. </DialogDescription> </DialogHeader>
                    <div className="grid gap-4 py-6 px-2 max-h-[60vh] overflow-y-auto">
                        {/* Nome */}
                        <div className="grid grid-cols-4 items-center gap-4"> <Label htmlFor="new-nome" className="text-right">Nome*</Label> <div className="col-span-3"> <Input id="new-nome" value={formData.nome} onChange={(e) => handleInputChange('nome', e.target.value)} className={cn(formErrors.nome && "border-destructive")} /> {formErrors.nome && <p className="text-xs text-destructive mt-1">{formErrors.nome}</p>} </div> </div>
                        {/* Hospital */}
                        <div className="grid grid-cols-4 items-center gap-4"> <Label htmlFor="new-hospital" className="text-right">Hospital*</Label> <div className="col-span-3"> <Select value={formData.hospital} onValueChange={(v) => handleSelectChange('hospital', v)}> <SelectTrigger id="new-hospital" className={cn(formErrors.hospital && "border-destructive")}><SelectValue placeholder="Selecione" /></SelectTrigger> <SelectContent>{mockHospitalNames.map(name => (<SelectItem key={name} value={name}>{name}</SelectItem>))}</SelectContent> </Select> {formErrors.hospital && <p className="text-xs text-destructive mt-1">{formErrors.hospital}</p>} </div> </div>
                        {/* Médico */}
                        <div className="grid grid-cols-4 items-center gap-4"> <Label htmlFor="new-medico" className="text-right">Médico</Label> <div className="col-span-3"> <Select value={formData.medico} onValueChange={(v) => handleSelectChange('medico', v)} disabled={!formData.hospital}> <SelectTrigger id="new-medico" className={cn(!formData.hospital && "text-muted-foreground")}><SelectValue placeholder={formData.hospital ? "Selecione (opcional)" : "Escolha hospital"} /></SelectTrigger> <SelectContent>{availableDoctors.map(name => (<SelectItem key={name} value={name}>{name}</SelectItem>))}</SelectContent> </Select> </div> </div>
                        {/* Telefone 1 */}
                        <div className="grid grid-cols-4 items-center gap-4"> <Label htmlFor="new-telefone1" className="text-right">Telefone 1*</Label> <div className="col-span-3"> <Input id="new-telefone1" placeholder="(WhatsApp)" value={formData.telefone} onChange={(e) => handleInputChange('telefone', e.target.value)} className={cn(formErrors.telefone && "border-destructive")} /> {formErrors.telefone && <p className="text-xs text-destructive mt-1">{formErrors.telefone}</p>} </div> </div>
                        {/* Origem */}
                        <div className="grid grid-cols-4 items-center gap-4"> <Label htmlFor="new-origem" className="text-right">Origem*</Label> <div className="col-span-3"> <Select value={formData.origem} onValueChange={(v) => handleSelectChange('origem', v as PacienteDataExtended['origem'])}> <SelectTrigger id="new-origem" className={cn(formErrors.origem && "border-destructive")}><SelectValue placeholder="Selecione" /></SelectTrigger> <SelectContent>{origemOptions.map(name => (<SelectItem key={name} value={name}>{name}</SelectItem>))}</SelectContent> </Select> {formErrors.origem && <p className="text-xs text-destructive mt-1">{formErrors.origem}</p>} </div> </div>
                        {/* Email */}
                        <div className="grid grid-cols-4 items-center gap-4"> <Label htmlFor="new-email" className="text-right">E-mail</Label> <Input id="new-email" type="email" value={formData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} className="col-span-3" /> </div>
                        {/* CPF */}
                        <div className="grid grid-cols-4 items-center gap-4"> <Label htmlFor="new-cpf" className="text-right">CPF</Label> <Input id="new-cpf" value={formData.cpf || ''} onChange={(e) => handleInputChange('cpf', e.target.value)} className="col-span-3" /> </div>
                        {/* Data Nasc. */}
                        <div className="grid grid-cols-4 items-center gap-4"> <Label htmlFor="new-dataNasc" className="text-right">Data Nasc.</Label> <Input id="new-dataNasc" type="date" value={formData.dataNascimento instanceof Date ? formData.dataNascimento.toISOString().split('T')[0] : formData.dataNascimento || ''} onChange={(e) => handleInputChange('dataNascimento', e.target.value)} className="col-span-3" /> </div>
                    </div>
                    <DialogFooter>
                        {/* Usar DialogClose para o botão Cancelar */}
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSaving}> {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} {isSaving ? "Salvando..." : "Salvar Novo Paciente"} </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        );
    };
