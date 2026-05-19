

const express = require('express');
const cors = require('cors');
const { pool } = require('./config/database');

const secretariaRoutes = require('./routes/secretariaRoutes');
const authRoutes = require('./routes/authRoutes');
const projetoRoutes = require('./routes/projetoRoutes');
const projetoService = require('./services/projetoServices'); 
const decisaoRoutes = require('./routes/decisaoGabineteRoutes');
const etapasProjeto = require('./routes/etapasProjetoRoutes');

const app = express();
const PORT = 3001; 

app.use(cors()); 
app.use(express.json()); 

app.use('/api', secretariaRoutes);
app.use('/api', authRoutes);
app.use('/api', projetoRoutes);
app.use('/api', decisaoRoutes);
app.use('/api', etapasProjeto);

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Erro ao adquirir cliente do pool', err.stack);
    }
    console.log('Conectado com sucesso ao PostgreSQL!');
    release(); 
});

app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
});