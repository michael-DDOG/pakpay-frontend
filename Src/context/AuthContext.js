// src/context/AuthContext.js
import { createContext } from 'react';

const AuthContext = createContext({
  signIn: async () => {},
  signOut: async () => {},
  userData: null,
  userToken: null
});

export default AuthContext;
