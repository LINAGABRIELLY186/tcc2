const { pool } = require('../config/database');
const projetoService = require('../services/projetoServices');

//LISTAR DECISÃO POR ID
exports.listDecisoesByProjeto = async (req, res) => {
    const { id } = req.params; 

    try {
        const result = await pool.query(
            `SELECT 
                dg.tipo_decisao, 
                dg.data_decisao, 
                dg.observacoes, 
                u.nome AS gestor_nome
             FROM decisao_gabinete dg
             JOIN usuario u ON dg.id_gestor = u.id_user
             WHERE dg.id_projeto = $1
             ORDER BY dg.data_decisao DESC`, 
            [id]
        );
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar decisões do projeto:', error);
        res.status(500).json({ error: 'Erro ao listar decisões.' });
    }
};

//LISTAR TODAS AS DECISÕES
exports.listAllDecisoes = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                dg.data_decisao, 
                dg.tipo_decisao, 
                dg.observacoes, 
                u.nome AS gestor_nome, 
                p.nome AS projeto_nome,
                s.sigla AS secretaria_sigla
             FROM decisao_gabinete dg
             JOIN usuario u ON dg.id_gestor = u.id_user
             JOIN projeto p ON dg.id_projeto = p.id_projeto
             JOIN secretaria s ON p.id_secretaria = s.id_sec
             ORDER BY dg.data_decisao DESC` 
        );
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar todas as decisões:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar decisões.' });
    }
};