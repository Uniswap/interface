import { render, screen } from 'test-utils/render'

import { PendingModalContent } from './PendingModalContent'

describe('PendingModalContent', () => {
  it('renders null for invalid content', () => {
    const result = render(
      <PendingModalContent steps={[]} activeStepIndex={0} confirmed={false} transactionSuccess={false} />
    )
    expect(result.container).toBeEmptyDOMElement()
  })

  it('renders correctly with only one step', () => {
    render(
      <PendingModalContent
        steps={[{ title: 'title0', subtitle: 'subtitle0', label: 'label0', tooltipText: 'tooltipText0' }]}
        activeStepIndex={0}
        confirmed={false}
        transactionSuccess={false}
      />
    )
    expect(screen.getByText('title0')).toBeInTheDocument()
    expect(screen.getByText('subtitle0')).toBeInTheDocument()
    expect(screen.getByText('label0')).toBeInTheDocument()
    expect(screen.getByText('tooltipText0')).toBeInTheDocument()
  })

  describe('renders the correct step when there are multiple', () => {
    it('renders the first step with activeStepIndex=0', () => {
      render(
        <PendingModalContent
          steps={[
            { title: 'title0', subtitle: 'subtitle0', label: 'label0', tooltipText: 'tooltipText0' },
            { title: 'title1', subtitle: 'subtitle1', label: 'label1', tooltipText: 'tooltipText1' },
          ]}
          activeStepIndex={0}
          confirmed={false}
          transactionSuccess={false}
        />
      )
      expect(screen.getByText('title0')).toBeInTheDocument()
      expect(screen.getByText('subtitle0')).toBeInTheDocument()
      expect(screen.getByText('label0')).toBeInTheDocument()
      expect(screen.getByText('tooltipText0')).toBeInTheDocument()
      expect(screen.queryByText('title1')).toBeNull()
      expect(screen.queryByText('subtitle1')).toBeNull()
      expect(screen.queryByText('label1')).toBeNull()
      expect(screen.queryByText('tooltipText1')).toBeNull()
    })
    it('renders the second step with activeStepIndex=1', () => {
      render(
        <PendingModalContent
          steps={[
            { title: 'title0', subtitle: 'subtitle0', label: 'label0', tooltipText: 'tooltipText0' },
            { title: 'title1', subtitle: 'subtitle1', label: 'label1', tooltipText: 'tooltipText1' },
          ]}
          activeStepIndex={1}
          confirmed={false}
          transactionSuccess={false}
        />
      )
      expect(screen.getByText('title1')).toBeInTheDocument()
      expect(screen.getByText('subtitle1')).toBeInTheDocument()
      expect(screen.getByText('label1')).toBeInTheDocument()
      expect(screen.getByText('tooltipText1')).toBeInTheDocument()
      expect(screen.queryByText('title0')).toBeNull()
      expect(screen.queryByText('subtitle0')).toBeNull()
      expect(screen.queryByText('label0')).toBeNull()
      expect(screen.queryByText('tooltipText0')).toBeNull()
    })
  })

  describe('renders the correct logo', () => {
    it('renders the given logo when not overridden with confirmed', () => {
      render(
        <PendingModalContent
          steps={[
            {
              title: 'title0',
              subtitle: 'subtitle0',
              label: 'label0',
              tooltipText: 'tooltipText0',
              logo: <div data-testid="test-logo" />,
            },
          ]}
          activeStepIndex={0}
          confirmed={false}
          transactionSuccess={false}
        />
      )
      expect(screen.getByTestId('test-logo')).toBeInTheDocument()
      expect(screen.queryByTestId('PendingModalContent-failureIcon')).toBeNull()
    })

    it('renders the failure icon instead of the given logo when confirmed and unsuccessful', () => {
      render(
        <PendingModalContent
          steps={[
            {
              title: 'title0',
              subtitle: 'subtitle0',
              label: 'label0',
              tooltipText: 'tooltipText0',
              logo: <div data-testid="test-logo" />,
            },
          ]}
          activeStepIndex={0}
          confirmed={true}
          transactionSuccess={false}
        />
      )
      expect(screen.getByTestId('PendingModalContent-failureIcon')).toBeInTheDocument()
      expect(screen.queryByTestId('test-logo')).toBeNull()
    })

    it('renders the success icon instead of the given logo when confirmed and successful', () => {
      render(
        <PendingModalContent
          steps={[
            {
              title: 'title0',
              subtitle: 'subtitle0',
              label: 'label0',
              tooltipText: 'tooltipText0',
              logo: <div data-testid="test-logo" />,
            },
          ]}
          activeStepIndex={0}
          confirmed={true}
          transactionSuccess={true}
        />
      )
      expect(screen.queryByTestId('test-logo')).toBeNull()
      expect(screen.queryByTestId('PendingModalContent-failureIcon')).toBeNull()
      expect(screen.getByTestId('PendingModalContent-successIcon')).toBeInTheDocument()
    })
  })
})
