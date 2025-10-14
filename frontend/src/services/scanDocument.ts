// services/scanDocument.ts
import axios, { AxiosError } from 'axios';

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
}

// Configuration axios avec baseURL par défaut
const getBaseURL = (): string => {
    // 1. Essayer de récupérer depuis les variables d'environnement
    if (process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL) {
        return process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL || '';
    }

    // 2. Détection automatique de l'environnement
    if (typeof window !== 'undefined') {
        // Client-side : utiliser l'URL actuelle comme base
        return window.location.origin + '/api';
    }

    // Server-side : utiliser une base par défaut
    return process.env.NODE_ENV === 'production'
        ? 'https://votre-api.com/api'
        : 'http://localhost:3000/api';
};

const scanApi = axios.create({
    baseURL: getBaseURL(),
    timeout: 60000, // Timeout global pour OCR
});

// Intercepteur pour ajouter les headers d'auth
scanApi.interceptors.request.use((config) => {
    // Récupérer le token depuis localStorage ou sessionStorage
    const token = localStorage.getItem('token') ||
        sessionStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        sessionStorage.getItem('authToken');

    // Ou depuis les cookies si vous les utilisez
    if (!token && document.cookie) {
        const cookies = document.cookie.split(';');
        const authCookie = cookies.find(cookie => cookie.trim().startsWith('token=') ||
            cookie.trim().startsWith('auth='));
        if (authCookie) {
            token = authCookie.split('=')[1];
        }
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // Ou selon votre format : config.headers.Authorization = token;
    }

    // Ne pas forcer multipart/form-data, axios le gère automatiquement pour FormData
    delete config.headers['Content-Type'];

    return config;
});

// Intercepteur pour les erreurs
scanApi.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        console.error('Erreur scan API:', error);

        // Gestion des erreurs de timeout
        if (error.code === 'ECONNABORTED') {
            throw new Error('Timeout : Le scan prend trop de temps. Essayez avec un document plus clair.');
        }

        // Gestion des erreurs 4xx/5xx
        if (error.response?.status === 413) {
            throw new Error('Fichier trop volumineux. Maximum 10MB autorisé.');
        }

        if (error.response?.status === 415) {
            throw new Error('Format de fichier non supporté. Utilisez PDF, JPG ou PNG.');
        }

        return Promise.reject(error);
    }
);

export const scanDocumentAdministratif = async (file: File): Promise<ScanResponse> => {
    // Validation du fichier
    if (!file) {
        throw new Error('Aucun fichier sélectionné');
    }

    if (file.size > 10 * 1024 * 1024) {
        throw new Error('Le fichier est trop volumineux. Maximum 10MB autorisé.');
    }

    if (!file.type.match(/^(application\/pdf|image\/(jpeg|jpg|png))/)) {
        throw new Error('Format non supporté. Utilisez PDF, JPG ou PNG.');
    }

    const formData = new FormData();
    formData.append('document', file, file.name);

    try {
        console.log(`Scan en cours pour: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

        const response = await scanApi.post<{
            success: boolean;
            data?: ScanResult;
            error?: string;
            rawText?: string;
            confidence?: number;
            fullTextLength?: number;
        }>('/candidatures/scan-document', formData);

        if (response.data.success && response.data.data) {
            console.log('Scan réussi:', {
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
        console.error('Erreur scan:', error);

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

// Fonction utilitaire pour tester la connectivité
export const testScanService = async (): Promise<boolean> => {
    try {
        const response = await scanApi.get('/candidatures/scan-document'); // ou une route de health check
        return response.status === 200;
    } catch {
        return false;
    }
};