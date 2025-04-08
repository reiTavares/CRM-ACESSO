import React, { useState, useMemo } from 'react';
    import { Button } from "@/components/ui/button";
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
    import { DataTable } from "@/components/dashboard/data-table";
    import { ColumnDef } from "@tanstack/react-table";
    import {
        Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
        DialogFooter, DialogClose, DialogTrigger
    } from "@/components/ui/dialog";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
    import { ArrowUpDown, FileSpreadsheet, PlusCircle, Trash2, Pencil } from "lucide-react";
    import { useToast } from "@/hooks/use-toast";
    import { cn } from '@/lib/utils';

    // --- Tipos ---
    // Exportar para ser usado em outros lugares
    export interface ProcedimentoConfig {
        id: string;
        hospitalVinculado: string; // Nome do hospital
        descricao: string;
        preco: number;
    }

    // --- Mock Data (Atualizado e Expandido) ---
    const mockHospitalNames = ["HODF", "HO Londrina", "HO Maringa", "HOA", "Hospital São Lucas", "Hospital Santa Maria", "Hospital São Francisco"];

    // Exportar para ser usado no modal do paciente
    export const initialProcedimentos: ProcedimentoConfig[] = [
        // HODF
        { id: 'proc-conf-1', hospitalVinculado: 'HODF', descricao: 'Consulta Oftalmológica Padrão', preco: 350.00 },
        { id: 'proc-conf-2', hospitalVinculado: 'HODF', descricao: 'Exame de Fundo de Olho', preco: 150.50 },
        { id: 'proc-conf-11', hospitalVinculado: 'HODF', descricao: 'Cirurgia de Pterígio', preco: 2800.00 },
        { id: 'proc-conf-16', hospitalVinculado: 'HODF', descricao: 'Exame de Paquimetria', preco: 120.00 },

        // HO Londrina
        { id: 'proc-conf-3', hospitalVinculado: 'HO Londrina', descricao: 'Consulta de Retina', preco: 450.00 },
        { id: 'proc-conf-12', hospitalVinculado: 'HO Londrina', descricao: 'Exame OCT (Tomografia)', preco: 400.00 },
        { id: 'proc-conf-13', hospitalVinculado: 'HO Londrina', descricao: 'Cirurgia Refrativa (PRK) - Um Olho', preco: 3800.00 },

        // HO Maringa
        { id: 'proc-conf-14', hospitalVinculado: 'HO Maringa', descricao: 'Consulta de Glaucoma', preco: 420.00 },
        { id: 'proc-conf-15', hospitalVinculado: 'HO Maringa', descricao: 'Exame Campo Visual Computadorizado', preco: 200.00 },
        { id: 'proc-conf-17', hospitalVinculado: 'HO Maringa', descricao: 'Cirurgia de Estrabismo', preco: 6500.00 },


        // HOA
        { id: 'proc-conf-4', hospitalVinculado: 'HOA', descricao: 'Cirurgia de Catarata (Facectomia)', preco: 5500.99 },
        { id: 'proc-conf-5', hospitalVinculado: 'HOA', descricao: 'Cirurgia Refrativa (LASIK) - Um Olho', preco: 4000.00 },
        { id: 'proc-conf-6', hospitalVinculado: 'HOA', descricao: 'Consulta Pediátrica Oftalmo', preco: 380.00 },
        { id: 'proc-conf-7', hospitalVinculado: 'HOA', descricao: 'Exame de Topografia Corneana', preco: 250.00 },

        // Hospital São Lucas
        { id: 'proc-conf-8', hospitalVinculado: 'Hospital São Lucas', descricao: 'Consulta Geral', preco: 300.00 },
        { id: 'proc-conf-9', hospitalVinculado: 'Hospital São Lucas', descricao: 'Exame de Refração Completo', preco: 100.00 },
        { id: 'proc-conf-10', hospitalVinculado: 'Hospital São Lucas', descricao: 'Injeção Intravítrea (Anti-VEGF)', preco: 3200.00 },
    ];

    // --- Componente (Lógica interna mantida como antes) ---
    const ProcedimentosSettings: React.FC = () => {
        const { toast } = useToast();
        // Usar os dados iniciais atualizados
        const [procedimentos, setProcedimentos] = useState<ProcedimentoConfig[]>(initialProcedimentos);
        const [isDialogOpen, setIsDialogOpen] = useState(false);
        const [currentProcedimento, setCurrentProcedimento] = useState<ProcedimentoConfig | null>(null);
        const [formData, setFormData] = useState<{ hospitalVinculado: string; descricao: string; preco: string }>({ hospitalVinculado: '', descricao: '', preco: '' });
        const [formErrors, setFormErrors] = useState<{ hospitalVinculado?: string; descricao?: string; preco?: string }>({});

        const validateForm = (): boolean => {
            const errors: typeof formErrors = {};
            if (!formData.hospitalVinculado) errors.hospitalVinculado = "Hospital é obrigatório.";
            if (!formData.descricao.trim()) errors.descricao = "Descrição é obrigatória.";
            const precoNum = parseFloat(formData.preco);
            if (isNaN(precoNum) || precoNum < 0) errors.preco = "Preço inválido.";
            else if (!/^\d+(\.\d{1,2})?$/.test(formData.preco)) errors.preco = "Use formato 0.00 para preço.";
            setFormErrors(errors);
            return Object.keys(errors).length === 0;
        };

        const handleInputChange = (field: keyof typeof formData, value: string) => {
            setFormData(prev => ({ ...prev, [field]: value }));
            if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: undefined }));
        };

        const handleSelectChange = (value: string) => {
            setFormData(prev => ({ ...prev, hospitalVinculado: value }));
            if (formErrors.hospitalVinculado) setFormErrors(prev => ({ ...prev, hospitalVinculado: undefined }));
        };

        const openAddDialog = () => {
            setCurrentProcedimento(null);
            setFormData({ hospitalVinculado: '', descricao: '', preco: '' });
            setFormErrors({});
            setIsDialogOpen(true);
        };

        const openEditDialog = (procedimento: ProcedimentoConfig) => {
            setCurrentProcedimento(procedimento);
            setFormData({ hospitalVinculado: procedimento.hospitalVinculado, descricao: procedimento.descricao, preco: procedimento.preco.toFixed(2) });
            setFormErrors({});
            setIsDialogOpen(true);
        };

        const handleSubmit = (event: React.FormEvent) => {
            event.preventDefault();
            if (!validateForm()) { toast({ variant: "destructive", title: "Erro de Validação", description: "Corrija os campos indicados." }); return; }
            const precoNum = parseFloat(formData.preco);
            // TODO: API call
            if (currentProcedimento) {
                const updatedProcedimento: ProcedimentoConfig = { ...currentProcedimento, hospitalVinculado: formData.hospitalVinculado, descricao: formData.descricao.trim(), preco: precoNum };
                setProcedimentos(prev => prev.map(p => p.id === currentProcedimento.id ? updatedProcedimento : p));
                toast({ title: "Procedimento Atualizado" });
            } else {
                const newProcedimento: ProcedimentoConfig = { id: `proc-conf-${Date.now()}`, hospitalVinculado: formData.hospitalVinculado, descricao: formData.descricao.trim(), preco: precoNum };
                setProcedimentos(prev => [newProcedimento, ...prev]);
                toast({ title: "Procedimento Adicionado" });
            }
            setIsDialogOpen(false);
        };

        const handleDelete = (procedimentoId: string, descricao: string) => {
            // TODO: API call + Confirmação
            if (window.confirm(`Tem certeza que deseja excluir "${descricao}"?`)) {
                setProcedimentos(prev => prev.filter(p => p.id !== procedimentoId));
                toast({ title: "Procedimento Excluído" });
            }
        };

        const procedimentosColumns: ColumnDef<ProcedimentoConfig>[] = useMemo(() => [
            { accessorKey: "hospitalVinculado", header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Hospital<ArrowUpDown className="ml-2 h-4 w-4" /></Button>), filterFn: (row, id, value) => value.includes(row.getValue(id)), },
            { accessorKey: "descricao", header: "Descrição", },
            { accessorKey: "preco", header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Preço<ArrowUpDown className="ml-2 h-4 w-4" /></Button>), cell: ({ row }) => { const preco = parseFloat(row.getValue("preco")); return <div className="text-right font-medium">R$ {preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>; }, },
            { id: "acoes", cell: ({ row }) => { const proc = row.original; return ( <div className="flex justify-end space-x-2"> <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(proc)} title="Editar"><Pencil className="h-4 w-4" /></Button> <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(proc.id, proc.descricao)} title="Excluir"><Trash2 className="h-4 w-4" /></Button> </div> ); }, },
        ], []); // Dependências vazias pois as funções são estáveis

        const handleFileUpload = () => { toast({ title: "Upload", description: "Em desenvolvimento." }); };

        return (
            <Card className="w-full">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div><CardTitle>Procedimentos Configuráveis</CardTitle><CardDescription>Gerencie os procedimentos padrão e seus preços por hospital.</CardDescription></div>
                        <div className="flex space-x-2 self-end sm:self-center">
                            <Button variant="outline" onClick={handleFileUpload}><FileSpreadsheet className="h-4 w-4 mr-2" />Importar CSV</Button>
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild><Button onClick={openAddDialog}><PlusCircle className="h-4 w-4 mr-2" />Novo Procedimento</Button></DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <form onSubmit={handleSubmit}>
                                        <DialogHeader><DialogTitle>{currentProcedimento ? 'Editar' : 'Adicionar'} Procedimento</DialogTitle><DialogDescription>Preencha os detalhes.</DialogDescription></DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="hospital" className="text-right">Hospital*</Label>
                                                <div className="col-span-3">
                                                    <Select value={formData.hospitalVinculado} onValueChange={handleSelectChange}>
                                                        <SelectTrigger id="hospital" className={cn(formErrors.hospitalVinculado && "border-destructive")}><SelectValue placeholder="Selecione" /></SelectTrigger>
                                                        <SelectContent>{mockHospitalNames.map(name => (<SelectItem key={name} value={name}>{name}</SelectItem>))}</SelectContent>
                                                    </Select>
                                                    {formErrors.hospitalVinculado && <p className="text-xs text-destructive mt-1">{formErrors.hospitalVinculado}</p>}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="descricao" className="text-right">Descrição*</Label>
                                                <Input id="descricao" value={formData.descricao} onChange={(e) => handleInputChange('descricao', e.target.value)} className={cn("col-span-3", formErrors.descricao && "border-destructive")} />
                                                {formErrors.descricao && <p className="col-start-2 col-span-3 text-xs text-destructive mt-1">{formErrors.descricao}</p>}
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="preco" className="text-right">Preço (R$)*</Label>
                                                <Input id="preco" type="text" placeholder="Ex: 350.00" value={formData.preco} onChange={(e) => handleInputChange('preco', e.target.value.replace(',', '.'))} className={cn("col-span-3", formErrors.preco && "border-destructive")} />
                                                {formErrors.preco && <p className="col-start-2 col-span-3 text-xs text-destructive mt-1">{formErrors.preco}</p>}
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                                            <Button type="submit">{currentProcedimento ? 'Salvar' : 'Adicionar'}</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable columns={procedimentosColumns} data={procedimentos} searchPlaceholder="Filtrar por descrição..." />
                </CardContent>
            </Card>
        );
    };

    export default ProcedimentosSettings;
