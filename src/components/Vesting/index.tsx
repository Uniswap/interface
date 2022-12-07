import { Trans } from '@lingui/macro'
import { Text } from 'rebass'

import LocalLoader from 'components/LocalLoader'
import RewardLockerSchedules from 'components/Vesting/RewardLockerSchedules'
import { ScheduleGrid } from 'components/Vesting/styleds'
import useTheme from 'hooks/useTheme'
import { useRewardLockerAddressesWithVersion, useSchedules } from 'state/vesting/hooks'

import ConfirmVestingModal from './ConfirmVestingModal'

const Vesting = ({ loading }: { loading: boolean }) => {
  const { schedulesByRewardLocker } = useSchedules()
  const rewardLockerAddressesWithVersion = useRewardLockerAddressesWithVersion()
  const theme = useTheme()
  const noVesting = Object.keys(rewardLockerAddressesWithVersion).every(
    rewardLockerAddress => !schedulesByRewardLocker[rewardLockerAddress]?.length,
  )

  return (
    <>
      <ConfirmVestingModal />
      {noVesting ? (
        loading ? (
          <LocalLoader />
        ) : (
          <Text textAlign="center" color={theme.subText} marginTop="24px">
            <Trans>No vesting schedule!</Trans>
          </Text>
        )
      ) : (
        <ScheduleGrid>
          {Object.keys(rewardLockerAddressesWithVersion)
            .filter(rewardLockerAddress => !!schedulesByRewardLocker[rewardLockerAddress]?.length)
            .map(rewardLockerAddress => (
              <RewardLockerSchedules
                key={rewardLockerAddress}
                rewardLockerAddress={rewardLockerAddress}
                schedules={schedulesByRewardLocker[rewardLockerAddress]}
                rewardLockerVersion={rewardLockerAddressesWithVersion[rewardLockerAddress]}
              />
            ))}
        </ScheduleGrid>
      )}
    </>
  )
}

export default Vesting
