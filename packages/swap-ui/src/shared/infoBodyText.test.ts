import { describe, expect, it } from 'vitest'
import { infoBodyTextVariant } from './infoBodyText'

describe('infoBodyTextVariant', () => {
  it('uses the small body size in the tooltip and the larger one in the modal', () => {
    expect(infoBodyTextVariant('tooltip')).toBe('body4')
    expect(infoBodyTextVariant('modal')).toBe('body2')
  })
})
