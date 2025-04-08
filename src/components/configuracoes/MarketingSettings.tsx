import React from 'react';
    import { Button } from "@/components/ui/button";
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
    import { DataTable } from "@/components/dashboard/data-table";
    import { ColumnDef } from "@tanstack/react-table";
    import { Badge } from "@/components/ui/badge";
    import { Separator } from "@/components/ui/separator";
    import { ArrowUpDown, PlusCircle } from "lucide-react";
    import { useToast } from "@/hooks/use-toast";

    // Tipos e Dados Mockados
    type FonteMarketing = { id: string; nome: string; origem: "Publicidade Digital" | "Publicidade Tradicional" | "Indicação" | "Evento"; ativo: boolean; }
    const fontesMarketingColumns: ColumnDef<FonteMarketing>[] = [ { accessorKey: "nome", header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Nome<ArrowUpDown className="ml-2 h-4 w-4" /></Button>), }, { accessorKey: "origem", header: "Origem", cell: ({ row }) => { const origem = row.getValue("origem") as string; const colorMap: { [key: string]: string } = { "Publicidade Digital": "bg-blue-100 text-blue-800", "Publicidade Tradicional": "bg-amber-100 text-amber-800", "Indicação": "bg-green-100 text-green-800", "Evento": "bg-purple-100 text-purple-800", }; return (<Badge variant="outline" className={colorMap[origem] ?? "bg-gray-100 text-gray-800"}>{origem}</Badge>); }, }, { accessorKey: "ativo", header: "Status", cell: ({ row }) => { const ativo = row.getValue("ativo") as boolean; return (<Badge variant={ativo ? "default" : "outline"} className={ativo ? "" : "bg-gray-100 text-gray-800"}>{ativo ? "Ativo" : "Inativo"}</Badge>); }, }, { id: "acoes", cell: () => (<div className="flex space-x-2"><Button variant="ghost" size="sm">Editar</Button><Button variant="ghost" size="sm" className="text-destructive">Desativar</Button></div>), }, ];
    const fontesMarketing: FonteMarketing[] = [ { id: "1", nome: "Facebook", origem: "Publicidade Digital", ativo: true }, { id: "2", nome: "Google", origem: "Publicidade Digital", ativo: true }, { id: "3", nome: "Instagram", origem: "Publicidade Digital", ativo: true }, { id: "4", nome: "Revista", origem: "Publicidade Tradicional", ativo: false }, { id: "5", nome: "TV", origem: "Publicidade Tradicional", ativo: true }, { id: "6", nome: "Rádio", origem: "Publicidade Tradicional", ativo: false }, { id: "7", nome: "Paciente", origem: "Indicação", ativo: true }, { id: "8", nome: "Médico", origem: "Indicação", ativo: true }, { id: "9", nome: "Feira de Saúde", origem: "Evento", ativo: true }, { id: "10", nome: "Congresso", origem: "Evento", ativo: true }, ];

    const MarketingSettings: React.FC = () => {
        const { toast } = useToast();

        // Placeholder para ação
        const handleAddItem = (type: string) => {
            toast({ title: `Adicionar ${type}`, description: "Funcionalidade em desenvolvimento", });
        };

        // TODO: Adicionar lógica para buscar/salvar dados reais de fontes de marketing

        return (
            <Card className="w-full">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Campos de Marketing</CardTitle>
                            <CardDescription>Configure as opções para os campos de marketing.</CardDescription>
                        </div>
                        <Button onClick={() => handleAddItem("fonte de marketing")} className="self-end sm:self-center">
                            <PlusCircle className="h-4 w-4 mr-2" />Nova Fonte
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Origens (Fixas)</h3>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">Publicidade Digital</Badge>
                            <Badge variant="outline" className="bg-amber-100 text-amber-800">Publicidade Tradicional</Badge>
                            <Badge variant="outline" className="bg-green-100 text-green-800">Indicação</Badge>
                            <Badge variant="outline" className="bg-purple-100 text-purple-800">Evento</Badge>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Fontes (Configuráveis)</h3>
                        <DataTable columns={fontesMarketingColumns} data={fontesMarketing} searchPlaceholder="Filtrar fontes..." />
                    </div>
                </CardContent>
            </Card>
        );
    };

    export default MarketingSettings;
