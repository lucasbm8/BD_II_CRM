CREATE DATABASE climed
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Portuguese_Brazil.1252'
    LC_CTYPE = 'Portuguese_Brazil.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

USE climed;

CREATE TABLE Paciente (
  CodigoP INT PRIMARY KEY,
  CPF VARCHAR(11) UNIQUE,
  NomeP VARCHAR(50) NOT NULL,
  Endereco VARCHAR(255) NOT NULL,
  Idade INT NOT NULL,
  Sexo VARCHAR(1) NOT NULL,
  Telefone VARCHAR(15) NOT NULL
);

CREATE TABLE Especialidade (
  Codigo INT PRIMARY KEY,
  NomeE VARCHAR(50) NOT NULL,
  Indice INT NOT NULL
);

CREATE TABLE Medico (
  CRM INT PRIMARY KEY,
  NomeM VARCHAR(50) NOT NULL,
  Telefone VARCHAR(15),
  Percentual INT NOT NULL
);


CREATE TABLE Agenda (
  IdAgenda INT PRIMARY KEY,
  HoraInicio TIME NOT NULL,
  HoraFim TIME NOT NULL,
  DiaSemana VARCHAR(50) NOT NULL,
  idM INT NOT NULL,
  CONSTRAINT FK_Agenda_Medico FOREIGN KEY (idM) REFERENCES Medico(CRM)
);


CREATE TABLE Doenca (
  IdDoenca INT PRIMARY KEY,
  NomeD VARCHAR(50) NOT NULL
);


CREATE TABLE Diagnostico (
  IdDiagnostico INT PRIMARY KEY,
  IdDoenca INT NOT NULL,
  idCon INT NOT NULL,
  Observacoes VARCHAR(255),
  TratamentoRecomendado VARCHAR(255),
  RemediosReceitados VARCHAR(255),
   CONSTRAINT FK_Diagnostico_Consulta FOREIGN KEY (idCon) REFERENCES Consulta(Codigo)
  CONSTRAINT FK_Diagnostico_Doenca FOREIGN KEY (IdDoenca) REFERENCES Doenca(IdDoenca)
);

CREATE TABLE Consulta (
  Codigo INT PRIMARY KEY,
  HoraInic TIME NOT NULL,
  HoraFim TIME NOT NULL,
  DATA DATE NOT NULL,
  idPaciente INT NOT NULL,
  idEspecial INT NOT NULL,
  idMedico INT NOT NULL,
  ValorPago INT,
  Pagou BOOLEAN,
  FormaPagamento VARCHAR(20),
  CONSTRAINT FK_Consulta_Paciente FOREIGN KEY (idPaciente) REFERENCES Paciente(CodigoP),
  CONSTRAINT FK_Consulta_Especialidade FOREIGN KEY (idEspecial) REFERENCES Especialidade(Codigo),
  CONSTRAINT FK_Consulta_Medico FOREIGN KEY (idMedico) REFERENCES Medico(CRM)

);

CREATE TABLE ExerceEsp (
  idMedico INT NOT NULL,
  idEspecial INT NOT NULL,
  CONSTRAINT FK_Especialidade_Medico_Medico FOREIGN KEY (idMedico) REFERENCES Medico(CRM),
  CONSTRAINT FK_Especialidade_Medico_Especialidade FOREIGN KEY (idEspecial) REFERENCES Especialidade(Codigo)
);


CREATE TABLE diagnostica (
  idDiagnostica INT PRIMARY KEY,
  idDiagn INT NOT NULL,
  idDoenca INT NOT NULL,
  CONSTRAINT FK_diagnostica_Diagnostico FOREIGN KEY (idDiagn) REFERENCES diagnostico(IdDiagnostico),
  CONSTRAINT FK_diagnostica_Doenca FOREIGN KEY (idDoenca) REFERENCES Doenca(IdDoenca)
);

--OTIMIZAÇÃO
--CREATE INDEX cl_medico ON consulta USING btree(idmedico);