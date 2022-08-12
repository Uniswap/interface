import { Trans } from '@lingui/macro'
import React, { useState } from 'react'
import { isMobile } from 'react-device-detect'
import { ChevronDown, Eye } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { Drop, MoneyBagOutline } from 'components/Icons'
import AgriCulture from 'components/Icons/AgriCulture'
import Deposit from 'components/Icons/Deposit'
import { VERSION } from 'constants/v2'
import useTheme from 'hooks/useTheme'
import { ExternalLink, StyledInternalLink } from 'theme'

import { ChevronRight, GuideItem, GuideWrapper, ProMMFarmGuide, ProMMFarmGuideWrapper, ShowGuideBtn } from './styleds'

function FarmGuide({ farmType }: { farmType: VERSION }) {
  const [show, setShow] = useState(!isMobile)
  const theme = useTheme()
  const upToMedium = useMedia('(max-width: 992px)')

  const step1Text =
    farmType === VERSION.ELASTIC ? (
      <Trans>Identify the Elastic farm you would like to participate in</Trans>
    ) : (
      <Trans>Identify the Classic farm you would like to participate in</Trans>
    )

  const step2Text =
    farmType === VERSION.CLASSIC ? (
      <Trans>
        Add liquidity to the corresponding{' '}
        {<StyledInternalLink to="/pools?tab=classic">Classic pool</StyledInternalLink>} to receive Liquidity Provider
        (LP) tokens
      </Trans>
    ) : (
      <Trans>
        Add liquidity to the corresponding{' '}
        {<StyledInternalLink to="/pools?tab=elastic">Elastic pool</StyledInternalLink>} to receive a NFT token that
        represents your liquidity position
      </Trans>
    )
  const step3Text =
    farmType === VERSION.CLASSIC ? (
      <Trans>Stake your LP tokens in the farm you identified earlier</Trans>
    ) : (
      <Trans>Deposit your liquidity position (NFT token) and then stake it into the farm you identified earlier </Trans>
    )

  return (
    <ProMMFarmGuideWrapper>
      <Flex justifyContent="space-between" alignItems="center">
        <ProMMFarmGuide>
          {farmType === VERSION.ELASTIC ? (
            <>
              <Trans>
                Deposit your liquidity position (NFT token) from the Elastic Pools here, and then stake it to earn even
                more attractive farming rewards.
              </Trans>

              {(!upToMedium || !show) && (
                <ExternalLink href="https://docs.kyberswap.com/guides/how-to-farm">
                  {' '}
                  <Trans>Learn More ↗</Trans>
                </ExternalLink>
              )}
            </>
          ) : (
            <>
              <Trans>
                Deposit your liquidity from the Classic Pools here to earn even more attractive farming rewards.
              </Trans>
              {(!upToMedium || !show) && (
                <ExternalLink href="https://docs.kyberswap.com/classic/guides/yield-farming-guide">
                  {' '}
                  <Trans>Learn More ↗</Trans>
                </ExternalLink>
              )}
            </>
          )}
        </ProMMFarmGuide>

        <ShowGuideBtn onClick={() => setShow(prev => !prev)} show={show}>
          <ChevronDown />
        </ShowGuideBtn>
      </Flex>

      <GuideWrapper show={show}>
        <GuideItem>
          <Flex marginBottom="0.5rem" alignItems="center" sx={{ gap: '8px' }}>
            <Eye size={20} color={theme.primary} />
            <Text flex={1}>
              <Text color={theme.text} fontWeight="500" as="span">
                STEP 1
              </Text>
              {upToMedium && <>: {step1Text} </>}
            </Text>
          </Flex>
          {!upToMedium && step1Text}
        </GuideItem>
        <ChevronRight />

        <GuideItem>
          <Flex marginBottom="0.5rem" alignItems="center" sx={{ gap: '8px' }}>
            <Drop size={20} />
            <Text flex={1}>
              <Text fontWeight="500" color={theme.text} as="span">
                STEP 2
              </Text>
              {upToMedium && <>: {step2Text}</>}
            </Text>
          </Flex>
          {!upToMedium && step2Text}
        </GuideItem>
        <ChevronRight />

        <GuideItem>
          <Flex marginBottom="0.5rem" alignItems="center" sx={{ gap: '8px' }} color={theme.primary}>
            <Deposit width={20} height={20} />
            <Text color={theme.subText} flex={1}>
              <Text fontWeight="500" color={theme.text} as="span">
                STEP 3
              </Text>
              {upToMedium && <>: {step3Text}</>}
            </Text>
          </Flex>
          {!upToMedium && step3Text}
        </GuideItem>

        <ChevronRight />

        <GuideItem>
          <Flex marginBottom="0.5rem" alignItems="center" sx={{ gap: '8px' }}>
            <AgriCulture color={theme.primary} width={20} height={20} />
            <Text flex={1}>
              <Text fontWeight="500" color={theme.text} as="span">
                STEP 4
              </Text>

              {upToMedium && (
                <>
                  : <Trans>Harvest your farming rewards whenever you want</Trans>
                </>
              )}
            </Text>
          </Flex>
          {!upToMedium && <Trans>Harvest your farming rewards whenever you want</Trans>}
        </GuideItem>

        <ChevronRight />
        <GuideItem>
          <Flex marginBottom="0.5rem" alignItems="center" sx={{ gap: '8px' }}>
            <MoneyBagOutline size={20} color={theme.primary} />
            <Text flex={1}>
              <Text fontWeight="500" color={theme.text} as="span">
                STEP 5
              </Text>
              {upToMedium && (
                <>
                  : <Trans>Claim your farming rewards! (Note: some farms may have a vesting period)</Trans>
                </>
              )}
            </Text>
          </Flex>
          {!upToMedium && <Trans>Claim your farming rewards! (Note: some farms may have a vesting period)</Trans>}
        </GuideItem>

        {upToMedium && (
          <Flex justifyContent="flex-end">
            {farmType === VERSION.ELASTIC ? (
              <ExternalLink href="https://docs.kyberswap.com/guides/how-to-farm">
                <Trans>Learn More ↗</Trans>
              </ExternalLink>
            ) : (
              <ExternalLink href="https://docs.kyberswap.com/classic/guides/yield-farming-guide">
                <Trans>Learn More ↗</Trans>
              </ExternalLink>
            )}
          </Flex>
        )}
      </GuideWrapper>
    </ProMMFarmGuideWrapper>
  )
}

export default FarmGuide
