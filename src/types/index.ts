import type { RecordModel } from 'pocketbase'

export type UserRole = 'admin' | 'gestor' | 'operador' | 'leitura'
export type UserEquipe =
  | 'Administração'
  | 'Saúde'
  | 'Educação'
  | 'Financeiro'
  | 'Projetos'
  | 'Jurídico'
  | (string & {})

export interface UserRecord extends RecordModel {
  email: string
  name?: string
  avatar?: string
  role?: UserRole
  equipe?: UserEquipe
  cargo?: string
  ativo?: boolean
}

export interface OrganizacaoConfigRecord extends RecordModel {
  nome_organizacao: string
  natureza_juridica?: string
  cnpj: string
  endereco_completo: string
  cidade?: string
  estado?: string
  foro?: string
  presidente_nome: string
  presidente_cpf: string
  presidente_cargo: string
  telefone?: string
  email?: string
  termo_parceria_padrao?: string
}

export type ProjetoStatus = 'ativo' | 'pausado' | 'concluido' | 'cancelado'

export type ContratoVinculadoTipo = 'CLT' | 'PJ'

export interface ProjetoRecord extends RecordModel {
  nome: string
  descricao?: string
  valor_total: number
  status: ProjetoStatus
  progresso?: number
  contratos_vinculados?: ContratoVinculadoTipo | ContratoVinculadoTipo[]
  data_inicio?: string
  data_fim?: string
  parceiro?: string
  secretaria_id?: string
  convenio_id?: string
  valor_mensal_execucao?: number
  valor_mensal_despesas_adm?: number
  meses_duracao?: number
  expand?: {
    secretaria_id?: SecretariaRecord
    convenio_id?: ConvenioRecord
  }
}

export type ContratoTipo = 'CLT' | 'PJ'
export type ContratoStatus = 'ativo' | 'encerrado' | 'vencendo'
export type ContratoTipoPJ = 'horas' | 'mensal'

export interface ContratoRecord extends RecordModel {
  tipo: ContratoTipo
  nome: string
  cargo_funcao: string
  valor: number
  tipo_pj?: ContratoTipoPJ
  data_inicio?: string
  data_fim?: string
  status: ContratoStatus
  beneficios?: string[]
  clausulas?: string
  projeto_id?: string
  expand?: {
    projeto_id?: ProjetoRecord
  }
}

export type AtividadeStatus = 'pendente' | 'aprovada' | 'rejeitada'

export interface AtividadeRecord extends RecordModel {
  prestador_id: string
  projeto_id: string
  plano_trabalho_id?: string
  descricao: string
  data: string
  horas: number
  status: AtividadeStatus
  valor_aprovado?: number
  expand?: {
    prestador_id?: ContratoRecord
    projeto_id?: ProjetoRecord
    plano_trabalho_id?: PlanoTrabalhoRecord
  }
}

export type FaturaStatus = 'emitida' | 'paga' | 'vencida'

export interface FaturaRecord extends RecordModel {
  numero: string
  projeto_id?: string
  contrato_id?: string
  plano_trabalho_id?: string
  valor: number
  data_emissao: string
  data_vencimento: string
  status: FaturaStatus
  forma_pagamento?: string
  expand?: {
    projeto_id?: ProjetoRecord
    contrato_id?: ContratoRecord
    plano_trabalho_id?: PlanoTrabalhoRecord
  }
}

export type DespesaCategoria = 'Pessoal' | 'Operacional' | 'Marketing' | 'Infraestrutura' | 'Outros'

export interface DespesaRecord extends RecordModel {
  categoria: DespesaCategoria
  descricao: string
  valor: number
  data: string
}

// CONVÊNIOS MUNICIPAIS & ESTRUTURA HIERÁRQUICA
export type ConvenioStatus = 'ativo' | 'encerrado' | 'suspenso'

export interface ConvenioRecord extends RecordModel {
  nome: string
  municipio: string
  numero_instrumento: string
  orgao_contratante?: string
  valor_global: number
  data_inicio?: string
  data_fim?: string
  status: ConvenioStatus
  observacoes?: string
  anexo_pdf?: string
}

// CADASTRO DE PRESTADORES E CLTs
export type PrestadorTipo = 'CLT' | 'PJ'

export interface PrestadorColaboradorRecord extends RecordModel {
  tipo: PrestadorTipo
  // PJ
  razao_social?: string
  cnpj?: string
  profissional?: string
  cpf_profissional?: string
  natureza_juridica?: string
  endereco?: string
  // CLT
  nome_colaborador?: string
  cpf_colaborador?: string
  codigo_consisa?: string
  cargo: string
  setor?: string
  situacao?: string
  remuneracao_base?: number
  observacoes?: string
}

// CATÁLOGO DE ATIVIDADES DO PROJETO
export type TipoExecucaoAtividade =
  | 'Mensal'
  | 'Serviço Mensal'
  | 'Conforme Demanda'
  | 'Plantão'
  | (string & {})

export interface CatalogoAtividadeRecord extends RecordModel {
  projeto_id: string
  tipo_vinculo: 'CLT' | 'PJ'
  tipo_execucao: TipoExecucaoAtividade
  descricao: string
  valor_unitario: number
  proventos?: number
  provisao?: number
  encargos?: number
  detalhes_escopo?: string
  expand?: {
    projeto_id?: ProjetoRecord
  }
}

// FATURAMENTOS MENSAIS ESTRUTURADOS
export type FaturamentoTipo = 'PJ' | 'CLT' | 'CONSOLIDADO'
export type StatusNotaFiscal = 'aguardando_nf' | 'nf_emitida' | 'liquidado'

export interface FaturamentoItemPJ {
  item?: number | string
  empresa: string
  cnpj: string
  profissional: string
  dotacao?: string
  atividade: string
  tipo: string // 'Serviço Mensal' | 'Demanda'
  local?: string
  dataInicio?: string
  remuneracaoBase: number
  ref: number // dias trabalhados (ex: 31, 20) ou qtde de plantões/demandas
  valor: number
}

export interface FaturamentoItemCLT {
  codigoConsisa?: string
  colaborador: string
  cpf: string
  cargo: string
  setor?: string
  situacao?: string
  remuneracaoBase: number
  ref: number
  remuneracao?: number
  insalubridade?: number
  periculosidade?: number
  salarioFamilia?: number
  horasExtras?: number
  dsr?: number
  adicionalNoturno?: number
  gratificacao?: number
  plantao?: number
  faltas?: number
  proventos?: number
  provisao1944?: number
  verbasRescisorias?: number
  multa40?: number
  encargosTributarios?: number
  valorTotal: number
}

export interface FaturamentoItemAtividade {
  descricao: string
  tipo: string
  quantidade: number
  valor: number
  tipoVinculo: 'CLT' | 'PJ'
}

export interface FaturamentoMensalRecord extends RecordModel {
  numero_sequencial: string
  convenio_id: string
  secretaria_id: string
  projeto_id?: string
  tipo_faturamento: FaturamentoTipo
  competencia: string // ex: "01 A 31 DE AGOSTO DE 2026"
  periodo: string // ex: "AGOSTO DE 2026"
  mes: number
  ano: number
  valor_execucao_direta: number
  valor_execucao_clt?: number
  valor_execucao_pj?: number
  valor_despesas_adm?: number
  valor_total: number
  status_nf?: StatusNotaFiscal
  numero_nf?: string
  data_emissao_nf?: string
  dados_resumo?: Record<string, unknown>
  itens_detalhamento_pj?: FaturamentoItemPJ[]
  itens_detalhamento_clt?: FaturamentoItemCLT[]
  itens_por_atividade?: FaturamentoItemAtividade[]
  rateio_despesas_adm?: Record<string, unknown>
  observacoes?: string
  expand?: {
    convenio_id?: ConvenioRecord
    secretaria_id?: SecretariaRecord
    projeto_id?: ProjetoRecord
  }
}

export interface SecretariaRecord extends RecordModel {
  nome: string
  convenio_id: string
  responsavel?: string
  observacoes?: string
  expand?: {
    convenio_id?: ConvenioRecord
  }
}

export type PlanoTrabalhoStatus = 'ativo' | 'em_analise' | 'concluido' | 'suspenso'

export interface PlanoTrabalhoRecord extends RecordModel {
  titulo: string
  secretaria_id: string
  convenio_id?: string
  valor_previsto: number
  valor_empenhado?: number
  valor_executado?: number
  periodo?: string
  status: PlanoTrabalhoStatus
  descricao?: string
  expand?: {
    secretaria_id?: SecretariaRecord
    convenio_id?: ConvenioRecord
  }
}

export type MetaStatus = 'nao_iniciada' | 'em_andamento' | 'concluida' | 'cancelada'

export interface MetaRecord extends RecordModel {
  plano_trabalho_id: string
  descricao: string
  quantidade_alvo?: number
  quantidade_realizada?: number
  status: MetaStatus
  prazo?: string
  expand?: {
    plano_trabalho_id?: PlanoTrabalhoRecord
  }
}

export type EmpenhoStatus = 'reservado' | 'liquidado' | 'pago'

export interface EmpenhoRecord extends RecordModel {
  secretaria_id: string
  convenio_id?: string
  numero: string
  descricao?: string
  valor: number
  data?: string
  status: EmpenhoStatus
  expand?: {
    secretaria_id?: SecretariaRecord
    convenio_id?: ConvenioRecord
  }
}
