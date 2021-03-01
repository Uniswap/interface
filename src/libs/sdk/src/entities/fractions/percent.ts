import { Rounding, _100 } from '../../constants'
import { Fraction } from './fraction'

const _100_PERCENT = new Fraction(_100)

export class Percent extends Fraction {
  public toSignificant(significantDigits: number = 5, format?: object, rounding?: Rounding): string {
    return this.multiply(_100_PERCENT).toSignificant(significantDigits, format, rounding)
  }

  public toFixed(decimalPlaces: number = 2, format?: object, rounding?: Rounding): string {
    return this.multiply(_100_PERCENT).toFixed(decimalPlaces, format, rounding)
  }
}
