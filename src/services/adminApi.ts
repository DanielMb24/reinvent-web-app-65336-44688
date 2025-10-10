//
// import { apiService, ApiResponse } from './api';
//
// export interface AdminData {
//   id?: number;
//   nom: string;
//   prenom: string;
//   email: string;
//   role?: string;
//   statut?: string;
//   etablissement_id?: number;
//   etablissement_nom?: string;
//   derniere_connexion?: string;
// }
//
// class AdminApiService {
//   async getAdmins(): Promise<ApiResponse<AdminData[]>> {
//     try {
//       return await apiService.makeRequest('/admins', 'GET');
//     } catch (error) {
//       console.error('Erreur récupération admins:', error);
//       throw error;
//     }
//   }
//
//   async createAdmin(adminData: Omit<AdminData, 'id'>): Promise<ApiResponse<AdminData>> {
//     try {
//       console.log('AdminApiService: Création admin avec données:', adminData);
//       return await apiService.makeRequest('/admin/admins', 'POST', adminData);
//     } catch (error) {
//       console.error('AdminApiService: Erreur création admin:', error);
//       throw error;
//     }
//   }
//
//
//
//
//
//   async updateAdmin(id: number, adminData: Partial<AdminData>): Promise<ApiResponse<AdminData>> {
//     try {
//       return await apiService.makeRequest(`/admin/admins/${id}`, 'PUT', adminData);
//     } catch (error) {
//       console.error('AdminApiService: Erreur modification admin:', error);
//       throw error;
//     }
//   }
//
//   async deleteAdmin(id: number): Promise<ApiResponse<void>> {
//     try {
//       return await apiService.makeRequest(`/admin/admins/${id}`, 'DELETE');
//     } catch (error) {
//       console.error('AdminApiService: Erreur suppression admin:', error);
//       throw error;
//     }
//   }
// }
//
// export const adminApiService = new AdminApiService();

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/admin';
const BASE_URL2 = 'http://localhost:3000/api';

export const adminApiService = {
    // Authentification
    login: async (credentials: { email: string; password: string }) => {
        try {
            console.log('Tentative de connexion admin avec:', credentials.email);
            const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
            console.log('Réponse login:', response.data);

            if (response.data.success && response.data.token) {
                localStorage.setItem('adminToken', response.data.token);
                localStorage.setItem('adminUser', JSON.stringify(response.data.admin));
            }

            return response.data;
        } catch (error: any) {
            console.error('Erreur login admin:', error);
            throw new Error(error.response?.data?.message || 'Erreur de connexion');
        }
    },

    logout: () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
    },

    getCurrentAdmin: () => {
        try {
            const adminData = localStorage.getItem('adminUser');
            return adminData ? JSON.parse(adminData) : null;
        } catch {
            return null;
        }
    },

    getToken: () => {
        return localStorage.getItem('adminToken');
    },

    // Gestion des admins
    getAdmins: async () => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.get(`${BASE_URL}/management/admins`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur récupération admins:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des admins');
        }
    },


    createAdmin: async (adminData: any) => {
        try {
            console.log('Service createAdmin appelé avec:', adminData);
            const token = adminApiService.getToken();
            const response = await axios.post(`${BASE_URL}/management/admins`, adminData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Réponse API:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Réponse API:', error.response?.status, error.response?.statusText);
            console.error('Erreur API:', error.response?.data);
            throw new Error(error.response?.data?.message || `Erreur ${error.response?.status}: ${error.response?.statusText}`);
        }
    },

    updateAdmin: async (id: number, adminData: any) => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.put(`${BASE_URL}/management/admins/${id}`, adminData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur modification admin:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la modification');
        }
    },

    deleteAdmin: async (id: number) => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.delete(`${BASE_URL}/management/admins/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur suppression admin:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la suppression');
        }
    },

    // Statistiques
    getStats: async () => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.get(`${BASE_URL}/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur récupération stats:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des statistiques');
        }
    },

    // Candidats
    getCandidats: async () => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.get(`${BASE_URL}/candidats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur récupération candidats:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des candidats');
        }
    },
    async getSupportRequests({page, limit, searchTerm, filterStatus}: {
        page: number;
        limit: number;
        searchTerm: string;
        filterStatus: string
    }) {
        const response = await axios.get(`${BASE_URL2}/support`, {
            params: {page, limit, search: searchTerm, status: filterStatus},
        });
        return response.data;
    },


    getCandidatDetails: async (nupcan: string) => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.get(`${BASE_URL}/candidats/${nupcan}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur récupération détails candidat:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des détails');
        }
    },

    // Établissement specific methods
    getCandidatsByEtablissement: async (etablissementId: number) => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.get(`${BASE_URL}/etablissement/${etablissementId}/candidats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur récupération candidats établissement:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des candidats');
        }
    },

    getDossiersByEtablissement: async (etablissementId: number) => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.get(`${BASE_URL}/etablissement/${etablissementId}/dossiers`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur récupération dossiers établissement:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des dossiers');
        }
    },

    getPaiementsByEtablissement: async (etablissementId: number) => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.get(`${BASE_URL}/etablissement/${etablissementId}/paiements`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur récupération paiements établissement:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des paiements');
        }
    },

    validateDocument: async (documentId: number, status: 'valide' | 'rejete', motif?: string) => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.post(`${BASE_URL}/documents/${documentId}/validate`, {
                statut: status,
                motif: motif
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur validation document:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la validation');
        }
    },

    // Notifications
    sendNotification: async (candidatNupcan: string, type: string, message: string) => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.post(`${BASE_URL}/notifications`, {
                candidat_nupcan: candidatNupcan,
                type: type,
                message: message
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur envoi notification:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de l\'envoi de la notification');
        }
    }
};
