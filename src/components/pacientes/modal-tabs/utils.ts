import { format, isValid, parseISO } from "date-fns";
    import { ptBR } from "date-fns/locale/pt-BR";

    export const safeFormatDate = (dateInput: Date | string | number | null | undefined, formatString: string): string => {
      if (!dateInput) return "";
      try {
        const date = typeof dateInput === 'number'
          ? new Date(dateInput * 1000)
          : typeof dateInput === 'string'
          ? parseISO(dateInput)
          : dateInput;

        if (date instanceof Date && !isNaN(date.getTime())) {
          return format(date, formatString, { locale: ptBR });
        }
      } catch (error) {
        console.error("Error formatting date:", dateInput, error);
      }
      return "";
    };
