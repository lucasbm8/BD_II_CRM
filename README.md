# 📌 Clinic+

**Descrição breve:**  
_Sistema CRM médico, com intenção de operações CRUD e grande quantidade de dados com finalidade de atender todas as necessidades do trabalho da disciplina de BD II_

---

## 🚀 Tecnologias

- **Banco de Dados:** PostgreSQL
- **Ferramentas:** PgAdmin 4
- **Linguagens:** SQL, Python, Node.js, JavaScript
- **Outros:**

---

## 📋 Pré-requisitos

Antes de começar, instale:

- [PostgreSQL]
- [PgAdmin 4]
- [Python]
- [Node.js]

---

## 🛠️ Configuração

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/lucasbm8/BD_II_CRM.git
   cd seu-repositorio
   ```

2. **Configurações**
   Configure o postgres com a senha _1234_ para o menos de alterações possíveis.

   No pgadmin 4, crie o banco baseado no arquivo _banco.sql_

   Utilize o arquivo **script_inserts2.py** instalando as bibliotecas necessarias com o pip install
   Isso gerará os comandos em arquivos txt para popular o banco de dados no pgamin4 já criado com infos.
   _é importante lembrar que deve ter muitos dados para que dê para ver a otimização_

   Após isso, o banco está criado e populado.

3. **BackEnd e Frontend**
   entre na pasta backend com o comando

```bash
cd backend
```

e rode o comando

```bash

npm install

```

e em seguida

```bash
npm start
```

Analogamente, para o frontEnd abra um novo terminal e rode o comando

```bash
npm install
```

e

```bash
   npm start
```

Lembre-se de descomentar as funções em script_insert2.py para que quando executado, ele de fato crie os arquivos que serão utilizados um a um no query tool do banco de dados clinicplus
