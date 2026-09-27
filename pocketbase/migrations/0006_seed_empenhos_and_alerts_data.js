migrate(
  (app) => {
    const conveniosCol = app.findCollectionByNameOrId('convenios')
    const secretariasCol = app.findCollectionByNameOrId('secretarias')
    const planosCol = app.findCollectionByNameOrId('planos_trabalho')
    const metasCol = app.findCollectionByNameOrId('metas')
    const empenhosCol = app.findCollectionByNameOrId('empenhos')
    const faturasCol = app.findCollectionByNameOrId('faturas')

    let conv
    try {
      conv = app.findFirstRecordByData('convenios', 'numero_instrumento', 'CONV-001/2024')
    } catch (_) {
      return
    }

    // 1. Obter secretarias do convênio
    let secSaude, secEdu, secSocial
    try {
      secSaude = app.findFirstRecordByData('secretarias', 'nome', 'Secretaria Municipal de Saúde')
    } catch (_) {}
    try {
      secEdu = app.findFirstRecordByData('secretarias', 'nome', 'Secretaria Municipal de Educação')
    } catch (_) {}
    try {
      secSocial = app.findFirstRecordByData(
        'secretarias',
        'nome',
        'Secretaria Municipal de Assistência Social',
      )
    } catch (_) {}

    // 2. Semear Empenhos representativos
    const empenhosData = [
      // Saúde
      {
        sec: secSaude,
        numero: '2024-001',
        descricao: 'Aquisição de insumos básicos e kits preventivos para busca ativa domiciliar',
        valor: 115000,
        data: '2024-02-15 00:00:00.000Z',
        status: 'liquidado',
      },
      {
        sec: secSaude,
        numero: '2024-002',
        descricao:
          'Contratação de equipe especializada em triagem oftalmológica e odontológica comunitária',
        valor: 95000,
        data: '2024-03-20 00:00:00.000Z',
        status: 'pago',
      },
      {
        sec: secSaude,
        numero: '2024-003',
        descricao: 'Reserva orçamentária para manutenção da unidade móvel de atendimento básico',
        valor: 45000,
        data: '2024-06-10 00:00:00.000Z',
        status: 'reservado',
      },
      // Educação
      {
        sec: secEdu,
        numero: '2024-004',
        descricao: 'Aquisição de kits modulares de robótica e tablets pedagógicos para oficinas',
        valor: 130000,
        data: '2024-02-28 00:00:00.000Z',
        status: 'liquidado',
      },
      {
        sec: secEdu,
        numero: '2024-005',
        descricao: 'Contratação de bolsistas de tecnologia e reforço de linguagem no contraturno',
        valor: 85000,
        data: '2024-04-12 00:00:00.000Z',
        status: 'pago',
      },
      // Assistência Social
      {
        sec: secSocial,
        numero: '2024-006',
        descricao:
          'Insumos de capacitação culinária, uniformes e apostilas do curso de panificação',
        valor: 90000,
        data: '2024-03-05 00:00:00.000Z',
        status: 'pago',
      },
      {
        sec: secSocial,
        numero: '2024-007',
        descricao: 'Reserva para transporte e lanche comunitário dos grupos de convivência do SCFV',
        valor: 60000,
        data: '2024-05-18 00:00:00.000Z',
        status: 'reservado',
      },
    ]

    for (let i = 0; i < empenhosData.length; i++) {
      const item = empenhosData[i]
      if (!item.sec) continue
      try {
        app.findFirstRecordByData('empenhos', 'numero', item.numero)
      } catch (_) {
        const emp = new Record(empenhosCol)
        emp.set('secretaria_id', item.sec.id)
        emp.set('convenio_id', conv.id)
        emp.set('numero', item.numero)
        emp.set('descricao', item.descricao)
        emp.set('valor', item.valor)
        emp.set('data', item.data)
        emp.set('status', item.status)
        app.save(emp)
      }
    }

    // 3. Atualizar prazos nas metas e criar/atualizar metas com prazo vencido e execução parcial
    // A data de corte pode ser no passado (ex: 2024-06-30 ou 2024-08-15)
    try {
      const mSaude1 = app.findFirstRecordByData(
        'metas',
        'descricao',
        'Visitas domiciliares a famílias cadastradas no SUS',
      )
      // Prazo passado, executado 980 de 1200 -> ATRASADA
      mSaude1.set('prazo', '2024-05-31 00:00:00.000Z')
      mSaude1.set('quantidade_alvo', 1200)
      mSaude1.set('quantidade_realizada', 980)
      mSaude1.set('status', 'em_andamento')
      app.save(mSaude1)
    } catch (_) {}

    try {
      const mEdu1 = app.findFirstRecordByData(
        'metas',
        'descricao',
        'Alunos capacitados em programação básica e blocos',
      )
      // Prazo passado, executado 210 de 300 -> ATRASADA
      mEdu1.set('prazo', '2024-06-30 00:00:00.000Z')
      mEdu1.set('quantidade_alvo', 300)
      mEdu1.set('quantidade_realizada', 210)
      mEdu1.set('status', 'em_andamento')
      app.save(mEdu1)
    } catch (_) {}

    try {
      const mSocial1 = app.findFirstRecordByData(
        'metas',
        'descricao',
        'Iniciativas de microempreendedorismo orientadas',
      )
      // Prazo futuro (ex: 2026-12-31) -> Em andamento no prazo
      mSocial1.set('prazo', '2026-12-31 00:00:00.000Z')
      app.save(mSocial1)
    } catch (_) {}

    try {
      const mConcluida = app.findFirstRecordByData(
        'metas',
        'descricao',
        'Encaminhamentos prioritários para consultas especializadas',
      )
      mConcluida.set('prazo', '2024-04-30 00:00:00.000Z')
      app.save(mConcluida)
    } catch (_) {}

    // 4. Vincular faturas de exemplo a planos de trabalho do convênio
    try {
      const plSaude = app.findFirstRecordByData(
        'planos_trabalho',
        'titulo',
        'Plano de Ação: Saúde da Família e Busca Ativa',
      )
      const fatVencida = app.findFirstRecordByData('faturas', 'numero', 'FAT-2024-004')
      fatVencida.set('plano_trabalho_id', plSaude.id)
      app.save(fatVencida)
    } catch (_) {}

    try {
      const plEdu = app.findFirstRecordByData(
        'planos_trabalho',
        'titulo',
        'Plano de Ação: Letramento Digital e Robótica Escolar',
      )
      const fatPendente = app.findFirstRecordByData('faturas', 'numero', 'FAT-2024-002')
      fatPendente.set('plano_trabalho_id', plEdu.id)
      app.save(fatPendente)
    } catch (_) {}
  },
  (app) => {
    // rollback opcional
  },
)
