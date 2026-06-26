const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_secreto_alves';
const DB_FILE = path.join(__dirname, '../../portfolio.json');

// ==========================================
// CONFIGURAÇÃO DO CLOUDINARY (VIA VARIÁVEIS DE AMBIENTE)
// ==========================================
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Validação das credenciais
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ ERRO: Variáveis de ambiente do Cloudinary não configuradas!');
    console.error('Configure: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
}

// ==========================================
// CONFIGURAÇÃO DO UPLOAD (Memória)
// ==========================================
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas'));
        }
    }
});

// ==========================================
// FUNÇÃO DE UPLOAD PARA CLOUDINARY
// ==========================================
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { 
                folder: 'alves_portfolio',
                resource_type: 'image',
                transformation: [
                    { quality: 'auto', fetch_format: 'auto' }
                ]
            },
            (error, result) => {
                if (error) {
                    console.error('Erro no upload Cloudinary:', error);
                    reject(error);
                } else {
                    resolve(result.secure_url);
                }
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

// ==========================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ==========================================
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Não autorizado - Token ausente' });
    }
    try {
        jwt.verify(token, JWT_SECRET);
        next();
    } catch (e) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

// ==========================================
// BANCO DE DADOS JSON (Local)
// ==========================================
const readDB = () => {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, '[]');
        return [];
    }
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        console.error('Erro ao ler banco:', e);
        return [];
    }
};

const writeDB = (data) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Erro ao escrever banco:', e);
    }
};

// ==========================================
// ROTAS
// ==========================================

// GET: Listar portfólio (Público)
router.get('/', (req, res) => {
    const projects = readDB();
    res.json(projects);
});

// POST: Adicionar projeto (Admin)
router.post('/', authenticate, upload.array('images', 10), async (req, res) => {
    try {
        const { title, category, description } = req.body;
        
        if (!title || !category) {
            return res.status(400).json({ error: 'Título e categoria são obrigatórios' });
        }

        console.log('📸 Iniciando upload de', req.files.length, 'imagens para Cloudinary...');

        const imageUrls = await Promise.all(
            req.files.map(file => uploadToCloudinary(file.buffer))
        );

        console.log('✅ Upload concluído:', imageUrls.length, 'imagens');

        const db = readDB();
        const newProject = {
            id: Date.now().toString(),
            title,
            category,
            description: description || '',
            images: imageUrls,
            createdAt: new Date().toISOString()
        };

        db.push(newProject);
        writeDB(db);
        
        console.log('🎉 Projeto salvo com sucesso:', newProject.id);
        res.status(201).json(newProject);
        
    } catch (error) {
        console.error('❌ Erro no upload:', error);
        res.status(500).json({ 
            error: 'Erro ao fazer upload',
            details: error.message 
        });
    }
});

// DELETE: Remover projeto (Admin)
router.delete('/:id', authenticate, async (req, res) => {
    try {
        let db = readDB();
        const project = db.find(p => p.id === req.params.id);
        
        if (!project) {
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }
        
        if (project.images && project.images.length > 0) {
            console.log('🗑️ Removendo', project.images.length, 'imagens do Cloudinary...');
            
            for (const url of project.images) {
                try {
                    const urlParts = url.split('/');
                    const filename = urlParts[urlParts.length - 1];
                    const publicId = `alves_portfolio/${filename.split('.')[0]}`;
                    
                    await cloudinary.uploader.destroy(publicId);
                    console.log('✅ Imagem removida:', publicId);
                } catch (e) {
                    console.log('⚠️ Erro ao remover imagem:', e.message);
                }
            }
        }
        
        db = db.filter(p => p.id !== req.params.id);
        writeDB(db);
        
        console.log('🗑️ Projeto removido:', req.params.id);
        res.json({ message: 'Projeto removido com sucesso' });
        
    } catch (error) {
        console.error('❌ Erro ao remover:', error);
        res.status(500).json({ error: 'Erro ao remover projeto' });
    }
});

// PUT: Atualizar projeto (Admin)
router.put('/:id', authenticate, upload.array('images', 10), async (req, res) => {
    try {
        const { title, category, description } = req.body;
        let db = readDB();
        const projectIndex = db.findIndex(p => p.id === req.params.id);
        
        if (projectIndex === -1) {
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }

        let newImages = db[projectIndex].images;
        if (req.files && req.files.length > 0) {
            console.log('📸 Atualizando imagens...');
            const uploadedUrls = await Promise.all(
                req.files.map(file => uploadToCloudinary(file.buffer))
            );
            newImages = [...db[projectIndex].images, ...uploadedUrls];
        }

        db[projectIndex] = {
            ...db[projectIndex],
            title: title || db[projectIndex].title,
            category: category || db[projectIndex].category,
            description: description || db[projectIndex].description,
            images: newImages,
            updatedAt: new Date().toISOString()
        };

        writeDB(db);
        res.json(db[projectIndex]);
        
    } catch (error) {
        console.error('❌ Erro ao atualizar:', error);
        res.status(500).json({ error: 'Erro ao atualizar projeto' });
    }
});

module.exports = router;