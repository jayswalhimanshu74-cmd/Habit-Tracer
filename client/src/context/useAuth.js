import { useContext } from 'react';
import { AuthContext ,AuthProvider } from './AuthContext';

export const useAuth = () => useContext(AuthContext);
export {AuthProvider};