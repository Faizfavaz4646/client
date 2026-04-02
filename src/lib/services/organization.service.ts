import { api } from "../api";
import type { RegisterOrgPayload } from "@/types/organization";

export const OrganizationService = {
  // 1. Register Organization
  registerOrganization: async (data: RegisterOrgPayload) => {
    const response = await api.post('/organizations/register', data);
    return response.data;
  },

  // 2. Get Public Organizations List (for user signup)
  getAllOrganizations: async () => {
    const response = await api.get('/organizations/list');
    return response.data;
  },

  // 3. Get User's Organizations
  getUserOrganizations: async () => {
    const response = await api.get('/organizations');
    return response.data;
  },
};
