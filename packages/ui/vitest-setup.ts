/** biome-ignore-all lint/suspicious/noExplicitAny: need to use any for test setup */
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
  Swipeable: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
  DrawerLayout: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
  State: {},
  Directions: {},
  GestureHandlerRootView: React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref })),
}))

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

// Mock ui/src/assets
vi.mock('ui/src/assets', () => {
  const assets = vi.importActual('ui/src/assets')
  const mockedAssets: Record<string, string> = {}

  if (assets && assets !== null && assets !== undefined) {
    Object.keys(assets as unknown as Record<string, unknown>).forEach((key) => {
      mockedAssets[key] = `mock-asset-${key}.png`
    })
  }

  return mockedAssets
})

// Mock react-native-webview
vi.mock('react-native-webview', () => ({
  WebView: React.forwardRef((props: any, ref) => React.createElement('iframe', { ...props, ref })),
}))

// Mock useDeviceInsets to use web version
vi.mock('ui/src/hooks/useDeviceInsets', () => vi.importActual('ui/src/hooks/useDeviceInsets.web.ts'))

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

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => {
  const MockAnimatedView = React.forwardRef((props: any, ref) => React.createElement('div', { ...props, ref }))
  MockAnimatedView.displayName = 'Animated.View'

  const styleCache = new Map()

  return {
    default: MockAnimatedView,
    useSharedValue: vi.fn((initial) => ({ value: initial })),
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
    useDerivedValue: vi.fn((callback) => ({ value: callback?.() })),
    useAnimatedGestureHandler: vi.fn(() => ({})),
    useAnimatedReaction: vi.fn(),
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
  default: {
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
