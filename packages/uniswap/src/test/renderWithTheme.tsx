import { render, type RenderResult } from '@testing-library/react'
import { SharedUIUniswapProvider } from 'ui/src/test/render'

// Thin shim around `@testing-library/react`'s `render` that wires up the shared
// Tamagui provider (`SharedUIUniswapProvider`). Single source of truth for the
// test-time Tamagui config lives in `ui/src/test/render.tsx`.
export function renderWithTheme(ui: React.ReactElement): RenderResult {
  return render(ui, { wrapper: SharedUIUniswapProvider })
}
