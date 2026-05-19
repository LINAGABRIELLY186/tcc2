
const express = require('express');
const decisaoGabineteController = require('../controllers/decisaoGabineteController'); 
const router = express.Router();


router.get('/projetos/:id/decisoes', decisaoGabineteController.listDecisoesByProjeto);


router.get('/decisoes', decisaoGabineteController.listAllDecisoes); 

module.exports = router;