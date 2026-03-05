import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { useEvent } from 'utilities/src/react/hooks'
import useCopyClipboard from '~/hooks/useCopyClipboard'

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
    <Flex>
      {process.env.REACT_APP_GIT_COMMIT_HASH ? (
        <TouchableArea onPress={onPressGitHash}>
          <Text variant="body3" color="neutral3" textAlign="right">
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
