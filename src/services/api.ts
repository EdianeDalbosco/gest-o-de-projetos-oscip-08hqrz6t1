import pb from '@/lib/pocketbase/client'
import type {
  ProjetoRecord,
  ContratoRecord,
  AtividadeRecord,
  FaturaRecord,
  DespesaRecord,
  ConvenioRecord,
  SecretariaRecord,
  PlanoTrabalhoRecord,
  MetaRecord,
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

// CONVÊNIOS
export async function getConvenios(): Promise<ConvenioRecord[]> {
  return pb.collection('convenios').getFullList<ConvenioRecord>({
    sort: '-created',
  })
}

export async function getConvenioById(id: string): Promise<ConvenioRecord> {
  return pb.collection('convenios').getOne<ConvenioRecord>(id)
}

export async function createConvenio(data: Partial<ConvenioRecord>): Promise<ConvenioRecord> {
  return pb.collection('convenios').create<ConvenioRecord>(data)
}

export async function updateConvenio(
  id: string,
  data: Partial<ConvenioRecord>,
): Promise<ConvenioRecord> {
  return pb.collection('convenios').update<ConvenioRecord>(id, data)
}

export async function deleteConvenio(id: string): Promise<boolean> {
  return pb.collection('convenios').delete(id)
}

// SECRETARIAS
export async function getSecretarias(): Promise<SecretariaRecord[]> {
  return pb.collection('secretarias').getFullList<SecretariaRecord>({
    sort: 'nome',
    expand: 'convenio_id',
  })
}

export async function getSecretariasByConvenio(convenioId: string): Promise<SecretariaRecord[]> {
  return pb.collection('secretarias').getFullList<SecretariaRecord>({
    filter: `convenio_id = "${convenioId}"`,
    sort: 'nome',
  })
}

export async function createSecretaria(data: Partial<SecretariaRecord>): Promise<SecretariaRecord> {
  return pb.collection('secretarias').create<SecretariaRecord>(data)
}

export async function updateSecretaria(
  id: string,
  data: Partial<SecretariaRecord>,
): Promise<SecretariaRecord> {
  return pb.collection('secretarias').update<SecretariaRecord>(id, data)
}

export async function deleteSecretaria(id: string): Promise<boolean> {
  return pb.collection('secretarias').delete(id)
}

// PLANOS DE TRABALHO
export async function getPlanosTrabalho(): Promise<PlanoTrabalhoRecord[]> {
  return pb.collection('planos_trabalho').getFullList<PlanoTrabalhoRecord>({
    sort: '-created',
    expand: 'secretaria_id,convenio_id',
  })
}

export async function getPlanosTrabalhoByConvenio(
  convenioId: string,
): Promise<PlanoTrabalhoRecord[]> {
  return pb.collection('planos_trabalho').getFullList<PlanoTrabalhoRecord>({
    filter: `convenio_id = "${convenioId}"`,
    sort: '-created',
    expand: 'secretaria_id',
  })
}

export async function getPlanosTrabalhoBySecretaria(
  secretariaId: string,
): Promise<PlanoTrabalhoRecord[]> {
  return pb.collection('planos_trabalho').getFullList<PlanoTrabalhoRecord>({
    filter: `secretaria_id = "${secretariaId}"`,
    sort: '-created',
  })
}

export async function createPlanoTrabalho(
  data: Partial<PlanoTrabalhoRecord>,
): Promise<PlanoTrabalhoRecord> {
  return pb.collection('planos_trabalho').create<PlanoTrabalhoRecord>(data)
}

export async function updatePlanoTrabalho(
  id: string,
  data: Partial<PlanoTrabalhoRecord>,
): Promise<PlanoTrabalhoRecord> {
  return pb.collection('planos_trabalho').update<PlanoTrabalhoRecord>(id, data)
}

export async function deletePlanoTrabalho(id: string): Promise<boolean> {
  return pb.collection('planos_trabalho').delete(id)
}

// METAS
export async function getMetas(): Promise<MetaRecord[]> {
  return pb.collection('metas').getFullList<MetaRecord>({
    sort: '-created',
    expand: 'plano_trabalho_id',
  })
}

export async function getMetasByPlano(planoTrabalhoId: string): Promise<MetaRecord[]> {
  return pb.collection('metas').getFullList<MetaRecord>({
    filter: `plano_trabalho_id = "${planoTrabalhoId}"`,
    sort: 'created',
  })
}

export async function createMeta(data: Partial<MetaRecord>): Promise<MetaRecord> {
  return pb.collection('metas').create<MetaRecord>(data)
}

export async function updateMeta(id: string, data: Partial<MetaRecord>): Promise<MetaRecord> {
  return pb.collection('metas').update<MetaRecord>(id, data)
}

export async function deleteMeta(id: string): Promise<boolean> {
  return pb.collection('metas').delete(id)
}
