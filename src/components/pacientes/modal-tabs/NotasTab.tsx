import React, { useState } from 'react';
    import { Button } from "@/components/ui/button";
    import { Textarea } from "@/components/ui/textarea";
    import { Label } from "@/components/ui/label";
    import { ScrollArea } from "@/components/ui/scroll-area";
    import { PacienteDataExtended } from '@/components/pacientes/paciente-card'; // Ajuste o caminho
    import { NotaItem } from './NotaItem'; // Importar o item da nota
    import { Send } from 'lucide-react';

    interface NotasTabProps {
      paciente: PacienteDataExtended;
      // Função para adicionar a nota (será implementada no modal pai)
      onAddNota: (texto: string) => void;
      // Opcional: Estado de salvamento se a adição for assíncrona no futuro
      // isAddingNota?: boolean;
    }

    export const NotasTab: React.FC<NotasTabProps> = ({
      paciente,
      onAddNota,
      // isAddingNota = false,
    }) => {
      const [newNotaText, setNewNotaText] = useState('');
      const notas = paciente.notas || [];

      const handleAddClick = () => {
        if (!newNotaText.trim()) return; // Não adiciona nota vazia
        onAddNota(newNotaText.trim());
        setNewNotaText(''); // Limpa o textarea após adicionar
      };

      return (
        <div className="flex flex-col h-full"> {/* Garante que o flexbox ocupe a altura */}
          {/* Área de Input */}
          <div className="mb-4 border-b pb-4">
            <Label htmlFor="new-nota-text" className="text-lg font-medium mb-2 block">Adicionar Nova Nota</Label>
            <Textarea
              id="new-nota-text"
              value={newNotaText}
              onChange={(e) => setNewNotaText(e.target.value)}
              placeholder="Digite sua nota aqui..."
              rows={4}
              className="mb-2"
            />
            <Button
              onClick={handleAddClick}
              disabled={!newNotaText.trim()} // Desabilita se vazio
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              Salvar Nota
            </Button>
          </div>

          {/* Área de Exibição das Notas */}
          <h3 className="text-lg font-medium mb-2">Notas Salvas</h3>
          {notas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground flex-1">Nenhuma nota adicionada ainda.</div>
          ) : (
            <ScrollArea className="flex-1 pr-4"> {/* flex-1 para ocupar espaço restante */}
              <div className="space-y-3 pb-4">
                {/* Ordenar notas da mais recente para a mais antiga */}
                {[...notas].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((nota) => (
                  <NotaItem key={nota.id} nota={nota} />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      );
    };

    // Necessário para React.lazy se for usar
    // export default NotasTab;
