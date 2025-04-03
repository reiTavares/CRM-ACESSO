import React from 'react';
    import { WhatsappChat } from '@/components/pacientes/whatsapp-chat';
    import { PacienteDataExtended } from '@/components/pacientes/paciente-detail-modal'; // Assuming type is exported from modal

    interface WhatsappTabWrapperProps {
      paciente: PacienteDataExtended | null;
      isActiveTab: boolean;
    }

    export const WhatsappTabWrapper: React.FC<WhatsappTabWrapperProps> = ({ paciente, isActiveTab }) => {
      // You could add loading states or error handling specific to this tab here if needed
      if (!paciente) {
        return <div className="text-center py-8 text-muted-foreground">Selecione um paciente.</div>;
      }

      return (
        <WhatsappChat
          paciente={paciente}
          isActiveTab={isActiveTab}
        />
      );
    };
