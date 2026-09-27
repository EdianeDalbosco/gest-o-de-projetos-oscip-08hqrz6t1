/**
 * Utilitários de formatação e máscara para documentos brasileiros (CNPJ, CPF).
 */

/**
 * Remove qualquer caractere que não seja dígito numérico.
 */
export function onlyDigits(value: string | null | undefined): string {
  if (!value) return ''
  return value.replace(/\D/g, '')
}

/**
 * Aplica máscara de CNPJ conforme a digitação: XX.XXX.XXX/XXXX-XX (máximo 14 dígitos).
 * Exemplos de progressão:
 * "1" -> "1"
 * "13" -> "13"
 * "132" -> "13.2"
 * "13213" -> "13.213"
 * "13213213" -> "13.213.213"
 * "1321321321" -> "13.213.213/21"
 * "13213213000199" -> "13.213.213/0001-99"
 */
export function maskCnpj(value: string | null | undefined): string {
  const digits = onlyDigits(value).slice(0, 14)
  if (!digits) return ''

  if (digits.length <= 2) {
    return digits
  }
  if (digits.length <= 5) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`
  }
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`
}

/**
 * Aplica máscara de CPF conforme a digitação: XXX.XXX.XXX-XX (máximo 11 dígitos).
 * Exemplos de progressão:
 * "1" -> "1"
 * "123" -> "123"
 * "1234" -> "123.4"
 * "123456" -> "123.456"
 * "1234567" -> "123.456.7"
 * "123456789" -> "123.456.789"
 * "12345678901" -> "123.456.789-01"
 */
export function maskCpf(value: string | null | undefined): string {
  const digits = onlyDigits(value).slice(0, 11)
  if (!digits) return ''

  if (digits.length <= 3) {
    return digits
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`
  }
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
}

/**
 * Aplica máscara dinâmica de CPF ou CNPJ dependendo do número de dígitos (até 11 = CPF, acima = CNPJ).
 */
export function maskCpfOrCnpj(value: string | null | undefined): string {
  const digits = onlyDigits(value).slice(0, 14)
  if (digits.length <= 11) {
    return maskCpf(digits)
  }
  return maskCnpj(digits)
}

/**
 * Validação simples de formato completo (14 dígitos para CNPJ, 11 para CPF).
 */
export function isCompleteCnpj(value: string | null | undefined): boolean {
  return onlyDigits(value).length === 14
}

export function isCompleteCpf(value: string | null | undefined): boolean {
  return onlyDigits(value).length === 11
}

/**
 * Converte um número para string formatada de moeda pt-BR (ex: 7809000.5 -> "7.809.000,50")
 * sem o prefixo R$.
 */
export function formatCurrencyBRL(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return ''
  const num = typeof value === 'number' ? value : Number(String(value).replace(',', '.'))
  if (isNaN(num)) return ''
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Converte uma digitação monetária (ex: "7.809.000,00" ou "7809000" ou "7809000.00" ou apenas dígitos)
 * para número float correspondente.
 */
export function parseCurrencyBRL(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return isNaN(value) ? 0 : value

  const str = String(value).trim()
  if (!str) return 0

  // Se já for numérico puro (ex: "7809000" ou "7809000.50")
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    const parsed = parseFloat(str)
    return isNaN(parsed) ? 0 : parsed
  }

  // Remove R$, espaços e pontos de milhar, substitui vírgula por ponto
  const clean = str
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')

  const parsed = parseFloat(clean)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Aplica máscara de moeda dinâmica conforme o usuário digita centavos:
 * Digitando "7" -> "0,07"
 * "78" -> "0,78"
 * "780" -> "7,80"
 * "7809" -> "78,09"
 * "7809000" -> "78.090,00"
 * "780900000" -> "7.809.000,00"
 */
export function maskCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return ''
  const digits = onlyDigits(String(value))
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  if (isNaN(cents)) return ''
  const amount = cents / 100
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
