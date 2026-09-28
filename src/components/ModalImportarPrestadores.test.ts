import { describe, it, expect } from 'vitest'
import {
  interpretarTipoPrestador,
  formatarDocumento,
  normalizarTexto,
} from './ModalImportarPrestadores'

describe('ModalImportarPrestadores - helpers', () => {
  describe('interpretarTipoPrestador', () => {
    it('normaliza PJ a partir de variações de texto', () => {
      expect(interpretarTipoPrestador('PJ')).toBe('PJ')
      expect(interpretarTipoPrestador('pj')).toBe('PJ')
      expect(interpretarTipoPrestador('Pessoa Jurídica')).toBe('PJ')
      expect(interpretarTipoPrestador('Prestador de Serviços')).toBe('PJ')
      expect(interpretarTipoPrestador('Empresa')).toBe('PJ')
      expect(interpretarTipoPrestador('Contrato PJ')).toBe('PJ')
    })

    it('normaliza CLT a partir de variações de texto', () => {
      expect(interpretarTipoPrestador('CLT')).toBe('CLT')
      expect(interpretarTipoPrestador('clt')).toBe('CLT')
      expect(interpretarTipoPrestador('Celetista')).toBe('CLT')
      expect(interpretarTipoPrestador('Empregado')).toBe('CLT')
      expect(interpretarTipoPrestador('Funcionário')).toBe('CLT')
      expect(interpretarTipoPrestador('Consolidação')).toBe('CLT')
    })

    it('deduz o tipo pelo número de dígitos do documento quando o tipo está vazio ou nulo', () => {
      // 14 dígitos -> CNPJ -> PJ
      expect(interpretarTipoPrestador('', '12.345.678/0001-90')).toBe('PJ')
      expect(interpretarTipoPrestador(null, '12345678000190')).toBe('PJ')

      // 11 dígitos -> CPF -> CLT
      expect(interpretarTipoPrestador('', '987.654.321-00')).toBe('CLT')
      expect(interpretarTipoPrestador(undefined, '98765432100')).toBe('CLT')
    })

    it('retorna null se o tipo e documento não forem deduzíveis', () => {
      expect(interpretarTipoPrestador('', '')).toBe(null)
      expect(interpretarTipoPrestador(null, null)).toBe(null)
      expect(interpretarTipoPrestador('Invalido', '123')).toBe(null)
    })
  })

  describe('formatarDocumento', () => {
    it('aplica máscara de CPF para CLT', () => {
      expect(formatarDocumento('12345678901', 'CLT')).toBe('123.456.789-01')
      expect(formatarDocumento('123.456.789-01', 'CLT')).toBe('123.456.789-01')
    })

    it('aplica máscara de CNPJ para PJ', () => {
      expect(formatarDocumento('12345678000190', 'PJ')).toBe('12.345.678/0001-90')
      expect(formatarDocumento('12.345.678/0001-90', 'PJ')).toBe('12.345.678/0001-90')
    })

    it('aplica máscara conforme a quantidade de dígitos quando o tipo for nulo', () => {
      expect(formatarDocumento('12345678901', null)).toBe('123.456.789-01')
      expect(formatarDocumento('12345678000190', null)).toBe('12.345.678/0001-90')
    })
  })

  describe('normalizarTexto', () => {
    it('remove acentos, pontuações e converte para minúsculas', () => {
      expect(normalizarTexto('Razão Social / Nome')).toBe('razaosocialnome')
      expect(normalizarTexto('Tipo de Vínculo')).toBe('tipodevinculo')
      expect(normalizarTexto('Previsão & Provisão 13º')).toBe('previsaoprovisao13')
      expect(normalizarTexto('Nome Profissional Designado')).toBe('nomeprofissionaldesignado')
      expect(normalizarTexto('Responsável Técnico')).toBe('responsaveltecnico')
      expect(normalizarTexto('Atividade / Cargo')).toBe('atividadecargo')
    })
  })

  describe('mapeamento de cabeçalhos tolerante para cadastro PJ/CLT', () => {
    it('reconhece cabeçalhos de Profissional Designado e Responsável Técnico', () => {
      const headers = [
        'Tipo de Vínculo',
        'Razão Social',
        'CNPJ',
        'Nome Profissional Designado',
        'Responsável Técnico',
        'CPF Representante',
        'Atividade / Serviço',
        'Remuneração Base',
      ].map(normalizarTexto)

      const cargoIdx = headers.findIndex(
        (h) =>
          h.includes('nomeprofissionaldesignado') ||
          h.includes('profissionaldesignado') ||
          h.includes('cargoprofissao') ||
          h.includes('cargofuncao') ||
          h.includes('cargo') ||
          h.includes('atividade'),
      )
      expect(cargoIdx).toBe(3) // 'Nome Profissional Designado'

      const repIdx = headers.findIndex(
        (h) =>
          h.includes('nomeresponsaveltecnico') ||
          h.includes('responsaveltecnico') ||
          h.includes('representantelegal') ||
          h.includes('representante') ||
          h.includes('responsavel'),
      )
      expect(repIdx).toBe(4) // 'Responsável Técnico'
    })

    it('aceita colunas legadas como "Cargo / Profissão" e "Atividade"', () => {
      const headersLegados = [
        'Tipo de Vínculo',
        'Nome / Razão Social',
        'CPF / CNPJ',
        'Atividade',
        'Tipo de Serviço / Modalidade',
      ].map(normalizarTexto)

      const cargoIdx = headersLegados.findIndex(
        (h) =>
          h.includes('nomeprofissionaldesignado') ||
          h.includes('profissionaldesignado') ||
          h.includes('cargoprofissao') ||
          h.includes('cargofuncao') ||
          h.includes('cargo') ||
          h === 'atividade' ||
          h.includes('atividade'),
      )
      expect(cargoIdx).toBe(3) // mapeia 'Atividade' para cargo/profissional
    })
  })
})
