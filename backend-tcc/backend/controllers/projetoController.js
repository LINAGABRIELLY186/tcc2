const { pool } = require('../config/database');
const projetoService = require('../services/projetoServices');
//CADASTRAR PROJETO
exports.cadastrarProjeto = async (req, res) => {
  const { nome, objetivo, prazo, custo_previsto, id_responsavel, id_secretaria, id_secretaria_parceira } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Salva o projeto
    const projetoRes = await client.query(
      `INSERT INTO projeto (nome, objetivo, prazo, custo_previsto, id_responsavel, id_secretaria, status, status_aprovacao)
       VALUES ($1, $2, $3, $4, $5, $6, 'Em Planejamento', 'Pendente Aprovação') RETURNING id_projeto`,
      [nome, objetivo, prazo, custo_previsto, id_responsavel, id_secretaria]
    );

    const novoProjetoId = projetoRes.rows[0].id_projeto;

    // 2. SALVA NA TABELA PARCERIA (A parte que está faltando!)
    if (id_secretaria_parceira) {
      await client.query(
        `INSERT INTO parceria (id_projeto, id_secretaria) VALUES ($1, $2)`,
        [novoProjetoId, id_secretaria_parceira]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Projeto criado com sucesso!' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Erro ao salvar projeto.' });
  } finally {
    client.release();
  }
};

//LISTAR POR ID 
exports.getProjetoById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT 
                p.*, 
                s.nome AS nome_secretaria, 
                u.nome AS nome_responsavel
            FROM projeto p
            JOIN secretaria s ON p.id_secretaria = s.id_sec
            JOIN usuario u ON p.id_responsavel = u.id_user
            WHERE p.id_projeto = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Projeto não encontrado.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar projeto:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

//LISTAR TODOS
exports.listProjetos = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.*, 
                u.nome as responsavel_nome, 
                s.sigla as secretaria_sigla,
                -- Pegamos o ID da secretaria parceira diretamente via JOIN
                COALESCE(par.id_secretaria, 0) as id_secretaria_parceira,
                -- Pegamos também a SIGLA da parceira para a prefeita ver quem é
                s2.sigla as parceria_sigla
            FROM projeto p
            LEFT JOIN usuario u ON p.id_responsavel = u.id_user
            LEFT JOIN secretaria s ON p.id_secretaria = s.id_sec
            -- Join com a tabela de parceria
            LEFT JOIN parceria par ON p.id_projeto = par.id_projeto
            -- Join com a tabela de secretaria de novo para pegar a sigla da parceira
            LEFT JOIN secretaria s2 ON par.id_secretaria = s2.id_sec
            ORDER BY p.prazo DESC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar projetos:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

//ATUALIZAR PROJETO
exports.atualizarProjeto = async (req, res) => {
    const { id } = req.params;
    const { 
        nome, objetivo, prazo, status, custo_previsto, 
        id_responsavel, id_secretaria, id_secretaria_parceira, status_aprovacao 
    } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Antes de atualizar, vamos descobrir quem é o dono original
        const projetoAtual = await client.query('SELECT id_secretaria FROM projeto WHERE id_projeto = $1', [id]);
        if (projetoAtual.rows.length === 0) throw new Error('Projeto não encontrado');
        
        const idSecretariaOriginal = projetoAtual.rows[0].id_secretaria;

        // 2. Atualiza o projeto
        // IMPORTANTE: Se não for a prefeita, usamos o idSecretariaOriginal para garantir que o dono não mude
        await client.query(
            `UPDATE projeto 
             SET nome = $1, objetivo = $2, prazo = $3, status = $4, 
                 custo_previsto = $5, id_responsavel = $6, id_secretaria = $7, 
                 status_aprovacao = $8
             WHERE id_projeto = $9`,
            [nome, objetivo, prazo, status, custo_previsto, id_responsavel, idSecretariaOriginal, status_aprovacao, id]
        );

        // 3. Atualiza a Parceria (isso mantém o projeto visível para a parceira)
        await client.query(`DELETE FROM parceria WHERE id_projeto = $1`, [id]);
        if (id_secretaria_parceira && id_secretaria_parceira !== "none") {
            await client.query(
                `INSERT INTO parceria (id_projeto, id_secretaria) VALUES ($1, $2)`,
                [id, id_secretaria_parceira]
            );
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Projeto atualizado sem alterar o dono original!' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar projeto.' });
    } finally {
        client.release();
    }
};

//DELETAR PROJETO
exports.deletarProjeto = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM projeto WHERE id_projeto = $1 RETURNING id_projeto', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Projeto não encontrado para exclusão.' });
        }
        res.status(200).json({ message: 'Projeto deletado com sucesso!', id: result.rows[0].id_projeto });
    } catch (error) {
        console.error('Erro ao deletar projeto:', error);
        if (error.code === '23503') { 
            return res.status(409).json({ error: 'Não é possível deletar este projeto, pois ele está vinculado a andamentos, decisões, parcerias ou indicadores.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};



exports.registrarDecisaoPrefeita = async (req, res) => {
    const { id } = req.params; 
    const { tipo_decisao, observacoes, id_gestor } = req.body; 
    const idProjetoInt = parseInt(id); 

    const statusExecucao = (tipo_decisao === 'Aprovado') ? 'Em Execução' : 'Concluído';
   
    const idGestorInt = parseInt(id_gestor); 

    
    if (isNaN(idProjetoInt) || isNaN(idGestorInt)) {
        return res.status(400).json({ error: 'ID do Projeto ou do Gestor inválido.' });
    }

    try {
        const projetoAtualizado = await projetoService.registrarDecisao(
            idProjetoInt,
            tipo_decisao,
            statusExecucao, 
            observacoes,
            idGestorInt
        );
        res.status(200).json({ 
            message: `Projeto ${tipo_decisao.toLowerCase()} !`, 
            projeto: projetoAtualizado 
        });
    } catch (error) {
        console.error('Erro ao registrar decisão da Prefeita:', error);
        res.status(500).json({ error: error.message || 'Erro interno do servidor ao registrar decisão.' });
    }
};