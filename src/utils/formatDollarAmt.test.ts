import { formatDollarAmount, formatDollarPrice } from './formatDollarAmt'

describe('formatDollarPrice', () => {
  it('undefined or null', () => {
    expect(formatDollarPrice(undefined)).toEqual('-')
    expect(formatDollarPrice(null)).toEqual('-')
  })
  it('0', () => {
    expect(formatDollarPrice(0)).toEqual('$0.00')
  })
  it('< 0.000001', () => {
    expect(formatDollarPrice(0.00000000011231231432)).toEqual('$1.12e-10')
  })
  it('num >= 0.000001 && num < 0.1', () => {
    expect(formatDollarPrice(0.00123123124)).toEqual('$0.00123')
  })
  it('num >= 0.1 && num < 1.05', () => {
    expect(formatDollarPrice(0.812831)).toEqual('$0.813')
  })
  it('number is greater than 1.05', () => {
    expect(formatDollarPrice(102312.408)).toEqual('$102312.41')
  })
})

describe('formatDollarAmount', () => {
  it('undefined or null', () => {
    expect(formatDollarAmount(undefined)).toEqual('-')
    expect(formatDollarAmount(null)).toEqual('-')
  })
  it('0', () => {
    expect(formatDollarAmount(0)).toEqual('0')
  })
  it('< 0.000001', () => {
    expect(formatDollarAmount(0.0000000001)).toEqual('$<0.000001')
  })
  it('num >= 0.000001 && num < 0.1', () => {
    expect(formatDollarAmount(0.00123123124)).toEqual('$0.00123')
  })
  it('num >= 0.1 && num < 1.05', () => {
    expect(formatDollarAmount(0.812831)).toEqual('$0.813')
  })
  it('number is greater than 1.05', () => {
    expect(formatDollarAmount(102312.408)).toEqual('$102.31K')
  })
})
