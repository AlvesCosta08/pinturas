const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// SENHA DO ADMIN (Altere para a sua senha real)
const ADMIN_PASSWORD = 'alves2024'; 

// ✅ CORREÇÃO: Agora usa a variável de ambiente, igual ao portfolio.js
const JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_secreto_alves';

router.post('/login', async (req, res) => {
    const { password } = req.body;

    if (!password) return res.status(400).json({ error: 'Senha obrigatória' });

    // Verifica a senha (em produção, use bcrypt.compare com hash do banco)
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Gera o token com o mesmo segredo
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
});

module.exports = router;