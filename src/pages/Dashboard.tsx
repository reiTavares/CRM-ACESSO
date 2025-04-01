import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { WeekCard } from "@/components/dashboard/week-card";
import { 
  Phone, 
  Calendar, 
  Users, 
  TrendingDown, 
  Repeat, 
  DollarSign,
  BarChart4,
  Wallet,
  LineChart 
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Dados simulados
const producaoData = [
  { name: 'Consulta', valor_produzido: 45000, valor_negociacao: 15000 },
  { name: 'Exames', valor_produzido: 32000, valor_negociacao: 18000 },
  { name: 'Cirurgia', valor_produzido: 78000, valor_negociacao: 35000 },
];

// Dados simulados para as semanas
const weekData = [
  {
    id: "1",
    title: "Semana 1",
    dateRange: "03/06 - 09/06",
    totalRealizado: 98750,
    totalAgendado: 45200,
    isRiskZone: false,
    data: Array(15).fill(null).map((_, i) => ({
      id: `1-${i}`,
      hospital: `Hospital ${i % 3 + 1}`,
      paciente: `Paciente ${i + 1}`,
      dataNascimento: new Date(1980 + i, i % 12, (i % 28) + 1),
      contato: `(11) 9${i}999-${i}${i}99`,
      origem: i % 2 === 0 ? "Publicidade Digital" : "Indicação",
      patologia: i % 3 === 0 ? "Catarata" : i % 3 === 1 ? "Glaucoma" : "Retina",
      olho: i % 3 === 0 ? "Direito" : i % 3 === 1 ? "Esquerdo" : "Ambos",
      convenio: i % 4 === 0 ? "Unimed" : i % 4 === 1 ? "Amil" : i % 4 === 2 ? "SulAmérica" : "Particular",
      medico: `Dr. Silva ${i % 3 + 1}`,
      horaConsulta: `${(8 + i % 8)}:${i % 2 === 0 ? "00" : "30"}`,
      dataConsulta: new Date(2023, 5, 3 + i % 7),
      dataExame: i % 2 === 0 ? new Date(2023, 5, 10 + i % 7) : null,
      dataCirurgia: i % 3 === 0 ? new Date(2023, 5, 17 + i % 7) : null,
      dataSegundoOlho: i % 6 === 0 ? new Date(2023, 5, 24 + i % 7) : null,
      status: i % 5 === 0 ? "Agendado" : i % 5 === 1 ? "Realizado" : i % 5 === 2 ? "Cancelado" : i % 5 === 3 ? "Remarcado" : "Em andamento",
      valorNegociacao: 1500 + (i * 200),
      valorCaixa: i % 2 === 0 ? 1500 + (i * 200) : 0,
      relatorio: i % 3 === 0,
      observacoes: i % 2 === 0 ? "Paciente com histórico familiar" : "",
      dataRetorno: i % 4 === 0 ? new Date(2023, 6, i % 30 + 1) : null,
    })),
  },
  {
    id: "2",
    title: "Semana 2",
    dateRange: "10/06 - 16/06",
    totalRealizado: 112550,
    totalAgendado: 38700,
    isRiskZone: false,
    data: Array(12).fill(null).map((_, i) => ({
      id: `2-${i}`,
      hospital: `Hospital ${(i % 3) + 1}`,
      paciente: `Paciente ${i + 16}`,
      dataNascimento: new Date(1975 + i, i % 12, (i % 28) + 1),
      contato: `(11) 9${i}888-${i}${i}88`,
      origem: i % 2 === 0 ? "Evento" : "Publicidade Tradicional",
      patologia: i % 3 === 0 ? "Catarata" : i % 3 === 1 ? "DMRI" : "Estrabismo",
      olho: i % 3 === 0 ? "Direito" : i % 3 === 1 ? "Esquerdo" : "Ambos",
      convenio: i % 4 === 0 ? "Bradesco" : i % 4 === 1 ? "Amil" : i % 4 === 2 ? "SulAmérica" : "Particular",
      medico: `Dr. Santos ${i % 3 + 1}`,
      horaConsulta: `${(8 + i % 8)}:${i % 2 === 0 ? "00" : "30"}`,
      dataConsulta: new Date(2023, 5, 10 + i % 7),
      dataExame: i % 2 === 0 ? new Date(2023, 5, 17 + i % 7) : null,
      dataCirurgia: i % 3 === 0 ? new Date(2023, 5, 24 + i % 7) : null,
      dataSegundoOlho: i % 6 === 0 ? new Date(2023, 6, 1 + i % 7) : null,
      status: i % 5 === 0 ? "Agendado" : i % 5 === 1 ? "Realizado" : i % 5 === 2 ? "Cancelado" : i % 5 === 3 ? "Remarcado" : "Em andamento",
      valorNegociacao: 1800 + (i * 180),
      valorCaixa: i % 2 === 0 ? 1800 + (i * 180) : 0,
      relatorio: i % 3 === 0,
      observacoes: i % 2 === 0 ? "Paciente encaminhado por outro médico" : "",
      dataRetorno: i % 4 === 0 ? new Date(2023, 6, i % 30 + 15) : null,
    })),
  },
  {
    id: "3",
    title: "Semana 3",
    dateRange: "17/06 - 23/06",
    totalRealizado: 45200,
    totalAgendado: 78500,
    isRiskZone: true,
    data: Array(18).fill(null).map((_, i) => ({
      id: `3-${i}`,
      hospital: `Hospital ${(i % 3) + 1}`,
      paciente: `Paciente ${i + 28}`,
      dataNascimento: new Date(1985 + i, i % 12, (i % 28) + 1),
      contato: `(11) 9${i}777-${i}${i}77`,
      origem: i % 2 === 0 ? "Indicação" : "Publicidade Digital",
      patologia: i % 3 === 0 ? "Glaucoma" : i % 3 === 1 ? "Catarata" : "Pterígio",
      olho: i % 3 === 0 ? "Direito" : i % 3 === 1 ? "Esquerdo" : "Ambos",
      convenio: i % 4 === 0 ? "Unimed" : i % 4 === 1 ? "Bradesco" : i % 4 === 2 ? "Porto Seguro" : "Particular",
      medico: `Dr. Oliveira ${i % 3 + 1}`,
      horaConsulta: `${(8 + i % 8)}:${i % 2 === 0 ? "00" : "30"}`,
      dataConsulta: new Date(2023, 5, 17 + i % 7),
      dataExame: i % 2 === 0 ? new Date(2023, 5, 24 + i % 7) : null,
      dataCirurgia: i % 3 === 0 ? new Date(2023, 6, 1 + i % 7) : null,
      dataSegundoOlho: i % 6 === 0 ? new Date(2023, 6, 8 + i % 7) : null,
      status: i % 5 === 0 ? "Agendado" : i % 5 === 1 ? "Realizado" : i % 5 === 2 ? "Cancelado" : i % 5 === 3 ? "Remarcado" : "Em andamento",
      valorNegociacao: 1650 + (i * 220),
      valorCaixa: i % 2 === 0 ? 1650 + (i * 220) : 0,
      relatorio: i % 3 === 0,
      observacoes: i % 2 === 0 ? "Paciente com histórico de cirurgia ocular prévia" : "",
      dataRetorno: i % 4 === 0 ? new Date(2023, 7, i % 30 + 1) : null,
    })),
  },
  {
    id: "4",
    title: "Semana 4",
    dateRange: "24/06 - 30/06",
    totalRealizado: 32800,
    totalAgendado: 92000,
    isRiskZone: true,
    data: Array(20).fill(null).map((_, i) => ({
      id: `4-${i}`,
      hospital: `Hospital ${(i % 3) + 1}`,
      paciente: `Paciente ${i + 46}`,
      dataNascimento: new Date(1970 + i, i % 12, (i % 28) + 1),
      contato: `(11) 9${i}666-${i}${i}66`,
      origem: i % 2 === 0 ? "Publicidade Tradicional" : "Evento",
      patologia: i % 3 === 0 ? "Ceratocone" : i % 3 === 1 ? "Córnea" : "Catarata",
      olho: i % 3 === 0 ? "Direito" : i % 3 === 1 ? "Esquerdo" : "Ambos",
      convenio: i % 4 === 0 ? "SulAmérica" : i % 4 === 1 ? "Bradesco" : i % 4 === 2 ? "Amil" : "Particular",
      medico: `Dr. Costa ${i % 3 + 1}`,
      horaConsulta: `${(8 + i % 8)}:${i % 2 === 0 ? "00" : "30"}`,
      dataConsulta: new Date(2023, 5, 24 + i % 7),
      dataExame: i % 2 === 0 ? new Date(2023, 6, 1 + i % 7) : null,
      dataCirurgia: i % 3 === 0 ? new Date(2023, 6, 8 + i % 7) : null,
      dataSegundoOlho: i % 6 === 0 ? new Date(2023, 6, 15 + i % 7) : null,
      status: i % 5 === 0 ? "Agendado" : i % 5 === 1 ? "Realizado" : i % 5 === 2 ? "Cancelado" : i % 5 === 3 ? "Remarcado" : "Em andamento",
      valorNegociacao: 1750 + (i * 190),
      valorCaixa: i % 2 === 0 ? 1750 + (i * 190) : 0,
      relatorio: i % 3 === 0,
      observacoes: i % 2 === 0 ? "Paciente de primeira consulta" : "",
      dataRetorno: i % 4 === 0 ? new Date(2023, 7, i % 30 + 15) : null,
    })),
  }
];

const Dashboard = () => {
  const valorMeta = 350000;
  const valorAtual = 289300;
  const faltaMeta = valorMeta - valorAtual;
  const porcentagemMeta = Math.round((valorAtual / valorMeta) * 100);

  return (
    <AppShell>
      <div className="container mx-auto py-6 space-y-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        {/* Primeira linha */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            title="Leads Recebidos"
            value="156"
            icon={<Users />}
            description="Este mês"
            trend={8}
            trendColor="success"
          />
          <StatCard
            title="Ligações Realizadas"
            value="324"
            icon={<Phone />}
            description="Este mês"
            trend={12}
            trendColor="success"
          />
          <StatCard
            title="Consultas Agendadas"
            value="98"
            icon={<Calendar />}
            description="Este mês"
            trend={5}
            trendColor="success"
          />
          <StatCard
            title="Perdidos"
            value="32"
            icon={<TrendingDown />}
            description="Este mês"
            trend={-15}
            trendColor="destructive"
          />
          <StatCard
            title="Resgates"
            value="14"
            icon={<Repeat />}
            description="Este mês"
            trend={20}
            trendColor="success"
          />
        </div>

        {/* Segunda linha */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Valor da Meta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {valorMeta.toLocaleString('pt-BR')}</div>
              <ProgressBar 
                value={valorAtual} 
                max={valorMeta} 
                label="Progresso" 
                variant={porcentagemMeta >= 75 ? "success" : porcentagemMeta >= 50 ? "default" : "warning"}
                className="mt-2"
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Falta para Meta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {faltaMeta.toLocaleString('pt-BR')}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {porcentagemMeta}% da meta atingida
              </p>
            </CardContent>
          </Card>
          
          <StatCard
            title="Valor em Caixa"
            value={`R$ ${valorAtual.toLocaleString('pt-BR')}`}
            icon={<Wallet />}
            description="Este mês"
          />
          
          <StatCard
            title="Valor em Negociação"
            value="R$ 124.500"
            icon={<DollarSign />}
            description="Potencial"
          />
        </div>

        {/* Terceira linha - Gráficos */}
        <Card>
          <CardHeader>
            <CardTitle>Produção vs. Negociação por Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  width={500}
                  height={300}
                  data={producaoData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, '']}
                  />
                  <Legend />
                  <Bar dataKey="valor_produzido" name="Valor Produzido" fill="#4f46e5" />
                  <Bar dataKey="valor_negociacao" name="Valor em Negociação" fill="#c084fc" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quadro semanal */}
        <div>
          <h2 className="text-lg font-bold mb-4">Quadro Semanal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {weekData.map((week) => (
              <WeekCard
                key={week.id}
                title={week.title}
                dateRange={week.dateRange}
                totalRealizado={week.totalRealizado}
                totalAgendado={week.totalAgendado}
                isRiskZone={week.isRiskZone}
                weekData={week.data}
              />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
