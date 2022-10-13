import React from 'react';
const IsRestoringContext = /*#__PURE__*/React.createContext(false);
export const useIsRestoring = () => React.useContext(IsRestoringContext);
export const IsRestoringProvider = IsRestoringContext.Provider;