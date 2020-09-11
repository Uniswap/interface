const ONE_YEAR = process.env.REACT_APP_ONE_YEAR_STAKE
const TWO_YEAR = process.env.REACT_APP_TWO_YEAR_STAKE
const THREE_YEAR = process.env.REACT_APP_THREE_YEAR_STAKE
const FOUR_YEAR = process.env.REACT_APP_FOUR_YEAR_STAKE

if (
  typeof ONE_YEAR === 'undefined' ||
  typeof TWO_YEAR === 'undefined' ||
  typeof THREE_YEAR === 'undefined' ||
  typeof FOUR_YEAR === 'undefined'
)
  throw new Error('Stake addresses are not well configured')

export enum Field {
  ONE_YEAR = 'ONE_YEAR',
  TWO_YEAR = 'TWO_YEAR',
  THREE_YEAR = 'THREE_YEAR',
  FOUR_YEAR = 'FOUR_YEAR'
}

export const StakeContractAddress = Object.freeze({
  [Field.ONE_YEAR]: ONE_YEAR,
  [Field.TWO_YEAR]: TWO_YEAR,
  [Field.THREE_YEAR]: THREE_YEAR,
  [Field.FOUR_YEAR]: FOUR_YEAR
})
