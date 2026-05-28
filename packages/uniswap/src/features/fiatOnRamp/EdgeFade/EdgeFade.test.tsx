import { EdgeFade as MobileEdgeFade } from 'uniswap/src/features/fiatOnRamp/EdgeFade/EdgeFade.native'
import { EdgeFade as WebEdgeFade } from 'uniswap/src/features/fiatOnRamp/EdgeFade/EdgeFade.web'
import { render } from 'uniswap/src/test/test-utils'

describe('EdgeFade', () => {
  const leftProps = {
    side: 'left' as const,
  }
  const rightProps = {
    side: 'right' as const,
  }

  describe('Mobile Implementation', () => {
    it('renders mobile implementation correctly with left side', () => {
      const tree = render(<MobileEdgeFade {...leftProps} />)
      expect(tree).toMatchSnapshot()
    })

    it('renders mobile implementation correctly with right side', () => {
      const propsWithRightSide = {
        ...rightProps,
      }
      const tree = render(<MobileEdgeFade {...propsWithRightSide} />)
      expect(tree).toMatchSnapshot()
    })

    it('renders with additional flex props', () => {
      const propsWithFlexProps = {
        ...leftProps,
        testID: 'mobile-edge-fade',
        width: 24,
      }
      const tree = render(<MobileEdgeFade {...propsWithFlexProps} />)
      expect(tree).toMatchSnapshot()
    })
  })

  describe('Web Implementation', () => {
    it('renders web implementation correctly with left side', () => {
      const tree = render(<WebEdgeFade {...leftProps} />)
      expect(tree).toMatchSnapshot()
    })

    it('renders web implementation correctly with right side', () => {
      const propsWithRightSide = {
        ...rightProps,
      }
      const tree = render(<WebEdgeFade {...propsWithRightSide} />)
      expect(tree).toMatchSnapshot()
    })

    it('renders with additional flex props', () => {
      const propsWithFlexProps = {
        ...leftProps,
        testID: 'web-edge-fade',
        width: 24,
      }
      const tree = render(<WebEdgeFade {...propsWithFlexProps} />)
      expect(tree).toMatchSnapshot()
    })
  })
})
