import { CurrencyAmount, Fraction, Token } from '@ubeswap/sdk-core'

function substringDigit(input: string) {
  switch (input) {
    case '0':
      return '₀'
    case '1':
      return '₁'
    case '2':
      return '₂'
    case '3':
      return '₃'
    case '4':
      return '₄'
    case '5':
      return '₅'
    case '6':
      return '₆'
    case '7':
      return '₇'
    case '8':
      return '₈'
    case '9':
      return '₉'
    default:
      return ''
  }
}

export function relevantDigits(tokenAmount?: CurrencyAmount<Token>) {
  if (!tokenAmount || tokenAmount.equalTo('0')) {
    return '0.0'
  }
  const tokenAmountF = new Fraction(tokenAmount.quotient, '1000000000000000000')

  if (tokenAmountF.lessThan(new Fraction('1', '100'))) {
    const text = tokenAmountF.toSignificant(1)
    return text.replace(/\.([0]{3,})/, function (m: string, g1: string) {
      const length = g1.length
      return '.0' + (length + '').replace(/\d/g, substringDigit)
    })
  }

  if (tokenAmountF.lessThan(new Fraction('1', '1'))) {
    return tokenAmountF.toSignificant(2)
  }

  if (tokenAmountF.lessThan(new Fraction('100', '1'))) {
    return tokenAmountF.toFixed(2)
  }

  return tokenAmountF.toFixed(0, { groupSeparator: ',' })
}
