migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('solicitacoes')

      // 1. Campo solicitante (texto)
      if (!col.fields.getByName('solicitante')) {
        col.fields.add(
          new TextField({
            name: 'solicitante',
            required: false,
          }),
        )
      }

      // 2. Campo data_solicitacao (date)
      if (!col.fields.getByName('data_solicitacao')) {
        col.fields.add(
          new DateField({
            name: 'data_solicitacao',
            required: false,
          }),
        )
      }

      // 3. Campo anexo (file - max 10MB, mime types permitidos)
      if (!col.fields.getByName('anexo')) {
        col.fields.add(
          new FileField({
            name: 'anexo',
            maxSelect: 1,
            maxSize: 10485760, // 10MB
            mimeTypes: [
              'application/pdf',
              'image/jpeg',
              'image/png',
              'image/webp',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'text/plain',
              'text/csv',
            ],
            protected: false,
          }),
        )
      }

      // Adicionar índice para busca por solicitante e data_solicitacao
      col.addIndex('idx_solicitacoes_solicitante', false, 'solicitante', '')
      col.addIndex('idx_solicitacoes_data_solicitacao', false, 'data_solicitacao', '')

      app.save(col)
    } catch (e) {
      console.log('Erro ao atualizar campos de solicitacoes:', e)
      throw e
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('solicitacoes')
      col.removeIndex('idx_solicitacoes_solicitante')
      col.removeIndex('idx_solicitacoes_data_solicitacao')
      if (col.fields.getByName('solicitante')) {
        col.fields.removeByName('solicitante')
      }
      if (col.fields.getByName('data_solicitacao')) {
        col.fields.removeByName('data_solicitacao')
      }
      if (col.fields.getByName('anexo')) {
        col.fields.removeByName('anexo')
      }
      app.save(col)
    } catch (_) {}
  },
)
