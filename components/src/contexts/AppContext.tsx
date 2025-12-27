import React, { createContext, useContext } from "react";

type AppContextType = {
  currentUserId: string | null;
};

const AppContext = createContext<AppContextType>({
  currentUserId: null,
});

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{
  currentUserId: string | null;
  children: React.ReactNode;
}> = ({ currentUserId, children }) => {
  return (
    <AppContext.Provider value={{ currentUserId }}>
      {children}
    </AppContext.Provider>
  );
};
