migrate(
  (app) => {
    const conveniosCol = app.findCollectionByNameOrId('convenios')
    const secretariasCol = app.findCollectionByNameOrId('secretarias')
    const planosCol = app.findCollectionByNameOrId('planos_trabalho')
    const metasCol = app.findCollectionByNameOrId('metas')
    const faturasCol = app.findCollectionByNameOrId('faturas')

    // 1. Criar coleção empenhos
    try {
      app.findCollectionByNameOrId('empenhos')
    } catch (_) {
      const empenhos = new Collection({
        name: 'empenhos',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'secretaria_id',
            type: 'relation',
            collectionId: secretariasCol.id,
            cascadeDelete: true,
            maxSelect: 1,
            required: true,
          },
          {
            name: 'convenio_id',
            type: 'relation',
            collectionId: conveniosCol.id,
            cascadeDelete: false,
            maxSelect: 1,
            required: false,
          },
          { name: 'numero', type: 'text', required: true },
          { name: 'descricao', type: 'text' },
          { name: 'valor', type: 'number', required: true },
          { name: 'data', type: 'date' },
          {
            name: 'status',
            type: 'select',
            values: ['reservado', 'liquidado', 'pago'],
            maxSelect: 1,
            required: true,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_empenhos_secretaria ON empenhos (secretaria_id)',
          'CREATE INDEX idx_empenhos_convenio ON empenhos (convenio_id)',
          'CREATE INDEX idx_empenhos_status ON empenhos (status)',
          'CREATE INDEX idx_empenhos_data ON empenhos (data)',
        ],
      })
      app.save(empenhos)
    }

    // 2. Adicionar campo prazo em metas se não existir
    if (!metasCol.fields.getByName('prazo')) {
      metasCol.fields.add(
        new DateField({
          name: 'prazo',
          required: false,
        }),
      )
      app.save(metasCol)
    }

    // 3. Adicionar campo plano_trabalho_id em faturas se não existir
    if (!faturasCol.fields.getByName('plano_trabalho_id')) {
      faturasCol.fields.add(
        new RelationField({
          name: 'plano_trabalho_id',
          collectionId: planosCol.id,
          maxSelect: 1,
          required: false,
        }),
      )
      faturasCol.addIndex('idx_faturas_plano', false, 'plano_trabalho_id', '')
      app.save(faturasCol)
    }
  },
  (app) => {
    try {
      const faturasCol = app.findCollectionByNameOrId('faturas')
      faturasCol.fields.removeByName('plano_trabalho_id')
      faturasCol.removeIndex('idx_faturas_plano')
      app.save(faturasCol)
    } catch (_) {}

    try {
      const metasCol = app.findCollectionByNameOrId('metas')
      metasCol.fields.removeByName('prazo')
      app.save(metasCol)
    } catch (_) {}

    try {
      const empenhos = app.findCollectionByNameOrId('empenhos')
      app.delete(empenhos)
    } catch (_) {}
  },
)
