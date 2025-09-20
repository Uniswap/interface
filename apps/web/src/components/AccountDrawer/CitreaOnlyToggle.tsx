import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectIsCitreaOnlyEnabled } from 'uniswap/src/features/settings/selectors'
import { setCitreaOnlyEnabled } from 'uniswap/src/features/settings/slice'

export function CitreaOnlyToggle() {
  const dispatch = useDispatch()
  const isCitreaOnly = useSelector(selectIsCitreaOnlyEnabled)

  const handleToggle = useCallback(() => {
    dispatch(setCitreaOnlyEnabled(!isCitreaOnly))
  }, [dispatch, isCitreaOnly])

  return <SettingsToggle title="Citrea only" isActive={isCitreaOnly} toggle={handleToggle} />
}
