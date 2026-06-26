const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARES
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// ROTAS
// ==========================================

// Health Check (Teste de saúde da API)
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        message: '🚀 API do Alves está no ar!',
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Rota raiz (Informações básicas)
app.get('/', (req, res) => {
    res.json({
        name: 'API Acabamento Premium',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            orcamento: '/api/orcamento (POST)'
        }
    });
});

// Receber orçamento (Futuro: salvar no banco ou mandar pro WhatsApp)
app.post('/api/orcamento', (req, res) => {
    const { nome, telefone, servico, mensagem } = req.body;
    
    // Validação básica
    if (!nome || !telefone || !servico) {
        return res.status(400).json({ 
            error: 'Campos obrigatórios: nome, telefone, servico' 
        });
    }

    // Aqui no futuro você vai:
    // 1. Salvar no banco de dados (MongoDB/PostgreSQL)
    // 2. Enviar para o WhatsApp via API
    // 3. Enviar email de notificação
    
    console.log('✅ Novo orçamento recebido:', req.body);
    
    res.status(201).json({ 
        message: 'Orçamento recebido com sucesso!',
        data: { nome, telefone, servico },
        timestamp: new Date().toISOString()
    });
});

// Rota para listar serviços (Futuro: buscar do banco)
app.get('/api/servicos', (req, res) => {
    const servicos = [
        {
            id: 1,
            nome: 'Pintura Profissional',
            descricao: 'Pintura residencial, comercial e de fachadas',
            categoria: 'pintura'
        },
        {
            id: 2,
            nome: 'Gesso e Drywall',
            descricao: 'Forros, sancas, nichos e divisórias',
            categoria: 'gesso'
        },
        {
            id: 3,
            nome: 'Acabamentos Especiais',
            descricao: 'Massa corrida, texturas e revestimentos decorativos',
            categoria: 'acabamento'
        }
    ];
    
    res.status(200).json(servicos);
});

// ==========================================
// TRATAMENTO DE ERROS
// ==========================================
app.use((err, req, res, next) => {
    console.error('❌ Erro:', err.stack);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: err.message 
    });
});

// Rota 404 (Não encontrado)
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Rota não encontrada',
        path: req.path 
    });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor Node.js rodando na porta ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🎨 API Acabamento Premium - Alves Costa`);
});