/* eslint-disable max-lines */
/**
 * Util to format numbers inside reanimated worklets.
 *
 * This is nowhere near complete, but it has all the locales
 * we're likely to use.
 *
 * Code adapted from:
 * https://github.com/willsp/polyfill-Number.toLocaleString-with-Locales/blob/master/polyfill.number.toLocaleString.js
 */

function replaceSeparators(sNum: string, separators: { decimal: string; thousands: string }): string {
  'worklet'
  const sNumParts = sNum.split('.')
  if (separators.thousands && sNumParts[0]) {
    // every three digits, replace it with the digits + the thousands separator
    // $1 indicates that the matched substring is to be replaced by the first captured group
    sNumParts[0] = sNumParts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + separators.thousands)
  }
  sNum = sNumParts.join(separators.decimal)

  return sNum
}

function renderFormat(template: string, options: Record<string, string> & { num?: string; code?: string }): string {
  'worklet'
  for (const [option, value] of Object.entries(options)) {
    let updatedValue = value
    if (value.indexOf('-') !== -1) {
      updatedValue = updatedValue.replace('-', '')
      template = '-' + template
    }

    if (value.indexOf('<') !== -1) {
      updatedValue = updatedValue.replace('<', '')
      template = '<' + template
    }

    template = template.replace('{{' + option + '}}', updatedValue)
  }

  return template
}

/**
 * @summary Computes animation node rounded to precision.
 * from https://github.com/wcandillon/react-native-redash/blob/master/src/Math.ts
 * @worklet
 */
const round = (value: number, precision = 0): number => {
  'worklet'
  const p = Math.pow(10, precision)
  return Math.round(value * p) / p
}

function mapMatch(
  map: { [key in Language]: string | ((key: string, options?: OptionsType) => string) },
  locale: Language,
): string | ((key: string, options?: OptionsType) => string) {
  'worklet'
  let match = locale

  if (!Object.hasOwn(map, locale)) {
    match = 'en'
  }

  return map[match]
}

function dotThousCommaDec(sNum: string): string {
  'worklet'
  const separators = {
    decimal: ',',
    thousands: '.',
  }

  return replaceSeparators(sNum, separators)
}

function commaThousDotDec(sNum: string): string {
  'worklet'
  const separators = {
    decimal: '.',
    thousands: ',',
  }

  return replaceSeparators(sNum, separators)
}

function commaThousCommaDec(sNum: string): string {
  'worklet'
  const separators = {
    decimal: ',',
    thousands: ',',
  }

  return replaceSeparators(sNum, separators)
}

function spaceThousCommaDec(sNum: string): string {
  'worklet'
  const separators = {
    decimal: ',',
    thousands: '\u00A0',
  }

  return replaceSeparators(sNum, separators)
}

function apostropheThousDotDec(sNum: string): string {
  'worklet'
  const separators = {
    decimal: '.',
    thousands: '\u0027',
  }

  return replaceSeparators(sNum, separators)
}

const transformForLocale = {
  'af-ZA': spaceThousCommaDec,
  'ar-SA': commaThousCommaDec,
  'ca-ES': dotThousCommaDec,
  'cs-CZ': spaceThousCommaDec,
  'da-DK': dotThousCommaDec,
  de: dotThousCommaDec,
  'de-DE': dotThousCommaDec,
  'de-AT': dotThousCommaDec,
  'de-CH': apostropheThousDotDec,
  'de-LI': apostropheThousDotDec,
  'de-BE': dotThousCommaDec,
  'el-GR': dotThousCommaDec,
  en: commaThousDotDec,
  'en-GB': commaThousDotDec,
  'en-US': commaThousDotDec,
  'es-419': commaThousDotDec,
  'es-BZ': commaThousDotDec,
  'es-CU': commaThousDotDec,
  'es-DO': commaThousDotDec,
  'es-GT': commaThousDotDec,
  'es-HN': commaThousDotDec,
  'es-MX': commaThousDotDec,
  'es-NI': commaThousDotDec,
  'es-PA': commaThousDotDec,
  'es-PE': commaThousDotDec,
  'es-PR': commaThousDotDec,
  'es-SV': commaThousDotDec,
  'es-US': commaThousDotDec,
  'es-AR': dotThousCommaDec,
  'es-BO': dotThousCommaDec,
  'es-CL': dotThousCommaDec,
  'es-CO': dotThousCommaDec,
  'es-CR': dotThousCommaDec,
  'es-EC': dotThousCommaDec,
  'es-ES': dotThousCommaDec,
  'es-PY': dotThousCommaDec,
  'es-UY': dotThousCommaDec,
  'es-VE': dotThousCommaDec,
  'fi-FI': spaceThousCommaDec,
  fr: spaceThousCommaDec,
  'fr-FR': spaceThousCommaDec,
  'he-IL': commaThousDotDec,
  'hi-IN': dotThousCommaDec,
  hu: spaceThousCommaDec,
  'hu-HU': spaceThousCommaDec,
  'id-ID': commaThousDotDec,
  'it-IT': dotThousCommaDec,
  'ja-JP': commaThousDotDec,
  'ko-KR': commaThousDotDec,
  'ms-MY': dotThousCommaDec,
  'nb-NO': spaceThousCommaDec,
  'no-NO': spaceThousCommaDec,
  nl: dotThousCommaDec,
  'nl-BE': dotThousCommaDec,
  'nl-NL': dotThousCommaDec,
  'pl-PL': spaceThousCommaDec,
  'pt-BR': dotThousCommaDec,
  'pt-PT': spaceThousCommaDec,
  ro: dotThousCommaDec,
  'ro-RO': dotThousCommaDec,
  ru: spaceThousCommaDec,
  'ru-RU': spaceThousCommaDec,
  'sr-SP': dotThousCommaDec,
  'sw-TZ': commaThousDotDec,
  'sv-SE': spaceThousCommaDec,
  'th-TH': commaThousDotDec,
  'tr-TR': dotThousCommaDec,
  'uk-UA': spaceThousCommaDec,
  'ur-PK': commaThousDotDec,
  'vi-VN': dotThousCommaDec,
  'zh-Hans': commaThousDotDec,
  'zh-Hant': commaThousDotDec,
}

const currencyFormatMap = {
  'af-ZA': 'pre',
  'ar-SA': 'post',
  'ca-ES': 'post',
  'cs-CZ': 'post',
  'da-DK': 'post',
  de: 'post',
  'de-DE': 'post',
  'de-AT': 'prespace',
  'de-CH': 'prespace',
  'de-LI': 'post',
  'de-BE': 'post',
  'el-GR': 'post',
  en: 'pre',
  'en-GB': 'pre',
  'en-US': 'pre',
  'es-419': 'pre',
  'es-BZ': 'pre',
  'es-CU': 'pre',
  'es-DO': 'pre',
  'es-GT': 'pre',
  'es-HN': 'pre',
  'es-MX': 'pre',
  'es-NI': 'pre',
  'es-PA': 'pre',
  'es-PE': 'pre',
  'es-PR': 'pre',
  'es-SV': 'pre',
  'es-US': 'pre',
  'es-AR': 'pre',
  'es-BO': 'pre',
  'es-CL': 'pre',
  'es-CO': 'pre',
  'es-CR': 'pre',
  'es-EC': 'pre',
  'es-ES': 'post',
  'es-PY': 'pre',
  'es-UY': 'pre',
  'es-VE': 'pre',
  'fi-FI': 'post',
  fr: 'post',
  'fr-FR': 'post',
  'hi-IN': 'pre',
  'he-IL': 'post',
  hu: 'post',
  'hu-HU': 'post',
  'id-ID': 'pre',
  'it-IT': 'post',
  'ja-JP': 'pre',
  'ko-KR': 'pre',
  'ms-MY': 'pre',
  'nb-NO': 'post',
  'no-NO': 'post',
  nl: 'post',
  'nl-BE': 'post',
  'nl-NL': 'post',
  'pl-PL': 'post',
  'pt-BR': 'pre',
  'pt-PT': 'post',
  ro: 'post',
  'ro-RO': 'post',
  ru: 'post',
  'ru-RU': 'post',
  'sr-SP': 'post',
  'sw-TZ': 'pre',
  'sv-SE': 'post',
  'th-TH': 'pre',
  'tr-TR': 'pre',
  'uk-UA': 'post',
  'ur-PK': 'pre',
  'vi-VN': 'post',
  'zh-Hans': 'pre',
  'zh-Hant': 'pre',
}

export type Language = keyof typeof currencyFormatMap | keyof typeof transformForLocale

const currencySymbols: { [key: string]: string } = {
  afn: '؋',
  ars: '$',
  awg: 'ƒ',
  aud: '$',
  azn: '₼',
  bsd: '$',
  bbd: '$',
  byr: 'p.',
  bzd: 'BZ$',
  bmd: '$',
  bob: 'Bs.',
  bam: 'KM',
  bwp: 'P',
  bgn: 'лв',
  brl: 'R$',
  bnd: '$',
  khr: '៛',
  cad: '$',
  kyd: '$',
  clp: '$',
  cny: '¥',
  cop: '$',
  crc: '₡',
  hrk: 'kn',
  cup: '₱',
  czk: 'Kč',
  dkk: 'kr',
  dop: 'RD$',
  xcd: '$',
  egp: '£',
  svc: '$',
  eek: 'kr',
  eur: '€',
  fkp: '£',
  fjd: '$',
  ghc: '¢',
  gip: '£',
  gtq: 'Q',
  ggp: '£',
  gyd: '$',
  hnl: 'L',
  hkd: '$',
  huf: 'Ft',
  isk: 'kr',
  inr: '₹',
  idr: 'Rp',
  irr: '﷼',
  imp: '£',
  ils: '₪',
  jmd: 'J$',
  jpy: '¥',
  jep: '£',
  kes: 'KSh',
  kzt: 'лв',
  kpw: '₩',
  krw: '₩',
  kgs: 'лв',
  lak: '₭',
  lvl: 'Ls',
  lbp: '£',
  lrd: '$',
  ltl: 'Lt',
  mkd: 'ден',
  myr: 'RM',
  mur: '₨',
  mxn: '$',
  mnt: '₮',
  mzn: 'MT',
  nad: '$',
  npr: '₨',
  ang: 'ƒ',
  nzd: '$',
  nio: 'C$',
  ngn: '₦',
  nok: 'kr',
  omr: '﷼',
  pkr: '₨',
  pab: 'B/.',
  pyg: 'Gs',
  pen: 'S/.',
  php: '₱',
  pln: 'zł',
  qar: '﷼',
  ron: 'lei',
  rub: '₽',
  shp: '£',
  sar: '﷼',
  rsd: 'Дин.',
  scr: '₨',
  sgd: '$',
  sbd: '$',
  sos: 'S',
  zar: 'R',
  lkr: '₨',
  sek: 'kr',
  chf: 'CHF',
  srd: '$',
  syp: '£',
  tzs: 'TSh',
  twd: 'NT$',
  thb: '฿',
  ttd: 'TT$',
  try: '',
  trl: '₤',
  tvd: '$',
  ugx: 'USh',
  uah: '₴',
  gbp: '£',
  usd: '$',
  uyu: '$U',
  uzs: 'лв',
  vef: 'Bs',
  vnd: '₫',
  yer: '﷼',
  zwd: 'Z$',
}

const currencyFormats: { [key: string]: string } = {
  pre: '{{code}}{{num}}',
  post: '{{num}} {{code}}',
  prespace: '{{code}} {{num}}',
}

interface OptionsType {
  maximumFractionDigits?: number
  currency?: string
  style?: string
  currencyDisplay?: string
}

// need this function because JS will auto convert very small numbers to scientific notation
function convertSmallSciNotationToDecimal(value: number): string {
  'worklet'
  const num = value.toPrecision(3)
  if (!num.includes('e-')) {
    return num
  }

  const [base, exponent] = num.split('e-')
  if (!base || !exponent) {
    return '-'
  }

  const decimal = base.replace('.', '')
  return '0.'.concat('0'.repeat(Number(exponent) - 1).concat(decimal))
}

export function numberToLocaleStringWorklet({
  value,
  locale = 'en-US',
  options = {},
  symbol,
}: {
  value: number
  locale?: Language
  options?: OptionsType
  symbol?: string
}): string {
  'worklet'
  if (locale.length < 2) {
    throw new RangeError('Invalid language tag: ' + locale)
  }

  if (!value) {
    return '-'
  }

  let sNum: string

  // if we encounter any coins with a unit price over $1M then add a shorthand case
  if (value < 0) {
    sNum = value.toString()
  } else if (value < 0.0000000000000001) {
    sNum = '<0.0000000000000001'
  } else if (value < 1) {
    sNum = convertSmallSciNotationToDecimal(value)
  } else {
    sNum = value.toFixed(2)
  }

  sNum = (<(key: string, options?: OptionsType) => string>mapMatch(transformForLocale, locale))(sNum, options)

  if (options.currency && options.style === 'currency') {
    const format = currencyFormats[<string>mapMatch(currencyFormatMap, locale)]
    const targetSymbol = symbol ?? currencySymbols[options.currency.toLowerCase()]
    if (format) {
      sNum = renderFormat(format, {
        num: sNum,
        code: options.currencyDisplay === 'code' || !targetSymbol ? options.currency : targetSymbol,
      })
    }
  }

  return sNum
}

const DEFAULT_PRECISION = 2
const DEFAULT_ABSOLUTE = false

export function numberToPercentWorklet(
  value?: number,
  options: {
    precision: number
    absolute: boolean
  } = { precision: DEFAULT_PRECISION, absolute: DEFAULT_ABSOLUTE },
): string {
  'worklet'

  const { precision, absolute } = options

  if (precision < 0) {
    throw new Error('numberToPercentWorklet does not handle negative precision values')
  }

  if (value === undefined || isNaN(value)) {
    return '-'
  }

  // Round and absolute value as needed
  let shapedValue = round(value, precision)
  if (absolute) {
    shapedValue = Math.abs(shapedValue)
  }

  // return raw value when precision is zero
  if (precision === 0) {
    return `${shapedValue}%`
  }

  // Add trailing zeros when value has no decimal
  if (Number.isInteger(shapedValue)) {
    return `${shapedValue}.${'0'.repeat(precision)}%`
  }

  let endingZeros = ''
  const shiftedValue = shapedValue * Math.pow(10, precision)
  for (let d = 0; d < precision; d++) {
    if (shiftedValue % Math.pow(10, d + 1) === 0) {
      endingZeros += '0'
    }
  }

  return `${shapedValue}${endingZeros}%`
}
