import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { documentService } from '@/services/documentService';

interface DocumentReplaceDialogProps {
    document: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    nupcan: string;
}

const DocumentReplaceDialog: React.FC<DocumentReplaceDialogProps> = ({
    document,
    open,
    onOpenChange,
    nupcan,
}) => {
    const queryClient = useQueryClient();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const replaceMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('document', file);
            formData.append('nupcan', nupcan);
            formData.append('type', document.type || 'AUTRE');
            formData.append('nomdoc', document.nomdoc);

            return await documentService.replaceDocument(document.id, formData);
        },
        onSuccess: () => {
            toast({
                title: 'Document remplacé',
                description: 'Votre nouveau document a été téléchargé et est en attente de validation',
            });
            queryClient.invalidateQueries({ queryKey: ['candidature-complete', nupcan] });
            onOpenChange(false);
            setSelectedFile(null);
        },
        onError: (error: any) => {
            toast({
                title: 'Erreur',
                description: error.message || 'Impossible de remplacer le document',
                variant: 'destructive',
            });
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            
            // Vérifier la taille du fichier (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: 'Fichier trop volumineux',
                    description: 'La taille maximale est de 5 MB',
                    variant: 'destructive',
                });
                return;
            }

            // Vérifier le type de fichier
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                toast({
                    title: 'Type de fichier non autorisé',
                    description: 'Seuls les fichiers PDF, JPG et PNG sont acceptés',
                    variant: 'destructive',
                });
                return;
            }

            setSelectedFile(file);
        }
    };

    const handleSubmit = () => {
        if (!selectedFile) {
            toast({
                title: 'Erreur',
                description: 'Veuillez sélectionner un fichier',
                variant: 'destructive',
            });
            return;
        }

        replaceMutation.mutate(selectedFile);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Remplacer le document</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {document.statut === 'rejete' && document.commentaire_validation && (
                        <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-sm">Raison du rejet:</p>
                                <p className="text-sm text-muted-foreground">
                                    {document.commentaire_validation}
                                </p>
                            </div>
                        </div>
                    )}

                    <div>
                        <Label>Document actuel</Label>
                        <p className="text-sm text-muted-foreground mt-1">{document.nomdoc}</p>
                    </div>

                    <div>
                        <Label htmlFor="file-upload">Nouveau document</Label>
                        <div className="mt-2">
                            <Input
                                id="file-upload"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                            />
                        </div>
                        {selectedFile && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Fichier sélectionné: {selectedFile.name} (
                                {(selectedFile.size / 1024).toFixed(2)} KB)
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                            Formats acceptés: PDF, JPG, PNG (max 5 MB)
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            onOpenChange(false);
                            setSelectedFile(null);
                        }}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!selectedFile || replaceMutation.isPending}
                    >
                        {replaceMutation.isPending ? (
                            <>Téléchargement...</>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                Remplacer
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DocumentReplaceDialog;
