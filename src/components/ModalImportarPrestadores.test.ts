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
      expect(normalizarTexto('Nome do Profissional Designado')).toBe('nomedoprofissionaldesignado')
      expect(normalizarTexto('Nome Profissional Designado')).toBe('nomeprofissionaldesignado')
      expect(normalizarTexto('Nome do Representante Legal')).toBe('nomedorepresentantelegal')
      expect(normalizarTexto('CPF do Representante')).toBe('cpfdorepresentante')
      expect(normalizarTexto('Responsável Técnico')).toBe('responsaveltecnico')
      expect(normalizarTexto('Atividade / Cargo')).toBe('atividadecargo')
    })
  })

  describe('mapeamento de cabeçalhos tolerante para cadastro PJ/CLT', () => {
    it('reconhece novos nomes exatos: Nome do Representante Legal, CPF do Representante e Nome do Profissional Designado', () => {
      const headers = [
        'Tipo de Vínculo',
        'Nome / Razão Social',
        'CPF / CNPJ',
        'Nome do Profissional Designado',
        'Tipo de Serviço / Modalidade',
        'Remuneração Base',
        'Nome do Representante Legal',
        'CPF do Representante',
        'Natureza Jurídica',
        'Endereço',
      ].map(normalizarTexto)

      const cargoIdx = headers.findIndex(
        (h) =>
          h.includes('nomedoprofissionaldesignado') ||
          h.includes('nomeprofissionaldesignado') ||
          h.includes('profissionaldesignado') ||
          h.includes('cargoprofissao') ||
          h.includes('cargofuncao') ||
          h.includes('cargo') ||
          h.includes('atividade'),
      )
      expect(cargoIdx).toBe(3) // 'Nome do Profissional Designado'

      const repIdx = headers.findIndex(
        (h) =>
          h.includes('nomedorepresentantelegal') ||
          h.includes('nomedorepresentante') ||
          h.includes('nomeresponsaveltecnico') ||
          h.includes('responsaveltecnico') ||
          h.includes('representantelegal') ||
          h.includes('representante') ||
          h.includes('responsavel'),
      )
      expect(repIdx).toBe(6) // 'Nome do Representante Legal'

      const cpfRepIdx = headers.findIndex(
        (h) =>
          h.includes('cpfdorepresentante') ||
          h.includes('cpfresponsaveltecnico') ||
          h.includes('cpfrepresentantelegal') ||
          h.includes('cpfrepresentante') ||
          h.includes('cpfresponsavel') ||
          h.includes('cpfprof'),
      )
      expect(cpfRepIdx).toBe(7) // 'CPF do Representante'
    })

    it('mantém retrocompatibilidade com cabeçalhos anteriores (Responsável Técnico, CPF Profissional / Representante, Nome Profissional Designado / Cargo)', () => {
      const headersLegados = [
        'Tipo de Vínculo',
        'Nome / Razão Social',
        'CPF / CNPJ',
        'Nome Profissional Designado / Cargo',
        'Tipo de Serviço / Modalidade',
        'Remuneração Base',
        'Representante Legal (ou Responsável Técnico)',
        'CPF Profissional / Representante',
      ].map(normalizarTexto)

      const cargoIdx = headersLegados.findIndex(
        (h) =>
          h.includes('nomedoprofissionaldesignado') ||
          h.includes('nomeprofissionaldesignado') ||
          h.includes('profissionaldesignado') ||
          h.includes('cargoprofissao') ||
          h.includes('cargofuncao') ||
          h.includes('cargo') ||
          h.includes('atividade'),
      )
      expect(cargoIdx).toBe(3) // 'Nome Profissional Designado / Cargo'

      const repIdx = headersLegados.findIndex(
        (h) =>
          h.includes('nomedorepresentantelegal') ||
          h.includes('nomedorepresentante') ||
          h.includes('nomeresponsaveltecnico') ||
          h.includes('responsaveltecnico') ||
          h.includes('representantelegal') ||
          h.includes('representante') ||
          h.includes('responsavel'),
      )
      expect(repIdx).toBe(6) // 'Representante Legal (ou Responsável Técnico)'

      const cpfRepIdx = headersLegados.findIndex(
        (h) =>
          h.includes('cpfdorepresentante') ||
          h.includes('cpfresponsaveltecnico') ||
          h.includes('cpfrepresentantelegal') ||
          h.includes('cpfrepresentante') ||
          h.includes('cpfresponsavel') ||
          h.includes('cpfprof'),
      )
      expect(cpfRepIdx).toBe(7) // 'CPF Profissional / Representante'
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
          h.includes('nomedoprofissionaldesignado') ||
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
