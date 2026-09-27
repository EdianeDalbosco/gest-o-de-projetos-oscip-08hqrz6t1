/**
 * Converte um valor numérico em reais para a sua representação textual por extenso em português brasileiro.
 * Exemplo: 5000 -> "cinco mil reais"
 * Exemplo: 1250.50 -> "um mil, duzentos e cinquenta reais e cinquenta centavos"
 */

const UNIDADES = [
  '',
  'um',
  'dois',
  'três',
  'quatro',
  'cinco',
  'seis',
  'sete',
  'oito',
  'nove',
  'dez',
  'onze',
  'doze',
  'treze',
  'quatorze',
  'quinze',
  'dezesseis',
  'dezessete',
  'dezoito',
  'dezenove',
]

const DEZENAS = [
  '',
  '',
  'vinte',
  'trinta',
  'quarenta',
  'cinquenta',
  'sessenta',
  'setenta',
  'oitenta',
  'noventa',
]

const CENTENAS = [
  '',
  'cento',
  'duzentos',
  'trezentos',
  'quatrocentos',
  'quinhentos',
  'seiscentos',
  'setecentos',
  'oitocentos',
  'novecentos',
]

function converterCentena(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'cem'

  const c = Math.floor(n / 100)
  const d = Math.floor((n % 100) / 10)
  const u = n % 10
  const resto = n % 100

  const partes: string[] = []

  if (c > 0) partes.push(CENTENAS[c])

  if (resto > 0) {
    if (resto < 20) {
      partes.push(UNIDADES[resto])
    } else {
      partes.push(DEZENAS[d])
      if (u > 0) partes.push(UNIDADES[u])
    }
  }

  return partes.join(' e ')
}

export function valorPorExtenso(valor: number): string {
  if (isNaN(valor) || valor <= 0) return 'zero reais'

  // Arredonda para 2 casas
  const valorFixado = Math.round(valor * 100) / 100
  const partes = valorFixado.toFixed(2).split('.')
  const inteiro = parseInt(partes[0], 10)
  const centavos = parseInt(partes[1], 10)

  const resultadoPartes: string[] = []

  if (inteiro > 0) {
    const bilhoes = Math.floor(inteiro / 1_000_000_000)
    const milhoes = Math.floor((inteiro % 1_000_000_000) / 1_000_000)
    const milhares = Math.floor((inteiro % 1_000_000) / 1_000)
    const unidades = inteiro % 1_000

    const grupos: { valor: number; singular: string; plural: string }[] = [
      { valor: bilhoes, singular: 'bilhão', plural: 'bilhões' },
      { valor: milhoes, singular: 'milhão', plural: 'milhões' },
      { valor: milhares, singular: 'mil', plural: 'mil' },
      { valor: unidades, singular: '', plural: '' },
    ]

    const pedacos: string[] = []

    for (let i = 0; i < grupos.length; i++) {
      const g = grupos[i]
      if (g.valor > 0) {
        const textoCentena = converterCentena(g.valor)
        if (g.singular) {
          const sufixo = g.valor === 1 ? g.singular : g.plural
          pedacos.push(`${textoCentena} ${sufixo}`.trim())
        } else {
          pedacos.push(textoCentena)
        }
      }
    }

    const textoInteiro = pedacos.join(' e ')
    const moeda = inteiro === 1 ? 'real' : 'reais'
    resultadoPartes.push(`${textoInteiro} ${moeda}`)
  }

  if (centavos > 0) {
    const textoCentavos = converterCentena(centavos)
    const moedaCentavos = centavos === 1 ? 'centavo' : 'centavos'
    resultadoPartes.push(`${textoCentavos} ${moedaCentavos}`)
  }

  return resultadoPartes.join(' e ')
}
