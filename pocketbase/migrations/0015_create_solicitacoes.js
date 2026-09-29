migrate(
  (app) => {
    // 1. Obter referências de coleções relacionadas
    const projetosCol = app.findCollectionByNameOrId('projetos')
    const secretariasCol = app.findCollectionByNameOrId('secretarias')

    // 2. Criar coleção solicitacoes
    const solicitacoes = new Collection({
      name: 'solicitacoes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'titulo', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        {
          name: 'tipo',
          type: 'select',
          values: ['Solicitação', 'Pendência', 'Pendência Financeira', 'Documentação', 'Outro'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'prioridade',
          type: 'select',
          values: ['Baixa', 'Média', 'Alta', 'Urgente'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          values: [
            'Aberta',
            'Em Análise',
            'Em Andamento',
            'Aguardando Terceiro',
            'Concluída',
            'Cancelada',
          ],
          maxSelect: 1,
          required: true,
        },
        { name: 'responsavel', type: 'text' },
        { name: 'prazo', type: 'date' },
        {
          name: 'projeto',
          type: 'relation',
          collectionId: projetosCol.id,
          maxSelect: 1,
        },
        {
          name: 'secretaria',
          type: 'relation',
          collectionId: secretariasCol.id,
          maxSelect: 1,
        },
        { name: 'conclusao', type: 'text' },
        { name: 'criado_por', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_solicitacoes_status ON solicitacoes (status)',
        'CREATE INDEX idx_solicitacoes_prioridade ON solicitacoes (prioridade)',
        'CREATE INDEX idx_solicitacoes_projeto ON solicitacoes (projeto)',
        'CREATE INDEX idx_solicitacoes_prazo ON solicitacoes (prazo)',
      ],
    })
    app.save(solicitacoes)

    // 3. Povoar com 4-6 registros de exemplo realistas vinculados a projetos de saúde/municipais existentes
    try {
      const projetos = app.findRecordsByFilter('projetos', '', 'created', 10, 0)
      const secretarias = app.findRecordsByFilter('secretarias', '', 'created', 10, 0)

      const p1 = projetos.length > 0 ? projetos[0].id : null
      const s1 = secretarias.length > 0 ? secretarias[0].id : null

      const p2 = projetos.length > 1 ? projetos[1].id : p1
      const s2 = secretarias.length > 1 ? secretarias[1].id : s1

      const p3 = projetos.length > 2 ? projetos[2].id : p1
      const s3 = secretarias.length > 2 ? secretarias[2].id : s1

      const seedData = [
        {
          titulo: 'Regularização de certidão negativa municipal (CND) para repasse',
          descricao:
            'Apresentar certidão de tributos municipais atualizada da OSCIP para viabilizar liberação da 2ª parcela do Termo de Parceria da Saúde.',
          tipo: 'Pendência Financeira',
          prioridade: 'Urgente',
          status: 'Aberta',
          responsavel: 'Financeiro OSCIP',
          prazo: '2026-09-15 18:00:00.000Z', // vencido/atrasado
          projeto: p1,
          secretaria: s1,
          criado_por: 'Ediane Dalbosco',
          conclusao: '',
        },
        {
          titulo: 'Adequação da escala de plantões médicos no CAPS e UBS Central',
          descricao:
            'Necessidade de ajuste na escala médica quinzenal para cobrir ausências informadas pela coordenação clínica de saúde.',
          tipo: 'Solicitação',
          prioridade: 'Alta',
          status: 'Em Andamento',
          responsavel: 'Dra. Camila Santos (Coord. Médica)',
          prazo: '2026-10-10 18:00:00.000Z',
          projeto: p2,
          secretaria: s2,
          criado_por: 'Ediane Dalbosco',
          conclusao: '',
        },
        {
          titulo: 'Relatório mensal de execução física e cumprimento de metas de saúde',
          descricao:
            'Consolidação das fichas de atendimentos médicos e odontológicos realizados para compor a prestação de contas mensal.',
          tipo: 'Documentação',
          prioridade: 'Média',
          status: 'Em Análise',
          responsavel: 'Equipe de Gestão e Projetos',
          prazo: '2026-10-05 18:00:00.000Z',
          projeto: p3,
          secretaria: s3,
          criado_por: 'Ediane Dalbosco',
          conclusao: '',
        },
        {
          titulo: 'Autorização de aditivo de termo para insumos e material de enfermagem',
          descricao:
            'Aguardando parecer técnico da Procuradoria Municipal e aprovação da Secretaria de Saúde.',
          tipo: 'Pendência',
          prioridade: 'Alta',
          status: 'Aguardando Terceiro',
          responsavel: 'Secretaria Municipal de Saúde',
          prazo: '2026-10-20 18:00:00.000Z',
          projeto: p1,
          secretaria: s1,
          criado_por: 'Ediane Dalbosco',
          conclusao: '',
        },
        {
          titulo: 'Assinatura dos termos de adesão dos novos médicos plantonistas',
          descricao:
            'Coleta de assinaturas digitais dos contratos de prestação de serviços PJ conforme modelo padrão homologado.',
          tipo: 'Documentação',
          prioridade: 'Média',
          status: 'Concluída',
          responsavel: 'Jurídico OSCIP',
          prazo: '2026-09-25 18:00:00.000Z',
          projeto: p2,
          secretaria: s2,
          criado_por: 'Ediane Dalbosco',
          conclusao:
            'Todos os 6 contratos foram assinados eletronicamente e devidamente anexados ao prontuário institucional.',
        },
      ]

      for (let i = 0; i < seedData.length; i++) {
        const item = seedData[i]
        const rec = new Record(solicitacoes)
        rec.set('titulo', item.titulo)
        rec.set('descricao', item.descricao)
        rec.set('tipo', item.tipo)
        rec.set('prioridade', item.prioridade)
        rec.set('status', item.status)
        rec.set('responsavel', item.responsavel)
        rec.set('prazo', item.prazo)
        if (item.projeto) rec.set('projeto', item.projeto)
        if (item.secretaria) rec.set('secretaria', item.secretaria)
        rec.set('conclusao', item.conclusao)
        rec.set('criado_por', item.criado_por)
        app.save(rec)
      }
    } catch (e) {
      console.log('Erro ao popular dados de exemplo em solicitacoes:', e)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('solicitacoes')
      app.delete(col)
    } catch (_) {}
  },
)
