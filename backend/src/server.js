const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// 🎨 SERVE ARQUIVOS ESTÁTICOS (seu site HTML)
app.use(express.static(path.join(__dirname, '../public')));

// ⚙️ ROTAS DA API
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Criar pasta de uploads se não existir (fallback local)
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 🎯 Rota para o admin.html
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// 🎯 Para qualquer rota não-API, serve o index.html (SPA fallback)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📁 Servindo site da pasta: ${path.join(__dirname, '../public')}`);
});