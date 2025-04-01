import { useState } from "react";
import { Calendar, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/dashboard/data-table";
import { WeekDetailsColumns } from "@/components/dashboard/week-details-columns";

interface WeekCardProps {
  title: string;
  dateRange: string;
  totalRealizado: number;
  totalAgendado: number;
  isRiskZone?: boolean;
  weekData: any[];
}

export function WeekCard({
  title,
  dateRange,
  totalRealizado,
  totalAgendado,
  isRiskZone = false,
  weekData
}: WeekCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <Card className={cn(isRiskZone && "risk-zone")}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium">{title}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">{dateRange}</p>
        </CardHeader>
        <CardContent className="space-y-2 pb-0">
          <div className="flex justify-between items-center">
            <span className="text-sm">Realizado</span>
            <span className="font-medium">R$ {totalRealizado.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Em Negociação</span>
            <span className="font-medium">R$ {totalAgendado.toLocaleString('pt-BR')}</span>
          </div>
        </CardContent>
        <CardFooter className="pt-4">
          <Button 
            variant="outline" 
            className="w-full text-xs" 
            onClick={() => setShowDetails(true)}
          >
            Ver Detalhes
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title} - {dateRange}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <DataTable columns={WeekDetailsColumns} data={weekData} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
