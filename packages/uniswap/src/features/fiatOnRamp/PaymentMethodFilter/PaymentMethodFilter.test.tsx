import { Bank } from 'ui/src/components/icons/Bank'
import { Buy } from 'ui/src/components/icons/Buy'
import { PaymentMethodFilter as MobilePaymentMethodFilter } from 'uniswap/src/features/fiatOnRamp/PaymentMethodFilter/PaymentMethodFilter.native'
import { PaymentMethodFilter as WebPaymentMethodFilter } from 'uniswap/src/features/fiatOnRamp/PaymentMethodFilter/PaymentMethodFilter.web'
import { PaymentMethodItem } from 'uniswap/src/features/fiatOnRamp/PaymentMethodFilter/utils'
import { FORFilters } from 'uniswap/src/features/fiatOnRamp/types'
import { render } from 'uniswap/src/test/test-utils'

// Use vi.hoisted to create mock functions that can be controlled in tests
const { mockIsAndroid, mockIsIOS, mockIsWebAndroid, mockIsWebIOS } = vi.hoisted(() => ({
  mockIsAndroid: vi.fn().mockReturnValue(false),
  mockIsIOS: vi.fn().mockReturnValue(false),
  mockIsWebAndroid: vi.fn().mockReturnValue(false),
  mockIsWebIOS: vi.fn().mockReturnValue(false),
}))

vi.mock('utilities/src/platform', () => ({
  isAndroid: mockIsAndroid,
  isIOS: mockIsIOS,
  isWebAndroid: mockIsWebAndroid,
  isWebIOS: mockIsWebIOS,
  isWebPlatform: true,
  isMobileWeb: false,
  isTouchable: false,
  isHoverable: true,
  isChrome: true,
  isSafari: false,
  isMobileWebSafari: false,
  isMobileWebAndroid: false,
  isBrowser: true,
  isExtensionApp: false,
  isMobileApp: false,
  isWebApp: true,
  isWebAppDesktop: true,
}))

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => {
      const translations: Record<string, string> = {
        'fiatOnRamp.paymentMethods.applePay': 'Apple Pay',
        'fiatOnRamp.paymentMethods.googlePay': 'Google Pay',
        'fiatOnRamp.paymentMethods.bank': 'Bank',
        'fiatOnRamp.paymentMethods.debit': 'Debit',
        'fiatOnRamp.paymentMethods.paypal': 'PayPal',
        'fiatOnRamp.paymentMethods.venmo': 'Venmo',
      }
      return translations[key] || key
    },
  }),
}))

describe('PaymentMethodFilter', () => {
  const defaultProps = {
    paymentMethod: undefined,
    setPaymentMethod: vi.fn(),
    isOffRamp: false,
  }

  describe('Mobile Implementation', () => {
    beforeEach(() => {
      mockIsAndroid.mockReturnValue(true)
      mockIsIOS.mockReturnValue(false)
      mockIsWebAndroid.mockReturnValue(false)
      mockIsWebIOS.mockReturnValue(false)
    })

    it('renders mobile implementation correctly', () => {
      const tree = render(<MobilePaymentMethodFilter {...defaultProps} />)
      expect(tree).toMatchSnapshot()
    })

    it('renders with selected payment method', () => {
      const propsWithSelection = {
        ...defaultProps,
        paymentMethod: FORFilters.Bank,
      }
      const tree = render(<MobilePaymentMethodFilter {...propsWithSelection} />)
      expect(tree).toMatchSnapshot()
    })

    it('renders with iOS supported payment methods', () => {
      mockIsAndroid.mockReturnValue(false)
      mockIsIOS.mockReturnValue(true)

      const tree = render(<MobilePaymentMethodFilter {...defaultProps} />)
      expect(tree).toMatchSnapshot()
    })
  })

  describe('Web Implementation', () => {
    beforeEach(() => {
      mockIsAndroid.mockReturnValue(false)
      mockIsIOS.mockReturnValue(false)
      mockIsWebAndroid.mockReturnValue(false)
      mockIsWebIOS.mockReturnValue(false)
    })

    it('renders web implementation correctly', () => {
      const tree = render(<WebPaymentMethodFilter {...defaultProps} />)
      expect(tree).toMatchSnapshot()
    })

    it('renders with selected payment method', () => {
      const propsWithSelection = {
        ...defaultProps,
        paymentMethod: FORFilters.PayPal,
      }
      const tree = render(<WebPaymentMethodFilter {...propsWithSelection} />)
      expect(tree).toMatchSnapshot()
    })

    it('renders with web-specific props', () => {
      const propsWithWebProps = {
        ...defaultProps,
        testID: 'web-filter',
        width: 24,
      }
      const tree = render(<WebPaymentMethodFilter {...propsWithWebProps} />)
      expect(tree).toMatchSnapshot()
    })

    it('renders with iOS supported payment methods', () => {
      mockIsWebAndroid.mockReturnValue(false)
      mockIsWebIOS.mockReturnValue(true)

      const tree = render(<WebPaymentMethodFilter {...defaultProps} />)
      expect(tree).toMatchSnapshot()
    })

    it('renders with Android supported payment methods', () => {
      mockIsWebAndroid.mockReturnValue(true)
      mockIsWebIOS.mockReturnValue(false)

      const tree = render(<WebPaymentMethodFilter {...defaultProps} />)
      expect(tree).toMatchSnapshot()
    })
  })

  describe('Shared Components', () => {
    it('renders PaymentMethodItem correctly', () => {
      const props = {
        filter: FORFilters.Bank,
        icon: Bank,
        label: 'Bank',
        isSelected: true,
        onPress: vi.fn(),
      }
      const tree = render(<PaymentMethodItem {...props} />)
      expect(tree).toMatchSnapshot()
    })

    it('renders PaymentMethodItem when not selected', () => {
      const props = {
        filter: FORFilters.Debit,
        icon: Buy,
        label: 'Debit',
        isSelected: false,
        onPress: vi.fn(),
      }
      const tree = render(<PaymentMethodItem {...props} />)
      expect(tree).toMatchSnapshot()
    })
  })
})
