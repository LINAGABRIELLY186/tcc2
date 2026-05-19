// /backend/controllers/authController.js

const { pool } = require('../config/database');
// const bcrypt = require('bcryptjs'); // Instalar e usar para segurança

//CADASTRO
exports.registerUser = async (req, res) => {
    const { nome, email, senha, perfil, id_secretaria } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO usuario (nome, email, senha, perfil, id_secretaria)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [nome, email, senha, perfil, id_secretaria] // Use hashedPassword aqui
        );
        res.status(201).json({ message: "Usuário cadastrado com sucesso!", user: result.rows[0] });
    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
    }
};


//LOGIN
exports.login = async (req, res) => {
    const { email, senha } = req.body;

    try {
        const userResult = await pool.query('SELECT * FROM usuario WHERE email = $1', [email]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Email ou senha inválidos.' });
        }
        if (user.senha !== senha) {
            return res.status(401).json({ error: 'Email ou senha inválidos.' });
        }

        res.status(200).json({ message: 'Login realizado com sucesso!', user: user });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro no servidor durante o login.' });
    }
};

//LISTAR TODOS OS USERS
exports.listUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT id_user, nome, email, perfil, id_secretaria FROM usuario ORDER BY nome');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

//LISTAR USER POR ID
exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT id_user, nome, email, perfil, id_secretaria FROM usuario WHERE id_user = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar usuário por ID:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

//ATUALIZAR USER
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { nome, email, senha, perfil, id_secretaria } = req.body;

    let updateQuery = 'UPDATE usuario SET nome = $1, email = $2, perfil = $3, id_secretaria = $4';
    let queryParams = [nome, email, perfil, id_secretaria, id];
    let paramIndex = 5;

    if (senha) {
        updateQuery += `, senha = $${paramIndex}`;
        queryParams.splice(paramIndex - 1, 0, senha); 
        paramIndex++;
    }

    updateQuery += ` WHERE id_user = $${paramIndex} RETURNING id_user, nome, email, perfil, id_secretaria;`; // Adiciona RETURNING sem a senha
    try {
        const result = await pool.query(updateQuery, queryParams);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado para atualização.' });
        }
        res.status(200).json({ message: 'Usuário atualizado com sucesso!', user: result.rows[0] });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

//DELETE USER
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM usuario WHERE id_user = $1 RETURNING id_user', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado para exclusão.' });
        }
        res.status(200).json({ message: 'Usuário deletado com sucesso!', id: result.rows[0].id_user });
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        if (error.code === '23503') { 
            return res.status(409).json({ error: 'Não é possível deletar este usuário, pois ele está vinculado a projetos, andamentos ou decisões.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};