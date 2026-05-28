import { uuid } from 'utilities/src/primitives/uuid'

describe('uuid', () => {
  it('returns a canonical RFC 4122 v4 UUID string', () => {
    const id = uuid()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it('returns a unique value on each call', () => {
    const a = uuid()
    const b = uuid()
    expect(a).not.toBe(b)
  })
})
