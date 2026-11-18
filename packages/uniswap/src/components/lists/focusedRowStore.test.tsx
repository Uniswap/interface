import { isListNavKeyEvent } from 'uniswap/src/components/lists/focusedRowStore'
import { afterEach, describe, expect, it } from 'vitest'

function keyEventOn(target: EventTarget): KeyboardEvent {
  let captured: KeyboardEvent | undefined
  target.addEventListener('keyup', (event) => (captured = event as KeyboardEvent), { once: true })
  target.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }))
  return captured as KeyboardEvent
}

describe('isListNavKeyEvent', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('accepts keys from the search input and from the body', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)

    expect(isListNavKeyEvent(keyEventOn(input))).toBe(true)
    expect(isListNavKeyEvent(keyEventOn(document.body))).toBe(true)
  })

  it('leaves keys on a button or link, or inside one, to that control', () => {
    document.body.innerHTML =
      '<button id="native"></button><a id="link" href="/"></a><div id="area" role="button"><span id="inner"></span></div>'

    for (const id of ['native', 'link', 'area', 'inner']) {
      expect(isListNavKeyEvent(keyEventOn(document.getElementById(id) as HTMLElement))).toBe(false)
    }
  })
})
