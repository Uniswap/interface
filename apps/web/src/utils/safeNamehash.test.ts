import { namehash } from '@ethersproject/hash'
import { safeNamehash } from 'utils/safeNamehash'

describe('safeNamehash', () => {
  const emoji = '🙂'
  const textname = 'textname'
  const zeroWidthJoiner = '‍'

  it('namehash works on text', () => {
    expect(namehash(textname)).toEqual('0xdf9f9b4fcb3ade7e9511f102ef22522bdd82ea57c5e03ce4acb63f1bf78befc6')
  })

  it('namehash works on emoji', () => {
    expect(namehash(emoji)).toEqual('0x2d241026bcc4bd7e3be134b85d4a4e2baa61e1a682492f40361ba92aee2bf82e')
  })

  // suppress console.debug for the next test
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  it('namehash does not work', () => {
    expect(() => namehash(zeroWidthJoiner)).toThrow()
  })

  it('safenamehash works', () => {
    expect(safeNamehash(zeroWidthJoiner)).toEqual(undefined)
  })
})
