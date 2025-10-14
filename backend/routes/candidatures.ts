// routes/candidatures.ts
import { Router, Response } from 'express';
import multer, { StorageEngine, diskStorage } from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { promisify } from 'util';
import Tesseract from 'tesseract.js';
import pdfParse from 'pdf-parse';

// Types pour Multer correctement définis
declare global {
    namespace Express {
        interface Request {
            file?: Express.Multer.File;
        }
    }
}

// Interface pour la réponse
interface ScanResult {
    nom?: string;
    prenoms?: string;
    dateNaissance?: string;
    texteBrut: string;
    confidence?: number;
    success: boolean;
    errors?: string[];
}

const router = Router();

// Fonction utilitaire pour créer le répertoire
const ensureDir = async (dirPath: string): Promise<void> => {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        throw new Error(`Impossible de créer le répertoire ${dirPath}: ${error}`);
    }
};

// Configuration multer avec types corrects
const storage: StorageEngine = diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = 'uploads/temp';
        try {
            await ensureDir(uploadDir);
            cb(null as null, uploadDir);
        } catch (error) {
            cb(error as Error, '');
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null as null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

// File filter avec types corrects
const fileFilter = (
    req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const allowedTypes = /pdf|image\/(jpeg|jpg|png)/;
    if (allowedTypes.test(file.mimetype)) {
        cb(null as null, true);
    } else {
        cb(new Error('Format non supporté. Utilisez PDF, JPG ou PNG.'), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter
});

// Fonction d'extraction intelligente des données
function extractDataFromText(text: string): ScanResult {
    const result: ScanResult = {
        texteBrut: text,
        success: false,
        errors: []
    };

    // Nettoyer le texte
    const cleanText = text
        .toLowerCase()
        .replace(/[^\w\sàáâäãåèéêëìíîïòóôöùúûüÿç]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Patterns regex pour extraction (améliorés)
    const patterns = {
        nom: [
            /(?:nom|nom\s+de\s*famille|family\s*name|nom\s*et\s*prénom)[:\s]+([a-zàáâäãåèéêëìíîïòóôöùúûüÿç\s]+)/i,
            /([a-zàáâäãåèéêëìíîïòóôöùúûüÿç\s]+)\s+(?:né[e]?\s*(?:le\s*)?|naissance)/i,
            /(?:nom\s*:?\s*|nom:\s*)([a-zàáâäãåèéêëìíîïòóôöùúûüÿç\s]+)/i,
            // Pattern pour carte d'identité française
            /n°?\s*de\s*carte\s*:?\s*[^\n\r]+(?:\n\r|\n|[\s]*)([a-zàáâäãåèéêëìíîïòóôöùúûüÿç\s]+)/i
        ],
        prenoms: [
            /(?:prénom|prénoms|first\s*name|prenom)[:\s]+([a-zàáâäãåèéêëìíîïòóôöùúûüÿç\s]+)/i,
            /prénoms?\s*:?\s*([a-zàáâäãåèéêëìíîïòóôöùúûüÿç\s]+)/i,
            // Pattern pour prénom avant nom
            /([a-zàáâäãåèéêëìíîïòóôöùúûüÿç\s]+)\s+(?:né[e]?\s*(?:le\s*)?|le\s+\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
        ],
        dateNaissance: [
            /(?:date\s+de\s*naissance|né\s*(?:le\s*)?|née\s*(?:le\s*)?|dob|birth\s*date)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
            /né[e]?\s*(?:le\s*)?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
            /naissance\s*:\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
            // Pattern plus large pour dates
            /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
            /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/i
        ]
    };

    // Extraire nom
    for (const pattern of patterns.nom) {
        const match = cleanText.match(pattern);
        if (match?.[1]) {
            result.nom = match[1]
                .trim()
                .replace(/\b(?:le|la|les|de|du|des|à|au)\b/gi, '')
                .replace(/\s+/g, ' ')
                .toUpperCase();
            break;
        }
    }

    // Extraire prénoms
    for (const pattern of patterns.prenoms) {
        const match = cleanText.match(pattern);
        if (match?.[1]) {
            result.prenoms = match[1]
                .trim()
                .replace(/\s+/g, ' ')
                .toUpperCase();
            break;
        }
    }

    // Extraire date de naissance
    for (const pattern of patterns.dateNaissance) {
        const match = cleanText.match(pattern);
        if (match?.[1]) {
            let dateStr = match[1].replace(/[\.\s]/g, '/');

            // Gérer différents formats de date
            const dateFormats = [
                /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, // dd/mm/yyyy
                /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/  // yyyy/mm/dd
            ];

            let day: string, month: string, year: string;

            for (const format of dateFormats) {
                const formatMatch = dateStr.match(format);
                if (formatMatch) {
                    if (formatMatch[3].length === 4) { // dd/mm/yyyy
                        [day, month, year] = formatMatch.slice(1);
                    } else { // yyyy/mm/dd
                        [year, month, day] = formatMatch.slice(1);
                    }
                    break;
                }
            }

            if (year && month && day) {
                if (year.length === 2) year = '19' + year;
                result.dateNaissance = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                break;
            }
        }
    }

    // Validation des données extraites
    if (result.nom && result.prenoms && result.dateNaissance) {
        result.success = true;
    } else {
        if (!result.nom) result.errors!.push('Nom non détecté');
        if (!result.prenoms) result.errors!.push('Prénoms non détectés');
        if (!result.dateNaissance) result.errors!.push('Date de naissance non détectée');
    }

    return result;
}

// Fonction utilitaire pour nettoyer les fichiers
const cleanupFile = async (filePath: string): Promise<void> => {
    try {
        const exists = await fs.access(filePath).then(() => true).catch(() => false);
        if (exists) {
            await fs.unlink(filePath);
        }
    } catch (error) {
        console.warn('Erreur lors du nettoyage du fichier:', error);
    }
};

// Middleware pour typer correctement req.file
const handleMulterUpload = upload.single('document');

// Route de scan
router.post('/scan-document', (req, res, next) => {
    handleMulterUpload(req, res, async (err) => {
        if (err) {
            console.error('Erreur multer:', err);
            return res.status(400).json({
                success: false,
                error: err.message || 'Erreur lors de l\'upload'
            });
        }
        next();
    });
}, async (req: Express.Request, res: Response) => {
    let filePath = '';

    try {
        // Vérifier que le fichier existe
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Aucun fichier uploadé'
            });
        }

        filePath = req.file.path;
        let text = '';
        let confidence = 0;

        console.log(`Traitement du fichier: ${req.file.originalname} (${req.file.mimetype})`);

        // Traitement du fichier
        if (req.file.mimetype === 'application/pdf') {
            // Traitement PDF
            const dataBuffer = await fs.readFile(filePath);
            const pdfData = await pdfParse(dataBuffer);
            text = pdfData.text;
            confidence = 95; // PDF texte est généralement fiable
        } else {
            // Traitement image avec Tesseract
            const { data } = await Tesseract.recognize(
                filePath,
                'fra+eng', // Français + anglais pour plus de précision
                {
                    logger: m => {
                        console.log(`OCR ${m.status}: ${Math.round(m.progress * 100)}%`);
                    }
                }
            );
            text = data.text;
            confidence = data.confidence || 0;
        }

        // Nettoyer le fichier temporaire
        await cleanupFile(filePath);
        filePath = '';

        // Extraire les données
        const extractedData = extractDataFromText(text);

        // Ajouter la confiance au résultat
        extractedData.confidence = confidence;

        // Préparer la réponse
        const rawTextPreview = text.length > 2000 ? text.substring(0, 2000) + '...' : text;

        res.json({
            success: true,
            data: extractedData,
            rawText: rawTextPreview,
            fullTextLength: text.length,
            confidence: confidence,
            fileInfo: {
                originalName: req.file?.originalname,
                size: req.file?.size,
                mimetype: req.file?.mimetype
            }
        });

    } catch (error: any) {
        console.error('Erreur lors du traitement:', error);

        // Nettoyer le fichier en cas d'erreur
        if (filePath) {
            await cleanupFile(filePath);
        }

        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'analyse du document',
            details: error.message || 'Erreur inconnue'
        });
    }
});

export default router;