import {
  Content,
  Metadata,
  Notification,
} from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import { ContentStyle } from '@universe/api'
import { type MobileState } from 'src/app/mobileReducer'
import {
  BACKUP_REMINDER_NOTIFICATION_ID,
  createBackupReminderTrigger,
  isBackupReminderNotification,
} from 'src/notification-service/triggers/backupReminderTrigger'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { ONE_DAY_MS } from 'utilities/src/time/time'
import { selectBackupReminderLastSeenTs } from 'wallet/src/features/behaviorHistory/selectors'
import { setBackupReminderLastSeenTs } from 'wallet/src/features/behaviorHistory/slice'
import { hasExternalBackup } from 'wallet/src/features/wallet/accounts/utils'
import { selectActiveAccount } from 'wallet/src/features/wallet/selectors'

jest.mock('wallet/src/features/behaviorHistory/selectors')
jest.mock('wallet/src/features/wallet/selectors')
jest.mock('wallet/src/features/wallet/accounts/utils')

const mockSelectBackupReminderLastSeenTs = selectBackupReminderLastSeenTs as jest.MockedFunction<
  typeof selectBackupReminderLastSeenTs
>
const mockSelectActiveAccount = selectActiveAccount as jest.MockedFunction<typeof selectActiveAccount>
const mockHasExternalBackup = hasExternalBackup as jest.MockedFunction<typeof hasExternalBackup>

describe('backupReminderTrigger', () => {
  const mockDispatch = jest.fn()
  const mockGetState = jest.fn<MobileState, []>()
  const mockGetPortfolioValue = jest.fn<Promise<number>, []>()

  const mockSignerAccount = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    type: AccountType.SignerMnemonic as const,
    name: 'Test Account',
    timeImportedMs: Date.now(),
    pushNotificationsEnabled: false,
    derivationIndex: 0,
    mnemonicId: 'test-mnemonic-id',
  }

  const mockViewOnlyAccount = {
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    type: AccountType.Readonly as const,
    name: 'View Only Account',
    timeImportedMs: Date.now(),
    pushNotificationsEnabled: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-06-15T12:00:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('createBackupReminderTrigger', () => {
    it('returns a trigger with the correct ID', () => {
      const trigger = createBackupReminderTrigger({
        getState: mockGetState,
        dispatch: mockDispatch,
        getPortfolioValue: mockGetPortfolioValue,
      })

      expect(trigger.id).toBe(BACKUP_REMINDER_NOTIFICATION_ID)
      expect(trigger.id.startsWith('local:')).toBe(true)
    })

    describe('shouldShow', () => {
      it('returns true when all conditions are met', async () => {
        mockSelectActiveAccount.mockReturnValue(mockSignerAccount)
        mockHasExternalBackup.mockReturnValue(false)
        mockSelectBackupReminderLastSeenTs.mockReturnValue(Date.now() - 2 * ONE_DAY_MS) // 2 days ago
        mockGetPortfolioValue.mockResolvedValue(150) // $150

        const trigger = createBackupReminderTrigger({
          getState: mockGetState,
          dispatch: mockDispatch,
          getPortfolioValue: mockGetPortfolioValue,
        })

        await expect(trigger.shouldShow()).resolves.toBe(true)
      })

      it('returns false when no active account', async () => {
        mockSelectActiveAccount.mockReturnValue(null)

        const trigger = createBackupReminderTrigger({
          getState: mockGetState,
          dispatch: mockDispatch,
          getPortfolioValue: mockGetPortfolioValue,
        })

        await expect(trigger.shouldShow()).resolves.toBe(false)
        expect(mockGetPortfolioValue).not.toHaveBeenCalled()
      })

      it('returns false when account is view-only (not signer)', async () => {
        mockSelectActiveAccount.mockReturnValue(mockViewOnlyAccount)

        const trigger = createBackupReminderTrigger({
          getState: mockGetState,
          dispatch: mockDispatch,
          getPortfolioValue: mockGetPortfolioValue,
        })

        await expect(trigger.shouldShow()).resolves.toBe(false)
        expect(mockGetPortfolioValue).not.toHaveBeenCalled()
      })

      it('returns false when account has external backup', async () => {
        mockSelectActiveAccount.mockReturnValue(mockSignerAccount)
        mockHasExternalBackup.mockReturnValue(true)

        const trigger = createBackupReminderTrigger({
          getState: mockGetState,
          dispatch: mockDispatch,
          getPortfolioValue: mockGetPortfolioValue,
        })

        await expect(trigger.shouldShow()).resolves.toBe(false)
        expect(mockGetPortfolioValue).not.toHaveBeenCalled()
      })

      it('returns false when last seen is within 24 hours', async () => {
        mockSelectActiveAccount.mockReturnValue(mockSignerAccount)
        mockHasExternalBackup.mockReturnValue(false)
        mockSelectBackupReminderLastSeenTs.mockReturnValue(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago

        const trigger = createBackupReminderTrigger({
          getState: mockGetState,
          dispatch: mockDispatch,
          getPortfolioValue: mockGetPortfolioValue,
        })

        await expect(trigger.shouldShow()).resolves.toBe(false)
        expect(mockGetPortfolioValue).not.toHaveBeenCalled()
      })

      it('returns false when portfolio value is below $100', async () => {
        mockSelectActiveAccount.mockReturnValue(mockSignerAccount)
        mockHasExternalBackup.mockReturnValue(false)
        mockSelectBackupReminderLastSeenTs.mockReturnValue(undefined) // Never seen
        mockGetPortfolioValue.mockResolvedValue(50) // $50

        const trigger = createBackupReminderTrigger({
          getState: mockGetState,
          dispatch: mockDispatch,
          getPortfolioValue: mockGetPortfolioValue,
        })

        await expect(trigger.shouldShow()).resolves.toBe(false)
      })

      it('returns true when never seen before and conditions met', async () => {
        mockSelectActiveAccount.mockReturnValue(mockSignerAccount)
        mockHasExternalBackup.mockReturnValue(false)
        mockSelectBackupReminderLastSeenTs.mockReturnValue(undefined) // Never seen
        mockGetPortfolioValue.mockResolvedValue(100) // Exactly $100

        const trigger = createBackupReminderTrigger({
          getState: mockGetState,
          dispatch: mockDispatch,
          getPortfolioValue: mockGetPortfolioValue,
        })

        await expect(trigger.shouldShow()).resolves.toBe(true)
      })

      it('returns false when getPortfolioValue throws an error', async () => {
        mockSelectActiveAccount.mockReturnValue(mockSignerAccount)
        mockHasExternalBackup.mockReturnValue(false)
        mockSelectBackupReminderLastSeenTs.mockReturnValue(undefined)
        mockGetPortfolioValue.mockRejectedValue(new Error('Network error'))

        const trigger = createBackupReminderTrigger({
          getState: mockGetState,
          dispatch: mockDispatch,
          getPortfolioValue: mockGetPortfolioValue,
        })

        await expect(trigger.shouldShow()).resolves.toBe(false)
      })
    })

    describe('createNotification', () => {
      it('returns a notification with the correct ID and style', () => {
        const trigger = createBackupReminderTrigger({
          getState: mockGetState,
          dispatch: mockDispatch,
          getPortfolioValue: mockGetPortfolioValue,
        })

        const notification = trigger.createNotification()

        expect(notification.id).toBe(BACKUP_REMINDER_NOTIFICATION_ID)
        expect(notification.content?.style).toBe(ContentStyle.MODAL)
      })

      it('returns a notification with local metadata', () => {
        const trigger = createBackupReminderTrigger({
          getState: mockGetState,
          dispatch: mockDispatch,
          getPortfolioValue: mockGetPortfolioValue,
        })

        const notification = trigger.createNotification()

        expect(notification.metadata?.owner).toBe('local')
        expect(notification.metadata?.business).toBe('backup_reminder')
      })
    })

    describe('onAcknowledge', () => {
      it('dispatches setBackupReminderLastSeenTs with current timestamp when called', () => {
        const trigger = createBackupReminderTrigger({
          getState: mockGetState,
          dispatch: mockDispatch,
          getPortfolioValue: mockGetPortfolioValue,
        })

        trigger.onAcknowledge?.()

        expect(mockDispatch).toHaveBeenCalledWith(setBackupReminderLastSeenTs(Date.now()))
      })
    })
  })

  describe('isBackupReminderNotification', () => {
    it('returns true for backup reminder notification', () => {
      const notification = new Notification({
        id: BACKUP_REMINDER_NOTIFICATION_ID,
        content: new Content({ style: ContentStyle.MODAL, title: '' }),
        metadata: new Metadata({ owner: 'local', business: 'backup_reminder' }),
      })

      expect(isBackupReminderNotification(notification)).toBe(true)
    })

    it('returns false for other notifications', () => {
      const notification = new Notification({
        id: 'some-other-notification',
        content: new Content({ style: ContentStyle.MODAL, title: '' }),
        metadata: new Metadata({ owner: 'test', business: 'test' }),
      })

      expect(isBackupReminderNotification(notification)).toBe(false)
    })

    it('returns false for other local notifications', () => {
      const notification = new Notification({
        id: 'local:other_trigger',
        content: new Content({ style: ContentStyle.MODAL, title: '' }),
        metadata: new Metadata({ owner: 'local', business: 'other' }),
      })

      expect(isBackupReminderNotification(notification)).toBe(false)
    })
  })
})
