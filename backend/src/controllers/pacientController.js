const db = require("../config/db");

// GET - Exibir todos os pacientes
exports.showPacientes = async (req, res) => {
  try {
    console.log("Buscando pacientes...");
    const response = await db.query("SELECT * FROM paciente ORDER BY nomep");
    console.log(`Encontrados ${response.rows.length} pacientes.`);
    res.status(200).send(response.rows);
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error);
    res.status(500).send("Erro ao buscar pacientes");
  }
};

// POST - Adicionar paciente
exports.addPaciente = async (req, res) => {
  try {
    const { codigop, cpf, nomep, endereco, idade, sexo, telefone } = req.body;

    if (
      !codigop ||
      !cpf ||
      !nomep ||
      !endereco ||
      !idade ||
      !sexo ||
      !telefone
    ) {
      return res.status(400).send("Todos os campos são obrigatórios");
    }

    const response = await db.query(
      `INSERT INTO paciente (codigop, cpf, nomep, endereco, idade, sexo, telefone)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [codigop, cpf, nomep, endereco, idade, sexo, telefone]
    );

    res.status(201).send(response.rows[0]);
  } catch (error) {
    console.error("Erro ao adicionar paciente:", error);
    res.status(500).send("Erro ao adicionar paciente");
  }
};

// PUT - Atualizar paciente
exports.updatePaciente = async (req, res) => {
  try {
    const { codigop } = req.params;
    const { cpf, nomep, endereco, idade, sexo, telefone } = req.body;

    const response = await db.query(
      `UPDATE paciente
       SET cpf = $1, nomep = $2, endereco = $3, idade = $4, sexo = $5, telefone = $6
       WHERE codigop = $7
       RETURNING *`,
      [cpf, nomep, endereco, idade, sexo, telefone, codigop]
    );

    if (response.rowCount === 0) {
      return res.status(404).send("Paciente não encontrado");
    }

    res.status(200).send(response.rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar paciente:", error);
    res.status(500).send("Erro ao atualizar paciente");
  }
};

// DELETE - Deletar paciente
exports.deletePaciente = async (req, res) => {
  try {
    const { codigop } = req.params;

    const result = await db.query("DELETE FROM paciente WHERE codigop = $1", [
      codigop,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).send("Paciente não encontrado");
    }

    res.status(200).send();
  } catch (error) {
    console.error("Erro ao deletar paciente:", error);
    res.status(500).send();
  }
};
