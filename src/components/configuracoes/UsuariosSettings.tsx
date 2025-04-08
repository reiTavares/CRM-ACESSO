import React from 'react';
    import { Button } from "@/components/ui/button";
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
    import { DataTable } from "@/components/dashboard/data-table";
    import { ColumnDef } from "@tanstack/react-table";
    import { Badge } from "@/components/ui/badge";
    import { ArrowUpDown, PlusCircle, ShieldCheck } from "lucide-react";
    import { useToast } from "@/hooks/use-toast";

    // Tipos e Dados Mockados
    type Usuario = { id: string; nome: string; email: string; cpf: string; nivelAcesso: "Super Admin" | "Admin" | "Gestor" | "Supervisor" | "Consultor"; }
    const usuariosColumns: ColumnDef<Usuario>[] = [ { accessorKey: "nome", header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Nome<ArrowUpDown className="ml-2 h-4 w-4" /></Button>), }, { accessorKey: "email", header: "Email", }, { accessorKey: "cpf", header: "CPF", }, { accessorKey: "nivelAcesso", header: "Nível de Acesso", cell: ({ row }) => { const nivel = row.getValue("nivelAcesso") as string; const colorMap: { [key: string]: string } = { "Super Admin": "bg-purple-100 text-purple-800", "Admin": "bg-blue-100 text-blue-800", "Gestor": "bg-green-100 text-green-800", "Supervisor": "bg-amber-100 text-amber-800", "Consultor": "bg-slate-100 text-slate-800", }; return (<Badge variant="outline" className={colorMap[nivel] ?? "bg-gray-100 text-gray-800"}>{nivel}</Badge>); }, }, { id: "acoes", cell: () => (<div className="flex space-x-2"><Button variant="ghost" size="sm">Editar</Button></div>), }, ];
    const usuarios: Usuario[] = [ { id: "1", nome: "Admin Master", email: "admin@crm.com", cpf: "111.222.333-44", nivelAcesso: "Super Admin" }, { id: "2", nome: "Gestor de Vendas", email: "gestor@crm.com", cpf: "222.333.444-55", nivelAcesso: "Gestor" }, { id: "3", nome: "Supervisor 1", email: "supervisor1@crm.com", cpf: "333.444.555-66", nivelAcesso: "Supervisor" }, { id: "4", nome: "Consultor 1", email: "consultor1@crm.com", cpf: "444.555.666-77", nivelAcesso: "Consultor" }, { id: "5", nome: "Consultor 2", email: "consultor2@crm.com", cpf: "555.666.777-88", nivelAcesso: "Consultor" }, ];

    const UsuariosSettings: React.FC = () => {
        const { toast } = useToast();

        // Placeholder para ação
        const handleAddItem = (type: string) => {
            toast({ title: `Adicionar ${type}`, description: "Funcionalidade em desenvolvimento", });
        };

        // TODO: Adicionar lógica para buscar/salvar dados reais de usuários

        return (
            <Card className="w-full">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Usuários</CardTitle>
                            <CardDescription>Gerencie os usuários e seus níveis de acesso.</CardDescription>
                        </div>
                        <Button onClick={() => handleAddItem("usuário")} className="self-end sm:self-center">
                            <PlusCircle className="h-4 w-4 mr-2" />Novo Usuário
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-6">
                        <h3 className="text-sm font-medium mb-2 flex items-center">
                            <ShieldCheck className="h-4 w-4 mr-2 text-muted-foreground" />Níveis de Acesso
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                            <Badge variant="outline" className="bg-purple-100 text-purple-800 justify-center">Super Admin</Badge>
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 justify-center">Admin</Badge>
                            <Badge variant="outline" className="bg-green-100 text-green-800 justify-center">Gestor</Badge>
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 justify-center">Supervisor</Badge>
                            <Badge variant="outline" className="bg-slate-100 text-slate-800 justify-center">Consultor</Badge>
                        </div>
                    </div>
                    <DataTable columns={usuariosColumns} data={usuarios} searchPlaceholder="Filtrar usuários..." />
                </CardContent>
            </Card>
        );
    };

    export default UsuariosSettings;
