// services/scanDocument.ts
import { apiService } from './api';

export interface ScanResult {
    nom?: string;
    prenoms?: string;
    dateNaissance?: string;
    texteBrut: string;
    success: boolean;
    errors?: string[];
}

export interface ScanResponse {
    success: boolean;
    data?: ScanResult;
    error?: string;
    rawText?: string;
}

export const scanDocumentAdministratif = async (file: File): Promise<ScanResponse> => {
    const formData = new FormData();
    formData.append('document', file);

    try {
        const response = await apiService.post<ScanResponse>('/api/candidatures/scan-document', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (response.success && response.data) {
            return {
                success: true,
                data: response.data,
                rawText: response.rawText || ''
            };
        }

        return {
            success: false,
            error: response.error || 'Erreur lors du scan'
        };
    } catch (error: any) {
        console.error('Erreur scan:', error);
        return {
            success: false,
            error: error.response?.data?.error || 'Erreur de connexion au serveur'
        };
    }
};