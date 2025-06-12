const db = require("../config/database");


 exports.showMedicos = async (req, res) => {

  
  try {
  const response = await db.query('select * from medico');
  res.status(200).send(response.rows);
} catch (error) {
  console.error('Erro ao buscar medicos:', error);
  res.status(500).send('Erro ao buscar medicos');
}
};

exports.showAgendaPorMedicos = async (req, res) => {
  try {
    const { crm } = req.body;
    const response = await db.query('SELECT * FROM agenda WHERE idm = $1', [crm]);
    
    res.status(200).send(response.rows);
  } catch (error) {
    console.error('Erro ao buscar agenda:', error);
    res.status(500).send('Erro ao buscar agenda');
  }
};
exports.showAgendaPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.body;
    const response = await db.query('SELECT * FROM consulta WHERE codigo = $1', [codigo]);
    
    res.status(200).send(response.rows);
  } catch (error) {
    console.error('Erro ao buscar agenda:', error);
    res.status(500).send('Erro ao buscar agenda');
  }
};


exports.agendar = async (req, res) => {
  try {
    const { dadosAgenda } = req.body;
    const codigoConsulta = Math.floor(Math.random() * (10000 - 10 + 1)) + 10;
    console.log(dadosAgenda)


    if (!dadosAgenda.horainic || !dadosAgenda.horafim || !dadosAgenda.diasemana || !dadosAgenda.crm) {
      return res.status(400).send('Todos os campos são obrigatórios');
    }
        const response1 = await db.query('INSERT INTO  consulta  (codigo, horainic, horafim,data,idpaciente, idespecial,idmedico,valorpago, pagou, formapagamento) VALUES ($1, $2, $3, $4,$5,$6,$7,$8,$9, $10)', [codigoConsulta, dadosAgenda.horainic, dadosAgenda.horafim,dadosAgenda.data,dadosAgenda.idpaciente,dadosAgenda.idespecial,dadosAgenda.crm,dadosAgenda.valorpago,dadosAgenda.pagou,dadosAgenda.formapagamento,]);

     
       const response2 = await db.query('INSERT INTO  agenda  (idagenda, horainicio, horafim,diasemana,idm) VALUES ($1, $2, $3, $4, $5)', [codigoConsulta, dadosAgenda.horainic, dadosAgenda.horafim,dadosAgenda.diasemana,dadosAgenda.crm]);


       console.log(response1)
       console.log(response2)
    
    res.status(200).send({codigoConsulta});
  } catch (error) {
    console.error('Erro ao agendar:', error);
    res.status(500).send('Erro ao agendar ');
  }
};

exports.atualizarAgenda = async (req, res) => {
  try {
    const { dadosAgenda } = req.body;
   console.log(dadosAgenda)
   var query = 'update consulta  set horainic = $1,horafim = $2, data = $3,idpaciente =$4 idespecial = $5, idmedico = $6, valorpago = $7, pagou=$8, formapagamento = $9,  where codigo  = $10'

      const response = await db.query('update consulta  set horainic = $1,horafim = $2, data = $3,idpaciente =$4, idespecial = $5, idmedico = $6, valorpago = $7, pagou=$8, formapagamento = $9  where codigo  = $10', [ dadosAgenda.horainic, dadosAgenda.horafim,dadosAgenda.data,dadosAgenda.idpaciente,dadosAgenda.idespecial,dadosAgenda.idmedico,dadosAgenda.valorpago,dadosAgenda.pagou,dadosAgenda.formapagamento,dadosAgenda.codigo]);
      console.log(response) 


      const response2 = await db.query('update agenda set idagenda =$1, horainicio =$2 , horafim =$3 ,diasemana = $4,idm =$5 ', [dadosAgenda.codigo, dadosAgenda.horainic, dadosAgenda.horafim,dadosAgenda.diasemana,dadosAgenda.crm]);
      console.log(response2) 
    
      res.status(200).send({response});
  } catch (error) {
    console.error('Erro ao atualizar agenda:', error);
    res.status(500).send('Erro ao atualizar agenda');
  }
};


