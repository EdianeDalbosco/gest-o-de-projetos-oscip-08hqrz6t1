import { valorPorExtenso } from './extenso'
import { formatBRL, formatDateBR } from '@/components/StatusBadge'

export type ModeloContratoPJ =
  | 'mensal_plantao' // 1. Serviço mensal + serviço plantão/demanda (Modelo_Contrato_Padrao_TP_001_2026-9309c.docx)
  | 'mensal' // 2. Serviço mensal (Modelo_Contrato_Padrao_Servico_Mensal_TP_001_2026-aac3e.docx)
  | 'plantao_demanda' // 3. Serviço plantão/demanda (Modelo_Contrato_Padrao_Servico_Plantao_Demanda_TP_001_2026-85db5.docx)

export interface ItemAdicionalContrato {
  id: string
  atividade: string // Ex: Plantão Médico 12h
  valor: number // Ex: 1200
  unidade: string // Ex: plantão de 12 horas, demanda, procedimento
}

export type EnquadramentoTributario = 'geral' | 'simples_mei'

export type VinculoInstrumentoOuOrganizacao = 'instrumento' | 'organizacao'

export interface DadosContratanteCustom {
  razaoSocial?: string
  qualificacao?: string
  cnpj?: string
  endereco?: string
  representante?: string
  cpfRepresentante?: string
  cargoRepresentante?: string
  termoParceria?: string
  foro?: string
  cidadeAssinatura?: string
}

export interface DadosContratoPJ {
  modelo: ModeloContratoPJ

  // 1. CONTRATADA (Razão Social primeiro)
  razaoSocial: string
  naturezaJuridica: string
  cnpj: string
  enderecoEmpresarial: string
  representanteLegal: string
  cpfRepresentante: string

  // 2. Instrumento OU Nome da Organização
  tipoVinculoInstrumento?: VinculoInstrumentoOuOrganizacao
  nomeInstrumento?: string // Ex: "Termo de Parceria nº 001/2026"
  nomeOrganizacao?: string // Se não vinculado a instrumento: ex: "ORGANIZAÇÃO DE SAÚDE SÃO BENTO" ou nome livre da entidade

  // 3. Se instrumento, Secretaria e Projeto/Plano de Trabalho
  secretariaOrgao: string // Ex: Secretaria Municipal de Saúde
  projeto: string // Ex: Apoio à Saúde Básica de Dom Aquino / Plano de Trabalho

  // 4. Atividades
  atividadePrincipal: string // Atividade do catálogo ou descrição livre
  descricaoEscopo: string // Detalhamento / escopo específico

  // 5. Remuneração
  valorNumerico: number
  unidadePlantaoDemanda?: string // No modelo 3 (ex: "plantão de 12 horas", "demanda realizada", "unidade de serviço")
  modalidadeRemuneracaoCombinada?: string // No modelo 1: "[MENSAL / POR SERVIÇO / POR UNIDADE / POR PRODUÇÃO]" -> padrão "mensal"

  // Itens Adicionais (Modelo 1 - Mensal + Plantão/Demanda)
  itensAdicionais: ItemAdicionalContrato[]

  // Tributação
  enquadramentoTributario: EnquadramentoTributario // simples_mei vs geral (com retenções de 1,5% IRPJ, 1% CSLL, 0,65% PIS, 3% COFINS)

  // Vigência
  periodoVigencia: string // Ex: "12 (doze) meses" ou "06 (seis) meses"
  dataInicio: string
  dataFim: string

  // Assinatura
  dataAssinatura: string // Ex: 2026-07-15

  // Dados da Organização/Presidente injetados dinamicamente
  dadosContratanteCustom?: DadosContratanteCustom
}

// DADOS FIXOS DA CONTRATANTE (OSCIP) - DEFAULTS
export const DADOS_CONTRATANTE = {
  razaoSocial: 'ORGANIZAÇÃO DE SAÚDE SÃO BENTO',
  qualificacao:
    'pessoa jurídica de direito privado, qualificada pelo Ministério da Justiça como Organização da Sociedade Civil de Interesse Público - OSCIP em âmbito Nacional',
  cnpj: '45.603.168/0001-20',
  endereco:
    'Rua Trinta e Seis, 119, Lote 10 Quadra 05, Bairro Boa Esperança, Cuiabá/MT, CEP 78.068-417',
  representante: 'Iredir Maria Laccal da Silva Ferreira',
  cpfRepresentante: '983.223.111-68',
  cargoRepresentante: 'Presidente',
  termoParceria:
    'Termo de Parceria nº 001/2026, firmado entre a CONTRATANTE e a Prefeitura Municipal de Dom Aquino/MT, assinado em 15 de julho de 2026',
  foro: 'Comarca de Cuiabá/MT',
  cidadeAssinatura: 'Cuiabá/MT',
}

export const METADADOS_MODELOS: Record<
  ModeloContratoPJ,
  {
    titulo: string
    subtitulo: string
    descricao: string
    badge: string
  }
> = {
  mensal_plantao: {
    titulo: '1. Serviço Mensal + Serviço Plantão/Demanda',
    subtitulo: 'Valor base regular + adicionais sob demanda / plantões',
    descricao:
      'Ideal para contratos com remuneração mensal garantida combinada com plantões adicionais, atendimentos ou unidades sob demanda.',
    badge: 'Misto (Mensal + Plantão)',
  },
  mensal: {
    titulo: '2. Serviço Mensal',
    subtitulo: 'Valor mensal fixo pré-determinado',
    descricao:
      'Contrato com remuneração mensal contínua fixa, sem itens adicionais ou cobrança por demanda avulsa.',
    badge: 'Mensal Fixo',
  },
  plantao_demanda: {
    titulo: '3. Serviço Plantão / Demanda',
    subtitulo: 'Pagamento por plantão, demanda ou unidade executada',
    descricao:
      'Contrato sem valor mensal fixo, remunerado exclusivamente por plantão, demanda ou unidade de serviço efetivamente realizada e atestada.',
    badge: 'Por Plantão / Demanda',
  },
}

function ph(val: string | undefined | null, fallback: string): string {
  const v = (val || '').trim()
  return v ? v : `[${fallback}]`
}

function formatarDataPorExtensoBR(dataIso: string): string {
  if (!dataIso) return '[DATA DE ASSINATURA]'
  try {
    const d = new Date(dataIso + (dataIso.includes('T') ? '' : 'T12:00:00'))
    if (isNaN(d.getTime())) return formatDateBR(dataIso)
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(d)
  } catch {
    return formatDateBR(dataIso)
  }
}

function numeroRomano(idx: number): string {
  const romanos = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
  return romanos[idx] || `${idx + 1}`
}

/**
 * Gera o texto verbatim completo do contrato PJ conforme o modelo selecionado.
 */
export function gerarTextoContratoPJ(dados: DadosContratoPJ): string {
  const {
    modelo,
    razaoSocial,
    naturezaJuridica,
    cnpj,
    enderecoEmpresarial,
    representanteLegal,
    cpfRepresentante,
    tipoVinculoInstrumento = 'instrumento',
    nomeInstrumento,
    nomeOrganizacao,
    atividadePrincipal,
    secretariaOrgao,
    projeto,
    descricaoEscopo,
    valorNumerico,
    unidadePlantaoDemanda,
    modalidadeRemuneracaoCombinada,
    itensAdicionais,
    enquadramentoTributario,
    periodoVigencia,
    dataInicio,
    dataFim,
    dataAssinatura,
    dadosContratanteCustom,
  } = dados

  const contratanteEfetivo = {
    razaoSocial: dadosContratanteCustom?.razaoSocial || DADOS_CONTRATANTE.razaoSocial,
    qualificacao: dadosContratanteCustom?.qualificacao || DADOS_CONTRATANTE.qualificacao,
    cnpj: dadosContratanteCustom?.cnpj || DADOS_CONTRATANTE.cnpj,
    endereco: dadosContratanteCustom?.endereco || DADOS_CONTRATANTE.endereco,
    representante: dadosContratanteCustom?.representante || DADOS_CONTRATANTE.representante,
    cpfRepresentante:
      dadosContratanteCustom?.cpfRepresentante || DADOS_CONTRATANTE.cpfRepresentante,
    cargoRepresentante:
      dadosContratanteCustom?.cargoRepresentante ||
      DADOS_CONTRATANTE.cargoRepresentante ||
      'Presidente',
    termoParceria: dadosContratanteCustom?.termoParceria || DADOS_CONTRATANTE.termoParceria,
    foro: dadosContratanteCustom?.foro || DADOS_CONTRATANTE.foro,
    cidadeAssinatura:
      dadosContratanteCustom?.cidadeAssinatura || DADOS_CONTRATANTE.cidadeAssinatura,
  }

  const isInstrumento = tipoVinculoInstrumento === 'instrumento'
  const instrumentoTexto = nomeInstrumento?.trim() || contratanteEfetivo.termoParceria
  const organizacaoNomeContratante =
    !isInstrumento && nomeOrganizacao?.trim()
      ? nomeOrganizacao.trim()
      : contratanteEfetivo.razaoSocial

  const valorFormatado = formatBRL(Number(valorNumerico) || 0)
  const valorExtenso = valorPorExtenso(Number(valorNumerico) || 0)

  const cRazaoSocial = ph(razaoSocial, 'RAZÃO SOCIAL DA CONTRATADA')
  const cNatJuridica = ph(naturezaJuridica, 'NATUREZA JURÍDICA')
  const cCnpj = ph(cnpj, 'CNPJ')
  const cEndereco = ph(enderecoEmpresarial, 'ENDEREÇO EMPRESARIAL COMPLETO')
  const cRep = ph(representanteLegal, 'NOME DO(A) REPRESENTANTE LEGAL')
  const cCpfRep = ph(cpfRepresentante, 'CPF DO(A) REPRESENTANTE LEGAL')

  const cSecOrgao = ph(secretariaOrgao, 'SECRETARIA / ÓRGÃO')
  const cProjeto = ph(projeto, 'PROJETO')
  const cEscopo = ph(descricaoEscopo, 'DESCRIÇÃO ESPECÍFICA DA ATIVIDADE / ESCOPO DO SERVIÇO')
  const cVigencia = ph(periodoVigencia, 'PERÍODO DE VIGÊNCIA')
  const cDataInicio = dataInicio ? formatDateBR(dataInicio) : '[DATA DE INÍCIO]'
  const cDataFim = dataFim ? formatDateBR(dataFim) : '[DATA DE TÉRMINO]'
  const cDataAssinatura = formatarDataPorExtensoBR(dataAssinatura)

  // Bloco de Preâmbulo padrão para os 3 modelos
  const preambulo = `CONTRATO DE PRESTAÇÃO DE SERVIÇO

CONTRATANTE: ${organizacaoNomeContratante}, ${contratanteEfetivo.qualificacao}, inscrita no CNPJ ${contratanteEfetivo.cnpj}, com sede na ${contratanteEfetivo.endereco}, neste ato representada por ${contratanteEfetivo.representante}, inscrita no CPF nº ${contratanteEfetivo.cpfRepresentante}, e

CONTRATADA: ${cRazaoSocial}, pessoa jurídica de direito privado, de natureza jurídica ${cNatJuridica}, inscrita no CNPJ nº ${cCnpj}, com endereço empresarial em ${cEndereco}, neste ato representada por ${cRep}, inscrito(a) no CPF nº ${cCpfRep}.

As partes, acima identificadas, resolvem de comum acordo firmar o presente CONTRATO DE PRESTAÇÃO DE SERVIÇOS, a ser regido pelas cláusulas e condições adiante estabelecidas:`

  // Cláusula Primeira & Parágrafos
  let clausulaPrimeira = ''
  const cAtividade = ph(
    atividadePrincipal,
    modelo === 'plantao_demanda'
      ? 'ATIVIDADE DE PLANTÃO / DEMANDA'
      : 'ATIVIDADE PRINCIPAL / ATIVIDADE MENSAL',
  )

  if (isInstrumento) {
    clausulaPrimeira = `Cláusula Primeira – O presente contrato tem por objeto a prestação de Serviço de ${cAtividade}, para atendimento às necessidades da ${cSecOrgao}, no âmbito do Projeto ${cProjeto}, vinculado ao ${instrumentoTexto}.

Parágrafo Primeiro – A CONTRATADA executará as atividades inerentes ao objeto contratado, compreendendo ${cEscopo}.

Parágrafo Segundo – Os serviços serão ${modelo === 'plantao_demanda' ? 'executados conforme as demandas da CONTRATANTE e da ' + cSecOrgao + ', mediante solicitação ou autorização prévia' : 'desenvolvidos de acordo com as necessidades da CONTRATANTE e da ' + cSecOrgao}, visando ao atendimento das metas, objetivos e atividades previstas no Projeto ${cProjeto} e no ${instrumentoTexto}.

Parágrafo Terceiro – Poderão ser executadas outras atividades correlatas e compatíveis com o objeto principal contratado, desde que necessárias à adequada execução das ações vinculadas ao Projeto ${cProjeto}, sem descaracterização do objeto e observadas as normas técnicas, operacionais e legais aplicáveis.

Parágrafo Quarto – Além dos serviços estabelecidos nesta cláusula, a CONTRATADA deverá prestar as informações necessárias ao acompanhamento das ações, manter adequadamente os registros da execução e fornecer à CONTRATANTE, sempre que solicitado, relatórios, registros e demais informações relacionadas aos serviços, observada a legislação aplicável e as normas de proteção de dados pessoais.`
  } else {
    // Não vinculado a instrumento (Nome da Organização)
    clausulaPrimeira = `Cláusula Primeira – O presente contrato tem por objeto a prestação de Serviço de ${cAtividade}, diretamente no âmbito das atividades institucionais da ${organizacaoNomeContratante}.

Parágrafo Primeiro – A CONTRATADA executará as atividades inerentes ao objeto contratado, compreendendo ${cEscopo}.

Parágrafo Segundo – Os serviços serão ${modelo === 'plantao_demanda' ? 'executados conforme as demandas da CONTRATANTE, mediante solicitação ou autorização prévia' : 'desenvolvidos de acordo com as necessidades da CONTRATANTE'}, visando ao cumprimento de suas finalidades institucionais.

Parágrafo Terceiro – Poderão ser executadas outras atividades correlatas e compatíveis com o objeto principal contratado, desde que necessárias à adequada execução das ações da CONTRATANTE, sem descaracterização do objeto e observadas as normas técnicas, operacionais e legais aplicáveis.

Parágrafo Quarto – Além dos serviços estabelecidos nesta cláusula, a CONTRATADA deverá prestar as informações necessárias ao acompanhamento das ações, manter adequadamente os registros da execução e fornecer à CONTRATANTE, sempre que solicitado, relatórios, registros e demais informações relacionadas aos serviços, observada a legislação aplicável e as normas de proteção de dados pessoais.`
  }

  // Cláusulas Segunda e Terceira
  let clausulaSegundaETerceira = ''
  if (isInstrumento) {
    clausulaSegundaETerceira = `DO LOCAL DA PRESTAÇÃO DOS SERVIÇOS

Cláusula Segunda – Os serviços serão prestados pela CONTRATADA, por seu representante legal, ou mediante a disponibilização de profissional habilitado, quando aplicável à natureza do objeto, junto à ${cSecOrgao} do Município de Dom Aquino/MT.

Parágrafo Único – Este Contrato é instrumento acessório ao ${instrumentoTexto}. Dessa forma, caso haja o término do contrato principal por qualquer motivo e a qualquer tempo, o presente contrato será automaticamente rescindido, independentemente de notificação, não cabendo multa ou indenização a qualquer das partes.

DAS UNIDADES DE ATUAÇÃO

Cláusula Terceira – Os serviços serão prestados nas unidades, instalações ou demais locais definidos pela ${cSecOrgao}, conforme a natureza do objeto e a necessidade de execução do Projeto ${cProjeto}.`
  } else {
    clausulaSegundaETerceira = `DO LOCAL DA PRESTAÇÃO DOS SERVIÇOS

Cláusula Segunda – Os serviços serão prestados pela CONTRATADA, por seu representante legal, ou mediante a disponibilização de profissional habilitado, nas dependências ou locais designados pela CONTRATANTE (${organizacaoNomeContratante}), ou de forma remota/externa conforme acordado entre as partes.

DAS UNIDADES DE ATUAÇÃO

Cláusula Terceira – Os serviços serão prestados nas unidades, instalações ou demais locais definidos pela CONTRATANTE, conforme a natureza do objeto contratado.`
  }

  // Cláusulas Quarta e Quinta (Obrigações verbatim)
  const clausulasQuartaEQuinta = `DAS OBRIGAÇÕES DA CONTRATADA:

Cláusula Quarta – A CONTRATADA fica obrigada a:

I. Executar os serviços objeto deste contrato com zelo, diligência, responsabilidade, qualidade técnica e observância das normas legais e regulamentares aplicáveis;

II. Executar as atividades relacionadas a prestação do(s) serviço(s) descrito(s) na Cláusula Primeira, respeitando o escopo, os limites de atuação e as orientações da CONTRATANTE e da ${cSecOrgao};

III. Observar os procedimentos, fluxos internos e orientações administrativas e operacionais aplicáveis ao local de execução dos serviços;

IV. Apresentar e manter devidamente regularizada a documentação da empresa CONTRATADA e, quando aplicável, dos profissionais por ela disponibilizados;

V. Comunicar à CONTRATANTE quaisquer alterações cadastrais, societárias, fiscais ou outras que possam interferir na regularidade da contratação ou na execução dos serviços;

VI. Apresentar Nota Fiscal e Relatório de Atividades Mensal referente ao período de execução dos serviços, contendo informações necessárias à comprovação da efetiva prestação;

VII. Responsabilizar-se pelo recolhimento dos tributos, impostos, taxas, encargos e demais obrigações fiscais, trabalhistas, previdenciárias e comerciais decorrentes de sua atividade, quando legalmente de sua responsabilidade;

VIII. Manter organizados e atualizados os registros, documentos, controles e informações relacionados aos serviços executados;

IX. Manter sigilo sobre as informações pessoais, cadastrais, institucionais, operacionais e administrativas a que tiver acesso em razão da prestação dos serviços, observando a legislação aplicável e a Lei Geral de Proteção de Dados Pessoais - LGPD;

X. Utilizar dados e informações acessados exclusivamente para as finalidades relacionadas à execução dos serviços contratados;

XI. Respeitar as competências legalmente reservadas aos agentes e autoridades públicas, abstendo-se de praticar atos de autoridade ou decisões privativas do Poder Público;

XII. Responsabilizar-se integralmente pelos atos praticados na execução dos serviços, nos limites de sua atuação e das obrigações assumidas;

XIII. Executar os serviços contratados nas datas, períodos ou demandas previamente ajustados entre as partes, quando aplicável à natureza do objeto, assegurando o adequado cumprimento das atividades assumidas;

XIV. Comunicar previamente à CONTRATANTE eventual impossibilidade de execução de serviço previamente ajustado, adotando, quando cabível, as providências necessárias à continuidade da prestação contratada;

XV. Zelar pela adequada utilização dos equipamentos, materiais, sistemas, documentos e demais recursos disponibilizados para a execução dos serviços;

XVI. Manter conduta profissional compatível com os princípios de urbanidade, respeito e boa-fé nas relações com usuários, agentes públicos e demais integrantes das equipes envolvidas;

XVII. Fornecer à CONTRATANTE, quando solicitado, informações, registros e documentos necessários ao acompanhamento, fiscalização e comprovação da execução dos serviços;

XVIII. Observar as normas de segurança aplicáveis às atividades executadas e utilizar os equipamentos de proteção exigidos quando cabível;

XIX. Executar outras atividades correlatas e compatíveis com o objeto principal contratado, quando necessárias ao atendimento das demandas do Projeto ${cProjeto} e desde que não impliquem alteração substancial do objeto ou exercício de atribuição privativa de agente público.

DAS OBRIGAÇÕES DA CONTRATANTE:

Cláusula Quinta – A CONTRATANTE fica obrigada a:

I. Fornecer à CONTRATADA as informações, documentos, orientações e demais elementos necessários à adequada execução dos serviços contratados;

II. Acompanhar e fiscalizar a execução do presente contrato e a efetiva prestação dos serviços pela CONTRATADA, em conjunto com a ${cSecOrgao}, observadas as disposições do Termo de Parceria nº 001/2026;

III. Disponibilizar, quando necessário e de acordo com as condições da execução dos serviços, acesso aos documentos, processos, sistemas, informações e demais recursos institucionais indispensáveis ao desempenho das atividades contratadas;

IV. Comunicar à CONTRATADA as orientações, demandas, ajustes e eventuais irregularidades identificadas durante a execução dos serviços, possibilitando a adoção das providências cabíveis;

V. Efetuar o pagamento pelos serviços efetivamente prestados, nas formas, prazos e condições estabelecidos neste instrumento, mediante apresentação da documentação exigida para o faturamento.`

  // Cláusula Sexta (Remuneração) - Específica de cada modelo
  let clausulaSexta = ''

  if (modelo === 'plantao_demanda') {
    const cUnidade = ph(unidadePlantaoDemanda, 'PLANTÃO / DEMANDA / UNIDADE DE SERVIÇO')
    clausulaSexta = `DA REMUNERAÇÃO DOS SERVIÇOS E DA FORMA DE PAGAMENTO

Cláusula Sexta – A CONTRATANTE pagará à CONTRATADA o valor de ${valorFormatado} (${valorExtenso}) por ${cUnidade}, exclusivamente pelos serviços previamente solicitados ou autorizados, efetivamente realizados, comprovados e atestados, respeitados os limites e condições previstos no Plano de Trabalho vigente. O pagamento será efetuado via transferência bancária em conta corrente pessoa jurídica em nome da CONTRATADA.

Parágrafo Primeiro – O pagamento dos serviços ficará condicionado à:

I. Apresentação da Nota Fiscal de Serviços emitida pela CONTRATADA à CONTRATANTE e de Relatório de Atividades referente aos serviços executados no período, acompanhado, quando aplicável, dos registros comprobatórios dos plantões, demandas ou unidades realizadas, devidamente atestados e validados pela CONTRATANTE;

II. Repasse efetuado pela Prefeitura Municipal de Dom Aquino/MT à CONTRATANTE referente ao período de execução dos serviços.

Parágrafo Segundo – Serão retidos na fonte os tributos e contribuições elencados nas disposições determinadas pelos órgãos fiscais e fazendários (IRPJ, CSLL, PIS, COFINS), conforme Lei nº 10.833/2003 e instruções normativas vigentes, da seguinte forma:

I. IRPJ - retenção de 1,5%;

II. CSLL - retenção de 1%;

III. PIS - retenção de 0,65%;

IV. COFINS - retenção de 3%.`

    if (enquadramentoTributario === 'simples_mei') {
      clausulaSexta += `\n\nParágrafo Terceiro – Não haverá retenção de tributos e contribuições quando a empresa CONTRATADA estiver enquadrada no Simples Nacional e/ou tratar-se de Microempreendedor Individual (MEI), observadas as condições e comprovações legalmente exigidas.`
    }
  } else if (modelo === 'mensal') {
    clausulaSexta = `DA REMUNERAÇÃO DOS SERVIÇOS E DA FORMA DE PAGAMENTO

Cláusula Sexta – A CONTRATANTE pagará à CONTRATADA o valor mensal de ${valorFormatado} (${valorExtenso}), subsequente ao período de execução dos serviços, cujo pagamento será efetuado via transferência bancária em conta corrente pessoa jurídica em nome da CONTRATADA.

Parágrafo Primeiro – O pagamento dos serviços ficará condicionado à:

I. Apresentação da Nota Fiscal de Serviços emitida pela CONTRATADA à CONTRATANTE e, ainda, apresentação de Relatório de Atividades Mensal, devidamente atestado e validado pela CONTRATANTE;

II. Repasse efetuado pela Prefeitura Municipal de Dom Aquino/MT à CONTRATANTE referente ao período de execução dos serviços.

Parágrafo Segundo – Serão retidos na fonte os tributos e contribuições elencados nas disposições determinadas pelos órgãos fiscais e fazendários (IRPJ, CSLL, PIS, COFINS), conforme Lei nº 10.833/2003 e instruções normativas vigentes, da seguinte forma:

I. IRPJ - retenção de 1,5%;

II. CSLL - retenção de 1%;

III. PIS - retenção de 0,65%;

IV. COFINS - retenção de 3%.`

    if (enquadramentoTributario === 'simples_mei') {
      clausulaSexta += `\n\nParágrafo Terceiro – Não haverá retenção de tributos e contribuições quando a empresa CONTRATADA estiver enquadrada no Simples Nacional e/ou tratar-se de Microempreendedor Individual (MEI), observadas as condições e comprovações legalmente exigidas.`
    }
  } else {
    // modelo === 'mensal_plantao' (Modelo_Contrato_Padrao_TP_001_2026-9309c.docx)
    const cModRemun = ph(
      modalidadeRemuneracaoCombinada,
      'MENSAL / POR SERVIÇO / POR UNIDADE / POR PRODUÇÃO',
    )
    const temItensAdicionais = itensAdicionais && itensAdicionais.length > 0

    let blocoItensAdicionais = ''
    if (temItensAdicionais) {
      const linhasItens = itensAdicionais.map((item, idx) => {
        const itemValFmt = formatBRL(item.valor || 0)
        const itemValExt = valorPorExtenso(item.valor || 0)
        const itemAtiv = ph(item.atividade, `ATIVIDADE ADICIONAL ${idx + 1}`)
        const itemUnid = ph(item.unidade, 'UNIDADE DE REMUNERAÇÃO')
        const limiteObs = isInstrumento
          ? ', respeitados os limites e condições previstos no Plano de Trabalho vigente'
          : ''
        return `${numeroRomano(idx)}. ${itemAtiv} - ${itemValFmt} (${itemValExt}) por ${itemUnid}${limiteObs};`
      })

      blocoItensAdicionais = `Parágrafo Primeiro – Quando houver serviços adicionais, plantões ou atividades sob demanda${isInstrumento ? ' previstos no Plano de Trabalho vigente' : ''}, o valor acima poderá ser complementado exclusivamente quando tais serviços forem previamente solicitados ou autorizados, efetivamente realizados, comprovados e atestados, sendo:\n\n${linhasItens.join('\n\n')}`
    } else {
      blocoItensAdicionais = `Parágrafo Segundo – Não havendo atividade adicional, plantão ou serviço sob demanda aplicável à contratação, o Parágrafo Primeiro e seus itens deverão ser excluídos da versão final do contrato.`
    }

    const ordinalCondicoes = temItensAdicionais ? 'Parágrafo Segundo' : 'Parágrafo Terceiro'
    const ordinalRetencoes = temItensAdicionais ? 'Parágrafo Terceiro' : 'Parágrafo Quarto'
    const ordinalSimples = temItensAdicionais ? 'Parágrafo Quarto' : 'Parágrafo Quinto'

    const blocoCondicoes = `${ordinalCondicoes} – O pagamento dos serviços ficará condicionado à:

I. Apresentação da Nota Fiscal de Serviços emitida pela CONTRATADA à CONTRATANTE e, ainda, apresentação de Relatório de Atividades Mensal e, quando aplicável, dos registros comprobatórios dos serviços adicionais realizados, devidamente atestados e validados pela CONTRATANTE;

II. Repasse efetuado pela Prefeitura Municipal de Dom Aquino/MT à CONTRATANTE referente ao período de execução dos serviços.`

    const blocoRetencoes = `${ordinalRetencoes} – Serão retidos na fonte os tributos e contribuições elencados nas disposições determinadas pelos órgãos fiscais e fazendários (IRPJ, CSLL, PIS, COFINS), conforme Lei nº 10.833/2003 e instruções normativas vigentes, da seguinte forma:

I. IRPJ - retenção de 1,5%;

II. CSLL - retenção de 1%;

III. PIS - retenção de 0,65%;

IV. COFINS - retenção de 3%.`

    const blocoSimples =
      enquadramentoTributario === 'simples_mei'
        ? `\n\n${ordinalSimples} – Não haverá retenção de tributos e contribuições quando a empresa CONTRATADA estiver enquadrada no Simples Nacional e/ou tratar-se de Microempreendedor Individual (MEI), observadas as condições e comprovações legalmente exigidas.`
        : ''

    clausulaSexta = `DA REMUNERAÇÃO DOS SERVIÇOS E DA FORMA DE PAGAMENTO

Cláusula Sexta – A CONTRATANTE pagará à CONTRATADA o valor ${cModRemun} de ${valorFormatado} (${valorExtenso}), subsequente ao período de execução dos serviços, cujo pagamento será efetuado via transferência bancária em conta corrente pessoa jurídica em nome da CONTRATADA.

${blocoItensAdicionais}

${blocoCondicoes}

${blocoRetencoes}${blocoSimples}`
  }

  // Cláusulas Sétima a Décima Sexta e Fechamento
  const clausulaSetimaVigencia = isInstrumento
    ? `Cláusula Sétima – O presente contrato de prestação de serviços terá vigência de ${cVigencia}, com início em ${cDataInicio} e término em ${cDataFim}, podendo ser prorrogado ou renovado mediante instrumento próprio e desde que haja interesse entre as partes e compatibilidade com a vigência do ${instrumentoTexto}.

Parágrafo Primeiro – O contrato poderá ser revisto, sempre que motivado por uma das partes e aceito pela outra, no que se refere aos valores, levando-se em conta os serviços e valores apresentados no Plano de Trabalho e ${instrumentoTexto}.`
    : `Cláusula Sétima – O presente contrato de prestação de serviços terá vigência de ${cVigencia}, com início em ${cDataInicio} e término em ${cDataFim}, podendo ser prorrogado ou renovado mediante aditivo contratual e desde que haja mútuo interesse entre as partes.

Parágrafo Primeiro – O contrato poderá ser revisto, sempre que motivado por uma das partes e aceito pela outra, no que se refere aos valores e ao escopo contratado.`

  const clausulaFiscalizacao = isInstrumento
    ? `Cláusula Nona – A execução dos serviços será acompanhada pela ${cSecOrgao} ou por representante designado, que validará relatórios, registros de execução e qualidade dos serviços, e pelo Departamento Administrativo da CONTRATANTE para permanente fiscalização e acompanhamento do cumprimento das metas e objetivos deste contrato.`
    : `Cláusula Nona – A execução dos serviços será acompanhada pelo Departamento Administrativo da CONTRATANTE (${organizacaoNomeContratante}) ou por representante formalmente designado, para permanente fiscalização e acompanhamento do cumprimento do objeto deste contrato.`

  const clausulaRescisaoHipotese = isInstrumento
    ? `IV. Automaticamente, em caso de término, rescisão ou extinção do ${instrumentoTexto}, na forma prevista na Cláusula Segunda.`
    : `IV. Por iniciativa unilateral imotivada de qualquer das partes, com aviso prévio de 30 (trinta) dias.`

  const clausulasFinais = `DO PRAZO E VIGÊNCIA CONTRATUAL

${clausulaSetimaVigencia}

Parágrafo Segundo – O presente contrato poderá ser rescindido por qualquer uma das partes, mediante comunicação escrita à parte contrária, com antecedência mínima de 10 (dez) dias corridos, ressalvadas as hipóteses de rescisão imediata previstas neste instrumento.

Parágrafo Terceiro – No caso de rescisão por iniciativa da CONTRATANTE, a CONTRATADA poderá ser notificada mediante documento de distrato, no qual deverá constar a data da comunicação e a data final da prestação dos serviços.

DA RESPONSABILIDADE TÉCNICA

Cláusula Oitava – A responsabilidade pela adequada execução técnica e operacional dos serviços é exclusiva da CONTRATADA, que responderá pelos atos praticados no âmbito do objeto contratado, observados os limites legais e as responsabilidades aplicáveis.

DA FISCALIZAÇÃO

${clausulaFiscalizacao}

Parágrafo Primeiro – A CONTRATADA declara aceitar integralmente as condições de execução dos serviços contratados.

Parágrafo Segundo – A existência e a atuação da fiscalização da CONTRATANTE não restringem as responsabilidades próprias, integrais e exclusivas da CONTRATADA quanto à execução do objeto contratado e às consequências decorrentes de seus atos ou omissões.

DAS SANÇÕES ADMINISTRATIVAS

Cláusula Décima – Pela inexecução total ou parcial do contrato, a CONTRATANTE poderá, mediante prévia notificação e assegurado o direito de defesa, aplicar multa à CONTRATADA correspondente a 10% (dez por cento) sobre os valores mencionados na Cláusula Sexta.

Parágrafo Primeiro – A multa prevista nesta cláusula não tem caráter compensatório e o seu pagamento não eximirá a CONTRATADA da responsabilidade por perdas e danos decorrentes das infrações ou omissões cometidas.

Parágrafo Segundo – Sem prejuízo das demais medidas cabíveis, o descumprimento contratual poderá ensejar a rescisão do contrato, observadas as condições estabelecidas neste instrumento.

DAS RESPONSABILIDADES

Cláusula Décima Primeira – A CONTRATANTE não responderá por quaisquer ônus, direitos ou obrigações vinculadas à legislação tributária, trabalhista, previdenciária ou securitária decorrentes da execução do presente contrato, cujo cumprimento ou responsabilidade caberão exclusivamente à CONTRATADA, ressalvadas as hipóteses em que a CONTRATANTE seja legalmente responsável por retenção ou recolhimento.

Parágrafo Primeiro – A CONTRATADA é responsável direta e exclusiva pela execução do objeto deste contrato e responderá, na forma da lei, pelos danos e prejuízos que, por ação ou omissão na execução dos serviços, venha a causar à CONTRATANTE ou a terceiros.

Parágrafo Segundo – A CONTRATANTE não responderá por compromissos assumidos pela CONTRATADA com terceiros, ainda que vinculados à execução do presente contrato, nem por danos causados a terceiros em decorrência de atos da CONTRATADA, de seus empregados, prepostos ou profissionais por ela disponibilizados.

DA RESCISÃO

Cláusula Décima Segunda – Este contrato poderá ser rescindido:

I. Por comum acordo entre as partes;

II. Pelo não cumprimento, por qualquer das partes, das cláusulas aqui estabelecidas;

III. A qualquer momento, por qualquer das partes, mediante comunicação escrita à outra parte, observadas as condições previstas neste instrumento;

${clausulaRescisaoHipotese}

DA OBSERVÂNCIA À LGPD

Cláusula Décima Terceira – A Lei Geral de Proteção de Dados será observada em todos os seus termos, garantindo-se que o tratamento dos dados eventualmente coletados ocorra conforme sua necessidade, finalidade e base legal aplicável, nos termos da Lei nº 13.709/2018.

Cláusula Décima Quarta – A CONTRATADA declara ciência de que a CONTRATANTE poderá coletar, tratar e compartilhar os dados estritamente necessários ao cumprimento do contrato e das obrigações legais ou regulatórias aplicáveis, observados os termos da Lei nº 13.709/2018.

DA LEGISLAÇÃO APLICÁVEL

Cláusula Décima Quinta – As partes declaram não haver entre si vínculo empregatício, mantendo a CONTRATADA autonomia na organização e execução dos serviços, observadas as condições pactuadas, o objeto contratado e as demais exigências legais. A CONTRATADA responderá pelos atos praticados na execução dos serviços, nos limites de sua responsabilidade legal e contratual.

DO FORO

Cláusula Décima Sexta – Os contratantes elegem o foro da ${contratanteEfetivo.foro}, com renúncia de qualquer outro, por mais privilegiado que seja, para dirimir as dúvidas de interpretação e aplicação deste contrato, bem como para sua execução.

Por estarem justos e acertados, firmam o presente contrato em duas vias, de igual teor e forma, obrigando-se a cumprir o que nele está avençado, na presença de duas testemunhas, que abaixo também subscrevem, para os fins pretendidos.

${contratanteEfetivo.cidadeAssinatura}, ${cDataAssinatura}.

_____________________________________
${organizacaoNomeContratante}
${contratanteEfetivo.representante} (${contratanteEfetivo.cargoRepresentante})
CNPJ: ${contratanteEfetivo.cnpj}

_____________________________________
${cRazaoSocial}
${cRep}
CNPJ: ${cCnpj}`

  return `${preambulo}

${clausulaPrimeira}

${clausulaSegundaETerceira}

${clausulasQuartaEQuinta}

${clausulaSexta}

${clausulasFinais}`
}

/**
 * Converte o texto com marcadores de parágrafo em HTML formatado com estilos inline para exportação (.doc) e preview.
 */
export function gerarHtmlContratoPJ(dados: DadosContratoPJ): string {
  const texto = gerarTextoContratoPJ(dados)

  // Quebra por linhas duplas para gerar parágrafos
  const paragrafos = texto.split(/\n\n+/)

  const htmlCorpo = paragrafos
    .map((p) => {
      const pTrim = p.trim()
      if (!pTrim) return ''

      // Título inicial
      if (pTrim === 'CONTRATO DE PRESTAÇÃO DE SERVIÇO') {
        return `<h1 style="text-align: center; font-size: 16pt; font-weight: bold; margin: 18pt 0 14pt 0; text-transform: uppercase; font-family: 'Times New Roman', Times, serif;">${pTrim}</h1>`
      }

      // Seções e Cláusulas
      if (
        pTrim.startsWith('DO LOCAL DA PRESTAÇÃO') ||
        pTrim.startsWith('DAS UNIDADES DE ATUAÇÃO') ||
        pTrim.startsWith('DAS OBRIGAÇÕES DA CONTRATADA') ||
        pTrim.startsWith('DAS OBRIGAÇÕES DA CONTRATANTE') ||
        pTrim.startsWith('DA REMUNERAÇÃO DOS SERVIÇOS') ||
        pTrim.startsWith('DO PRAZO E VIGÊNCIA') ||
        pTrim.startsWith('DA RESPONSABILIDADE TÉCNICA') ||
        pTrim.startsWith('DA FISCALIZAÇÃO') ||
        pTrim.startsWith('DAS SANÇÕES ADMINISTRATIVAS') ||
        pTrim.startsWith('DAS RESPONSABILIDADES') ||
        pTrim.startsWith('DA RESCISÃO') ||
        pTrim.startsWith('DA OBSERVÂNCIA À LGPD') ||
        pTrim.startsWith('DA LEGISLAÇÃO APLICÁVEL') ||
        pTrim.startsWith('DO FORO')
      ) {
        return `<h2 style="font-size: 12pt; font-weight: bold; margin: 16pt 0 8pt 0; text-transform: uppercase; text-align: left; font-family: 'Times New Roman', Times, serif;">${pTrim}</h2>`
      }

      // Bloco de assinaturas final
      const orgRazao = dados.dadosContratanteCustom?.razaoSocial || DADOS_CONTRATANTE.razaoSocial
      const orgCnpj = dados.dadosContratanteCustom?.cnpj || DADOS_CONTRATANTE.cnpj
      const orgRep = dados.dadosContratanteCustom?.representante || DADOS_CONTRATANTE.representante
      const orgCargo =
        dados.dadosContratanteCustom?.cargoRepresentante ||
        DADOS_CONTRATANTE.cargoRepresentante ||
        'Presidente'

      if (
        pTrim.includes('______') &&
        (pTrim.includes(orgRazao) || pTrim.includes('CONTRATANTE') || pTrim.includes('ORGANIZAÇÃO'))
      ) {
        return `<div style="margin-top: 36pt; page-break-inside: avoid; font-family: 'Times New Roman', Times, serif;">
          <table style="width: 100%; border: none; text-align: center; font-size: 11pt;">
            <tr>
              <td style="width: 48%; vertical-align: top; padding: 12pt;">
                <div style="border-top: 1px solid #000; padding-top: 6pt; margin: 0 auto; width: 85%;">
                  <strong>${orgRazao}</strong><br/>
                  <span>${orgRep} - ${orgCargo}</span><br/>
                  <span>CNPJ: ${orgCnpj}</span>
                </div>
              </td>
              <td style="width: 4%;"></td>
              <td style="width: 48%; vertical-align: top; padding: 12pt;">
                <div style="border-top: 1px solid #000; padding-top: 6pt; margin: 0 auto; width: 85%;">
                  <strong>${ph(dados.razaoSocial, 'RAZÃO SOCIAL DA CONTRATADA')}</strong><br/>
                  <span>${ph(dados.representanteLegal, 'REPRESENTANTE LEGAL')}</span><br/>
                  <span>CNPJ: ${ph(dados.cnpj, 'CNPJ')}</span>
                </div>
              </td>
            </tr>
          </table>
        </div>`
      }

      // Converte quebras simples em <br/>
      const comQuebras = pTrim.replace(/\n/g, '<br/>')

      // Destaque de placeholders em negrito quando contêm [ ... ]
      const comPlaceholdersDestacados = comQuebras.replace(
        /(\[[^\]]+\])/g,
        '<strong><span style="background-color: #FEF3C7; padding: 0 2px;">$1</span></strong>',
      )

      return `<p style="margin: 0 0 10pt 0; text-align: justify; line-height: 1.5; font-size: 11pt; font-family: 'Times New Roman', Times, serif;">${comPlaceholdersDestacados}</p>`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Contrato de Prestação de Serviços - ${dados.razaoSocial || 'PJ'}</title>
  <style>
    @page {
      size: A4;
      margin: 2.5cm 2cm 2cm 2.5cm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000000;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
    }
    p {
      text-align: justify;
      margin-bottom: 10pt;
    }
    h1, h2 {
      font-family: 'Times New Roman', Times, serif;
      color: #000000;
    }
  </style>
</head>
<body>
  ${htmlCorpo}
</body>
</html>`
}

/**
 * Exporta como arquivo compatível com Word (.doc) via HTML binário com MIME type application/msword.
 */
export function exportarContratoComoDoc(dados: DadosContratoPJ) {
  const html = gerarHtmlContratoPJ(dados)
  const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const nomeArq = (dados.razaoSocial || 'Contrato_PJ')
    .replace(/[^\w\s-]/gi, '')
    .replace(/\s+/g, '_')
  a.download = `Contrato_PJ_${nomeArq}_${dados.modelo}.doc`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Imprime ou gera PDF do contrato via janela de impressão formatada A4 com estilos @media print.
 */
export function imprimirOuExportarPdfContrato(dados: DadosContratoPJ) {
  const html = gerarHtmlContratoPJ(dados)
  const janela = window.open('', '_blank', 'width=800,height=900')
  if (!janela) {
    alert('Por favor, permita pop-ups no seu navegador para imprimir ou gerar o PDF do contrato.')
    return
  }
  janela.document.open()
  janela.document.write(html)
  janela.document.close()
  janela.focus()
  setTimeout(() => {
    janela.print()
  }, 400)
}

/**
 * Exporta como arquivo texto (.txt)
 */
export function exportarContratoComoTxt(dados: DadosContratoPJ) {
  const texto = gerarTextoContratoPJ(dados)
  const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const nomeArq = (dados.razaoSocial || 'Contrato_PJ')
    .replace(/[^\w\s-]/gi, '')
    .replace(/\s+/g, '_')
  a.download = `Contrato_PJ_${nomeArq}_${dados.modelo}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
