/**
 * @jest-environment jsdom
 */
import { InjectedAssetsManager } from './InjectedAssetsManager'

jest.spyOn(document.head, 'appendChild')
jest.spyOn(document.body, 'appendChild')

describe(InjectedAssetsManager, () => {
  describe('injectScripts', () => {
    it('injects every script', () => {
      const manager = new InjectedAssetsManager()
      const scripts = { 'script1.js': {}, 'script2.js': {} }

      manager.injectScripts(scripts)

      expect(document.head).toMatchInlineSnapshot(`
        <head>
          <script
            id="uniswap-wallet-script1.js"
            src="chrome/path/to/script1.js"
          />
          <script
            id="uniswap-wallet-script2.js"
            src="chrome/path/to/script2.js"
          />
        </head>
      `)
    })
  })

  describe('injectIFrames', () => {
    it('injects every frame', () => {
      const manager = new InjectedAssetsManager()
      const iframes = { route1: {}, route2: {} }

      manager.injectIFrames(iframes)

      expect(document.body).toMatchInlineSnapshot(`
        <body>
          <iframe
            id="uniswap-wallet-route1"
            src="chrome/path/to/route1"
            style="position: absolute; bottom: 0px; right: 0px; display: block;"
          />
          <iframe
            id="uniswap-wallet-route2"
            src="chrome/path/to/route2"
            style="position: absolute; bottom: 0px; right: 0px; display: block;"
          />
        </body>
      `)
    })
  })
})
