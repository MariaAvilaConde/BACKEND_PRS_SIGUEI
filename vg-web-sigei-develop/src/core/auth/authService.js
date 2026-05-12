import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

export const authService = {
     login: async (username, password) => {
          const { data } = await apiClient.post(ENDPOINTS.AUTH.LOGIN, { username, password });
          return data;
     },

     refresh: async (refreshToken) => {
          const { data } = await apiClient.post(ENDPOINTS.AUTH.REFRESH, { refreshToken });
          return data;
     },

     logout: async (refreshToken) => {
          const { data } = await apiClient.post(ENDPOINTS.AUTH.LOGOUT, { refreshToken });
          return data;
     },

};
