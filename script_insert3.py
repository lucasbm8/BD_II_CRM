import csv
import random
from datetime import datetime, timedelta

# --- Constantes de Configuração ---
NUM_PACIENTES = 10000
NUM_MEDICOS = 100
NUM_ESPECIALIDADES = 50
NUM_DOENCAS = 200
NUM_CONSULTAS = 100000
NUM_DIAGNOSTICOS = 15000

# --- Dados Realistas ---
NOMES_MASCULINOS = [
    'João', 'José', 'Antônio', 'Francisco', 'Carlos', 'Paulo', 'Pedro', 'Lucas', 'Luiz', 'Marcos',
    'Luis', 'Gabriel', 'Rafael', 'Daniel', 'Marcelo', 'Bruno', 'Eduardo', 'Felipe', 'Raimundo', 'Rodrigo',
    'Manoel', 'Nelson', 'Roberto', 'Fabio', 'Leonardo', 'Juliano', 'Hélio', 'Almir', 'Álvaro', 'Adriano',
    'Gustavo', 'Renato', 'Sérgio', 'Cláudio', 'Fernando', 'Jorge', 'Marcos', 'André', 'Leandro', 'Tiago',
    'Márcio', 'Geraldo', 'Arthur', 'Humberto', 'Edmundo', 'Paulo', 'Gilberto', 'Otávio', 'Mário', 'Benedito'
]

NOMES_FEMININOS = [
    'Maria', 'Ana', 'Francisca', 'Antônia', 'Adriana', 'Juliana', 'Márcia', 'Fernanda', 'Patricia', 'Aline',
    'Sandra', 'Camila', 'Amanda', 'Bruna', 'Jessica', 'Leticia', 'Julia', 'Luciana', 'Vanessa', 'Mariana',
    'Gabriela', 'Valeria', 'Adriana', 'Tatiana', 'Simone', 'Priscila', 'Carla', 'Larissa', 'Cláudia', 'Cristina',
    'Elisângela', 'Fabiana', 'Gisele', 'Janaína', 'Kelly', 'Lilian', 'Mônica', 'Patrícia', 'Renata', 'Rosana',
    'Silvia', 'Solange', 'Tânia', 'Viviane', 'Débora', 'Denise', 'Eliane', 'Fátima', 'Helena', 'Isabel'
]

SOBRENOMES = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
    'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
    'Rocha', 'Dias', 'Monteiro', 'Cardoso', 'Reis', 'Araújo', 'Nascimento', 'Freitas', 'Nunes', 'Moreira',
    'Correia', 'Teixeira', 'Mendes', 'Pinto', 'Cunha', 'Farias', 'Castro', 'Campos', 'Macedo', 'Ramos',
    'Batista', 'Duarte', 'Moura', 'Leite', 'Marques', 'Miranda', 'Nogueira', 'Fonseca', 'Cavalcanti', 'Melo'
]

ESPECIALIDADES_MEDICAS = [
    'Cardiologia', 'Dermatologia', 'Endocrinologia', 'Gastroenterologia', 'Ginecologia', 'Neurologia',
    'Oftalmologia', 'Ortopedia', 'Otorrinolaringologia', 'Pediatria', 'Psiquiatria', 'Urologia',
    'Anestesiologia', 'Cirurgia Geral', 'Clínica Médica', 'Geriatria', 'Hematologia', 'Infectologia',
    'Nefrologia', 'Oncologia', 'Pneumologia', 'Radiologia', 'Reumatologia', 'Medicina Intensiva',
    'Medicina do Trabalho', 'Medicina Legal', 'Patologia', 'Medicina Nuclear', 'Genética Médica',
    'Medicina Esportiva', 'Acupuntura', 'Homeopatia', 'Medicina de Família', 'Cirurgia Plástica',
    'Cirurgia Vascular', 'Neurocirurgia', 'Cirurgia Torácica', 'Proctologia', 'Mastologia', 'Nutrologia',
    'Alergologia', 'Imunologia', 'Medicina Preventiva', 'Medicina do Sono', 'Dor', 'Reprodução Humana',
    'Medicina Fetal', 'Neonatologia', 'Hebiatria', 'Medicina Hiperbárica'
]

DOENCAS_COMUNS = [
    'Hipertensão Arterial', 'Diabetes Mellitus Tipo 2', 'Asma', 'Rinite Alérgica', 'Gastrite', 
    'Refluxo Gastroesofágico', 'Artrose', 'Depressão', 'Ansiedade', 'Enxaqueca', 'Sinusite',
    'Bronquite', 'Pneumonia', 'Infecção Urinária', 'Anemia', 'Hipotireoidismo', 'Hipertireoidismo',
    'Osteoporose', 'Fibromialgia', 'Síndrome do Intestino Irritável', 'Dermatite Atópica',
    'Psoríase', 'Acne', 'Varizes', 'Hemorroidas', 'Cálculo Renal', 'Cistite', 'Faringite',
    'Amigdalite', 'Otite', 'Conjuntivite', 'Catarata', 'Glaucoma', 'Bursite', 'Tendinite',
    'Lombalgia', 'Cervicalgia', 'Hérnia de Disco', 'Síndrome do Túnel do Carpo', 'Gota',
    'Colesterol Alto', 'Triglicérides Elevados', 'Síndrome Metabólica', 'Apneia do Sono',
    'Insônia', 'Transtorno Bipolar', 'Esquizofrenia', 'TOC', 'Síndrome do Pânico', 'Agorafobia',
    'Fobia Social', 'Transtorno de Estresse Pós-Traumático', 'TDAH', 'Autismo', 'Epilepsia',
    'Parkinson', 'Alzheimer', 'AVC', 'Infarto do Miocárdio', 'Arritmia Cardíaca', 'Insuficiência Cardíaca',
    'Embolia Pulmonar', 'Trombose Venosa', 'Úlcera Péptica', 'Doença de Crohn', 'Retocolite Ulcerativa',
    'Hepatite', 'Cirrose', 'Pancreatite', 'Vesícula Biliar', 'Pedra na Vesícula', 'Apendicite',
    'Hérnia Inguinal', 'Hérnia Umbilical', 'Mioma Uterino', 'Endometriose', 'Síndrome dos Ovários Policísticos',
    'Menopausa', 'TPM', 'Candidíase', 'HPV', 'Herpes', 'Sífilis', 'Gonorreia', 'Clamídia',
    'HIV/AIDS', 'Tuberculose', 'Dengue', 'Zika', 'Chikungunya', 'Malária', 'Febre Amarela',
    'Hepatite A', 'Hepatite B', 'Hepatite C', 'Mononucleose', 'Toxoplasmose', 'Citomegalovírus',
    'Rubéola', 'Sarampo', 'Caxumba', 'Varicela', 'Herpes Zoster', 'Escabiose', 'Pediculose',
    'Hanseníase', 'Leishmaniose', 'Doença de Chagas', 'Esquistossomose', 'Ancilostomíase',
    'Ascaridíase', 'Giardíase', 'Amebíase', 'Câncer de Mama', 'Câncer de Próstata', 'Câncer de Pulmão',
    'Câncer de Cólon', 'Câncer de Estômago', 'Câncer de Fígado', 'Câncer de Pâncreas', 'Leucemia',
    'Linfoma', 'Melanoma', 'Câncer de Pele', 'Câncer de Tireoide', 'Câncer de Ovário', 'Câncer de Útero',
    'Câncer de Bexiga', 'Câncer de Rim', 'Síndrome de Down', 'Fibrose Cística', 'Distrofia Muscular',
    'Esclerose Múltipla', 'Miastenia Gravis', 'Lúpus', 'Artrite Reumatoide', 'Esclerodermia',
    'Síndrome de Sjögren', 'Polimialgia Reumática', 'Vasculite', 'Espondilite Anquilosante',
    'Febre Reumática', 'Doença de Behçet', 'Síndrome Antifosfolípide', 'Púrpura Trombocitopênica',
    'Anemia Falciforme', 'Talassemia', 'Hemofilia', 'Trombofilia', 'Policitemia', 'Mielofibrose',
    'Síndrome Mielodisplásica', 'Mieloma Múltiplo', 'Macroglobulinemia', 'Imunodeficiência Primária',
    'Síndrome de Imunodeficiência Adquirida', 'Transplante de Órgãos', 'Rejeição de Transplante',
    'Doença do Enxerto contra Hospedeiro', 'Síndrome Nefrótica', 'Síndrome Nefrítica', 'Insuficiência Renal',
    'Doença Renal Policística', 'Glomerulonefrite', 'Pielonefrite', 'Nefrite Intersticial', 'Nefroesclerose',
    'Síndrome de Alport', 'Síndrome de Goodpasture', 'Nefropatia Diabética', 'Nefropatia Hipertensiva',
    'Litíase Renal', 'Tumor de Wilms', 'Carcinoma Renal', 'Bexiga Neurogênica', 'Incontinência Urinária',
    'Prostatite', 'Hiperplasia Prostática', 'Câncer de Testículo', 'Varicocele', 'Hidrocele',
    'Fimose', 'Parafimose', 'Balanite', 'Uretrite', 'Estenose Uretral', 'Disfunção Erétil',
    'Ejaculação Precoce', 'Infertilidade Masculina', 'Infertilidade Feminina', 'Aborto Espontâneo',
    'Gravidez Ectópica', 'Placenta Prévia', 'Descolamento de Placenta', 'Pré-eclâmpsia', 'Eclâmpsia',
    'Diabetes Gestacional', 'Corioamnionite', 'Trabalho de Parto Prematuro', 'Ruptura Prematura de Membranas',
    'Sofrimento Fetal', 'Macrossomia Fetal', 'Restrição de Crescimento Fetal', 'Malformações Congênitas'
]

ESTADOS_BRASILEIROS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

CIDADES_BRASILEIRAS = [
    'São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte',
    'Manaus', 'Curitiba', 'Recife', 'Goiânia', 'Belém', 'Porto Alegre', 'Guarulhos',
    'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Natal', 'Teresina'
]

BAIRROS = [
    'Centro', 'Vila Nova', 'Jardim América', 'Cidade Nova', 'São José', 'Santa Maria',
    'Vila São João', 'Jardim das Flores', 'Parque das Árvores', 'Vila Industrial',
    'Bela Vista', 'Boa Vista', 'Alto da Colina', 'Jardim Europa', 'Vila Progresso'
]

RUAS = [
    'Rua das Flores', 'Avenida Brasil', 'Rua Principal', 'Rua São José', 'Avenida Central',
    'Rua da Paz', 'Avenida Paulista', 'Rua do Comércio', 'Rua da Igreja', 'Avenida dos Estados',
    'Rua das Palmeiras', 'Rua do Sol', 'Avenida da Independência', 'Rua Nova', 'Rua da Liberdade'
]

# --- Funções Auxiliares Melhoradas ---
def gerar_nome_completo(sexo):
    """Gera um nome completo realista baseado no sexo"""
    if sexo == 'M':
        primeiro_nome = random.choice(NOMES_MASCULINOS)
    else:
        primeiro_nome = random.choice(NOMES_FEMININOS)
    
    sobrenome1 = random.choice(SOBRENOMES)
    sobrenome2 = random.choice(SOBRENOMES)
    
    # 70% chance de ter dois sobrenomes, 30% chance de ter apenas um
    if random.random() < 0.7:
        return f"{primeiro_nome} {sobrenome1} {sobrenome2}"
    else:
        return f"{primeiro_nome} {sobrenome1}"

def gerar_cpf_valido():
    """Gera um CPF com dígitos verificadores válidos"""
    def calcular_digito(cpf_parcial, multiplicadores):
        soma = sum(int(digit) * mult for digit, mult in zip(cpf_parcial, multiplicadores))
        resto = soma % 11
        return 0 if resto < 2 else 11 - resto
    
    # Gera os 9 primeiros dígitos
    nove_digitos = [random.randint(0, 9) for _ in range(9)]
    
    # Calcula o primeiro dígito verificador
    multiplicadores1 = list(range(10, 1, -1))
    digito1 = calcular_digito(nove_digitos, multiplicadores1)
    
    # Calcula o segundo dígito verificador
    multiplicadores2 = list(range(11, 1, -1))
    digito2 = calcular_digito(nove_digitos + [digito1], multiplicadores2)
    
    # Forma o CPF completo
    cpf_completo = nove_digitos + [digito1, digito2]
    return ''.join(map(str, cpf_completo))

def gerar_telefone_brasileiro():
    """Gera um telefone celular brasileiro realista"""
    # DDDs mais comuns das principais cidades
    ddds = [11, 21, 31, 41, 51, 61, 71, 81, 85, 91, 62, 47, 48, 19, 27, 84, 83, 82, 79, 86]
    ddd = random.choice(ddds)
    
    # Celular brasileiro (9 dígitos) - sempre começa com 9
    numero = f"9{random.randint(1000, 9999)}{random.randint(1000, 9999)}"
    
    return f"({ddd:02d}) {numero[:5]}-{numero[5:]}"

def gerar_endereco_brasileiro():
    """Gera um endereço brasileiro realista"""
    rua = random.choice(RUAS)
    numero = random.randint(1, 9999)
    bairro = random.choice(BAIRROS)
    cidade = random.choice(CIDADES_BRASILEIRAS)
    estado = random.choice(ESTADOS_BRASILEIROS)
    cep = f"{random.randint(10000, 99999)}-{random.randint(100, 999)}"
    
    # 30% de chance de ter complemento
    if random.random() < 0.3:
        complementos = ['Apto 101', 'Casa 2', 'Bloco A', 'Sala 205', 'Fundos', 'Casa B']
        complemento = random.choice(complementos)
        return f"{rua}, {numero} - {complemento}, {bairro}, {cidade}/{estado}, CEP: {cep}"
    else:
        return f"{rua}, {numero}, {bairro}, {cidade}/{estado}, CEP: {cep}"

def gerar_idade_realista():
    """Gera idade com distribuição mais realista para pacientes"""
    # Distribuição por faixas etárias mais comuns em consultórios
    probabilidades = [
        (0, 12, 0.15),    # Crianças - 15%
        (13, 17, 0.08),   # Adolescentes - 8%
        (18, 35, 0.25),   # Jovens adultos - 25%
        (36, 50, 0.22),   # Adultos - 22%
        (51, 65, 0.20),   # Meia idade - 20%
        (66, 85, 0.10)    # Idosos - 10%
    ]
    
    rand = random.random()
    acumulado = 0
    for min_idade, max_idade, prob in probabilidades:
        acumulado += prob
        if rand <= acumulado:
            return random.randint(min_idade, max_idade)
    
    return random.randint(18, 80)  # Fallback

def gerar_valor_consulta():
    """Gera valores de consulta próximos da realidade brasileira"""
    # Valores baseados na realidade do mercado brasileiro (2024)
    tipos_consulta = [
        (80, 150, 0.4),   # Clínica geral/Pediatria - 40%
        (150, 250, 0.3),  # Especialidades comuns - 30%
        (250, 400, 0.2),  # Especialidades complexas - 20%
        (400, 800, 0.1)   # Especialidades muito específicas - 10%
    ]
    
    rand = random.random()
    acumulado = 0
    for min_val, max_val, prob in tipos_consulta:
        acumulado += prob
        if rand <= acumulado:
            return random.randint(min_val, max_val)
    
    return random.randint(100, 300)  # Fallback

def gerar_percentual_medico():
    """Gera percentual de repasse mais realista para médicos"""
    # Percentuais comuns no mercado médico brasileiro
    percentuais = [20, 25, 30, 35, 40, 45, 50]
    pesos = [0.1, 0.15, 0.25, 0.25, 0.15, 0.08, 0.02]  # Mais comum entre 25-40%
    
    return random.choices(percentuais, weights=pesos)[0]

def random_time():
    """Gera horários mais realistas de funcionamento"""
    horas = [8, 9, 10, 11, 13, 14, 15, 16, 17, 18]
    minutos = [0, 15, 30, 45]
    
    hora = random.choice(horas)
    minuto = random.choice(minutos)
    
    return f'{hora:02}:{minuto:02}:00'

# --- Funções de Geração de SQL Melhoradas ---

def gerar_pacientes():
    print(f"Gerando {NUM_PACIENTES} registros para a tabela Paciente...")
    filename = '1_insert_pacientes.txt'
    with open(filename, mode='w', encoding='utf-8') as file:
        for i in range(1, NUM_PACIENTES + 1):
            sexo = random.choice(['M', 'F'])
            nome = gerar_nome_completo(sexo)
            endereco = gerar_endereco_brasileiro()
            idade = gerar_idade_realista()
            telefone = gerar_telefone_brasileiro()
            cpf = gerar_cpf_valido()
            
            sql_command = (
                f"INSERT INTO Paciente (CodigoP, CPF, NomeP, Endereco, Idade, Sexo, Telefone) VALUES "
                f"({i}, '{cpf}', '{nome}', '{endereco}', {idade}, '{sexo}', '{telefone}');\n"
            )
            file.write(sql_command)
    print(f"-> Arquivo '{filename}' criado com sucesso.")

def gerar_medicos():
    print(f"Gerando {NUM_MEDICOS} registros para a tabela Medico...")
    filename = '2_insert_medicos.txt'
    with open(filename, mode='w', encoding='utf-8') as file:
        for i in range(1, NUM_MEDICOS + 1):
            sexo = random.choice(['M', 'F'])
            nome = f"Dr. {gerar_nome_completo(sexo)}" if sexo == 'M' else f"Dra. {gerar_nome_completo(sexo)}"
            telefone = gerar_telefone_brasileiro()
            percentual = gerar_percentual_medico()
            
            sql_command = (
                f"INSERT INTO Medico (CRM, NomeM, Telefone, Percentual) VALUES "
                f"({i}, '{nome}', '{telefone}', {percentual});"
            )
            file.write(f"{sql_command}\n")
    print(f"-> Arquivo '{filename}' criado com sucesso.")

def gerar_especialidades():
    print(f"Gerando {len(ESPECIALIDADES_MEDICAS)} registros para a tabela Especialidade...")
    filename = '3_insert_especialidades.txt'
    with open(filename, mode='w', encoding='utf-8') as file:
        for i, especialidade in enumerate(ESPECIALIDADES_MEDICAS, 1):
            # Índice baseado na complexidade/raridade da especialidade
            indices_complexidade = {
                'Clínica Médica': 1, 'Pediatria': 1, 'Medicina de Família': 1,
                'Cardiologia': 2, 'Dermatologia': 2, 'Ginecologia': 2,
                'Ortopedia': 3, 'Neurologia': 3, 'Gastroenterologia': 3,
                'Cirurgia Geral': 4, 'Oftalmologia': 4, 'Urologia': 4,
                'Neurocirurgia': 5, 'Cirurgia Plástica': 5, 'Medicina Nuclear': 5
            }
            
            indice = indices_complexidade.get(especialidade, random.randint(2, 4))
            
            sql_command = (
                f"INSERT INTO Especialidade (Codigo, NomeE, Indice) VALUES "
                f"({i}, '{especialidade}', {indice});"
            )
            file.write(f"{sql_command}\n")
    print(f"-> Arquivo '{filename}' criado com sucesso.")

def gerar_doencas():
    print(f"Gerando {len(DOENCAS_COMUNS)} registros para a tabela Doenca...")
    filename = '4_insert_doencas.txt'
    with open(filename, mode='w', encoding='utf-8') as file:
        for i, doenca in enumerate(DOENCAS_COMUNS, 1):
            sql_command = f"INSERT INTO Doenca (IdDoenca, NomeD) VALUES ({i}, '{doenca}');"
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
            
            # Horários mais realistas
            hora_inicio = random_time()
            # Consultas duram em média 30-60 minutos
            inicio_datetime = datetime.strptime(hora_inicio, '%H:%M:%S')
            duracao = timedelta(minutes=random.choice([30, 45, 60]))
            fim_datetime = inicio_datetime + duracao
            hora_fim = fim_datetime.strftime('%H:%M:%S')
            
            valor_pago = gerar_valor_consulta()
            
            # 85% das consultas são pagas
            pagou = random.choices([True, False], weights=[0.85, 0.15])[0]
            
            # Formas de pagamento mais comuns
            formas_pagamento = ['Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Pix', 'Convênio']
            pesos_pagamento = [0.35, 0.25, 0.15, 0.20, 0.05]
            forma_pagamento = random.choices(formas_pagamento, weights=pesos_pagamento)[0]
            
            sql_command = (
                f"INSERT INTO Consulta (Codigo, HoraInic, HoraFim, DATA, idPaciente, idEspecial, idMedico, ValorPago, Pagou, FormaPagamento) VALUES "
                f"({i}, '{hora_inicio}', '{hora_fim}', '{data_consulta.strftime('%Y-%m-%d')}', "
                f"{random.randint(1, NUM_PACIENTES)}, {random.randint(1, len(ESPECIALIDADES_MEDICAS))}, {random.randint(1, NUM_MEDICOS)}, "
                f"{valor_pago}, {pagou}, '{forma_pagamento}');"
            )
            file.write(f"{sql_command}\n")
    print(f"-> Arquivo '{filename}' criado com sucesso.")

def gerar_diagnosticos():
    print(f"Gerando {NUM_DIAGNOSTICOS} registros para a tabela Diagnostico...")
    filename = '6_insert_diagnosticos.txt'
    
    tratamentos_comuns = [
        'Repouso e hidratação', 'Medicação conforme prescrição', 'Fisioterapia',
        'Mudança de hábitos alimentares', 'Exercícios regulares', 'Acompanhamento médico',
        'Cirurgia ambulatorial', 'Internação hospitalar', 'Terapia medicamentosa',
        'Procedimento minimamente invasivo'
    ]
    
    medicamentos_comuns = [
        'Paracetamol 500mg', 'Ibuprofeno 600mg', 'Amoxicilina 500mg', 'Losartana 50mg',
        'Metformina 850mg', 'Omeprazol 20mg', 'Sinvastatina 40mg', 'Atenolol 50mg',
        'Captopril 25mg', 'Diclofenaco 50mg', 'Dipirona 500mg', 'AAS 100mg'
    ]
    
    with open(filename, mode='w', encoding='utf-8') as file:
        consultas_com_diagnostico = random.sample(range(1, NUM_CONSULTAS + 1), NUM_DIAGNOSTICOS)
        for i, id_consulta in enumerate(consultas_com_diagnostico, 1):
            id_doenca = random.randint(1, len(DOENCAS_COMUNS))
            observacao = f"Paciente apresenta sintomas compatíveis com {DOENCAS_COMUNS[id_doenca-1].lower()}. {random.choice(['Quadro estável.', 'Necessário acompanhamento.', 'Melhora significativa.', 'Quadro controlado.'])}"
            tratamento = random.choice(tratamentos_comuns)
            medicamento = random.choice(medicamentos_comuns)
            
            sql_command = (
                f"INSERT INTO Diagnostico (IdDiagnostico, IdDoenca, idCon, Observacoes, TratamentoRecomendado, RemediosReceitados) VALUES "
                f"({i}, {id_doenca}, {id_consulta}, '{observacao}', "
                f"'{tratamento}', '{medicamento}');"
            )
            file.write(f"{sql_command}\n")
    print(f"-> Arquivo '{filename}' criado com sucesso.")

def gerar_agendas():
    """Gera horários de agenda para cada médico."""
    print(f"Gerando registros para a tabela Agenda...")
    filename = '7_insert_agendas.txt'
    
    dias_semana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
    id_agenda_counter = 1
    
    with open(filename, mode='w', encoding='utf-8') as file:
        for id_medico in range(1, NUM_MEDICOS + 1):
            # Cada médico trabalha de 2 a 4 dias por semana
            num_dias = random.randint(2, 4)
            dias_de_trabalho = random.sample(dias_semana, num_dias)
            
            for dia in dias_de_trabalho:
                # Horários mais realistas
                if random.random() < 0.8:  # 80% trabalham de manhã
                    sql_command = (
                        f"INSERT INTO Agenda (IdAgenda, HoraInicio, HoraFim, DiaSemana, idM) VALUES "
                        f"({id_agenda_counter}, '08:00:00', '12:00:00', '{dia}', {id_medico});\n"
                    )
                    file.write(sql_command)
                    id_agenda_counter += 1
                
                if random.random() < 0.7:  # 70% trabalham à tarde
                    sql_command = (
                        f"INSERT INTO Agenda (IdAgenda, HoraInicio, HoraFim, DiaSemana, idM) VALUES "
                        f"({id_agenda_counter}, '14:00:00', '18:00:00', '{dia}', {id_medico});\n"
                    )
                    file.write(sql_command)
                    id_agenda_counter += 1
    print(f"-> Arquivo '{filename}' criado com sucesso.")
    
def gerar_diagnostica_join():
    """Gera a relação entre Diagnostico e Doenca na tabela 'diagnostica'."""
    print(f"Gerando registros para a tabela de relacionamento 'diagnostica'...")
    filename = '9_insert_diagnostica.txt'
    
    id_diagnostica_counter = 1
    with open(filename, mode='w', encoding='utf-8') as file:
        for id_diagnostico in range(1, NUM_DIAGNOSTICOS + 1):
            id_doenca_primaria = random.randint(1, len(DOENCAS_COMUNS))
            
            sql_command_primario = (
                f"INSERT INTO diagnostica (idDiagnostica, idDiagn, idDoenca) VALUES "
                f"({id_diagnostica_counter}, {id_diagnostico}, {id_doenca_primaria});"
            )
            file.write(f"{sql_command_primario}\n")
            id_diagnostica_counter += 1
            
            # 15% de chance de ter uma doença secundária associada (comorbidade)
            if random.random() < 0.15:
                id_doenca_secundaria = random.randint(1, len(DOENCAS_COMUNS))
                if id_doenca_secundaria != id_doenca_primaria:
                    sql_command_secundario = (
                        f"INSERT INTO diagnostica (idDiagnostica, idDiagn, idDoenca) VALUES "
                        f"({id_diagnostica_counter}, {id_diagnostico}, {id_doenca_secundaria});"
                    )
                    file.write(f"{sql_command_secundario}\n")
                    id_diagnostica_counter += 1
    print(f"-> Arquivo '{filename}' criado com sucesso.")

    
def gerar_exerce_esp():
    """Gera a relação entre Medico e Especialidade na tabela 'ExerceEsp'."""
    print("Gerando registros para a tabela de relacionamento 'ExerceEsp'...")
    filename = '8_insert_exerce_esp.txt'
    
    total_especialidades = len(ESPECIALIDADES_MEDICAS)
    
    with open(filename, mode='w', encoding='utf-8') as file:
        # Itera sobre cada médico cadastrado
        for id_medico in range(1, NUM_MEDICOS + 1):
            # Define que cada médico terá entre 1 e 3 especialidades (um valor realista)
            num_especialidades_medico = random.randint(1, 3)
            
            # Cria uma lista com todos os IDs de especialidades possíveis
            lista_ids_especialidades = list(range(1, total_especialidades + 1))
            
            # Seleciona aleatoriamente as especialidades para o médico atual, sem repetição
            ids_especialidades_selecionadas = random.sample(lista_ids_especialidades, num_especialidades_medico)
            
            # Cria o comando SQL para cada especialidade do médico
            for id_especialidade in ids_especialidades_selecionadas:
                sql_command = (
                    f"INSERT INTO ExerceEsp (idMedico, idEspecial) VALUES "
                    f"({id_medico}, {id_especialidade});\n"
                )
                file.write(sql_command)
                
    print(f"-> Arquivo '{filename}' criado com sucesso.")
# --- Bloco de Execução Principal ---
if __name__ == "__main__":
    print("=== GERADOR DE DADOS MÉDICOS REALISTAS ===\n")
    print("Este script gera dados fictícios mas realistas para um sistema médico brasileiro.")
    print("Incluindo nomes brasileiros, CPFs válidos, telefones e endereços realistas.\n")
    
    print("--- INICIANDO GERAÇÃO DE DADOS SQL ---\n")
    
    # Ordem de execução é crucial para respeitar as chaves estrangeiras
    '''gerar_pacientes()
    gerar_medicos()
    gerar_especialidades()
    gerar_doencas()
    gerar_consultas()
    gerar_diagnosticos()'''
    gerar_exerce_esp() 
    
    print("\n--- GERANDO DADOS PARA TABELAS RESTANTES ---\n")
    '''gerar_agendas()
    gerar_diagnostica_join()'''
    
    print("\n=== GERAÇÃO DE DADOS CONCLUÍDA ===")
    print("📁 Os arquivos .txt estão prontos para serem importados no pgAdmin4 na ordem numérica.")
    print("\n✅ Melhorias implementadas:")
    print("• Nomes brasileiros realistas para médicos e pacientes")
    print("• CPFs com dígitos verificadores válidos")
    print("• Telefones brasileiros com DDDs reais")
    print("• Endereços brasileiros completos")
    print("• Especialidades médicas reais")
    print("• Doenças comuns na prática médica")
    print("• Valores de consulta próximos da realidade")
    print("• Distribuição de idades mais realista")
    print("• Horários de funcionamento adequados")
    print("• Formas de pagamento contemporâneas")
    
    print(f"\n📊 Estatísticas:")
    print(f"• {NUM_PACIENTES:,} pacientes")
    print(f"• {NUM_MEDICOS:,} médicos")
    print(f"• {len(ESPECIALIDADES_MEDICAS):,} especialidades médicas")
    print(f"• {len(DOENCAS_COMUNS):,} doenças catalogadas")
    print(f"• {NUM_CONSULTAS:,} consultas")
    print(f"• {NUM_DIAGNOSTICOS:,} diagnósticos")