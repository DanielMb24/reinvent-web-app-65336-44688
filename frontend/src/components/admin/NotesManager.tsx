import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { BookOpen, Send, Calculator } from 'lucide-react';
import { apiService } from '@/services/api';
import {useQuery} from "@tanstack/react-query";
import {candidatureService} from "@/services/candidatureService.ts";
import {useParams} from "react-router-dom";

interface NotesManagerProps {
    candidatId: number;
    candidatNom: string;
    candidatPrenom: string;
    concoursId: number;
}

interface Note {
    id: number;
    matiere_id: number;
    nom_matiere: string;
    note: number;
    coefficient: number;
}

interface Matiere {
    id: number;
    nom_matiere: string;
    coefficient: number;
}

const NotesManager: React.FC<NotesManagerProps> = ({
    candidatId,
    candidatNom,
    candidatPrenom,
    concoursId
}) => {
    const { nupcan } = useParams<{ nupcan: string }>();
    const [notes, setNotes] = useState<Note[]>([]);
    const [matieres, setMatieres] = useState<Matiere[]>([]);
    const [moyenne, setMoyenne] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchData();
    }, [candidatId, concoursId]);




    const { data: candidatureData } = useQuery({
        queryKey: ['candidature-complete', nupcan],
        queryFn: () => candidatureService.getCandidatureByNupcan(nupcan!),
        enabled: !!nupcan,
        refetchInterval: 10000,
    });



    const fetchData = async () => {
        try {

            if(!candidatureData)return;
            const { filiere}= candidatureData
            setLoading(true);

            // Récupérer le candidat pour obtenir sa filière
            const candidatResponse = await apiService.makeRequest(`/candidats/${candidatId}`, 'GET');
            const filiereId = candidatureData.filiere?.filiere_id;

            // Récupérer les matières de la filière du candidat
            let matieresResponse;
            if (filiereId) {
                matieresResponse = await apiService.makeRequest(`/filieres/${filiereId}`, 'GET');
                if (matieresResponse.success && matieresResponse.data?.matieres) {
                    setMatieres(matieresResponse.data.matieres);
                } else {
                    setMatieres([]);
                }
            } else {
                // Si pas de filière, récupérer toutes les matières
                matieresResponse = await apiService.makeRequest('/matieres', 'GET');
                if (matieresResponse.success && Array.isArray(matieresResponse.data)) {
                    setMatieres(matieresResponse.data);
                } else {
                    setMatieres([]);
                }
            }

            // Récupérer les notes existantes
            const notesResponse = await apiService.makeRequest(
                `/notes/candidat/${candidatId}/concours/${concoursId}`,
                'GET'
            );

            if (notesResponse.success && notesResponse.data) {
                const data = notesResponse.data as any;
                setNotes(Array.isArray(data.notes) ? data.notes : []);
                setMoyenne(data.moyenne || null);
            }
        } catch (error) {
            console.error('Erreur chargement données:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible de charger les données',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };
    const {  filiere } = candidatureData;
    const handleNoteChange = (matiere_id: number, value: string) => {
        const noteValue = parseFloat(value);

        if (value === '' || (noteValue >= 0 && noteValue <= 20)) {
            const existingNoteIndex = notes.findIndex(n => n.matiere_id === matiere_id);
            const matiere = matieres.find(m => m.id === matiere_id);

            if (existingNoteIndex >= 0) {
                const newNotes = [...notes];
                newNotes[existingNoteIndex] = {
                    ...newNotes[existingNoteIndex],
                    note: noteValue
                };
                setNotes(newNotes);
            } else if (matiere) {
                setNotes([...notes, {
                    id: 0,
                    matiere_id,
                    nom_matiere: matiere.nom_matiere,
                    note: noteValue,
                    coefficient: matiere.coefficient
                }]);
            }
        }
    };

    const saveNote = async (matiere_id: number) => {
        try {
            setSaving(true);

            const note = notes.find(n => n.matiere_id === matiere_id);
            if (!note || note.note === undefined) {
                return;
            }

            const response = await apiService.makeRequest('/notes', 'POST', {
                candidat_id: candidatId,
                concours_id: concoursId,
                matiere_id,
                note: note.note,
                coefficient: note.coefficient
            });

            if (response.success) {
                toast({
                    title: 'Succès',
                    description: 'Note enregistrée avec succès'
                });

                // Rafraîchir les données
                await fetchData();
            } else {
                toast({
                    title: 'Erreur',
                    description: response.message || 'Erreur lors de l\'enregistrement',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error('Erreur enregistrement note:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible d\'enregistrer la note',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

    const sendResults = async () => {
        try {
            setSending(true);

            const response = await apiService.makeRequest('/notes/envoyer-resultats', 'POST', {
                candidat_id: candidatId,
                concours_id: concoursId
            });

            if (response.success) {
                toast({
                    title: 'Succès',
                    description: 'Résultats envoyés par email au candidat'
                });
            } else {
                toast({
                    title: 'Erreur',
                    description: response.message || 'Erreur lors de l\'envoi',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error('Erreur envoi résultats:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible d\'envoyer les résultats',
                variant: 'destructive'
            });
        } finally {
            setSending(false);
        }
    };


    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Gestion des notes</CardTitle>
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5"/>
                        <span>Gestion des notes - {candidatPrenom} {candidatNom}</span>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h3 className="font-semibold text-lg text-blue-800">{filiere.nomfil || 'Non définie'}</h3>
                            {filiere.description && <p className="text-blue-700 mt-2">{filiere.description}</p>}
                        </div>
                    </div>
                    {moyenne && (
                        <Badge variant="outline" className="text-lg px-4 py-1">
                            <Calculator className="h-4 w-4 mr-2"/>
                            Moyenne: {moyenne}/20
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>

                <div className="space-y-4">
                    {filiere.matieres.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            Aucune matière disponible
                        </p>
                    ) : (
                        <>
                            {filiere.matieres.map((matiere) => {
                                const note = notes.find(n => n.matiere_id === matiere.id);
                                
                                return (
                                    <div key={matiere.id} className="flex items-end gap-4 p-4 border rounded-lg">
                                        <div className="flex-1">
                                            <Label htmlFor={`note-${matiere.id}`}>
                                                {matiere.nom_matiere}
                                                <Badge variant="secondary" className="ml-2">
                                                    Coef. {matiere.coefficient}
                                                </Badge>
                                            </Label>
                                            <Input
                                                id={`note-${matiere.id}`}
                                                type="number"
                                                min="0"
                                                max="20"
                                                step="0.5"
                                                value={note?.note ?? ''}
                                                onChange={(e) => handleNoteChange(matiere.id, e.target.value)}
                                                placeholder="Note sur 20"
                                                className="mt-2"
                                            />
                                        </div>
                                        <Button
                                            onClick={() => saveNote(matiere.id)}
                                            disabled={saving || !note || note.note === undefined}
                                        >
                                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                                        </Button>
                                    </div>
                                );
                            })}

                            {notes.length > 0 && (
                                <div className="flex justify-end pt-4 border-t">
                                    <Button
                                        onClick={sendResults}
                                        disabled={sending}
                                        className="gap-2"
                                    >
                                        <Send className="h-4 w-4"/>
                                        {sending ? 'Envoi en cours...' : 'Envoyer les résultats par email'}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default NotesManager;
