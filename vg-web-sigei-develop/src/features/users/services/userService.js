import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

export const userService = {
     getAll: async () => {
          const { data } = await apiClient.get(ENDPOINTS.USERS.BASE);
          return data;
     },

     getById: async (id) => {
          const { data } = await apiClient.get(ENDPOINTS.USERS.BY_ID(id));
          return data;
     },

     getByStatus: async (status) => {
          const { data } = await apiClient.get(ENDPOINTS.USERS.BY_STATUS(status));
          return data;
     },

     getByRoleAndStatus: async (role, status) => {
          const { data } = await apiClient.get(ENDPOINTS.USERS.BY_ROLE_STATUS(role, status));
          return data;
     },

     getByInstitution: async (institutionId) => {
          const { data } = await apiClient.get(ENDPOINTS.USERS.BY_INSTITUTION(institutionId));
          return data;
     },

     create: async (userData) => {
          const { data } = await apiClient.post(ENDPOINTS.USERS.BASE, userData);
          return data;
     },

     update: async (id, userData) => {
          const { data } = await apiClient.put(ENDPOINTS.USERS.BY_ID(id), userData);
          return data;
     },

     delete: async (id) => {
          const { data } = await apiClient.delete(ENDPOINTS.USERS.BY_ID(id));
          return data;
     },

     restore: async (id) => {
          const { data } = await apiClient.patch(ENDPOINTS.USERS.RESTORE(id));
          return data;
     },
};
