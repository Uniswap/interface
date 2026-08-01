// React Native-generic mocks for running RN component code under vitest/jsdom:
// gesture-handler (+ jest-utils), reanimated, moti, react-native-svg, safe-area-context,
// webview, device-info, and window.matchMedia. Package-specific mocks belong in each
// package's own vitest-setup; this module is imported from packages/ui/vitest-setup.ts,
// which every vitest suite that renders through packages/ui inherits.
import React from 'react'
import { vi } from 'vitest'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock react-native-gesture-handler
vi.mock('react-native-gesture-handler', () => ({
  PanGestureHandler: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
  TapGestureHandler: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
  FlingGestureHandler: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
  ForceTouchGestureHandler: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
  LongPressGestureHandler: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
  PinchGestureHandler: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
  RotationGestureHandler: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
  RawButton: React.forwardRef((props: any, ref) => React.createElement('button', { ...props, ref })),
  BaseButton: React.forwardRef((props: any, ref) => React.createElement('button', { ...props, ref })),
  RectButton: React.forwardRef((props: any, ref) => React.createElement('button', { ...props, ref })),
  BorderlessButton: React.forwardRef((props: any, ref) => React.createElement('button', { ...props, ref })),
  NativeViewGestureHandler: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
  TouchableWithoutFeedback: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
  TouchableHighlight: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
  TouchableOpacity: React.forwardRef((props: any, ref) => React.createElement('button', { ...props, ref })),
  TouchableNativeFeedback: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
  createNativeWrapper: vi.fn(),
  State: { UNDETERMINED: 0, FAILED: 1, BEGAN: 2, CANCELLED: 3, ACTIVE: 4, END: 5 },
  Swipeable: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
  DrawerLayout: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
  Directions: {},
  GestureHandlerRootView: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
  FlatList: React.forwardRef((props: any, ref) => {
    const { data, renderItem, ListEmptyComponent, ListHeaderComponent, ListFooterComponent, ...rest } = props
    const children = []
    if (ListHeaderComponent) {
      children.push(React.createElement(ListHeaderComponent, { key: 'header' }))
    }
    if (data?.length && renderItem) {
      data.forEach((item: any, index: number) => {
        children.push(React.createElement(React.Fragment, { key: index }, renderItem({ item, index, separators: {} })))
      })
    } else if (ListEmptyComponent) {
      children.push(
        React.isValidElement(ListEmptyComponent)
          ? React.cloneElement(ListEmptyComponent, { key: 'empty' })
          : React.createElement(ListEmptyComponent, { key: 'empty' }),
      )
    }
    if (ListFooterComponent) {
      children.push(React.createElement(ListFooterComponent, { key: 'footer' }))
    }
    return React.createElement('div', { ...rest, ref }, children)
  }),
  ScrollView: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
  Pressable: React.forwardRef((props: any, ref) => React.createElement('button', { ...props, ref })),
  GestureDetector: ({ children }: any) => children,
  Gesture: {
    Pan: () => makeChainableGesture(),
    Tap: () => makeChainableGesture(),
    Fling: () => makeChainableGesture(),
    LongPress: () => makeChainableGesture(),
    Native: () => makeChainableGesture(),
    Simultaneous: (...gestures: any[]) => gestures,
    Exclusive: (...gestures: any[]) => gestures,
    Race: (...gestures: any[]) => gestures,
  },
}))

// Minimal stand-in for react-native-gesture-handler/jest-utils that works with the recording
// gesture mock above (fires the recorded handlers through the RNGH state machine states)
vi.mock('react-native-gesture-handler/jest-utils', async () => {
  const { act } = await import('react')
  const registry = getGestureRegistry()
  const State = { UNDETERMINED: 0, FAILED: 1, BEGAN: 2, CANCELLED: 3, ACTIVE: 4, END: 5 }
  return {
    getByGestureTestId: (testId: string) => {
      const gesture = registry.get(testId)
      if (!gesture) {
        throw new Error(`No gesture with testId ${testId} was rendered`)
      }
      return gesture
    },
    fireGestureHandler: (gesture: any, eventList: Array<{ state?: number }> = []) => {
      const handlers = gesture.__config?.handlers ?? {}
      const failed = eventList.some((e) => e.state === State.FAILED)
      act(() => {
        handlers.onBegin?.({ state: State.BEGAN })
        if (!failed) {
          handlers.onStart?.({ state: State.ACTIVE })
          for (const event of eventList) {
            handlers.onUpdate?.(event)
          }
          handlers.onEnd?.({ state: State.END }, true)
          handlers.onFinalize?.({ state: State.END })
        } else {
          handlers.onFinalize?.({ state: State.FAILED })
        }
      })
    },
  }
})

// Registry shared between the Gesture mock and the jest-utils mock; lives on globalThis because
// mock factories can run while this module is still evaluating
function getGestureRegistry(): Map<string, any> {
  const g = globalThis as any
  g.__rnghGestureRegistry = g.__rnghGestureRegistry ?? new Map()
  return g.__rnghGestureRegistry
}

// Chainable gesture builder that records handlers/testIds so jest-utils can fire them
function makeChainableGesture(): any {
  const config: { testId?: string; handlers: Record<string, (...args: any[]) => unknown> } = { handlers: {} }
  const handlerNames = new Set([
    'onBegin',
    'onStart',
    'onEnd',
    'onFinalize',
    'onUpdate',
    'onChange',
    'onTouchesDown',
    'onTouchesMove',
    'onTouchesUp',
    'onTouchesCancelled',
  ])
  const builder: any = new Proxy(
    { __config: config },
    {
      get: (target: any, prop: string) => {
        if (prop in target) {
          return target[prop]
        }
        if (prop === 'toGestureArray') {
          return () => [builder]
        }
        if (prop === 'withTestId') {
          return (id: string) => {
            config.testId = id
            getGestureRegistry().set(id, builder)
            return builder
          }
        }
        if (handlerNames.has(prop)) {
          return (fn: (...args: any[]) => unknown) => {
            config.handlers[prop] = fn
            return builder
          }
        }
        return (..._args: any[]) => builder
      },
    },
  )
  return builder
}

// Mock the internal RNGestureHandlerModule paths that RNGH's Jest setup was mocking
vi.mock('react-native-gesture-handler/src/RNGestureHandlerModule', () => ({}))
vi.mock('react-native-gesture-handler/lib/commonjs/RNGestureHandlerModule', () => ({}))
vi.mock('react-native-gesture-handler/lib/module/RNGestureHandlerModule', () => ({}))

// Mock react-native-safe-area-context
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: vi.fn().mockImplementation(() => ({})),
  useSafeAreaFrame: vi.fn().mockImplementation(() => ({})),
  SafeAreaProvider: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
}))

// Mock react-native-webview
vi.mock('react-native-webview', () => ({
  WebView: React.forwardRef((props: any, ref) => React.createElement('iframe', { ...props, ref })),
}))

// Mock moti (used by tamagui animations)
vi.mock('moti', () => ({
  View: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
  Text: React.forwardRef((props: any, ref) => React.createElement('span', { ...props, ref })),
  ScrollView: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
  SafeAreaView: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
  useDynamicAnimation: vi.fn(),
  useAnimationState: vi.fn(),
  AnimatePresence: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
}))

// Mock moti/author specifically to fix ES module import issue
vi.mock('moti/author', () => ({}))

// Mock @tamagui/animations-moti
vi.mock('@tamagui/animations-moti', () => ({
  createAnimations: vi.fn(() => ({})),
}))

// Chainable no-op layout-animation builder (FadeIn.duration(...).delay(...) etc.)
function makeMockLayoutAnimation(): any {
  const builder: any = {}
  const chain = () => builder
  for (const m of ['duration', 'delay', 'springify', 'damping', 'stiffness', 'easing', 'withInitialValues', 'build']) {
    builder[m] = chain
  }
  return builder
}

// Reactive shared-value stand-ins for the reanimated mock: reads are tracked while a reaction's
// prepare runs, and writes notify subscribed reactions (globalThis because vi.mock factories can
// run while this module is still evaluating)
function getReanimatedTracking(): { collector: Set<Set<() => void>> | null } {
  const g = globalThis as any
  g.__reanimatedTracking = g.__reanimatedTracking ?? { collector: null }
  return g.__reanimatedTracking
}

function makeReactiveSharedValue(initial: any): { value: any } {
  let current = initial
  const listeners = new Set<() => void>()
  return {
    get value() {
      getReanimatedTracking().collector?.add(listeners)
      return current
    },
    set value(next) {
      current = next
      for (const listener of Array.from(listeners)) {
        listener()
      }
    },
  }
}

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => {
  // host components need testID translated to data-testid (React drops unknown testID attrs)
  const makeAnimatedHost = (tag: string, displayName: string): any => {
    const Host = React.forwardRef((props: any, ref: any) => {
      const { testID, 'data-testid': dataTestId, ...rest } = props
      const id = testID ?? dataTestId
      return React.createElement(tag, { ...rest, ...(id === undefined ? {} : { 'data-testid': id }), ref })
    })
    Host.displayName = displayName
    return Host
  }
  const MockAnimatedView = makeAnimatedHost('div', 'Animated.View')

  const styleCache = new Map()

  // Mock createAnimatedComponent to return a simple component wrapper
  const createAnimatedComponent = (Component: any) => {
    const AnimatedComponent = React.forwardRef((props: any, ref: any) => {
      // Tamagui's web build converts testID to data-testid, which react-native-web drops on
      // native primitives like TextInput; pass both spellings so DOM components keep the
      // attribute and RNW primitives map testID themselves
      const testId = props.testID ?? props['data-testid']
      // DOM tags only understand data-testid; component types (RNW/Tamagui) consume testID
      const extra =
        testId === undefined ? {} : typeof Component === 'string' ? { 'data-testid': testId } : { testID: testId }
      // apply animatedProps directly (real reanimated pushes them to the native component)
      const { animatedProps, ...restProps } = props
      const applied = typeof animatedProps === 'object' && animatedProps !== null ? animatedProps : {}
      return React.createElement(Component, { ...restProps, ...applied, ...extra, ref })
    })
    AnimatedComponent.displayName = `Animated(${Component.displayName || Component.name || 'Component'})`
    return AnimatedComponent
  }

  const MockAnimatedFlatList = React.forwardRef((props: any, ref: any) => {
    const { data, renderItem, ListHeaderComponent, ListFooterComponent, ...rest } = props
    const children: any[] = []
    if (ListHeaderComponent) {
      children.push(
        React.isValidElement(ListHeaderComponent)
          ? React.cloneElement(ListHeaderComponent, { key: 'header' })
          : React.createElement(ListHeaderComponent, { key: 'header' }),
      )
    }
    if (data && renderItem) {
      data.forEach((item: any, index: number) => {
        children.push(React.createElement(React.Fragment, { key: index }, renderItem({ item, index, separators: {} })))
      })
    }
    if (ListFooterComponent) {
      children.push(
        React.isValidElement(ListFooterComponent)
          ? React.cloneElement(ListFooterComponent, { key: 'footer' })
          : React.createElement(ListFooterComponent, { key: 'footer' }),
      )
    }
    return React.createElement('div', { ...rest, ref }, children)
  })
  MockAnimatedFlatList.displayName = 'Animated.FlatList'

  const AnimatedDefault = Object.assign(MockAnimatedView, {
    createAnimatedComponent,
    addWhitelistedNativeProps: vi.fn(),
    addWhitelistedUIProps: vi.fn(),
    FlatList: MockAnimatedFlatList,
    View: MockAnimatedView,
    Text: makeAnimatedHost('span', 'Animated.Text'),
    ScrollView: makeAnimatedHost('div', 'Animated.ScrollView'),
    Image: makeAnimatedHost('img', 'Animated.Image'),
  })

  return {
    default: AnimatedDefault,
    createAnimatedComponent,
    // stable across renders, like real reanimated shared values
    useSharedValue: vi.fn((initial) => React.useState(() => makeReactiveSharedValue(initial))[0]),
    useAnimatedStyle: vi.fn((callback) => {
      const key = callback?.toString() || 'default'
      if (!styleCache.has(key)) {
        styleCache.set(key, callback?.() || {})
      }
      return styleCache.get(key)
    }),
    withTiming: vi.fn((toValue) => toValue),
    withSpring: vi.fn((toValue) => toValue),
    withSequence: vi.fn((...values) => values[values.length - 1]),
    withRepeat: vi.fn((animation) => animation),
    withDelay: vi.fn((_, animation) => animation),
    runOnJS: vi.fn((fn) => fn),
    runOnUI: vi.fn((fn) => fn),
    makeMutable: vi.fn((initial) => makeReactiveSharedValue(initial)),
    cancelAnimation: vi.fn(),
    useAnimatedProps: vi.fn((callback) => callback?.() || {}),
    useAnimatedRef: vi.fn(() => ({ current: null })),
    useAnimatedScrollHandler: vi.fn(() => vi.fn()),
    configureReanimatedLogger: vi.fn(),
    ReanimatedLogLevel: { warn: 1, error: 2 },
    FadeIn: makeMockLayoutAnimation(),
    FadeInDown: makeMockLayoutAnimation(),
    FadeOut: makeMockLayoutAnimation(),
    FadeOutDown: makeMockLayoutAnimation(),
    FadeOutUp: makeMockLayoutAnimation(),
    RotateInUpLeft: makeMockLayoutAnimation(),
    LinearTransition: makeMockLayoutAnimation(),
    Extrapolate: {
      EXTEND: 'extend',
      CLAMP: 'clamp',
      IDENTITY: 'identity',
    },
    // stable object whose lazy getter always runs the latest worklet, mirroring reanimated's
    // reactive recomputation across re-renders
    useDerivedValue: vi.fn((callback) => {
      const ref = React.useRef(callback)
      ref.current = callback
      return React.useState(() => ({
        get value() {
          return ref.current?.()
        },
      }))[0]
    }),
    useAnimatedGestureHandler: vi.fn(() => ({})),
    // dependency-tracked reactions: prepare's shared-value reads are recorded and the reaction
    // re-runs synchronously when any of them is written, like real reanimated
    useAnimatedReaction: vi.fn((prepare: any, react: any) => {
      const stateRef = React.useRef<{ prev: any; initialized: boolean }>({ prev: undefined, initialized: false })
      const fnsRef = React.useRef({ prepare, react })
      fnsRef.current = { prepare, react }
      React.useEffect(() => {
        let disposed = false
        const run = (): void => {
          if (disposed) {
            return
          }
          const tracking = getReanimatedTracking()
          const deps = new Set<Set<() => void>>()
          tracking.collector = deps
          let current: unknown
          try {
            current = fnsRef.current.prepare?.()
          } finally {
            tracking.collector = null
          }
          for (const listenerSet of deps) {
            listenerSet.add(run)
          }
          const state = stateRef.current
          if (!state.initialized) {
            state.initialized = true
            state.prev = current
            fnsRef.current.react?.(current, null)
          } else if (current !== state.prev) {
            const previous = state.prev
            state.prev = current
            fnsRef.current.react?.(current, previous)
          }
        }
        run()
        return () => {
          disposed = true
        }
      }, [])
    }),
    useWorkletCallback: vi.fn((callback) => callback),
    createAnimatedPropAdapter: vi.fn(),
    interpolate: vi.fn(),
    interpolateColor: vi.fn(),
    Extrapolation: {
      EXTEND: 'extend',
      CLAMP: 'clamp',
      IDENTITY: 'identity',
    },
    Easing: {
      linear: vi.fn(),
      ease: vi.fn(),
      quad: vi.fn(),
      cubic: vi.fn(),
      poly: vi.fn(),
      sin: vi.fn(),
      circle: vi.fn(),
      exp: vi.fn(),
      elastic: vi.fn(),
      back: vi.fn(),
      bounce: vi.fn(),
      bezier: vi.fn(),
      in: vi.fn(),
      out: vi.fn(),
      inOut: vi.fn(),
    },
  }
})

// Mock react-native-svg
vi.mock('react-native-svg', () => {
  const createMockSvgComponent = (name: string) => {
    const component = React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref }))
    component.displayName = name
    return component
  }

  return {
    default: createMockSvgComponent('Svg'),
    Svg: createMockSvgComponent('Svg'),
    Circle: createMockSvgComponent('Circle'),
    Ellipse: createMockSvgComponent('Ellipse'),
    G: createMockSvgComponent('G'),
    Text: createMockSvgComponent('Text'),
    TSpan: createMockSvgComponent('TSpan'),
    TextPath: createMockSvgComponent('TextPath'),
    Path: createMockSvgComponent('Path'),
    Polygon: createMockSvgComponent('Polygon'),
    Polyline: createMockSvgComponent('Polyline'),
    Line: createMockSvgComponent('Line'),
    Rect: createMockSvgComponent('Rect'),
    Use: createMockSvgComponent('Use'),
    Image: createMockSvgComponent('Image'),
    Symbol: createMockSvgComponent('Symbol'),
    Defs: createMockSvgComponent('Defs'),
    LinearGradient: createMockSvgComponent('LinearGradient'),
    RadialGradient: createMockSvgComponent('RadialGradient'),
    Stop: createMockSvgComponent('Stop'),
    ClipPath: createMockSvgComponent('ClipPath'),
    Pattern: createMockSvgComponent('Pattern'),
    Mask: createMockSvgComponent('Mask'),
    Marker: createMockSvgComponent('Marker'),
    ForeignObject: createMockSvgComponent('ForeignObject'),
  }
})

// Mock react-native-device-info
vi.mock('react-native-device-info', () => ({
  getUniqueId: vi.fn(() => Promise.resolve('test-unique-id')),
  getUniqueIdSync: vi.fn(() => 'test-unique-id'),
  default: {
    getUniqueId: vi.fn(() => Promise.resolve('test-unique-id')),
    getUniqueIdSync: vi.fn(() => 'test-unique-id'),
    getBundleId: vi.fn(() => 'com.test.bundle'),
    getVersion: vi.fn(() => '1.0.0'),
    getBuildNumber: vi.fn(() => '1'),
    getDeviceId: vi.fn(() => 'test-device-id'),
    getSystemName: vi.fn(() => 'iOS'),
    getSystemVersion: vi.fn(() => '14.0'),
    getBrand: vi.fn(() => 'Apple'),
    getModel: vi.fn(() => 'iPhone'),
    isEmulator: vi.fn(() => false),
    isTablet: vi.fn(() => false),
  },
}))
