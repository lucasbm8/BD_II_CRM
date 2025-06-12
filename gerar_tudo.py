
import csv
import random
from datetime import datetime, timedelta

# --- Funções Auxiliares ---

def random_phone():
    """Gera um número de telefone aleatório."""
    return f'{random.randint(100, 999)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}'

def random_cpf():
    """Gera um CPF aleatório (formato simples)."""
    return f'{random.randint(100000000, 999999999):09d}{random.randint(0, 99):02d}'

def random_time():
    """Gera um horário aleatório."""
    hour = random.randint(0, 23)
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    return f'{hour:02}:{minute:02}:{second:02}'

def random_date(start_date, end_date):
    """Gera uma data aleatória entre duas datas."""
    delta = end_date - start_date
    random_days = random.randint(0, delta.days)
    return start_date + timedelta(days=random_days)

# --- Funções de Geração de SQL ---

def gerar_medicos(num_records=100):
    """Gera comandos INSERT para a tabela Medico."""
    print(f"Gerando {num_records} registros para a tabela Medico...")
    sql_commands = []
    for i in range(1, num_records + 1):
        sql_command = (
            f"INSERT INTO Medico (CRM, NomeM, Telefone, Percentual) VALUES "
            f"({i}, 'Medico {i}', '{random_phone()}', {random.randint(0, 100)});"
        )
        sql_commands.append(sql_command)

    # Escreve os comandos em um arquivo de texto (mais comum para SQL)
    filename = 'insert_medicos.txt'
    with open(filename, mode='w', newline='', encoding='utf-8') as file:
        file.write('\n'.join(sql_commands))
    print(f"-> Arquivo '{filename}' criado com sucesso.")

def gerar_pacientes(num_records=10000):
    """Gera comandos INSERT para a tabela Paciente."""
    print(f"Gerando {num_records} registros para a tabela Paciente...")
    filename = 'insert_pacientes.txt'
    with open(filename, mode='w', encoding='utf-8') as file:
        for i in range(1, num_records + 1):
            sql_command = (
                f"INSERT INTO Paciente (CPF, NomeP, Endereco, Idade, Sexo, Telefone) VALUES "
                f"('{random_cpf()}', 'Paciente {i}', 'Endereco {i}', {random.randint(0, 100)}, '{random.choice(['M', 'F'])}', '{random_phone()}');\n"
            )
            file.write(sql_command)
    print(f"-> Arquivo '{filename}' criado com sucesso.")

def gerar_especialidades(num_records=100):
    """Gera comandos INSERT para a tabela Especialidade."""
    print(f"Gerando {num_records} registros para a tabela Especialidade...")
    filename = 'insert_especialidades.txt'
    with open(filename, mode='w', encoding='utf-8') as file:
        for i in range(1, num_records + 1):
            sql_command = (
                f"INSERT INTO Especialidade (Codigo, NomeE, Indice) VALUES "
                f"({i}, 'Especialidade {i}', {random.randint(1, 100)});\n"
            )
            file.write(sql_command)
    print(f"-> Arquivo '{filename}' criado com sucesso.")

def gerar_consultas(num_records=600000, medico_especifico=None):
    """Gera comandos INSERT para a tabela Consulta."""
    if medico_especifico:
        print(f"Gerando {num_records} registros de consulta para o médico ID {medico_especifico}...")
        filename = f'insert_consultas_medico_{medico_especifico}.txt'
    else:
        print(f"Gerando {num_records} registros de consulta gerais...")
        filename = 'insert_consultas_gerais.txt'

    start_date = datetime.strptime('2020-01-01', '%Y-%m-%d')
    end_date = datetime.strptime('2023-12-31', '%Y-%m-%d')

    with open(filename, mode='w', encoding='utf-8') as file:
        for i in range(num_records):
            id_medico = medico_especifico if medico_especifico else random.randint(1, 100)
            sql_command = (
                f"INSERT INTO Consulta (HoraInic, HoraFim, DATA, idPaciente, idEspecial, idMedico, ValorPago, Pagou, FormaPagamento) VALUES "
                f"('{random_time()}', '{random_time()}', '{random_date(start_date, end_date).strftime('%Y-%m-%d')}', "
                f"{random.randint(1, 10000)}, {random.randint(1, 100)}, {id_medico}, "
                f"{random.randint(0, 1000)}, {random.choice([True, False])}, '{random.choice(['Cash', 'Card', 'Insurance', 'Online'])}');\n"
            )
            file.write(sql_command)
    print(f"-> Arquivo '{filename}' criado com sucesso.")

# --- Bloco de Execução Principal ---
if __name__ == "__main__":
    print("--- INICIANDO GERAÇÃO DE DADOS SQL ---\n")
    
    # Gera os dados para as tabelas principais
    gerar_medicos(100)
    gerar_pacientes(10000)
    gerar_especialidades(100)
    
    # Gera os dados para a tabela de junção (consultas)
    gerar_consultas(600000)  # Gera as consultas gerais
    gerar_consultas(150000, medico_especifico=55) # Gera as consultas para o médico 55
    
    print("\n--- GERAÇÃO DE DADOS CONCLUÍDA ---")
    print("Os arquivos .txt estão prontos para serem importados no pgAdmin4.")