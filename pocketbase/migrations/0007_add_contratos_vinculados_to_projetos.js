migrate(
  (app) => {
    const projetosCol = app.findCollectionByNameOrId('projetos')

    if (!projetosCol.fields.getByName('contratos_vinculados')) {
      projetosCol.fields.add(
        new SelectField({
          name: 'contratos_vinculados',
          values: ['CLT', 'PJ'],
          maxSelect: 1,
          required: false,
        }),
      )
      app.save(projetosCol)
    }

    // Preencher projetos existentes com valor padrão consistente
    app
      .db()
      .newQuery(`
      UPDATE projetos
      SET contratos_vinculados = CASE
        WHEN nome LIKE '%Vacinação%' THEN 'CLT'
        WHEN nome LIKE '%Digital%' THEN 'PJ'
        ELSE 'PJ'
      END
      WHERE contratos_vinculados IS NULL OR contratos_vinculados = ''
    `)
      .execute()
  },
  (app) => {
    try {
      const projetosCol = app.findCollectionByNameOrId('projetos')
      projetosCol.fields.removeByName('contratos_vinculados')
      app.save(projetosCol)
    } catch (_) {}
  },
)
