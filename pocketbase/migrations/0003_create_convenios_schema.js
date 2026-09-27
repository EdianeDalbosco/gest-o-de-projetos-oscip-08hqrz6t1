migrate(
  (app) => {
    // 1. Coleção convenios
    const convenios = new Collection({
      name: 'convenios',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'municipio', type: 'text', required: true },
        { name: 'numero_instrumento', type: 'text', required: true },
        { name: 'orgao_contratante', type: 'text' },
        { name: 'valor_global', type: 'number', required: true },
        { name: 'data_inicio', type: 'date' },
        { name: 'data_fim', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['ativo', 'encerrado', 'suspenso'],
          maxSelect: 1,
        },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_convenios_status ON convenios (status)',
        'CREATE INDEX idx_convenios_municipio ON convenios (municipio)',
        'CREATE INDEX idx_convenios_data_fim ON convenios (data_fim)',
      ],
    })
    app.save(convenios)

    // 2. Coleção secretarias
    const conveniosId = convenios.id
    const secretarias = new Collection({
      name: 'secretarias',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        {
          name: 'convenio_id',
          type: 'relation',
          collectionId: conveniosId,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        { name: 'responsavel', type: 'text' },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_secretarias_convenio ON secretarias (convenio_id)'],
    })
    app.save(secretarias)

    // 3. Coleção planos_trabalho
    const secretariasId = secretarias.id
    const planosTrabalho = new Collection({
      name: 'planos_trabalho',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'titulo', type: 'text', required: true },
        {
          name: 'secretaria_id',
          type: 'relation',
          collectionId: secretariasId,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'convenio_id',
          type: 'relation',
          collectionId: conveniosId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'valor_previsto', type: 'number', required: true },
        { name: 'valor_empenhado', type: 'number' },
        { name: 'valor_executado', type: 'number' },
        { name: 'periodo', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['ativo', 'em_analise', 'concluido', 'suspenso'],
          maxSelect: 1,
        },
        { name: 'descricao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_planos_secretaria ON planos_trabalho (secretaria_id)',
        'CREATE INDEX idx_planos_convenio ON planos_trabalho (convenio_id)',
        'CREATE INDEX idx_planos_status ON planos_trabalho (status)',
      ],
    })
    app.save(planosTrabalho)

    // 4. Coleção metas
    const planosTrabalhoId = planosTrabalho.id
    const metas = new Collection({
      name: 'metas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'plano_trabalho_id',
          type: 'relation',
          collectionId: planosTrabalhoId,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        { name: 'descricao', type: 'text', required: true },
        { name: 'quantidade_alvo', type: 'number' },
        { name: 'quantidade_realizada', type: 'number' },
        {
          name: 'status',
          type: 'select',
          values: ['nao_iniciada', 'em_andamento', 'concluida', 'cancelada'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_metas_plano ON metas (plano_trabalho_id)',
        'CREATE INDEX idx_metas_status ON metas (status)',
      ],
    })
    app.save(metas)

    // 5. Adicionar campo plano_trabalho_id na coleção atividades (opcional)
    try {
      const atividades = app.findCollectionByNameOrId('atividades')
      if (!atividades.fields.getByName('plano_trabalho_id')) {
        atividades.fields.add(
          new RelationField({
            name: 'plano_trabalho_id',
            collectionId: planosTrabalhoId,
            maxSelect: 1,
          }),
        )
        app.save(atividades)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const atividades = app.findCollectionByNameOrId('atividades')
      atividades.fields.removeByName('plano_trabalho_id')
      app.save(atividades)
    } catch (_) {}

    const toDelete = ['metas', 'planos_trabalho', 'secretarias', 'convenios']
    for (let i = 0; i < toDelete.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(toDelete[i])
        app.delete(col)
      } catch (_) {}
    }
  },
)
