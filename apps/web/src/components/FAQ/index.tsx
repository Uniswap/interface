
import styled from 'styled-components'
import { Trans } from 'i18n'
import { AutoColumn } from 'components/Column'
import { ThemedText } from 'theme/components'
import Vested from '../../assets/images/vested_position_web2x.png'

const HeaderText = styled(ThemedText.DeprecatedLabel)`
  align-items: center;
  display: flex;
  font-size: 24px;
  font-weight: 535 !important;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    font-size: 16px;
  `};
`
const ImageWrapper = styled.div`
  display: flex;
  margin-top:20px;
  background-color:#0b181d;
  margin-bottom:20px;
  justify-content: center; // Center the image horizontally
  align-items: center; // Center the image vertically
  flex: 1; // Allow ImageWrapper to take available space
`;

const ResponsiveColumn = styled(AutoColumn)`
  grid-template-columns: 1fr;
  margin-top: 32px;
  width: 100%;
  gap: 8px;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    gap: 8px;
  `};
  justify-content: space-between;
`
export default function FAQ() {
    return (
        <>
            <ResponsiveColumn>
                <HeaderText>
                    → <Trans i18nKey="common.faq.difference.title" />
                </HeaderText>
                <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 20 }}>
                    <Trans i18nKey="common.faq.difference.description" />
                </ThemedText.DeprecatedBody>
            </ResponsiveColumn>
            <ResponsiveColumn>
                <HeaderText>
                    → <Trans i18nKey="common.faq.vesting.title" />
                </HeaderText>
                <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 20 }}>
                    <Trans i18nKey="common.faq.vesting.description" />
                </ThemedText.DeprecatedBody>
            </ResponsiveColumn>
            <ImageWrapper>
                <img src={Vested} alt="Description of image" width={800} />
            </ImageWrapper>
            <ResponsiveColumn>
                <HeaderText>
                    → <Trans i18nKey="common.faq.fork.title" />
                </HeaderText>
                <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 20 }}>
                    <Trans i18nKey="common.faq.fork.description" />
                </ThemedText.DeprecatedBody>
            </ResponsiveColumn>
            <ResponsiveColumn>
                <HeaderText>
                    → <Trans i18nKey="common.faq.support.title" />
                </HeaderText>
                <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 20 }}>
                    <Trans i18nKey="common.faq.support.description" />
                </ThemedText.DeprecatedBody>
            </ResponsiveColumn>
        </>

    )
}
