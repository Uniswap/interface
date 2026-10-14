import { Text } from '@universe/mycelium'
import { Pill } from 'uniswap/src/components/pill/Pill'
import { render, screen } from 'uniswap/src/test/test-utils'

it('renders a Pill without image', () => {
  const tree = render(<Pill backgroundColor="$surface2" foregroundColor="#000" label="My Pill Label" />)
  expect(tree).toMatchSnapshot()
})

it('renders a Pill with border', () => {
  const tree = render(<Pill borderColor="$statusSuccess" icon={<Text>Icon</Text>} label="My Second Pill Label" />)
  expect(tree).toMatchSnapshot()
})

it('keeps a long label on one line when the pill has a width floor', () => {
  // Mirrors the "A simplified address" pill: a 13-character shortened address in a pill whose
  // content box is only a few px wider than the string.
  const label = '0x4Dc5...C7De'
  render(<Pill label={label} minWidth={128} px="$spacing12" textVariant="buttonLabel3" />)

  // numberOfLines={1} compiles to the single-line ellipsis class set on this (web) lane; nowrap
  // is the part that stops the last character dropping to a second line.
  const classes = (screen.getByText(label) as unknown as HTMLElement).className.split(/\s+/)
  expect(classes).toContain('whitespace-nowrap')
  expect(classes).not.toContain('whitespace-pre-wrap')
})
