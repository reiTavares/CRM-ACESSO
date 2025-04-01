import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR"; // Updated import path

export type WeekDetailRow = {
  id: string;
  hospital: string;
  paciente: string;
  dataNascimento: Date;
  contato: string;
  origem: string;
  patologia: string;
  olho: "Direito" | "Esquerdo" | "Ambos";
  convenio: string;
  medico: string;
  horaConsulta: string;
  dataConsulta: Date | null;
  dataExame: Date | null;
  dataCirurgia: Date | null;
  dataSegundoOlho: Date | null;
  status: string;
  valorNegociacao: number;
  valorCaixa: number;
  relatorio: boolean;
  observacoes: string;
  dataRetorno: Date | null;
};

export const WeekDetailsColumns: ColumnDef<WeekDetailRow>[] = [
  {
    accessorKey: "hospital",
    header: "Hospital",
  },
  {
    accessorKey: "paciente",
    header: "Paciente",
  },
  {
    accessorKey: "dataNascimento",
    header: "Nascimento",
    cell: ({ row }) => {
      const date = row.getValue("dataNascimento") as Date;
      return date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "-";
    },
  },
  {
    accessorKey: "contato",
    header: "Contato",
  },
  {
    accessorKey: "origem",
    header: "Origem",
  },
  {
    accessorKey: "patologia",
    header: "Patologia",
  },
  {
    accessorKey: "olho",
    header: "Olho",
    cell: ({ row }) => {
      const olho = row.getValue("olho") as string;
      const colorMap = {
        "Direito": "bg-green-100 text-green-800",
        "Esquerdo": "bg-blue-100 text-blue-800",
        "Ambos": "bg-purple-100 text-purple-800",
      };
      
      const color = colorMap[olho as keyof typeof colorMap] || "bg-gray-100 text-gray-800";
      
      return (
        <Badge variant="outline" className={color}>
          {olho}
        </Badge>
      );
    },
  },
  {
    accessorKey: "convenio",
    header: "Convênio",
  },
  {
    accessorKey: "medico",
    header: "Médico",
  },
  {
    accessorKey: "horaConsulta",
    header: "Hora",
  },
  {
    accessorKey: "dataConsulta",
    header: "Data Consulta",
    cell: ({ row }) => {
      const date = row.getValue("dataConsulta") as Date;
      return date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "-";
    },
  },
  {
    accessorKey: "dataExame",
    header: "Data Exame",
    cell: ({ row }) => {
      const date = row.getValue("dataExame") as Date;
      return date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "-";
    },
  },
  {
    accessorKey: "dataCirurgia",
    header: "Data Cirurgia",
    cell: ({ row }) => {
      const date = row.getValue("dataCirurgia") as Date;
      return date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "-";
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusMap = {
        "Agendado": "bg-yellow-100 text-yellow-800",
        "Realizado": "bg-green-100 text-green-800",
        "Cancelado": "bg-red-100 text-red-800",
        "Remarcado": "bg-blue-100 text-blue-800",
        "Em andamento": "bg-purple-100 text-purple-800",
      };
      
      const style = statusMap[status as keyof typeof statusMap] || "bg-gray-100 text-gray-800";
      
      return (
        <Badge variant="outline" className={style}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "valorNegociacao",
    header: "Valor Negociação",
    cell: ({ row }) => {
      const valor = row.getValue("valorNegociacao") as number;
      return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    },
  },
  {
    accessorKey: "valorCaixa",
    header: "Valor Caixa",
    cell: ({ row }) => {
      const valor = row.getValue("valorCaixa") as number;
      return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    },
  },
];
