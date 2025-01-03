import { createContext, useContext, ReactNode } from 'react';
import { Page } from '../ControlPanel';

type PageContextType = {
  page: Page;
  setPage: (page: Page) => void;
};

const PageContext = createContext<PageContextType | undefined>(undefined);

export const usePageContext = () => {
  const context = useContext(PageContext);
  if (context === undefined) {
    throw new Error('usePageContext must be used within a PageProvider');
  }
  return context;
};

export const PageProvider = ({ children, value }: { children: ReactNode; value: PageContextType }) => {
  return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};
