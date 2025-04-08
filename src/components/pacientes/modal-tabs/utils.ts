import { format, isValid, parseISO } from "date-fns";
    import { ptBR } from "date-fns/locale/pt-BR";

    /**
     * Formata uma data de forma segura, lidando com diferentes tipos de entrada e datas inválidas.
     * Retorna uma string vazia se a entrada for nula, indefinida ou resultar em uma data inválida.
     *
     * @param dateInput A data a ser formatada (Date, string ISO, timestamp numérico em segundos, null ou undefined).
     * @param formatString O formato desejado (ex: "dd/MM/yyyy", "yyyy-MM-dd HH:mm").
     * @returns A data formatada ou uma string vazia em caso de erro ou entrada inválida.
     */
    export const safeFormatDate = (dateInput: Date | string | number | null | undefined, formatString: string): string => {
      // Retorna vazio imediatamente para null ou undefined
      if (dateInput === null || dateInput === undefined) {
        return "";
      }

      let date: Date;

      try {
        if (dateInput instanceof Date) {
          // Se já for um objeto Date, verifica se é válido
          if (!isValid(dateInput)) {
            console.warn("safeFormatDate: Invalid Date object received:", dateInput);
            return "";
          }
          date = dateInput;
        } else if (typeof dateInput === 'number') {
          // Se for número, assume timestamp em segundos e converte para milissegundos
          date = new Date(dateInput * 1000);
          if (!isValid(date)) {
            console.warn("safeFormatDate: Invalid timestamp received:", dateInput);
            return "";
          }
        } else if (typeof dateInput === 'string') {
          // Se for string, tenta parsear como ISO 8601
          date = parseISO(dateInput);
          if (!isValid(date)) {
            // Tenta parsear como data simples se ISO falhar (cuidado com ambiguidades)
            // Considerar usar uma biblioteca mais robusta para parsing se formatos variados são esperados.
            const simpleDate = new Date(dateInput);
            if (isValid(simpleDate)) {
              date = simpleDate;
            } else {
              console.warn("safeFormatDate: Invalid date string received:", dateInput);
              return "";
            }
          }
        } else {
          // Tipo inesperado
          console.warn("safeFormatDate: Unexpected input type received:", typeof dateInput, dateInput);
          return "";
        }

        // Se chegou aqui, a data é (provavelmente) válida, formata
        return format(date, formatString, { locale: ptBR });

      } catch (error) {
        // Captura erros inesperados durante o processo
        console.error("safeFormatDate: Error during date processing:", dateInput, error);
        return "";
      }
    };
