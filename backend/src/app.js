const express = require("express");
const cors = require("cors");

const app = express();

// Middleware de log para depuração
app.use((req, res, next) => {
  console.log(`Recebida requisição: ${req.method} ${req.url}`);
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.json({ type: "application/vnd.api+json" }));
app.use(cors());

const productRoute = require("./routes/routes");
app.use("/", productRoute);

// Rota de fallback para erro 404
app.use((req, res) => {
  console.log(`Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).send("Rota não encontrada");
});

module.exports = app;
