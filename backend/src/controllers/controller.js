const db = require("../config/database");

/**
 * GET - Lista todos os médicos, incluindo suas especialidades, com suporte a paginação,
 * ordenados do CRM maior para o menor.
 * @param {object} req.query - Parâmetros de query para paginação (page, limit)
 */
exports.showMedicos = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10; // Padrão 10 itens por página
    const offset = (page - 1) * limit;

    // Query para buscar os médicos com paginação e suas especialidades
    const doctorsQuery = `
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
        m.crm DESC -- ALTERADO: Ordena por CRM (código do médico) DESCENDENTE
      LIMIT $1 OFFSET $2;
    `;
    // Query para contar o total de médicos (sem paginação)
    const countQuery = `
      SELECT COUNT(*) FROM medico;
    `;

    const [doctorsResult, totalResult] = await Promise.all([
      db.query(doctorsQuery, [limit, offset]),
      db.query(countQuery),
    ]);

    const totalItems = parseInt(totalResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      data: doctorsResult.rows,
      total: totalItems,
      page: page,
      totalPages: totalPages,
      itemsPerPage: limit,
    });
  } catch (error) {
    console.error("Erro ao buscar médicos com paginação:", error);
    res.status(500).send("Erro ao buscar médicos");
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

// ==============================
// MÓDULO DE CONSULTAS
// ==============================

/**
 * GET - Lista todas as consultas com detalhes de médico, paciente e especialidade.
 * Suporta paginação e filtros. Ordena por Código DESC.
 */
exports.showConsultas = async (req, res) => {
  // Essa função já existe e está boa, só confirmando a ordenação
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    let filterConditions = [];
    let filterParams = [];
    let paramIndex = 1;

    if (req.query.codigo) {
      filterConditions.push(`c.codigo = $${paramIndex++}`);
      filterParams.push(parseInt(req.query.codigo, 10));
    }
    if (req.query.nomePaciente) {
      // Filtro pelo nome do paciente
      filterConditions.push(`p.nomep ILIKE $${paramIndex++}`);
      filterParams.push(`%${req.query.nomePaciente}%`);
    }
    if (req.query.dataInicio) {
      filterConditions.push(`c.data >= $${paramIndex++}`);
      filterParams.push(req.query.dataInicio);
    }
    if (req.query.dataFim) {
      filterConditions.push(`c.data <= $${paramIndex++}`);
      filterParams.push(req.query.dataFim);
    }

    const whereClause =
      filterConditions.length > 0
        ? `WHERE ${filterConditions.join(" AND ")}`
        : "";

    const queryText = `
      SELECT c.*, m.nomem as nome_medico, p.nomep as nome_paciente, e.nomee as nome_especialidade
      FROM consulta c
      JOIN medico m ON c.idmedico = m.crm
      JOIN paciente p ON c.idpaciente = p.codigop
      JOIN especialidade e ON c.idespecial = e.codigo
      ${whereClause}
      ORDER BY c.codigo DESC -- Alterado para ordenar por código DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;

    const countQueryText = `SELECT COUNT(*) FROM consulta c JOIN paciente p ON c.idpaciente = p.codigop ${whereClause};`;

    const [consultas, total] = await Promise.all([
      db.query(queryText, [...filterParams, limit, offset]),
      db.query(countQueryText, filterParams),
    ]);

    res.status(200).json({
      data: consultas.rows,
      total: parseInt(total.rows[0].count, 10),
      page,
      totalPages: Math.ceil(total.rows[0].count / limit),
      itemsPerPage: limit,
    });
  } catch (error) {
    console.error("Erro ao buscar consultas:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: "Erro ao buscar consultas",
      details: error.message,
    });
  }
};

// ==============================
// MÓDULO DE FERRAMENTAS DE BENCHMARK (Expandido para incluir criação de índice em data)
// ==============================

/**
 * GET - Executa um EXPLAIN ANALYZE em uma consulta para benchmarking.
 * @param {string} req.query.query - A consulta SQL completa a ser explicada.
 * NÃO USAR COM ENTRADA DE USUÁRIO SEM VALIDAÇÃO ROBUSTA EM AMBIENTE DE PRODUÇÃO.
 */
exports.runExplainQuery = async (req, res) => {
  const { query } = req.query; // Recebe a query completa
  if (!query) {
    return res
      .status(400)
      .send({ message: "Parâmetro 'query' é obrigatório." });
  }

  try {
    const explainQueryText = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query};`;
    const result = await db.query(explainQueryText);
    res.json({ plan: result.rows[0]["QUERY PLAN"][0] });
  } catch (error) {
    console.error("Erro ao executar EXPLAIN para a query:", query, error);
    res
      .status(500)
      .json({ error: "Erro ao executar EXPLAIN", details: error.message });
  }
};

/**
 * POST - Cria um índice em idmedico na tabela Consulta.
 */
exports.createIndexMedico = async (req, res) => {
  // Renomeado para mais clareza
  try {
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_consulta_idmedico ON Consulta (idMedico);"
    );
    res.status(200).send({
      message:
        "Índice 'idx_consulta_idmedico' criado com sucesso (ou já existia).",
    });
  } catch (error) {
    console.error("Erro ao criar índice id_medico:", error);
    res.status(500).send({
      error: "Erro ao criar índice id_medico",
      details: error.message,
    });
  }
};

/**
 * POST - Cria um índice na coluna 'DATA' da tabela 'Consulta'.
 */
exports.createIndexData = async (req, res) => {
  try {
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_consulta_data ON Consulta (DATA);"
    );
    res.status(200).send({
      message: "Índice 'idx_consulta_data' criado com sucesso (ou já existia).",
    });
  } catch (error) {
    console.error("Erro ao criar índice data:", error);
    res
      .status(500)
      .send({ error: "Erro ao criar índice data", details: error.message });
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

/**
 * POST - Popula a tabela Consulta com um grande número de registros para testes de performance.
 * NOTA: Esta é uma função de desenvolvimento e deve ser usada com cautela em produção.
 */
exports.populateConsultas = async (req, res) => {
  const { numRecords = 100000 } = req.body; // Número de registros a serem gerados, padrão 100k
  const client = await db.connect();

  try {
    await client.query("BEGIN"); // Inicia uma transação para inserções em massa

    // Vamos pegar alguns IDs existentes de pacientes, médicos e especialidades
    // para que as chaves estrangeiras sejam válidas.
    const pacientes = await client.query(
      "SELECT CodigoP FROM Paciente LIMIT 10;"
    );
    const medicos = await client.query("SELECT CRM FROM Medico LIMIT 10;");
    const especialidades = await client.query(
      "SELECT Codigo FROM Especialidade LIMIT 10;"
    );

    if (
      pacientes.rows.length === 0 ||
      medicos.rows.length === 0 ||
      especialidades.rows.length === 0
    ) {
      await client.query("ROLLBACK");
      return res.status(400).send({
        message:
          "É necessário ter pelo menos 10 pacientes, 10 médicos e 10 especialidades para popular as consultas.",
      });
    }

    const pacienteIds = pacientes.rows.map((p) => p.codigop);
    const medicoCrms = medicos.rows.map((m) => m.crm);
    const especialidadeCodes = especialidades.rows.map((e) => e.codigo);

    let currentMaxCodigoResult = await client.query(
      "SELECT COALESCE(MAX(Codigo), 0) FROM Consulta;"
    );
    let currentCodigo = currentMaxCodigoResult.rows[0].coalesce + 1;

    console.log(`Iniciando a inserção de ${numRecords} consultas...`);
    const insertQuery = `
      INSERT INTO Consulta (Codigo, HoraInic, HoraFim, DATA, idPaciente, idEspecial, idMedico, ValorPago, Pagou, FormaPagamento)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
    `;

    for (let i = 0; i < numRecords; i++) {
      const horaInic = `${Math.floor(Math.random() * (18 - 8) + 8)
        .toString()
        .padStart(2, "0")}:00:00`;
      const horaFim = `${(parseInt(horaInic.substring(0, 2)) + 1)
        .toString()
        .padStart(2, "0")}:00:00`;
      const data = new Date(
        2023,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      )
        .toISOString()
        .split("T")[0];
      const idPaciente =
        pacienteIds[Math.floor(Math.random() * pacienteIds.length)];
      const idEspecial =
        especialidadeCodes[
          Math.floor(Math.random() * especialidadeCodes.length)
        ];
      const idMedico =
        medicoCrms[Math.floor(Math.random() * medicoCrms.length)];
      const valorPago = Math.round(Math.random() * 500 + 50); // entre 50 e 550
      const pagou = Math.random() > 0.5;
      const formaPagamento = ["Cartao", "Dinheiro", "Pix"][
        Math.floor(Math.random() * 3)
      ];

      await client.query(insertQuery, [
        currentCodigo++,
        horaInic,
        horaFim,
        data,
        idPaciente,
        idEspecial,
        idMedico,
        valorPago,
        pagou,
        formaPagamento,
      ]);

      // Opcional: Inserir na tabela Agenda também se desejar que ela tenha 100k registros
      // Você precisará de um 'diasemana' para a Agenda. Para simplificar, vou omitir aqui,
      // mas se Agenda for relevante para performance, você a popularia aqui.
      // const diaSemana = new Date(data).getDay().toString(); // 0-6
      // await client.query(
      //   "INSERT INTO Agenda (IdAgenda, HoraInicio, HoraFim, DiaSemana, idM) VALUES ($1, $2, $3, $4, $5);",
      //   [currentCodigo -1, horaInic, horaFim, diaSemana, idMedico]
      // );

      if ((i + 1) % 10000 === 0) {
        console.log(`Inseridos ${i + 1} registros.`);
      }
    }

    await client.query("COMMIT");
    console.log(`Geração de ${numRecords} consultas concluída.`);
    res
      .status(201)
      .send({ message: `${numRecords} consultas geradas com sucesso!` });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao popular consultas:", error);
    res
      .status(500)
      .send({ message: "Erro ao popular consultas.", details: error.message });
  } finally {
    client.release();
  }
};
