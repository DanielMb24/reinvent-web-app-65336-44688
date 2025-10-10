import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    FileText,
    TrendingUp,
    CheckCircle,
    Clock,
    Download,
    MessageSquare,
    GraduationCap,
    Trophy,
    AlertCircle,
    BookOpen
} from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import CandidatesList from '@/components/admin/CandidatesList';
import DocumentValidation from '@/components/admin/DocumentValidation';
import GradeManagement from '@/components/admin/GradeManagement';
import MessagerieAdmin from '@/components/admin/MessagerieAdmin';
import { exportService } from '@/services/exportService';
import {adminCandidatureService} from "@/services/adminCandidatureService.ts";
import {useAdminAuth} from "@/contexts/AdminAuthContext.tsx";
import {adminConcoursService} from "@/services/adminConcoursService.ts";
import {Message} from "postcss";
interface ConcoursData {
    id: number;
    libcnc: string;
    fracnc: number;
    sescnc: string;
    etablissement_id: number;
    candidats_count: number;
    documents_en_attente: number;
    paiements_valides: number;
}

// Composant wrapper pour DocumentValidation
const DocumentValidationTab: React.FC = () => {
    const { data: documents, isLoading, refetch } = useQuery({
        queryKey: ['admin-documents'],
        queryFn: async () => {
            const response = await apiService.getAdminDossiers<any[]>();
            return response.data || [];
        },
        refetchInterval: 30000,
    });

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4">Chargement des documents...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return <DocumentValidation documents={documents || []} onRefresh={refetch} />;
};

interface DashboardStats {
    candidats: {
        total: number;
        complets: number;
        en_attente: number;
        validation_admin: number;
    };
    documents: {
        total: number;
        en_attente: number;
        valides: number;
        rejetes: number;
    };
    paiements: {
        total: number;
        valides: number;
        en_attente: number;
        montant_total: number;
    };
    messages: {
        total: number;
        non_lus: number;
    };
}


const DashboardAdmin: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'candidats' | 'documents' | 'notes' | 'messages'>('overview');
    const [selectedConcours] = useState<number | null>(null);
    const {admin, token, isLoading} = useAdminAuth();
   
    const [setSelectedConcours] = useState<ConcoursData | null>(null);

    const { data: messages } = useQuery<Message[]>({
        queryKey: ['admin-messages'],
        queryFn: async () => {
            const response = await apiService.makeRequest<Message[]>('/messages/admin', 'GET');
            return response.data || [];
        },
        refetchInterval: 10000,
    });
    const defaultStats: DashboardStats = {
        candidats: { total: 0, complets: 0, en_attente: 0, validation_admin: 0 },
        documents: { total: 0, en_attente: 0, valides: 0, rejetes: 0 },
        paiements: { total: 0, valides: 0, en_attente: 0, montant_total: 0 },
        messages: { total: 0, non_lus: 0 },
    };



    const unreadCount = messages?.filter((m) => m.statut === 'non_lu' && m.expediteur === 'candidat').length || 0;

    // ✅ Placer le useQuery ICI, à l’intérieur du composant
    const { data: stats = defaultStats, isLoading: statsLoading } = useQuery<DashboardStats>({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const response = await apiService.getStatistics<DashboardStats>();
            return response.data || defaultStats;
        },
        refetchInterval: 30000,
    });


    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    const etablissementId = adminData.etablissement_id || 1;



    const {data: concoursData, isLoading: isLoadingConcours} = useQuery({
        queryKey: ['concours', admin?.etablissement_id],
        queryFn: () => adminConcoursService.getConcoursByEtablissement(admin?.etablissement_id ??0),
        enabled: !!admin?.etablissement_id && !!token,
        retry: 2,
    });





    const handleExportCandidatesExcel = async () => {
        try {
            await exportService.exportCandidatesExcel(selectedConcours || undefined);
            toast({
                title: 'Export réussi',
                description: 'La liste des candidats a été exportée en Excel',
            });
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Impossible d\'exporter les candidats',
                variant: 'destructive',
            });
        }
    };

    const handleExportCandidatesPDF = async () => {
        try {
            await exportService.exportCandidatesPDF(selectedConcours || undefined);
            toast({
                title: 'Export réussi',
                description: 'La liste des candidats a été exportée en PDF',
            });
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Impossible d\'exporter les candidats',
                variant: 'destructive',
            });
        }
    };

    const handleExportGradesExcel = async () => {
        try {
            await exportService.exportGradesExcel(selectedConcours || undefined);
            toast({
                title: 'Export réussi',
                description: 'Les notes ont été exportées en Excel',
            });
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Impossible d\'exporter les notes',
                variant: 'destructive',
            });
        }
    };

    if (statsLoading) {
        return (
            <AdminLayout>
                <div className="p-8 text-center">Chargement des statistiques...</div>
            </AdminLayout>
        );
    }


    const handleViewConcours = (concours: ConcoursData) => {
        setSelectedConcours(concours);
    };

    return (

            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Tableau de Bord Administration</h1>
                    <p className="text-muted-foreground">Gestion par concours
                        - {adminData.etablissement_nom || 'École Normale Supérieure'}</p>

                </div>

                <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                        <TabsTrigger value="candidats">Candidats</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                        <TabsTrigger value="notes">Notes</TabsTrigger>
                        <TabsTrigger value="messages">Messages</TabsTrigger>

                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Statistiques globales */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Candidats</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold"> Total : {stats?.candidats?.total ?? 0}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {stats?.candidats?.complets?? 0} dossiers complets
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Documents</CardTitle>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats?.documents?.en_attente??0}</div>
                                    <p className="text-xs text-muted-foreground">En attente de validation</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Paiements</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {stats?.paiements?.montant_total?.toLocaleString()?? 0} FCFA
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {stats?.paiements?.valides ?? 0} validés
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Messages</CardTitle>
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <Badge variant="destructive">{unreadCount} non lu(s)</Badge>

                                </CardContent>
                            </Card>
                        </div>

                        {/* Concours actifs */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Trophy className="h-5 w-5" />
                                        Concours Actifs
                                    </CardTitle>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleExportCandidatesExcel}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Export Excel
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleExportCandidatesPDF}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Export PDF
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {concoursData && concoursData.length > 0 ? (
                                        concoursData.map((concours: any) => (
                                            <Card
                                                key={concours.id}
                                                className="cursor-pointer hover:border-primary transition-colors"
                                                onClick={() => handleViewConcours(concours)}
                                            >
                                                <CardHeader>
                                                    <CardTitle className="text-lg">{concours.libcnc}</CardTitle>
                                                    <p className="text-sm text-muted-foreground">
                                                        Session: {concours.sescnc}
                                                    </p>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span>Date limite:</span>
                                                            <Badge variant="outline">
                                                                {new Date(concours.dlican).toLocaleDateString('fr-FR')}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span>Frais:</span>
                                                            <span className="font-semibold">
                                                                {concours.fracnc?.toLocaleString()} FCFA
                                                            </span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="col-span-3 text-center py-12 text-muted-foreground">
                                            <Trophy className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                            <p>Aucun concours actif</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions rapides */}
                        {/*<div className="grid grid-cols-1 md:grid-cols-3 gap-6">*/}
                        {/*    <Card className="cursor-pointer hover:border-primary transition-colors"*/}
                        {/*          onClick={() => setActiveTab('documents')}>*/}
                        {/*        <CardHeader>*/}
                        {/*            <CardTitle className="flex items-center gap-2">*/}
                        {/*                <AlertCircle className="h-5 w-5 text-orange-600" />*/}
                        {/*                Documents en attente*/}
                        {/*            </CardTitle>*/}
                        {/*        </CardHeader>*/}
                        {/*        <CardContent>*/}
                        {/*            <div className="text-3xl font-bold">{stats?.documents?.en_attente ?? 0}</div>*/}
                        {/*            <p className="text-sm text-muted-foreground mt-2">*/}
                        {/*                Nécessitent une validation*/}
                        {/*            </p>*/}
                        {/*        </CardContent>*/}
                        {/*    </Card>*/}

                        {/*    <Card className="cursor-pointer hover:border-primary transition-colors"*/}
                        {/*          onClick={() => setActiveTab('messages')}>*/}
                        {/*        <CardHeader>*/}
                        {/*            <CardTitle className="flex items-center gap-2">*/}
                        {/*                <MessageSquare className="h-5 w-5 text-blue-600" />*/}
                        {/*                Messages non lus*/}
                        {/*            </CardTitle>*/}
                        {/*        </CardHeader>*/}
                        {/*        <CardContent>*/}
                        {/*            <div className="text-3xl font-bold">{stats?.messages?.non_lus ?? 0}</div>*/}
                        {/*            <p className="text-sm text-muted-foreground mt-2">*/}
                        {/*                Des candidats nécessitent une réponse*/}
                        {/*            </p>*/}
                        {/*        </CardContent>*/}
                        {/*    </Card>*/}

                        {/*    <Card className="cursor-pointer hover:border-primary transition-colors"*/}
                        {/*          onClick={() => setActiveTab('notes')}>*/}
                        {/*        <CardHeader>*/}
                        {/*            <CardTitle className="flex items-center gap-2">*/}
                        {/*                <BookOpen className="h-5 w-5 text-green-600" />*/}
                        {/*                Gestion des notes*/}
                        {/*            </CardTitle>*/}
                        {/*        </CardHeader>*/}
                        {/*        <CardContent>*/}
                        {/*            <div className="text-3xl font-bold">*/}
                        {/*                {stats?.candidats?.complets ?? 0}*/}
                        {/*            </div>*/}
                        {/*            <p className="text-sm text-muted-foreground mt-2">*/}
                        {/*                Candidats éligibles*/}
                        {/*            </p>*/}
                        {/*        </CardContent>*/}
                        {/*    </Card>*/}
                        {/*</div>*/}


                    </TabsContent>

                    <TabsContent value="candidats">
                        <CandidatesList concoursFilter={selectedConcours} />
                    </TabsContent>

                    <TabsContent value="documents">
                        <DocumentValidationTab />
                    </TabsContent>

                    <TabsContent value="notes">
                        <GradeManagement concoursFilter={selectedConcours} />
                    </TabsContent>

                    <TabsContent value="messages">
                        <MessagerieAdmin />
                    </TabsContent>
                </Tabs>
            </div>

    );
};

export default DashboardAdmin;
