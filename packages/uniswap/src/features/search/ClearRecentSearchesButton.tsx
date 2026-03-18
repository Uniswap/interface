import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, Text, TouchableArea } from 'ui/src'

import { clearSearchHistory } from 'uniswap/src/features/search/searchHistorySlice'

export function ClearRecentSearchesButton(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const onPressClearSearchHistory = useCallback((): void => {
    dispatch(clearSearchHistory())
  }, [dispatch])

  return (
    <Flex height="100%" justifyContent="center" alignItems="center">
      <TouchableArea onPress={onPressClearSearchHistory}>
        <Text color="$neutral2" variant="buttonLabel3">
          {t('common.clear')}
        </Text>
      </TouchableArea>
    </Flex>
  )
}
