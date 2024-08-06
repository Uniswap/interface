import { KeyboardKey } from 'src/app/features/onboarding/KeyboardKey'
import { State } from 'src/app/hooks/useOpeningKeyboardShortCut'
import { cleanup, render, screen } from 'src/test/test-utils'

describe('KeyboardKey Component', () => {
  it('renders correctly with state KeyUp', () => {
    const { container } = render(<KeyboardKey fontSize={28} px="$spacing28" state={State.KeyUp} title="Shift" />)
    expect(container).toMatchSnapshot()
  })

  it('renders correctly with state KeyDown', () => {
    const { container } = render(<KeyboardKey fontSize={28} px="$spacing28" state={State.KeyDown} title="Shift" />)
    expect(container).toMatchSnapshot()
  })

  it('renders correctly with state Highlighted', () => {
    const { container } = render(<KeyboardKey fontSize={28} px="$spacing28" state={State.Highlighted} title="Shift" />)
    expect(container).toMatchSnapshot()
    cleanup()
  })

  it('displays the command symbol for Meta key on macOS', () => {
    render(<KeyboardKey fontSize={41} px="$spacing16" state={State.KeyUp} title="Meta" />)
    expect(screen.getByText('⌘')).toBeDefined()
    cleanup()
  })

  it('displays the correct title for other keys', () => {
    render(<KeyboardKey fontSize={41} px="$spacing20" state={State.KeyUp} title="U" />)
    expect(screen.getByText('U')).toBeDefined()
    cleanup()
  })
})
