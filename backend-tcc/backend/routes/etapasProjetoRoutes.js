const express = require('express');
const etapaProjetoController = require('../controllers/etapasProjetoController');
const router = express.Router();


router.post('/projetos/:idProjeto/etapas', etapaProjetoController.cadastrarEtapa);
router.get('/projetos/:idProjeto/etapas', etapaProjetoController.listarEtapasPorProjeto);
router.put('/etapas/:idEtapa', etapaProjetoController.atualizarEtapa);
router.delete('/etapas/:idEtapa', etapaProjetoController.deletarEtapa);

module.exports = router;