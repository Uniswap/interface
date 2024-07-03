import { Flex } from 'ui/src'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { fireEvent, render } from 'uniswap/src/test/test-utils'

describe(BaseCard.Shadow, () => {
  it('renders without error', () => {
    const tree = render(<BaseCard.Shadow />)
    expect(tree).toMatchSnapshot()
  })
  describe('backgroundColor', () => {
    it('renders with backgroundColor when backgroundColor is passed', () => {
      const tree = render(<BaseCard.Shadow backgroundColor="red" />)
      expect(tree).toMatchSnapshot()
    })
  })
})

describe(BaseCard.Header, () => {
  const title = 'title'
  const subtitle = 'subtitle'

  it('renders without error', () => {
    const tree = render(<BaseCard.Header title={title} />)

    expect(tree).toMatchSnapshot()
  })

  describe('title', () => {
    it('renders title text if string is passed', async () => {
      const { queryByText } = render(<BaseCard.Header title={title} />)

      expect(queryByText(title)).toBeTruthy()
    })

    it('renders custom title component if component is passed', () => {
      const { queryByTestId } = render(<BaseCard.Header title={<Flex testID="custom-title" />} />)

      expect(queryByTestId('custom-title')).toBeTruthy()
    })
  })

  describe('subtitle', () => {
    it('renders subtitle text if string is passed', () => {
      const { queryByText } = render(<BaseCard.Header subtitle={subtitle} title={title} />)

      expect(queryByText(subtitle)).toBeTruthy()
    })

    it('renders custom subtitle component if component is passed', () => {
      const { queryByTestId } = render(<BaseCard.Header subtitle={<Flex testID="custom-subtitle" />} title={title} />)

      expect(queryByTestId('custom-subtitle')).toBeTruthy()
    })
  })

  describe('icon', () => {
    it('renders icon if icon is passed', () => {
      const { queryByTestId } = render(<BaseCard.Header icon={<Flex testID="custom-icon" />} title={title} />)

      expect(queryByTestId('custom-icon')).toBeTruthy()
    })
  })

  describe('onPress', () => {
    it('calls onPress if onPress is passed and title is pressed', () => {
      const onPress = jest.fn()
      const { getByTestId } = render(<BaseCard.Header testID="header" title={title} onPress={onPress} />)

      expect(onPress).toHaveBeenCalledTimes(0)

      fireEvent.press(getByTestId('header'), ON_PRESS_EVENT_PAYLOAD)

      expect(onPress).toHaveBeenCalledTimes(1)
    })
  })
})

describe(BaseCard.EmptyState, () => {
  it('renders without error', () => {
    const tree = render(<BaseCard.EmptyState description="description" />)

    expect(tree).toMatchSnapshot()
  })

  it('renders description', () => {
    const { queryByText } = render(<BaseCard.EmptyState description="description" />)

    expect(queryByText('description')).toBeTruthy()
  })

  it('renders icon when icon is passed', () => {
    const { queryByTestId } = render(
      <BaseCard.EmptyState description="description" icon={<Flex testID="custom-icon" />} />,
    )

    expect(queryByTestId('custom-icon')).toBeTruthy()
  })

  it('renders title when title is passed', () => {
    const { queryByText } = render(<BaseCard.EmptyState description="description" title="title" />)

    expect(queryByText('title')).toBeTruthy()
  })

  describe('button', () => {
    it('renders button when buttonLabel is passed', () => {
      const { queryByText } = render(<BaseCard.EmptyState buttonLabel="buttonLabel" description="description" />)

      expect(queryByText('buttonLabel')).toBeTruthy()
    })

    it('calls onPress when button is pressed', () => {
      const onPress = jest.fn()
      const { getByText } = render(
        <BaseCard.EmptyState buttonLabel="buttonLabel" description="description" onPress={onPress} />,
      )

      expect(onPress).toHaveBeenCalledTimes(0)

      fireEvent.press(getByText('buttonLabel'), ON_PRESS_EVENT_PAYLOAD)

      expect(onPress).toHaveBeenCalledTimes(1)
    })
  })

  describe('additional button', () => {
    it('renders additional button when additionalButtonLabel is passed', () => {
      const { queryByText } = render(
        <BaseCard.EmptyState additionalButtonLabel="additionalButtonLabel" description="description" />,
      )

      expect(queryByText('additionalButtonLabel')).toBeTruthy()
    })

    it('calls onPressAdditional when additional button is pressed', () => {
      const onPressAdditional = jest.fn()
      const { getByText } = render(
        <BaseCard.EmptyState
          additionalButtonLabel="additionalButtonLabel"
          description="description"
          onPressAdditional={onPressAdditional}
        />,
      )

      expect(onPressAdditional).toHaveBeenCalledTimes(0)

      fireEvent.press(getByText('additionalButtonLabel'), ON_PRESS_EVENT_PAYLOAD)

      expect(onPressAdditional).toHaveBeenCalledTimes(1)
    })
  })
})

describe(BaseCard.ErrorState, () => {
  it('renders without error', () => {
    const tree = render(<BaseCard.ErrorState />)

    expect(tree).toMatchSnapshot()
  })

  it('renders description when description is passed', () => {
    const { queryByText } = render(<BaseCard.ErrorState description="description" />)

    expect(queryByText('description')).toBeTruthy()
  })

  it('renders title when title is passed', () => {
    const { queryByText } = render(<BaseCard.ErrorState description="description" title="title" />)

    expect(queryByText('title')).toBeTruthy()
  })

  describe('retry button', () => {
    it('renders retry button when retryButtonLabel is passed', () => {
      const { queryByText } = render(
        <BaseCard.ErrorState description="description" retryButtonLabel="retryButtonLabel" />,
      )

      expect(queryByText('retryButtonLabel')).toBeTruthy()
    })

    it('calls onRetry when retry button is pressed', () => {
      const onRetry = jest.fn()
      const { getByText } = render(
        <BaseCard.ErrorState description="description" retryButtonLabel="retryButtonLabel" onRetry={onRetry} />,
      )

      expect(onRetry).toHaveBeenCalledTimes(0)

      fireEvent.press(getByText('retryButtonLabel'), ON_PRESS_EVENT_PAYLOAD)

      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })

  it('renders icon when icon is passed', () => {
    const { queryByTestId } = render(
      <BaseCard.ErrorState description="description" icon={<Flex testID="custom-icon" />} />,
    )

    expect(queryByTestId('custom-icon')).toBeTruthy()
  })
})

describe(BaseCard.InlineErrorState, () => {
  it('renders without error', () => {
    const tree = render(<BaseCard.InlineErrorState />)

    expect(tree).toMatchSnapshot()
  })

  describe('title', () => {
    it('renders default title when title is not passed', () => {
      const { queryByText } = render(<BaseCard.InlineErrorState />)

      expect(queryByText('Oops! Something went wrong.')).toBeTruthy()
    })

    it('renders custom title when title is passed', () => {
      const { queryByText } = render(<BaseCard.InlineErrorState title="custom-title" />)

      expect(queryByText('custom-title')).toBeTruthy()
    })
  })

  describe('retry button', () => {
    it('does not render retry button when onRetry is not passed', () => {
      const { queryByText } = render(<BaseCard.InlineErrorState />)

      expect(queryByText('Retry')).toBeFalsy()
    })

    it('renders default retry button when retryButtonLabel is not passed', () => {
      const { queryByText } = render(<BaseCard.InlineErrorState onRetry={jest.fn()} />)

      expect(queryByText('Retry')).toBeTruthy()
    })

    it('renders custom retry button when retryButtonLabel is passed', () => {
      const { queryByText } = render(<BaseCard.InlineErrorState retryButtonLabel="custom-label" onRetry={jest.fn()} />)

      expect(queryByText('custom-label')).toBeTruthy()
    })

    it('calls onRetry when retry button is pressed', () => {
      const onRetry = jest.fn()
      const { getByText } = render(<BaseCard.InlineErrorState onRetry={onRetry} />)

      expect(onRetry).toHaveBeenCalledTimes(0)

      fireEvent.press(getByText('Retry'), ON_PRESS_EVENT_PAYLOAD)

      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('icon', () => {
    it('renders default icon when icon is not passed', () => {
      const { queryByTestId } = render(<BaseCard.InlineErrorState />)

      expect(queryByTestId('error-icon')).toBeTruthy()
    })

    it('renders custom icon when icon is passed', () => {
      const { queryByTestId } = render(<BaseCard.InlineErrorState icon={<Flex testID="custom-icon" />} />)

      expect(queryByTestId('custom-icon')).toBeTruthy()
    })
  })
})
