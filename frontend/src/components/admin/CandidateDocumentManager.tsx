import React, {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Eye, FileText, Calendar, AlertCircle, Loader2, CheckCircle, XCircle, Clock} from 'lucide-react';
import {toast} from '@/hooks/use-toast';
import {adminDocumentService, AdminDocumentData} from '@/services/adminDocumentService';
import DocumentValidationModal from './DocumentValidationModal';

interface CandidateDocumentManagerProps {
    candidatNupcan: string;
    candidatInfo: {
        nom: string;
        prenom: string;
        email: string;
    };
    onDocumentValidated?: () => void;
}

const CandidateDocumentManager: React.FC<CandidateDocumentManagerProps> = ({
                                                                               candidatNupcan,
                                                                               candidatInfo,
                                                                               onDocumentValidated
                                                                           }) => {
    const [selectedDocument, setSelectedDocument] = useState<AdminDocumentData | null>(null);
    const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
    const [validationType, setValidationType] = useState<'valide' | 'rejete'>('valide');

    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    // Récupérer les documents du candidat
    const getStatusBadge = (statut: string) => {
        switch (statut) {
            case 'valide':
                return <Badge className="bg-green-100 text-green-800">Validé</Badge>;
            case 'rejete':
                return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
            default:
                return <Badge className="bg-orange-100 text-orange-800">En attente</Badge>;
        }
    };
    const {data: documents, isLoading} = useQuery({
        queryKey: ['candidat-documents', candidatNupcan],
        queryFn: () => adminDocumentService.getCandidatDocuments(candidatNupcan),
    });

    // Mutation pour valider un document


    const validateDocumentMutation = useMutation({
        mutationFn: ({documentId, statut, commentaire}: {
            documentId: number;
            statut: 'valide' | 'rejete';
            commentaire?: string
        }) => adminDocumentService.validateDocument(documentId, statut, commentaire),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['candidat-documents']});
            onDocumentValidated?.();
        },
    });


    const handleValidateDocument = async (
        documentId: number,
        statut: 'valide' | 'rejete',
        commentaire?: string
    ) => {
        try {
            await validateDocumentMutation.mutateAsync({documentId, statut, commentaire});
            toast({
                title: `Document ${statut}`,
                description: `Le document a été ${statut} avec succès`,
            });
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de valider le document",
                variant: "destructive",
            });
        }
    };

    const handleViewDocument = (document: AdminDocumentData) => {
        setSelectedDocument(document);
        setIsValidationModalOpen(true);
    };


    // const filteredDocuments = documents.filter((d: any) => {
    //   const matchesSearch = d.nomcan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //       d.nupcan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //       d.nomdoc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //       d.libcnc?.toLowerCase().includes(searchTerm.toLowerCase());
    //
    //   const matchesStatus = statusFilter === 'all' || d.statut === statusFilter;
    //
    //   return matchesSearch && matchesStatus;
    // });




    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2"/>
                        <span>Chargement des documents...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!documents || documents.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2"/>
                        Documents du Candidat
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                        <p className="text-muted-foreground">Aucun document soumis</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2"/>
                        Documents du Candidat ({documents.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom du document</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Date de soumission</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.map((document) => (
                                <TableRow key={document.id}>
                                    <TableCell className="font-medium">
                                        {document.nomdoc}
                                    </TableCell>
                                    <TableCell>{document.type}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-1 text-muted-foreground"/>
                                            {new Date(document.created_at).toLocaleDateString('fr-FR')}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(document.statut)}

                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewDocument(document)}
                                        >
                                            <Eye className="h-4 w-4 mr-1"/>
                                            Valider
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal de validation */}
            <DocumentValidationModal
                document={selectedDocument}
                isOpen={isValidationModalOpen}
                onClose={() => {
                    setIsValidationModalOpen(false);
                    setSelectedDocument(null);
                }}
                onValidate={handleValidateDocument}
                isValidating={validateDocumentMutation.isPending}
                candidatInfo={{
                    nomcan: candidatInfo.nom,
                    prncan: candidatInfo.prenom,
                    maican: candidatInfo.email
                }}
            />
        </>
    );
};

export default CandidateDocumentManager;



