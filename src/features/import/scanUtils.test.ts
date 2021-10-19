import { Bounds, extractSeedPhraseFromOCR, OcrObject } from 'src/features/import/scanUtils'

const VIEWFINDER_BOUNDS: Bounds = [10, 10, 20, 20]
const IN_BOUNDS: Bounds = [15, 15, 15, 15]
const OUT_OF_BOUNDS: Bounds = [9, 9, 21, 21]
const SAMPLE_SEED = [
  'dove',
  'lumber',
  'quote',
  'board',
  'young',
  'robust',
  'kit',
  'invite',
  'plastic',
  'regular',
  'skull',
  'history',
]
const SAMPLE_SEED_STRING = SAMPLE_SEED.join(' ')

const INVALID_SEED = [
  'kangaroooooo',
  'kitty cat',
  'quote',
  'board',
  'young',
  'robust',
  'kit',
  'invite',
  'plastic',
  'regular',
  'skull',
  'history',
]
const INVALID_SEED_STRING = INVALID_SEED.join(' ')

const OUT_OF_BOUNDS_OBJECT: OcrObject[] = [
  {
    bounds: OUT_OF_BOUNDS,
    height: 0,
    width: 0,
    text: SAMPLE_SEED_STRING,
  },
]

const INVALID_SEED_OBJECT: OcrObject[] = [
  {
    bounds: IN_BOUNDS,
    height: 0,
    width: 0,
    text: INVALID_SEED_STRING,
  },
]

const IN_BOUNDS_OBJECT: OcrObject[] = [
  {
    bounds: IN_BOUNDS,
    height: 0,
    width: 0,
    text: SAMPLE_SEED_STRING,
  },
]

const TOO_MANY_WORDS_OBJECT: OcrObject[] = [IN_BOUNDS_OBJECT[0], IN_BOUNDS_OBJECT[0]]

describe(extractSeedPhraseFromOCR, () => {
  it('ignores out of bounds', () => {
    expect(extractSeedPhraseFromOCR(OUT_OF_BOUNDS_OBJECT, VIEWFINDER_BOUNDS)).toBeNull()
  })

  it('scans in bounds', () => {
    expect(extractSeedPhraseFromOCR(IN_BOUNDS_OBJECT, VIEWFINDER_BOUNDS)).toEqual(SAMPLE_SEED)
  })

  it('ignores invalid seed', () => {
    expect(extractSeedPhraseFromOCR(INVALID_SEED_OBJECT, VIEWFINDER_BOUNDS)).toBeNull()
  })

  it('ignores too many words', () => {
    expect(extractSeedPhraseFromOCR(TOO_MANY_WORDS_OBJECT, VIEWFINDER_BOUNDS)).toBeNull()
  })
})
