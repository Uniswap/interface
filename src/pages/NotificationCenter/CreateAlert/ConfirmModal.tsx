import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, X } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import { useUpdatePriceAlertMutation } from 'services/priceAlert'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import NotificationIcon from 'components/Icons/NotificationIcon'
import { NetworkLogo } from 'components/Logo'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import Toggle from 'components/Toggle'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import {
  ConfirmAlertModalData,
  NOTIFICATION_ROUTES,
  PriceAlertStat,
  PriceAlertType,
} from 'pages/NotificationCenter/const'
import { uint256ToFraction } from 'utils/numbers'
import { formatTimeDuration } from 'utils/time'

const Wrapper = styled.div`
  margin: 0;
  padding: 24px 24px;
  width: 100%;
  display: flex;
  gap: 20px;
  flex-direction: column;
`

const CloseIcon = styled(X)`
  cursor: pointer;
  color: ${({ theme }) => theme.subText};
`

const Container = styled.div`
  background-color: ${({ theme }) => theme.buttonBlack};
  border-radius: 24px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Label = styled.span`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
`

const Value = styled.span`
  color: ${({ theme }) => theme.text};
  font-weight: 500;
  font-size: 14px;
`

export default function ConfirmModal({
  data: { alert, currencyIn, currencyOut },
  priceAlertStat,
  onDismiss,
}: {
  onDismiss: () => void
  priceAlertStat: PriceAlertStat
  data: ConfirmAlertModalData
}) {
  const theme = useTheme()

  const { maxActiveAlerts, totalActiveAlerts, totalAlerts, maxAlerts } = priceAlertStat
  const isMaxQuota = totalActiveAlerts >= maxActiveAlerts

  const { disableAfterTrigger, chainId, tokenInAmount, threshold, type, cooldown, note, id } = alert

  const showedAnimation = useRef(false)
  useEffect(() => {
    if (!alert.isEnabled && !showedAnimation.current) {
      setTimeout(() => setEnable(false), 2000)
    }
    showedAnimation.current = true
  }, [alert.isEnabled])

  const [isEnabled, setEnable] = useState(true)
  const canUpdateEnable = isEnabled ? true : !isMaxQuota

  const selectChain = Number(chainId) as ChainId
  const [enablePriceAlert] = useUpdatePriceAlertMutation()
  const isLoading = useRef(false)
  const toggleEnable = async () => {
    try {
      if (!id || isLoading.current || !canUpdateEnable) return
      isLoading.current = true
      const { error }: any = await enablePriceAlert({ id, isEnabled: !isEnabled })
      if (error) throw error
      setEnable(v => !v)
    } catch (error) {
      console.error('update alert error', error)
    } finally {
      setTimeout(() => {
        isLoading.current = false
      }, 100)
    }
  }

  const navigate = useNavigate()
  const onSave = async () => {
    onDismiss()
    navigate(`${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.PRICE_ALERTS}`)
  }

  return (
    <Modal isOpen={true} onDismiss={onDismiss} minHeight={false} maxWidth={480}>
      <Wrapper>
        <RowBetween>
          <Text fontSize={20} fontWeight={500}>
            <Trans>Alert Created</Trans>
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>

        <RowBetween>
          <Label>
            <Trans>
              Alerts Created: {totalAlerts}/{maxAlerts}
            </Trans>
          </Label>
          <Flex alignItems="center" style={{ gap: '6px' }}>
            <Label style={{ color: isMaxQuota ? theme.warning : theme.subText }}>
              <Trans>
                Active Alerts: {totalActiveAlerts}/{maxActiveAlerts}
              </Trans>
            </Label>
            <MouseoverTooltip text={!canUpdateEnable ? t`Maximum number of Active Alerts reached` : ''}>
              <Toggle
                style={{ transform: 'scale(.8)', cursor: canUpdateEnable ? 'pointer' : 'not-allowed' }}
                icon={<NotificationIcon size={16} color={theme.textReverse} />}
                isActive={isEnabled}
                toggle={toggleEnable}
              />
            </MouseoverTooltip>
          </Flex>
        </RowBetween>

        <Container>
          <Row alignItems={'center'} gap="12px 6px" style={{ flexWrap: 'wrap' }}>
            <Label>
              <Trans>Send me an alert when on </Trans>
            </Label>
            <NetworkLogo chainId={selectChain} style={{ width: 16, height: 16 }} />
            <Value>{NETWORKS_INFO[selectChain].name}</Value>
            <Label>
              <Trans>the price of</Trans>
            </Label>

            <Flex sx={{ gap: '6px' }}>
              <CurrencyLogo currency={currencyIn} size={'16px'} />
              <Value>
                {uint256ToFraction(tokenInAmount, currencyIn.decimals)?.toSignificant(6)} {currencyIn.symbol}
              </Value>
            </Flex>

            <Label>
              <Trans>to</Trans>
            </Label>

            <CurrencyLogo currency={currencyOut} size={'16px'} />
            <Value>{currencyOut.symbol}</Value>

            <Label>
              <Trans>goes</Trans>
            </Label>

            <Value
              style={{
                color: type === PriceAlertType.ABOVE ? theme.primary : theme.red,
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              {type === PriceAlertType.ABOVE ? <ArrowUp size={18} /> : <ArrowDown size={18} />} {type}
            </Value>

            <Value>
              {threshold} {currencyOut.symbol}
            </Value>
          </Row>

          <RowBetween>
            <Label style={{ fontSize: 12 }}>
              <Trans>
                Cooldown: <Value style={{ fontSize: 12 }}>{formatTimeDuration(cooldown)}</Value>
              </Trans>
            </Label>
            {note && (
              <Label style={{ fontSize: 12 }}>
                <Trans>
                  Note: <Value style={{ fontSize: 12 }}>{note}</Value>
                </Trans>
              </Label>
            )}
          </RowBetween>

          {disableAfterTrigger && (
            <Text color={theme.warning} fontSize={12} fontStyle="italic">
              <Trans>This alert will be disabled after its triggered once</Trans>
            </Text>
          )}
        </Container>

        <ButtonPrimary borderRadius="46px" height="36px" width="100%" onClick={onSave}>
          <Trans>View Price Alerts</Trans>
        </ButtonPrimary>
      </Wrapper>
    </Modal>
  )
}
