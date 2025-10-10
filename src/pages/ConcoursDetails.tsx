// @ts-nocheck

import React, {useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Label} from '@/components/ui/label';
import {Separator} from '@/components/ui/separator';
import {ArrowLeft, Users, BookOpen, GraduationCap, Calendar, MapPin, Clock, DollarSign} from 'lucide-react';
import Layout from '@/components/Layout';
import {apiService} from '@/services/api';
import {ConcoursFiliere} from '@/types/entities';

const ConcoursDetails = () => {
    const {concoursId} = useParams<{ concoursId: string }>();
    const navigate = useNavigate();
    const [selectedFiliere, setSelectedFiliere] = useState<string>('');

    const {data: concoursData, isLoading} = useQuery({
        queryKey: ['concours', concoursId],
        queryFn: () => apiService.getConcoursById(concoursId!),
        enabled: !!concoursId,
    });

    const {data: filieresData, isLoading: isLoadingFilieres} = useQuery({
        queryKey: ['concours-filieres', concoursId],
        queryFn: () => apiService.getConcoursFiliere(concoursId!),
        enabled: !!concoursId,
    });

    const {data: matieresData} = useQuery({
        queryKey: ['filiere-matieres', selectedFiliere],
        queryFn: () => apiService.getFiliereWithMatieres(selectedFiliere!),
        enabled: !!selectedFiliere,
    });

    const concours = concoursData?.data;
    const filieres = filieresData?.data || [];
    const matieres = matieresData?.data?.matieres || [];

    const handleContinue = () => {
        if (selectedFiliere && concoursId) {
            navigate(`/candidature/${concoursId}/filiere/${selectedFiliere}`);
        }
    };

    const handleBack = () => {
        navigate('/concours');
    };

    if (isLoading || isLoadingFilieres) {
        return (
            <Layout>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <div
                            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Chargement des détails du concours...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!concours) {
        return (
            <Layout>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Concours introuvable</h1>
                        <Button onClick={handleBack}>Retour aux concours</Button>
                    </div>
                </div>
            </Layout>
        );
    }

    const montant = parseFloat(concours.fracnc);
    const isGratuit = montant === 0;

    return (
        <Layout>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        className="mb-6"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2"/>
                        Retour aux concours
                    </Button>
                </div>

                {/* En-tête du concours */}
                <Card className="mb-8">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                                    {concours.libcnc}
                                </CardTitle>
                                <div className="flex flex-wrap items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <GraduationCap className="h-4 w-4 mr-1"/>
                      {concours.etablissement_nomets}
                  </span>
                                    <span className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-1"/>
                                        {concours.niveau_nomniv}
                  </span>
                                    <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1"/>
                    Session {concours.sescnc}
                  </span>
                                </div>
                            </div>
                            <div className="mt-4 lg:mt-0 text-right">
                                <div className="text-2xl font-bold text-primary mb-1">
                                    {isGratuit ? 'GRATUIT' : `${montant.toLocaleString()} FCFA`}
                                </div>
                                <Badge variant={isGratuit ? "secondary" : "default"} className="text-xs">
                                    {isGratuit ? 'Programme NGORI' : 'Frais d\'inscription'}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center space-x-3">
                                <Clock className="h-5 w-5 text-primary"/>
                                <div>
                                    <p className="text-sm text-muted-foreground">Date limite</p>
                                    <p className="font-semibold">
                                        {new Date(concours.fincnc).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Users className="h-5 w-5 text-primary"/>
                                <div>
                                    <p className="text-sm text-muted-foreground">Âge limite</p>
                                    <p className="font-semibold">{concours.agecnc} ans</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <MapPin className="h-5 w-5 text-primary"/>
                                <div>
                                    <p className="text-sm text-muted-foreground">Lieu</p>
                                    <p className="font-semibold">{concours.etablissement_nomets}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Section Filières */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <BookOpen className="h-5 w-5 mr-2"/>
                                Filières disponibles ({filieres.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {filieres.length > 0 ? (
                                <RadioGroup
                                    value={selectedFiliere}
                                    onValueChange={setSelectedFiliere}
                                    className="space-y-4"
                                >
                                    {filieres.map((filiere: ConcoursFiliere) => (
                                        <div key={filiere.id}
                                             className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <RadioGroupItem
                                                value={filiere.filiere_id.toString()}
                                                id={`filiere-${filiere.id}`}
                                                className="mt-1"
                                            />
                                            <Label
                                                htmlFor={`filiere-${filiere.id}`}
                                                className="flex-1 cursor-pointer"
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-semibold text-lg">{filiere.nomfil}</h3>
                                                        <Badge variant="outline" className="flex items-center ml-2">
                                                            <Users className="h-3 w-3 mr-1"/>
                                                            {filiere.places_disponibles} places
                                                        </Badge>
                                                    </div>
                                                    {filiere.description && (
                                                        <p className="text-muted-foreground text-sm">{filiere.description}</p>
                                                    )}
                                                </div>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            ) : (
                                <div className="text-center py-8">
                                    <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
                                    <h3 className="text-lg font-semibold mb-2">Aucune filière disponible</h3>
                                    <p className="text-muted-foreground">
                                        Ce concours n'a pas encore de filières configurées.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Section Matières */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <GraduationCap className="h-5 w-5 mr-2"/>
                                Matières à étudier
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedFiliere ? (
                                matieres.length > 0 ? (
                                    <div className="space-y-3">
                                        {matieres.map((matiere: any, index: number) => (
                                            <div key={index}
                                                 className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <div
                                                        className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                        <span
                                                            className="text-primary font-semibold text-sm">{index + 1}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium">{matiere.nom_matiere}</h4>
                                                        {matiere.coefficient && (
                                                            <p className="text-sm text-muted-foreground">
                                                                Coefficient: {matiere.coefficient}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {matiere.duree && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {matiere.duree}h
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
                                        <p className="text-muted-foreground">
                                            Aucune matière définie pour cette filière
                                        </p>
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-8">
                                    <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
                                    <p className="text-muted-foreground">
                                        Sélectionnez une filière pour voir les matières
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Bouton de continuation */}
                <div className="text-center mt-8">
                    <Separator className="mb-6"/>
                    <Button
                        onClick={handleContinue}
                        disabled={!selectedFiliere}
                        size="lg"
                        className="bg-primary hover:bg-primary/90 px-8"
                    >
                        Continuer l'inscription
                    </Button>
                    {!selectedFiliere && (
                        <p className="text-sm text-muted-foreground mt-2">
                            Veuillez sélectionner une filière pour continuer
                        </p>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default ConcoursDetails;
