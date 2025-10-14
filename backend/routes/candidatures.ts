// routes/candidatures.ts
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Tesseract from 'tesseract.js';
import pdfParse from 'pdf-parse';
import { Request, Response } from 'express';

const router = Router();

// Configuration multer pour upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/temp';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|image\/(jpeg|jpg|png)/;
        if (allowedTypes.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Format non supporté. Utilisez PDF, JPG ou PNG.'), false);
        }
    }
});

// Interface pour les données extraites
interface ScanResult {
    nom?: string;
    prenoms?: string;
    dateNaissance?: string;
    texteBrut: string;
    confidence?: number;
    success: boolean;
    errors?: string[];
}

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

    // Patterns regex pour extraction
    const patterns = {
        nom: [
            /(?:nom|nom\s+de\s*famille|family\s*name)[:\s]+([a-zàáâäãåèéêëìíîïòóôöùúûüÿç\s]+)/i,
            /([a-zàáâäãåèéêëìíîïòóôöùúûüÿç\s]+)\s+(?:né|née|birth|naissance)/i,
            /(?:nom\s*:?\s*)([a-zàáâäãåèéêëìíîïòóôöùúûüÿç\s]+)/i
        ],
        prenoms: [
            /(?:prénom|prénoms|first\s*name|prenom)[:\s]+([a-zàáâäãåèéêëìíîïòóôöùúûüÿç\s]+)/i,
            /([a-zàáâäãåèéêëìíîïòóôöùúûüÿç\s]+)\s+(?:le|né|née)\s+\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/i
        ],
        dateNaissance: [
            /(?:date\s+de\s*naissance|né\s*le|née\s*le|dob|birth\s*date)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
            /né[e]?\s*le?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
            /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i
        ]
    };

    // Extraire nom
    for (const pattern of patterns.nom) {
        const match = cleanText.match(pattern);
        if (match?.[1]) {
            result.nom = match[1].trim().replace(/\b(?:le|la|les|de|du|des)\b/gi, '').toUpperCase();
            break;
        }
    }

    // Extraire prénoms
    for (const pattern of patterns.prenoms) {
        const match = cleanText.match(pattern);
        if (match?.[1]) {
            result.prenoms = match[1].trim().toUpperCase();
            break;
        }
    }

    // Extraire date de naissance
    for (const pattern of patterns.dateNaissance) {
        const match = cleanText.match(pattern);
        if (match?.[1]) {
            let dateStr = match[1];
            // Convertir format jj/mm/aaaa ou jj-mm-aaaa vers aaaa-mm-jj
            dateStr = dateStr.replace(/[\/\-]/g, '/');
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                let [day, month, year] = parts;
                if (year.length === 2) year = '19' + year; // Année à 2 chiffres
                if (day.length === 4) [day, month, year] = [month, year, day]; // Format aaaa/mm/jj
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

// Route de scan
router.post('/scan-document', upload.single('document'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Aucun fichier uploadé'
            });
        }

        const filePath = req.file.path;
        let text = '';

        try {
            // Traitement PDF
            if (req.file.mimetype === 'application/pdf') {
                const dataBuffer = fs.readFileSync(filePath);
                const pdfData = await pdfParse(dataBuffer);
                text = pdfData.text;
            } else {
                // Traitement image
                const { data: { text: ocrText } } = await Tesseract.recognize(filePath, 'fra', {
                    logger: m => console.log(m)
                });
                text = ocrText;
            }

            // Nettoyer le fichier temporaire
            fs.unlinkSync(filePath);

            // Extraire les données
            const extractedData = extractDataFromText(text);

            res.json({
                success: true,
                data: extractedData,
                rawText: text.substring(0, 1000) + (text.length > 1000 ? '...' : '') // Limiter le texte brut
            });

        } catch (error: any) {
            // Nettoyer le fichier en cas d'erreur
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            console.error('Erreur OCR:', error);

            res.status(500).json({
                success: false,
                error: 'Erreur lors de l\'analyse du document',
                details: error.message
            });
        }

    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: 'Erreur serveur',
            details: error.message
        });
    }
});

export default router;