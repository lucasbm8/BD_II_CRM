const router = require("express-promise-router")();
const controller = require("../controllers/controller");

// ROTAS ClinicPlus
router.get("/medicos", controller.showMedicos);
router.post("/medicos", controller.addMedico);
router.put("/medicos", controller.updateMedico);
//router.get("/paciente", controller.showPacientes);
router.post("/agendaMedico", controller.showAgendaPorMedicos);
router.post("/AgendaCodigo", controller.showAgendaPorCodigo);
router.post("/agendarConsulta", controller.agendar);
router.post("/atualizarDados", controller.atualizarAgenda);

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
