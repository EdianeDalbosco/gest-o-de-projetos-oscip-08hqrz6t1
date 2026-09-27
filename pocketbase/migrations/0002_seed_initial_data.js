migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const projetos = app.findCollectionByNameOrId('projetos')
    const contratos = app.findCollectionByNameOrId('contratos')
    const atividades = app.findCollectionByNameOrId('atividades')
    const faturas = app.findCollectionByNameOrId('faturas')
    const despesas = app.findCollectionByNameOrId('despesas')

    // 1. Seed Auth User
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'edianedalbosco@gmail.com')
    } catch (_) {
      const user = new Record(users)
      user.setEmail('edianedalbosco@gmail.com')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Ediane Dalbosco')
      app.save(user)
    }

    // 2. Seed Projetos
    let p1, p2, p3
    try {
      p1 = app.findFirstRecordByData('projetos', 'nome', 'Campanha de Vacinação Comunitária')
    } catch (_) {
      p1 = new Record(projetos)
      p1.set('nome', 'Campanha de Vacinação Comunitária')
      p1.set(
        'descricao',
        'Ação de imunização e conscientização em bairros periféricos com distribuição de informativos de saúde preventiva.',
      )
      p1.set('valor_total', 85000)
      p1.set('status', 'ativo')
      p1.set('progresso', 65)
      p1.set('data_inicio', '2024-01-15 00:00:00.000Z')
      p1.set('data_fim', '2024-08-30 00:00:00.000Z')
      p1.set('parceiro', 'Secretaria Municipal de Saúde')
      app.save(p1)
    }

    try {
      p2 = app.findFirstRecordByData('projetos', 'nome', 'Educação Digital de Jovens')
    } catch (_) {
      p2 = new Record(projetos)
      p2.set('nome', 'Educação Digital de Jovens')
      p2.set(
        'descricao',
        'Oficinas de programação, robótica básica e inclusão produtiva digital para 120 jovens de escolas públicas.',
      )
      p2.set('valor_total', 120000)
      p2.set('status', 'ativo')
      p2.set('progresso', 40)
      p2.set('data_inicio', '2024-02-01 00:00:00.000Z')
      p2.set('data_fim', '2024-11-20 00:00:00.000Z')
      p2.set('parceiro', 'Fundação Futuro Social')
      app.save(p2)
    }

    try {
      p3 = app.findFirstRecordByData('projetos', 'nome', 'Mutirão de Agroecologia Urbana')
    } catch (_) {
      p3 = new Record(projetos)
      p3.set('nome', 'Mutirão de Agroecologia Urbana')
      p3.set(
        'descricao',
        'Implementação de 4 hortas comunitárias autossustentáveis e capacitação de famílias em compostagem orgânica.',
      )
      p3.set('valor_total', 54000)
      p3.set('status', 'concluido')
      p3.set('progresso', 100)
      p3.set('data_inicio', '2023-09-01 00:00:00.000Z')
      p3.set('data_fim', '2024-03-10 00:00:00.000Z')
      p3.set('parceiro', 'Instituto Verde Sustentável')
      app.save(p3)
    }

    // 3. Seed Contratos (2 CLT, 2 PJ)
    let c1, c2, c3, c4
    try {
      c1 = app.findFirstRecordByData('contratos', 'nome', 'Mariana Silva Ramos')
    } catch (_) {
      c1 = new Record(contratos)
      c1.set('tipo', 'CLT')
      c1.set('nome', 'Mariana Silva Ramos')
      c1.set('cargo_funcao', 'Coordenadora de Projetos Sociais')
      c1.set('valor', 6200)
      c1.set('data_inicio', '2023-05-01 00:00:00.000Z')
      c1.set('status', 'ativo')
      c1.set('beneficios', ['VT', 'VA', 'Seguro'])
      c1.set(
        'clausulas',
        'Contrato de trabalho por prazo indeterminado sob regime da CLT. Dedicação exclusiva de 40 horas semanais à gestão de parcerias e relatórios de impacto social.',
      )
      c1.set('projeto_id', p1.id)
      app.save(c1)
    }

    try {
      c2 = app.findFirstRecordByData('contratos', 'nome', 'Carlos Eduardo Mendes')
    } catch (_) {
      c2 = new Record(contratos)
      c2.set('tipo', 'CLT')
      c2.set('nome', 'Carlos Eduardo Mendes')
      c2.set('cargo_funcao', 'Assistente Financeiro e Prestação de Contas')
      c2.set('valor', 3800)
      c2.set('data_inicio', '2023-08-15 00:00:00.000Z')
      c2.set('status', 'ativo')
      c2.set('beneficios', ['VT', 'VA'])
      c2.set(
        'clausulas',
        'Responsável pelo fluxo de caixa, conciliação bancária de convênios e emissão de notas e termos de faturamento institucional.',
      )
      c2.set('projeto_id', p2.id)
      app.save(c2)
    }

    try {
      c3 = app.findFirstRecordByData('contratos', 'nome', 'DevTech Consultoria & Inovação ME')
    } catch (_) {
      c3 = new Record(contratos)
      c3.set('tipo', 'PJ')
      c3.set('nome', 'DevTech Consultoria & Inovação ME')
      c3.set('cargo_funcao', 'Instrutor e Especialista em Tecnologia')
      c3.set('valor', 95) // R$ 95/hora
      c3.set('tipo_pj', 'horas')
      c3.set('data_inicio', '2024-02-15 00:00:00.000Z')
      c3.set('data_fim', '2024-11-15 00:00:00.000Z')
      c3.set('status', 'ativo')
      c3.set(
        'clausulas',
        'Prestação de serviços técnicos especializados de capacitação em programação para turmas do projeto Educação Digital de Jovens. Faturamento mensal com base em relatório de atividades e horas validadas pela coordenação.',
      )
      c3.set('projeto_id', p2.id)
      app.save(c3)
    }

    try {
      c4 = app.findFirstRecordByData('contratos', 'nome', 'EnfSaúde Serviços Médicos LTDA')
    } catch (_) {
      c4 = new Record(contratos)
      c4.set('tipo', 'PJ')
      c4.set('nome', 'EnfSaúde Serviços Médicos LTDA')
      c4.set('cargo_funcao', 'Supervisão Técnica de Enfermagem')
      c4.set('valor', 7500) // R$ 7500/mês
      c4.set('tipo_pj', 'mensal')
      c4.set('data_inicio', '2024-01-20 00:00:00.000Z')
      c4.set('data_fim', '2024-07-20 00:00:00.000Z')
      c4.set('status', 'vencendo')
      c4.set(
        'clausulas',
        'Supervisão da cadeia fria, triagem e aplicação dos protocolos vacinais em campo comunitário conforme normas sanitárias vigentes.',
      )
      c4.set('projeto_id', p1.id)
      app.save(c4)
    }

    // 4. Seed Atividades vinculadas aos contratos PJ
    try {
      app.findFirstRecordByData(
        'atividades',
        'descricao',
        'Aplicação da oficina de lógica de programação (Módulo 1 - Turma A)',
      )
    } catch (_) {
      const a1 = new Record(atividades)
      a1.set('prestador_id', c3.id)
      a1.set('projeto_id', p2.id)
      a1.set('descricao', 'Aplicação da oficina de lógica de programação (Módulo 1 - Turma A)')
      a1.set('data', '2024-05-10 00:00:00.000Z')
      a1.set('horas', 8)
      a1.set('status', 'aprovada')
      a1.set('valor_aprovado', 760)
      app.save(a1)
    }

    try {
      app.findFirstRecordByData(
        'atividades',
        'descricao',
        'Mentoria de projetos finais e revisão de repositórios dos alunos',
      )
    } catch (_) {
      const a2 = new Record(atividades)
      a2.set('prestador_id', c3.id)
      a2.set('projeto_id', p2.id)
      a2.set('descricao', 'Mentoria de projetos finais e revisão de repositórios dos alunos')
      a2.set('data', '2024-05-14 00:00:00.000Z')
      a2.set('horas', 6)
      a2.set('status', 'pendente')
      app.save(a2)
    }

    try {
      app.findFirstRecordByData(
        'atividades',
        'descricao',
        'Planejamento logístico dos postos volantes de vacinação',
      )
    } catch (_) {
      const a3 = new Record(atividades)
      a3.set('prestador_id', c4.id)
      a3.set('projeto_id', p1.id)
      a3.set('descricao', 'Planejamento logístico dos postos volantes de vacinação')
      a3.set('data', '2024-05-08 00:00:00.000Z')
      a3.set('horas', 10)
      a3.set('status', 'aprovada')
      a3.set('valor_aprovado', 7500)
      app.save(a3)
    }

    try {
      app.findFirstRecordByData(
        'atividades',
        'descricao',
        'Auditoria de registros de descarte biológico',
      )
    } catch (_) {
      const a4 = new Record(atividades)
      a4.set('prestador_id', c4.id)
      a4.set('projeto_id', p1.id)
      a4.set('descricao', 'Auditoria de registros de descarte biológico')
      a4.set('data', '2024-05-18 00:00:00.000Z')
      a4.set('horas', 4)
      a4.set('status', 'pendente')
      app.save(a4)
    }

    // 5. Seed Faturas (4 faturas: 2 emitidas, 1 paga, 1 vencida)
    try {
      app.findFirstRecordByData('faturas', 'numero', 'FAT-2024-001')
    } catch (_) {
      const f1 = new Record(faturas)
      f1.set('numero', 'FAT-2024-001')
      f1.set('projeto_id', p1.id)
      f1.set('contrato_id', c4.id)
      f1.set('valor', 28500)
      f1.set('data_emissao', '2024-04-05 00:00:00.000Z')
      f1.set('data_vencimento', '2024-04-20 00:00:00.000Z')
      f1.set('status', 'paga')
      f1.set('forma_pagamento', 'Transferência Bancária PIX')
      app.save(f1)
    }

    try {
      app.findFirstRecordByData('faturas', 'numero', 'FAT-2024-002')
    } catch (_) {
      const f2 = new Record(faturas)
      f2.set('numero', 'FAT-2024-002')
      f2.set('projeto_id', p2.id)
      f2.set('contrato_id', c3.id)
      f2.set('valor', 32000)
      f2.set('data_emissao', '2024-05-02 00:00:00.000Z')
      f2.set('data_vencimento', '2024-05-25 00:00:00.000Z')
      f2.set('status', 'emitida')
      f2.set('forma_pagamento', 'Boleto Bancário')
      app.save(f2)
    }

    try {
      app.findFirstRecordByData('faturas', 'numero', 'FAT-2024-003')
    } catch (_) {
      const f3 = new Record(faturas)
      f3.set('numero', 'FAT-2024-003')
      f3.set('projeto_id', p1.id)
      f3.set('contrato_id', c4.id)
      f3.set('valor', 14500)
      f3.set('data_emissao', '2024-05-12 00:00:00.000Z')
      f3.set('data_vencimento', '2024-05-30 00:00:00.000Z')
      f3.set('status', 'emitida')
      f3.set('forma_pagamento', 'TED Institucional')
      app.save(f3)
    }

    try {
      app.findFirstRecordByData('faturas', 'numero', 'FAT-2024-004')
    } catch (_) {
      const f4 = new Record(faturas)
      f4.set('numero', 'FAT-2024-004')
      f4.set('projeto_id', p3.id)
      f4.set('valor', 9800)
      f4.set('data_emissao', '2024-03-01 00:00:00.000Z')
      f4.set('data_vencimento', '2024-03-20 00:00:00.000Z')
      f4.set('status', 'vencida')
      f4.set('forma_pagamento', 'Boleto Bancário')
      app.save(f4)
    }

    // 6. Seed Despesas mensais
    try {
      app.findFirstRecordByData('despesas', 'descricao', 'Folha de Pagamento CLT - Equipe Base')
    } catch (_) {
      const d1 = new Record(despesas)
      d1.set('categoria', 'Pessoal')
      d1.set('descricao', 'Folha de Pagamento CLT - Equipe Base')
      d1.set('valor', 14200)
      d1.set('data', '2024-05-05 00:00:00.000Z')
      app.save(d1)
    }

    try {
      app.findFirstRecordByData(
        'despesas',
        'descricao',
        'Locação de salas e infraestrutura para oficinas de TI',
      )
    } catch (_) {
      const d2 = new Record(despesas)
      d2.set('categoria', 'Infraestrutura')
      d2.set('descricao', 'Locação de salas e infraestrutura para oficinas de TI')
      d2.set('valor', 4800)
      d2.set('data', '2024-05-08 00:00:00.000Z')
      app.save(d2)
    }

    try {
      app.findFirstRecordByData(
        'despesas',
        'descricao',
        'Impressão de cartilhas e material educativo de saúde',
      )
    } catch (_) {
      const d3 = new Record(despesas)
      d3.set('categoria', 'Operacional')
      d3.set('descricao', 'Impressão de cartilhas e material educativo de saúde')
      d3.set('valor', 3250)
      d3.set('data', '2024-05-15 00:00:00.000Z')
      app.save(d3)
    }
  },
  (app) => {
    // rollback optional cleanup
  },
)
