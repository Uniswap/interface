import { Bank } from 'ui/src/components/icons/Bank'
import { Buy } from 'ui/src/components/icons/Buy'
import { PaymentMethodFilter as MobilePaymentMethodFilter } from 'uniswap/src/features/fiatOnRamp/PaymentMethodFilter/PaymentMethodFilter.native'
import { PaymentMethodFilter as WebPaymentMethodFilter } from 'uniswap/src/features/fiatOnRamp/PaymentMethodFilter/PaymentMethodFilter.web'
import { PaymentMethodItem } from 'uniswap/src/features/fiatOnRamp/PaymentMethodFilter/utils'
import { FORFilters } from 'uniswap/src/features/fiatOnRamp/types'
import { render } from 'uniswap/src/test/test-utils'

jest.mock('utilities/src/platform', () => ({
  isAndroid: jest.fn(),
  isIOS: jest.fn(),
  isWebAndroid: jest.fn(),
  isWebIOS: jest.fn(),
}))

jest.mock('react-i18next', () => ({
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
    setPaymentMethod: jest.fn(),
    isOffRamp: false,
  }

  describe('Mobile Implementation', () => {
    beforeEach(() => {
      const { isAndroid, isIOS, isWebAndroid, isWebIOS } = require('utilities/src/platform')
      isAndroid.mockReturnValue(true)
      isIOS.mockReturnValue(false)
      isWebAndroid.mockReturnValue(false)
      isWebIOS.mockReturnValue(false)
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
      const { isAndroid, isIOS } = require('utilities/src/platform')
      isAndroid.mockReturnValue(false)
      isIOS.mockReturnValue(true)

      const tree = render(<MobilePaymentMethodFilter {...defaultProps} />)
      expect(tree).toMatchSnapshot()
    })
  })

  describe('Web Implementation', () => {
    beforeEach(() => {
      const { isAndroid, isIOS, isWebAndroid, isWebIOS } = require('utilities/src/platform')
      isAndroid.mockReturnValue(false)
      isIOS.mockReturnValue(false)
      isWebAndroid.mockReturnValue(false)
      isWebIOS.mockReturnValue(false)
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
      const { isWebAndroid, isWebIOS } = require('utilities/src/platform')
      isWebAndroid.mockReturnValue(false)
      isWebIOS.mockReturnValue(true)

      const tree = render(<WebPaymentMethodFilter {...defaultProps} />)
      expect(tree).toMatchSnapshot()
    })

    it('renders with Android supported payment methods', () => {
      const { isWebAndroid, isWebIOS } = require('utilities/src/platform')
      isWebAndroid.mockReturnValue(true)
      isWebIOS.mockReturnValue(false)

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
        onPress: jest.fn(),
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
        onPress: jest.fn(),
      }
      const tree = render(<PaymentMethodItem {...props} />)
      expect(tree).toMatchSnapshot()
    })
  })
})
