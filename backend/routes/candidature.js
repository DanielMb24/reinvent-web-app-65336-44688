const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const pdf = require('pdf-parse');

// Configuration multer pour le scan de documents
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/temp');
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `scan-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Format non supporté. Utilisez PDF, JPG ou PNG.'), false);
        }
    }
});

// Fonction pour extraire le texte d'un PDF
async function extractTextFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
}

// Fonction pour extraire le texte d'une image avec OCR
async function extractTextFromImage(filePath) {
    const result = await Tesseract.recognize(filePath, 'fra', {
        logger: (m) => console.log(m)
    });
    return result.data.text;
}

// Fonction pour parser les informations du document
function parseDocumentInfo(text) {
    const result = {
        nom: null,
        prenoms: null,
        dateNaissance: null,
        texteBrut: text,
        success: false,
        errors: []
    };

    // Nettoyage du texte
    const cleanText = text.replace(/\s+/g, ' ').trim();

    // Patterns de recherche pour documents gabonais
    const patterns = {
        nom: [
            /NOM[:\s]+([A-ZÀ-Ü\s]+?)(?=\s*PR[ÉE]NOM|$)/i,
            /Nom[:\s]+([A-ZÀ-Ü\s]+?)(?=\s*Pr[ée]nom|$)/i,
            /SURNAME[:\s]+([A-ZÀ-Ü\s]+)/i,
            /Family Name[:\s]+([A-ZÀ-Ü\s]+)/i
        ],
        prenoms: [
            /PR[ÉE]NOM[S]?[:\s]+([A-ZÀ-Ü\s]+?)(?=\s*N[ÉE]|DATE|$)/i,
            /Pr[ée]nom[s]?[:\s]+([A-ZÀ-Ü\s]+?)(?=\s*N[ée]|Date|$)/i,
            /GIVEN NAME[S]?[:\s]+([A-ZÀ-Ü\s]+)/i,
            /First Name[s]?[:\s]+([A-ZÀ-Ü\s]+)/i
        ],
        dateNaissance: [
            /N[ÉE][\s(]+LE[:\s)]+(\d{1,2}[\s\/-]\d{1,2}[\s\/-]\d{2,4})/i,
            /DATE DE NAISSANCE[:\s]+(\d{1,2}[\s\/-]\d{1,2}[\s\/-]\d{2,4})/i,
            /Date of Birth[:\s]+(\d{1,2}[\s\/-]\d{1,2}[\s\/-]\d{2,4})/i,
            /BIRTH DATE[:\s]+(\d{1,2}[\s\/-]\d{1,2}[\s\/-]\d{2,4})/i,
            /(\d{1,2}[\s\/-]\d{1,2}[\s\/-]\d{4})/
        ]
    };

    // Extraction du nom
    for (const pattern of patterns.nom) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
            result.nom = match[1].trim().toUpperCase();
            break;
        }
    }

    // Extraction des prénoms
    for (const pattern of patterns.prenoms) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
            result.prenoms = match[1].trim().replace(/\s+/g, ' ');
            break;
        }
    }

    // Extraction de la date de naissance
    for (const pattern of patterns.dateNaissance) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
            const rawDate = match[1].trim();
            const parsedDate = parseDate(rawDate);
            if (parsedDate) {
                result.dateNaissance = parsedDate;
                break;
            }
        }
    }

    // Vérification de succès
    if (result.nom && result.prenoms && result.dateNaissance) {
        result.success = true;
    } else {
        if (!result.nom) result.errors.push('Nom non détecté');
        if (!result.prenoms) result.errors.push('Prénoms non détectés');
        if (!result.dateNaissance) result.errors.push('Date de naissance non détectée');
    }

    return result;
}

// Fonction pour parser différents formats de date
function parseDate(dateStr) {
    // Formats possibles: DD/MM/YYYY, DD-MM-YYYY, DD MM YYYY
    const patterns = [
        /(\d{1,2})[\s\/-](\d{1,2})[\s\/-](\d{4})/,
        /(\d{1,2})[\s\/-](\d{1,2})[\s\/-](\d{2})/
    ];

    for (const pattern of patterns) {
        const match = dateStr.match(pattern);
        if (match) {
            let day = parseInt(match[1], 10);
            let month = parseInt(match[2], 10);
            let year = parseInt(match[3], 10);

            // Ajuster l'année si format court
            if (year < 100) {
                year += year < 50 ? 2000 : 1900;
            }

            // Validation
            if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2024) {
                // Format ISO (YYYY-MM-DD)
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
        }
    }

    return null;
}

// Route principale de scan
router.post('/scan-document', upload.single('document'), async (req, res) => {
    console.log('🔍 === DÉBUT SCAN DOCUMENT ===');
    console.log('📋 Headers:', req.headers);
    console.log('📂 Body:', req.body);
    console.log('📄 File:', req.file);

    if (!req.file) {
        console.error('❌ Aucun fichier reçu');
        return res.status(400).json({
            success: false,
            error: 'Aucun fichier reçu. Vérifiez le nom du champ (doit être "document")'
        });
    }

    const filePath = req.file.path;
    console.log('📁 Chemin fichier:', filePath);

    try {
        let text = '';

        // Extraction selon le type de fichier
        if (req.file.mimetype === 'application/pdf') {
            console.log('📄 Extraction PDF...');
            text = await extractTextFromPDF(filePath);
        } else {
            console.log('🖼️ OCR Image...');
            text = await extractTextFromImage(filePath);
        }

        console.log('📝 Texte extrait (longueur):', text.length);
        console.log('📝 Aperçu:', text.substring(0, 500));

        // Parsing des informations
        const parsedData = parseDocumentInfo(text);
        console.log('✅ Données parsées:', parsedData);

        // Nettoyage du fichier temporaire
        fs.unlinkSync(filePath);
        console.log('🗑️ Fichier temporaire supprimé');

        return res.json({
            success: true,
            data: parsedData,
            rawText: text,
            confidence: parsedData.success ? 0.85 : 0.50
        });

    } catch (error) {
        console.error('💥 Erreur scan:', error);

        // Nettoyage en cas d'erreur
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'analyse du document: ' + error.message
        });
    }
});

// Route de test de connectivité
router.head('/scan-document', (req, res) => {
    res.status(200).end();
});

module.exports = router;
