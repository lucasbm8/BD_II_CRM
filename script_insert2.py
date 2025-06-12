import csv
import random
from datetime import datetime, timedelta

# --- Constantes de Configuração ---
# Altere estes números para gerar mais ou menos dados
NUM_PACIENTES = 10000
NUM_MEDICOS = 100
NUM_ESPECIALIDADES = 50
NUM_DOENCAS = 200
NUM_CONSULTAS = 100000 # Reduzido para um teste mais rápido, aumente se precisar
NUM_DIAGNOSTICOS = 15000 # Deve ser menor ou igual ao número de consultas

# --- Funções Auxiliares ---
def random_phone():
    return f'{random.randint(100, 999)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}'

def random_cpf():
    return f'{random.randint(10000000000, 99999999999):011d}'

def random_time():
    return f'{random.randint(8, 17):02}:{random.choice([0, 15, 30, 45]):02}:00'

# --- Funções de Geração de SQL ---

def gerar_pacientes():
    print(f"Gerando {NUM_PACIENTES} registros para a tabela Paciente...")
    filename = '1_insert_pacientes.txt'
    with open(filename, mode='w', encoding='utf-8') as file:
        for i in range(1, NUM_PACIENTES + 1):
            # MUDANÇA: Incluindo o 'CodigoP' manualmente
            sql_command = (
                f"INSERT INTO Paciente (CodigoP, CPF, NomeP, Endereco, Idade, Sexo, Telefone) VALUES "
                f"({i}, '{random_cpf()}', 'Paciente {i}', 'Endereco {i}', {random.randint(5, 90)}, '{random.choice(['M', 'F'])}', '{random_phone()}');\n"
            )
            file.write(sql_command)
    print(f"-> Arquivo '{filename}' criado com sucesso.")

def gerar_medicos():
    print(f"Gerando {NUM_MEDICOS} registros para a tabela Medico...")
    filename = '2_insert_medicos.txt'
    with open(filename, mode='w', encoding='utf-8') as file:
        for i in range(1, NUM_MEDICOS + 1):
            # MUDANÇA: Incluindo o 'CRM' manualmente
            sql_command = (
                f"INSERT INTO Medico (CRM, NomeM, Telefone, Percentual) VALUES "
                f"({i}, 'Medico {i}', '{random_phone()}', {random.randint(10, 30)});"
            )
            file.write(f"{sql_command}\n")
    print(f"-> Arquivo '{filename}' criado com sucesso.")

def gerar_especialidades():
    print(f"Gerando {NUM_ESPECIALIDADES} registros para a tabela Especialidade...")
    filename = '3_insert_especialidades.txt'
    with open(filename, mode='w', encoding='utf-8') as file:
        for i in range(1, NUM_ESPECIALIDADES + 1):
            # MUDANÇA: Incluindo o 'Codigo' manualmente
            sql_command = (
                f"INSERT INTO Especialidade (Codigo, NomeE, Indice) VALUES "
                f"({i}, 'Especialidade {i}', {random.randint(1, 10)});"
            )
            file.write(f"{sql_command}\n")
    print(f"-> Arquivo '{filename}' criado com sucesso.")

def gerar_doencas():
    print(f"Gerando {NUM_DOENCAS} registros para a tabela Doenca...")
    filename = '4_insert_doencas.txt'
    with open(filename, mode='w', encoding='utf-8') as file:
        for i in range(1, NUM_DOENCAS + 1):
            # MUDANÇA: Incluindo o 'IdDoenca' manualmente
            sql_command = f"INSERT INTO Doenca (IdDoenca, NomeD) VALUES ({i}, 'Doença Fictícia {i}');"
            file.write(f"{sql_command}\n")
    print(f"-> Arquivo '{filename}' criado com sucesso.")

def gerar_consultas():
    print(f"Gerando {NUM_CONSULTAS} registros para a tabela Consulta...")
    filename = '5_insert_consultas.txt'
    start_date = datetime.strptime('2023-01-01', '%Y-%m-%d')
    end_date = datetime.now()
    with open(filename, mode='w', encoding='utf-8') as file:
        for i in range(1, NUM_CONSULTAS + 1):
            data_consulta = start_date + timedelta(days=random.randint(0, (end_date - start_date).days))
            # MUDANÇA: Incluindo o 'Codigo' da consulta manualmente
            sql_command = (
                f"INSERT INTO Consulta (Codigo, HoraInic, HoraFim, DATA, idPaciente, idEspecial, idMedico, ValorPago, Pagou, FormaPagamento) VALUES "
                f"({i}, '{random_time()}', '{random_time()}', '{data_consulta.strftime('%Y-%m-%d')}', "
                f"{random.randint(1, NUM_PACIENTES)}, {random.randint(1, NUM_ESPECIALIDADES)}, {random.randint(1, NUM_MEDICOS)}, "
                f"{random.randint(100, 500)}, {random.choice([True, False])}, '{random.choice(['Cartão', 'Dinheiro', 'Pix', 'Convênio'])}');"
            )
            file.write(f"{sql_command}\n")
    print(f"-> Arquivo '{filename}' criado com sucesso.")

def gerar_diagnosticos():
    print(f"Gerando {NUM_DIAGNOSTICOS} registros para a tabela Diagnostico...")
    filename = '6_insert_diagnosticos.txt'
    with open(filename, mode='w', encoding='utf-8') as file:
        consultas_com_diagnostico = random.sample(range(1, NUM_CONSULTAS + 1), NUM_DIAGNOSTICOS)
        for i, id_consulta in enumerate(consultas_com_diagnostico, 1):
            # MUDANÇA: Incluindo o 'IdDiagnostico' manualmente e ligando a uma consulta e doença
            sql_command = (
                f"INSERT INTO Diagnostico (IdDiagnostico, IdDoenca, idCon, Observacoes, TratamentoRecomendado, RemediosReceitados) VALUES "
                f"({i}, {random.randint(1, NUM_DOENCAS)}, {id_consulta}, 'Observação sobre o diagnóstico {i}', "
                f"'Tratamento recomendado {i}', 'Remédio A, Remédio B');"
            )
            file.write(f"{sql_command}\n")
    print(f"-> Arquivo '{filename}' criado com sucesso.")

def gerar_agendas():
    """Gera horários de agenda para cada médico."""
    print(f"Gerando registros para a tabela Agenda...")
    filename = '7_insert_agendas.txt'
    
    # Lista de dias da semana para usar
    dias_semana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira']
    id_agenda_counter = 1
    
    with open(filename, mode='w', encoding='utf-8') as file:
        # Para cada médico, cria uma agenda para 2 dias da semana
        for id_medico in range(1, NUM_MEDICOS + 1):
            dias_de_trabalho = random.sample(dias_semana, 2)
            for dia in dias_de_trabalho:
                # MUDANÇA: Incluindo o 'IdAgenda' manualmente
                sql_command = (
                    f"INSERT INTO Agenda (IdAgenda, HoraInicio, HoraFim, DiaSemana, idM) VALUES "
                    f"({id_agenda_counter}, '08:00:00', '12:00:00', '{dia}', {id_medico});\n"
                    f"INSERT INTO Agenda (IdAgenda, HoraInicio, HoraFim, DiaSemana, idM) VALUES "
                    f"({id_agenda_counter + 1}, '14:00:00', '18:00:00', '{dia}', {id_medico});"
                )
                file.write(f"{sql_command}\n")
                id_agenda_counter += 2
    print(f"-> Arquivo '{filename}' criado com sucesso.")
    
def gerar_diagnostica_join():
    """Gera a relação entre Diagnostico e Doenca na tabela 'diagnostica'."""
    print(f"Gerando registros para a tabela de relacionamento 'diagnostica'...")
    filename = '9_insert_diagnostica.txt'
    
    id_diagnostica_counter = 1
    with open(filename, mode='w', encoding='utf-8') as file:
        # Para cada diagnóstico já criado, vamos confirmar a doença principal
        # e, para alguns, adicionar uma doença secundária.
        for id_diagnostico in range(1, NUM_DIAGNOSTICOS + 1):
            # Assumimos que a tabela 'diagnostica' detalha o que já está em 'Diagnostico'
            # (Esta é uma interpretação da sua estrutura de tabelas)
            id_doenca_primaria = random.randint(1, NUM_DOENCAS) # Apenas para simulação
            
            # MUDANÇA: Incluindo 'idDiagnostica' manualmente
            sql_command_primario = (
                f"INSERT INTO diagnostica (idDiagnostica, idDiagn, idDoenca) VALUES "
                f"({id_diagnostica_counter}, {id_diagnostico}, {id_doenca_primaria});"
            )
            file.write(f"{sql_command_primario}\n")
            id_diagnostica_counter += 1
            
            # 10% de chance de ter uma doença secundária associada
            if random.random() < 0.1:
                id_doenca_secundaria = random.randint(1, NUM_DOENCAS)
                if id_doenca_secundaria != id_doenca_primaria:
                    sql_command_secundario = (
                        f"INSERT INTO diagnostica (idDiagnostica, idDiagn, idDoenca) VALUES "
                        f"({id_diagnostica_counter}, {id_diagnostico}, {id_doenca_secundaria});"
                    )
                    file.write(f"{sql_command_secundario}\n")
                    id_diagnostica_counter += 1
    print(f"-> Arquivo '{filename}' criado com sucesso.")
    print("\nAVISO: A lógica para a tabela 'diagnostica' assume que ela detalha a relação Diagnostico <-> Doenca.")
    print("Verifique se a Foreign Key na sua tabela é 'REFERENCES Diagnostico(IdDiagnostico)' e não 'REFERENCES diagnostico(...)'.")
# --- Bloco de Execução Principal ---
if __name__ == "__main__":
    print("--- INICIANDO GERAÇÃO DE DADOS SQL ---\n")
    
    # Ordem de execução é crucial para respeitar as chaves estrangeiras
    '''gerar_pacientes()
    gerar_medicos()
    gerar_especialidades()
    gerar_doencas()
    gerar_consultas()
    gerar_diagnosticos()

     # --- NOVAS FUNÇÕES A SEREM EXECUTADAS ---
    print("\n--- GERANDO DADOS PARA TABELAS RESTANTES ---\n")
    gerar_agendas()
    #gerar_exerce_esp()
    gerar_diagnostica_join()'''
    # ----------------------------------------
    
    print("\n--- GERAÇÃO DE DADOS CONCLUÍDA ---")
    print("Os arquivos .txt estão prontos para serem importados no pgAdmin4 na ordem numérica.")