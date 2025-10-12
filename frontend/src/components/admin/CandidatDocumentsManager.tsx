import React, {useState, useEffect} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog';
import {Textarea} from '@/components/ui/textarea';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {toast} from '@/hooks/use-toast';
import {
    FileText,
    Download,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle
} from 'lucide-react';
import {documentService, DocumentData} from '@/services/documentService';
import {emailService} from '@/services/emailService';

interface CandidatDocumentsManagerProps {
    candidatNupcan: string;
    candidatInfo: {
        nom: string;
        prenom: string;
        email: string;
    };
    onDocumentValidated?: () => void;
}


const CandidatDocumentsManager: React.FC<CandidatDocumentsManagerProps> = ({
                                                                               candidatNupcan,
                                                                               candidatInfo,
                                                                               onDocumentValidated
                                                                           }) => {
    const [documents, setDocuments] = useState<DocumentData[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<DocumentData | null>(null);
    const [validationModalOpen, setValidationModalOpen] = useState(false);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [validationStatus, setValidationStatus] = useState<'valide' | 'rejete'>('valide');
    const [validationComment, setValidationComment] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDocuments();
    }, [candidatNupcan]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await documentService.getDocumentsByCandidat(candidatNupcan);
            if (response.success) {
                setDocuments(response.data);
            } else {
                toast({
                    title: "Erreur",
                    description: "Impossible de charger les documents",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Erreur chargement documents:', error);
            toast({
                title: "Erreur",
                description: "Erreur de connexion au serveur",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleValidateDocument = async () => {
        if (!selectedDocument) return;

        setIsValidating(true);
        try {
            const validationData = {
                statut: validationStatus,
                commentaire: validationComment,
                admin_id: 1 // À récupérer depuis le contexte admin
            };

            const response = await documentService.validateDocument(
                selectedDocument.id.toString(),
                validationData
            );

            if (response.success) {
                // Envoyer notification email
                try {
                    await emailService.sendDocumentValidationNotification({
                        candidat: {
                            nomcan: candidatInfo.nom,
                            prncan: candidatInfo.prenom,
                            nupcan: candidatNupcan,
                            maincan: candidatInfo.email
                        },
                        document: {
                            type: selectedDocument.type,
                            nom: selectedDocument.nomdoc
                        },
                        statut: validationStatus,
                        commentaire: validationComment
                    });
                } catch (emailError) {
                    console.error('Erreur envoi notification:', emailError);
                }

                toast({
                    title: "Document validé",
                    description: `Le document a été ${validationStatus} et le candidat a été notifié`,
                });

                // Rafraîchir la liste des documents
                fetchDocuments();
                setValidationModalOpen(false);
                setValidationComment('');
                setSelectedDocument(null);

                if (onDocumentValidated) {
                    onDocumentValidated();
                }
            } else {
                toast({
                    title: "Erreur",
                    description: response.message || "Impossible de valider le document",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Erreur validation:', error);
            toast({
                title: "Erreur",
                description: "Erreur lors de la validation",
                variant: "destructive",
            });
        } finally {
            setIsValidating(false);
        }
    };

    const handleDownloadDocument = async (doc: DocumentData) => {
        try {
            const blob = await documentService.downloadDocument(doc.id.toString());
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.nomdoc;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                title: "Téléchargement",
                description: "Le document a été téléchargé avec succès",
            });
        } catch (error) {
            console.error('Erreur téléchargement:', error);
            toast({
                title: "Erreur",
                description: "Impossible de télécharger le document",
                variant: "destructive",
            });
        }
    };

    const openValidationModal = (document: DocumentData) => {
        setSelectedDocument(document);
        setValidationModalOpen(true);
    };

    const openPreviewModal = (document: DocumentData) => {
        setSelectedDocument(document);
        setPreviewModalOpen(true);
    };

    const getStatusBadge = (statut: string) => {
        switch (statut) {
            case 'valide':
                return <Badge className="bg-green-100 text-green-800"><CheckCircle
                    className="h-3 w-3 mr-1"/>Validé</Badge>;
            case 'rejete':
                return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1"/>Rejeté</Badge>;
            case 'en_attente':
                return <Badge className="bg-orange-100 text-orange-800"><Clock className="h-3 w-3 mr-1"/>En
                    attente</Badge>;
            default:
                return <Badge variant="secondary">Inconnu</Badge>;
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Documents du candidat</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Documents du candidat</span>
                        <Badge variant="outline">{documents.length} document(s)</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {documents.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300"/>
                            <p>Aucun document soumis par ce candidat</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {documents.map((document) => (
                                <div key={document.id}
                                     className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <FileText className="h-8 w-8 text-blue-500"/>
                                        <div>
                                            <h4 className="font-medium">{document.nomdoc}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {document.type} • {(document.taille_fichier / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Uploadé le {new Date(document.create_at).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {getStatusBadge(document.statut)}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openPreviewModal(document)}
                                        >
                                            <Eye className="h-4 w-4"/>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownloadDocument(document)}
                                        >
                                            <Download className="h-4 w-4"/>
                                        </Button>
                                        {document.statut === 'en_attente' && (
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => openValidationModal(document)}
                                            >
                                                Valider
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>


            {/* Modal de validation */}
            <Dialog open={validationModalOpen} onOpenChange={setValidationModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Valider le document</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {selectedDocument && (
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="font-medium">{selectedDocument.nomdoc}</p>
                                <p className="text-sm text-muted-foreground">{selectedDocument.type}</p>
                            </div>
                        )}
                        <div>
                            <Label htmlFor="status">Statut de validation</Label>
                            <Select value={validationStatus}
                                    onValueChange={(value) => setValidationStatus(value as 'valide' | 'rejete')}>
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="valide">Valider</SelectItem>
                                    <SelectItem value="rejete">Rejeter</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label
                                htmlFor="comment">Commentaire {validationStatus === 'rejete' ? '(obligatoire)' : '(optionnel)'}</Label>
                            <Textarea
                                value={validationComment}
                                onChange={(e) => setValidationComment(e.target.value)}
                                placeholder={validationStatus === 'rejete' ? 'Veuillez préciser la raison du rejet...' : 'Commentaire optionnel...'}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setValidationModalOpen(false)}>
                            Annuler
                        </Button>
                        <Button
                            onClick={handleValidateDocument}
                            disabled={isValidating || (validationStatus === 'rejete' && !validationComment.trim())}
                        >
                            {isValidating ? 'Validation...' : 'Valider'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de prévisualisation */}
            <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Prévisualisation du document</DialogTitle>
                    </DialogHeader>
                    {selectedDocument && (
                        <div className="flex-1 overflow-hidden">
                            <iframe
                                src={documentService.getDocumentPreviewUrl(selectedDocument.chemin_fichier)}
                                className="w-full h-[70vh] border rounded"
                                title={selectedDocument.nomdoc}
                            />
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPreviewModalOpen(false)}>
                            Fermer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CandidatDocumentsManager;
