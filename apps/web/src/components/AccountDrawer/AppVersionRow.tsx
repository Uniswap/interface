import useCopyClipboard from 'hooks/useCopyClipboard'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { useEvent } from 'utilities/src/react/hooks'

export function AppVersionRow() {
  const [_, staticCopy] = useCopyClipboard()
  const { t } = useTranslation()

  const onPressGitHash = useEvent(() => {
    staticCopy(process.env.REACT_APP_GIT_COMMIT_HASH as string)
  })

  const onPressVersionTag = useEvent(() => {
    staticCopy(process.env.REACT_APP_VERSION_TAG as string)
  })

  return (
    <Flex
      position="absolute"
      bottom="$spacing12"
      right="$spacing16"
      $md={{ position: 'relative', mt: '$spacing4', ml: '$spacing32' }}
    >
      {process.env.REACT_APP_GIT_COMMIT_HASH ? (
        <TouchableArea onPress={onPressGitHash}>
          <Text variant="body3" color="neutral3">
            {t('account.drawer.gitHash')}
            {' ' + process.env.REACT_APP_GIT_COMMIT_HASH.substring(0, 6)}
          </Text>
        </TouchableArea>
      ) : null}
      {process.env.REACT_APP_VERSION_TAG ? (
        <TouchableArea onPress={onPressVersionTag}>
          <Text variant="body3" color="neutral3">
            {t('account.drawer.gitVersion')}
            {' ' + process.env.REACT_APP_VERSION_TAG}
          </Text>
        </TouchableArea>
      ) : null}
    </Flex>
  )
}
