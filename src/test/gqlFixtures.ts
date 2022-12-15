import { faker } from '@faker-js/faker'
import { Amount, Currency, Portfolio } from 'src/data/__generated__/types-and-hooks'

export const Amounts: Record<'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl', Amount> = {
  none: {
    id: faker.datatype.uuid(),
    value: 0,
    currency: Currency.Usd,
  },
  xs: {
    id: faker.datatype.uuid(),
    value: 0.05,
    currency: Currency.Usd,
  },
  sm: {
    id: faker.datatype.uuid(),
    value: 5,
    currency: Currency.Usd,
  },
  md: {
    id: faker.datatype.uuid(),
    value: 55,
    currency: Currency.Usd,
  },
  lg: {
    id: faker.datatype.uuid(),
    value: 5500,
    currency: Currency.Usd,
  },
  xl: {
    id: faker.datatype.uuid(),
    value: 500000,
    currency: Currency.Usd,
  },
}

export const Portfolios: [Portfolio, Portfolio] = [
  {
    id: faker.datatype.uuid(),
    ownerAddress: faker.finance.ethereumAddress(),
    tokensTotalDenominatedValue: Amounts.md,
    tokensTotalDenominatedValueChange: {
      id: faker.datatype.uuid(),
      absolute: Amounts.sm,
      percentage: Amounts.xs,
    },
  },
  {
    id: faker.datatype.uuid(),
    ownerAddress: faker.finance.ethereumAddress(),
    tokensTotalDenominatedValue: Amounts.md,
    tokensTotalDenominatedValueChange: {
      id: faker.datatype.uuid(),
      absolute: Amounts.sm,
      percentage: Amounts.xs,
    },
  },
]
