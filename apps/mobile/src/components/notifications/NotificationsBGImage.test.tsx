import { Image, ImageStyle, Platform, StyleProp, StyleSheet } from 'react-native'
import { NotificationsBackgroundImage } from 'src/components/notifications/NotificationsBGImage'
import { getNearestFiberProp, render } from 'src/test/test-utils'
import type { Mock, MockInstance } from 'vitest'

const IMAGE_TEST_ID = 'notifications-background-image'

function getAspectRatio(element: unknown): ImageStyle['aspectRatio'] {
  return StyleSheet.flatten(getNearestFiberProp(element, 'style') as StyleProp<ImageStyle>).aspectRatio
}

type ResolveAssetSource = typeof Image.resolveAssetSource

vi.mock('@universe/mycelium/assets', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ONBOARDING_NOTIFICATIONS_DARK: { ios: 'ios-dark.png', android: 'android-dark.png' },
  ONBOARDING_NOTIFICATIONS_LIGHT: { ios: 'ios-light.png', android: 'android-light.png' },
}))

describe(NotificationsBackgroundImage, () => {
  const originalResolveAssetSource = Image.resolveAssetSource as ResolveAssetSource | undefined
  let resolveAssetSource: Mock<ResolveAssetSource>
  let getSizeSpy: MockInstance<typeof Image.getSize>
  let platformSelectSpy: MockInstance<typeof Platform.select>

  beforeEach(() => {
    resolveAssetSource = vi.fn<ResolveAssetSource>()
    // react-native-web's Image has no resolveAssetSource, so install one for the test
    Image.resolveAssetSource = resolveAssetSource
    // Mirrors Android release builds, where getSize rejects for bundled drawable resources
    getSizeSpy = vi.spyOn(Image, 'getSize').mockImplementation(() => undefined)
    platformSelectSpy = vi
      .spyOn(Platform, 'select')
      .mockImplementation((spec) => (spec as { android?: unknown }).android as never)
  })

  afterEach(() => {
    // Targeted restores: vi.restoreAllMocks would also undo the shared vitest-setup spies
    getSizeSpy.mockRestore()
    platformSelectSpy.mockRestore()
    if (originalResolveAssetSource) {
      Image.resolveAssetSource = originalResolveAssetSource
    } else {
      delete (Image as { resolveAssetSource?: ResolveAssetSource }).resolveAssetSource
    }
  })

  it('renders the image sized from the bundled asset without waiting on Image.getSize', () => {
    resolveAssetSource.mockReturnValue({ uri: 'android_light', width: 689, height: 632, scale: 1 })

    const { getByTestId } = render(<NotificationsBackgroundImage />)

    expect(getAspectRatio(getByTestId(IMAGE_TEST_ID))).toBeCloseTo(689 / 632)
    expect(resolveAssetSource).toHaveBeenCalledWith('android-light.png')
    expect(getSizeSpy).not.toHaveBeenCalled()
  })

  it('uses the aspect ratio of whichever asset resolves', () => {
    resolveAssetSource.mockReturnValue({ uri: 'notifications_light', width: 694, height: 585, scale: 2 })

    const { getByTestId } = render(<NotificationsBackgroundImage />)

    expect(getAspectRatio(getByTestId(IMAGE_TEST_ID))).toBeCloseTo(694 / 585)
  })

  it('renders nothing when the asset has no usable dimensions', () => {
    resolveAssetSource.mockReturnValue({ uri: 'missing', width: 0, height: 0, scale: 1 })

    const { queryByTestId } = render(<NotificationsBackgroundImage />)

    expect(resolveAssetSource).toHaveBeenCalled()
    expect(queryByTestId(IMAGE_TEST_ID)).toBeNull()
  })
})
