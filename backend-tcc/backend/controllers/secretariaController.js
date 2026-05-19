const { pool } = require('../config/database');

//CADASTRAR SEC
exports.cadastrarSecretaria = async (req, res) => {
    const { nome, email_contato, sigla } = req.body;
    
    try {
        const result = await pool.query(
            `INSERT INTO secretaria (nome, email_contato, sigla)
             VALUES ($1, $2, $3) RETURNING *`,
            [nome, email_contato, sigla]
        );
        res.status(201).json({ message: "Secretaria cadastrada com sucesso!", secretaria: result.rows[0] });
    } catch (error) {
        console.error('Erro ao cadastrar secretaria:', error);
        res.status(500).json({ error: 'Erro ao cadastrar secretaria.' });
    }
};

//LISTAR TODAS AS SEC
exports.listarSecretarias = async (req, res) => {
    try {
        const result = await pool.query('SELECT id_sec, nome, sigla FROM secretaria ORDER BY nome');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar secretarias:', error);
        res.status(500).json({ error: 'Erro ao listar secretarias.' });
    }
};

//LISTAR SEC POR ID 
exports.getSecretariaById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT id_sec, nome, email_contato, sigla FROM secretaria WHERE id_sec = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Secretaria não encontrada.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar secretaria por ID:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

//ATUALIZAR SEC
exports.atualizarSecretaria = async (req, res) => {
    const { id } = req.params;
    const { nome, email_contato, sigla } = req.body;
    try {
        const result = await pool.query(
            'UPDATE secretaria SET nome = $1, email_contato = $2, sigla = $3 WHERE id_sec = $4 RETURNING *',
            [nome, email_contato, sigla, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Secretaria não encontrada para atualização.' });
        }
        res.status(200).json({ message: 'Secretaria atualizada com sucesso!', secretaria: result.rows[0] });
    } catch (error) {
        console.error('Erro ao atualizar secretaria:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

//DELETE SEC
exports.deletarSecretaria = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM secretaria WHERE id_sec = $1 RETURNING id_sec', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Secretaria não encontrada para exclusão.' });
        }
        res.status(200).json({ message: 'Secretaria deletada com sucesso!', id: result.rows[0].id_sec });
    } catch (error) {
        console.error('Erro ao deletar secretaria:', error);
        // Em caso de Foreign Key constraint (projeto, usuario, parceria dependem dela)
        if (error.code === '23503') { 
            return res.status(409).json({ error: 'Não é possível deletar esta secretaria, pois há projetos, usuários ou parcerias vinculados a ela.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};