// // @ts-nocheck
// import React, { useState, useCallback, useMemo } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useMutation, useQuery } from '@tanstack/react-query';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { AlertTriangle, Camera, Upload, X, FileText } from 'lucide-react';
// import { toast } from '@/hooks/use-toast';
// import Layout from '@/components/Layout';
// import { apiService } from '@/services/api';
// import { useCandidature } from '@/hooks/useCandidature';
// import ScanDocumentSection, { ScanResult } from '@/components/ScanDocumentSection';
//
// const Candidature = () => {
//     const { concoursId } = useParams<{ concoursId: string }>();
//     const { filiere } = useParams<{ filiere: string }>();
//     const navigate = useNavigate();
//     const { createCandidature, isLoading: candidatureLoading } = useCandidature();
//
//     const [candidat, setCandidatForm] = useState({
//         nipcan: '',
//         nomcan: '',
//         prncan: '',
//         dtncan: '',
//         ldncan: '',
//         telcan: '',
//         phtcan: '',
//         maican: '',
//         proorg: '',
//         proact: '',
//         proaff: '',
//     });
//
//     const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
//     const [photoPreview, setPhotoPreview] = useState<string | null>(null);
//     const [searchingNip, setSearchingNip] = useState(false);
//     const [ageError, setAgeError] = useState<string | null>(null);
//     const [dataOrigin, setDataOrigin] = useState<'manual' | 'nip' | 'scan' | null>(null);
//
//     // Queries d'abord
//     const { data: provincesResponse, isError: provincesError } = useQuery({
//         queryKey: ['provinces'],
//         queryFn: () => apiService.getProvinces(),
//         retry: 2,
//     });
//
//     const { data: concoursResponse, isError: concoursError } = useQuery({
//         queryKey: ['concours', concoursId],
//         queryFn: () => apiService.getConcoursById(concoursId!),
//         enabled: !!concoursId,
//         retry: 2,
//     });
//
//     const { data: filieresResponse, isError: filiereError } = useQuery({
//         queryKey: ['filiere'],
//         queryFn: () => apiService.getConcoursFiliere(concoursId!),
//         retry: 2,
//     });
//
//     // ✅ DÉFINIR LES DONNÉES APRÈS LES QUERIES
//     const provinces = provincesResponse?.data || [];
//     const filieres = filieresResponse?.data || [];
//     const concours = concoursResponse?.data;
//
//     // Gestion des erreurs de chargement
//     if (provincesError || concoursError || filiereError) {
//         return (
//             <Layout>
//                 <div className="max-w-4xl mx-auto px-4 py-12">
//                     <Alert className="border-red-200 bg-red-50">
//                         <AlertTriangle className="h-4 w-4 text-red-600" />
//                         <AlertDescription className="text-red-700">
//                             Erreur de chargement des données. Veuillez actualiser la page ou réessayer plus tard.
//                         </AlertDescription>
//                     </Alert>
//                 </div>
//             </Layout>
//         );
//     }
//
//     // Fonction pour calculer l'âge
//     const calculateAge = useCallback((birthDate: string): number => {
//         const today = new Date();
//         const birth = new Date(birthDate);
//         let age = today.getFullYear() - birth.getFullYear();
//         const monthDiff = today.getMonth() - birth.getMonth();
//
//         if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
//             age--;
//         }
//         return age;
//     }, []);
//
//     // Fonction pour valider l'âge
//     const validateAge = useCallback((birthDate: string) => {
//         // ✅ Vérifier que concours existe avant utilisation
//         if (!birthDate || !concours?.agecnc) {
//             setAgeError(null);
//             return;
//         }
//
//         const age = calculateAge(birthDate);
//         const maxAge = parseInt(concours.agecnc);
//
//         if (age > maxAge) {
//             setAgeError(`Votre âge (${age} ans) dépasse la limite autorisée pour ce concours (${maxAge} ans maximum)`);
//         } else if (age < 16) {
//             setAgeError(`Vous devez avoir au moins 16 ans pour candidater. Votre âge: ${age} ans`);
//         } else {
//             setAgeError(null);
//         }
//     }, [concours?.agecnc, calculateAge]);
//
//     // ✅ existingData après définition de concours
//     const existingData = useMemo(() => ({
//         nomcan: candidat.nomcan,
//         prncan: candidat.prncan,
//         dtncan: candidat.dtncan
//     }), [candidat.nomcan, candidat.prncan, candidat.dtncan]);
//
//     // Handler pour le scan de documents
//     const handleScanSuccess = useCallback((scanData: ScanResult) => {
//         const updates: any = {};
//         let updatedFields = 0;
//
//         if (scanData.nom && scanData.nom !== candidat.nomcan) {
//             updates.nomcan = scanData.nom;
//             updatedFields++;
//         }
//         if (scanData.prenoms && scanData.prenoms !== candidat.prncan) {
//             updates.prncan = scanData.prenoms;
//             updatedFields++;
//         }
//         if (scanData.dateNaissance && scanData.dateNaissance !== candidat.dtncan) {
//             updates.dtncan = scanData.dateNaissance;
//             // ✅ Valider l'âge seulement si concours existe
//             if (concours?.agecnc) {
//                 validateAge(scanData.dateNaissance);
//             }
//             updatedFields++;
//         }
//
//         if (updatedFields > 0) {
//             setCandidatForm(prev => ({ ...prev, ...updates }));
//             setDataOrigin('scan');
//
//             toast({
//                 title: "Données scannées",
//                 description: `${updatedFields} champ${updatedFields > 1 ? 's' : ''} pré-rempli${updatedFields > 1 ? 's' : ''} depuis le document`,
//             });
//         } else {
//             toast({
//                 title: "Aucune mise à jour",
//                 description: "Les données scannées correspondent déjà aux informations saisies",
//                 variant: "default"
//             });
//         }
//     }, [candidat.nomcan, candidat.prncan, candidat.dtncan, concours?.agecnc, validateAge]);
//
//     // Reste du code inchangé...
//     const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
//         const file = event.target.files?.[0];
//         if (!file) return;
//
//         if (!file.type.startsWith('image/')) {
//             toast({
//                 title: "Format non supporté",
//                 description: "Veuillez sélectionner une image (JPEG, PNG, etc.)",
//                 variant: "destructive"
//             });
//             return;
//         }
//
//         if (file.size > 5 * 1024 * 1024) {
//             toast({
//                 title: "Fichier trop volumineux",
//                 description: "La photo ne doit pas dépasser 5MB",
//                 variant: "destructive"
//             });
//             return;
//         }
//
//         setSelectedPhoto(file);
//
//         const reader = new FileReader();
//         reader.onload = (e) => {
//             const img = new Image();
//             img.onload = () => {
//                 const canvas = window.document.createElement('canvas');
//                 const ctx = canvas.getContext('2d');
//
//                 const size = 400;
//                 canvas.width = size;
//                 canvas.height = size;
//
//                 if (ctx) {
//                     ctx.fillStyle = '#FFFFFF';
//                     ctx.fillRect(0, 0, size, size);
//
//                     const scale = Math.min(size / img.width, size / img.height);
//                     const newWidth = img.width * scale;
//                     const newHeight = img.height * scale;
//                     const x = (size - newWidth) / 2;
//                     const y = (size - newHeight) / 2;
//
//                     ctx.drawImage(img, x, y, newWidth, newHeight);
//
//                     canvas.toBlob((blob) => {
//                         if (blob) {
//                             const processedFile = new File([blob], file.name, { type: 'image/jpeg' });
//                             setSelectedPhoto(processedFile);
//                             setPhotoPreview(canvas.toDataURL());
//                         }
//                     }, 'image/jpeg', 0.9);
//                 }
//             };
//             img.src = e.target?.result as string;
//         };
//         reader.readAsDataURL(file);
//
//         toast({
//             title: "Photo ajoutée",
//             description: "Votre photo a été traitée avec fond blanc"
//         });
//     };
//
//     const removePhoto = () => {
//         setSelectedPhoto(null);
//         setPhotoPreview(null);
//         toast({
//             title: "Photo supprimée",
//             description: "La photo a été retirée de votre candidature"
//         });
//     };
//
//     // Recherche par NIP
//     const nipSearchMutation = useMutation({
//         mutationFn: (nip: string) => apiService.getCandidatByNupcan(nip),
//         onSuccess: (response) => {
//             if (response.success && response.data) {
//                 const candidatData = response.data;
//                 setCandidatForm(prev => ({
//                     ...prev,
//                     nomcan: candidatData.nomcan || '',
//                     prncan: candidatData.prncan || '',
//                     dtncan: candidatData.dtncan ? candidatData.dtncan.split('T')[0] : '',
//                     ldncan: candidatData.ldncan || '',
//                     telcan: candidatData.telcan || '',
//                     phtcan: candidatData.phtcan || '',
//                     maican: candidatData.maican || '',
//                     proorg: candidatData.proorg?.toString() || '',
//                     proact: candidatData.proact?.toString() || '',
//                     proaff: candidatData.proaff?.toString() || '',
//                 }));
//                 setDataOrigin('nip');
//
//                 if (candidatData.dtncan) {
//                     validateAge(candidatData.dtncan.split('T')[0]);
//                 }
//
//                 toast({
//                     title: "Informations trouvées",
//                     description: "Vos informations ont été automatiquement remplies via NIP",
//                 });
//             }
//         },
//         onError: () => {
//             toast({
//                 title: "NIP non trouvé",
//                 description: "Aucun candidat trouvé avec ce NIP gabonais. Vous pouvez continuer manuellement.",
//                 variant: "destructive",
//             });
//         },
//         onSettled: () => {
//             setSearchingNip(false);
//         }
//     });
//
//     const handleInputChange = (field: string, value: string) => {
//         setCandidatForm(prev => ({
//             ...prev,
//             [field]: value
//         }));
//         setDataOrigin('manual');
//
//         if (field === 'dtncan') {
//             validateAge(value);
//         }
//     };
//
//     const handleNipSearch = () => {
//         if (candidat.nipcan.trim()) {
//             setSearchingNip(true);
//             nipSearchMutation.mutate(candidat.nipcan);
//         }
//     };
//
//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//
//         if (ageError) {
//             toast({
//                 title: "Âge invalide",
//                 description: ageError,
//                 variant: "destructive",
//             });
//             return;
//         }
//
//         if (!candidat.nomcan || !candidat.prncan || !candidat.maican || !candidat.telcan ||
//             !candidat.dtncan || !candidat.proorg || !candidat.ldncan) {
//             toast({
//                 title: "Champs requis",
//                 description: "Veuillez remplir tous les champs obligatoires",
//                 variant: "destructive",
//             });
//             return;
//         }
//
//         if (!selectedPhoto) {
//             toast({
//                 title: "Photo requise",
//                 description: "Veuillez ajouter votre photo d'identité",
//                 variant: "destructive",
//             });
//             return;
//         }
//
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!emailRegex.test(candidat.maican)) {
//             toast({
//                 title: "Email invalide",
//                 description: "Veuillez saisir une adresse email valide",
//                 variant: "destructive",
//             });
//             return;
//         }
//
//         try {
//             // ✅ Vérifier que concours existe
//             if (!concours?.niveau_id) {
//                 throw new Error('Niveau du concours non trouvé');
//             }
//
//             const formData = new FormData();
//             formData.append('niveau_id', concours.niveau_id.toString());
//
//             if (candidat.nipcan && candidat.nipcan.trim()) {
//                 formData.append('nipcan', candidat.nipcan.trim());
//             }
//
//             formData.append('nomcan', candidat.nomcan);
//             formData.append('prncan', candidat.prncan);
//             formData.append('maican', candidat.maican);
//             formData.append('dtncan', candidat.dtncan);
//             formData.append('telcan', candidat.telcan);
//             formData.append('ldncan', candidat.ldncan);
//             formData.append('proorg', candidat.proorg);
//             formData.append('proact', candidat.proact || candidat.proorg);
//             formData.append('proaff', candidat.proaff || candidat.proorg);
//             formData.append('concours_id', concoursId || '');
//             formData.append('phtcan', selectedPhoto);
//
//             const candidatureComplete = await createCandidature(formData);
//             navigate(`/confirmation/${encodeURIComponent(candidatureComplete.nupcan)}`);
//
//         } catch (error: any) {
//             console.error('Erreur lors de la soumission:', error);
//         }
//     };
//
//     // Reste du JSX identique...
//     return (
//         <Layout>
//             <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//                 <div className="text-center mb-8">
//                     <h1 className="text-3xl font-bold text-foreground mb-2">
//                         Formulaire de Candidature
//                     </h1>
//                 </div>
//
//                 {ageError && (
//                     <Alert className="mt-4 mb-6 border-red-200 bg-red-50 max-w-4xl mx-auto">
//                         <AlertTriangle className="h-4 w-4 text-red-600" />
//                         <AlertDescription className="text-red-700">
//                             {ageError}
//                         </AlertDescription>
//                     </Alert>
//                 )}
//
//                 {dataOrigin && (
//                     <div className="max-w-4xl mx-auto mb-6">
//                         <Alert className="border-blue-200 bg-blue-50">
//                             <FileText className="h-4 w-4 text-blue-600" />
//                             <AlertDescription className="text-blue-700">
//                                 {dataOrigin === 'scan' && '📄 Données pré-remplies par scan de document'}
//                                 {dataOrigin === 'nip' && '🆔 Données pré-remplies par NIP gabonais'}
//                                 {dataOrigin === 'manual' && '✏️ Données saisies manuellement'}
//                             </AlertDescription>
//                         </Alert>
//                     </div>
//                 )}
//
//                 <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
//                     <Card className="order-2 lg:order-1">
//                         <CardHeader>
//                             <CardTitle>Informations Personnelles</CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <form onSubmit={handleSubmit} className="space-y-6">
//                                 <div className="p-4 bg-muted rounded-lg">
//                                     <Label htmlFor="nipcan" className="text-sm font-medium">
//                                         NIP Gabonais - Optionnel
//                                     </Label>
//                                     <p className="text-xs text-muted-foreground mb-3">
//                                         Saisissez votre NIP pour auto-remplir vos informations
//                                     </p>
//                                     <div className="flex gap-2">
//                                         <Input
//                                             id="nipcan"
//                                             placeholder="Ex: 1234567890123"
//                                             value={candidat.nipcan}
//                                             onChange={(e) => handleInputChange('nipcan', e.target.value)}
//                                             maxLength={13}
//                                         />
//                                         <Button
//                                             type="button"
//                                             variant="outline"
//                                             onClick={handleNipSearch}
//                                             disabled={searchingNip || !candidat.nipcan.trim()}
//                                         >
//                                             {searchingNip ? 'Recherche...' : 'Rechercher'}
//                                         </Button>
//                                     </div>
//                                 </div>
//
//                                 <ScanDocumentSection
//                                     onScanSuccess={handleScanSuccess}
//                                     existingData={existingData}
//                                 />
//
//                                 {/* Reste des champs du formulaire... */}
//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                                     <div>
//                                         <Label htmlFor="prncan">Prénom *</Label>
//                                         <Input
//                                             id="prncan"
//                                             value={candidat.prncan}
//                                             onChange={(e) => handleInputChange('prncan', e.target.value)}
//                                             placeholder="Votre prénom"
//                                             required
//                                             className={dataOrigin && candidat.prncan ? 'bg-green-50 border-green-200' : ''}
//                                         />
//                                     </div>
//
//                                     <div>
//                                         <Label htmlFor="nomcan">Nom *</Label>
//                                         <Input
//                                             id="nomcan"
//                                             value={candidat.nomcan}
//                                             onChange={(e) => handleInputChange('nomcan', e.target.value)}
//                                             placeholder="Votre nom"
//                                             required
//                                             className={dataOrigin && candidat.nomcan ? 'bg-green-50 border-green-200' : ''}
//                                         />
//                                     </div>
//
//                                     {/* ... autres champs ... */}
//
//                                     <div className="flex justify-end pt-4">
//                                         <Button
//                                             type="submit"
//                                             disabled={candidatureLoading || !!ageError || !selectedPhoto}
//                                             className="bg-primary hover:bg-primary/90"
//                                             size="lg"
//                                         >
//                                             {candidatureLoading ? 'Création...' : 'Créer ma candidature'}
//                                         </Button>
//                                     </div>
//                                 </div>
//                             </form>
//                         </CardContent>
//                     </Card>
//
//                     {/* Colonne droite avec infos concours */}
//                     <div className="space-y-6 order-1 lg:order-2">
//                         {/* Zone photo... */}
//                         {/* Infos concours... */}
//                         {concours && (
//                             <Card className="bg-primary/5 border-primary/20">
//                                 <CardHeader className="pb-3">
//                                     <CardTitle className="text-xl text-primary">{concours.libcnc}</CardTitle>
//                                 </CardHeader>
//                                 <CardContent className="space-y-1 text-sm">
//                                     <p className="text-muted-foreground">
//                                         <span className="font-semibold text-foreground">Établissement:</span> {concours.etablissement_nomets}
//                                     </p>
//                                     <p className="text-muted-foreground">
//                                         <span className="font-semibold text-foreground">Session:</span> {concours.sescnc}
//                                     </p>
//                                     <div className="pt-2 border-t border-primary/10">
//                                         <p className="text-lg font-bold text-green-700">
//                                             Frais: {concours.fracnc} FCFA
//                                         </p>
//                                         {concours.agecnc && (
//                                             <p className="text-sm text-amber-600 font-medium">
//                                                 Âge maximum: {concours.agecnc} ans
//                                             </p>
//                                         )}
//                                     </div>
//                                 </CardContent>
//                             </Card>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </Layout>
//     );
// };
//
// export default Candidature;


// @ts-nocheck
import React, {useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useMutation, useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {AlertTriangle, Camera, Upload, X} from 'lucide-react';
import {toast} from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import {apiService} from '@/services/api';
import {useCandidature} from '@/hooks/useCandidature';

const Candidature = () => {
    const {concoursId} = useParams<{ concoursId: string }>();
    const {filiere} = useParams<{ filiere: string }>();
    const navigate = useNavigate();
    const {createCandidature, isLoading: candidatureLoading} = useCandidature();

    const [candidat, setCandidatForm] = useState({
        nipcan: '',
        nomcan: '',
        prncan: '',
        dtncan: '',
        ldncan: '',
        telcan: '',
        phtcan: '',
        maican: '',
        proorg: '',
        proact: '',
        proaff: '',
    });

    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [searchingNip, setSearchingNip] = useState(false);
    const [ageError, setAgeError] = useState<string | null>(null);

    // Fonction pour calculer l'âge
    const calculateAge = (birthDate: string): number => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    };

    // Fonction pour valider l'âge
    const validateAge = (birthDate: string) => {
        if (!birthDate || !concours?.agecnc) {
            setAgeError(null);
            return;
        }

        const age = calculateAge(birthDate);
        const maxAge = parseInt(concours.agecnc);

        if (age > maxAge) {
            setAgeError(`Votre âge (${age} ans) dépasse la limite autorisée pour ce concours (${maxAge} ans maximum)`);
        } else if (age < 16) {
            setAgeError(`Vous devez avoir au moins 16 ans pour candidater. Votre âge: ${age} ans`);
        } else {
            setAgeError(null);
        }
    };

    // Fonction pour gérer la sélection de photo
    const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Format non supporté",
                description: "Veuillez sélectionner une image (JPEG, PNG, etc.)",
                variant: "destructive"
            });
            return;
        }

        // Vérifier la taille (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Fichier trop volumineux",
                description: "La photo ne doit pas dépasser 5MB",
                variant: "destructive"
            });
            return;
        }

        setSelectedPhoto(file);

        // Créer un aperçu avec fond blanc
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Créer un canvas avec fond blanc
                const canvas = window.document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Définir les dimensions (format identité)
                const size = 400;
                canvas.width = size;
                canvas.height = size;

                // Fond blanc
                if (ctx) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, size, size);

                    // Calculer les dimensions pour centrer l'image
                    const scale = Math.min(size / img.width, size / img.height);
                    const newWidth = img.width * scale;
                    const newHeight = img.height * scale;
                    const x = (size - newWidth) / 2;
                    const y = (size - newHeight) / 2;

                    // Dessiner l'image centrée
                    ctx.drawImage(img, x, y, newWidth, newHeight);

                    // Convertir en blob et créer l'aperçu
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const processedFile = new File([blob], file.name, {type: 'image/jpeg'});
                            setSelectedPhoto(processedFile);
                            setPhotoPreview(canvas.toDataURL());
                        }
                    }, 'image/jpeg', 0.9);
                }
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);

        toast({
            title: "Photo ajoutée",
            description: "Votre photo a été traitée avec fond blanc"
        });
    };

    const removePhoto = () => {
        setSelectedPhoto(null);
        setPhotoPreview(null);
        toast({
            title: "Photo supprimée",
            description: "La photo a été retirée de votre candidature"
        });
    };

    // Recherche par NIP gabonais
    const nipSearchMutation = useMutation({
        mutationFn: (nip: string) => apiService.getCandidatByNupcan(nip),
        onSuccess: (response) => {
            if (response.success && response.data) {
                const candidatData = response.data;
                setCandidatForm(prev => ({
                    ...prev,
                    nomcan: candidatData.nomcan || '',
                    prncan: candidatData.prncan || '',
                    dtncan: candidatData.dtncan ? candidatData.dtncan.split('T')[0] : '',
                    ldncan: candidatData.ldncan || '',
                    telcan: candidatData.telcan || '',
                    phtcan: candidatData.phtcan || '',
                    maican: candidatData.maican || '',
                    proorg: candidatData.proorg?.toString() || '',
                    proact: candidatData.proact?.toString() || '',
                    proaff: candidatData.proaff?.toString() || '',
                }));

                // Valider l'âge après le remplissage automatique
                if (candidatData.dtncan) {
                    validateAge(candidatData.dtncan.split('T')[0]);
                }

                toast({
                    title: "Informations trouvées",
                    description: "Vos informations ont été automatiquement remplies",
                });
            }
        },
        onError: () => {
            toast({
                title: "NIP non trouvé",
                description: "Aucun candidat trouvé avec ce NIP gabonais. Vous pouvez continuer manuellement.",
                variant: "destructive",
            });
        },
        onSettled: () => {
            setSearchingNip(false);
        }
    });

    // Récupération des données de référence
    const {data: provincesResponse, isError: provincesError} = useQuery({
        queryKey: ['provinces'],
        queryFn: () => apiService.getProvinces(),
        retry: 2,
    });

    const {data: concoursResponse, isError: concoursError} = useQuery({
        queryKey: ['concours', concoursId],
        queryFn: () => apiService.getConcoursById(concoursId!),
        enabled: !!concoursId,
        retry: 2,
    });

    const {data: filieresResponse, isError: filiereError} = useQuery({
        queryKey: ['filiere'],
        queryFn: () => apiService.getConcoursFiliere(concoursId!),
        retry: 2,
    })

    // Gestion des erreurs de chargement
    if (provincesError || concoursError) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600"/>
                        <AlertDescription className="text-red-700">
                            Erreur de chargement des données. Veuillez actualiser la page ou réessayer plus tard.
                        </AlertDescription>
                    </Alert>
                </div>
            </Layout>
        );
    }

    const provinces = provincesResponse?.data || [];
    const filieres = filieresResponse?.data || [];
    const concours = concoursResponse?.data;

    const handleInputChange = (field: string, value: string) => {
        setCandidatForm(prev => ({
            ...prev,
            [field]: value
        }));

        // Valider l'âge si c'est le champ de date de naissance
        if (field === 'dtncan') {
            validateAge(value);
        }
    };

    const handleNipSearch = () => {
        if (candidat.nipcan.trim()) {
            setSearchingNip(true);
            nipSearchMutation.mutate(candidat.nipcan);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Vérifier l'âge avant soumission
        if (ageError) {
            toast({
                title: "Âge invalide",
                description: ageError,
                variant: "destructive",
            });
            return;
        }

        // Validation basique
        if (!candidat.nomcan || !candidat.prncan || !candidat.maican || !candidat.telcan ||
            !candidat.dtncan || !candidat.proorg || !candidat.ldncan) {
            toast({
                title: "Champs requis",
                description: "Veuillez remplir tous les champs obligatoires",
                variant: "destructive",
            });
            return;
        }

        // Vérifier qu'une photo est sélectionnée
        if (!selectedPhoto) {
            toast({
                title: "Photo requise",
                description: "Veuillez ajouter votre photo d'identité",
                variant: "destructive",
            });
            return;
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(candidat.maican)) {
            toast({
                title: "Email invalide",
                description: "Veuillez saisir une adresse email valide",
                variant: "destructive",
            });
            return;
        }

        try {
            console.log('Soumission candidature avec données:', candidat);
            console.log('Données concours:', concours);

            // Validation des données requises
            if (!concours?.niveau_id) {
                throw new Error('Niveau du concours non trouvé');
            }

            // Préparer les données pour l'endpoint
            const formData = new FormData();
            formData.append('niveau_id', concours.niveau_id.toString());

            // Ajouter la photo

            // NIP optionnel
            if (candidat.nipcan && candidat.nipcan.trim()) {
                formData.append('nipcan', candidat.nipcan.trim());
            }

            // Champs obligatoires
            formData.append('nomcan', candidat.nomcan);
            formData.append('prncan', candidat.prncan);
            formData.append('maican', candidat.maican);
            formData.append('dtncan', candidat.dtncan);
            formData.append('telcan', candidat.telcan);
            formData.append('ldncan', candidat.ldncan);
            formData.append('proorg', candidat.proorg);
            formData.append('proact', candidat.proact || candidat.proorg);
            formData.append('proaff', candidat.proaff || candidat.proorg);
            formData.append('concours_id', concoursId || '');
            formData.append('phtcan', selectedPhoto);

            // Utiliser le nouveau service de candidature
            const candidatureComplete = await createCandidature(formData);

            console.log('Candidature créée, redirection vers:', `/confirmation/${encodeURIComponent(candidatureComplete.nupcan)}`);
            navigate(`/confirmation/${encodeURIComponent(candidatureComplete.nupcan)}`);

        } catch (error: any) {
            console.error('Erreur lors de la soumission:', error);
            // L'erreur est déjà gérée par useCandidature
        }
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Titre Centré */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Formulaire de Candidature
                    </h1>
                </div>

                {/* ALERTE D'ERREUR D'ÂGE (Avant la grille) */}
                {ageError && (
                    <Alert className="mt-4 mb-6 border-red-200 bg-red-50 max-w-4xl mx-auto">
                        <AlertTriangle className="h-4 w-4 text-red-600"/>
                        <AlertDescription className="text-red-700">
                            {ageError}
                        </AlertDescription>
                    </Alert>
                )}

                {/* STRUCTURE BICOLONNE PRINCIPALE (Ajustement : 3/5 et 2/5 pour laisser plus d'espace au formulaire) */}
                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">

                    {/* COLONNE GAUCHE: FORMULAIRE (2/3 de l'espace sur grand écran) */}
                    <Card className="order-2 lg:order-1">
                        <CardHeader>
                            <CardTitle>Informations Personnelles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">

                                {/* Champ NIP gabonais (mis en haut du formulaire pour la priorité) */}
                                <div className="p-4 bg-muted rounded-lg">
                                    <Label htmlFor="nipcan" className="text-sm font-medium">
                                        NIP Gabonais (Numéro d'Identification Personnel) - Optionnel
                                    </Label>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Si vous avez un NIP, saisissez-le pour auto-remplir vos informations
                                    </p>
                                    <div className="flex gap-2">
                                        <Input
                                            id="nipcan"
                                            placeholder="Ex: 1234567890123"
                                            value={candidat.nipcan}
                                            onChange={(e) => handleInputChange('nipcan', e.target.value)}
                                            maxLength={13}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleNipSearch}
                                            disabled={searchingNip || !candidat.nipcan.trim()}
                                        >
                                            {searchingNip ? 'Recherche...' : 'Rechercher'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Grille des autres champs du formulaire (Nom, Prénom, etc.) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label htmlFor="prncan">Prénom *</Label>
                                        <Input
                                            id="prncan"
                                            value={candidat.prncan}
                                            onChange={(e) => handleInputChange('prncan', e.target.value)}
                                            placeholder="Votre prénom"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="nomcan">Nom *</Label>
                                        <Input
                                            id="nomcan"
                                            value={candidat.nomcan}
                                            onChange={(e) => handleInputChange('nomcan', e.target.value)}
                                            placeholder="Votre nom"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="dtncan">Date de naissance *</Label>
                                        <Input
                                            id="dtncan"
                                            type="date"
                                            value={candidat.dtncan}
                                            onChange={(e) => handleInputChange('dtncan', e.target.value)}
                                            required
                                            className={ageError ? 'border-red-500' : ''}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="ldncan">Lieu de naissance *</Label>
                                        <Input
                                            id="ldncan"
                                            value={candidat.ldncan}
                                            onChange={(e) => handleInputChange('ldncan', e.target.value)}
                                            placeholder="Votre lieu de naissance"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="telcan">Téléphone *</Label>
                                        <Input
                                            id="telcan"
                                            value={candidat.telcan}
                                            onChange={(e) => handleInputChange('telcan', e.target.value)}
                                            placeholder="+241 XX XX XX XX"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="maican">Email *</Label>
                                        <Input
                                            id="maican"
                                            type="email"
                                            value={candidat.maican}
                                            onChange={(e) => handleInputChange('maican', e.target.value)}
                                            placeholder="votre@email.com"
                                            required
                                        />
                                    </div>

                                    {/* Sélecteurs de Provinces */}
                                    <div>
                                        <Label htmlFor="proorg">Province d'origine *</Label>
                                        <Select value={candidat.proorg}
                                                onValueChange={(value) => handleInputChange('proorg', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choisir votre province d'origine"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {provinces.map(province => (
                                                    <SelectItem key={province.id} value={province.id.toString()}>
                                                        {province.nompro}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="proact">Province actuelle</Label>
                                        <Select value={candidat.proact}
                                                onValueChange={(value) => handleInputChange('proact', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choisir votre province actuelle"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {provinces.map(province => (
                                                    <SelectItem key={province.id} value={province.id.toString()}>
                                                        {province.nompro}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <Label htmlFor="proaff">Province d'affectation souhaitée</Label>
                                        <Select value={candidat.proaff}
                                                onValueChange={(value) => handleInputChange('proaff', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choisir votre province d'affectation"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {provinces.map(province => (
                                                    <SelectItem key={province.id} value={province.id.toString()}>
                                                        {province.nompro}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Bouton de soumission */}
                                <div className="flex justify-end pt-4">
                                    <Button
                                        type="submit"
                                        disabled={candidatureLoading || !!ageError || !selectedPhoto}
                                        className="bg-primary hover:bg-primary/90"
                                        size="lg"
                                    >
                                        {candidatureLoading ? 'Création...' : 'Créer ma candidature'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* COLONNE DROITE: VISUEL ET INFOS CLÉS (1/3 de l'espace sur grand écran) */}
                    <div className="space-y-6 order-1 lg:order-2">

                        {/* 1. Zone d'Upload Photo (Mise en avant visuelle) */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-center text-lg flex items-center justify-center gap-2">
                                    <Camera className="h-5 w-5 text-primary"/> Photo d'identité
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="flex flex-col items-center space-y-4">
                                    {photoPreview ? (
                                        <div className="relative">
                                            <div
                                                className="w-48 h-48 rounded-lg overflow-hidden border-4 border-primary/20 shadow-lg bg-white">
                                                <img
                                                    src={photoPreview}
                                                    alt="Photo de candidature sur fond blanc"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={removePhoto}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg transition"
                                            >
                                                <X className="h-4 w-4"/>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoSelect}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                required
                                            />
                                            <div
                                                className="w-48 h-48 border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center bg-white hover:bg-primary/5 transition-colors cursor-pointer p-4">
                                                <Upload className="h-10 w-10 text-primary/60 mb-2"/>
                                                <p className="text-sm text-primary/60 text-center font-medium">
                                                    Ajouter votre photo
                                                </p>
                                                <p className="text-xs text-primary/40 mt-1">
                                                    (Fond blanc obligatoire)
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="text-center bg-blue-50 p-3 rounded-lg border border-blue-200">
                                        <p className="text-xs text-blue-700 font-medium">
                                            <strong>📋 Exigences :</strong> JPEG/PNG (max 5MB), Fond Blanc, Visage
                                            centré.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Infos Clés du Concours (Encart coloré) */}
                        {concours && (
                            <Card className="bg-primary/5 border-primary/20">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xl text-primary">{concours.libcnc}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1 text-sm">
                                    <p className="text-muted-foreground">
                                        <span
                                            className="font-semibold text-foreground">Établissement:</span> {concours.etablissement_nomets}
                                    </p>
                                    <p className="text-muted-foreground">
                                        <span
                                            className="font-semibold text-foreground">Session:</span> {concours.sescnc}
                                    </p>
                                    <div className="pt-2 border-t border-primary/10">
                                        <p className="text-lg font-bold text-green-700">
                                            Frais: {concours.fracnc} FCFA
                                        </p>
                                        {concours.agecnc && (
                                            <p className="text-sm text-amber-600 font-medium">
                                                Âge maximum: {concours.agecnc} ans
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Candidature;