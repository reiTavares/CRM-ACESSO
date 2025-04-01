import React, { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction } from 'react';

      export interface ApiConfig {
        apiUrl: string;
        apiKey: string;
        apiInstance: string;
      }

      interface ApiConfigContextProps {
        apiConfig: ApiConfig;
        setApiConfig: Dispatch<SetStateAction<ApiConfig>>;
      }

      // Default values - consider loading from localStorage later if persistence is needed
      const defaultApiConfig: ApiConfig = {
        apiUrl: "https://evo1.profusaodigital.com",
        apiKey: "76777ED82273-4FD5-A172-5E5764FB6F28",
        apiInstance: "Acesso Oftalmologia",
      };

      const ApiConfigContext = createContext<ApiConfigContextProps>({
        apiConfig: defaultApiConfig,
        setApiConfig: () => {}, // Placeholder function
      });

      export const useApiConfig = () => {
        const context = useContext(ApiConfigContext);
        if (!context) {
          throw new Error('useApiConfig must be used within an ApiConfigProvider');
        }
        return context;
      };

      interface ApiConfigProviderProps {
        children: ReactNode;
      }

      export const ApiConfigProvider: React.FC<ApiConfigProviderProps> = ({ children }) => {
        // TODO: Consider loading initial state from localStorage here
        const [apiConfig, setApiConfig] = useState<ApiConfig>(defaultApiConfig);

        // TODO: Consider saving to localStorage whenever apiConfig changes using useEffect

        return (
          <ApiConfigContext.Provider value={{ apiConfig, setApiConfig }}>
            {children}
          </ApiConfigContext.Provider>
        );
      };
