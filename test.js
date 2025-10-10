```
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Trophy,
  FileText,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Clock,
  Download,
  Eye,
  Upload,
  BookOpen,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  MapPin,
  School,
  FileCheck,
  Send,
  Image as ImageIcon,
  Trash2,
  Edit,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { candidatureService } from '@/services/candidatureService';
import BeautifulHorizontalReceipt from '@/components/BeautifulHorizontalReceipt';
import DocumentViewer from '@/components/DocumentViewer';
import DocumentUploadForm from '@/components/DocumentUploadForm';
import NotificationPanel from '@/components/candidate/NotificationPanel';
import CandidatePhotoDisplay from '@/components/CandidatePhotoDisplay';
import { receiptService } from '@/services/receiptService';
import { receiptImageService } from '@/services/receiptImageService';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DashboardCandidat = () => {
  const { nupcan } = useParams<{ nupcan: string }>();
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isDownloadingPNG, setIsDownloadingPNG] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: candidatureData, isLoading, error, refetch } = useQuery({
    queryKey: ['candidature-complete', nupcan],
    queryFn: () => candidatureService.getCandidatureByNupcan(nupcan!),
    enabled: !!nupcan,
    refetchInterval: 10000,
  });

  const handleDownloadReceipt = async () => {
    if (!candidatureData) return;
    try {
      setIsDownloading(true);
      const receiptData = {
        candidat: {
          ...candidatureData.candidat,
          ldncan: candidatureData.candidat.ldncan || 'Libreville',
          phtcan: typeof candidatureData.candidat.phtcan === 'string' ? candidatureData.candidat.phtcan : undefined,
        },
        concours: {
          ...candidatureData.concours,
          fracnc: candidatureData.concours.fracnc || 0,
          sescnc: candidatureData.concours.sescnc || '',
        },
        filiere: candidatureData.filiere,
        paiement: candidatureData.paiement || {
          reference: 'N/A',
          montant: parseFloat(candidatureData.concours.fracnc || '0'),
          date: new Date().toISOString(),
          statut: parseFloat(candidatureData.concours.fracnc || '0') === 0 ? 'gratuit' : 'en_attente',
          methode: 'N/A',
        },
        documents: candidatureData.documents || [],
      };
      await receiptService.downloadReceiptPDF(receiptData);
      toast({ title: 'Téléchargement réussi', description: 'Votre reçu PDF a été téléchargé avec succès' });
    } catch (error) {
      toast({ title: 'Erreur de téléchargement', description: 'Impossible de télécharger le reçu PDF', variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadReceiptPNG = async () => {
    if (!candidatureData) return;
    try {
      setIsDownloadingPNG(true);
      const receiptData = {
        candidat: {
          ...candidatureData.candidat,
          ldncan: candidatureData.candidat.ldncan || 'Libreville',
          phtcan: typeof candidatureData.candidat.phtcan === 'string' ? candidatureData.candidat.phtcan : undefined,
        },
        concours: {
          ...candidatureData.concours,
          fracnc: candidatureData.concours.fracnc || 0,
          sescnc: candidatureData.concours.sescnc || '',
        },
        filiere: candidatureData.filiere,
        paiement: candidatureData.paiement || {
          reference: 'N/A',
          montant: parseFloat(candidatureData.concours.fracnc || '0'),
          date: new Date().toISOString(),
          statut: parseFloat(candidatureData.concours.fracnc || '0') === 0 ? 'gratuit' : 'en_attente',
          methode: 'N/A',
        },
        documents: candidatureData.documents || [],
      };
      await receiptImageService.downloadReceiptImage(receiptData);
      receiptImageService.sendReceiptImageByEmail(receiptData, candidatureData.candidat.maican);
      toast({ title: 'Téléchargement et envoi réussis', description: 'Votre reçu PNG a été téléchargé et envoyé par email' });
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de télécharger le reçu PNG', variant: 'destructive' });
    } finally {
      setIsDownloadingPNG(false);
    }
  };

  const handleEmailReceipt = async () => {
    if (!candidatureData) return;
    try {
      setIsSendingEmail(true);
      const receiptData = {
        candidat: {
          ...candidatureData.candidat,
          ldncan: candidatureData.candidat.ldncan || 'Libreville',
          phtcan: typeof candidatureData.candidat.phtcan === 'string' ? candidatureData.candidat.phtcan : undefined,
        },
        concours: {
          ...candidatureData.concours,
          fracnc: candidatureData.concours.fracnc || 0,
          sescnc: candidatureData.concours.sescnc || '',
        },
        filiere: candidatureData.filiere,
        paiement: candidatureData.paiement || {
          reference: 'N/A',
          montant: parseFloat(candidatureData.concours.fracnc || '0'),
          date: new Date().toISOString(),
          statut: parseFloat(candidatureData.concours.fracnc || '0') === 0 ? 'gratuit' : 'en_attente',
          methode: 'N/A',
        },
        documents: candidatureData.documents || [],
      };
      await receiptService.generateAndSendReceiptEmail(receiptData, candidatureData.candidat.maican);
      toast({ title: 'Reçu envoyé', description: 'Le reçu a été envoyé à votre adresse email avec succès' });
    } catch (error) {
      toast({ title: 'Erreur d\'envoi', description: 'Impossible d\'envoyer le reçu par email', variant: 'destructive' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDocumentAdd = async (documents: { name: string; file: File }[]) => {
    if (!nupcan) return;
    try {
      console.log('Ajout de documents:', documents);
      toast({ title: 'Documents ajoutés', description: `${documents.length}
document(s)
ajouté(s)
avec
succès` });
      await refetch();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible d\'ajouter les documents', variant: 'destructive' });
    }
  };

  const handleContinueApplication = () => {
    if (!candidatureData) return;
    const { progression } = candidatureData;
    if (progression?.etapeActuelle === 'documents') {
      navigate(` / documents /${nupcan}`);
    } else if (progression?.etapeActuelle === 'paiement') {
      navigate(` / paiement /${nupcan}`);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!nupcan || !documentId) return;
    try {
      // Implémentation fictive, remplace par un appel API réel
      // await candidatureService.deleteDocument(nupcan, documentId);
      toast({ title: 'Document supprimé', description: 'Le document a été supprimé avec succès' });
      setIsEditModalOpen(false);
      await refetch();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de supprimer le document', variant: 'destructive' });
    }
  };

  const handleReplaceDocument = () => {
    if (!selectedDocument || !nupcan) return;
    setIsEditModalOpen(false);
    toast({
      title: 'Remplacement',
      description: 'Veuillez sélectionner un nouveau fichier pour remplacer le document',
    });
    // À implémenter : ouvrir une modale avec DocumentUploadForm ou rediriger
  };

  if (isLoading) {
    return (
        <Layout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Chargement de votre tableau de bord...</p>
            </div>
          </div>
        </Layout>
    );
  }

  if (error || !candidatureData) {
    return (
        <Layout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">
                {error ? 'Erreur de chargement' : 'Candidature introuvable'}
              </h1>
              <Button onClick={() => navigate('/connexion')}>Retour à la connexion</Button>
            </div>
          </div>
        </Layout>
    );
  }

  const { candidat, concours, filiere, documents, paiement, progression } = candidatureData;
  const isApplicationComplete = progression?.pourcentage === 100;
  const nextStepNeeded = !isApplicationComplete;
  const isGratuit = parseFloat(concours?.fracnc || '0') === 0;
  const photoPath = typeof candidat?.phtcan === 'string' ? candidat.phtcan : null;

  return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* En-tête professionnel */}
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate('/connexion')} className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="bg-gradient-to-r from-primary/10 to-blue-50 rounded-xl p-8 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <CandidatePhotoDisplay
                      photoPath={photoPath}
                      candidateName={`${candidat?.prncan} ${candidat?.nomcan}`}
                      size="lg"
                  />
                  <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">Tableau de Bord Candidat</h1>
                    <p className="text-xl text-muted-foreground mb-1">
                      Bienvenue, {candidat?.prncan} {candidat?.nomcan}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {candidat?.maican}
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {candidat?.telcan}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-lg px-4 py-2 mb-2">
                    NUPCAN: {candidat?.nupcan}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Inscrit le{' '}
                    {candidat?.created_at
                        ? new Date(candidat.created_at).toLocaleDateString('fr-FR')
                        : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progression avec actions rapides */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Trophy className="h-6 w-6 mr-2 text-primary" />
                      Progression de votre candidature
                    </CardTitle>
                    {nextStepNeeded && (
                        <Button onClick={handleContinueApplication} size="sm">
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Continuer
                        </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium">Progression globale</span>
                      <span className="text-2xl font-bold text-primary">
                      {progression?.pourcentage || 0}%
                    </span>
                    </div>
                    <Progress value={progression?.pourcentage || 0} className="h-3" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 border border-green-200">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">Inscription</p>
                          <p className="text-sm text-green-600">Terminée</p>
                        </div>
                      </div>
                      <div
                          className={`
flex
items - center
space - x - 3
p - 3
rounded - lg ${
                              documents && documents.length > 0
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-orange-50 border-orange-200'
                          }`}
                      >
                        <FileText
                            className={`
h - 5
w - 5 ${
                                documents && documents.length > 0 ? 'text-green-600' : 'text-orange-600'
                            }`}
                        />
                        <div>
                          <p
                              className={`
font - medium ${
                                  documents && documents.length > 0 ? 'text-green-800' : 'text-orange-800'
                              }`}
                          >
                            Documents
                          </p>
                          <p
                              className={`
text - sm ${
                                  documents && documents.length > 0 ? 'text-green-600' : 'text-orange-600'
                              }`}
                          >
                            {documents && documents.length > 0 ? 'Soumis' : 'En attente'}
                          </p>
                        </div>
                      </div>
                      <div
                          className={`
flex
items - center
space - x - 3
p - 3
rounded - lg ${
                              isGratuit
                                  ? 'bg-green-50 border-green-200'
                                  : paiement
                                      ? 'bg-green-50 border-green-200'
                                      : 'bg-orange-50 border-orange-200'
                          }`}
                      >
                        <CreditCard
                            className={`
h - 5
w - 5 ${
                                isGratuit || paiement ? 'text-green-600' : 'text-orange-600'
                            }`}
                        />
                        <div>
                          <p
                              className={`
font - medium ${
                                  isGratuit || paiement ? 'text-green-800' : 'text-orange-800'
                              }`}
                          >
                            Paiement
                          </p>
                          <p
                              className={`
text - sm ${
                                  isGratuit || paiement ? 'text-green-600' : 'text-orange-600'
                              }`}
                          >
                            {isGratuit ? 'Gratuit' : paiement ? 'Payé' : 'En attente'}
                          </p>
                        </div>
                      </div>
                    </div>
                    {nextStepNeeded && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-blue-800">Prochaine étape :</span>
                            <span className="text-blue-700">
                          {progression?.etapeActuelle === 'documents'
                              ? 'Télécharger vos documents'
                              : progression?.etapeActuelle === 'paiement'
                                  ? 'Effectuer le paiement'
                                  : 'Finaliser votre candidature'}
                        </span>
                          </div>
                        </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions rapides */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                      onClick={handleDownloadReceipt}
                      className="w-full justify-start"
                      variant="outline"
                      disabled={isDownloading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isDownloading ? 'Téléchargement...' : 'Télécharger le reçu PDF'}
                  </Button>
                  <Button
                      onClick={handleDownloadReceiptPNG}
                      className="w-full justify-start"
                      variant="outline"
                      disabled={isDownloadingPNG}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {isDownloadingPNG ? 'Téléchargement...' : 'Télécharger le reçu PNG'}
                  </Button>
                  <Button
                      onClick={handleEmailReceipt}
                      className="w-full justify-start"
                      variant="outline"
                      disabled={isSendingEmail}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSendingEmail ? 'Envoi en cours...' : 'Envoyer le reçu par email'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Notifications */}
          {candidat?.nupcan && (
              <div className="mb-8">
                <NotificationPanel nupcan={candidat.nupcan} />
              </div>
          )}

          {/* Informations détaillées */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Informations personnelles complètes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profil Candidat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-6">
                  <CandidatePhotoDisplay
                      photoPath={photoPath}
                      candidateName={`${candidat?.prncan} ${candidat?.nomcan}`}
                      size="md"
                  />
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Nom</span>
                        <p className="font-medium">{candidat?.nomcan}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Prénom</span>
                        <p className="font-medium">{candidat?.prncan}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{candidat?.maican}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{candidat?.telcan}</span>
                      </div>
                      {candidat?.dtncan && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                          {new Date(candidat.dtncan).toLocaleDateString('fr-FR')}
                        </span>
                          </div>
                      )}
                      {candidat?.ldncan && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{candidat.ldncan}</span>
                          </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations du concours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <School className="h-5 w-5 mr-2" />
                  Concours Sélectionné
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-semibold text-lg mb-2">{concours?.libcnc || 'Non défini'}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Établissement:</span>
                      <p>{concours?.etablissement_nomets || 'Non défini'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Session:</span>
                      <p>{concours?.sescnc || 'Non définie'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <span className="font-medium">Frais d'inscription:</span>
                  <div className="text-right">
                    {isGratuit ? (
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          GRATUIT (NGORI)
                        </Badge>
                    ) : (
                        <span className="text-lg font-bold text-green-700">
                      {parseFloat(concours?.fracnc || '0').toLocaleString()} FCFA
                    </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filière et matières */}
          {filiere && Object.keys(filiere).length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Filière d'Études
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-lg text-blue-800">{filiere.nomfil || 'Non définie'}</h3>
                      {filiere.description && <p className="text-blue-700 mt-2">{filiere.description}</p>}
                    </div>
                    {filiere.matieres && filiere.matieres.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-4 flex items-center">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Matières d'étude ({filiere.matieres.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filiere.matieres.map((matiere: any, index: number) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border"
                                >
                                  <div className="flex items-center space-x-3">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    <div>
                                      <h5 className="font-medium">{matiere.nom_matiere}</h5>
                                      <p className="text-sm text-muted-foreground">
                                        Coefficient: {matiere.coefficient}
                                      </p>
                                    </div>
                                  </div>
                                  {matiere.obligatoire && (
                                      <Badge variant="destructive" className="text-xs">
                                        Obligatoire
                                      </Badge>
                                  )}
                                </div>
                            ))}
                          </div>
                        </div>
                    )}
                  </div>
                </CardContent>
              </Card>
          )}

          {/* Gestion des documents */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <FileCheck className="h-5 w-5 mr-2" />
                  Mes Documents ({documents?.length || 0})
                </CardTitle>
                <DocumentUploadForm onDocumentsAdd={handleDocumentAdd} existingDocuments={documents} />
              </div>
            </CardHeader>
            <CardContent>
              {documents && documents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc: any) => (
                        <Card key={doc.id} className="relative">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium truncate">{doc.nomdoc || 'Sans nom'}</span>
                              <Badge
                                  variant={doc.document_statut === 'rejete' ? 'destructive' : 'secondary'}
                              >
                                {doc.document_statut || 'Inconnu'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">Type: {doc.type || 'Inconnu'}</p>
                            <p className="text-sm text-muted-foreground mb-4">
                              {doc.taille && `
Taille: ${(doc.taille / 1024).toFixed(1)} KB`}
                            </p>
                            <div className="flex space-x-2">
                              <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedDocument(doc)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Voir
                              </Button>
                              {doc.document_statut === 'rejete' && (
                                  <><Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedDocument(doc);
                                        setIsEditModalOpen(true);
                                      }}
                                  >
                                    <Edit className="h-4 w-4 mr-2"/>
                                    Modifier
                                  </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedDocument(doc);
                                        setIsEditModalOpen(true);
                                      }}
                                  >
                                    <Edit className="h-4 w-4 mr-2"/>
                                    Supprimer
                                  </Button></>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                    ))}
                  </div>
              ) : (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun document téléchargé</p>
                  </div>
              )}
            </CardContent>
          </Card>

          {/* Modale pour modifier un document rejeté */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier le document rejeté</DialogTitle>
                <DialogDescription>
                  <div>
                    {selectedDocument && (
                        <div className="space-y-2">
                          <p>
                            Nom: {selectedDocument.nomdoc || 'Sans nom'} (Statut:{' '}
                            {selectedDocument.document_statut})
                          </p>
                          <p>Type: {selectedDocument.type || 'Inconnu'}</p>
                          <div className="mt-4 space-x-2">
                            <Button
                                variant="destructive"
                                onClick={() => handleDeleteDocument(selectedDocument.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </Button>
                            <Button variant="default" onClick={handleReplaceDocument}>
                              <Upload className="h-4 w-4 mr-2" />
                              Remplacer
                            </Button>
                          </div>
                        </div>
                    )}
                  </div>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>

          {/* Visualisation du document avec DocumentViewer */}
          <DocumentViewer
              isOpen={!!selectedDocument}
              onClose={() => setSelectedDocument(null)}
              document={selectedDocument || null}
          />

          {/* Reçu de candidature */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Votre Reçu de Candidature</h2>
            <BeautifulHorizontalReceipt
                candidatureData={{
                  candidat,
                  concours,
                  filiere,
                  documents: documents || [],
                  paiement,
                  nupcan: candidat?.nupcan,
                }}
                onEmailSend={handleEmailReceipt}
            />
          </div>
        </div>
      </Layout>
  );
};

export default DashboardCandidat;


export interface CandidatureFormData {
  nomcan: string;
  prncan: string;
  maican: string;
  dtncan: string;
  telcan: string;
  ldncan: string;
  niveau_id: number;
  nipcan: string;
  proorg: number;
  proact: number;
  proaff: number;
  concours_id: number;
  phtcan?: File;
}

export interface CandidatureState {
  candidatData: any;
  concoursData: any;
  documentsData: any[];
  paiementData: any;
  sessionData?: any;
  progression: {
    etapeActuelle: 'inscription' | 'documents' | 'paiement' | 'complete';
    etapesCompletes: string[];
    pourcentage: number;
  };
  lastUpdated?: Date;
}

class CandidatureStateManager {
  private states: Map<string, CandidatureState> = new Map();

  validateNupcanFormat(nupcan: string): boolean {
    // Valider le format NUPCAN (ex: 2025630-15)
    const nupcanRegex = /^\d{8}-\d{1,4}$/;
    return nupcanRegex.test(nupcan);
  }

  async initializeNewCandidature(concoursId: string): Promise<CandidatureState> {
    try {
      const concoursResponse = await fetch(`
http://localhost:3000/api/concours/${concoursId}`);
    const concoursData = await concoursResponse.json();

const state: CandidatureState = {
    candidatData: null,
    concoursData: concoursData.data,
    documentsData: [],
    paiementData: null,
    sessionData: null,
    progression: {
        etapeActuelle: 'inscription',
        etapesCompletes: [],
        pourcentage: 0,
    },
};

const candidatureId = `temp_${concoursId}_${Date.now()}`;
this.states.set(candidatureId, state);

return state;
} catch
(error)
{
    console.error('Erreur lors de l\'initialisation:', error);
    throw error;
}
}

async
initializeContinueCandidature(nupcan
:
string
):
Promise < any > {
    try {
        const response = await fetch(`http://localhost:3000/api/candidats/nupcan/${encodeURIComponent(nupcan)}`);
        const candidatureData = await response.json();

        if(
!candidatureData.success
)
{
    throw new Error('Candidature non trouvée');
}

return candidatureData.data;
} catch
(error)
{
    console.error('Erreur lors de l\'initialisation continue:', error);
    throw error;
}
}

async
finalizeInscription(candidatureId
:
string, formData
:
CandidatureFormData
):
Promise < void > {
    const state = this.states.get(candidatureId);
    if(state) {
        state.candidatData = formData;
        state.progression.etapeActuelle = 'documents';
        state.progression.etapesCompletes = ['inscription'];
        state.progression.pourcentage = 33;
    }
}

async
updateProgression(nupcan
:
string, etape
:
'documents' | 'paiement'
):
Promise < void > {
    try {
        // Mettre à jour la progression via l'API
        await fetch(`http://localhost:3000/api/candidats/${nupcan}/progression`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({etape}),
        });
    } catch(error) {
        console.error('Erreur mise à jour progression:', error);
    }
}

getState(candidatureId
:
string
):
CandidatureState | undefined
{
    return this.states.get(candidatureId);
}

updateState(candidatureId
:
string, updates
:
Partial < CandidatureState >
):
void {
    const state = this.states.get(candidatureId);
    if(state) {
        Object.assign(state, updates);
    }
}

saveState(candidatureId
:
string, state
:
Partial < CandidatureState >
):
void {
    const existingState = this.states.get(candidatureId) || {
        candidatData: null,
        concoursData: null,
        documentsData: [],
        paiementData: null,
        sessionData: null,
        progression: {
            etapeActuelle: 'inscription' as const,
            etapesCompletes: [],
            pourcentage: 0,
        },
    };

    this.states.set(candidatureId, {...existingState, ...state});
}
}

export const candidatureStateManager = new CandidatureStateManager();

// Export des types pour les autres fichiers
export
type
{
    CandidatData, ConcoursData
}
from
'@/hooks/useCandidatureState';


import {apiService} from './api';

export
interface
DocumentData
{
    id: number;
    nomdoc: string;
    type: string;
    chemin_fichier: string;
    taille_fichier: number;
    statut: 'en_attente' | 'valide' | 'rejete';
    create_at: string;
    candidat_nupcan: string;
    commentaire ? : string;
}

export
interface
DocumentValidationData
{
    statut: 'valide' | 'rejete';
    commentaire ? : string;
    admin_id ? : number;
}

class DocumentService {
    // Récupérer tous les documents d'un candidat
    async getDocumentsByCandidat(nupcan: string): Promise<{ success: boolean; data: DocumentData[]; message: string }> {
        try {
            console.log('Récupération documents pour candidat:', nupcan);
            const response = await apiService.makeRequest(`/dossiers/nupcan/${nupcan}`, 'GET');
            return {
                success: response.success || false,
                data: (response.data as any
        ) ||
            [],
                message
        :
            response.message || 'Documents récupérés'
        }
            ;
        } catch (error) {
            console.error('Erreur récupération documents:', error);
            throw error;
        }
    }

    // Valider un document
    async validateDocument(documentId: string, validationData: DocumentValidationData): Promise<{ success: boolean; message: string }> {
        try {
            console.log('Validation document:', documentId, validationData);
            const response = await apiService.makeRequest(`/document-validation/${documentId}`, 'PUT', validationData);
            return {
                success: response.success || false,
                message: response.message || 'Document validé'
            };
        } catch (error) {
            console.error('Erreur validation document:', error);
            throw error;
        }
    }

    // Télécharger un document
    async downloadDocument(documentId: string): Promise<Blob> {
        try {
            console.log('Téléchargement document:', documentId);
            const response = await fetch(`http://localhost:3000/api/documents/${documentId}/download`);
            if (!response.ok) {
                throw new Error('Erreur lors du téléchargement');
            }
            return await response.blob();
        } catch (error) {
            console.error('Erreur téléchargement document:', error);
            throw error;
        }
    }

    // Obtenir l'URL de prévisualisation d'un document
    getDocumentPreviewUrl(chemin_fichier: string): string {
        return `http://localhost:3000/uploads/documents/${chemin_fichier}`;
    }
}

export const documentService = new DocumentService();

import {apiService} from './api';

export
interface
AdminDocumentData
{
    id: number;
    nomdoc: string;
    type: string;
    nom_fichier: string;
    statut: 'en_attente' | 'valide' | 'rejete';
    commentaire_validation ? : string;
    created_at: string;
    updated_at: string;
    // Données du candidat
    nupcan: string;
    candidat_id: number;
    concours_id: number;
    nomcan: string;
    prncan: string;
    maican: string;
    libcnc: string;
}

export
interface
DocumentValidationRequest
{
    statut: 'valide' | 'rejete';
    commentaire ? : string;
    admin_id ? : number;
}

export
interface
DocumentStats
{
    total: number;
    en_attente: number;
    valide: number;
    rejete: number;
}

class AdminDocumentService {
    // Récupérer tous les documents avec infos candidat
    async getAllDocumentsWithCandidatInfo(): Promise<{ success: boolean; data: AdminDocumentData[]; message?: string }> {
        try {
            console.log('AdminDocumentService: Récupération documents admin');
            const response = await apiService.getAdminDossiers < AdminDocumentData[] > ();
            return {
                success: response.success || false,
                data: response.data || [],
                message: response.message
            };
        } catch (error) {
            console.error('AdminDocumentService: Erreur récupération documents:', error);
            throw error;
        }
    }

    // Valider un document
    async validateDocument(documentId: number, statut: "valide" | "rejete", commentaire

?:
    string
):

    Promise<{

    success: boolean;
    message
?:
    string
}

>
{
    try {
        console.log('AdminDocumentService: Validation document:', documentId, statut);
        const response = await apiService.updateDocumentStatus(documentId.toString(), statut, commentaire);
        return {
            success: response.success || false,
            message: response.message
        };
    } catch (error) {
        console.error('AdminDocumentService: Erreur validation document:', error);
        throw error;
    }
}

// Obtenir les statistiques
async
getDocumentStats()
:
Promise < {success: boolean; data: DocumentStats; message? : string} > {
    try {
        const response = await apiService.makeRequest < {
            stats: any[];
            totals: DocumentStats
        } > ('/document-validation/stats', 'GET');

        if(response.success && response.data
)
{
    return {
        success: true,
        data: response.data.totals,
        message: 'Statistiques récupérées'
    };
}

return {
    success: false,
    data: {total: 0, en_attente: 0, valide: 0, rejete: 0},
    message: 'Erreur récupération statistiques'
};
} catch
(error)
{
    console.error('AdminDocumentService: Erreur statistiques:', error);
    throw error;
}
}

// Télécharger un document
async
downloadDocument(nomFichier
:
string
):
Promise < Blob > {
    try {
        console.log('AdminDocumentService: Téléchargement document:', nomFichier);
        const response = await fetch(`http://localhost:3000/uploads/documents/${nomFichier}`);
        if(
!response.ok
)
{
    throw new Error('Erreur lors du téléchargement');
}
return await response.blob();
} catch
(error)
{
    console.error('AdminDocumentService: Erreur téléchargement:', error);
    throw error;
}
}

// Obtenir l'URL de prévisualisation
getDocumentPreviewUrl(nomFichier
:
string
):
string
{
    return `http://localhost:3000/uploads/documents/${nomFichier}`;
}

// Ajouter la méthode manquante
async
getCandidatDocuments(nupcan
:
string
):
Promise < AdminDocumentData[] > {
    try {
        console.log('AdminDocumentService: Récupération documents candidat:', nupcan);
        const response = await apiService.getDocumentsByNupcan < AdminDocumentData[] > (nupcan);
        return response.data || [];
    } catch(error) {
        console.error('AdminDocumentService: Erreur récupération documents candidat:', error);
        throw error;
    }
}
}

export const adminDocumentService = new AdminDocumentService();

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export
interface
ApiResponse < T > {
    success: boolean;
    data? : T;
    message? : string;
    errors? : string[];
}

// Helper type for legacy compatibility
export
type
LegacyApiResponse < T = any > = ApiResponse < T > | T;

// Instance axios pour la compatibilité
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export class ApiService {
    private token: string | null = null;

    constructor(private

    baseUrl: string = API_BASE_URL
) {
}

// Méthode pour définir le token
setToken(token
:
string
)
{
    this.token = token;
    api.defaults.headers.Authorization = `Bearer ${token}`;
}

// Méthode pour supprimer le token
clearToken()
{
    this.token = null;
    delete api.defaults.headers.Authorization;
}

async
makeRequest < T > (url: string, method
:
string, data ? : any
):
Promise < ApiResponse < T >> {
    try {
        const isFormData = data instanceof FormData;

        const response = await axios({
            url: `${this.baseUrl}${url}`,
            method,
            data,
            headers: isFormData
                ? {'Content-Type': 'multipart/form-data'}
                : {
                    'Content-Type': 'application/json',
                    ...(this.token ? {Authorization: `Bearer ${this.token}`} : {}),
                },
        });

        return response.data;
    } catch(error: any) {
        console.error(`Erreur lors de la requête vers ${url}:`, error);

        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || 'Erreur lors de la requête',
                errors: error.response.data.errors || [error.message],
            };
        }

        return {
            success: false,
            message: 'Erreur inconnue lors de la requête',
            errors: [error.message],
        };
    }
}

async
makeFormDataRequest < T > (url: string, method
:
string, formData
:
FormData
):
Promise < ApiResponse < T >> {
    try {
        console.log('API: Envoi FormData vers', url);

        const response = await axios({
            url: `${this.baseUrl}${url}`,
            method,
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(this.token ? {Authorization: `Bearer ${this.token}`} : {}),
            },
        });

        return response.data;
    } catch(error: any) {
        console.error(`Erreur lors de la requête FormData vers ${url}:`, error);

        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || 'Erreur lors de la requête',
                errors: error.response.data.errors || [error.message],
            };
        }

        return {
            success: false,
            message: 'Erreur inconnue lors de la requête',
            errors: [error.message],
        };
    }
}

async
getConcours < T > ()
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > ('/concours', 'GET');
}

async
getAdmins < T > ()
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > ('/admins', 'GET');
}

async
getNiveaux < T > ()
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > ('/niveaux', 'GET');
}

async
getFilieres < T > ()
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > ('/filieres', 'GET');
}

async
getEtablissements < T > ()
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > ('/etablissements', 'GET');
}

async
getSessions < T > ()
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > ('/sessions', 'GET');
}

async
createCandidat < T > (data: any)
:
Promise < ApiResponse < T >> {
    if(data instanceof FormData
)
{
    return this.makeFormDataRequest < T > ('/candidats', 'POST', data);
}
return this.makeRequest < T > ('/candidats', 'POST', data);
}

async
updateCandidat < T > (id: string, data
:
any
):
Promise < ApiResponse < T >> {
    return this.makeRequest < T > (`/candidats/${id}`, 'PUT', data);
}

async
getNupcanAvailability(nupcan
:
string
):
Promise < ApiResponse < boolean >> {
    return this.makeRequest < boolean > (`/candidats/check-nupcan?nupcan=${nupcan}`, 'GET');
}

async
getCandidatByNupcan < T > (nupcan: string)
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > (`/candidats/nupcan/${nupcan}`, 'GET');
}

async
createPaiement < T > (data: any)
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > ('/paiements', 'POST', data);
}

async
getPaiementByNupcan < T > (nupcan: string)
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > (`/paiements/nupcan/${nupcan}`, 'GET');
}

async
getCandidats < T > ()
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > ('/candidats', 'GET');
}

async
getDocumentsByCandidat(nupcan
:
string
)
{
    console.log('API: Récupération documents pour candidat:', nupcan);
    try {
        const response = await this.makeRequest(`/dossiers/nupcan/${nupcan}`, 'GET');
        console.log('API: Documents récupérés:', response);
        return response;
    } catch (error) {
        console.error('API: Erreur récupération documents:', error);
        throw error;
    }
}

async
validateDocument(documentId
:
string, statut
:
'valide' | 'rejete', commentaire ? : string
)
{
    console.log('API: Validation document:', documentId, statut);
    try {
        const response = await this.makeRequest(`/document-validation/${documentId}`, 'PUT', {
            statut,
            commentaire,
            admin_id: 1,
        });
        console.log('API: Document validé:', response);
        return response;
    } catch (error) {
        console.error('API: Erreur validation document:', error);
        throw error;
    }
}

async
downloadDocument(documentId
:
string
):
Promise < Blob > {
    console.log('API: Téléchargement document:', documentId);
    try {
        const response = await fetch(`${this.baseUrl}/documents/${documentId}/download`);
        if(
!response.ok
)
{
    throw new Error(`HTTP error! status: ${response.status}`);
}
return await response.blob();
} catch
(error)
{
    console.error('API: Erreur téléchargement document:', error);
    throw error;
}
}

async
getDossiers < T > ()
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > ('/dossiers', 'GET');
}

async
getAdminDossiers < T > ()
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > ('/dossiers/admin/all', 'GET');
}

async
getDocumentsByNupcan < T > (nupcan: string)
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > (`/dossiers/nupcan/${nupcan}`, 'GET');
}

async
updateDocumentStatus < T > (documentId: string, statut
:
string, commentaire ? : string
):
Promise < ApiResponse < T >> {
    return this.makeRequest < T > (`/document-validation/${documentId}`, 'PUT', {
        statut,
        commentaire,
        admin_id: 1,
    });
}

async
createDossier < T > (data: any)
:
Promise < ApiResponse < T >> {
    if(data instanceof FormData
)
{
    return this.makeFormDataRequest < T > ('/dossiers', 'POST', data);
}
return this.makeRequest < T > ('/dossiers', 'POST', data);
}

async
getConcoursById < T > (id: string)
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > (`/concours/${id}`, 'GET');
}

async
getConcoursFiliere < T > (concoursId: string)
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > (`/concours/${concoursId}/filieres`, 'GET');
}

async
createConcours < T > (data: any)
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > ('/concours', 'POST', data);
}

async
deleteConcours < T > (id: string)
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > (`/concours/${id}`, 'DELETE');
}

async
getFiliereWithMatieres < T > (filiereId: string)
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > (`/filieres/${filiereId}/matieres`, 'GET');
}

async
getProvinces < T > ()
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > ('/provinces', 'GET');
}

async
getStatistics < T > ()
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > ('/statistics', 'GET');
}

async
getPaiements < T > ()
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > ('/paiements', 'GET');
}

async
getPaiementByCandidat < T > (candidatId: string)
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > (`/paiements/candidat/${candidatId}`, 'GET');
}

async
getCandidatByNip < T > (nip: string)
:
Promise < ApiResponse < T >> {
    return this.getCandidatByNupcan < T > (nip);
}

async
createEtudiant < T > (data: any)
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > ('/etudiants', 'POST', data);
}

async
getCandidateNotifications < T > (candidatId: string)
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > (`/notifications/candidat/${candidatId}`, 'GET');
}

async
markNotificationAsRead < T > (notificationId: string)
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > (`/notifications/${notificationId}/read`, 'PUT');
}

async
sendReceiptByEmail < T > (nupcan: string, email
:
string
):
Promise < ApiResponse < T >> {
    return this.makeRequest < T > ('/email/send-receipt', 'POST', {nupcan, email});
}

async
createEtablissement < T > (data: any)
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > ('/etablissements', 'POST', data);
}

async
updateEtablissement < T > (id: string, data
:
any
):
Promise < ApiResponse < T >> {
    return this.makeRequest < T > (`/etablissements/${id}`, 'PUT', data);
}

async
deleteEtablissement < T > (id: string)
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > (`/etablissements/${id}`, 'DELETE');
}

async
createFiliere < T > (data: any)
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > ('/filieres', 'POST', data);
}

async
updateFiliere < T > (id: string, data
:
any
):
Promise < ApiResponse < T >> {
    return this.makeRequest < T > (`/filieres/${id}`, 'PUT', data);
}

async
deleteFiliere < T > (id: string)
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > (`/filieres/${id}`, 'DELETE');
}

async
createNiveau < T > (data: any)
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > ('/niveaux', 'POST', data);
}

async
updateNiveau < T > (id: string, data
:
any
):
Promise < ApiResponse < T >> {
    return this.makeRequest < T > (`/niveaux/${id}`, 'PUT', data);
}

async
deleteNiveau < T > (id: string)
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > (`/niveaux/${id}`, 'DELETE');
}

async
createSession < T > (data: any)
:
Promise < ApiResponse < T >> {
    return this.makeRequest < T > ('/sessions', 'POST', data);
}

async
deleteNotification(notificationId
:
string
)
{
    return this.makeRequest(`/notifications/${notificationId}`, 'DELETE');
}

async
deleteAllNotifications(candidatId
:
string
)
{
    return this.makeRequest(`/notifications/candidat/${candidatId}`, 'DELETE');
}
}

export const apiService = new ApiService();


const {getConnection} = require('../config/database');

class Document {
    static async create(documentData) {
        const connection = getConnection();

        // Adapter aux champs de la table documents selon le schéma réel
        const sanitizedData = {
            nomdoc: documentData.nomdoc || documentData.nom_fichier || 'Document',
            type: documentData.type || 'document',
            nom_fichier: documentData.nom_fichier || documentData.chemin_fichier || documentData.docdsr || '',
            statut: documentData.statut || 'en_attente'
        };

        const [result] = await connection.execute(
            `INSERT INTO documents (nomdoc, type, nom_fichier, statut, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [
                sanitizedData.nomdoc,
                sanitizedData.type,
                sanitizedData.nom_fichier,
                sanitizedData.statut
            ]
        );

        return {
            id: result.insertId,
            ...sanitizedData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }

    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM documents WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    static async findByNupcan(nupcan) {
        const connection = getConnection();
        console.log('Document.findByNupcan - NUPCAN:', nupcan);

        try {
            // Utiliser la table dossiers pour la liaison avec nipcan
            const [rows] = await connection.execute(
                `SELECT d.*, dos.nipcan, dos.docdsr, dos.candidat_id, dos.concours_id
         FROM documents d 
         JOIN dossiers dos ON d.id = dos.document_id 
         WHERE dos.nipcan = ? 
         ORDER BY d.created_at DESC`,
                [nupcan]
            );

            console.log('Documents trouvés:', rows.length);
            return rows;
        } catch (error) {
            console.log('Erreur lors de la récupération des documents:', error.message);
            return [];
        }
    }

    static async updateStatus(id, statut, commentaire = null) {
        const connection = getConnection();

        // Mise à jour avec commentaire optionnel
        if (commentaire) {
            await connection.execute(
                'UPDATE documents SET statut = ?, commentaire_validation = ?, updated_at = NOW() WHERE id = ?',
                [statut, commentaire, id]
            );
        } else {
            await connection.execute(
                'UPDATE documents SET statut = ?, updated_at = NOW() WHERE id = ?',
                [statut, id]
            );
        }

        return this.findById(id);
    }

    static async findAll() {
        const connection = getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM documents ORDER BY created_at DESC'
        );
        return rows;
    }

    static async findAllWithCandidatInfo() {
        const connection = getConnection();
        const [rows] = await connection.execute(`
      SELECT 
        d.*,
        dos.nipcan as nupcan,
        dos.candidat_id,
        dos.concours_id,
        c.nomcan,
        c.prncan,
        c.maican,
        con.libcnc
      FROM documents d
      LEFT JOIN dossiers dos ON d.id = dos.document_id
      LEFT JOIN candidats c ON dos.candidat_id = c.id
      LEFT JOIN concours con ON dos.concours_id = con.id
      ORDER BY d.created_at DESC
    `);
        return rows;
    }

    static async deleteById(id) {
        const connection = getConnection();
        const [result] = await connection.execute(
            'DELETE FROM documents WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async getStatsByStatus() {
        const connection = getConnection();
        const [rows] = await connection.execute(`
      SELECT 
        statut,
        COUNT(*) as count
      FROM documents 
      GROUP BY statut
    `);
        return rows;
    }
}

module.exports = Document;


const {getConnection} = require('../config/database');

class Dossier {
    static async create(dossierData) {
        const connection = getConnection();

        try {
            const sanitizedData = {
                candidat_id: dossierData.candidat_id || null,
                concours_id: dossierData.concours_id || null,
                document_id: dossierData.document_id || null,
                nipcan: dossierData.nipcan || dossierData.nupcan || null,
                docdsr: dossierData.docdsr || dossierData.chemin_fichier || null
            };

            console.log('Dossier.create - Données à insérer:', sanitizedData);

            const [result] = await connection.execute(
                `INSERT INTO dossiers (candidat_id, concours_id, document_id, nipcan, docdsr, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    sanitizedData.candidat_id,
                    sanitizedData.concours_id,
                    sanitizedData.document_id,
                    sanitizedData.nipcan,
                    sanitizedData.docdsr
                ]
            );

            console.log('Dossier.create - Résultat insertion:', result);

            return {
                id: result.insertId,
                ...sanitizedData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        } catch (error) {
            console.error('Dossier.create - Erreur:', error);
            throw error;
        }
    }

    static async findById(id) {
        const connection = getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM dossiers WHERE id = ?',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Dossier.findById - Erreur:', error);
            return null;
        }
    }

    static async findByNupcan(nupcan) {
        const connection = getConnection();
        console.log('Dossier.findByNupcan - NUPCAN:', nupcan);

        try {
            const [rows] = await connection.execute(
                `SELECT dos.*, d.nomdoc, d.type, d.nom_fichier, d.statut as document_statut
         FROM dossiers dos 
         LEFT JOIN documents d ON dos.document_id = d.id 
         WHERE dos.nipcan = ? 
         ORDER BY dos.created_at DESC`,
                [nupcan]
            );

            console.log('Dossiers trouvés:', rows.length);
            return rows;
        } catch (error) {
            console.error('Dossier.findByNupcan - Erreur:', error);
            return [];
        }
    }

    static async findAll() {
        const connection = getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT dos.*, d.nomdoc, d.type, d.nom_fichier, d.statut as document_statut
         FROM dossiers dos 
         LEFT JOIN documents d ON dos.document_id = d.id 
         ORDER BY dos.created_at DESC`
            );
            return rows;
        } catch (error) {
            console.error('Dossier.findAll - Erreur:', error);
            return [];
        }
    }

    static async deleteById(id) {
        const connection = getConnection();
        try {
            const [result] = await connection.execute(
                'DELETE FROM dossiers WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Dossier.deleteById - Erreur:', error);
            return false;
        }
    }
}

module.exports = Dossier;
const express = require('express');
const router = express.Router();
const path = require('path'); // Add this import
const Document = require('../models/Document');
const Dossier = require('../models/Dossier');

// GET /api/documents/nupcan/:nupcan - Récupérer les documents par NUPCAN
router.get('/nupcan/:nupcan', async (req, res) => {
    try {
        const {nupcan} = req.params;
        console.log('Recherche documents pour NUPCAN:', nupcan);

        if (!nupcan || nupcan === 'null' || nupcan === 'undefined') {
            return res.status(400).json({
                success: false,
                message: 'NUPCAN invalide'
            });
        }

        // Utiliser la classe Dossier pour récupérer les documents par NUPCAN
        const documents = await Dossier.findByNupcan(nupcan);

        res.json({
            success: true,
            data: documents || [],
            message: 'Documents récupérés avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des documents:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// POST /api/documents - Créer un nouveau document
router.post('/', async (req, res) => {
    try {
        const documentData = req.body;
        console.log('Création document:', documentData);

        if (!documentData.nupcan) {
            return res.status(400).json({
                success: false,
                message: 'NUPCAN requis pour créer un document'
            });
        }

        const document = await Document.create(documentData);

        res.status(201).json({
            success: true,
            data: document,
            message: 'Document créé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la création du document:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// PUT /api/documents/:id/status - Mettre à jour le statut d'un document
router.put('/:id/status', async (req, res) => {
    try {
        const {id} = req.params;
        const {status} = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Statut requis'
            });
        }

        const document = await Document.updateStatus(id, status);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document non trouvé'
            });
        }

        res.json({
            success: true,
            data: document,
            message: 'Statut du document mis à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur mise à jour statut document:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/documents/:id/download - Télécharger un document
router.get('/:id/download', async (req, res) => {
    try {
        const {id} = req.params;
        console.log('Téléchargement document ID:', id);

        const document = await Document.findById(id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document non trouvé'
            });
        }

        const filePath = path.join(__dirname, '..', 'uploads', 'documents', document.nom_fichier);
        const fs = require('fs');

        // Vérifier si le fichier existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Fichier non trouvé sur le serveur'
            });
        }

        // Définir le type MIME selon l'extension
        const ext = path.extname(document.nom_fichier).toLowerCase();
        let contentType = 'application/octet-stream';

        switch (ext) {
            case '.pdf':
                contentType = 'application/pdf';
                break;
            case '.jpg':
            case '.jpeg':
                contentType = 'image/jpeg';
                break;
            case '.png':
                contentType = 'image/png';
                break;
        }

        // Envoyer le fichier
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${document.nomdoc}"`);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Erreur téléchargement document:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors du téléchargement'
        });
    }
});

// GET /api/documents - Récupérer tous les documents
router.get('/', async (req, res) => {
    try {
        const documents = await Document.findAll();
        res.json({
            success: true,
            data: documents || [],
            message: 'Documents récupérés avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des documents:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

module.exports = router;

const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const Document = require('../models/Document');
const Dossier = require('../models/Dossier');
const Candidat = require('../models/Candidat');

// Configuration multer pour l'upload de documents
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/documents/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'documents-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error('Type de fichier non autorisé'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    }
});

// Middleware to handle multiple files
const uploadMultiple = upload.array('documents', 6); // Limit to 6 files

// GET /api/dossiers/nupcan/:nupcan - Récupérer documents par NUPCAN
router.get('/nupcan/:nupcan', async (req, res) => {
    try {
        const {nupcan} = req.params;
        const decodedNupcan = decodeURIComponent(nupcan);

        console.log('Recherche documents pour NUPCAN:', decodedNupcan);

        // Récupérer le candidat par NUPCAN
        const candidat = await Candidat.findByNupcan(decodedNupcan);
        if (!candidat) {
            return res.status(404).json({
                success: false,
                message: 'Candidat non trouvé'
            });
        }

        // Récupérer les dossiers du candidat
        const dossiers = await Dossier.findByNupcan(decodedNupcan);

        res.json({
            success: true,
            data: dossiers,
            message: 'Documents récupérés avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des documents:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/dossiers/admin/all - Récupérer tous les dossiers avec infos complètes pour l'admin
router.get('/admin/all', async (req, res) => {
    try {
        const connection = require('../config/database').getConnection();

        const [rows] = await connection.execute(`
      SELECT 
        d.id,
        d.nomdoc,
        d.type,
        d.nom_fichier,
        d.statut,
        d.created_at,
        d.updated_at,
        dos.nipcan as nupcan,
        dos.candidat_id,
        dos.concours_id,
        dos.docdsr,
        c.nomcan,
        c.prncan,
        c.maican,
        c.telcan,
        con.libcnc,
        con.fracnc,
        f.nomfil,
        e.nomets
      FROM documents d
      LEFT JOIN dossiers dos ON d.id = dos.document_id
      LEFT JOIN candidats c ON dos.candidat_id = c.id
      LEFT JOIN concours con ON dos.concours_id = con.id
      LEFT JOIN filieres f ON c.filiere_id = f.id
      LEFT JOIN etablissements e ON con.etablissement_id = e.id
      ORDER BY d.created_at DESC
    `);

        console.log(`Documents admin récupérés: ${rows.length}`);

        res.json({
            success: true,
            data: rows,
            message: 'Documents récupérés avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des documents admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/dossiers - Récupérer tous les dossiers
router.get('/', async (req, res) => {
    try {
        const dossiers = await Document.findAll();
        res.json({
            success: true,
            data: dossiers,
            message: 'Dossiers récupérés avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des dossiers:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/dossiers/:id - Récupérer un dossier par ID
router.get('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const dossier = await Document.findById(id);
        if (!dossier) {
            return res.status(404).json({
                success: false,
                message: 'Dossier non trouvé'
            });
        }
        res.json({
            success: true,
            data: dossier,
            message: 'Dossier récupéré avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du dossier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

router.post('/', (req, res) => {
    uploadMultiple(req, res, async (err) => {
        try {
            if (err) {
                console.error('Erreur d\'upload Multer:', err);
                return res.status(400).json({
                    success: false,
                    message: 'Erreur d\'upload',
                    errors: [err.message]
                });
            }

            console.log('Requête reçue:', req.body, 'Fichiers reçus:', req.files);

            const {concours_id, nupcan} = req.body;
            if (!concours_id || !nupcan) {
                return res.status(400).json({
                    success: false,
                    message: 'Champs requis manquants',
                    errors: ['concours_id et nupcan sont obligatoires']
                });
            }

            // Récupérer le candidat par nupcan
            const candidat = await Candidat.findByNupcan(nupcan);
            if (!candidat) {
                return res.status(404).json({
                    success: false,
                    message: 'Candidat non trouvé'
                });
            }
            const candidat_id = candidat.id;

            // Vérifier si des fichiers ont été uploadés
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Aucun fichier uploadé',
                    errors: ['Veuillez uploader au moins un document']
                });
            }

            // Process each uploaded file
            const dossierPromises = req.files.map(async (file) => {
                // Créer d'abord le document
                const documentData = {
                    nomdoc: file.originalname,
                    type: file.mimetype.includes('pdf') ? 'pdf' : 'image',
                    nom_fichier: file.filename,
                    statut: 'en_attente'
                };

                const document = await Document.create(documentData);

                // Puis créer le dossier qui lie le document au candidat
                const dossierData = {
                    candidat_id,
                    concours_id: parseInt(concours_id),
                    document_id: document.id,
                    nipcan: nupcan,
                    docdsr: file.path
                };

                return Dossier.create(dossierData);
            });

            const dossiers = await Promise.all(dossierPromises);

            res.status(201).json({
                success: true,
                data: dossiers,
                message: `${dossiers.length} dossier(s) créé(s) avec succès`
            });
        } catch (error) {
            console.error('Erreur lors de la création du dossier:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur serveur',
                errors: [error.message]
            });
        }
    });
});


// PUT /api/dossiers/:id - Mettre à jour un dossier
router.put('/:id', upload.single('docdsr'), async (req, res) => {
    try {
        const {id} = req.params;

        // Récupérer le dossier existant
        const existingDossier = await Document.findById(id);
        if (!existingDossier) {
            return res.status(404).json({
                success: false,
                message: 'Dossier non trouvé'
            });
        }

        // Préparer les données de mise à jour
        const dossierData = {
            concours_id: req.body.concours_id ? parseInt(req.body.concours_id) : existingDossier.concours_id,
            document_id: req.body.document_id ? parseInt(req.body.document_id) : existingDossier.document_id,
            candidat_id: req.body.candidat_id ? parseInt(req.body.candidat_id) : existingDossier.candidat_id,
            docdsr: req.file ? req.file.path : existingDossier.docdsr
        };

        // Mettre à jour le dossier
        const dossier = await Document.updateStatus(id, 'en_attente');

        console.log('Dossier mis à jour:', dossier);

        res.json({
            success: true,
            data: dossier,
            message: 'Dossier mis à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du dossier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// PUT /api/dossiers/:id/status - Mettre à jour le statut d'un document
router.put('/:id/status', async (req, res) => {
    try {
        const {id} = req.params;
        const {statut} = req.body;

        console.log(`Mise à jour du statut du document ${id} à ${statut}`);

        // Valider le statut
        if (!statut || !['en_attente', 'valide', 'rejete'].includes(statut)) {
            return res.status(400).json({
                success: false,
                message: 'Statut invalide',
                errors: ['Le statut doit être "en_attente", "valide" ou "rejete"']
            });
        }

        // Récupérer le dossier existant
        const existingDossier = await Document.findById(id);
        if (!existingDossier) {
            return res.status(404).json({
                success: false,
                message: 'Dossier non trouvé'
            });
        }

        // Récupérer le document associé
        const document = await Document.findById(existingDossier.id);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document non trouvé'
            });
        }

        // Mettre à jour le statut du document
        const documentData = {
            statut: statut
        };
        await Document.updateStatus(id, statut);

        console.log('Statut du document mis à jour:', documentData);

        res.json({
            success: true,
            message: 'Statut du document mis à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut du document:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// DELETE /api/dossiers/:id - Supprimer un dossier
router.delete('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const deleted = await Document.deleteById(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Dossier non trouvé'
            });
        }
        res.json({
            success: true,
            message: 'Dossier supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du dossier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

module.exports = router;

je
veux
modifier
un
document
qui
a
le
statut
rejete

aussi
on
doit
arranger
a
visualisation
des
documents, ca
n
'affiche rien ,
le
composant
actuel
pour
visualiser
est :
    import
React, {useState, useEffect}
from
'react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {X, Download, AlertTriangle, FileText} from 'lucide-react';

interface
Document
{
    id ? : string;
    nupcan ? : string; // Gardé pour compatibilité, mais non utilisé ici
    nipcan ? : string; // Ajouté pour correspondre à l'API
    nomdoc ? : string;
    type ? : string;
    chemin ? : string;
    nom_fichier ? : string;
    taille ? : number;
    statut ? : string;
    document_statut ? : string;
    created_at ? : string;
    file_name ? : string;
    original_name ? : string;
    docdsr ? : string; // Ajouté pour le chemin du fichier
}

interface
DocumentViewerProps
{
    isOpen: boolean;
    onClose: () => void;
    document: Document | null;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({isOpen, onClose, document}) => {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [pdfError, setPdfError] = useState(false);

    const getDocumentPath = ()
:
    string | null
=>
    {
        return document?.docdsr || document?.chemin || document?.nom_fichier || document?.file_name || null;
    }
    ;

    const getDocumentName = ()
:
    string => {
        return document?.nomdoc || document?.original_name || document?.file_name || document?.type || 'Document';
    };

    const documentPath = getDocumentPath();
    const documentName = getDocumentName();

    let documentUrl: string | null = null;
    if (document?.nipcan) {
        documentUrl = `http://localhost:3000/api/documents/nupcan/${document.nipcan}`;
    } else if (documentPath) {
        documentUrl = `http://localhost:3000/${documentPath.replace(/\\/g, '/')}`;
    }

    // useEffect(() => {
    //   if (documentUrl) {
    //     console.log('URL du document :', documentUrl);
    //   } else {
    //     console.warn('URL du document est null ou indéfinie');
    //   }
    // }, [documentUrl]);

    const isImage = documentPath && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(documentPath);
    const isPDF = documentPath && /\.pdf$/i.test(documentPath);

    const handleDownload = () => {
        if (!documentUrl) {
            console.error('Aucune URL de document disponible pour le téléchargement');
            return;
        }

        const link = window.document.createElement('a');
        link.href = documentUrl;
        link.download = documentName;
        link.target = '_blank';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
    };

    const handleImageLoad = () => {
        setIsLoading(false);
        setImageError(false);
    };

    const handleImageError = () => {
        setIsLoading(false);
        setImageError(true);
        console.error('Erreur de chargement de l\'image pour URL :', documentUrl);
    };

    const handlePdfLoad = () => {
        setIsLoading(false);
        setPdfError(false);
    };

    const handlePdfError = () => {
        setIsLoading(false);
        setPdfError(true);
        console.error('Erreur de chargement du PDF pour URL :', documentUrl);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span className="truncate mr-4">{document ? documentName : 'Aucun document'}</span>
                        <div className="flex items-center space-x-2">
                            {documentUrl && (
                                <Button onClick={handleDownload} size="sm" variant="outline">
                                    <Download className="h-4 w-4 mr-2"/>
                                    Télécharger
                                </Button>
                            )}
                            <Button onClick={onClose} size="sm" variant="ghost">
                                <X className="h-4 w-4"/>
                            </Button>
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        {document?.type && `Type : ${document.type}`}
                        {document?.taille && ` • Taille : ${(document.taille / 1024).toFixed(1)} KB`}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto">
                    {!document ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4"/>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Aucun document sélectionné
                            </h3>
                            <p className="text-sm text-gray-600">
                                Veuillez sélectionner un document à afficher.
                            </p>
                        </div>
                    ) : !documentUrl ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4"/>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Document non accessible
                            </h3>
                            <p className="text-sm text-gray-600">
                                Le fichier de ce document n'est pas disponible ou le chemin est incorrect.
                            </p>
                        </div>
                    ) : isImage ? (
                        <div className="flex justify-center items-center min-h-[400px]">
                            {isLoading && (
                                <div className="flex flex-col items-center">
                                    <div
                                        className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                    <p className="text-sm text-gray-600">Chargement de l'image...</p>
                                </div>
                            )}
                            {imageError ? (
                                <div className="flex flex-col items-center text-center">
                                    <AlertTriangle className="h-12 w-12 text-red-500 mb-4"/>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Impossible de charger l'image
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Le fichier image ne peut pas être affiché.
                                    </p>
                                </div>
                            ) : (
                                <img
                                    src={documentUrl}
                                    alt={documentName}
                                    className="max-w-full max-h-full object-contain"
                                    onLoad={handleImageLoad}
                                    onError={handleImageError}
                                    style={{display: isLoading ? 'none' : 'block'}}
                                />
                            )}
                        </div>
                    ) : isPDF ? (
                        <div className="w-full h-[600px] relative">
                            {isLoading && (
                                <div
                                    className="absolute inset-0 flex justify-center items-center bg-gray-100 bg-opacity-75 z-10">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                        <p className="text-sm text-gray-600">Chargement du PDF...</p>
                                    </div>
                                </div>
                            )}
                            {pdfError ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <AlertTriangle className="h-12 w-12 text-red-500 mb-4"/>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Impossible de charger le PDF
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Le fichier PDF ne peut pas être affiché. Vérifiez le chemin ou téléchargez-le.
                                    </p>
                                    <Button onClick={handleDownload} variant="outline" className="mt-4">
                                        <Download className="h-4 w-4 mr-2"/>
                                        Télécharger
                                    </Button>
                                </div>
                            ) : (
                                <iframe
                                    src={`${documentUrl}#toolbar=0&view=FitH`}
                                    className="w-full h-full border-0"
                                    title={documentName}
                                    onLoad={handlePdfLoad}
                                    onError={handlePdfError}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <FileText className="h-12 w-12 text-blue-500 mb-4"/>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Aperçu non disponible
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Ce type de fichier ne peut pas être prévisualisé directement.
                            </p>
                            <Button onClick={handleDownload} variant="outline">
                                <Download className="h-4 w-4 mr-2"/>
                                Télécharger pour voir le contenu
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DocumentViewer;
```