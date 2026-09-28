migrate(
  (app) => {
    // 1. Coleção organizacao_config (singleton de configuração da OSCIP)
    const col = new Collection({
      name: 'organizacao_config',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome_organizacao', type: 'text', required: true },
        { name: 'natureza_juridica', type: 'text' },
        { name: 'cnpj', type: 'text', required: true },
        { name: 'endereco_completo', type: 'text', required: true },
        { name: 'cidade', type: 'text' },
        { name: 'estado', type: 'text' },
        { name: 'foro', type: 'text' },
        { name: 'presidente_nome', type: 'text', required: true },
        { name: 'presidente_cpf', type: 'text', required: true },
        { name: 'presidente_cargo', type: 'text', required: true },
        { name: 'telefone', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'termo_parceria_padrao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_org_config_cnpj ON organizacao_config (cnpj)'],
    })
    app.save(col)

    // Inserir registro inicial/default com os dados fixos atuais do projeto
    try {
      const existing = app.findFirstRecordByData('organizacao_config', 'cnpj', '45.603.168/0001-20')
      if (existing) return
    } catch (_) {}

    const defaultRecord = new Record(col)
    defaultRecord.set('nome_organizacao', 'ORGANIZAÇÃO DE SAÚDE SÃO BENTO')
    defaultRecord.set(
      'natureza_juridica',
      'pessoa jurídica de direito privado, qualificada pelo Ministério da Justiça como Organização da Sociedade Civil de Interesse Público - OSCIP em âmbito Nacional',
    )
    defaultRecord.set('cnpj', '45.603.168/0001-20')
    defaultRecord.set(
      'endereco_completo',
      'Rua Trinta e Seis, 119, Lote 10 Quadra 05, Bairro Boa Esperança, Cuiabá/MT, CEP 78.068-417',
    )
    defaultRecord.set('cidade', 'Cuiabá')
    defaultRecord.set('estado', 'MT')
    defaultRecord.set('foro', 'Comarca de Cuiabá/MT')
    defaultRecord.set('presidente_nome', 'Iredir Maria Laccal da Silva Ferreira')
    defaultRecord.set('presidente_cpf', '983.223.111-68')
    defaultRecord.set('presidente_cargo', 'Presidente')
    defaultRecord.set('telefone', '(65) 3000-0000')
    defaultRecord.set('email', 'contato@saobento.org.br')
    defaultRecord.set(
      'termo_parceria_padrao',
      'Termo de Parceria nº 001/2026, firmado entre a CONTRATANTE e a Prefeitura Municipal de Dom Aquino/MT, assinado em 15 de julho de 2026',
    )
    app.save(defaultRecord)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('organizacao_config')
      app.delete(col)
    } catch (_) {}
  },
)
