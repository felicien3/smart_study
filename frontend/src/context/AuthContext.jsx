/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useReducer, useEffect } from "react";
import { getApiUrl } from "../utils/helpers";

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    case "RESTORE_SESSION":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    default:
      return state;
  }
};

const initialState = {
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token"),
  isAuthenticated: false,
  loading: true,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Verify token with backend
      fetch(`${getApiUrl()}/api/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (response.ok) {
            return;
          }
          throw new Error("Invalid token");
        })
        .then(() => {
          const savedUser = JSON.parse(localStorage.getItem("user") || "null");
          dispatch({
            type: "RESTORE_SESSION",
            payload: { user: savedUser, token },
          });
        })
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          dispatch({ type: "SET_LOADING", payload: false });
        });
    } else {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const login = (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    dispatch({
      type: "LOGIN_SUCCESS",
      payload: { user, token },
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    dispatch({ type: "LOGOUT" });
  };

  // Role helper functions
  const isSuperAdmin = () => state.user?.role === "super_admin";
  const isSchoolAdmin = () => state.user?.role === "school_admin";
  const isStudent = () => state.user?.role === "student";
  const isAdmin = () =>
    state.user?.role === "super_admin" || state.user?.role === "school_admin";
  const getRole = () => state.user?.role || null;
  const getSchoolId = () => state.user?.school_id || null;
  const isActive = () => state.user?.is_active !== false;

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        isSuperAdmin,
        isSchoolAdmin,
        isStudent,
        isAdmin,
        getRole,
        getSchoolId,
        isActive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
