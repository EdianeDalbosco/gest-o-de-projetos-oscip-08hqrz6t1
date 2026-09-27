migrate(
  (app) => {
    // 1. Projetos
    const projetos = new Collection({
      name: 'projetos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'valor_total', type: 'number', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['ativo', 'pausado', 'concluido', 'cancelado'],
          maxSelect: 1,
        },
        { name: 'progresso', type: 'number' },
        { name: 'data_inicio', type: 'date' },
        { name: 'data_fim', type: 'date' },
        { name: 'parceiro', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_projetos_status ON projetos (status)',
        'CREATE INDEX idx_projetos_data_fim ON projetos (data_fim)',
      ],
    })
    app.save(projetos)

    // 2. Contratos
    const projetosId = projetos.id
    const contratos = new Collection({
      name: 'contratos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'tipo',
          type: 'select',
          values: ['CLT', 'PJ'],
          maxSelect: 1,
          required: true,
        },
        { name: 'nome', type: 'text', required: true },
        { name: 'cargo_funcao', type: 'text', required: true },
        { name: 'valor', type: 'number', required: true },
        {
          name: 'tipo_pj',
          type: 'select',
          values: ['horas', 'mensal'],
          maxSelect: 1,
        },
        { name: 'data_inicio', type: 'date' },
        { name: 'data_fim', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['ativo', 'encerrado', 'vencendo'],
          maxSelect: 1,
        },
        {
          name: 'beneficios',
          type: 'select',
          values: ['VT', 'VA', 'PLR', 'Seguro', 'Outros'],
          maxSelect: 5,
        },
        { name: 'clausulas', type: 'text' },
        {
          name: 'projeto_id',
          type: 'relation',
          collectionId: projetosId,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_contratos_tipo ON contratos (tipo)',
        'CREATE INDEX idx_contratos_status ON contratos (status)',
        'CREATE INDEX idx_contratos_projeto ON contratos (projeto_id)',
      ],
    })
    app.save(contratos)

    // 3. Atividades
    const contratosId = contratos.id
    const atividades = new Collection({
      name: 'atividades',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'prestador_id',
          type: 'relation',
          collectionId: contratosId,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'projeto_id',
          type: 'relation',
          collectionId: projetosId,
          maxSelect: 1,
          required: true,
        },
        { name: 'descricao', type: 'text', required: true },
        { name: 'data', type: 'date', required: true },
        { name: 'horas', type: 'number', required: true, min: 0.5, max: 24 },
        {
          name: 'status',
          type: 'select',
          values: ['pendente', 'aprovada', 'rejeitada'],
          maxSelect: 1,
        },
        { name: 'valor_aprovado', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_atividades_prestador ON atividades (prestador_id)',
        'CREATE INDEX idx_atividades_projeto ON atividades (projeto_id)',
        'CREATE INDEX idx_atividades_status ON atividades (status)',
        'CREATE INDEX idx_atividades_data ON atividades (data)',
      ],
    })
    app.save(atividades)

    // 4. Faturas
    const faturas = new Collection({
      name: 'faturas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'numero', type: 'text', required: true },
        {
          name: 'projeto_id',
          type: 'relation',
          collectionId: projetosId,
          maxSelect: 1,
        },
        {
          name: 'contrato_id',
          type: 'relation',
          collectionId: contratosId,
          maxSelect: 1,
        },
        { name: 'valor', type: 'number', required: true },
        { name: 'data_emissao', type: 'date', required: true },
        { name: 'data_vencimento', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['emitida', 'paga', 'vencida'],
          maxSelect: 1,
        },
        { name: 'forma_pagamento', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_faturas_numero ON faturas (numero)',
        'CREATE INDEX idx_faturas_status ON faturas (status)',
        'CREATE INDEX idx_faturas_vencimento ON faturas (data_vencimento)',
        'CREATE INDEX idx_faturas_projeto ON faturas (projeto_id)',
        'CREATE INDEX idx_faturas_contrato ON faturas (contrato_id)',
      ],
    })
    app.save(faturas)

    // 5. Despesas
    const despesas = new Collection({
      name: 'despesas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'categoria',
          type: 'select',
          values: ['Pessoal', 'Operacional', 'Marketing', 'Infraestrutura', 'Outros'],
          maxSelect: 1,
          required: true,
        },
        { name: 'descricao', type: 'text', required: true },
        { name: 'valor', type: 'number', required: true },
        { name: 'data', type: 'date', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_despesas_categoria ON despesas (categoria)',
        'CREATE INDEX idx_despesas_data ON despesas (data)',
      ],
    })
    app.save(despesas)
  },
  (app) => {
    const toDelete = ['despesas', 'faturas', 'atividades', 'contratos', 'projetos']
    for (let i = 0; i < toDelete.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(toDelete[i])
        app.delete(col)
      } catch (_) {}
    }
  },
)
