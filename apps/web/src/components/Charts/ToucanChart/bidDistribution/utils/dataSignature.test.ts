import { createHistogramSignature } from '~/components/Charts/ToucanChart/bidDistribution/utils/dataSignature'

describe('createHistogramSignature', () => {
  it('should return "empty" for empty data', () => {
    expect(createHistogramSignature([])).toBe('empty')
  })

  it('should include length + first + last so changes are reflected', () => {
    expect(
      createHistogramSignature([
        { time: 1, value: 10 },
        { time: 2, value: 20 },
      ]),
    ).not.toBe(
      createHistogramSignature([
        { time: 1, value: 10 },
        { time: 2, value: 21 },
      ]),
    )

    expect(
      createHistogramSignature([
        { time: 1, value: 10 },
        { time: 2, value: 20 },
      ]),
    ).not.toBe(
      createHistogramSignature([
        { time: 1, value: 11 },
        { time: 2, value: 20 },
      ]),
    )

    expect(
      createHistogramSignature([
        { time: 1, value: 10 },
        { time: 2, value: 20 },
      ]),
    ).not.toBe(createHistogramSignature([{ time: 1, value: 10 }]))
  })

  it('should be stable for same first/last/length', () => {
    const a = [
      { time: 1, value: 10 },
      { time: 2, value: 20 },
      { time: 3, value: 30 },
    ]
    const b = [
      { time: 1, value: 10 },
      { time: 2, value: 999 },
      { time: 3, value: 30 },
    ]
    expect(createHistogramSignature(a)).toBe(createHistogramSignature(b))
  })
})
