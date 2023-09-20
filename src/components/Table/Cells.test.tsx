import { screen } from '@testing-library/react'
import { render } from 'test-utils/render'

import { LinkCell, TextCell } from './Cells'

describe('TextCell', () => {
  it('displays a simple text cell', () => {
    render(<TextCell>Uniswap</TextCell>)

    const cell = screen.getByText('Uniswap').parentElement || new HTMLDivElement()

    expect(cell).toBeInTheDocument()
    expect(cell).toHaveStyleRule('justify-content', 'right')
  })

  it('can justify content', () => {
    render(<TextCell justifyContent="left">Uniswap</TextCell>)

    const cell = screen.getByText('Uniswap').parentElement || new HTMLDivElement()

    expect(cell).toBeInTheDocument()
    expect(cell).toHaveStyleRule('justify-content', 'left')
  })

  it('can color text', () => {
    render(<TextCell color="green">Uniswap</TextCell>)

    const cell = screen.getByText('Uniswap').parentElement || new HTMLDivElement()

    expect(cell).toBeInTheDocument()
    expect(cell).toHaveStyleRule('color', 'green')
  })
})

describe('LinkCell', () => {
  it('displays an external link cell', () => {
    render(<LinkCell url="https://app.uniswap.org">Uniswap</LinkCell>)

    expect(screen.getByText('Uniswap')).toHaveAttribute('href', 'https://app.uniswap.org')
    expect(screen.getByText('Uniswap')).toBeInTheDocument()
  })
})
