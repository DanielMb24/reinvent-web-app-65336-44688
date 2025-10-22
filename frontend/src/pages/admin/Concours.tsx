// =================================================================
// FICHIER : components/Concours.tsx (Composant React)
// =================================================================
import React, {useState} from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {apiService} from '@/services/api';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {toast} from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {z} from "zod"
import {zodResolver} from "@hookform/resolvers/zod"
import {useForm} from "react-hook-form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {Switch} from "@/components/ui/switch"
import {Calendar} from "@/components/ui/calendar"
import {cn} from "@/lib/utils"
import {format} from "date-fns"
import {fr} from "date-fns/locale";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Badge} from "@/components/ui/badge";
import {CheckCircle, XCircle, Loader2} from 'lucide-react';

// Schéma Zod: fracnc est toujours une chaîne pour la saisie, mais on le valide comme un nombre.
const formSchema = z.object({
    libcnc: z.string().min(2, {
        message: "Le nom du concours doit comporter au moins 2 caractères.",
    }),
    fracnc: z.string().refine(value => value === "" || !isNaN(Number(value)), {
        message: "Les frais d'inscription doivent être un nombre.",
    }).optional(),
    agecnc: z.string().refine(value => value === "" || !isNaN(Number(value)), {
        message: "L'âge maximum doit être un nombre.",
    }).optional(),
    sescnc: z.string().min(2, {
        message: "La session doit comporter au moins 2 caractères.",
    }),
    dficnc: z.date({
        required_error: "La date de début d'inscription est requise.",
    }),
    dexpcn: z.date({
        required_error: "La date de fin d'inscription est requise.",
    }),
    niveau_id: z.string().min(1, {
        message: "Veuillez sélectionner un niveau.",
    }),
    etablissement_id: z.string().min(1, {
        message: "Veuillez sélectionner un établissement.",
    }),
    stacnc: z.boolean().default(true),
    is_gorri: z.boolean().default(false),
})

const Concours = () => {
    const [open, setOpen] = useState(false)
    const queryClient = useQueryClient()

    // Requêtes
    const {data: concoursData, isLoading: isLoadingConcours} = useQuery({
        queryKey: ['admin-concours'],
        queryFn: () => apiService.getConcours(),
    });

    const {data: niveauxData, isLoading: isLoadingNiveaux, isError: isErrorNiveaux} = useQuery({
        queryKey: ['admin-niveaux'],
        queryFn: () => apiService.getNiveaux(),
    });

    const {data: etablissementsData, isLoading: isLoadingEtablissements, isError: isErrorEtablissements} = useQuery({
        queryKey: ['admin-etablissements'],
        queryFn: () => apiService.getEtablissements(),
    });

    // Données (avec fallback)
    const niveaux = niveauxData?.data || [];
    const etablissements = etablissementsData?.data || [];

    // Enrichissement pour la table
    const concours = (concoursData?.data || []).map((concoursItem: any) => ({
        ...concoursItem,
        nomniv: niveaux.find((n: any) => n.id === concoursItem.niveau_id)?.nomniv || 'N/A',
        etablissement_nom: etablissements.find((e: any) => e.id === concoursItem.etablissement_id)?.nomets || 'N/A',
    }));


    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            libcnc: "",
            fracnc: "",
            agecnc: "",
            sescnc: "",
            dficnc: new Date(),
            dexpcn: new Date(),
            niveau_id: "",
            etablissement_id: "",
            stacnc: true,
            is_gorri: false,
        },
    })

    // Type pour le payload de la mutation
    type CreateConcoursPayload = Omit<z.infer<typeof formSchema>, 'fracnc' | 'agecnc' | 'niveau_id' | 'etablissement_id' | 'dficnc' | 'dexpcn'> & {
        fracnc: number; // Forcé à être un nombre
        agecnc?: number;
        niveau_id: number;
        etablissement_id: number;
        debcnc: Date; // Nom de colonne DB
        fincnc: Date; // Nom de colonne DB
    }

    const onSubmit = (values: z.infer<typeof formSchema>) => {

        // 💡 CORRECTION CRITIQUE POUR LES CONCOURS GRATUITS
        // Si is_gorri est coché, les frais sont 0. Sinon, on utilise la valeur saisie (convertie en nombre ou 0 si vide).
        let frais = 0;
        if (!values.is_gorri) {
            frais = values.fracnc ? Number(values.fracnc) : 0;
        }

        const payload: CreateConcoursPayload = {
            libcnc: values.libcnc,
            sescnc: values.sescnc,
            fracnc: frais, // Valeur corrigée
            agecnc: values.agecnc ? Number(values.agecnc) : undefined,
            niveau_id: Number(values.niveau_id),
            etablissement_id: Number(values.etablissement_id),
            stacnc: values.stacnc,
            is_gorri: values.is_gorri ? 1 : 0, // Envoi du statut Gorri

            // Renommage des clés pour correspondre aux noms de colonnes de la DB
            debcnc: values.dficnc,
            fincnc: values.dexpcn,
        };

        createMutation.mutate(payload);
    }

    const createMutation = useMutation({
        mutationFn: (data: CreateConcoursPayload) => apiService.createConcours(data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['admin-concours']});
            toast({
                title: "Concours créé",
                description: "Le concours a été créé avec succès",
            });
            setOpen(false)
            form.reset() // Réinitialiser le formulaire
        },
        onError: (error: any) => {
            console.error('Erreur création concours:', error);
            const message = error.errors ? error.errors.join(', ') : "Impossible de créer le concours.";
            toast({
                title: "Erreur",
                description: message,
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiService.deleteConcours(id.toString()),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['admin-concours']});
            toast({
                title: "Concours supprimé",
                description: "Le concours a été supprimé avec succès",
            });
        },
        onError: (error) => {
            console.error('Erreur suppression concours:', error);
            toast({
                title: "Erreur",
                description: "Impossible de supprimer le concours",
                variant: "destructive",
            });
        },
    });

    // Fonction utilitaire pour le contenu des Select (non modifiée, elle est bonne)
    const getSelectContent = (data: unknown, isLoading: boolean, isError: boolean, emptyMessage: string, loadingMessage: string) => {
        if (isLoading) {
            return <SelectItem value="loading" disabled className="text-gray-500">{loadingMessage}</SelectItem>;
        }
        if (isError) {
            return <SelectItem value="error" disabled className="text-red-500">Erreur de chargement 🚨</SelectItem>;
        }
        if (data.length === 0) {
            return <SelectItem value="empty" disabled className="text-yellow-500">{emptyMessage}</SelectItem>;
        }
        return data.map((item) => (
            <SelectItem key={item.id} value={item.id.toString()}>
                {item.nomniv || item.nomets}
            </SelectItem>
        ));
    };

    const niveauxSelectContent = getSelectContent(niveaux, isLoadingNiveaux, isErrorNiveaux, "Aucun niveau trouvé", "Chargement des niveaux...");

    const etablissementsSelectContent = getSelectContent(
        etablissements,
        isLoadingEtablissements,
        isErrorEtablissements,
        "Aucun établissement trouvé",
        "Chargement des établissements..."
    );

    // @ts-ignore
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestion des Concours</CardTitle>
                <CardDescription>
                    Liste de tous les concours enregistrés.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* MODALE DE CRÉATION - Design Amélioré */}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="mb-4">Ajouter un concours</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Créer un nouveau concours</DialogTitle>
                            <DialogDescription>
                                Remplissez les informations ci-dessous pour ajouter un concours.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                {/* Ligne 1: Nom et Session (Grid) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="libcnc"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Nom du concours</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Concours d'entrée en Licence 1" {...field} />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="sescnc"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Session</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: 2025/2026" {...field} />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Ligne 2: Niveaux et Établissements (Grid) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="niveau_id"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Niveau</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}
                                                        disabled={isLoadingNiveaux || isErrorNiveaux || niveaux.length === 0}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue
                                                                placeholder={isLoadingNiveaux ? "Chargement..." : isErrorNiveaux ? "Erreur de chargement" : "Sélectionner un niveau"}/>
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {niveauxSelectContent}
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    Niveau d'étude auquel ce concours donne accès.
                                                </FormDescription>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="etablissement_id"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Établissement</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}
                                                        disabled={isLoadingEtablissements || isErrorEtablissements || etablissements.length === 0}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue
                                                                placeholder={isLoadingEtablissements ? "Chargement..." : isErrorEtablissements ? "Erreur de chargement" : "Sélectionner un établissement"}/>
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {etablissementsSelectContent}
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    Établissement organisant ce concours.
                                                </FormDescription>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Ligne 3: Frais et Âge (Grid) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="fracnc"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Frais d'inscription (FCFA)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="Ex: 15000"
                                                        {...field}
                                                        value={field.value || ''}
                                                        disabled={form.watch('is_gorri')} // Désactivé si Gorri est coché
                                                    />
                                                </FormControl>
                                                {form.watch('is_gorri') && (
                                                    <FormDescription className="text-green-600">
                                                        Les frais sont mis à 0 car le programme Gorri est activé.
                                                    </FormDescription>
                                                )}
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="agecnc"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Âge maximum (Optionnel)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="Ex: 25" {...field} value={field.value || ''}/>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Ligne 4: Dates */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="dficnc"
                                        render={({field}) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Date de début des inscriptions</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full justify-start text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP", {locale: fr})
                                                                ) : (
                                                                    <span>Choisir une date</span>
                                                                )}
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            initialFocus
                                                            locale={fr}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="dexpcn"
                                        render={({field}) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Date de fin des inscriptions</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full justify-start text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP", {locale: fr})
                                                                ) : (
                                                                    <span>Choisir une date</span>
                                                                )}
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            initialFocus
                                                            locale={fr}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Ligne 5: Statuts */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <FormField
                                        control={form.control}
                                        name="stacnc"
                                        render={({field}) => (
                                            <FormItem
                                                className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Statut (Actif)</FormLabel>
                                                    <FormDescription>
                                                        Active ou désactive la visibilité du concours.
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        aria-label="Statut du concours"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="is_gorri"
                                        render={({field}) => (
                                            <FormItem
                                                className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Programme Gorri (Gratuit)</FormLabel>
                                                    <FormDescription>
                                                        Active l'inscription gratuite pour ce concours.
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        aria-label="Programme Gorri"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" className="w-full mt-6"
                                        disabled={createMutation.isPending || isLoadingNiveaux || isLoadingEtablissements}>
                                    {createMutation.isPending ? (<Loader2 className="mr-2 h-4 w-4 animate-spin"/>) : null}
                                    {createMutation.isPending ? "Création en cours..." : "Créer le Concours"}
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>

                {/* LISTE DES CONCOURS - Design Amélioré */}
                <div className="mt-6">
                    {isLoadingConcours ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="mr-2 h-6 w-6 animate-spin"/>
                            <p className="text-lg text-gray-500">Chargement des concours...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableCaption>Liste de tous les concours.</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Id</TableHead>
                                    <TableHead>Concours</TableHead>
                                    <TableHead>Niveau/Établissement</TableHead>
                                    <TableHead className="text-right">Frais</TableHead>
                                    <TableHead className="text-center">Gorri</TableHead>
                                    <TableHead className="text-center">Statut</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {concours.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                                            Aucun concours trouvé.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    concours.map((concoursItem: any) => (
                                        <TableRow key={concoursItem.id}>
                                            <TableCell className="font-medium">{concoursItem.id}</TableCell>
                                            <TableCell>
                                                <p className="font-semibold">{concoursItem.libcnc}</p>
                                                <Badge variant="outline" className="mt-1">{concoursItem.sescnc}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm font-medium">{concoursItem.nomniv}</p>
                                                <p className="text-xs text-muted-foreground">{concoursItem.etablissement_nom}</p>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {concoursItem.fracnc ? `${concoursItem.fracnc.toLocaleString('fr-FR')} FCFA` : '0 FCFA'}
                                            </TableCell>

                                            {/* Statut Gorri */}
                                            <TableCell className="text-center">
                                                {concoursItem.is_gorri ? (
                                                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" title="Programme Gorri Actif"/>
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-gray-400 mx-auto" title="Programme Gorri Inactif"/>
                                                )}
                                            </TableCell>

                                            {/* Statut Actif */}
                                            <TableCell className="text-center">
                                                {concoursItem.stacnc === '1' ? (
                                                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" title="Concours Actif"/>
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-red-500 mx-auto" title="Concours Inactif"/>
                                                )}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => deleteMutation.mutate(concoursItem.id)}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                    Supprimer
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default Concours;