const router = require("express-promise-router")();
const controller = require("../controllers/controller");

// ROTAS ClinicPlus
router.get("/medicos", controller.showMedicos);
router.get("/paciente", controller.showPacientes);
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
router.get("/listarPacientes", controller.showPacientes);
router.post("/cadastrarPaciente", controller.addPaciente);
router.put("/atualizarPaciente/:codigop", controller.updatePaciente);
router.delete("/removerPaciente/:codigop", controller.deletePaciente);

// Rotas de consultas
router.get("/listarConsultas", controller.showConsultas);
module.exports = router;
