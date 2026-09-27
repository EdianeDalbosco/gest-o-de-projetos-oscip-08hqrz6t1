migrate(
  (app) => {
    const projetosCol = app.findCollectionByNameOrId('projetos')
    const field = projetosCol.fields.getByName('contratos_vinculados')

    if (field) {
      field.maxSelect = 2
      field.values = ['CLT', 'PJ']
      app.save(projetosCol)
    } else {
      projetosCol.fields.add(
        new SelectField({
          name: 'contratos_vinculados',
          values: ['CLT', 'PJ'],
          maxSelect: 2,
          required: false,
        }),
      )
      app.save(projetosCol)
    }
  },
  (app) => {
    try {
      const projetosCol = app.findCollectionByNameOrId('projetos')
      const field = projetosCol.fields.getByName('contratos_vinculados')
      if (field) {
        field.maxSelect = 1
        app.save(projetosCol)
      }
    } catch (_) {}
  },
)
