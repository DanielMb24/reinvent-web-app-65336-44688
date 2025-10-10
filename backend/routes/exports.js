const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// GET /api/exports/candidats/excel - Export Excel des candidats
router.get('/candidats/excel', async (req, res) => {
    try {
        const { concours_id } = req.query;
        const connection = getConnection();
        
        let query = `
            SELECT 
                c.nupcan, c.nomcan, c.prncan, c.maican, c.telcan,
                c.dtncan, c.ldncan, c.proorg,
                con.libcnc, f.nomfil, e.nomets, n.nomniv,
                p.statut as statut_paiement, p.montant,
                d.statut as statut_documents
            FROM candidats c
            LEFT JOIN concours con ON c.concours_id = con.id
            LEFT JOIN filieres f ON c.filiere_id = f.id
            LEFT JOIN etablissements e ON con.etablissement_id = e.id
            LEFT JOIN niveaux n ON c.niveau_id = n.id
            LEFT JOIN paiements p ON c.nupcan = p.nupcan
            LEFT JOIN (
                SELECT dos.nipcan, GROUP_CONCAT(doc.statut) as statut
                FROM dossiers dos
                LEFT JOIN documents doc ON dos.document_id = doc.id
                GROUP BY dos.nipcan
            ) d ON c.nupcan = d.nipcan
        `;
        
        const params = [];
        if (concours_id) {
            query += ' WHERE c.concours_id = ?';
            params.push(concours_id);
        }
        
        const [candidats] = await connection.execute(query, params);
        
        // Créer le workbook Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Candidats');
        
        // Définir les colonnes
        worksheet.columns = [
            { header: 'NUPCAN', key: 'nupcan', width: 15 },
            { header: 'Nom', key: 'nomcan', width: 20 },
            { header: 'Prénom', key: 'prncan', width: 20 },
            { header: 'Email', key: 'maican', width: 30 },
            { header: 'Téléphone', key: 'telcan', width: 15 },
            { header: 'Date de naissance', key: 'dtncan', width: 15 },
            { header: 'Lieu de naissance', key: 'ldncan', width: 20 },
            { header: 'Province', key: 'proorg', width: 15 },
            { header: 'Concours', key: 'libcnc', width: 30 },
            { header: 'Filière', key: 'nomfil', width: 25 },
            { header: 'Établissement', key: 'nomets', width: 30 },
            { header: 'Niveau', key: 'nomniv', width: 20 },
            { header: 'Statut Paiement', key: 'statut_paiement', width: 15 },
            { header: 'Montant', key: 'montant', width: 10 },
            { header: 'Statut Documents', key: 'statut_documents', width: 20 }
        ];
        
        // Ajouter les données
        candidats.forEach(candidat => {
            worksheet.addRow(candidat);
        });
        
        // Style de l'en-tête
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
        };
        
        // Envoyer le fichier
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=candidats_${Date.now()}.xlsx`);
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Erreur export Excel:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/exports/candidats/pdf - Export PDF des candidats
router.get('/candidats/pdf', async (req, res) => {
    try {
        const { concours_id } = req.query;
        const connection = getConnection();
        
        let query = `
            SELECT 
                c.nupcan, c.nomcan, c.prncan, c.maican,
                con.libcnc, f.nomfil, e.nomets,
                p.statut as statut_paiement
            FROM candidats c
            LEFT JOIN concours con ON c.concours_id = con.id
            LEFT JOIN filieres f ON c.filiere_id = f.id
            LEFT JOIN etablissements e ON con.etablissement_id = e.id
            LEFT JOIN paiements p ON c.nupcan = p.nupcan
        `;
        
        const params = [];
        if (concours_id) {
            query += ' WHERE c.concours_id = ?';
            params.push(concours_id);
        }
        
        const [candidats] = await connection.execute(query, params);
        
        // Créer le document PDF
        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=candidats_${Date.now()}.pdf`);
        
        doc.pipe(res);
        
        // Titre
        doc.fontSize(20).text('Liste des Candidats', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
        doc.moveDown(2);
        
        // Table des candidats
        doc.fontSize(10);
        candidats.forEach((candidat, index) => {
            if (index > 0 && index % 10 === 0) {
                doc.addPage();
            }
            
            doc.text(`${index + 1}. ${candidat.nomcan} ${candidat.prncan}`, { continued: false });
            doc.fontSize(8).text(`   NUPCAN: ${candidat.nupcan} | Email: ${candidat.maican}`, { continued: false });
            doc.text(`   Concours: ${candidat.libcnc || 'N/A'} | Filière: ${candidat.nomfil || 'N/A'}`, { continued: false });
            doc.text(`   Établissement: ${candidat.nomets || 'N/A'} | Paiement: ${candidat.statut_paiement || 'en_attente'}`, { continued: false });
            doc.moveDown();
        });
        
        doc.end();
    } catch (error) {
        console.error('Erreur export PDF:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/exports/notes/excel - Export Excel des notes
router.get('/notes/excel', async (req, res) => {
    try {
        const { concours_id } = req.query;
        const connection = getConnection();
        
        let query = `
            SELECT 
                c.nupcan, c.nomcan, c.prncan,
                con.libcnc, m.nommat, m.coefmat,
                n.note
            FROM notes n
            LEFT JOIN participations p ON n.participation_id = p.id
            LEFT JOIN candidats c ON p.candidat_id = c.id
            LEFT JOIN concours con ON p.concours_id = con.id
            LEFT JOIN matieres m ON n.matiere_id = m.id
        `;
        
        const params = [];
        if (concours_id) {
            query += ' WHERE p.concours_id = ?';
            params.push(concours_id);
        }
        
        query += ' ORDER BY c.nomcan, m.nommat';
        
        const [notes] = await connection.execute(query, params);
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Notes');
        
        worksheet.columns = [
            { header: 'NUPCAN', key: 'nupcan', width: 15 },
            { header: 'Nom', key: 'nomcan', width: 20 },
            { header: 'Prénom', key: 'prncan', width: 20 },
            { header: 'Concours', key: 'libcnc', width: 30 },
            { header: 'Matière', key: 'nommat', width: 25 },
            { header: 'Coefficient', key: 'coefmat', width: 12 },
            { header: 'Note', key: 'note', width: 10 }
        ];
        
        notes.forEach(note => {
            worksheet.addRow(note);
        });
        
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
        };
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=notes_${Date.now()}.xlsx`);
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Erreur export notes Excel:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
