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

// ROTAS DE ESPECIALIDADES (VERIFIQUE OS NOMES EXATOS NO CONTROLLER)
router.get("/listarEspecialidades", controller.showEspecialidades);
router.post("/cadastrarEspecialidade", controller.addEspecialidade);
router.put("/atualizarEspecialidade/:codigo", controller.updateEspecialidade);
router.delete("/removerEspecialidade/:codigo", controller.deleteEspecialidade);

//Rotas de pacientes
router.get("/paciente", controller.showPacientes);
router.post("/paciente", controller.addPaciente);
router.put("/paciente/:codigop", controller.updatePaciente);
router.delete("/paciente/:codigop", controller.deletePaciente);

// Rotas de consultas

router.get("/listarConsultas", controller.showConsultas);
router.get("/benchmark/explain", controller.explainConsulta);

module.exports = router;
