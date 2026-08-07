import * as React from 'react'
import { vi } from 'vitest'

// Tamagui reads matchMedia at module scope; jsdom doesn't implement it.
// Mirrors packages/ui/vitest-setup.ts.
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

// Mock expo-blur: its native BlurView module calls requireNativeViewManager at
// module scope, which throws under web/jsdom. Mirrors the expo-blur mock used
// by packages/ui's storybook config; these tests never render a BlurView.
vi.mock('expo-blur', () => ({
  BlurView: React.forwardRef((props: Record<string, unknown>, ref) => React.createElement('div', { ...props, ref })),
}))

// Mock react-native-svg: its `react-native` entry points at raw TypeScript
// source that Node cannot parse. Mirrors packages/ui/vitest-setup.ts — these
// tests only render Flex, so icon internals are irrelevant.
vi.mock('react-native-svg', () => {
  const createMockSvgComponent = (name: string): unknown => {
    const component = React.forwardRef((props: Record<string, unknown>, ref) =>
      React.createElement('div', { ...props, ref }),
    )
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
