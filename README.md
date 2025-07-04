# 📌 Clinic+

---

## Descrição do Projeto

**Clinic+** é um sistema CRM (Customer Relationship Management) médico desenvolvido para atender às necessidades da disciplina de Banco de Dados II. Ele foca em operações CRUD (Create, Read, Update, Delete) e é projetado para lidar com uma **grande quantidade de dados**, permitindo a exploração de otimizações e o gerenciamento eficiente de informações clínicas.

---

## 🚀 Tecnologias Utilizadas

Este projeto utiliza as seguintes tecnologias:

- **Banco de Dados:** PostgreSQL
- **Ferramentas:** PgAdmin 4
- **Linguagens:** SQL, Python, Node.js, JavaScript
- **Frameworks:** Express.js (para o Backend), React (para o Frontend)

---

## 📋 Pré-requisitos

Para configurar e executar o Clinic+, certifique-se de ter os seguintes softwares instalados:

- **PostgreSQL:** [Download PostgreSQL](https://www.postgresql.org/download/)
- **PgAdmin 4:** [Download PgAdmin 4](https://www.pgadmin.org/download/)
- **Python:** [Download Python](https://www.python.org/downloads/) (Recomendado Python 3.x)
- **Node.js:** [Download Node.js](https://nodejs.org/en/download/) (Inclui npm)

---

## 🛠️ Configuração e Execução

Siga os passos abaixo para configurar e iniciar o projeto Clinic+:

### 1\. Clonar o Repositório

Primeiro, clone o repositório do projeto para sua máquina local e navegue até o diretório:

```bash
git clone https://github.com/lucasbm8/BD_II_CRM.git
cd BD_II_CRM
```

### 2\. Configuração do Banco de Dados PostgreSQL

#### a. Configurar Senha do PostgreSQL

Para uma configuração mais simples, configure a senha do usuário padrão do PostgreSQL (geralmente `postgres`) para `1234`. Se preferir outra senha, lembre-se de ajustá-la nas configurações de conexão do backend.

#### b. Criar e Popular o Banco de Dados

1.  **Criar o Banco de Dados no PgAdmin 4:**
    Abra o **PgAdmin 4** e crie um novo banco de dados. Sugerimos o nome `clinicplus`.

2.  **Executar o `banco.sql`:**
    No PgAdmin 4, abra o arquivo `banco.sql` localizado na raiz do projeto. **Execute as seções do arquivo na ordem em que estão descritas** para garantir a criação correta do esquema do banco de dados (tabelas, chaves primárias, chaves estrangeiras, etc.).

3.  **Popular o Banco de Dados com Dados de Teste:**
    O projeto inclui scripts Python para gerar uma grande quantidade de dados para teste e otimização.

    - Certifique-se de ter as bibliotecas Python necessárias instaladas:

      ```bash
      pip install faker psycopg2-binary
      ```

    - Navegue até a pasta onde está o script:

      ```bash
      cd path/to/your/script/folder # (e.g., if it's in the root, stay there)
      ```

    - Execute o script `script_inserts3.py`:

      ```bash
      python script_inserts3.py
      ```

      **Importante:** Descomente as funções dentro de `script_inserts3.py` para que ele gere os arquivos `.txt` contendo os comandos `INSERT`.

    - Os arquivos `.txt` gerados (por exemplo, `inserts_pacientes.txt`, `inserts_medicos.txt`, etc.) conterão os comandos SQL para popular cada tabela. **Execute o conteúdo desses arquivos um por um, na ordem correta, no "Query Tool" do PgAdmin 4.** É crucial seguir a ordem para respeitar as dependências de chaves estrangeiras.

    Após esses passos, seu banco de dados `clinicplus` estará criado e populado com uma quantidade significativa de dados.

### 3\. Configuração e Execução do Backend

1.  **Navegar para o diretório do Backend:**

    ```bash
    cd backend
    ```

2.  **Instalar as dependências:**

    ```bash
    npm install
    ```

3.  **Iniciar o servidor Backend:**

    ```bash
    npm run dev
    ```

    O backend será iniciado, geralmente na porta `4040`. Se atente a isso para alterar no codigo dependendo de qual porta iniciar.

### 4\. Configuração e Execução do Frontend

1.  **Abrir um novo terminal** e navegar para o diretório do Frontend:

    ```bash
    cd frontend
    ```

2.  **Instalar as dependências:**

    ```bash
    npm install
    ```

3.  **Iniciar o aplicativo Frontend:**

    ```bash
    npm start
    ```

    O aplicativo frontend será iniciado no seu navegador padrão, geralmente na porta `3000`.

---

## 🛠️ Estrutura do Projeto

arquivo controller.js tem todas as funcionalidades e é o core do backend que faz as queries

arquivos dentro de componentes é todo o frontend que chama o backend que faz as queries, só bater um com o outro para verificar o fluxo.

TENHA CERTEZA QUE AMBOS cd backend npm run dev e em outro terminal cd frontend npm start estejam rodando sem erro antes de fazer qualquer coisa

o frontend é pra abrir sozinho no seu navegador ou então https://localhost:3000

## 📸 Modelo Relacional

![Texto Alternativo](https://github.com/lucasbm8/BD_II_CRM/blob/feature/melhorias/MODELO%20ER.jpg)

## 📸 Modelo Lógico

![Texto Alternativo](https://github.com/lucasbm8/BD_II_CRM/blob/feature/melhorias/modelo%20logico.jpg)

---

## 🤝 Contribuição

Sinta-se à vontade para contribuir para este projeto. Para fazer isso:

1.  Utilizamos o gitflow
2.  De o comando(`git git flow init`).
3.  Configure para a branch principal ser master e a de desenvolvimendo dev.
4.  para inciar uma nova feature, utilize `git flow feature start [nome da feature]`
5.  Isso ira criar uma nova branch automaticamente, a partir da dev.
6.  para finalizar a feature `git flow feature finish [nome da feature]`
    Isso irá colocar a feature na branch dev que é a utilizada para homologaçao de tudo antes de ir para a master.

---
