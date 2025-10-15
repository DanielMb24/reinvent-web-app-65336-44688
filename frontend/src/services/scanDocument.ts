// services/scanDocument.ts
import axios, { AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export interface ScanResult {
    nom?: string;
    prenoms?: string;
    dateNaissance?: string;
    texteBrut: string;
    success: boolean;
    errors?: string[];
    confidence?: number;
}

export interface ScanResponse {
    success: boolean;
    data?: ScanResult;
    error?: string;
    rawText?: string;
    confidence?: number;
}

// services/scanDocument.ts




export const scanApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur request
scanApi.interceptors.request.use((config) => {
    console.log('📤 Requête scan:', config.method?.toUpperCase(), config.url);

    // Token d'auth
    const token = localStorage.getItem('token') ||
        sessionStorage.getItem('token') ||
        localStorage.getItem('authToken');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // IMPORTANT: Ne pas forcer Content-Type pour FormData
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    return config;
}, (error) => {
    console.error('❌ Erreur requête scan:', error);
    return Promise.reject(error);
});

// Intercepteur response
scanApi.interceptors.response.use(
    (response: AxiosResponse) => {
        console.log('📥 Réponse scan:', response.status, response.data);
        return response;
    },
    (error: AxiosError) => {
        console.error('💥 Erreur réponse scan:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });

        // Gestion spécifique des erreurs
        if (error.code === 'ECONNABORTED') {
            const errorMsg = 'Timeout: Le scan prend trop de temps. Essayez avec un document plus clair.';
            return Promise.reject(new Error(errorMsg));
        }

        if (error.response?.status === 413) {
            return Promise.reject(new Error('Fichier trop volumineux. Maximum 10MB autorisé.'));
        }

        if (error.response?.status === 415) {
            return Promise.reject(new Error('Format non supporté. Utilisez PDF, JPG ou PNG.'));
        }

        return Promise.reject(error);
    }
);

export const scanDocumentAdministratif = async (file: File): Promise<ScanResponse> => {
    console.log('🔍 === DÉBUT SCAN ===');
    console.log('📄 Fichier:', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type,
        lastModified: new Date(file.lastModified).toLocaleString()
    });

    // Validation client
    if (!file) {
        throw new Error('Aucun fichier sélectionné');
    }

    if (file.size > 10 * 1024 * 1024) {
        throw new Error('Fichier trop volumineux. Maximum 10MB autorisé.');
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error(`Format non supporté: ${file.type}. Utilisez PDF, JPG ou PNG.`);
    }

    const formData = new FormData();
    formData.append('document', file, file.name); // Nom du champ = "document"

    // Debug FormData
    console.log('📋 Contenu FormData:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }

    try {
        const response = await scanApi.post<ScanResponse>('/candidatures/scan-document', formData, {
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    console.log(`📤 Upload: ${percentCompleted}%`);
                }
            }
        });

        if (response.data.success && response.data.data) {
            console.log('✅ SCAN RÉUSSI:', {
                nom: response.data.data.nom,
                prenoms: response.data.data.prenoms,
                dateNaissance: response.data.data.dateNaissance,
                confidence: response.data.confidence
            });

            return {
                success: true,
                data: response.data.data,
                rawText: response.data.rawText || '',
                confidence: response.data.confidence
            };
        }

        return {
            success: false,
            error: response.data.error || 'Données non reconnues dans le document'
        };

    } catch (error: any) {
        console.error('❌ ERREUR SCAN COMPLÈTE:', error);

        let errorMessage = 'Erreur lors du scan du document';

        if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
        } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        } else if (error.code) {
            errorMessage = `Erreur technique: ${error.code}`;
        }

        return {
            success: false,
            error: errorMessage
        };
    }
};

// Fonction de test
export const testScanConnectivity = async (): Promise<boolean> => {
    try {
        await scanApi.head('/candidatures/scan-document');
        return true;
    } catch {
        return false;
    }
};