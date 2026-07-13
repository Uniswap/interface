import { renderHook } from '@testing-library/react'
import { useInjectSingleStylesheet } from 'utilities/src/react/useInjectSingleStylesheet.web'

const CSS_RULE_ID = '__test_keyframes__'
const KEYFRAMES_CSS = '@keyframes test { from { opacity: 0; } to { opacity: 1; } }'

describe('useInjectSingleStylesheet', () => {
  afterEach(() => {
    document.getElementById(CSS_RULE_ID)?.remove()
  })

  it('should inject stylesheet when active', () => {
    renderHook(() => useInjectSingleStylesheet({ id: CSS_RULE_ID, css: KEYFRAMES_CSS }))

    const style = document.getElementById(CSS_RULE_ID)
    expect(style?.tagName).toBe('STYLE')
    expect(style?.textContent).toBe(KEYFRAMES_CSS)
  })

  it('should not inject when inactive', () => {
    renderHook(() => useInjectSingleStylesheet({ id: CSS_RULE_ID, css: KEYFRAMES_CSS, active: false }))

    expect(document.getElementById(CSS_RULE_ID)).toBeNull()
  })

  it('should inject only once for the same id', () => {
    renderHook(() => useInjectSingleStylesheet({ id: CSS_RULE_ID, css: KEYFRAMES_CSS }))
    renderHook(() => useInjectSingleStylesheet({ id: CSS_RULE_ID, css: KEYFRAMES_CSS }))

    expect(document.querySelectorAll(`#${CSS_RULE_ID}`)).toHaveLength(1)
  })

  it('should inject when active becomes true', () => {
    const { rerender } = renderHook(
      ({ active }) => useInjectSingleStylesheet({ id: CSS_RULE_ID, css: KEYFRAMES_CSS, active }),
      { initialProps: { active: false } },
    )

    expect(document.getElementById(CSS_RULE_ID)).toBeNull()

    rerender({ active: true })

    expect(document.getElementById(CSS_RULE_ID)?.textContent).toBe(KEYFRAMES_CSS)
  })
})
