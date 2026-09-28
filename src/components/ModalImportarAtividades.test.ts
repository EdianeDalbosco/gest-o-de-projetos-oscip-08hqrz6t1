import { describe, it, expect } from 'vitest'
import { inferirTipoExecucao, interpretarTipoVinculo } from './ModalImportarAtividades'

describe('ModalImportarAtividades - inferirTipoExecucao e interpretarTipoVinculo', () => {
  it('mantém o tipo de serviço exatamente como vem na planilha quando preenchido', () => {
    expect(inferirTipoExecucao('PJ', 'Conforme Demanda', 'Atendimento Médico')).toBe(
      'Conforme Demanda',
    )
    expect(inferirTipoExecucao('PJ', 'Plantão', 'Plantão UTI')).toBe('Plantão')
    expect(inferirTipoExecucao('PJ', 'sob demanda', 'Fisioterapia')).toBe('sob demanda')
    expect(inferirTipoExecucao('PJ', 'Serviço Mensal', 'Coordenação')).toBe('Serviço Mensal')
    expect(inferirTipoExecucao('PJ', '  conforme demanda  ', 'Clínico')).toBe('conforme demanda')
    expect(inferirTipoExecucao('CLT', 'Escala Especial 12x36', 'Enfermeiro')).toBe(
      'Escala Especial 12x36',
    )
  })

  it('aplica fallback padrão quando a coluna estiver vazia ou nula', () => {
    // Vínculo CLT sem execução informada -> Mensal
    expect(inferirTipoExecucao('CLT', '', 'Enfermeiro')).toBe('Mensal')
    expect(inferirTipoExecucao('CLT', null, 'Enfermeiro')).toBe('Mensal')
    expect(inferirTipoExecucao('CLT', undefined, 'Enfermeiro')).toBe('Mensal')
    expect(inferirTipoExecucao('CLT', '   ', 'Enfermeiro')).toBe('Mensal')

    // Vínculo PJ sem execução informada -> inferência por descrição ou Serviço Mensal
    expect(inferirTipoExecucao('PJ', '', 'Plantão Médico 12h')).toBe('Plantão')
    expect(inferirTipoExecucao('PJ', null, 'Atendimento sob demanda')).toBe('Conforme Demanda')
    expect(inferirTipoExecucao('PJ', undefined, 'Consultoria Jurídica')).toBe('Serviço Mensal')
  })

  it('interpretarTipoVinculo continua normalizando para CLT ou PJ sem ser afetado', () => {
    expect(interpretarTipoVinculo('CLT')).toBe('CLT')
    expect(interpretarTipoVinculo('clt')).toBe('CLT')
    expect(interpretarTipoVinculo('Celetista')).toBe('CLT')
    expect(interpretarTipoVinculo('Consolidação')).toBe('CLT')

    expect(interpretarTipoVinculo('PJ')).toBe('PJ')
    expect(interpretarTipoVinculo('pj')).toBe('PJ')
    expect(interpretarTipoVinculo('Pessoa Jurídica')).toBe('PJ')
    expect(interpretarTipoVinculo('Prestador')).toBe('PJ')

    expect(interpretarTipoVinculo('Outro')).toBe(null)
    expect(interpretarTipoVinculo('')).toBe(null)
  })
})
