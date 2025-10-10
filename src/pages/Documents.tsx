import React, {useState, useEffect, useRef} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useMutation, useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Progress} from '@/components/ui/progress';
import {Upload, FileText, X, CheckCircle, AlertCircle, ArrowLeft, PlusCircle} from 'lucide-react';
import Layout from '@/components/Layout';
// import CustomDocumentUpload from '@/components/CustomDocumentUpload'; // Retire cet import
import {apiService} from '@/services/api';
import {toast} from '@/hooks/use-toast';
import {DocumentOption} from '@/types/entities';
import {useCandidature} from '@/hooks/useCandidature';
import {Input} from '@/components/ui/input'; // Ajout de Input pour les documents personnalisés

// Définition du type étendu pour les documents (pour inclure les personnalisés)
interface UploadedDoc extends DocumentOption {
    file: File;
    isCustom?: boolean;
}

const documentOptions: DocumentOption[] = [
    {value: 'cni', label: 'Carte Nationale d\'Identité', required: true},
    {value: 'diplome', label: 'Diplôme ou Attestation', required: true},
    {value: 'photo', label: 'Photo d\'identité (format identité)', required: true},
    {value: 'acte_naissance', label: 'Acte de naissance', required: true},
];

const Documents = () => {
    const {numeroCandidature} = useParams<{ numeroCandidature: string }>();
    const navigate = useNavigate();
    const {candidatureData, loadCandidature} = useCandidature();

    // Utiliser un Map pour stocker les documents et leurs métadonnées
    const [uploadedDocuments, setUploadedDocuments] = useState<Map<string, UploadedDoc>>(new Map());
    const [customDocsCounter, setCustomDocsCounter] = useState(0);

    const [uploadSuccess, setUploadSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentUploadType, setCurrentUploadType] = useState(''); // Stocke le type ('cni', 'diplome', ou un ID custom)

    // Logique de chargement de candidature (inchangée)
    useEffect(() => {
        if (numeroCandidature && !candidatureData) {
            loadCandidature(numeroCandidature).catch((err) => {
                console.error("Erreur lors du chargement de la candidature:", err);
                toast({
                    title: "Erreur",
                    description: "Impossible de charger les informations de candidature",
                    variant: "destructive",
                });
                navigate('/');
            });
        }
    }, [numeroCandidature, candidatureData, loadCandidature, navigate]);

    const concoursId = candidatureData?.concours?.id?.toString();

    // Fonction d'upload (légèrement modifiée pour accepter le Map)
    const uploadMutation = useMutation({
        mutationFn: async ({filesMap, concoursId, nupcan}: {
            filesMap: Map<string, UploadedDoc>;
            concoursId: string;
            nupcan: string
        }) => {
            if (!nupcan) throw new Error('NUPCAN est requis pour l\'upload des documents');
            if (!concoursId) throw new Error('ID du concours manquant');

            const formData = new FormData();
            formData.append('concours_id', concoursId);
            formData.append('nupcan', nupcan);

            filesMap.forEach((doc, key) => {
                // Le nom du champ doit être 'documents' et l'API se charge d'identifier l'usage
                // Pour la soumission, on envoie le fichier tel quel.
                formData.append('documents', doc.file);
            });

            return apiService.createDossier(formData);
        },
        onSuccess: (response) => {
            setUploadSuccess(true);
            toast({
                title: 'Documents enregistrés !',
                description: `Les documents ont été uploadés.`,
            });
            setTimeout(() => {
                navigate(`/paiement/${encodeURIComponent(numeroCandidature!)}`);
            }, 1500); // Redirection plus rapide
        },
        onError: (error) => {
            console.error('Erreur d\'upload:', error);
            setUploadSuccess(false);
            toast({
                title: 'Erreur d\'upload',
                description: 'Une erreur est survenue lors de l\'envoi des documents. Veuillez réessayer.',
                variant: 'destructive',
            });
        },
    });

    const fileValidation = (file: File): boolean => {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

        if (file.size > maxSize) {
            toast({
                title: 'Fichier trop volumineux',
                description: 'Le fichier ne doit pas dépasser 5MB',
                variant: 'destructive'
            });
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            toast({
                title: 'Format non supporté',
                description: 'Seuls les fichiers PDF, JPEG et PNG sont acceptés',
                variant: 'destructive'
            });
            return false;
        }
        return true;
    };


    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUploadType) return;

        if (!fileValidation(file)) {
            // Réinitialiser l'input après l'échec de validation
            if (fileInputRef.current) fileInputRef.current.value = '';
            setCurrentUploadType('');
            return;
        }

        // 1. Gérer les documents obligatoires
        const docOption = documentOptions.find(opt => opt.value === currentUploadType);
        if (docOption) {
            setUploadedDocuments(prev => new Map(prev).set(currentUploadType, {
                ...docOption,
                file: file,
            }));
        }

        // 2. Gérer les documents personnalisés
        else if (currentUploadType.startsWith('custom_')) {
            const docKey = currentUploadType; // Utilise la clé générée
            const currentDoc = uploadedDocuments.get(docKey);

            if (currentDoc) {
                setUploadedDocuments(prev => new Map(prev).set(docKey, {
                    ...currentDoc,
                    file: file,
                    label: currentDoc.label, // Conserver le label personnalisé
                    required: false,
                    value: docKey,
                }));

                toast({
                    title: 'Document personnalisé ajouté',
                    description: `Fichier pour '${currentDoc.label}' prêt.`,
                });

            }
        }

        // Nettoyage après succès
        if (fileInputRef.current) fileInputRef.current.value = '';
        setCurrentUploadType('');
    };

    // Déclenche l'ouverture de l'input file
    const triggerFileInput = (docType: string) => {
        setCurrentUploadType(docType);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const removeDocument = (key: string) => {
        setUploadedDocuments((prev) => {
            const newDocs = new Map(prev);
            newDocs.delete(key);
            return newDocs;
        });

        toast({
            title: 'Document supprimé',
            description: 'Le document a été retiré de votre dossier',
        });
    };

    const handleContinuer = () => {
        const requiredTypes = documentOptions.filter((opt) => opt.required).map((opt) => opt.value);
        const uploadedKeys = Array.from(uploadedDocuments.keys());

        const missingRequired = requiredTypes.filter((type) => !uploadedKeys.includes(type));

        if (missingRequired.length > 0) {
            const missingLabels = missingRequired.map((type) => documentOptions.find(opt => opt.value === type)?.label || type).join(', ');
            toast({
                title: 'Documents manquants',
                description: `Documents obligatoires manquants: ${missingLabels}`,
                variant: 'destructive',
            });
            return;
        }

        if (uploadedDocuments.size === 0) {
            toast({
                title: 'Aucun document',
                description: 'Veuillez ajouter au moins un document (obligatoire ou personnalisé)',
                variant: 'destructive',
            });
            return;
        }

        if (!concoursId || !numeroCandidature) {
            toast({
                title: 'Erreur',
                description: 'Informations de candidature/concours manquantes. Veuillez contacter le support.',
                variant: 'destructive',
            });
            return;
        }

        uploadMutation.mutate({
            filesMap: uploadedDocuments,
            concoursId: concoursId,
            nupcan: numeroCandidature,
        });
    };

    // --- Logique Documents Personnalisés ---

    const addCustomDocumentField = () => {
        const newKey = `custom_${Date.now()}_${customDocsCounter}`;
        setCustomDocsCounter(prev => prev + 1);
        setUploadedDocuments(prev => new Map(prev).set(newKey, {
            value: newKey,
            label: '',
            required: false,
            file: null as any, // Marquer comme null initialement
            isCustom: true
        }));
    };

    const updateCustomDocumentLabel = (key: string, label: string) => {
        setUploadedDocuments(prev => {
            const newDocs = new Map(prev);
            const doc = newDocs.get(key);
            if (doc) {
                newDocs.set(key, {...doc, label: label});
            }
            return newDocs;
        });
    };

    const requiredDocuments = documentOptions.filter((opt) => opt.required);
    const uploadedRequiredCount = requiredDocuments.filter((doc) => uploadedDocuments.has(doc.value) && uploadedDocuments.get(doc.value)?.file).length;
    const completionPercentage = Math.round((uploadedRequiredCount / requiredDocuments.length) * 100);

    const documentsList = Array.from(uploadedDocuments.values());
    const mandatoryDocsList = documentsList.filter(doc => !doc.isCustom);
    const customDocsList = documentsList.filter(doc => doc.isCustom);

    if (!candidatureData) {
        // ... (Code de chargement/erreur de candidature)
    }

    return (
        <Layout>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Champ File Input caché pour gérer tous les uploads */}
                <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{display: 'none'}}
                />

                {/* En-tête avec bouton retour */}
                <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-start">
                    <div>
                        <Button
                            variant="ghost"
                            onClick={() => navigate(-1)}
                            className="mb-4 text-primary hover:bg-primary/5"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2"/>
                            Retour
                        </Button>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Dépôt des Documents de Candidature</h1>
                        <p className="text-muted-foreground">
                            Veuillez télécharger les documents requis pour la candidature.
                        </p>
                    </div>
                    {/* Progression du dossier (Déplacée en haut à droite) */}
                    <Card className="mt-4 md:mt-0 w-full md:w-1/3 border-primary/20 bg-primary/5">
                        <CardContent className="p-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-semibold">
                                    <span>Progression Requise</span>
                                    <span className={completionPercentage === 100 ? "text-green-600" : "text-primary"}>
                                        {uploadedRequiredCount}/{requiredDocuments.length}
                                    </span>
                                </div>
                                <Progress value={completionPercentage} className="w-full h-2"/>
                                <p className="text-xs text-muted-foreground text-right">
                                    {completionPercentage}% des documents obligatoires déposés
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>


                {/* Messages de statut */}
                {/* Fusionner les messages dans une seule zone pour la clarté */}
                {(uploadMutation.isPending || uploadSuccess || uploadMutation.isError) && (
                    <Card
                        className={`mb-6 ${uploadSuccess ? 'border-green-300 bg-green-50' : uploadMutation.isPending ? 'border-blue-300 bg-blue-50' : 'border-red-300 bg-red-50'}`}>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                                {uploadSuccess ? (
                                    <CheckCircle className="h-5 w-5 text-green-600"/>
                                ) : uploadMutation.isPending ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-red-600"/>
                                )}
                                <p className={`text-sm font-medium ${uploadSuccess ? 'text-green-700' : uploadMutation.isPending ? 'text-blue-700' : 'text-red-700'}`}>
                                    {uploadSuccess
                                        ? 'Documents enregistrés avec succès ! Redirection vers le paiement...'
                                        : uploadMutation.isPending
                                            ? 'Envoi et enregistrement des documents en cours...'
                                            : 'Erreur lors de l\'enregistrement. Veuillez réessayer.'
                                    }
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}


                {/* Grille Bicolonne (Formulaire principal à gauche, Instructions à droite) */}
                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">

                    {/* COLONNE GAUCHE: LISTE DES DOCUMENTS */}
                    <div className="space-y-8">

                        {/* 1. Documents Obligatoires */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                                    Documents Obligatoires ({uploadedRequiredCount}/{requiredDocuments.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {documentOptions.map((doc) => {
                                        const uploadedDoc = uploadedDocuments.get(doc.value);
                                        const isUploaded = !!uploadedDoc?.file;

                                        return (
                                            <div key={doc.value}
                                                 className="grid grid-cols-3 items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">

                                                {/* Label du document */}
                                                <div className="col-span-2 flex flex-col">
                                                    <p className="font-medium text-base">
                                                        {doc.label}
                                                        {doc.required &&
                                                            <span className="text-red-500 ml-1 font-bold">*</span>}
                                                    </p>
                                                    {isUploaded && (
                                                        <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                                            <CheckCircle
                                                                className="h-3 w-3"/> Téléversé: {uploadedDoc.file.name}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Boutons d'action */}
                                                <div className="col-span-1 flex justify-end space-x-2">
                                                    {isUploaded ? (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => triggerFileInput(doc.value)}
                                                                title="Remplacer le document"
                                                            >
                                                                <Upload className="h-4 w-4"/>
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => removeDocument(doc.value)}
                                                                title="Supprimer le document"
                                                            >
                                                                <X className="h-4 w-4"/>
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Button
                                                            onClick={() => triggerFileInput(doc.value)}
                                                            className="bg-primary hover:bg-primary/90"
                                                            title="Ajouter le document"
                                                        >
                                                            <Upload className="h-4 w-4 mr-2"/> Ajouter
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Documents Personnalisés (Intégration fluide) */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold">Documents Personnalisés
                                    (Optionnel)</CardTitle>
                                <p className="text-sm text-muted-foreground">Ajoutez tout autre document pertinent pour
                                    votre candidature.</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {customDocsList.map((doc) => (
                                    <div key={doc.value}
                                         className="grid grid-cols-4 gap-3 items-center p-3 border rounded-lg bg-gray-50">

                                        {/* Champ Titre */}
                                        <div className="col-span-2">
                                            <Input
                                                placeholder="Nom du document (Ex: Certificat de scolarité)"
                                                value={doc.label}
                                                onChange={(e) => updateCustomDocumentLabel(doc.value, e.target.value)}
                                                required
                                                className="bg-white"
                                            />
                                        </div>

                                        {/* Champ Fichier / État */}
                                        <div className="col-span-1">
                                            {doc.file ? (
                                                <span
                                                    className="text-xs text-green-700 flex items-center gap-1 font-medium">
                                                    <CheckCircle className="h-3 w-3"/> {doc.file.name}
                                                </span>
                                            ) : (
                                                <Button
                                                    onClick={() => triggerFileInput(doc.value)}
                                                    variant="secondary"
                                                    className="w-full text-xs h-8"
                                                    disabled={!doc.label} // Désactiver si le label n'est pas rempli
                                                >
                                                    <Upload className="h-3 w-3 mr-1"/> Fichier
                                                </Button>
                                            )}
                                        </div>

                                        {/* Bouton Suppression */}
                                        <div className="col-span-1 flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeDocument(doc.value)}
                                                title="Supprimer ce document personnalisé"
                                            >
                                                <X className="h-4 w-4 text-red-500"/>
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    onClick={addCustomDocumentField}
                                    variant="outline"
                                    className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/5 mt-4"
                                >
                                    <PlusCircle className="h-4 w-4 mr-2"/> Ajouter un autre document
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Boutons d'Action Principaux */}
                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={() => navigate(-1)} disabled={uploadMutation.isPending}>
                                <ArrowLeft className="h-4 w-4 mr-2"/> Retour
                            </Button>
                            <Button
                                onClick={handleContinuer}
                                className="bg-primary hover:bg-primary/90 shadow-lg"
                                disabled={uploadMutation.isPending || completionPercentage < 100 || uploadSuccess}
                                size="lg"
                            >
                                {uploadMutation.isPending
                                    ? 'Enregistrement en cours...'
                                    : uploadSuccess
                                        ? 'Redirection...'
                                        : 'Enregistrer et continuer vers le paiement'}
                            </Button>
                        </div>

                    </div>

                    {/* COLONNE DROITE: INSTRUCTIONS ET RAPPEL */}
                    <div className="space-y-6">

                        {/* Instructions détaillées */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-primary">Consignes d'Upload</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 text-sm text-muted-foreground list-disc list-inside">
                                    <li>Les documents marqués d'un astérisque (<span
                                        className="text-red-500 font-bold">*</span>) sont **obligatoires** pour
                                        finaliser l'étape.
                                    </li>
                                    <li>**Formats acceptés** : PDF, JPEG, PNG.</li>
                                    <li>**Taille maximale** par fichier : **5 Mo**.</li>
                                    <li>Assurez-vous que vos documents sont lisibles, non coupés et de bonne qualité.
                                    </li>
                                    <li>Vous pouvez remplacer un document déjà téléversé en cliquant à nouveau sur le
                                        bouton **Upload**.
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Rappel Candidature */}
                        <Card className="bg-gray-50 border-gray-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg font-semibold">Rappel Candidature</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1 text-sm pt-4">
                                <p className="font-medium text-primary">NUPCAN: {numeroCandidature}</p>
                                <p className="text-muted-foreground">Concours: {candidatureData?.concours?.libcnc}</p>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Documents;