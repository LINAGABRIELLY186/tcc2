const { pool } = require('../config/database');


exports.cadastrarEtapa = async (req, res) => {
    const { idProjeto } = req.params;
    const { nome_etapa, descricao, data_inicio_prevista, data_fim_prevista, responsavel_etapa } = req.body;
    
    try {
        const result = await pool.query(
            `INSERT INTO etapa_projeto (id_projeto, nome_etapa, descricao, data_inicio_prevista, data_fim_prevista, responsavel_etapa)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [idProjeto, nome_etapa, descricao, data_inicio_prevista, data_fim_prevista, responsavel_etapa]
        );
        res.status(201).json({ message: "Etapa cadastrada com sucesso!", etapa: result.rows[0] });
    } catch (error) {
        console.error('Erro ao cadastrar etapa:', error);
        res.status(500).json({ error: 'Erro ao cadastrar etapa.', details: error.detail });
    }
};


exports.listarEtapasPorProjeto = async (req, res) => {
    const { idProjeto } = req.params;
    try {
        const result = await pool.query(
            `SELECT ep.*, u.nome AS nome_responsavel
             FROM etapa_projeto ep
             JOIN usuario u ON ep.responsavel_etapa = u.id_user
             WHERE ep.id_projeto = $1
             ORDER BY ep.data_fim_prevista ASC`,
            [idProjeto]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar etapas:', error);
        res.status(500).json({ error: 'Erro ao listar etapas.' });
    }
};


exports.atualizarEtapa = async (req, res) => {
    const { idEtapa } = req.params;
    const { nome_etapa, descricao, data_fim_prevista, status_etapa, percentual_conclusao, data_inicio_real, data_fim_real } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE etapa_projeto 
             SET nome_etapa = $1, descricao = $2, data_fim_prevista = $3, status_etapa = $4, 
                 percentual_conclusao = $5, data_inicio_real = $6, data_fim_real = $7
             WHERE id_etapa = $8 RETURNING *`,
            [nome_etapa, descricao, data_fim_prevista, status_etapa, percentual_conclusao, data_inicio_real, data_fim_real, idEtapa]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Etapa não encontrada.' });
        }
        res.status(200).json({ message: 'Etapa atualizada com sucesso!', etapa: result.rows[0] });
    } catch (error) {
        console.error('Erro ao atualizar etapa:', error);
        res.status(500).json({ error: 'Erro interno ao atualizar etapa.' });
    }
};


exports.deletarEtapa = async (req, res) => {
    const { idEtapa } = req.params;
    try {
        const result = await pool.query('DELETE FROM etapa_projeto WHERE id_etapa = $1 RETURNING id_etapa', [idEtapa]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Etapa não encontrada para exclusão.' });
        }
        res.status(200).json({ message: 'Etapa deletada com sucesso!', id: result.rows[0].id_etapa });
    } catch (error) {
        console.error('Erro ao deletar etapa:', error);
        res.status(500).json({ error: 'Erro interno ao deletar etapa.' });
    }
};