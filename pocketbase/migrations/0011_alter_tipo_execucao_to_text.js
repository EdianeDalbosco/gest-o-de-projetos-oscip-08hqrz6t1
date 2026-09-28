migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('catalogo_atividades')
      const field = col.fields.getByName('tipo_execucao')

      if (field) {
        // Se for SelectField ou precisamos torná-lo TextField para aceitar qualquer texto livre da planilha
        col.fields.removeByName('tipo_execucao')
        col.fields.add(
          new TextField({
            name: 'tipo_execucao',
            required: true,
          }),
        )
        app.save(col)
        console.log('Campo tipo_execucao alterado para TextField com sucesso')
      }
    } catch (err) {
      console.log('Erro ao atualizar tipo_execucao em catalogo_atividades:', err)
      throw err
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('catalogo_atividades')
      col.fields.removeByName('tipo_execucao')
      col.fields.add(
        new SelectField({
          name: 'tipo_execucao',
          values: ['Mensal', 'Serviço Mensal', 'Conforme Demanda', 'Plantão'],
          maxSelect: 1,
          required: true,
        }),
      )
      app.save(col)
    } catch (_) {}
  },
)
