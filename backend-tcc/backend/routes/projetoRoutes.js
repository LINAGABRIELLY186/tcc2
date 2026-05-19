const express = require('express');
const projetoController = require('../controllers/projetoController');
const router = express.Router();
//PROJETOS
router.post('/projetos', projetoController.cadastrarProjeto); 
router.get('/projetos/:id', projetoController.getProjetoById); 
router.get('/projetos', projetoController.listProjetos); 
router.put('/projetos/:id', projetoController.atualizarProjeto); 
router.delete('/projetos/:id', projetoController.deletarProjeto); 

//DECISAO
router.put('/projetos/:id/decisao', projetoController.registrarDecisaoPrefeita);



module.exports = router;