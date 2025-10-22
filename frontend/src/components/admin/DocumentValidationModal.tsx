import React, {useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {CheckCircle, XCircle, FileText, User, Calendar, Eye} from 'lucide-react';
import {toast} from '@/hooks/use-toast';
import {receiptService} from '@/services/receiptService';
import DocumentViewer from "@/components/DocumentViewer.tsx";

interface DocumentValidationModalProps {
    document: any;
    isOpen: boolean;
    onClose: () => void;
    onValidate: (documentId: number, statut: 'valide' | 'rejete', commentaire?: string) => Promise<void>;
    isValidating: boolean;
    candidatInfo?: {
        nomcan: string;
        prncan: string;
        maican: string;
    };
}

const DocumentValidationModal: React.FC<DocumentValidationModalProps> = ({
                                                                             document,
                                                                             isOpen,
                                                                             onClose,
                                                                             onValidate,
                                                                             isValidating,
                                                                             candidatInfo
                                                                         }) => {

    const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
    const [validationType, setValidationType] = useState<'valide' | 'rejete' | null>(null);
    const [commentaire, setCommentaire] = useState('');

    const handleValidation = async (statut: 'valide' | 'rejete') => {
        if (statut === 'rejete' && !commentaire.trim()) {
            toast({
                title: "Commentaire requis",
                description: "Veuillez indiquer la raison du rejet",
                variant: "destructive",
            });
            return;
        }

        try {
            await onValidate(document.id, statut, commentaire);

            // Envoyer une notification par email au candidat
            if (candidatInfo?.maican) {
                try {
                    await receiptService.sendDocumentValidationEmail(
                        candidatInfo.maican,
                        document.nomdoc,
                        statut,
                        commentaire
                    );
                } catch (emailError) {
                    console.error('Erreur envoi email:', emailError);
                    // Ne pas bloquer la validation si l'email échoue
                }
            }

            setCommentaire('');
            setValidationType(null);
            onClose();

            toast({
                title: `Document ${statut}`,
                description: `Le document a été ${statut} et le candidat a été notifié`,
            });
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de valider le document",
                variant: "destructive",
            });
        }
    };

    if (!document) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2"/>
                        Validation de document
                    </DialogTitle>
                    <DialogDescription>
                        Vérifiez le document et validez ou rejetez-le avec un commentaire si nécessaire.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Informations du document */}
                    <div className="border rounded-lg p-4 bg-muted/20">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium">Type de document</Label>
                                <p className="text-sm text-muted-foreground">{document.type || document.nomdoc}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Nom du fichier</Label>
                                <p className="text-sm text-muted-foreground truncate">{document.nomdoc}</p>
                            </div>
                            {candidatInfo && (
                                <>
                                    <div>
                                        <Label className="text-sm font-medium">Candidat</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {candidatInfo.prncan} {candidatInfo.nomcan}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Email</Label>
                                        <p className="text-sm text-muted-foreground">{candidatInfo.maican}</p>
                                    </div>
                                </>
                            )}
                            <div>
                                <Label className="text-sm font-medium">Date de soumission</Label>
                                <p className="text-sm text-muted-foreground flex items-center">
                                    <Calendar className="h-3 w-3 mr-1"/>
                                    {new Date(document.created_at || document.create_at).toLocaleDateString('fr-FR')}
                                </p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Statut actuel</Label>
                                <Badge className={`${
                                    document.statut === 'valide' ? 'bg-green-500' :
                                        document.statut === 'rejete' ? 'bg-red-500' : 'bg-yellow-500'
                                } text-white`}>
                                    {document.statut}
                                </Badge>
                            </div>
                        </div>
                    </div>




                    {/* Zone de prévisualisation */}
                    <Button className="borderb text-gray-400 mx-auto mb-4 rounded-lg p-4 bg-gray-50 min-h-[200px] flex items-center justify-center"

                             onClick={() => setSelectedDocument(document)}>
                                <Eye className="h-14  mr-2  w-16 " /> Voir

                            <p className="text-sm text-gray-400">{document.nomdoc}</p>

            </Button>

                    <DocumentViewer
                        isOpen={!!selectedDocument}
                        onClose={() => setSelectedDocument(null)}
                        document={selectedDocument || null}
                    />

                    {/* Commentaire pour la validation */}
                    <div className="space-y-2">
                        <Label htmlFor="commentaire">
                            Commentaire {validationType === 'rejete' ? '(requis pour un rejet)' : '(optionnel)'}
                        </Label>
                        <Textarea
                            id="commentaire"
                            value={commentaire}
                            onChange={(e) => setCommentaire(e.target.value)}
                            placeholder={
                                validationType === 'rejete'
                                    ? "Expliquez la raison du rejet..."
                                    : "Ajoutez un commentaire (optionnel)..."
                            }
                            rows={3}
                        />
                    </div>

                    {/* Actions de validation */}
                    <div className="flex justify-between items-center pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isValidating}
                        >
                            Annuler
                        </Button>

                        <div className="flex space-x-3">
                            <Button
                                onClick={() => handleValidation('rejete')}
                                disabled={isValidating}
                                variant="destructive"
                                className="flex items-center"
                            >
                                <XCircle className="h-4 w-4 mr-2"/>
                                {isValidating ? 'Rejet...' : 'Rejeter'}
                            </Button>

                            <Button
                                onClick={() => handleValidation('valide')}
                                disabled={isValidating}
                                className="bg-green-600 hover:bg-green-700 flex items-center"
                            >
                                <CheckCircle className="h-4 w-4 mr-2"/>
                                {isValidating ? 'Validation...' : 'Valider'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DocumentValidationModal;
