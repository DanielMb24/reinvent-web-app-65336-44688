import React, {useState, useEffect} from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Button} from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
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
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"

const formSchema = z.object({
    libcnc: z.string().min(2, {
        message: "Le nom du concours doit comporter au moins 2 caractères.",
    }),
    fracnc: z.string().refine(value => !isNaN(Number(value)), {
        message: "Les frais d'inscription doivent être un nombre.",
    }).optional(),
    agecnc: z.string().refine(value => !isNaN(Number(value)), {
        message: "L'âge maximum doit être un nombre.",
    }).optional(),
    sescnc: z.string().min(2, {
        message: "La session doit comporter au moins 2 caractères.",
    }),
    dficnc: z.date(),
    dexpcn: z.date(),
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

    const {data: concoursData, isLoading} = useQuery({
        queryKey: ['admin-concours'],
        queryFn: () => apiService.getConcours(),
    });

    const {data: niveauxData} = useQuery({
        queryKey: ['admin-niveaux'],
        queryFn: () => apiService.getNiveaux(),
    });

    const {data: etablissementsData} = useQuery({
        queryKey: ['admin-etablissements'],
        queryFn: () => apiService.getEtablissements(),
    });

    const niveaux = niveauxData?.data || [];
    const etablissements = etablissementsData?.data || [];
    const concours = concoursData?.data || [];

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

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        console.log(values)
        createMutation.mutate(values)
    }

    const createMutation = useMutation({
        mutationFn: (data: z.infer<typeof formSchema>) => apiService.createConcours(data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['admin-concours']});
            toast({
                title: "Concours créé",
                description: "Le concours a été créé avec succès",
            });
            setOpen(false)
        },
        onError: (error) => {
            console.error('Erreur création concours:', error);
            toast({
                title: "Erreur",
                description: "Impossible de créer le concours",
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Concours</CardTitle>
                <CardDescription>
                    Liste de tous les concours.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>Ajouter un concours</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Créer un concours</DialogTitle>
                            <DialogDescription>
                                Créer un nouveau concours.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="libcnc"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Nom du concours</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nom du concours" {...field} />
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
                                                <Input placeholder="Session" {...field} />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="fracnc"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Frais d'inscription</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Frais d'inscription" {...field} />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="agecnc"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Âge maximum</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Âge maximum" {...field} />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="dficnc"
                                        render={({field}) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Date de début</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-[240px] pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP")
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
                                                            disabled={(date) =>
                                                                date > new Date() || date < new Date("1900-01-01")
                                                            }
                                                            initialFocus
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
                                                <FormLabel>Date de fin</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-[240px] pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP")
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
                                                            disabled={(date) =>
                                                                date > new Date() || date < new Date("1900-01-01")
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="niveau_id"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Niveau</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Sélectionner un niveau"/>
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {niveaux.map((niveau: any) => (
                                                            <SelectItem key={niveau.id} value={niveau.id.toString()}>
                                                                {niveau.nomniv}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
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
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Sélectionner un établissement"/>
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {etablissements.map((etablissement: any) => (
                                                            <SelectItem key={etablissement.id}
                                                                        value={etablissement.id.toString()}>
                                                                {etablissement.nomets}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <FormField
                                        control={form.control}
                                        name="stacnc"
                                        render={({field}) => (
                                            <FormItem
                                                className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Statut</FormLabel>
                                                    <FormDescription>
                                                        Activer ou désactiver le concours.
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
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
                                                    <FormLabel className="text-base">Gorri</FormLabel>
                                                    <FormDescription>
                                                        Activer ou désactiver le programme Gorri.
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit">Créer</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
                <div className="mt-4">
                    {isLoading ? (
                        <p>Chargement...</p>
                    ) : (
                        <Table>
                            <TableCaption>Liste de tous les concours.</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Id</TableHead>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Session</TableHead>
                                    <TableHead>Frais</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {concours.map((concours: any) => (
                                    <TableRow key={concours.id}>
                                        <TableCell className="font-medium">{concours.id}</TableCell>
                                        <TableCell>{concours.libcnc}</TableCell>
                                        <TableCell>{concours.sescnc}</TableCell>
                                        <TableCell>{concours.fracnc}</TableCell>
                                        <TableCell>
                                            <Button variant="destructive" size="sm"
                                                    onClick={() => deleteMutation.mutate(concours.id)}>
                                                Supprimer
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default Concours;
