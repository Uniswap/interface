import type { BarPrice, DeepPartial, IChartApi, ISeriesApi, TimeChartOptions } from 'lightweight-charts'
import { createChart } from 'lightweight-charts'
import { ChartModel, ChartModelParams } from '~/components/Charts/ChartModelCore'
import { SeriesDataItemType } from '~/components/Charts/types'

const { mockApplyOptions } = vi.hoisted(() => ({ mockApplyOptions: vi.fn() }))

// Real createChart by default so the sizing suite mounts an actual chart; the updateOptions suite stubs it.
vi.mock('lightweight-charts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lightweight-charts')>()
  return { ...actual, createChart: vi.fn(actual.createChart) }
})

class TestChartModel extends ChartModel<SeriesDataItemType> {
  protected series = {} as ISeriesApi<'Area'>
}

const params = {
  locale: 'es-ES',
  colors: { neutral2: { val: '#000000' }, surface3: { val: '#000000' } },
  format: { convertFiatAmountFormatted: (value: number) => String(value) },
  isLargeScreen: true,
  data: [],
} as unknown as ChartModelParams<SeriesDataItemType>

describe('ChartModel.updateOptions', () => {
  beforeEach(() => {
    mockApplyOptions.mockClear()
    vi.mocked(createChart).mockReturnValue({
      applyOptions: mockApplyOptions,
      subscribeCrosshairMove: vi.fn(),
    } as unknown as IChartApi)
  })

  afterEach(() => {
    // vitest 3: mockReset restores the vi.fn's original (real) implementation.
    vi.mocked(createChart).mockReset()
  })

  it('applies the app locale by default', () => {
    new TestChartModel(document.createElement('div'), params).updateOptions(params)

    expect(mockApplyOptions).toHaveBeenCalledTimes(1)
    expect(mockApplyOptions.mock.lastCall?.[0].localization.locale).toBe('es-ES')
  })

  it('keeps the app locale when a subclass overrides other localization options (LP-266)', () => {
    const priceFormatter = (price: BarPrice): string => String(price)
    const nonDefaultOptions: DeepPartial<TimeChartOptions> = { localization: { priceFormatter } }

    new TestChartModel(document.createElement('div'), params).updateOptions(params, nonDefaultOptions)

    const applied = mockApplyOptions.mock.lastCall?.[0]
    expect(applied.localization.locale).toBe('es-ES')
    expect(applied.localization.priceFormatter).toBe(priceFormatter)
  })
})

/** A 2D context whose drawing calls are no-ops: jsdom has no canvas implementation. */
function createNoopCanvasContext(): CanvasRenderingContext2D {
  const state: Record<PropertyKey, unknown> = {}
  return new Proxy(state, {
    get: (target, prop) => {
      if (prop in target) {
        return target[prop]
      }
      if (prop === 'measureText') {
        return () => ({ width: 0, actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0 })
      }
      return () => undefined
    },
    set: (target, prop, value) => {
      target[prop] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
}

type ResizeCallback = (entries: Array<{ contentRect: { width: number; height: number } }>) => void

function createContainer({ width, height }: { width: number; height: number }): HTMLDivElement {
  const container = document.createElement('div')
  container.getBoundingClientRect = () => ({ width, height }) as DOMRect
  document.body.appendChild(container)
  return container
}

describe('ChartModel sizing', () => {
  let resizeCallbacks: ResizeCallback[]
  let models: TestChartModel[]

  beforeEach(() => {
    resizeCallbacks = []
    models = []
    // jsdom can't paint, so keep lightweight-charts' deferred redraws from running.
    vi.stubGlobal('requestAnimationFrame', () => 0)
    vi.stubGlobal('cancelAnimationFrame', () => undefined)
    // fancy-canvas tracks devicePixelRatio through the legacy MediaQueryList listener API.
    vi.stubGlobal('matchMedia', () => ({ matches: false, addListener: vi.fn(), removeListener: vi.fn() }))
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => createNoopCanvasContext() as unknown as ReturnType<HTMLCanvasElement['getContext']>,
    )
    // lightweight-charts resolves colors through getComputedStyle, which jsdom leaves unresolved;
    // jsdom does normalize inline `style.color` to rgb(), so read it from there.
    // setupTests already mocks getComputedStyle, and spying on a mock returns that same mock.
    const getComputedStyle =
      vi.mocked(window.getComputedStyle).getMockImplementation() ??
      ((): CSSStyleDeclaration => new CSSStyleDeclaration())
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudoElement) => {
      const computed = getComputedStyle(element, pseudoElement)
      const inlineColor = element instanceof HTMLElement ? element.style.color : ''
      return inlineColor ? ({ ...computed, color: inlineColor } as CSSStyleDeclaration) : computed
    })
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeCallback) {
          resizeCallbacks.push(callback)
        }
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      },
    )
  })

  afterEach(() => {
    models.forEach((model) => model.remove())
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  function createModel(container: HTMLDivElement): TestChartModel {
    const model = new TestChartModel(container, params)
    model.updateOptions(params)
    models.push(model)
    return model
  }

  function getChartRoot(container: HTMLDivElement): HTMLElement {
    const root = container.querySelector<HTMLElement>(':scope > .tv-lightweight-charts')
    if (!root) {
      throw new Error('lightweight-charts root element was not mounted')
    }
    return root
  }

  it('keeps the clipping root fluid instead of pinning it to the initial pixel width', () => {
    const container = createContainer({ width: 600, height: 300 })

    createModel(container)

    const root = getChartRoot(container)
    expect(root.style.overflow).toBe('hidden')
    expect(root.style.width).toBe('100%')
    expect(root.style.height).toBe('100%')
  })

  it('lets the drawn chart grow past its initial width when the container widens', () => {
    const container = createContainer({ width: 600, height: 300 })
    createModel(container)
    const root = getChartRoot(container)
    const table = root.querySelector('table')

    expect(resizeCallbacks.length).toBeGreaterThan(0)
    resizeCallbacks.forEach((callback) => callback([{ contentRect: { width: 1000, height: 300 } }]))

    expect(table?.style.width).toBe('1000px')
    // The root clips its overflow, so it must track the container rather than keep the 600px it mounted at.
    expect(root.style.width).toBe('100%')
  })

  it('still sizes the chart to the container on mount', () => {
    const container = createContainer({ width: 640, height: 320 })

    createModel(container)

    const table = getChartRoot(container).querySelector('table')
    expect(table?.style.width).toBe('640px')
    expect(table?.style.height).toBe('320px')
  })
})
