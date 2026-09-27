migrate(
  (app) => {
    const convenios = app.findCollectionByNameOrId('convenios')
    const secretarias = app.findCollectionByNameOrId('secretarias')
    const planos = app.findCollectionByNameOrId('planos_trabalho')
    const metas = app.findCollectionByNameOrId('metas')

    // 1. Seed Convênio Municipal realista
    let conv
    try {
      conv = app.findFirstRecordByData('convenios', 'numero_instrumento', 'CONV-001/2024')
    } catch (_) {
      conv = new Record(convenios)
      conv.set('nome', 'Convênio 001/2024 — Prefeitura Municipal de São João')
      conv.set('municipio', 'São João da Boa Vista')
      conv.set('numero_instrumento', 'CONV-001/2024')
      conv.set('orgao_contratante', 'Prefeitura Municipal de São João da Boa Vista')
      conv.set('valor_global', 1250000)
      conv.set('data_inicio', '2024-01-01 00:00:00.000Z')
      conv.set('data_fim', '2024-12-31 00:00:00.000Z')
      conv.set('status', 'ativo')
      conv.set(
        'observacoes',
        'Termo de Colaboração para execução integrada de políticas públicas nas áreas de Atenção Básica de Saúde, Inclusão Tecnológica Escolar e Proteção Social Básica.',
      )
      app.save(conv)
    }

    // 2. Secretarias (3 secretarias: Saúde, Educação, Assistência Social)
    // 2.1 Secretaria de Saúde
    let secSaude
    try {
      secSaude = app.findFirstRecordByData('secretarias', 'nome', 'Secretaria Municipal de Saúde')
    } catch (_) {
      secSaude = new Record(secretarias)
      secSaude.set('nome', 'Secretaria Municipal de Saúde')
      secSaude.set('convenio_id', conv.id)
      secSaude.set('responsavel', 'Dra. Helena Martins (Secretária Municipal)')
      secSaude.set(
        'observacoes',
        'Ações voltadas à atenção básica, saúde itinerante e suporte na dispensação de medicamentos.',
      )
      app.save(secSaude)
    }

    // 2.2 Secretaria de Educação
    let secEdu
    try {
      secEdu = app.findFirstRecordByData('secretarias', 'nome', 'Secretaria Municipal de Educação')
    } catch (_) {
      secEdu = new Record(secretarias)
      secEdu.set('nome', 'Secretaria Municipal de Educação')
      secEdu.set('convenio_id', conv.id)
      secEdu.set('responsavel', 'Prof. Márcio Nogueira (Diretor de Projetos)')
      secEdu.set(
        'observacoes',
        'Formação complementar de alunos do fundamental II e oficinas no contraturno escolar.',
      )
      app.save(secEdu)
    }

    // 2.3 Secretaria de Assistência Social
    let secSocial
    try {
      secSocial = app.findFirstRecordByData(
        'secretarias',
        'nome',
        'Secretaria Municipal de Assistência Social',
      )
    } catch (_) {
      secSocial = new Record(secretarias)
      secSocial.set('nome', 'Secretaria Municipal de Assistência Social')
      secSocial.set('convenio_id', conv.id)
      secSocial.set('responsavel', 'Carla Fernandes (Coordenadora dos CRAS)')
      secSocial.set(
        'observacoes',
        'Fortalecimento de vínculos familiares e acolhimento comunitário nos bairros vulneráveis.',
      )
      app.save(secSocial)
    }

    // 3. Planos de Trabalho (2 por secretaria com valores)
    // 3.1 Planos da Saúde
    let plSaude1
    try {
      plSaude1 = app.findFirstRecordByData(
        'planos_trabalho',
        'titulo',
        'Plano de Ação: Saúde da Família e Busca Ativa',
      )
    } catch (_) {
      plSaude1 = new Record(planos)
      plSaude1.set('titulo', 'Plano de Ação: Saúde da Família e Busca Ativa')
      plSaude1.set('secretaria_id', secSaude.id)
      plSaude1.set('convenio_id', conv.id)
      plSaude1.set('valor_previsto', 280000)
      plSaude1.set('valor_empenhado', 220000)
      plSaude1.set('valor_executado', 185000)
      plSaude1.set('periodo', 'Jan/2024 — Dez/2024')
      plSaude1.set('status', 'ativo')
      plSaude1.set(
        'descricao',
        'Visitas domiciliares preventivas, triagem com enfermeiros comunitários e acompanhamento de idosos crônicos.',
      )
      app.save(plSaude1)
    }

    let plSaude2
    try {
      plSaude2 = app.findFirstRecordByData(
        'planos_trabalho',
        'titulo',
        'Plano de Ação: Mutirões de Saúde Bucal e Oftalmológica',
      )
    } catch (_) {
      plSaude2 = new Record(planos)
      plSaude2.set('titulo', 'Plano de Ação: Mutirões de Saúde Bucal e Oftalmológica')
      plSaude2.set('secretaria_id', secSaude.id)
      plSaude2.set('convenio_id', conv.id)
      plSaude2.set('valor_previsto', 170000)
      plSaude2.set('valor_empenhado', 140000)
      plSaude2.set('valor_executado', 98000)
      plSaude2.set('periodo', 'Mar/2024 — Out/2024')
      plSaude2.set('status', 'ativo')
      plSaude2.set(
        'descricao',
        'Atendimentos concentrados nos finais de semana em escolas da rede com fornecimento de kits higiênicos.',
      )
      app.save(plSaude2)
    }

    // 3.2 Planos da Educação
    let plEdu1
    try {
      plEdu1 = app.findFirstRecordByData(
        'planos_trabalho',
        'titulo',
        'Plano de Ação: Letramento Digital e Robótica Escolar',
      )
    } catch (_) {
      plEdu1 = new Record(planos)
      plEdu1.set('titulo', 'Plano de Ação: Letramento Digital e Robótica Escolar')
      plEdu1.set('secretaria_id', secEdu.id)
      plEdu1.set('convenio_id', conv.id)
      plEdu1.set('valor_previsto', 260000)
      plEdu1.set('valor_empenhado', 210000)
      plEdu1.set('valor_executado', 160000)
      plEdu1.set('periodo', 'Fev/2024 — Nov/2024')
      plEdu1.set('status', 'ativo')
      plEdu1.set(
        'descricao',
        'Implementação de laboratórios móveis de informática e formação de instrutores bolsistas.',
      )
      app.save(plEdu1)
    }

    let plEdu2
    try {
      plEdu2 = app.findFirstRecordByData(
        'planos_trabalho',
        'titulo',
        'Plano de Ação: Reforço Escolar e Leitura Ativa',
      )
    } catch (_) {
      plEdu2 = new Record(planos)
      plEdu2.set('titulo', 'Plano de Ação: Reforço Escolar e Leitura Ativa')
      plEdu2.set('secretaria_id', secEdu.id)
      plEdu2.set('convenio_id', conv.id)
      plEdu2.set('valor_previsto', 150000)
      plEdu2.set('valor_empenhado', 115000)
      plEdu2.set('valor_executado', 75000)
      plEdu2.set('periodo', 'Mar/2024 — Dez/2024')
      plEdu2.set('status', 'ativo')
      plEdu2.set(
        'descricao',
        'Aulas no contraturno para recomposição de aprendizagem em língua portuguesa e matemática.',
      )
      app.save(plEdu2)
    }

    // 3.3 Planos da Assistência Social
    let plSocial1
    try {
      plSocial1 = app.findFirstRecordByData(
        'planos_trabalho',
        'titulo',
        'Plano de Ação: Qualificação Profissional e Renda Cidadã',
      )
    } catch (_) {
      plSocial1 = new Record(planos)
      plSocial1.set('titulo', 'Plano de Ação: Qualificação Profissional e Renda Cidadã')
      plSocial1.set('secretaria_id', secSocial.id)
      plSocial1.set('convenio_id', conv.id)
      plSocial1.set('valor_previsto', 230000)
      plSocial1.set('valor_empenhado', 180000)
      plSocial1.set('valor_executado', 135000)
      plSocial1.set('periodo', 'Jan/2024 — Out/2024')
      plSocial1.set('status', 'ativo')
      plSocial1.set(
        'descricao',
        'Cursos profissionalizantes de gastronomia, confecção e empreendedorismo para jovens e mulheres.',
      )
      app.save(plSocial1)
    }

    let plSocial2
    try {
      plSocial2 = app.findFirstRecordByData(
        'planos_trabalho',
        'titulo',
        'Plano de Ação: Convivência e Fortalecimento de Vínculos',
      )
    } catch (_) {
      plSocial2 = new Record(planos)
      plSocial2.set('titulo', 'Plano de Ação: Convivência e Fortalecimento de Vínculos')
      plSocial2.set('secretaria_id', secSocial.id)
      plSocial2.set('convenio_id', conv.id)
      plSocial2.set('valor_previsto', 160000)
      plSocial2.set('valor_empenhado', 130000)
      plSocial2.set('valor_executado', 110000)
      plSocial2.set('periodo', 'Jan/2024 — Dez/2024')
      plSocial2.set('status', 'ativo')
      plSocial2.set(
        'descricao',
        'Oficinas socioculturais, círculos de escuta comunitária e passeios guiados para grupos do SCFV.',
      )
      app.save(plSocial2)
    }

    // 4. Metas simples por plano (2-3 metas por plano em estágios variados)
    // 4.1 Metas do plSaude1
    try {
      app.findFirstRecordByData(
        'metas',
        'descricao',
        'Visitas domiciliares a famílias cadastradas no SUS',
      )
    } catch (_) {
      const m = new Record(metas)
      m.set('plano_trabalho_id', plSaude1.id)
      m.set('descricao', 'Visitas domiciliares a famílias cadastradas no SUS')
      m.set('quantidade_alvo', 1200)
      m.set('quantidade_realizada', 980)
      m.set('status', 'em_andamento')
      app.save(m)
    }

    try {
      app.findFirstRecordByData(
        'metas',
        'descricao',
        'Encaminhamentos prioritários para consultas especializadas',
      )
    } catch (_) {
      const m = new Record(metas)
      m.set('plano_trabalho_id', plSaude1.id)
      m.set('descricao', 'Encaminhamentos prioritários para consultas especializadas')
      m.set('quantidade_alvo', 350)
      m.set('quantidade_realizada', 350)
      m.set('status', 'concluida')
      app.save(m)
    }

    try {
      app.findFirstRecordByData(
        'metas',
        'descricao',
        'Capacitação de agentes comunitários em saúde preventiva',
      )
    } catch (_) {
      const m = new Record(metas)
      m.set('plano_trabalho_id', plSaude1.id)
      m.set('descricao', 'Capacitação de agentes comunitários em saúde preventiva')
      m.set('quantidade_alvo', 4)
      m.set('quantidade_realizada', 3)
      m.set('status', 'em_andamento')
      app.save(m)
    }

    // 4.2 Metas do plSaude2
    try {
      app.findFirstRecordByData(
        'metas',
        'descricao',
        'Atendimentos de triagem oftalmológica e bucal',
      )
    } catch (_) {
      const m = new Record(metas)
      m.set('plano_trabalho_id', plSaude2.id)
      m.set('descricao', 'Atendimentos de triagem oftalmológica e bucal')
      m.set('quantidade_alvo', 800)
      m.set('quantidade_realizada', 520)
      m.set('status', 'em_andamento')
      app.save(m)
    }

    try {
      app.findFirstRecordByData(
        'metas',
        'descricao',
        'Distribuição de kits de higiene dental nas escolas',
      )
    } catch (_) {
      const m = new Record(metas)
      m.set('plano_trabalho_id', plSaude2.id)
      m.set('descricao', 'Distribuição de kits de higiene dental nas escolas')
      m.set('quantidade_alvo', 1500)
      m.set('quantidade_realizada', 1500)
      m.set('status', 'concluida')
      app.save(m)
    }

    // 4.3 Metas do plEdu1
    try {
      app.findFirstRecordByData(
        'metas',
        'descricao',
        'Alunos capacitados em programação básica e blocos',
      )
    } catch (_) {
      const m = new Record(metas)
      m.set('plano_trabalho_id', plEdu1.id)
      m.set('descricao', 'Alunos capacitados em programação básica e blocos')
      m.set('quantidade_alvo', 300)
      m.set('quantidade_realizada', 210)
      m.set('status', 'em_andamento')
      app.save(m)
    }

    try {
      app.findFirstRecordByData(
        'metas',
        'descricao',
        'Kits de robótica educacional montados e operacionais',
      )
    } catch (_) {
      const m = new Record(metas)
      m.set('plano_trabalho_id', plEdu1.id)
      m.set('descricao', 'Kits de robótica educacional montados e operacionais')
      m.set('quantidade_alvo', 20)
      m.set('quantidade_realizada', 20)
      m.set('status', 'concluida')
      app.save(m)
    }

    try {
      app.findFirstRecordByData(
        'metas',
        'descricao',
        'Feira municipal de ciência e tecnologia escolar',
      )
    } catch (_) {
      const m = new Record(metas)
      m.set('plano_trabalho_id', plEdu1.id)
      m.set('descricao', 'Feira municipal de ciência e tecnologia escolar')
      m.set('quantidade_alvo', 1)
      m.set('quantidade_realizada', 0)
      m.set('status', 'nao_iniciada')
      app.save(m)
    }

    // 4.4 Metas do plEdu2
    try {
      app.findFirstRecordByData(
        'metas',
        'descricao',
        'Oficinas semanais de leitura e interpretação de texto',
      )
    } catch (_) {
      const m = new Record(metas)
      m.set('plano_trabalho_id', plEdu2.id)
      m.set('descricao', 'Oficinas semanais de leitura e interpretação de texto')
      m.set('quantidade_alvo', 80)
      m.set('quantidade_realizada', 48)
      m.set('status', 'em_andamento')
      app.save(m)
    }

    try {
      app.findFirstRecordByData(
        'metas',
        'descricao',
        'Livros infanto-juvenis catalogados para empréstimo',
      )
    } catch (_) {
      const m = new Record(metas)
      m.set('plano_trabalho_id', plEdu2.id)
      m.set('descricao', 'Livros infanto-juvenis catalogados para empréstimo')
      m.set('quantidade_alvo', 500)
      m.set('quantidade_realizada', 500)
      m.set('status', 'concluida')
      app.save(m)
    }

    // 4.5 Metas do plSocial1
    try {
      app.findFirstRecordByData(
        'metas',
        'descricao',
        'Pessoas certificadas em cursos de panificação e culinária',
      )
    } catch (_) {
      const m = new Record(metas)
      m.set('plano_trabalho_id', plSocial1.id)
      m.set('descricao', 'Pessoas certificadas em cursos de panificação e culinária')
      m.set('quantidade_alvo', 120)
      m.set('quantidade_realizada', 90)
      m.set('status', 'em_andamento')
      app.save(m)
    }

    try {
      app.findFirstRecordByData(
        'metas',
        'descricao',
        'Iniciativas de microempreendedorismo orientadas',
      )
    } catch (_) {
      const m = new Record(metas)
      m.set('plano_trabalho_id', plSocial1.id)
      m.set('descricao', 'Iniciativas de microempreendedorismo orientadas')
      m.set('quantidade_alvo', 40)
      m.set('quantidade_realizada', 28)
      m.set('status', 'em_andamento')
      app.save(m)
    }

    // 4.6 Metas do plSocial2
    try {
      app.findFirstRecordByData(
        'metas',
        'descricao',
        'Famílias participantes dos encontros mensais do CRAS',
      )
    } catch (_) {
      const m = new Record(metas)
      m.set('plano_trabalho_id', plSocial2.id)
      m.set('descricao', 'Famílias participantes dos encontros mensais do CRAS')
      m.set('quantidade_alvo', 250)
      m.set('quantidade_realizada', 250)
      m.set('status', 'concluida')
      app.save(m)
    }

    try {
      app.findFirstRecordByData(
        'metas',
        'descricao',
        'Apresentações culturais e esportivas comunitárias',
      )
    } catch (_) {
      const m = new Record(metas)
      m.set('plano_trabalho_id', plSocial2.id)
      m.set('descricao', 'Apresentações culturais e esportivas comunitárias')
      m.set('quantidade_alvo', 6)
      m.set('quantidade_realizada', 4)
      m.set('status', 'em_andamento')
      app.save(m)
    }

    // Opcional: vincular algumas atividades existentes aos novos planos de trabalho
    try {
      const atividadesList = app.findRecordsByFilter('atividades', '', '-created', 2, 0)
      if (atividadesList.length > 0 && plSaude1) {
        atividadesList[0].set('plano_trabalho_id', plSaude1.id)
        app.save(atividadesList[0])
      }
      if (atividadesList.length > 1 && plEdu1) {
        atividadesList[1].set('plano_trabalho_id', plEdu1.id)
        app.save(atividadesList[1])
      }
    } catch (_) {}
  },
  (app) => {
    // rollback optional cleanup
  },
)
