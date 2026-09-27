import pb from '@/lib/pocketbase/client'
import type {
  ProjetoRecord,
  ContratoRecord,
  AtividadeRecord,
  FaturaRecord,
  DespesaRecord,
} from '@/types'

// PROJETOS
export async function getProjetos(): Promise<ProjetoRecord[]> {
  return pb.collection('projetos').getFullList<ProjetoRecord>({
    sort: '-created',
  })
}

export async function getProjetoById(id: string): Promise<ProjetoRecord> {
  return pb.collection('projetos').getOne<ProjetoRecord>(id)
}

export async function createProjeto(data: Partial<ProjetoRecord>): Promise<ProjetoRecord> {
  return pb.collection('projetos').create<ProjetoRecord>(data)
}

export async function updateProjeto(
  id: string,
  data: Partial<ProjetoRecord>,
): Promise<ProjetoRecord> {
  return pb.collection('projetos').update<ProjetoRecord>(id, data)
}

export async function deleteProjeto(id: string): Promise<boolean> {
  return pb.collection('projetos').delete(id)
}

// CONTRATOS
export async function getContratos(): Promise<ContratoRecord[]> {
  return pb.collection('contratos').getFullList<ContratoRecord>({
    sort: '-created',
    expand: 'projeto_id',
  })
}

export async function getContratoById(id: string): Promise<ContratoRecord> {
  return pb.collection('contratos').getOne<ContratoRecord>(id, {
    expand: 'projeto_id',
  })
}

export async function createContrato(data: Partial<ContratoRecord>): Promise<ContratoRecord> {
  return pb.collection('contratos').create<ContratoRecord>(data)
}

export async function updateContrato(
  id: string,
  data: Partial<ContratoRecord>,
): Promise<ContratoRecord> {
  return pb.collection('contratos').update<ContratoRecord>(id, data)
}

export async function deleteContrato(id: string): Promise<boolean> {
  return pb.collection('contratos').delete(id)
}

// ATIVIDADES
export async function getAtividades(): Promise<AtividadeRecord[]> {
  return pb.collection('atividades').getFullList<AtividadeRecord>({
    sort: '-data',
    expand: 'prestador_id,projeto_id',
  })
}

export async function getAtividadesByProjeto(projetoId: string): Promise<AtividadeRecord[]> {
  return pb.collection('atividades').getFullList<AtividadeRecord>({
    filter: `projeto_id = "${projetoId}"`,
    sort: '-data',
    expand: 'prestador_id,projeto_id',
  })
}

export async function getAtividadesByPrestador(prestadorId: string): Promise<AtividadeRecord[]> {
  return pb.collection('atividades').getFullList<AtividadeRecord>({
    filter: `prestador_id = "${prestadorId}"`,
    sort: '-data',
    expand: 'prestador_id,projeto_id',
  })
}

export async function createAtividade(data: Partial<AtividadeRecord>): Promise<AtividadeRecord> {
  return pb.collection('atividades').create<AtividadeRecord>(data)
}

export async function updateAtividade(
  id: string,
  data: Partial<AtividadeRecord>,
): Promise<AtividadeRecord> {
  return pb.collection('atividades').update<AtividadeRecord>(id, data)
}

export async function deleteAtividade(id: string): Promise<boolean> {
  return pb.collection('atividades').delete(id)
}

// FATURAS
export async function getFaturas(): Promise<FaturaRecord[]> {
  return pb.collection('faturas').getFullList<FaturaRecord>({
    sort: '-data_vencimento',
    expand: 'projeto_id,contrato_id',
  })
}

export async function getFaturasByProjeto(projetoId: string): Promise<FaturaRecord[]> {
  return pb.collection('faturas').getFullList<FaturaRecord>({
    filter: `projeto_id = "${projetoId}"`,
    sort: '-data_vencimento',
    expand: 'projeto_id,contrato_id',
  })
}

export async function createFatura(data: Partial<FaturaRecord>): Promise<FaturaRecord> {
  return pb.collection('faturas').create<FaturaRecord>(data)
}

export async function updateFatura(id: string, data: Partial<FaturaRecord>): Promise<FaturaRecord> {
  return pb.collection('faturas').update<FaturaRecord>(id, data)
}

export async function deleteFatura(id: string): Promise<boolean> {
  return pb.collection('faturas').delete(id)
}

// DESPESAS
export async function getDespesas(): Promise<DespesaRecord[]> {
  return pb.collection('despesas').getFullList<DespesaRecord>({
    sort: '-data',
  })
}

export async function createDespesa(data: Partial<DespesaRecord>): Promise<DespesaRecord> {
  return pb.collection('despesas').create<DespesaRecord>(data)
}

export async function updateDespesa(
  id: string,
  data: Partial<DespesaRecord>,
): Promise<DespesaRecord> {
  return pb.collection('despesas').update<DespesaRecord>(id, data)
}

export async function deleteDespesa(id: string): Promise<boolean> {
  return pb.collection('despesas').delete(id)
}
