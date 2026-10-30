import { UniverseChainId } from '@universe/chains'
import { COLLAPSE_PROGRESS_VAR, COLLAPSE_TEXT_VISIBILITY_VAR } from '~/components/Table/PinnedColumns/collapse/utils'
import { ChainTokenDisplay, TokenDisplay } from '~/pages/Portfolio/Tokens/Table/columns/TokenDisplay'
import { TEST_TOKEN_1_INFO } from '~/test-utils/constants'
import { render, screen } from '~/test-utils/render'

/** The text block of a `CollapsibleCellLayout`, hidden once the collapse has faded it (jsdom drops the calc() opacity). */
function getFadingTextBlock(text: string): HTMLElement | null {
  return screen.getByText(text).closest(`[style*="${COLLAPSE_TEXT_VISIBILITY_VAR}"]`)
}

describe('TokenDisplay', () => {
  it('hides the name and symbol with the pinned column collapse, keeping the 8px logo gap', () => {
    render(<TokenDisplay currencyInfo={TEST_TOKEN_1_INFO} displayName="Test Token" displaySymbol="TT" />)

    const textBlock = getFadingTextBlock('Test Token')
    expect(textBlock).toContainElement(screen.getByText('TT'))
    expect(textBlock?.parentElement?.style.columnGap).toBe(`calc((1 - var(${COLLAPSE_PROGRESS_VAR}, 0)) * 8px)`)
  })
})

describe('ChainTokenDisplay', () => {
  it('hides the chain label with the pinned column collapse, leaving the network logo', () => {
    render(<ChainTokenDisplay chainId={UniverseChainId.ArbitrumOne} showDetailsArrow={false} />)

    const textBlock = getFadingTextBlock('Arbitrum')
    expect(textBlock).not.toBeNull()
    expect(textBlock).not.toContainElement(screen.getByTestId(`network-logo-${UniverseChainId.ArbitrumOne}`))
  })
})
