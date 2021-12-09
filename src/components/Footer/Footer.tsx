import React from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import TwitterIcon from 'components/Icons/TwitterIcon'
import Discord from 'components/Icons/Discord'
import { Telegram } from 'components/Icons'
import { KYBER_NETWORK_DISCORD_URL, KYBER_NETWORK_TWITTER_URL } from 'constants/index'
import useTheme from 'hooks/useTheme'
import Medium from 'components/Icons/Medium'
import { ExternalLink } from 'theme'
import { Trans, t } from '@lingui/macro'
import PoweredByIconDark from 'components/Icons/PoweredByIconDark'
import { useIsDarkMode } from 'state/user/hooks'
import PoweredByIconLight from 'components/Icons/PoweredByIconLight'
import InfoHelper from 'components/InfoHelper'
import { useMedia } from 'react-use'

const FooterWrapper = styled.div`
  background: ${({ theme }) => theme.buttonGray + '33'};
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    margin-bottom: 4rem;
  `};
`

const FooterContent = styled.div`
  display: flex;
  justify-content: space-between;
  margin: auto;
  align-items: center;
  width: 100%;
  padding: 16px;
  flex-direction: column-reverse;

  @media only screen and (min-width: 768px) {
    flex-direction: row;
    padding: 16px 16px;
  }

  @media only screen and (min-width: 1000px) {
    padding: 16px 32px;
  }

  @media only screen and (min-width: 1366px) {
    padding: 16px 215px;
  }

  @media only screen and (min-width: 1440px) {
    padding: 16px 252px;
  }
`

const InfoWrapper = styled.div`
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: ${({ theme }) => theme.subText + '33'};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-top: 16px;
    gap: 24px;
  `};
`

const Separator = styled.div`
  width: 1px;
  background: ${({ theme }) => theme.border};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none
  `}
`

const Item = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.subText};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    gap: 12px;
  `};
`

export const FooterSocialLink = () => {
  const theme = useTheme()
  return (
    <Flex alignItems="center" justifyContent="center" sx={{ gap: '24px' }}>
      <ExternalLink href="https://t.me/kybernetwork">
        <Telegram size={16} color={theme.subText} />
      </ExternalLink>
      <ExternalLink href={KYBER_NETWORK_TWITTER_URL}>
        <TwitterIcon color={theme.subText} />
      </ExternalLink>
      <ExternalLink href={KYBER_NETWORK_DISCORD_URL}>
        <Discord />
      </ExternalLink>
      <ExternalLink href={`https://blog.kyber.network`}>
        <Medium />
      </ExternalLink>
    </Flex>
  )
}

function Footer() {
  const isDarkMode = useIsDarkMode()
  const theme = useTheme()
  const above768 = useMedia('(min-width: 768px)')
  return (
    <FooterWrapper>
      <FooterContent>
        <InfoWrapper>
          <Item>
            <Text marginRight="6px">
              <Trans>Powered By</Trans>
            </Text>
            <ExternalLink href="https://kyber.network" style={{ display: 'flex' }}>
              {isDarkMode ? <PoweredByIconDark width={48} /> : <PoweredByIconLight width={48} />}
            </ExternalLink>
          </Item>
          <Separator />

          <Item>
            <Text marginRight="6px" display="flex">
              <Trans>Audited By</Trans>
              {!above768 && <InfoHelper size={14} text={t`Covers smart-contracts`} placement="top" />}
            </Text>
            <ExternalLink
              href="https://chainsecurity.com/security-audit/kyber-network-dynamic-market-maker-dmm/"
              style={{ display: 'flex' }}
            >
              <img
                src={
                  !isDarkMode
                    ? 'https://chainsecurity.com/wp-content/themes/chainsecurity-wp/resources/images/temp/logo.svg'
                    : require('../../assets/svg/chainsecurity.svg')
                }
                alt=""
                width="98px"
              />
            </ExternalLink>
            {above768 && <InfoHelper size={14} text={t`Covers smart-contracts`} placement="top" />}
          </Item>
          <Separator />
          <Item>
            <Text marginRight="6px" display="flex">
              <Trans>Insured by</Trans>
              {!above768 && <InfoHelper size={14} text={t`Covers smart-contracts`} placement="top" />}
            </Text>

            <ExternalLink
              href="https://medium.com/unslashed/kyber-network-and-unslashed-finance-partner-over-a-20m-native-insurance-to-protect-kyber-network-df543045a97c"
              style={{ display: 'flex' }}
            >
              <svg width="86" height="18" viewBox="0 0 86 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M36.8408 12.3023L37.6405 11.1163C37.6405 11.1163 38.5202 12.0333 39.6627 12.0333C40.2796 12.0333 40.8394 11.691 40.8394 10.9818C40.8394 10.3096 40.1223 9.97881 39.3089 9.60359C38.2432 9.11199 37.0122 8.54414 37.0122 7.03244C37.0122 5.58965 38.1775 4.51367 39.7312 4.51367C41.1867 4.51367 41.9989 5.28319 42.1333 5.42168L42.1532 5.44291L41.5135 6.72679C41.5135 6.72679 40.7366 5.96871 39.7198 5.96871C39.0343 5.96871 38.4974 6.39664 38.4974 7.00798C38.4974 7.66574 39.1929 7.97358 39.9901 8.32641C41.0601 8.79997 42.3132 9.35458 42.3132 10.9451C42.3132 12.3268 41.3307 13.4884 39.6398 13.4884C37.9972 13.4884 37.0263 12.5062 36.8648 12.3294L36.8408 12.3023ZM20.2866 10.2238C20.2866 12.1679 21.6005 13.4884 23.5655 13.4884C25.5191 13.4884 26.8329 12.1679 26.8329 10.2238V4.66043H25.3591V10.2115C25.3591 11.3854 24.6394 12.0456 23.554 12.0456C22.4687 12.0456 21.7604 11.3854 21.7604 10.2238V4.66043H20.2866V10.2238ZM28.775 13.3417H30.2487V8.34081C30.2487 7.82724 30.1687 6.99579 30.1687 6.99579H30.1916L30.2587 7.14697C30.3785 7.4127 30.6377 7.97027 30.8657 8.34081L33.9389 13.3417H35.4012V4.66043H33.9389V9.67355C33.9389 10.1871 34.0188 11.0185 34.0188 11.0185H33.996L33.9288 10.8673C33.8091 10.6017 33.5499 10.0441 33.3219 9.67355L30.2487 4.66043H28.775V13.3417ZM43.7868 13.3417H48.768V11.9845H45.2606V4.66043H43.7868V13.3417ZM56.445 13.3417H54.9258L54.2403 11.1163H51.3955L50.71 13.3417H49.1906L52.0467 4.66043H53.5892L56.445 13.3417ZM52.8122 6.16406H52.835L52.8787 6.37485C52.9392 6.66001 53.0524 7.17178 53.1551 7.50908L53.8745 9.83223H51.7497L52.4694 7.50908L52.4858 7.45779C52.6416 6.96263 52.8122 6.16406 52.8122 6.16406ZM56.868 12.3023L57.6679 11.1163C57.6679 11.1163 58.5471 12.0333 59.69 12.0333C60.3067 12.0333 60.8667 11.691 60.8667 10.9818C60.8667 10.3096 60.1495 9.97881 59.336 9.60359C58.2701 9.11199 57.039 8.54414 57.039 7.03244C57.039 5.58965 58.2046 4.51367 59.7582 4.51367C61.214 4.51367 62.026 5.28319 62.1604 5.42168L62.18 5.44291L61.5406 6.72679C61.5406 6.72679 60.7635 5.96871 59.7466 5.96871C59.0616 5.96871 58.5243 6.39664 58.5243 7.00798C58.5243 7.66574 59.2199 7.97358 60.0172 8.32641C61.0872 8.79997 62.3404 9.35458 62.3404 10.9451C62.3404 12.3268 61.3579 13.4884 59.6667 13.4884C58.0061 13.4884 57.0321 12.4845 56.8871 12.3239L56.868 12.3023ZM63.8143 13.3417H65.288V9.698H69.0008V13.3417H70.4745V4.66043H69.0008V8.34081H65.288V4.66043H63.8143V13.3417ZM77.5692 13.3417H72.5309V4.66043H77.386V6.01766H74.0046V8.2919H76.7349V9.64909H74.0046V11.9845H77.5692V13.3417ZM79.1001 13.3417H81.8649C84.3666 13.3417 86.0002 11.7277 86.0002 8.98884C86.0002 6.24994 84.3666 4.66043 81.8649 4.66043H79.1001V13.3417ZM80.5739 6.0173V11.9841H81.785C83.4297 11.9841 84.481 10.9448 84.481 8.98848C84.481 7.05657 83.4069 6.0173 81.785 6.0173H80.5739Z"
                  fill={theme.subText}
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.0616 0C10.3066 0.542105 12.6773 0.542105 16.0156 3.07096V7.52505C16.0156 15.5629 12.176 15.5629 8.05837 17.9978C3.0951 15.5584 0 14.8871 0 7.52505V3.07096C3.41975 0.543376 5.78482 0.542105 8.0616 0ZM8.57089 6.34084L8.38683 6.34237V15.8558L8.53553 15.759C9.55595 15.0777 10.1481 14.3019 10.3119 13.4315L10.3067 8.67341L10.4732 8.70358C11.252 8.86201 12.0554 9.2676 12.8834 9.92029C13.0079 8.63709 12.6253 7.75404 11.7354 7.27116C10.5414 6.62324 9.42525 6.31368 8.38683 6.34237L8.57089 6.34084ZM7.70109 2.05991C7.14533 2.11412 6.48851 2.24964 5.7812 2.46648L5.79538 10.2346C5.79538 10.8185 5.35857 11.2757 4.80603 11.2757C4.25352 11.2757 3.8649 10.7946 3.8649 10.2457V3.07635C3.00366 3.51907 2.35528 3.91065 1.91978 4.25109C1.91978 12.7394 1.67658 12.132 7.70109 15.8559V2.05991ZM8.38683 2.05991V4.22886L8.62996 4.26105C11.2001 4.62293 13.0222 5.57898 14.0963 7.12912C14.3063 5.53049 14.0367 4.45535 13.2875 3.90364C12.0686 3.00596 10.435 2.39138 8.38683 2.05991Z"
                  fill={theme.subText}
                />
              </svg>
            </ExternalLink>
            {above768 && <InfoHelper size={14} text={t`Covers smart-contracts`} placement="top" />}
          </Item>
        </InfoWrapper>
        <FooterSocialLink />
      </FooterContent>
    </FooterWrapper>
  )
}

export default Footer
