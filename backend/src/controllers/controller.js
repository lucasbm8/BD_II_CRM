const db = require("../config/database");

//GET - Exibir todos os médicos
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

/**
 * PUT - Atualiza os dados de um médico existente.
 * Permite a atualização do próprio CRM e agora, também da especialidade.
 * Utiliza uma transação para garantir a atomicidade.
 */
exports.updateMedico = async (req, res) => {
  const originalCrm = req.params.crm;
  // Desestruturar todos os campos, incluindo a 'especialidade'
  const {
    crm: novoCrm,
    nomem,
    telefone,
    percentual,
    especialidade,
  } = req.body.dados;

  const client = await db.connect(); // Inicia uma transação

  try {
    await client.query("BEGIN"); // Inicia a transação

    // 1. Atualiza na tabela Medico (permitindo a mudança de CRM)
    const medicoUpdateQuery = `
      UPDATE medico 
      SET 
        crm = $1,          
        nomem = $2, 
        telefone = $3, 
        percentual = $4
      WHERE 
        crm = $5
      RETURNING *;
    `;
    const medicoUpdateValues = [
      novoCrm,
      nomem,
      telefone,
      percentual,
      originalCrm,
    ];
    const responseMedico = await client.query(
      medicoUpdateQuery,
      medicoUpdateValues
    );

    if (responseMedico.rowCount === 0) {
      await client.query("ROLLBACK"); // Se o médico não foi encontrado, desfaz a transação
      return res
        .status(404)
        .send({ message: "Médico não encontrado com o CRM original." });
    }

    // 2. Atualiza a especialidade na tabela ExerceEsp
    // Primeiro, deleta a especialidade antiga (um médico pode ter apenas 1 por essa estrutura)
    // Se um médico puder ter múltiplas especialidades, a lógica seria mais complexa (UPDATE ou INSERT/DELETE seletivos)
    // Assumindo que um médico tem apenas uma especialidade principal para simplificar a atualização.
    // Se ExerceEsp for N:N e um médico puder ter várias especialidades, a lógica precisaria ser mais sofisticada
    // para adicionar/remover especialidades específicas, não apenas substituir.

    // No seu DB, ExerceEsp é (idMedico, idEspecial), que pode implicar N:N.
    // Se for N:N, um UPDATE simples não funciona. Precisamos DELETAR e INSERIR.
    // Assumindo por enquanto que você só quer "mudar" a especialidade principal ou vincular uma.

    // Deleta a especialidade antiga (se existir) para este médico
    await client.query(
      "DELETE FROM ExerceEsp WHERE idMedico = $1;",
      [novoCrm] // Usa o novo CRM, caso ele tenha mudado
    );

    // Insere a nova especialidade.
    // É importante que 'especialidade' tenha um valor válido (Código da Especialidade).
    if (especialidade) {
      await client.query(
        "INSERT INTO ExerceEsp (idMedico, idEspecial) VALUES ($1, $2);",
        [novoCrm, especialidade] // Usa o novo CRM e a nova especialidade
      );
    }

    await client.query("COMMIT"); // Finaliza a transação
    res.status(200).send(responseMedico.rows[0]); // Retorna o médico atualizado
  } catch (error) {
    await client.query("ROLLBACK"); // Desfaz a transação em caso de erro
    console.error("Erro ao atualizar médico:", error);
    if (error.code === "23505") {
      return res
        .status(409)
        .send({ message: "O novo CRM informado já pertence a outro médico." });
    }
    // Adicione tratamento para erros de chave estrangeira (se a especialidade não existe)
    if (
      error.code === "23503" &&
      error.constraint === "fk_especialidade_medico_especialidade"
    ) {
      return res
        .status(400)
        .send({ message: "A Especialidade informada não existe." });
    }
    res.status(500).send({
      message: "Erro interno ao atualizar médico.",
      details: error.message,
    });
  } finally {
    client.release();
  }
};
// DELETE - Deletar médico (com transação para manter integridade)
exports.deleteMedico = async (req, res) => {
  const { crm } = req.params;
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // 1. Deletar registros em 'diagnostica' relacionados a consultas do médico
    await client.query(
      `
      DELETE FROM diagnostica
      WHERE idDiagn IN (
          SELECT IdDiagnostico
          FROM Diagnostico
          WHERE idCon IN (
              SELECT Codigo FROM Consulta WHERE idMedico = $1
          )
      );
      `,
      [crm]
    );

    // 2. Deletar registros em 'Diagnostico' relacionados a consultas do médico
    await client.query(
      `
      DELETE FROM Diagnostico
      WHERE idCon IN (
          SELECT Codigo FROM Consulta WHERE idMedico = $1
      );
      `,
      [crm]
    );

    // 3. Deletar registros em 'Consulta' que fazem referência ao médico
    await client.query(
      `
      DELETE FROM Consulta
      WHERE idMedico = $1;
      `,
      [crm]
    );

    // 4. Deletar registros em 'Agenda' que fazem referência ao médico
    await client.query(
      `
      DELETE FROM Agenda
      WHERE idM = $1;
      `,
      [crm]
    );

    // 5. Deletar registros em 'ExerceEsp' que fazem referência ao médico
    await client.query(
      `
      DELETE FROM ExerceEsp
      WHERE idMedico = $1;
      `,
      [crm]
    );

    // 6. Finalmente, deletar o médico da tabela 'Medico'
    const result = await client.query(
      `
      DELETE FROM Medico
      WHERE CRM = $1
      RETURNING *;
      `,
      [crm]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).send({ message: "Médico não encontrado." });
    }

    await client.query("COMMIT");
    res.status(200).send({ message: "Médico deletado com sucesso!" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao deletar médico:", error);
    res.status(500).send({
      message: "Erro interno ao deletar médico.",
      details: error.message,
    });
  } finally {
    client.release();
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

// ==============================
// MÓDULO DE ESPECIALIDADES
// ==============================

/**
 * GET - Lista todas as especialidades com suporte a paginação, ordenadas do código maior para o menor.
 * @param {object} req.query - Parâmetros de query para paginação (page, limit)
 */
exports.showEspecialidades = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10; // Padrão 10 itens por página
    const offset = (page - 1) * limit;

    // Query para buscar as especialidades com paginação, ordenadas por código DESC
    const specialtiesQuery = `
      SELECT * FROM especialidade 
      ORDER BY codigo DESC -- ALTERADO: Ordena por codigo (código da especialidade) DESCENDENTE
      LIMIT $1 OFFSET $2;
    `;
    // Query para contar o total de especialidades (sem paginação)
    const countQuery = `
      SELECT COUNT(*) FROM especialidade;
    `;

    const [specialtiesResult, totalResult] = await Promise.all([
      db.query(specialtiesQuery, [limit, offset]),
      db.query(countQuery),
    ]);

    const totalItems = parseInt(totalResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      data: specialtiesResult.rows,
      total: totalItems,
      page: page,
      totalPages: totalPages,
      itemsPerPage: limit,
    });
  } catch (error) {
    console.error("Erro ao buscar especialidades com paginação:", error);
    res.status(500).send("Erro ao buscar especialidades");
  }
};

exports.addEspecialidade = async (req, res) => {
  try {
    const { codigo, nomee, indice } = req.body;
    if (!codigo || !nomee || !indice) {
      return res.status(400).send("Todos os campos são obrigatórios.");
    }
    const response = await db.query(
      "INSERT INTO especialidade (codigo, nomee, indice) VALUES ($1, $2, $3) RETURNING *;",
      [codigo, nomee, indice]
    );
    res.status(201).send(response.rows[0]);
  } catch (error) {
    console.error("Erro ao adicionar especialidade:", error);
    if (error.code === "23505") {
      return res
        .status(409)
        .send("Código ou nome de especialidade já cadastrado.");
    }
    res.status(500).send("Erro ao adicionar especialidade");
  }
};

exports.updateEspecialidade = async (req, res) => {
  try {
    const { codigo } = req.params;
    const { nomee, indice } = req.body;
    const response = await db.query(
      "UPDATE especialidade SET nomee = $1, indice = $2 WHERE codigo = $3 RETURNING *;",
      [nomee, indice, codigo]
    );
    if (response.rowCount === 0) {
      return res.status(404).send("Especialidade não encontrada.");
    }
    res.status(200).send(response.rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar especialidade:", error);
    if (error.code === "23505") {
      return res.status(409).send("Nome da especialidade já cadastrado.");
    }
    res.status(500).send("Erro ao atualizar especialidade");
  }
};

exports.deleteEspecialidade = async (req, res) => {
  const { codigo } = req.params;
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
      DELETE FROM ExerceEsp
      WHERE idEspecial = $1;
      `,
      [codigo]
    );
    await client.query(
      `
      DELETE FROM Consulta
      WHERE idespecial = $1;
      `,
      [codigo]
    );
    const result = await client.query(
      `
      DELETE FROM especialidade 
      WHERE codigo = $1
      RETURNING *;
      `,
      [codigo]
    );
    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).send({ message: "Especialidade não encontrada." });
    }
    await client.query("COMMIT");
    res.status(200).send({ message: "Especialidade deletada com sucesso!" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao deletar especialidade:", error);
    res.status(500).send({
      message: "Erro interno ao deletar especialidade.",
      details: error.message,
    });
  } finally {
    client.release();
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

//Funções pacientes
/**
 * GET - Exibe todos os pacientes com suporte a paginação, ordenados do mais recente para o mais antigo.
 * @param {object} req.query - Parâmetros de query para paginação (page, limit)
 */
exports.showPacientes = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Query para buscar os pacientes com paginação
    const patientsQuery = `
      SELECT * FROM paciente 
      ORDER BY codigop DESC -- ALTERADO: Ordena por codigop (código do paciente) DESCENDENTE
      LIMIT $1 OFFSET $2;
    `;
    // Query para contar o total de pacientes (sem paginação)
    const countQuery = `
      SELECT COUNT(*) FROM paciente;
    `;

    const [patientsResult, totalResult] = await Promise.all([
      db.query(patientsQuery, [limit, offset]),
      db.query(countQuery),
    ]);

    const totalItems = parseInt(totalResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      data: patientsResult.rows,
      total: totalItems,
      page: page,
      totalPages: totalPages,
      itemsPerPage: limit,
    });
  } catch (error) {
    console.error("Erro ao buscar pacientes com paginação:", error);
    res.status(500).send("Erro ao buscar pacientes");
  }
};

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
      return res.status(400).send("Todos os campos são obrigatórios.");
    }
    const response = await db.query(
      `INSERT INTO paciente (codigop, cpf, nomep, endereco, idade, sexo, telefone)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`,
      [codigop, cpf, nomep, endereco, idade, sexo, telefone]
    );
    res.status(201).send(response.rows[0]);
  } catch (error) {
    console.error("Erro ao adicionar paciente:", error);
    if (error.code === "23505") {
      return res.status(409).send("CPF já cadastrado.");
    }
    res.status(500).send("Erro ao adicionar paciente");
  }
};

exports.updatePaciente = async (req, res) => {
  try {
    const { codigop } = req.params;
    const { cpf, nomep, endereco, idade, sexo, telefone } = req.body;
    const response = await db.query(
      `UPDATE paciente
       SET cpf = $1, nomep = $2, endereco = $3, idade = $4, sexo = $5, telefone = $6
       WHERE codigop = $7
       RETURNING *;`,
      [cpf, nomep, endereco, idade, sexo, telefone, codigop]
    );
    if (response.rowCount === 0) {
      return res.status(404).send("Paciente não encontrado.");
    }
    res.status(200).send(response.rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar paciente:", error);
    if (error.code === "23505") {
      return res
        .status(409)
        .send("O novo CPF informado já pertence a outro paciente.");
    }
    res.status(500).send("Erro ao atualizar paciente");
  }
};

exports.deletePaciente = async (req, res) => {
  const { codigop } = req.params;
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
      DELETE FROM diagnostica
      WHERE idDiagn IN (
          SELECT IdDiagnostico
          FROM Diagnostico
          WHERE idCon IN (
              SELECT Codigo FROM Consulta WHERE idPaciente = $1
          )
      );
      `,
      [codigop]
    );
    await client.query(
      `
      DELETE FROM Diagnostico
      WHERE idCon IN (
          SELECT Codigo FROM Consulta WHERE idPaciente = $1
      );
      `,
      [codigop]
    );
    await client.query(
      `
      DELETE FROM Consulta
      WHERE idPaciente = $1;
      `,
      [codigop]
    );
    const result = await client.query(
      `
      DELETE FROM Paciente
      WHERE CodigoP = $1
      RETURNING *;
      `,
      [codigop]
    );
    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).send("Paciente não encontrado.");
    }
    await client.query("COMMIT");
    return res.status(200).send({ message: "Paciente deletado com sucesso!" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao deletar paciente:", error);
    return res.status(500).send({
      message: "Erro interno ao deletar paciente.",
      details: error.message,
    });
  } finally {
    client.release();
  }
};

//Consultas detalhadas
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
