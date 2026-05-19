const express = require('express');
const secretariaController = require('../controllers/secretariaController');
const router = express.Router();

router.post('/secretarias', secretariaController.cadastrarSecretaria);
router.get('/secretarias', secretariaController.listarSecretarias);
router.get('/secretarias/:id', secretariaController.getSecretariaById); 
router.put('/secretarias/:id', secretariaController.atualizarSecretaria); 
router.delete('/secretarias/:id', secretariaController.deletarSecretaria);

module.exports = router;