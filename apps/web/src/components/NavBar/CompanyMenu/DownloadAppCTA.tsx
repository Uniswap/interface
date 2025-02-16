import { InterfaceElementName } from "@uniswap/analytics-events";
import Column from "components/Column";
import { MobileAppLogo } from "components/Icons/MobileAppLogo";
import { NAV_BREAKPOINT } from "components/NavBar/ScreenSizes";
import Row from "components/Row";
import { Trans } from "i18n";
import { Text } from "rebass";
import { useOpenModal } from "state/application/hooks";
import { ApplicationModal } from "state/application/reducer";
import styled from "styled-components";
import { ThemedText } from "theme/components";
import { isWebAndroid, isWebIOS } from "utilities/src/platform";

const DOWNLOAD_PADDING_X = 8;
const DownloadCTA = styled(Row)`
  cursor: pointer;
  padding: 12px ${DOWNLOAD_PADDING_X}px;
  border-radius: 20px;
  transition: all 0.2s;
  box-sizing: content-box;
  transform: translateX(-${DOWNLOAD_PADDING_X}px);
  &:hover {
    background: ${({ theme }) => theme.accent2};
    color: ${({ theme }) => theme.accent1} !important;
  }
  @media screen and (max-width: ${NAV_BREAKPOINT.isMobileDrawer}px) {
    transform: none;
    box-sizing: border-box;
  }
`;
export function DownloadApp({ onClick }: { onClick?: () => void }) {
  const openGetTheAppModal = useOpenModal(ApplicationModal.GET_THE_APP);

  return (
    <DownloadCTA
      href={
        // APP_DOWNLOAD_LINKS[
        //   InterfaceElementName.UNISWAP_WALLET_NAVBAR_MENU_DOWNLOAD_BUTTON
        // ]
        "https://taraswap.app/"
      }
      gap="md"
      onClick={() => {
        if (onClick) {
          onClick();
        }
        if (isWebIOS || isWebAndroid) {
          // openDownloadApp({
          //   element:
          //     InterfaceElementName.UNISWAP_WALLET_NAVBAR_MENU_DOWNLOAD_BUTTON,
          // });
        } else {
          openGetTheAppModal();
        }
      }}
    >
      <MobileAppLogo width={41} height={41} />
      <Column gap="xs">
        <Text lineHeight="20px">
          <Trans i18nKey="common.downloadUniswap" />
        </Text>
        <ThemedText.LabelMicro lineHeight="18px" color="theme.accent1">
          <Trans i18nKey="common.availableOnIOSAndroid" />
        </ThemedText.LabelMicro>
      </Column>
    </DownloadCTA>
  );
}
