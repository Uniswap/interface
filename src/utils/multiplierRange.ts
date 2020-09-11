import BigNumber from 'bignumber.js'
export type StakeYear = '1' | '2' | '3' | '4'

enum Field {
  RANGE = 'range',
  ONE = 'one',
  TWO = 'two',
  THREE = 'three',
  FOUR = 'four'
}

interface RangeRecord {
  [Field.RANGE]: string
  [Field.ONE]: string
  [Field.TWO]: string
  [Field.THREE]: string
  [Field.FOUR]: string
}

function csvJSON(csv: string): RangeRecord[] {
  const lines = csv.split('\n')
  const result: RangeRecord[] = []
  const headers = lines[0].split(',')

  for (let i = 1; i < lines.length; i++) {
    const obj: RangeRecord = {
      [Field.RANGE]: '',
      [Field.ONE]: '',
      [Field.TWO]: '',
      [Field.THREE]: '',
      [Field.FOUR]: ''
    }
    const currentline = lines[i].split(',')

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j].trim()
    }

    result.push(obj)
  }

  return result
}

const csvString = `range,one,two,three,four
                    0,0.0,0.0,0.0,0.0
                    1000,1.0,1.2,1.4,2.0
                    5000,1.3,1.4,1.8,2.5
                    10000,1.5,1.7,2.1,3.0
                    50000,2.0,2.3,2.9,4.0
                    100000,3.0,3.5,4.3,6.0
                    500000,4.0,4.6,5.7,8.0
                    1000000,6.0,6.9,8.6,12.0
                    5000000,8.0,9.2,11.4,16.0
                    50000000,10.0,11.5,14.3,20.0`

const rangeYearMultiplierRange = csvJSON(csvString) as RangeRecord[]

export default function getMultiplierRange(croStake: BigNumber, stakeYear: StakeYear): string {
  return rangeYearMultiplierRange.reduce((previousValue: string, range: RangeRecord) => {
    const rangeNum = new BigNumber(range[Field.RANGE])
    const croStakeNum = new BigNumber(croStake)
    if (croStakeNum.lt(rangeNum)) {
      return previousValue
    }
    return stakeYear === '1' ? range.one : stakeYear === '2' ? range.two : stakeYear === '3' ? range.three : range.four
  }, '0.0')
}
