const router = require('express-promise-router')();
const controller = require('../controllers/controller');


 // ROTAS CLIMED
 router.get('/medicos', controller.showMedicos);
 router.post('/agendaMedico', controller.showAgendaPorMedicos);
 router.post('/AgendaCodigo', controller.showAgendaPorCodigo);
 router.post('/agendarConsulta', controller.agendar);
 router.post('/atualizarDados', controller.atualizarAgenda);









module.exports = router;