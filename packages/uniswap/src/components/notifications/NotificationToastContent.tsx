//! tamagui-ignore
// TODO(EXT-732): fix encoding error in tamagui optimizer on this file
import { ElementAfterText, Flex, Text, TouchableArea, useShadowPropsShort } from 'ui/src'
import {
  LARGE_TOAST_RADIUS,
  MAX_TEXT_LENGTH,
  NOTIFICATION_HEIGHT,
  SMALL_TOAST_RADIUS,
  TOAST_BORDER_WIDTH,
} from 'uniswap/src/features/notifications/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export interface NotificationContentProps {
  title: string
  subtitle?: string
  icon?: JSX.Element
  postCaptionElement?: JSX.Element
  actionButton?: {
    title: string
    onPress: () => void
  }
  onPress?: () => void
  onPressIn?: () => void
  contentOverride?: JSX.Element
  smallToast?: boolean
  onNotificationPress: () => void
  onActionButtonPress: () => void
}

export function NotificationToastContent({
  subtitle,
  title,
  icon,
  postCaptionElement,
  onNotificationPress,
  onActionButtonPress,
  onPressIn,
  smallToast,
  actionButton,
  contentOverride,
}: NotificationContentProps): JSX.Element {
  const shadowProps = useShadowPropsShort()

  return (
    <Flex
      {...shadowProps}
      borderColor="$surface3"
      borderRadius={smallToast ? SMALL_TOAST_RADIUS : LARGE_TOAST_RADIUS}
      borderWidth={TOAST_BORDER_WIDTH}
      mx={smallToast ? 'auto' : '$spacing12'}
      pointerEvents="auto"
    >
      {smallToast ? (
        <NotificationContentSmall
          icon={icon}
          postCaptionElement={postCaptionElement}
          title={title}
          contentOverride={contentOverride}
          onPress={onNotificationPress}
          onPressIn={onPressIn}
        />
      ) : (
        <NotificationContentNormal
          actionButton={actionButton ? { title: actionButton.title, onPress: onActionButtonPress } : undefined}
          icon={icon}
          postCaptionElement={postCaptionElement}
          subtitle={subtitle}
          title={title}
          contentOverride={contentOverride}
          onPress={onNotificationPress}
          onPressIn={onPressIn}
        />
      )}
    </Flex>
  )
}

function NotificationContentNormal({
  title,
  subtitle,
  icon,
  postCaptionElement,
  actionButton,
  onPress,
  onPressIn,
  contentOverride,
}: Omit<NotificationContentProps, 'smallToast' | 'onNotificationPress' | 'onActionButtonPress'>): JSX.Element {
  return (
    <TouchableArea
      alignItems="center"
      backgroundColor="$surface1"
      borderRadius={LARGE_TOAST_RADIUS}
      flex={1}
      flexDirection="row"
      minHeight={NOTIFICATION_HEIGHT}
      p="$spacing12"
      onPress={onPress}
      onPressIn={onPressIn}
    >
      {contentOverride ? (
        contentOverride
      ) : (
        <Flex row alignItems="center" gap="$spacing8" justifyContent="space-between" width="100%">
          <Flex
            row
            shrink
            alignItems="center"
            flexBasis={actionButton ? '75%' : '100%'}
            gap="$spacing12"
            justifyContent="flex-start"
          >
            {icon}
            <Flex shrink alignItems="flex-start" flexDirection="column">
              <ElementAfterText
                textProps={{
                  numberOfLines: subtitle ? 1 : 2,
                  testID: TestID.NotificationToastTitle,
                  variant: 'subheading2',
                }}
                text={title}
                element={postCaptionElement}
              />
              {subtitle && (
                <Text color="$neutral2" numberOfLines={1} variant="body3">
                  {subtitle}
                </Text>
              )}
            </Flex>
          </Flex>
          {actionButton && (
            <Flex shrink alignItems="flex-end" flexBasis="25%" gap="$spacing4">
              <TouchableArea p="$spacing8" onPress={actionButton.onPress}>
                <Text adjustsFontSizeToFit color="$accent1" numberOfLines={1}>
                  {actionButton.title}
                </Text>
              </TouchableArea>
            </Flex>
          )}
        </Flex>
      )}
    </TouchableArea>
  )
}

function NotificationContentSmall({
  title,
  icon,
  postCaptionElement,
  onPress,
  onPressIn,
  contentOverride: overrideContent,
}: Omit<NotificationContentProps, 'smallToast' | 'onNotificationPress' | 'onActionButtonPress'>): JSX.Element {
  return (
    <Flex centered row shrink pointerEvents="box-none">
      <TouchableArea
        backgroundColor="$surface1"
        borderRadius={SMALL_TOAST_RADIUS}
        p="$spacing12"
        onPress={onPress}
        onPressIn={onPressIn}
      >
        {overrideContent ? (
          overrideContent
        ) : (
          <Flex row alignItems="center" gap="$spacing8" justifyContent="flex-start" pr="$spacing4">
            {icon && <Flex>{icon}</Flex>}
            <Text
              adjustsFontSizeToFit
              numberOfLines={title.length > MAX_TEXT_LENGTH ? 2 : 1}
              testID={TestID.NotificationToastTitle}
              variant={title.length > MAX_TEXT_LENGTH ? 'body3' : 'body2'}
            >
              {title}
            </Text>
            {postCaptionElement && <Flex>{postCaptionElement}</Flex>}
          </Flex>
        )}
      </TouchableArea>
    </Flex>
  )
}
