const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

// ==> Conexão com a Base de Dados:
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
  //console.log('Base de Dados conectado com sucesso!');
});

// CORREÇÃO: Exporte o 'pool' inteiro para ter acesso a todas as suas funções
module.exports = pool;
