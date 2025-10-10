import React from 'react';
import {useQuery} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Calendar, MapPin, GraduationCap, Clock, Users, DollarSign} from 'lucide-react';
import Layout from '@/components/Layout';
import {apiService} from '@/services/api';
import {Concours as ConcoursType} from '@/types/entities';

const Concours = () => {
    const navigate = useNavigate();

    const {data: concoursResponse, isLoading, error} = useQuery({
        queryKey: ['concours'],
        queryFn: () => apiService.getConcours(),
    });

    const concours = concoursResponse?.data || [];

    const getStatusBadge = (stacnc: string) => {
        switch (stacnc) {
            case '1':
                return <Badge className="bg-green-500">Ouvert</Badge>;
            case '2':
                return <Badge className="bg-orange-500">Fermé</Badge>;
            case '3':
                return <Badge className="bg-red-500">Terminé</Badge>;
            default:
                return <Badge variant="secondary">Inconnu</Badge>;
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('fr-FR');
        } catch {
            return dateString;
        }
    };

    const handlePostuler = (concoursId: number) => {
        navigate(`/candidature/${concoursId}`);
    };
    const voirPlus = (concoursId: number) => {
        navigate(`/concours/${concoursId}`);
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="text-center">
                        <div
                            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Chargement des concours...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-red-500">Erreur lors du chargement des concours</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        Concours Disponibles
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Découvrez les concours publics ouverts et postulez en quelques étapes simples
                    </p>
                </div>

                {concours.length === 0 ? (
                    <div className="text-center py-12">
                        <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
                        <h3 className="text-xl font-semibold mb-2">Aucun concours disponible</h3>
                        <p className="text-muted-foreground">
                            Aucun concours n'est actuellement ouvert. Revenez bientôt !
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {concours.map((concour: ConcoursType) => (
                            <Card key={concour.id} className="hover:shadow-lg transition-shadow duration-200">
                                <CardHeader>
                                    <div className="flex justify-between items-start mb-2">
                                        <CardTitle className="text-lg font-bold line-clamp-2">
                                            {concour.libcnc}
                                        </CardTitle>
                                        {getStatusBadge(concour.stacnc)}
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4"/>
                                        <span>{concour.etablissement_nomets}</span>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="h-4 w-4 text-primary"/>
                                            <div>
                                                <p className="font-medium">Session</p>
                                                <p className="text-muted-foreground">{concour.sescnc}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <GraduationCap className="h-4 w-4 text-primary"/>
                                            <div>
                                                <p className="font-medium">Niveau</p>
                                                <p className="text-muted-foreground">{concour.niveau_nomniv}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Clock className="h-4 w-4 text-primary"/>
                                            <div>
                                                <p className="font-medium">Début</p>
                                                <p className="text-muted-foreground">{formatDate(concour.debcnc)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Clock className="h-4 w-4 text-primary"/>
                                            <div>
                                                <p className="font-medium">Fin</p>
                                                <p className="text-muted-foreground">{formatDate(concour.fincnc)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Users className="h-4 w-4 text-primary"/>
                                            <div>
                                                <p className="font-medium">Âge limite</p>
                                                <p className="text-muted-foreground">{concour.agecnc} ans</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <DollarSign className="h-4 w-4 text-primary"/>
                                            <div>
                                                <p className="font-medium">Frais</p>
                                                <p className="text-muted-foreground">{parseInt(concour.fracnc).toLocaleString()} FCFA</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">

                                        <div className="pt-4 border-t">
                                            <Button
                                                onClick={() => handlePostuler(concour.id)}
                                                className="w-full bg-primary hover:bg-primary/90"
                                                disabled={concour.stacnc !== '1'}
                                            >
                                                {concour.stacnc === '1' ? 'Postuler à ce concours' : 'Concours fermé'}
                                            </Button>
                                        </div>
                                        <div className="pt-4 border-t">
                                            <Button
                                                onClick={() => voirPlus(concour.id)}
                                                className="w-full bg-primary hover:bg-primary/90"
                                                disabled={concour.stacnc !== '1'}
                                            >
                                                {concour.stacnc === '1' ? 'Voir les details' : 'Concours fermé'}
                                            </Button>
                                        </div>


                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Concours;
