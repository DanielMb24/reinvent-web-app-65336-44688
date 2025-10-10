import {api, apiService} from './api';

export interface Document {
    id: string;
    nomdoc: string;
    type?: string;
    document_statut: 'valide' | 'rejete' | 'en_attente';
    url: string;
    taille?: number;
}

export interface DocumentData {
    id: string | number;
    nomdoc: string;
    type?: string;
    statut: 'valide' | 'rejete' | 'en_attente';
    document_statut?: 'valide' | 'rejete' | 'en_attente';
    docdsr?: string;
    nom_fichier?: string;
    url?: string;
    taille?: number;
    taille_fichier?: number;
    chemin_fichier?: string;
    commentaire_validation?: string;
    create_at?: string;
    created_at?: string;
}

export const documentService = {
    async getDocumentsByNupcan(nupcan: string): Promise<Document[]> {
        try {
            const response = await api.get(`/documents/nupcan/${encodeURIComponent(nupcan)}`);
            return response.data.data.map((doc: any) => ({
                id: doc.id.toString(),
                nomdoc: doc.nomdoc,
                type: doc.type,
                document_statut: doc.document_statut || doc.statut || 'en_attente',
                url: doc.docdsr || doc.nom_fichier,
                taille: doc.taille || (doc.nom_fichier ? 1024 : undefined),
            }));
        } catch (error) {
            console.error('Error fetching documents by nupcan:', error);
            throw new Error('Failed to fetch documents');
        }
    },

    async uploadDocument(formData: FormData): Promise<Document> {
        try {
            const response = await api.post('/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const doc = response.data.data;
            return {
                id: doc.id.toString(),
                nomdoc: doc.nomdoc,
                type: doc.type,
                document_statut: doc.statut || 'en_attente',
                url: doc.docdsr || doc.nom_fichier,
                taille: doc.taille,
            };
        } catch (error) {
            console.error('Error uploading document:', error);
            throw new Error('Failed to upload document');
        }
    },

    async replaceDocument(id: string, formData: FormData): Promise<Document> {
        try {
            const response = await api.put(`/documents/${id}/replace`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const doc = response.data.data;
            return {
                id: doc.id.toString(),
                nomdoc: doc.nomdoc,
                type: doc.type,
                document_statut: doc.statut || 'en_attente',
                url: doc.docdsr || doc.nom_fichier,
                taille: doc.taille,
            };
        } catch (error) {
            console.error('Error replacing document:', error);
            throw new Error('Failed to replace document');
        }
    },

    async updateDocument(id: string, file: File): Promise<Document> {
        const formData = new FormData();
        formData.append('document', file);
        return this.replaceDocument(id, formData);
    },

    async deleteDocument(nupcan: string, documentId: string): Promise<void> {
        try {
            console.log('Suppression document:', documentId);
            const response = await apiService.makeRequest(`/documents/${documentId}`, 'DELETE');
            if (!response.success) throw new Error(response.message);
        } catch (error) {
            console.error('Erreur suppression document:', error);
            throw error;
        }
    },

    async getDocumentsByCandidat(nupcan: string): Promise<any> {
        return this.getDocumentsByNupcan(nupcan);
    },

    async validateDocument(documentId: string, validationData: any): Promise<any> {
        try {
            const response = await apiService.updateDocumentStatus(
                documentId,
                validationData.statut,
                validationData.commentaire
            );
            return response;
        } catch (error) {
            console.error('Error validating document:', error);
            throw new Error('Failed to validate document');
        }
    },

    async downloadDocument(documentId: string): Promise<Blob> {
        try {
            const response = await fetch(`${api.defaults.baseURL}/documents/${documentId}/download`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.blob();
        } catch (error) {
            console.error('Error downloading document:', error);
            throw new Error('Failed to download document');
        }
    },

    getDocumentPreviewUrl(documentId: string): string {
        return `${api.defaults.baseURL}/documents/${documentId}/download`;
    }
};