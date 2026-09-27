import type { RecordModel } from 'pocketbase'

export interface UserRecord extends RecordModel {
  email: string
  name?: string
  avatar?: string
}

export type ProjetoStatus = 'ativo' | 'pausado' | 'concluido' | 'cancelado'

export interface ProjetoRecord extends RecordModel {
  nome: string
  descricao?: string
  valor_total: number
  status: ProjetoStatus
  progresso?: number
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
  descricao: string
  data: string
  horas: number
  status: AtividadeStatus
  valor_aprovado?: number
  expand?: {
    prestador_id?: ContratoRecord
    projeto_id?: ProjetoRecord
  }
}

export type FaturaStatus = 'emitida' | 'paga' | 'vencida'

export interface FaturaRecord extends RecordModel {
  numero: string
  projeto_id?: string
  contrato_id?: string
  valor: number
  data_emissao: string
  data_vencimento: string
  status: FaturaStatus
  forma_pagamento?: string
  expand?: {
    projeto_id?: ProjetoRecord
    contrato_id?: ContratoRecord
  }
}

export type DespesaCategoria = 'Pessoal' | 'Operacional' | 'Marketing' | 'Infraestrutura' | 'Outros'

export interface DespesaRecord extends RecordModel {
  categoria: DespesaCategoria
  descricao: string
  valor: number
  data: string
}
