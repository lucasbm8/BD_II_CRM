const router = require("express-promise-router")();
const controller = require("../controllers/controller");

// ROTAS ClinicPlus
// GET: Lista todos os médicos e suas especialidades
router.get("/medicos", controller.showMedicos);

// POST: Adiciona um novo médico e sua especialidade
router.post("/medicos", controller.addMedico);

// PUT: Atualiza um médico existente (CRM no parâmetro da URL)
router.put("/medicos/:crm", controller.updateMedico);

// DELETE: Deleta um médico e suas referências em tabelas filhas (CRM no parâmetro da URL)
router.delete("/medicos/:crm", controller.deleteMedico);

//router.get("/paciente", controller.showPacientes);
router.post("/agendaMedico", controller.showAgendaPorMedicos);
router.post("/AgendaCodigo", controller.showAgendaPorCodigo);
router.post("/agendarConsulta", controller.agendar);
router.post("/atualizarDados", controller.atualizarAgenda);
router.delete("/deletarConsulta/:codigo", controller.deleteConsulta);

// ==============================
// ROTAS PARA ESPECIALIDADES
// Prefixo recomendado: /especialidades
// ==============================

// GET: Lista todas as especialidades
router.get("/especialidades", controller.showEspecialidades);

// POST: Adiciona uma nova especialidade
router.post("/especialidades", controller.addEspecialidade);

// PUT: Atualiza uma especialidade existente (Código no parâmetro da URL)
router.put("/especialidades/:codigo", controller.updateEspecialidade);

// DELETE: Deleta uma especialidade e suas referências em tabelas filhas (Código no parâmetro da URL)
router.delete("/especialidades/:codigo", controller.deleteEspecialidade);

// ==============================
// ROTAS PARA PACIENTES (Verifique a URL, alterada para plural)
// ==============================

// GET: Lista todos os pacientes com paginação
router.get("/pacientes", controller.showPacientes); // Caminho atualizado para /pacientes

// POST: Adiciona um novo paciente
router.post("/pacientes", controller.addPaciente);

// PUT: Atualiza um paciente existente (CódigoP no parâmetro da URL)
router.put("/pacientes/:codigop", controller.updatePaciente);

// DELETE: Deleta um paciente e suas referências em tabelas filhas (CódigoP no parâmetro da URL)
router.delete("/pacientes/:codigop", controller.deletePaciente);

// ==============================
// ROTAS PARA CONSULTAS
// ==============================

// GET: Lista todas as consultas com detalhes (inclui paginação e filtros)
// URL: /consultas
router.get("/consultas", controller.showConsultas);

router.get("/listarConsultas", controller.showConsultas);
router.get("/benchmark/explain", controller.explainConsulta);
// POST: Popula a tabela Consulta com dados para benchmark
router.post("/benchmark/populate-consultas", controller.populateConsultas);

router.get("/benchmark/explain-query", controller.runExplainQuery); // Rota alterada para ser mais genérica

// POST: Cria um índice em idmedico na tabela Consulta
router.post("/benchmark/create-index-medico", controller.createIndexMedico); // Rota alterada para ser mais específica

// POST: Cria um índice na coluna 'DATA' da tabela 'Consulta'
router.post("/benchmark/create-index-data", controller.createIndexData); // Nova rota para índice em data
module.exports = router;
