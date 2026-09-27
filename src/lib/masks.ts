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
