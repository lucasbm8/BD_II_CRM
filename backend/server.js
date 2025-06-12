const app = require('./src/app');

const port = 4040;

app.listen(port, () => {
  console.log('Aplicação executando na porta ', port);
});