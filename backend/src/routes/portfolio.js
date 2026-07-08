const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_secreto_alves';
const DB_FILE = path.join(__dirname, '../../data/portfolio.json');
const dataDir = path.join(__dirname, '../../data');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// ==========================================
// CONFIGURAÇÃO DO CLOUDINARY
// ==========================================
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ ERRO: Variáveis de ambiente do Cloudinary não configuradas!');
}

// ==========================================
// CONFIGURAÇÃO DO UPLOAD
// ==========================================
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas'));
        }
    }
});

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

// Upload para Cloudinary
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { 
                folder: 'alves_portfolio',
                resource_type: 'image',
                transformation: [{ quality: 'auto', fetch_format: 'auto' }]
            },
            (error, result) => {
                if (error) {
                    console.error('Erro no upload Cloudinary:', error);
                    reject(error);
                } else {
                    resolve({
                        url: result.secure_url,
                        public_id: result.public_id
                    });
                }
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

// Extrair public_id da URL do Cloudinary
const extractPublicId = (url) => {
    try {
        const urlParts = url.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        
        if (uploadIndex === -1) return null;
        
        let publicId = urlParts.slice(uploadIndex + 2).join('/');
        publicId = publicId.replace(/\.[^/.]+$/, '');
        return publicId;
    } catch (e) {
        console.error('Erro ao extrair public_id:', e);
        return null;
    }
};

// Deletar imagem do Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log(`🗑️ Cloudinary delete ${publicId}:`, result.result);
        return result.result === 'ok';
    } catch (e) {
        console.error('Erro ao deletar do Cloudinary:', e);
        return false;
    }
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
        res.status(401).json({ error: 'Token inválido ou expirado' });
    }
};

// ==========================================
// BANCO DE DADOS JSON
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
// ROTAS CRUD
// ==========================================

// GET: Listar projetos (Público) - Com paginação e filtros
router.get('/', (req, res) => {
    try {
        const projects = readDB();
        
        // Filtros
        const { category, search, page = 1, limit = 10 } = req.query;
        let filteredProjects = projects;
        
        if (category) {
            filteredProjects = filteredProjects.filter(p => 
                p.category.toLowerCase() === category.toLowerCase()
            );
        }
        
        if (search) {
            const searchTerm = search.toLowerCase();
            filteredProjects = filteredProjects.filter(p => 
                p.title.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm)
            );
        }
        
        // Ordenar por data (mais recente primeiro)
        filteredProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Paginação
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedProjects = filteredProjects.slice(startIndex, endIndex);
        
        res.json({
            projects: paginatedProjects,
            pagination: {
                total: filteredProjects.length,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(filteredProjects.length / limitNum)
            }
        });
    } catch (error) {
        console.error('Erro ao listar projetos:', error);
        res.status(500).json({ error: 'Erro ao listar projetos' });
    }
});

// GET: Buscar projeto por ID (Público)
router.get('/:id', (req, res) => {
    try {
        const projects = readDB();
        const project = projects.find(p => p.id === req.params.id);
        
        if (!project) {
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }
        
        res.json(project);
    } catch (error) {
        console.error('Erro ao buscar projeto:', error);
        res.status(500).json({ error: 'Erro ao buscar projeto' });
    }
});

// POST: Criar projeto (Admin)
router.post('/', authenticate, upload.array('images', 10), async (req, res) => {
    try {
        const { title, category, description } = req.body;
        
        if (!title || !category) {
            return res.status(400).json({ error: 'Título e categoria são obrigatórios' });
        }
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Pelo menos uma imagem é obrigatória' });
        }

        console.log('📸 Iniciando upload de', req.files.length, 'imagens...');

        const uploadedImages = await Promise.all(
            req.files.map(file => uploadToCloudinary(file.buffer))
        );

        console.log('✅ Upload concluído:', uploadedImages.length, 'imagens');

        const db = readDB();
        const newProject = {
            id: Date.now().toString(),
            title,
            category,
            description: description || '',
            images: uploadedImages.map(img => img.url),
            createdAt: new Date().toISOString()
        };

        db.push(newProject);
        writeDB(db);
        
        console.log('🎉 Projeto criado:', newProject.id);
        res.status(201).json(newProject);
        
    } catch (error) {
        console.error('❌ Erro ao criar projeto:', error);
        res.status(500).json({ 
            error: 'Erro ao criar projeto',
            details: error.message 
        });
    }
});

// PUT: Atualizar projeto (Admin) - Substitui imagens se enviadas
router.put('/:id', authenticate, upload.array('images', 10), async (req, res) => {
    try {
        const { title, category, description, replaceImages } = req.body;
        const db = readDB();
        const projectIndex = db.findIndex(p => p.id === req.params.id);
        
        if (projectIndex === -1) {
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }

        const project = db[projectIndex];
        let updatedImages = [...project.images];

        // Se enviou novas imagens
        if (req.files && req.files.length > 0) {
            console.log('📸 Processando novas imagens...');
            
            // Se replaceImages = true, deleta as antigas
            if (replaceImages === 'true' || replaceImages === true) {
                console.log('🗑️ Substituindo imagens antigas...');
                for (const url of project.images) {
                    const publicId = extractPublicId(url);
                    if (publicId) {
                        await deleteFromCloudinary(publicId);
                    }
                }
                updatedImages = [];
            }
            
            // Upload das novas imagens
            const uploadedImages = await Promise.all(
                req.files.map(file => uploadToCloudinary(file.buffer))
            );
            
            updatedImages = [...updatedImages, ...uploadedImages.map(img => img.url)];
        }

        // Atualizar projeto
        db[projectIndex] = {
            ...project,
            title: title || project.title,
            category: category || project.category,
            description: description !== undefined ? description : project.description,
            images: updatedImages,
            updatedAt: new Date().toISOString()
        };

        writeDB(db);
        console.log('✅ Projeto atualizado:', req.params.id);
        res.json(db[projectIndex]);
        
    } catch (error) {
        console.error('❌ Erro ao atualizar:', error);
        res.status(500).json({ error: 'Erro ao atualizar projeto' });
    }
});

// DELETE: Remover projeto (Admin) - Deleta imagens do Cloudinary
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const db = readDB();
        const projectIndex = db.findIndex(p => p.id === req.params.id);
        
        if (projectIndex === -1) {
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }
        
        const project = db[projectIndex];
        
        // Deletar imagens do Cloudinary
        if (project.images && project.images.length > 0) {
            console.log('🗑️ Removendo', project.images.length, 'imagens do Cloudinary...');
            
            for (const url of project.images) {
                const publicId = extractPublicId(url);
                if (publicId) {
                    await deleteFromCloudinary(publicId);
                }
            }
        }
        
        // Remover do banco
        db.splice(projectIndex, 1);
        writeDB(db);
        
        console.log('🗑️ Projeto removido:', req.params.id);
        res.json({ message: 'Projeto e imagens removidos com sucesso' });
        
    } catch (error) {
        console.error('❌ Erro ao remover:', error);
        res.status(500).json({ error: 'Erro ao remover projeto' });
    }
});

// DELETE: Remover imagem específica (Admin)
router.delete('/:id/images/:imageIndex', authenticate, async (req, res) => {
    try {
        const db = readDB();
        const projectIndex = db.findIndex(p => p.id === req.params.id);
        
        if (projectIndex === -1) {
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }
        
        const project = db[projectIndex];
        const imageIndex = parseInt(req.params.imageIndex);
        
        if (imageIndex < 0 || imageIndex >= project.images.length) {
            return res.status(400).json({ error: 'Índice de imagem inválido' });
        }
        
        const imageUrl = project.images[imageIndex];
        
        // Deletar do Cloudinary
        const publicId = extractPublicId(imageUrl);
        if (publicId) {
            await deleteFromCloudinary(publicId);
        }
        
        // Remover do array
        project.images.splice(imageIndex, 1);
        project.updatedAt = new Date().toISOString();
        
        db[projectIndex] = project;
        writeDB(db);
        
        console.log('🗑️ Imagem removida:', imageUrl);
        res.json({ 
            message: 'Imagem removida com sucesso',
            project 
        });
        
    } catch (error) {
        console.error('❌ Erro ao remover imagem:', error);
        res.status(500).json({ error: 'Erro ao remover imagem' });
    }
});

module.exports = router;