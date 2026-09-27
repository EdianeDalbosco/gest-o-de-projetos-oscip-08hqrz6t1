import type { RecordModel } from 'pocketbase'

export interface UserRecord extends RecordModel {
  email: string
  name?: string
  avatar?: string
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
