import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Toaster} from '@/components/ui/toaster';
import {AdminAuthProvider, useAdminAuth} from '@/contexts/AdminAuthContext';
import {LanguageProvider} from '@/contexts/LanguageContext';

// Pages publiques
import Index from '@/pages/NewIndex';
import Concours from '@/pages/Concours';
import Candidature from '@/pages/Candidature';
import ChoixFiliere from '@/pages/ChoixFiliere';
import Confirmation from '@/pages/Confirmation';
import Documents from '@/pages/Documents';
import DocumentPage from '@/pages/DocumentPage';
import DocumentsContinue from '@/pages/DocumentsContinue';
import Paiement from '@/pages/Paiement';
import PaiementContinue from '@/pages/PaiementContinue';
import Succes from '@/pages/Succes';
import SuccesContinue from '@/pages/SuccesContinue';
import Connexion from '@/pages/Connexion';
import NotFound from '@/pages/NotFound';
import StatutCandidature from '@/pages/StatutCandidature';
import DashboardCandidat from '@/pages/DashboardCandidat';
import RecapPaiement from '@/pages/RecapPaiement';
import ConcoursDetails from "@/pages/ConcoursDetails";
import AdminProfile from "@/components/admin/AdminProfile";
import GradeManagement from "@/pages/admin/GradeManagement";
import MessagerieAdmin from "@/components/admin/MessagerieAdmin";
// Pages admin
import AdminLayout from '@/components/admin/AdminLayout';
import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';
import AdminLogin from '@/pages/admin/Login';
import AdminDashboard from '@/pages/admin/DashboardAdmin';
import AdminConcours from '@/pages/admin/Concours';
import AdminCandidats from '@/pages/admin/Candidats';
import AdminEtablissements from '@/pages/admin/Etablissements';
import AdminDossiers from '@/pages/admin/Dossiers';
import AdminPaiements from '@/pages/admin/Paiements';
import CandidateManagement from '@/pages/admin/CandidateManagement';
import GestionNiveaux from '@/pages/admin/GestionNiveaux';
import GestionFilieres from '@/pages/admin/GestionFilieres';
import GestionEtablissements from '@/pages/admin/GestionEtablissements';
import GestionAdmins from '@/pages/admin/GestionAdmins';
import Support from './components/Support';
import CandidatDashboard from '@/pages/CandidatDashboard';
import CandidatDetail from '@/pages/admin/CandidatDetail';
import ConcoursBasedDashboard from "@/components/admin/ConcoursBasedDashboard.tsx";
import Dashboard from './pages/admin/Dashboard';
import GradesView from "@/pages/candidate/GradesView.tsx";
import GradesBulletinPDF from "@/components/candidat/GradesBulletinPDF.tsx";
import SubAdminsManager from "@/components/admin/SubAdminsManager.tsx";
import AdminProfileSettings from "@/components/admin/AdminProfileSettings.tsx";
import {Admin} from "@/types/admin.ts";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

// Composant pour les routes protégées super-admin
const SuperAdminRoute = ({children}: { children: React.ReactNode }) => {
    const {admin} = useAdminAuth();

    if (!admin || admin.role !== 'super_admin') {
        return <Navigate to="/admin/dashboard" replace/>;
    }

    return <>{children}</>;
};

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <AdminAuthProvider>
                    <Router>
                    <Routes>
                        {/* Routes publiques */}
                        <Route path="/" element={<Index/>}/>

                        <Route path="/support" element={<Support/>}/>
                        <Route path="/concours" element={<Concours/>}/>
                        <Route path="/concours/:concoursId" element={<ConcoursDetails/>}/>

                        {/* Routes pour nouvelles candidatures avec filières */}
                        <Route path="/candidature/:concoursId" element={<ChoixFiliere/>}/>
                        <Route path="/candidature/:concoursId/filiere/:filiereId" element={<Candidature/>}/>

                        <Route path="/confirmation/:numeroCandidature" element={<Confirmation/>}/>
                        <Route path="/documents/:numeroCandidature" element={<Documents/>}/>
                        <Route path="/paiement/:numeroCandidature" element={<Paiement/>}/>
                        <Route path="/succes/:numeroCandidature" element={<Succes/>}/>

                        {/* Routes pour continuer candidatures existantes */}
                        <Route path="/documents/continue/:nupcan" element={<DocumentsContinue/>}/>
                        <Route path="/documentPage/:nupcan" element={<DocumentPage/>}/>
                        <Route path="/paiement/continue/:nupcan" element={<PaiementContinue/>}/>
                        <Route path="/succes-continue/:nupcan" element={<SuccesContinue/>}/>

                        {/* Routes pour statut et connexion */}
                        <Route path="/statut/:nupcan" element={<StatutCandidature/>}/>
                        <Route path="/dashboard/:nupcan" element={<DashboardCandidat/>}/>
                        <Route path="/candidat/dashboard" element={<CandidatDashboard/>}/>
                        <Route path="/recap/:nupcan" element={<RecapPaiement/>}/>
                        <Route path="/connexion" element={<Connexion/>}/>


                        {/* Routes admin */}
                        <Route path="/admin/login" element={<AdminLogin/>}/>
                        <Route
                            path="/admin"
                            element={
                                <AdminProtectedRoute>
                                    <AdminLayout/>


                                </AdminProtectedRoute>
                            }
                        >

                            <Route index element={<Navigate to="/admin/dashboard" replace/>}/>

                            <Route path="dashboard" element={<Dashboard/>}/>

                            <Route path="concours" element={<ConcoursBasedDashboard/>}/>
                            <Route path="concour" element={<AdminConcours/>}/>
                            <Route path="candidats" element={<AdminCandidats/>}/>
                            <Route path="candidats/:nupcan" element={<CandidateManagement/>}/>
                            <Route path="etablissements" element={<AdminEtablissements/>}/>
                            <Route path="dossiers" element={<AdminDossiers/>}/>
                            <Route path="paiements" element={<AdminPaiements/>}/>
                            <Route path="niveaux" element={<GestionNiveaux/>}/>
                            <Route path="filieres" element={<GestionFilieres/>}/>
                            <Route path="notes" element={<GradeManagement/>}/>
                            <Route path="messagerie" element={<MessagerieAdmin/>}/>
<Route path="sub-admins" element={<SubAdminsManager/>}/>
                            <Route path="profile" element={<AdminProfileSettings />} />




                            {/* Routes réservées au super-admin */}
                            <Route path="gestion-admins" element={
                                <SuperAdminRoute>
                                    <GestionAdmins/>
                                </SuperAdminRoute>
                            }/>

                            <Route path="gestion-etablissements" element={
                                <SuperAdminRoute>
                                    <GestionEtablissements/>
                                </SuperAdminRoute>
                            }/>
                        </Route>

                        <Route path="*" element={<NotFound/>}/>
                    </Routes>
                        <Toaster/>
                    </Router>
                </AdminAuthProvider>
            </LanguageProvider>
        </QueryClientProvider>
    );
}

export default App;
