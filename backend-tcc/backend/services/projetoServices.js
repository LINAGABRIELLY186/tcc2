const { pool } = require('../config/database');

exports.registrarDecisao = async (
    id_projeto,
    tipo_decisao,
    status_execucao,
    observacoes,
    id_gestor
) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        
        const updateProjetoQuery = `
            UPDATE projeto
            SET status_aprovacao = $1,  
                status = $2  -- AGORA RECEBE O VALOR CALCULADO DO NODE.JS
            WHERE id_projeto = $3
            RETURNING *;
        `;
        const projetoResult = await client.query(
            updateProjetoQuery,
            [tipo_decisao, status_execucao, id_projeto] 
        );

        
        const insertDecisaoQuery = `
            INSERT INTO decisao_gabinete (tipo_decisao, data_decisao, observacoes, id_gestor, id_projeto)
            VALUES ($1, NOW(), $2, $3, $4)
            RETURNING *;
        `;
        await client.query(
            insertDecisaoQuery,
            [tipo_decisao, observacoes, id_gestor, id_projeto] 
        );

        await client.query('COMMIT');
        return projetoResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};