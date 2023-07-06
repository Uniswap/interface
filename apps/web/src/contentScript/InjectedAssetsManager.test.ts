/**
 * @jest-environment jsdom
 */
import { InjectedAssetsManager } from './InjectedAssetsManager'

jest.spyOn(document.head, 'appendChild')
jest.spyOn(document.body, 'appendChild')

describe('injectScripts', () => {
  afterEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  })

  it('init non-lazy loaded scripts', () => {
    InjectedAssetsManager.init({
      'scripts1.js': { lazy: true },
      'scripts2.js': { lazy: false },
      'scripts3.js': { lazy: false },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    expect(document.head).toMatchInlineSnapshot(`
      <head>
        <script
          id="uniswap-wallet-scripts2.js"
          src="chrome/path/to/scripts2.js"
        />
        <script
          id="uniswap-wallet-scripts3.js"
          src="chrome/path/to/scripts3.js"
        />
      </head>
    `)
  })

  it('injects every script once', () => {
    InjectedAssetsManager.injectScript('script1.js', {})
    InjectedAssetsManager.injectScript('script1.js', {}) // shouldn't be added
    InjectedAssetsManager.injectScript('ethereum.js', {})

    expect(document.head).toMatchInlineSnapshot(`
      <head>
        <script
          id="uniswap-wallet-script1.js"
          src="chrome/path/to/script1.js"
        />
        <script
          id="uniswap-wallet-ethereum.js"
          src="chrome/path/to/ethereum.js"
        />
      </head>
    `)
  })
})

describe('injectIFrames', () => {
  it('injects every frame', () => {
    InjectedAssetsManager.injectFrame('index.html#/route1')
    InjectedAssetsManager.injectFrame('index.html#/route2')

    expect(document.body).toMatchInlineSnapshot(`
      <body>
        <iframe
          id="uniswap-wallet-index.html#/route1"
          src="chrome/path/to/index.html#/route1"
          style="position: absolute; bottom: 0px; right: 50px; display: block; z-index: 99999999; width: 374px; height: 600px;"
        />
        <iframe
          id="uniswap-wallet-index.html#/route2"
          src="chrome/path/to/index.html#/route2"
          style="position: absolute; bottom: 0px; right: 50px; display: block; z-index: 99999999; width: 374px; height: 600px;"
        />
      </body>
    `)
  })
})
