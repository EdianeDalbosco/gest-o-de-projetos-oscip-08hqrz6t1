migrate(
  (app) => {
    // Lista das tabelas de dados de negócio que continham dados de demonstração/seed
    // Ordem respeita integridade referencial reversa (filhos antes de pais)
    const tablesToClean = [
      'faturamentos_mensais',
      'catalogo_atividades',
      'metas',
      'empenhos',
      'atividades',
      'faturas',
      'despesas',
      'contratos',
      'planos_trabalho',
      'projetos',
      'secretarias',
      'convenios',
      'prestadores_colaboradores',
    ]

    for (let i = 0; i < tablesToClean.length; i++) {
      const tableName = tablesToClean[i]
      try {
        if (app.hasTable(tableName)) {
          const col = app.findCollectionByNameOrId(tableName)
          // app.truncateCollection esvazia todos os registros da coleção
          app.truncateCollection(col)
          console.log(`Coleção limpa com sucesso: ${tableName}`)
        }
      } catch (err) {
        console.log(`Aviso ao limpar coleção ${tableName}:`, err)
      }
    }
  },
  (app) => {
    // Rollback não precisa re-semear dados demo
  },
)
