import { createContext, useContext } from 'react';

export const AuthContext = createContext();
export const I18nContext = createContext();

export const useAuth = () => useContext(AuthContext);
export const useI18n = () => useContext(I18nContext);
