import {jsPDF} from 'jspdf';
import {apiService} from './api';

export interface ReceiptData {
    candidat: {
        nupcan: string;
        nomcan: string;
        prncan: string;
        maican: string;
        telcan: string;
        dtncan: string;
        ldncan?: string;
        phtcan?: File | string;
    };
    concours: {
        libcnc: string;
        fracnc?: number;
        etablissement_nomets?: string;
        sescnc?: string;
    };
    filiere?: {
        nomfil: string;
        description?: string;
        matieres?: Array<{
            nom_matiere: string;
            coefficient: number;
            obligatoire?: boolean;
        }>;
    };
    paiement?: {
        reference?: string;
        montant?: number;
        date?: string;
        statut?: string;
        methode?: string;
    };
    documents?: Array<{
        nomdoc: string;
        type: string;
        statut: string;
    }>;
}

class ReceiptService {
    private validateReceiptData(data: any): ReceiptData {

        let phtcanValue: string | undefined;
        if (data.candidat.phtcan) {
            if (typeof data.candidat.phtcan === 'string') {
                phtcanValue = data.candidat.phtcan;
            } else {

                phtcanValue = undefined;
            }
        }

        return {
            candidat: {
                nupcan: data.candidat.nupcan || '',
                nomcan: data.candidat.nomcan || '',
                prncan: data.candidat.prncan || '',
                maican: data.candidat.maican || '',
                telcan: data.candidat.telcan || '',
                dtncan: data.candidat.dtncan || '',
                ldncan: data.candidat.ldncan || '',
                phtcan: phtcanValue
            },
            concours: {
                libcnc: data.concours.libcnc || '',
                fracnc: data.concours.fracnc || 0,
                etablissement_nomets: data.concours.etablissement_nomets || '',
                sescnc: data.concours.sescnc || ''
            },
            filiere: data.filiere,
            paiement: data.paiement,
            documents: data.documents || []
        };
    }

    async downloadReceiptPDF(data: any): Promise<void> {
        try {
            const validatedData = this.validateReceiptData(data);

            const pdf = new jsPDF();

            // Configuration du PDF
            pdf.setFontSize(20);
            pdf.text('REÇU DE CANDIDATURE', 20, 30);

            pdf.setFontSize(12);
            pdf.text(`NUPCAN: ${validatedData.candidat.nupcan}`, 20, 50);
            pdf.text(`Nom: ${validatedData.candidat.prncan} ${validatedData.candidat.nomcan}`, 20, 65);
            pdf.text(`Email: ${validatedData.candidat.maican}`, 20, 80);
            pdf.text(`Concours: ${validatedData.concours.libcnc}`, 20, 95);

            if (validatedData.filiere) {
                pdf.text(`Filière: ${validatedData.filiere.nomfil}`, 20, 110);
            }

            if (validatedData.paiement) {
                pdf.text(`Montant: ${validatedData.paiement.montant || 0} FCFA`, 20, 125);
                pdf.text(`Statut: ${validatedData.paiement.statut || 'En attente'}`, 20, 140);
            }

            pdf.save(`recu-${validatedData.candidat.nupcan}.pdf`);
        } catch (error) {
            console.error('Erreur génération PDF:', error);
            throw new Error('Impossible de générer le reçu PDF');
        }
    }

    async generateAndSendReceiptEmail(data: any, maican: string): Promise<void> {
        try {
            if (!maican || !maican.includes('@')) {
                throw new Error('Adresse email invalide');
            }

            const validatedData = this.validateReceiptData(data);

            const response = await apiService.makeRequest('/email/receipt', 'POST', {
                maican: maican,
                nupcan: validatedData.candidat.nupcan,
                candidatData: validatedData
            });

            if (!response.success) {
                throw new Error(response.message || 'Erreur lors de l\'envoi de l\'email');
            }
        } catch (error) {
            console.error('Erreur envoi email reçu:', error);
            throw new Error(error instanceof Error ? error.message : 'Impossible d\'envoyer le reçu par email');
        }
    }

    async sendReceiptByEmail(data: any, maican: string): Promise<void> {
        return this.generateAndSendReceiptEmail(data, maican);
    }

    // Nouvelle méthode pour envoyer une notification de validation de document
    // Nouvelle méthode pour envoyer une notification de validation de document
    async sendDocumentValidationEmail(candidatEmail: string, documentName: string, statut: 'valide' | 'rejete', commentaire?: string): Promise<void> {
        try {
            const response = await apiService.makeRequest('/email/document-validation', 'POST', {
                maican: candidatEmail,
                documentName,
                statut,
                commentaire
            });

            if (!response.success) {
                throw new Error(response.message || 'Erreur lors de l\'envoi de la notification');
            }
        } catch (error) {
            console.error('Erreur envoi notification validation:', error);
            throw error;
        }
    }

}

export const receiptService = new ReceiptService();
