import React, { createContext, useContext, useState } from "react";

const MenuContext = createContext();

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error("useMenu must be used within MenuProvider");
  }
  return context;
};

export const MenuProvider = ({ children }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <MenuContext.Provider value={{ showMoreMenu, setShowMoreMenu }}>
      {children}
    </MenuContext.Provider>
  );
};

