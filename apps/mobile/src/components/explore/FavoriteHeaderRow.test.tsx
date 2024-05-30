import { fireEvent, render } from 'src/test/test-utils'
import { ON_PRESS_EVENT_PAYLOAD } from 'wallet/src/test/fixtures'
import { FavoriteHeaderRow } from './FavoriteHeaderRow'

const defaultProps = {
  title: 'Title',
  editingTitle: 'Editing Title',
  isEditing: false,
  onPress: jest.fn(),
}

describe(FavoriteHeaderRow, () => {
  describe('when not editing', () => {
    it('renders without error', () => {
      const tree = render(<FavoriteHeaderRow {...defaultProps} />)

      expect(tree.toJSON()).toMatchSnapshot()
    })

    it('renders title', () => {
      const { queryByText } = render(<FavoriteHeaderRow {...defaultProps} />)

      expect(queryByText(defaultProps.title)).toBeTruthy()
      expect(queryByText(defaultProps.editingTitle)).toBeFalsy()
    })

    it('renders favorite button', () => {
      const { queryByTestId } = render(<FavoriteHeaderRow {...defaultProps} />)

      const favoriteButton = queryByTestId('favorite-header-row/favorite-button')
      const doneButton = queryByTestId('favorite-header-row/done-button')

      expect(favoriteButton).toBeTruthy()
      expect(doneButton).toBeFalsy()
    })

    it('calls onPress when favorite icon pressed', () => {
      const { getByTestId } = render(<FavoriteHeaderRow {...defaultProps} />)

      const favoriteButton = getByTestId('favorite-header-row/favorite-button')
      fireEvent.press(favoriteButton, ON_PRESS_EVENT_PAYLOAD)

      expect(defaultProps.onPress).toHaveBeenCalledTimes(1)
    })
  })

  describe('when editing', () => {
    it('renders without error', () => {
      const tree = render(<FavoriteHeaderRow {...defaultProps} isEditing />)

      expect(tree.toJSON()).toMatchSnapshot()
    })

    it('renders editingTitle', () => {
      const { queryByText } = render(<FavoriteHeaderRow {...defaultProps} isEditing />)

      expect(queryByText(defaultProps.editingTitle)).toBeTruthy()
      expect(queryByText(defaultProps.title)).toBeFalsy()
    })

    it('renders done button', () => {
      const { queryByTestId } = render(<FavoriteHeaderRow {...defaultProps} isEditing />)

      const favoriteButton = queryByTestId('favorite-header-row/favorite-button')
      const doneButton = queryByTestId('favorite-header-row/done-button')

      expect(favoriteButton).toBeFalsy()
      expect(doneButton).toBeTruthy()
    })

    it('calls onPress when done button pressed', () => {
      const { getByTestId } = render(<FavoriteHeaderRow {...defaultProps} isEditing />)

      const doneButton = getByTestId('favorite-header-row/done-button')
      fireEvent.press(doneButton, ON_PRESS_EVENT_PAYLOAD)

      expect(defaultProps.onPress).toHaveBeenCalledTimes(1)
    })
  })
})
