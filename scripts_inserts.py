# gerador de 100 inserts medicos

import csv
import random

# Function to generate a random phone number
def random_phone():
    return f'{random.randint(100, 999)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}'

# List to store the SQL commands
sql_commands = []

# Generate 100 different doctors and store the SQL commands
for i in range(1, 101):
    CRM = i
    NomeM = f'Medico {i}'
    Telefone = random_phone()
    Percentual = random.randint(0, 100)

    sql_command = (
        f"INSERT INTO Medico (CRM, NomeM, Telefone, Percentual) VALUES "
        f"({CRM}, '{NomeM}', '{Telefone}', {Percentual});"
    )
    sql_commands.append(sql_command)

# Write the SQL commands to a CSV file
csv_file = 'insert_medico.csv'
with open(csv_file, mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(['SQL Commands'])
    for command in sql_commands:
        writer.writerow([command])

print(f"CSV file '{csv_file}' with SQL commands has been created.")

#------------------------------------------------------------------------------------------------------
# gerador de 10000 inserts paciente

import random

# Function to generate a random phone number
def random_phone():
    return f'{random.randint(100, 999)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}'

# Function to generate a random CPF (Brazilian individual taxpayer registry identification)
def random_cpf():
    return f'{random.randint(100000000, 999999999):09d}{random.randint(0, 99):02d}'

# Define o nome do arquivo txt
txt_file = 'insert_paciente_commands.txt'

# Gera os comandos SQL e salva no arquivo txt
with open(txt_file, mode='w') as file:
    for i in range(1, 10001):
        CPF = random_cpf()
        NomeP = f'Paciente {i}'
        Endereco = f'Endereco {i}'
        Idade = random.randint(0, 100)
        Sexo = random.choice(['M', 'F'])
        Telefone = random_phone()

        sql_command = (
            f"INSERT INTO Paciente (CPF, NomeP, Endereco, Idade, Sexo, Telefone) VALUES "
            f"('{CPF}', '{NomeP}', '{Endereco}', {Idade}, '{Sexo}', '{Telefone}');\n"
        )

        file.write(sql_command)

print(f"Arquivo '{txt_file}' com os comandos SQL foi criado.")

#------------------------------------------------------------------------------------------------------
# gerador de 100 inserts especialidade

import random

# List to store the SQL commands
sql_commands = []

# Generate 100 different specialties and store the SQL commands
for i in range(1, 101):
    Codigo = i
    NomeE = f'Especialidade {i}'
    Indice = random.randint(1, 100)

    sql_command = (
        f"INSERT INTO Especialidade (Codigo, NomeE, Indice) VALUES "
        f"({Codigo}, '{NomeE}', {Indice});\n"
    )
    sql_commands.append(sql_command)

# Write the SQL commands to a TXT file
txt_file = 'insert_especialidade_commands.txt'
with open(txt_file, mode='w') as file:
    for command in sql_commands:
        file.write(command)

print(f"TXT file '{txt_file}' with SQL commands has been created.")

#------------------------------------------------------------------------------------------------------
# gerador de 600000 inserts consultas com base nas tabelas anteriores

import random
from datetime import datetime, timedelta

# Function to generate a random time
def random_time():
    hour = random.randint(0, 23)
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    return f'{hour:02}:{minute:02}:{second:02}'

# Function to generate a random date between a given start and end date
def random_date(start_date, end_date):
    delta = end_date - start_date
    random_days = random.randint(0, delta.days)
    return start_date + timedelta(days=random_days)

# List to store the SQL commands
sql_commands = []

# Define the date range for the random dates
start_date = datetime.strptime('2020-01-01', '%Y-%m-%d')
end_date = datetime.strptime('2023-12-31', '%Y-%m-%d')

# Generate 300,000 different consultations and store the SQL commands
for i in range(600000):
    HoraInic = random_time()
    HoraFim = random_time()
    DATA = random_date(start_date, end_date).strftime('%Y-%m-%d')
    idPaciente = random.randint(1, 10000)  # Assuming 10,000 patients
    idEspecial = random.randint(1, 100)    # Assuming 100 specialties
    idMedico = random.randint(1, 100)      # Assuming 100 doctors
    ValorPago = random.randint(0, 1000)
    Pagou = random.choice([True, False])
    FormaPagamento = random.choice(['Cash', 'Card', 'Insurance', 'Online'])

    sql_command = (
        f"INSERT INTO Consulta (HoraInic, HoraFim, DATA, idPaciente, idEspecial, idMedico, ValorPago, Pagou, FormaPagamento) VALUES "
        f"('{HoraInic}', '{HoraFim}', '{DATA}', {idPaciente}, {idEspecial}, {idMedico}, {ValorPago}, {Pagou}, '{FormaPagamento}')"
    )
    sql_commands.append(sql_command)

# Write the SQL commands to a TXT file
txt_file = 'insert_consulta_commands_II.txt'
with open(txt_file, mode='w') as file:
    for command in sql_commands:
        file.write(command + ';\n')

print(f"TXT file '{txt_file}' with SQL commands has been created.")

#------------------------------------------------------------------------------------------------------
# gerador de 150000 inserts consultas com base nas tabelas anteriores para o medico 55

import random
from datetime import datetime, timedelta

# Function to generate a random time
def random_time():
    hour = random.randint(0, 23)
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    return f'{hour:02}:{minute:02}:{second:02}'

# Function to generate a random date between a given start and end date
def random_date(start_date, end_date):
    delta = end_date - start_date
    random_days = random.randint(0, delta.days)
    return start_date + timedelta(days=random_days)

# List to store the SQL commands
sql_commands = []

# Define the date range for the random dates
start_date = datetime.strptime('2020-01-01', '%Y-%m-%d')
end_date = datetime.strptime('2023-12-31', '%Y-%m-%d')

# Generate 300,000 different consultations and store the SQL commands
for i in range(150000):
    HoraInic = random_time()
    HoraFim = random_time()
    DATA = random_date(start_date, end_date).strftime('%Y-%m-%d')
    idPaciente = random.randint(1, 10000)  # Assuming 10,000 patients
    idEspecial = random.randint(1, 100)    # Assuming 100 specialties
    idMedico = 55      # Assuming 100 doctors
    ValorPago = random.randint(0, 1000)
    Pagou = random.choice([True, False])
    FormaPagamento = random.choice(['Cash', 'Card', 'Insurance', 'Online'])

    sql_command = (
        f"INSERT INTO Consulta (HoraInic, HoraFim, DATA, idPaciente, idEspecial, idMedico, ValorPago, Pagou, FormaPagamento) VALUES "
        f"('{HoraInic}', '{HoraFim}', '{DATA}', {idPaciente}, {idEspecial}, {idMedico}, {ValorPago}, {Pagou}, '{FormaPagamento}')"
    )
    sql_commands.append(sql_command)

# Write the SQL commands to a TXT file
txt_file = 'insert_consulta_commands_II.txt'
with open(txt_file, mode='w') as file:
    for command in sql_commands:
        file.write(command + ';\n')

print(f"TXT file '{txt_file}' with SQL commands has been created.")