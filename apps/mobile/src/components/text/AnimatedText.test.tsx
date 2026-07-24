import React from 'react'
import { makeMutable } from 'react-native-reanimated'
import { act } from 'react-test-renderer'
import { AnimatedText } from 'src/components/text/AnimatedText'
import { renderWithProviders } from 'src/test/render'

describe(AnimatedText, () => {
  it('renders without error', () => {
    const tree = renderWithProviders(<AnimatedText text={makeMutable('Rendered')} />)

    expect(tree).toMatchSnapshot()
  })

  describe('when text is in the loading state', () => {
    it('displays text placeholder with loading shimmer when the loading property is true', async () => {
      const tree = renderWithProviders(<AnimatedText loading={true} />)

      // in jsdom the mount-time layout event has already swapped the placeholder for the shimmer
      const textPlaceholder = tree.queryByTestId('text-placeholder')
      const shimmer = await tree.findByTestId('shimmer')

      expect(textPlaceholder).toBeTruthy()
      expect(shimmer).toBeTruthy()
    })

    it('displays the loading placeholder without shimmer when the loading property has "no-shimmer" value', () => {
      const tree = renderWithProviders(<AnimatedText loading="no-shimmer" />)

      const shimmerPlaceholder = tree.queryByTestId('shimmer')
      expect(shimmerPlaceholder).toBeFalsy()

      const textPlaceholder = tree.queryByTestId('text-placeholder')
      const shimmer = tree.queryByTestId('shimmer')

      expect(textPlaceholder).toBeTruthy()
      expect(shimmer).toBeFalsy()
    })
  })

  describe('when text is not in the loading state', () => {
    it('updates text when text value is modified', async () => {
      const textValue = makeMutable('Initial')
      const tree = renderWithProviders(<AnimatedText text={textValue} />)

      // the animated text value is applied to the underlying input's defaultValue
      expect(tree.container.querySelector('input')?.defaultValue).toBe('Initial')

      textValue.value = 'Updated'

      await act(() => {
        // We must re-render the component to see the updated text
        // (updating the animated value does not trigger a re-render)
        tree.rerender(<AnimatedText text={textValue} />)
      })

      expect(tree.container.querySelector('input')?.defaultValue).toBe('Updated')
    })
  })
})
