import { dynamicMovingAverage, exponentialMovingAverage } from 'src/utils/statistics'

describe('Moving averages', () => {
  const simpleData = [1, 2, 3, 4, 5]
  const dmaa50 = [0, 1.5, 2.25, 3.125, 4.0625]
  const dmaa51 = [1, 1.5, 2.25, 3.125, 4.0625]

  // Case data from https://github.com/kaelzhang/moving-averages/blob/master/test/index.js
  it('Computes correctly for DMA', () => {
    const dma = dynamicMovingAverage
    expect(dma(simpleData, 1, true)).toEqual(simpleData)
    expect(dma(simpleData, 2, true)).toEqual(Array(5))
    expect(dma(simpleData, 0.5, true)).toEqual(dmaa50)
    expect(dma(simpleData, 0.5)).toEqual(dmaa51)
    expect(dma(simpleData, [0.1, 0.2, 0.1, 0.1, 0.05]).map((v) => v.toFixed(10))).toEqual(
      [1, 1.2, 1.38, 1.642, 1.8099].map((v) => v.toFixed(10))
    )
  })

  it('Computes correctly for EMA', () => {
    const ema = exponentialMovingAverage
    expect(ema(simpleData, 3)).toEqual(dmaa51)
  })
})
