const db = require("../config/database");

// controller.js

exports.showMedicos = async (req, res) => {
  try {
    const query = `
      SELECT 
        m.crm, 
        m.nomem, 
        m.telefone, 
        m.percentual, 
        STRING_AGG(e.nomee, ', ') AS especialidades
      FROM 
        medico m
      LEFT JOIN 
        exerceesp ee ON m.crm = ee.idmedico
      LEFT JOIN 
        especialidade e ON ee.idespecial = e.codigo
      GROUP BY 
        m.crm, m.nomem, m.telefone, m.percentual
      ORDER BY
        m.crm DESC; -- AQUI ESTÁ A MUDANÇA: Ordena por CRM do maior para o menor
    `;

    const response = await db.query(query);
    res.status(200).send(response.rows);
  } catch (error) {
    console.error("Erro ao buscar medicos:", error);
    res.status(500).send("Erro ao buscar medicos");
  }
};
// POST - Adicionar medico
// FUNÇÃO ATUALIZADA - Adicionar Médico
exports.addMedico = async (req, res) => {
  // Padronizando para receber nomem, igual ao banco de dados
  const { nomem, crm, telefone, percentual, especialidade } = req.body.dados;

  if (!nomem || !crm || !especialidade) {
    return res.status(400).send({
      message: "Nome, CRM e Código da Especialidade são obrigatórios.",
    });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN"); // Inicia a transação

    // 1. Insere na tabela Medico e retorna o médico criado
    const medicoQuery = `
        INSERT INTO Medico (crm, nomem, telefone, percentual) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *
    `; // Adicionado RETURNING *
    const medicoValues = [crm, nomem, telefone, percentual];
    const novoMedicoResult = await client.query(medicoQuery, medicoValues);
    const medicoCriado = novoMedicoResult.rows[0];

    // 2. Insere na tabela ExerceEsp para vincular a especialidade
    const exerceEspQuery =
      "INSERT INTO ExerceEsp (idMedico, idEspecial) VALUES ($1, $2)";
    const exerceEspValues = [crm, especialidade];
    await client.query(exerceEspQuery, exerceEspValues);

    await client.query("COMMIT"); // Finaliza a transação

    // A API agora retorna o objeto completo do médico que foi criado
    res.status(201).send(medicoCriado);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao adicionar médico:", error);
    // Verifica se é erro de chave duplicada (CRM já existe)
    if (error.code === "23505") {
      return res
        .status(409)
        .send({ message: "O CRM informado já está cadastrado." });
    }
    res.status(500).send({ message: "Erro interno ao adicionar médico." });
  } finally {
    client.release();
  }
};

// FUNÇÃO ATUALIZADA - Atualizar Médico
exports.updateMedico = async (req, res) => {
  // O CRM original vem dos parâmetros da URL (ex: /medicos/102)
  const originalCrm = req.params.crm;

  // Os novos dados (incluindo o novo CRM) vêm do corpo da requisição
  const { crm: novoCrm, nomem, telefone, percentual } = req.body.dados;

  try {
    const response = await db.query(
      `-- A query agora atualiza o próprio CRM
       UPDATE medico 
       SET 
         crm = $1,          -- O novo CRM
         nomem = $2, 
         telefone = $3, 
         percentual = $4
       WHERE 
         crm = $5;          -- Condição com o CRM original
      `,
      [novoCrm, nomem, telefone, percentual, originalCrm] // A ordem dos parâmetros deve bater com a query
    );

    if (response.rowCount === 0) {
      return res
        .status(404)
        .send({ message: "Médico não encontrado com o CRM original." });
    }

    // Retorna o objeto com os dados já atualizados
    res.status(200).send({ crm: novoCrm, nomem, telefone, percentual });
  } catch (error) {
    console.error("Erro ao atualizar medico:", error);
    // Erro comum se o novo CRM já existir
    if (error.code === "23505") {
      return res
        .status(409)
        .send({ message: "O novo CRM informado já pertence a outro médico." });
    }
    res.status(500).send("Erro ao atualizar medico");
  }
};

exports.showAgendaPorMedicos = async (req, res) => {
  try {
    const { crm } = req.body;
    const response = await db.query("SELECT * FROM agenda WHERE idm = $1", [
      crm,
    ]);

    res.status(200).send(response.rows);
  } catch (error) {
    console.error("Erro ao buscar agenda:", error);
    res.status(500).send("Erro ao buscar agenda");
  }
};
exports.showAgendaPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.body;
    const response = await db.query(
      "SELECT * FROM consulta WHERE codigo = $1",
      [codigo]
    );

    res.status(200).send(response.rows);
  } catch (error) {
    console.error("Erro ao buscar agenda:", error);
    res.status(500).send("Erro ao buscar agenda");
  }
};

exports.agendar = async (req, res) => {
  try {
    const { dadosAgenda } = req.body;

    // Primeiro, consultamos o último código da tabela consulta
    var ultimoCodigoResult = await db.query(
      "SELECT MAX(codigo) as ultimo_codigo FROM consulta"
    );

    // Se não houver registros, começamos com 1, caso contrário incrementamos
    const ultimoCodigo = ultimoCodigoResult.rows[0]?.ultimo_codigo || 0;
    const codigoConsulta = ultimoCodigo + 1;

    console.log(dadosAgenda);

    if (
      !dadosAgenda.horainic ||
      !dadosAgenda.horafim ||
      !dadosAgenda.diasemana ||
      !dadosAgenda.crm
    ) {
      return res.status(400).send("Todos os campos são obrigatórios");
    }

    const response1 = await db.query(
      "INSERT INTO consulta (codigo, horainic, horafim, data, idpaciente, idespecial, idmedico, valorpago, pagou, formapagamento) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
      [
        codigoConsulta,
        dadosAgenda.horainic,
        dadosAgenda.horafim,
        dadosAgenda.data,
        dadosAgenda.idpaciente,
        dadosAgenda.idespecial,
        dadosAgenda.crm,
        dadosAgenda.valorpago,
        dadosAgenda.pagou,
        dadosAgenda.formapagamento,
      ]
    );

    const response2 = await db.query(
      "INSERT INTO agenda (idagenda, horainicio, horafim, diasemana, idm) VALUES ($1, $2, $3, $4, $5)",
      [
        codigoConsulta,
        dadosAgenda.horainic,
        dadosAgenda.horafim,
        dadosAgenda.diasemana,
        dadosAgenda.crm,
      ]
    );

    console.log(response1);
    console.log(response2);

    res.status(200).send({ codigoConsulta });
  } catch (error) {
    console.error("Erro ao agendar:", error);
    res.status(500).send("Erro ao agendar");
  }
};

exports.atualizarAgenda = async (req, res) => {
  try {
    const { dadosAgenda } = req.body;
    console.log("Dados recebidos para atualização:", dadosAgenda);

    // Validações básicas
    if (!dadosAgenda.codigo) {
      return res
        .status(400)
        .send({ error: "Código da consulta é obrigatório" });
    }

    // Query para atualizar apenas a tabela consulta
    const queryConsulta = `
      UPDATE consulta 
      SET horainic = $1, 
          horafim = $2, 
          data = $3, 
          idpaciente = $4, 
          idespecial = $5, 
          idmedico = $6, 
          valorpago = $7, 
          pagou = $8, 
          formapagamento = $9 
      WHERE codigo = $10
    `;

    // Executar update na tabela consulta
    const responseConsulta = await db.query(queryConsulta, [
      dadosAgenda.horainic,
      dadosAgenda.horafim,
      dadosAgenda.data,
      dadosAgenda.idpaciente,
      dadosAgenda.idespecial,
      dadosAgenda.idmedico,
      dadosAgenda.valorpago,
      dadosAgenda.pagou,
      dadosAgenda.formapagamento,
      dadosAgenda.codigo,
    ]);

    console.log("Update consulta realizado:", responseConsulta.rowCount);

    // Só atualizar agenda se temos diasemana
    let agendaUpdated = false;
    if (dadosAgenda.diasemana !== undefined && dadosAgenda.diasemana !== null) {
      try {
        const queryAgenda = `
          UPDATE agenda 
          SET horainicio = $1, 
              horafim = $2, 
              diasemana = $3, 
              idm = $4 
          WHERE idagenda = $5
        `;

        const responseAgenda = await db.query(queryAgenda, [
          dadosAgenda.horainic,
          dadosAgenda.horafim,
          dadosAgenda.diasemana,
          dadosAgenda.idmedico,
          dadosAgenda.codigo,
        ]);

        agendaUpdated = responseAgenda.rowCount > 0;
        console.log("Update agenda realizado:", responseAgenda.rowCount);
      } catch (agendaError) {
        console.log(
          "Erro ao atualizar agenda (ignorado):",
          agendaError.message
        );
      }
    }

    // Verificar se pelo menos a consulta foi atualizada
    if (responseConsulta.rowCount === 0) {
      return res.status(404).send({
        error: "Consulta não encontrada ou nenhum dado foi alterado",
      });
    }

    // Retornar sucesso
    res.status(200).send({
      success: true,
      message: "Consulta atualizada com sucesso",
      consultaUpdated: responseConsulta.rowCount > 0,
      agendaUpdated: agendaUpdated,
    });
  } catch (error) {
    console.error("Erro ao atualizar consulta:", error);

    res.status(500).send({
      error: "Erro interno do servidor ao atualizar consulta",
      details: error.message,
    });
  }
};

// ESPECIALIDADES
exports.showEspecialidades = async (req, res) => {
  try {
    console.log("Acessando showEspecialidades");
    const response = await db.query(
      "SELECT * FROM especialidade ORDER BY nomee"
    );
    console.log("Dados encontrados:", response.rows.length);
    res.status(200).send(response.rows);
  } catch (error) {
    console.error("Erro detalhado:", error);
    res.status(500).send("Erro ao buscar especialidades");
  }
};

exports.addEspecialidade = async (req, res) => {
  try {
    const { codigo, nomee, indice } = req.body;

    if (!codigo || !nomee || !indice) {
      return res.status(400).send("Todos os campos são obrigatórios");
    }

    const response = await db.query(
      "INSERT INTO especialidade (codigo, nomee, indice) VALUES ($1, $2, $3) RETURNING *",
      [codigo, nomee, indice]
    );

    res.status(201).send(response.rows[0]);
  } catch (error) {
    console.error("Erro ao adicionar especialidade:", error);
    res.status(500).send("Erro ao adicionar especialidade");
  }
};

exports.updateEspecialidade = async (req, res) => {
  try {
    const { codigo } = req.params;
    const { nomee, indice } = req.body;

    const response = await db.query(
      "UPDATE especialidade SET nomee = $1, indice = $2 WHERE codigo = $3 RETURNING *",
      [nomee, indice, codigo]
    );

    if (response.rowCount === 0) {
      return res.status(404).send("Especialidade não encontrada");
    }

    res.status(200).send(response.rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar especialidade:", error);
    res.status(500).send("Erro ao atualizar especialidade");
  }
};

exports.deleteEspecialidade = async (req, res) => {
  try {
    const { codigo } = req.params;
    await db.query("DELETE FROM especialidade WHERE codigo = $1", [codigo]);
    res.status(200).send(); // Resposta vazia, status 200 OK
  } catch (error) {
    console.error("Erro ao deletar:", error);
    res.status(500).send(); // Resposta vazia, status 500
  }
};

//DELETE - Deletar consulta
exports.deleteConsulta = async (req, res) => {
  const { codigo } = req.params; // O código da consulta virá da URL

  const client = await db.connect(); // Inicia uma transação para garantir a atomicidade

  try {
    await client.query("BEGIN"); // Inicia a transação

    // 1. Excluir registros na tabela 'diagnostica' que se referem a diagnósticos desta consulta
    await client.query(
      `
      DELETE FROM diagnostica
      WHERE idDiagn IN (
          SELECT IdDiagnostico
          FROM Diagnostico
          WHERE idCon = $1
      );
      `,
      [codigo]
    );

    // 2. Excluir registros na tabela 'Diagnostico' que se referem a esta consulta
    await client.query(
      `
      DELETE FROM Diagnostico
      WHERE idCon = $1;
      `,
      [codigo]
    );

    // 3. Excluir o registro da agenda (se houver, com base no idagenda sendo o mesmo código da consulta)
    await client.query(
      `
      DELETE FROM Agenda
      WHERE IdAgenda = $1;
      `,
      [codigo]
    );

    // 4. Excluir a consulta da tabela 'Consulta'
    const result = await client.query(
      `
      DELETE FROM Consulta
      WHERE Codigo = $1
      RETURNING *; -- Opcional: para retornar a consulta deletada
      `,
      [codigo]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK"); // Se a consulta não foi encontrada, desfaz
      return res.status(404).send({ message: "Consulta não encontrada." });
    }

    await client.query("COMMIT"); // Finaliza a transação

    res.status(200).send({ message: "Consulta deletada com sucesso!" }); // Status 200 OK
  } catch (error) {
    await client.query("ROLLBACK"); // Em caso de erro, desfaz todas as operações
    console.error("Erro ao deletar consulta:", error);
    res.status(500).send({
      message: "Erro interno ao deletar consulta.",
      details: error.message,
    });
  } finally {
    client.release(); // Libera o cliente de volta para o pool
  }
};

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
  const { codigop } = req.params;

  try {
    // Primeiro remove as consultas relacionadas ao paciente
    await db.query("DELETE FROM consulta WHERE idPaciente = $1", [codigop]);

    // Depois remove o paciente
    const deletePaciente = await db.query(
      "DELETE FROM paciente WHERE codigop = $1",
      [codigop]
    );

    if (deletePaciente.rowCount === 0) {
      return res.status(404).send("Paciente não encontrado.");
    }

    return res.status(204).send(); // sucesso sem conteúdo
  } catch (error) {
    console.error("Erro ao deletar paciente:", error);
    return res.status(500).send("Erro ao deletar paciente");
  }
};

/*
// PACIENTES
exports.showPacientes = async (req, res) => {
  try {
    const response = await db.query("SELECT * FROM Paciente ORDER BY nomep");
    res.status(200).send(response.rows);
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error);
    res.status(500).send("Erro ao buscar pacientes");
  }
};

exports.addPaciente = async (req, res) => {
  try {
    const { codigo, cpf, nomep, endereco, idade, sexo, telefone } = req.body;

    if (
      !codigo ||
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
      "INSERT INTO Paciente (CodigoP, CPF, NomeP, Endereco, Idade, Sexo, Telefone) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [codigo, cpf, nomep, endereco, idade, sexo, telefone]
    );

    res.status(201).send(response.rows[0]);
  } catch (error) {
    console.error("Erro ao adicionar paciente:", error);
    res.status(500).send("Erro ao adicionar paciente");
  }
};

exports.updatePaciente = async (req, res) => {
  try {
    const { codigo } = req.params;
    const { cpf, nomep, endereco, idade, sexo, telefone } = req.body;

    const response = await db.query(
      "UPDATE Paciente SET CPF = $1, NomeP = $2, Endereco = $3, Idade = $4, Sexo = $5, Telefone = $6 WHERE CodigoP = $7 RETURNING *",
      [cpf, nomep, endereco, idade, sexo, telefone, codigo]
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

exports.deletePaciente = async (req, res) => {
  try {
    const { codigo } = req.params;
    await db.query("DELETE FROM Paciente WHERE CodigoP = $1", [codigo]);
    res.status(200).send();
  } catch (error) {
    console.error("Erro ao deletar paciente:", error);
    res.status(500).send();
  }
};

//CONSULTAS 
exports.showConsultas = async (req, res) => {
  try {
     const { page = 1, limit = 20 } = req.query; // Mudamos para 20 itens por página
    const offset = (page - 1) * limit;

    const query = `
      SELECT c.*, m.nomem as nome_medico, p.nomep as nome_paciente, e.nomee as nome_especialidade
      FROM consulta c
      JOIN medico m ON c.idmedico = m.crm
      JOIN paciente p ON c.idpaciente = p.codigop
      JOIN especialidade e ON c.idespecial = e.codigo
      ORDER BY c.codigo ASC  -- Ordenando por código ASCENDENTE
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `SELECT COUNT(*) FROM consulta`;
    
    const [consultas, total] = await Promise.all([
      db.query(query, [limit, offset]),
      db.query(countQuery)
    ]);

    res.status(200).json({
      data: consultas.rows,
      total: parseInt(total.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(total.rows[0].count / limit),
      itemsPerPage: parseInt(limit)
    });
   // ... código existente ...

    if (!consultas.rows || !total.rows) {
      throw new Error('Dados não retornados corretamente');
    }

    
  } catch (error) {
    console.error("Erro ao buscar consultas:", error);
    res.status(500).json({ 
      error: "Erro ao buscar consultas",
      details: error.message
    });
}};*/

// No seu controller.js
exports.showConsultas = async (req, res) => {
  try {
    // FORÇAR os parâmetros como números inteiros
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    // Query com LIMIT e OFFSET explícitos
    const queryText = `
      SELECT c.*, m.nomem as nome_medico, p.nomep as nome_paciente, e.nomee as nome_especialidade
      FROM consulta c
      JOIN medico m ON c.idmedico = m.crm
      JOIN paciente p ON c.idpaciente = p.codigop
      JOIN especialidade e ON c.idespecial = e.codigo
      ORDER BY c.codigo ASC
      LIMIT ${limit} OFFSET ${offset}  -- Método alternativo direto
    `;

    console.log("Query executada:", queryText); // Log crucial

    const [consultas, total] = await Promise.all([
      db.query(queryText),
      db.query("SELECT COUNT(*) FROM consulta"),
    ]);

    res.status(200).json({
      data: consultas.rows,
      total: parseInt(total.rows[0].count, 10),
      page,
      totalPages: Math.ceil(total.rows[0].count / limit),
      itemsPerPage: limit,
    });
  } catch (error) {
    console.error("Erro completo:", {
      message: error.message,
      stack: error.stack,
      query: queryText, // Mostra a query que falhou
    });
    res.status(500).json({
      error: "Erro ao buscar consultas",
      details: error.message,
    });
  }
};

//Explain consulta
exports.explainConsulta = async (req, res) => {
  const { where } = req.query;
  const queryText = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT * FROM consulta ${
    where ? `WHERE ${where}` : ""
  }`;

  try {
    const result = await db.query(queryText);
    res.json({ plan: result.rows[0]["QUERY PLAN"][0] });
  } catch (error) {
    console.error("Erro EXPLAIN:", error);
    res
      .status(500)
      .json({ error: "Erro ao executar EXPLAIN", details: error.message });
  }
};
