migrate(
  (app) => {
    // 1. Campo de arquivo PDF na coleção 'convenios'
    try {
      const conveniosCol = app.findCollectionByNameOrId('convenios')
      if (!conveniosCol.fields.getByName('anexo_pdf')) {
        conveniosCol.fields.add(
          new FileField({
            name: 'anexo_pdf',
            maxSelect: 1,
            maxSize: 52428800, // 50MB
            mimeTypes: ['application/pdf'],
            protected: false,
          }),
        )
        app.save(conveniosCol)
      }
    } catch (e) {
      console.log('Erro ao adicionar anexo_pdf em convenios:', e)
    }

    // 2. Coleção prestadores_colaboradores (Cadastro de Prestadores e CLTs)
    try {
      if (!app.hasTable('prestadores_colaboradores')) {
        const prestadoresCol = new Collection({
          name: 'prestadores_colaboradores',
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
            // Dados PJ
            { name: 'razao_social', type: 'text' },
            { name: 'cnpj', type: 'text' },
            { name: 'profissional', type: 'text' },
            { name: 'cpf_profissional', type: 'text' },
            { name: 'natureza_juridica', type: 'text' },
            { name: 'endereco', type: 'text' },
            // Dados CLT
            { name: 'nome_colaborador', type: 'text' },
            { name: 'cpf_colaborador', type: 'text' },
            { name: 'codigo_consisa', type: 'text' },
            { name: 'cargo', type: 'text', required: true },
            { name: 'setor', type: 'text' },
            { name: 'situacao', type: 'text' },
            { name: 'remuneracao_base', type: 'number' },
            { name: 'observacoes', type: 'text' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: [
            'CREATE INDEX idx_prestadores_tipo ON prestadores_colaboradores (tipo)',
            'CREATE INDEX idx_prestadores_cnpj ON prestadores_colaboradores (cnpj)',
            'CREATE INDEX idx_prestadores_cpf ON prestadores_colaboradores (cpf_colaborador)',
          ],
        })
        app.save(prestadoresCol)
      }
    } catch (e) {
      console.log('Erro ao criar colecao prestadores_colaboradores:', e)
    }

    // 3. Atualizar coleção 'projetos' para conectar com secretaria_id, convenio_id e custos mensais
    try {
      const secretariasCol = app.findCollectionByNameOrId('secretarias')
      const conveniosCol = app.findCollectionByNameOrId('convenios')
      const projetosCol = app.findCollectionByNameOrId('projetos')

      if (!projetosCol.fields.getByName('secretaria_id')) {
        projetosCol.fields.add(
          new RelationField({
            name: 'secretaria_id',
            collectionId: secretariasCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          }),
        )
      }
      if (!projetosCol.fields.getByName('convenio_id')) {
        projetosCol.fields.add(
          new RelationField({
            name: 'convenio_id',
            collectionId: conveniosCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          }),
        )
      }
      if (!projetosCol.fields.getByName('valor_mensal_execucao')) {
        projetosCol.fields.add(
          new NumberField({
            name: 'valor_mensal_execucao',
            min: 0,
          }),
        )
      }
      if (!projetosCol.fields.getByName('valor_mensal_despesas_adm')) {
        projetosCol.fields.add(
          new NumberField({
            name: 'valor_mensal_despesas_adm',
            min: 0,
          }),
        )
      }
      if (!projetosCol.fields.getByName('meses_duracao')) {
        projetosCol.fields.add(
          new NumberField({
            name: 'meses_duracao',
            min: 1,
          }),
        )
      }
      app.save(projetosCol)
    } catch (e) {
      console.log('Erro ao atualizar campos de projetos:', e)
    }

    // 4. Coleção catalogo_atividades (Catálogo de Atividades vinculadas aos projetos)
    try {
      const projetosCol = app.findCollectionByNameOrId('projetos')
      if (!app.hasTable('catalogo_atividades')) {
        const catalogoCol = new Collection({
          name: 'catalogo_atividades',
          type: 'base',
          listRule: "@request.auth.id != ''",
          viewRule: "@request.auth.id != ''",
          createRule: "@request.auth.id != ''",
          updateRule: "@request.auth.id != ''",
          deleteRule: "@request.auth.id != ''",
          fields: [
            {
              name: 'projeto_id',
              type: 'relation',
              collectionId: projetosCol.id,
              maxSelect: 1,
              cascadeDelete: true,
              required: true,
            },
            {
              name: 'tipo_vinculo',
              type: 'select',
              values: ['CLT', 'PJ'],
              maxSelect: 1,
              required: true,
            },
            {
              name: 'tipo_execucao',
              type: 'select',
              values: ['Mensal', 'Serviço Mensal', 'Conforme Demanda', 'Plantão'],
              maxSelect: 1,
              required: true,
            },
            { name: 'descricao', type: 'text', required: true },
            { name: 'valor_unitario', type: 'number', required: true },
            // CLT breakdown referencial
            { name: 'proventos', type: 'number' },
            { name: 'provisao', type: 'number' },
            { name: 'encargos', type: 'number' },
            { name: 'detalhes_escopo', type: 'text' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: [
            'CREATE INDEX idx_catalogo_projeto ON catalogo_atividades (projeto_id)',
            'CREATE INDEX idx_catalogo_tipo ON catalogo_atividades (tipo_vinculo)',
          ],
        })
        app.save(catalogoCol)
      }
    } catch (e) {
      console.log('Erro ao criar colecao catalogo_atividades:', e)
    }

    // 5. Coleção faturamentos_mensais (Lançamento mensal de faturamento com relatório completo)
    try {
      const conveniosCol = app.findCollectionByNameOrId('convenios')
      const secretariasCol = app.findCollectionByNameOrId('secretarias')
      const projetosCol = app.findCollectionByNameOrId('projetos')

      if (!app.hasTable('faturamentos_mensais')) {
        const fatMensalCol = new Collection({
          name: 'faturamentos_mensais',
          type: 'base',
          listRule: "@request.auth.id != ''",
          viewRule: "@request.auth.id != ''",
          createRule: "@request.auth.id != ''",
          updateRule: "@request.auth.id != ''",
          deleteRule: "@request.auth.id != ''",
          fields: [
            { name: 'numero_sequencial', type: 'text', required: true },
            {
              name: 'convenio_id',
              type: 'relation',
              collectionId: conveniosCol.id,
              maxSelect: 1,
              cascadeDelete: false,
              required: true,
            },
            {
              name: 'secretaria_id',
              type: 'relation',
              collectionId: secretariasCol.id,
              maxSelect: 1,
              cascadeDelete: false,
              required: true,
            },
            {
              name: 'projeto_id',
              type: 'relation',
              collectionId: projetosCol.id,
              maxSelect: 1,
              cascadeDelete: false,
            },
            {
              name: 'tipo_faturamento',
              type: 'select',
              values: ['PJ', 'CLT', 'CONSOLIDADO'],
              maxSelect: 1,
              required: true,
            },
            { name: 'competencia', type: 'text', required: true }, // Ex: "01 A 31 DE AGOSTO DE 2026"
            { name: 'periodo', type: 'text', required: true }, // Ex: "AGOSTO DE 2026"
            { name: 'mes', type: 'number', required: true },
            { name: 'ano', type: 'number', required: true },
            { name: 'valor_execucao_direta', type: 'number', required: true },
            { name: 'valor_execucao_clt', type: 'number' },
            { name: 'valor_execucao_pj', type: 'number' },
            { name: 'valor_despesas_adm', type: 'number' },
            { name: 'valor_total', type: 'number', required: true },
            {
              name: 'status_nf',
              type: 'select',
              values: ['aguardando_nf', 'nf_emitida', 'liquidado'],
              maxSelect: 1,
            },
            { name: 'numero_nf', type: 'text' },
            { name: 'data_emissao_nf', type: 'date' },
            { name: 'dados_resumo', type: 'json' },
            { name: 'itens_detalhamento_pj', type: 'json' },
            { name: 'itens_detalhamento_clt', type: 'json' },
            { name: 'itens_por_atividade', type: 'json' },
            { name: 'rateio_despesas_adm', type: 'json' },
            { name: 'observacoes', type: 'text' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: [
            'CREATE UNIQUE INDEX idx_fat_mensal_num ON faturamentos_mensais (numero_sequencial)',
            'CREATE INDEX idx_fat_mensal_conv ON faturamentos_mensais (convenio_id)',
            'CREATE INDEX idx_fat_mensal_sec ON faturamentos_mensais (secretaria_id)',
            'CREATE INDEX idx_fat_mensal_periodo ON faturamentos_mensais (ano, mes)',
          ],
        })
        app.save(fatMensalCol)
      }
    } catch (e) {
      console.log('Erro ao criar colecao faturamentos_mensais:', e)
    }
  },
  (app) => {
    try {
      const faturamentosCol = app.findCollectionByNameOrId('faturamentos_mensais')
      app.delete(faturamentosCol)
    } catch (_) {}

    try {
      const catalogoCol = app.findCollectionByNameOrId('catalogo_atividades')
      app.delete(catalogoCol)
    } catch (_) {}

    try {
      const prestadoresCol = app.findCollectionByNameOrId('prestadores_colaboradores')
      app.delete(prestadoresCol)
    } catch (_) {}

    try {
      const conveniosCol = app.findCollectionByNameOrId('convenios')
      conveniosCol.fields.removeByName('anexo_pdf')
      app.save(conveniosCol)
    } catch (_) {}
  },
)
