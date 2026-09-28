migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('prestadores_colaboradores')

    // Dados de exemplo para Prestadores de Serviços (PJ)
    // Especialidades de saúde: fisioterapia, psicologia, terapia ocupacional, fonoaudiologia, nutrição e enfermagem especializada
    // Alguns com remuneração mensal e outros com modalidade sob demanda / plantão
    const prestadoresPJ = [
      {
        tipo: 'PJ',
        razao_social: 'Vitalis Fisioterapia Integrada LTDA',
        cnpj: '38.412.789/0001-45',
        natureza_juridica: 'Sociedade Empresária Limitada (LTDA)',
        profissional: 'Dr. Lucas Silveira Mendes',
        cpf_profissional: '714.829.351-04',
        cargo: 'Serviço de Fisioterapia e Reabilitação Motora',
        remuneracao_base: 4800.0,
        endereco: 'Av. Brasil, nº 450, Centro, Dom Aquino/MT',
        observacoes:
          'Contrato Mensal. Responsável pelos atendimentos no Centro Municipal de Reabilitação e visitas domiciliares de fisioterapia.',
      },
      {
        tipo: 'PJ',
        razao_social: 'Espaço Integrar Psicologia e Desenvolvimento Humano LTDA',
        cnpj: '42.183.905/0001-82',
        natureza_juridica: 'Sociedade Empresária Limitada (LTDA)',
        profissional: 'Dra. Camila Nogueira Dantas',
        cpf_profissional: '625.384.912-87',
        cargo: 'Serviço de Psicologia Clínica e da Saúde',
        remuneracao_base: 3300.0,
        endereco: 'Rua Treze de Maio, nº 210, Sala 02, Dom Aquino/MT',
        observacoes:
          'Contrato Mensal (Serviço Mensal). Atendimentos psicológicos individuais e em grupo nas Unidades Básicas de Saúde (ESF).',
      },
      {
        tipo: 'PJ',
        razao_social: 'Clínica Som & Fala Fonoaudiologia Especializada LTDA',
        cnpj: '29.741.520/0001-63',
        natureza_juridica: 'Sociedade Limitada Unipessoal (SLU)',
        profissional: 'Dra. Renata Vasconcelos Ribeiro',
        cpf_profissional: '839.201.745-33',
        cargo: 'Serviço de Fonoaudiologia Clínica',
        remuneracao_base: 180.0,
        endereco: 'Rua São José, nº 88, Jardim América, Dom Aquino/MT',
        observacoes:
          'Contrato Conforme Demanda (R$ 180,00 por sessão/avaliação realizada). Atendimentos fonoaudiológicos infantis e de reabilitação pós-AVC.',
      },
      {
        tipo: 'PJ',
        razao_social: 'Elo Terapia Ocupacional e Reabilitação Sensorial LTDA',
        cnpj: '35.698.147/0001-90',
        natureza_juridica: 'Sociedade Empresária Limitada (LTDA)',
        profissional: 'Dra. Beatriz Helena Fagundes',
        cpf_profissional: '502.918.437-12',
        cargo: 'Serviço de Terapia Ocupacional',
        remuneracao_base: 4200.0,
        endereco: 'Av. Mutum, nº 115, Dom Aquino/MT',
        observacoes:
          'Contrato Mensal. Atuação em estimulação precoce, apoio ao neurodesenvolvimento infantil e suporte à terceira idade.',
      },
      {
        tipo: 'PJ',
        razao_social: 'NutriSaúde Consultoria e Assessoria Nutricional LTDA',
        cnpj: '47.320.615/0001-29',
        natureza_juridica: 'Sociedade Limitada Unipessoal (SLU)',
        profissional: 'Dr. Thiago Albuquerque Paes',
        cpf_profissional: '416.752.839-50',
        cargo: 'Serviço de Nutrição Clínica e Saúde Coletiva',
        remuneracao_base: 3800.0,
        endereco: 'Av. Mato Grosso, nº 620, Dom Aquino/MT',
        observacoes:
          'Contrato Mensal. Planejamento nutricional para programas municipais de hipertensos/diabéticos e pré-natal.',
      },
      {
        tipo: 'PJ',
        razao_social: 'MedPlantão Cuidados Médicos e Assistenciais LTDA',
        cnpj: '51.938.402/0001-14',
        natureza_juridica: 'Sociedade Empresária Limitada (LTDA)',
        profissional: 'Dr. André Martins Fontes',
        cpf_profissional: '348.619.520-78',
        cargo: 'Serviço Médico – Plantão de Urgência e Emergência',
        remuneracao_base: 1400.0,
        endereco: 'Rua Goiás, nº 305, Centro, Dom Aquino/MT',
        observacoes:
          'Contrato Conforme Demanda / Plantão (R$ 1.400,00 por plantão de 12 horas). Cobertura de escala do Pronto Atendimento Municipal.',
      },
    ]

    // Dados de exemplo para Colaboradores CLT
    // Cargos na área de saúde e gestão social com situação ativo
    const colaboradoresCLT = [
      {
        tipo: 'CLT',
        nome_colaborador: 'Mariana Duarte Siqueira',
        cpf_colaborador: '842.195.367-20',
        codigo_consisa: '401',
        cargo: 'Assistente Social',
        setor: 'Coordenação de Saúde e Acolhimento Social',
        situacao: 'Ativo',
        remuneracao_base: 3600.0,
        observacoes:
          'Atendimento socioassistencial nas Unidades de Saúde da Família e articulação da rede de atenção básica.',
      },
      {
        tipo: 'CLT',
        nome_colaborador: 'Juliana Pires de Carvalho',
        cpf_colaborador: '913.627.480-15',
        codigo_consisa: '402',
        cargo: 'Educadora Social em Saúde',
        setor: 'Vigilância em Saúde e Prevenção',
        situacao: 'Ativo',
        remuneracao_base: 2450.0,
        observacoes:
          'Desenvolvimento de oficinas socioeducativas de promoção da saúde comunitária, combate à dengue e saúde preventiva.',
      },
      {
        tipo: 'CLT',
        nome_colaborador: 'Marcos Vinicius de Rezende',
        cpf_colaborador: '571.408.293-68',
        codigo_consisa: '403',
        cargo: 'Coordenador de Projetos de Saúde',
        setor: 'Supervisão do Termo de Parceria nº 001/2026',
        situacao: 'Ativo',
        remuneracao_base: 5500.0,
        observacoes:
          'Acompanhamento de metas assistenciais pactuadas com a Prefeitura Municipal de Dom Aquino/MT e escalas das equipes.',
      },
      {
        tipo: 'CLT',
        nome_colaborador: 'Patrícia Rocha Fernandes',
        cpf_colaborador: '684.312.950-41',
        codigo_consisa: '404',
        cargo: 'Técnica de Enfermagem',
        setor: 'Atenção Básica e Sala de Vacinas',
        situacao: 'Ativo',
        remuneracao_base: 3220.0,
        observacoes:
          'Escala diurna de imunização e procedimentos básicos na Unidade Básica de Saúde Central.',
      },
    ]

    // Inserção ou atualização idempotente para PJ (por CNPJ)
    for (let i = 0; i < prestadoresPJ.length; i++) {
      const item = prestadoresPJ[i]
      let record = null

      try {
        record = app.findFirstRecordByData('prestadores_colaboradores', 'cnpj', item.cnpj)
      } catch (_) {
        record = null
      }

      if (!record) {
        record = new Record(col)
      }

      record.set('tipo', item.tipo)
      record.set('razao_social', item.razao_social)
      record.set('cnpj', item.cnpj)
      record.set('natureza_juridica', item.natureza_juridica)
      record.set('profissional', item.profissional)
      record.set('cpf_profissional', item.cpf_profissional)
      record.set('cargo', item.cargo)
      record.set('remuneracao_base', item.remuneracao_base)
      record.set('endereco', item.endereco)
      record.set('observacoes', item.observacoes)

      app.save(record)
    }

    // Inserção ou atualização idempotente para CLT (por CPF)
    for (let j = 0; j < colaboradoresCLT.length; j++) {
      const item = colaboradoresCLT[j]
      let record = null

      try {
        record = app.findFirstRecordByData(
          'prestadores_colaboradores',
          'cpf_colaborador',
          item.cpf_colaborador,
        )
      } catch (_) {
        record = null
      }

      if (!record) {
        record = new Record(col)
      }

      record.set('tipo', item.tipo)
      record.set('nome_colaborador', item.nome_colaborador)
      record.set('cpf_colaborador', item.cpf_colaborador)
      record.set('codigo_consisa', item.codigo_consisa)
      record.set('cargo', item.cargo)
      record.set('setor', item.setor)
      record.set('situacao', item.situacao)
      record.set('remuneracao_base', item.remuneracao_base)
      record.set('observacoes', item.observacoes)

      app.save(record)
    }
  },
  (app) => {
    // Rollback remove os registros semeados pelo CNPJ e CPF especificados
    const cnpjs = [
      '38.412.789/0001-45',
      '42.183.905/0001-82',
      '29.741.520/0001-63',
      '35.698.147/0001-90',
      '47.320.615/0001-29',
      '51.938.402/0001-14',
    ]

    for (let i = 0; i < cnpjs.length; i++) {
      try {
        const record = app.findFirstRecordByData('prestadores_colaboradores', 'cnpj', cnpjs[i])
        app.delete(record)
      } catch (_) {}
    }

    const cpfs = ['842.195.367-20', '913.627.480-15', '571.408.293-68', '684.312.950-41']

    for (let j = 0; j < cpfs.length; j++) {
      try {
        const record = app.findFirstRecordByData(
          'prestadores_colaboradores',
          'cpf_colaborador',
          cpfs[j],
        )
        app.delete(record)
      } catch (_) {}
    }
  },
)
