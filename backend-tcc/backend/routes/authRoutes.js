const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/auth/register', authController.registerUser); 
router.post('/auth/login', authController.login);           
router.get('/users', authController.listUsers); 
router.get('/users/:id', authController.getUserById); 
router.put('/users/:id', authController.updateUser); 
router.delete('/users/:id', authController.deleteUser);

module.exports = router;