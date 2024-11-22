import {
  InterfaceElementName,
  InterfaceEventName,
} from "@uniswap/analytics-events";
import { CurrencyAmount, Token } from "@taraswap/sdk-core";
import { ButtonEmphasis, ButtonSize, ThemeButton } from "components/Button";
import Column from "components/Column";
import { CreditCardIcon } from "components/Icons/CreditCard";
import { ImagesIcon } from "components/Icons/Images";
import { Power } from "components/Icons/Power";
import { Settings } from "components/Icons/Settings";
import Row, { AutoRow } from "components/Row";
import { DeltaArrow } from "components/Tokens/TokenDetails/Delta";
import { LoadingBubble } from "components/Tokens/loading";
import { useTokenBalancesQuery } from "graphql/data/apollo/TokenBalancesProvider";
import { useDisableNFTRoutes } from "hooks/useDisableNFTRoutes";
import useENSName from "hooks/useENSName";
import { Trans, t } from "i18n";
import {
  useProfilePageState,
  useSellAsset,
  useWalletCollections,
} from "nft/hooks";
import { ProfilePageStateType } from "nft/types";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ThemedText } from "theme/components";
import Trace from "uniswap/src/features/telemetry/Trace";
import { sendAnalyticsEvent } from "uniswap/src/features/telemetry/send";
import { useUnitagByAddress } from "uniswap/src/features/unitags/hooks";
import { isPathBlocked } from "utils/blockedPaths";
import { NumberType, useFormatter } from "utils/formatNumbers";
import { useAccount, useDisconnect } from "wagmi";
import {
  useCloseModal,
  useFiatOnrampAvailability,
  useOpenModal,
  useToggleModal,
} from "../../state/application/hooks";
import { ApplicationModal } from "../../state/application/reducer";
import {
  useUserHasAvailableClaim,
  useUserUnclaimedAmount,
} from "../../state/claim/hooks";
import { ActionTile } from "./ActionTile";
import IconButton, {
  IconHoverText,
  IconWithConfirmTextButton,
} from "./IconButton";
import MiniPortfolio from "./MiniPortfolio";
import PortfolioRow, {
  portfolioFadeInAnimation,
} from "./MiniPortfolio/PortfolioRow";
import { useAccountDrawer } from "./MiniPortfolio/hooks";
import { Status } from "./Status";
import useGetPortfolio from "./MiniPortfolio/Tokens/useGetPortfolio";
import { formatEther } from "viem";
import { PortfolioLogo } from "./MiniPortfolio/PortfolioLogo";
import { nativeOnChain } from "constants/tokens";
import { TokenBalanceText, TokenNameText } from "./MiniPortfolio/Tokens";

const AuthenticatedHeaderWrapper = styled.div`
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const WalletButton = styled(ThemeButton)`
  border-radius: 12px;
  padding-top: 10px;
  padding-bottom: 10px;
  margin-top: 4px;
  color: white;
  border: none;
`;

const UNIButton = styled(WalletButton)`
  border-radius: 12px;
  padding-top: 10px;
  padding-bottom: 10px;
  margin-top: 4px;
  color: white;
  border: none;
  background: linear-gradient(to right, #9139b0 0%, #4261d6 100%);
`;

const IconContainer = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  & > a,
  & > button {
    margin-right: 8px;
  }

  & > button:last-child {
    margin-right: 0px;
    ${IconHoverText}:last-child {
      left: 0px;
    }
  }
`;

const HeaderWrapper = styled.div`
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const FadeInColumn = styled(Column)`
  ${portfolioFadeInAnimation}
`;

const PortfolioDrawerContainer = styled(Column)`
  flex: 1;
`;

export default function AuthenticatedHeader({
  account,
  openSettings,
}: {
  account: string;
  openSettings: () => void;
}) {
  const { disconnect } = useDisconnect();
  const { ENSName } = useENSName(account);
  const { chainId } = useAccount();
  const navigate = useNavigate();
  const closeModal = useCloseModal();
  const setSellPageState = useProfilePageState(
    (state) => state.setProfilePageState
  );
  const resetSellAssets = useSellAsset((state) => state.reset);
  const clearCollectionFilters = useWalletCollections(
    (state) => state.clearCollectionFilters
  );
  const shouldShowBuyFiatButton = !isPathBlocked("/buy") || chainId === 841;
  const { formatNumber, formatDelta } = useFormatter();

  const shouldDisableNFTRoutes = useDisableNFTRoutes();

  const unclaimedAmount: CurrencyAmount<Token> | undefined =
    useUserUnclaimedAmount(account);
  const isUnclaimed = useUserHasAvailableClaim(account);
  const openClaimModal = useToggleModal(ApplicationModal.ADDRESS_CLAIM);

  const accountDrawer = useAccountDrawer();

  const navigateToProfile = useCallback(() => {
    accountDrawer.close();
    resetSellAssets();
    setSellPageState(ProfilePageStateType.VIEWING);
    clearCollectionFilters();
    navigate("/nfts/profile");
    closeModal();
  }, [
    clearCollectionFilters,
    closeModal,
    navigate,
    resetSellAssets,
    setSellPageState,
    accountDrawer,
  ]);

  const openFiatOnrampModal = useOpenModal(ApplicationModal.FIAT_ONRAMP);
  const openFoRModalWithAnalytics = useCallback(() => {
    accountDrawer.close();
    sendAnalyticsEvent(InterfaceEventName.FIAT_ONRAMP_WIDGET_OPENED);
    openFiatOnrampModal();
  }, [openFiatOnrampModal, accountDrawer]);

  const [shouldCheck, setShouldCheck] = useState(false);
  const {
    available: fiatOnrampAvailable,
    availabilityChecked: fiatOnrampAvailabilityChecked,
    error,
    loading: fiatOnrampAvailabilityLoading,
  } = useFiatOnrampAvailability(shouldCheck, openFoRModalWithAnalytics);

  const handleBuyCryptoClick = useCallback(() => {
    if (!fiatOnrampAvailabilityChecked) {
      setShouldCheck(true);
    } else if (fiatOnrampAvailable) {
      openFoRModalWithAnalytics();
    }
  }, [
    fiatOnrampAvailabilityChecked,
    fiatOnrampAvailable,
    openFoRModalWithAnalytics,
  ]);
  const disableBuyCryptoButton = Boolean(
    error ||
      (!fiatOnrampAvailable && fiatOnrampAvailabilityChecked) ||
      fiatOnrampAvailabilityLoading
  );

  const { data: portfolioBalances } = useTokenBalancesQuery({
    cacheOnly: !accountDrawer.isOpen,
  });
  const portfolio = portfolioBalances?.portfolios?.[0];
  const totalBalance = portfolio?.tokensTotalDenominatedValue?.value;
  const absoluteChange =
    portfolio?.tokensTotalDenominatedValueChange?.absolute?.value;
  const percentChange =
    portfolio?.tokensTotalDenominatedValueChange?.percentage?.value;
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const { unitag } = useUnitagByAddress(account);

  const { nativeBalance } = useGetPortfolio(undefined, account);
  const amount = unclaimedAmount?.toFixed(0, { groupSeparator: "," } ?? "-");
  const nativeCurrency = nativeOnChain(chainId ?? 841);
  return (
    <AuthenticatedHeaderWrapper>
      <HeaderWrapper>
        <Status
          account={account}
          ensUsername={ENSName}
          uniswapUsername={unitag?.username}
        />
        <IconContainer>
          <IconButton
            hideHorizontal={showDisconnectConfirm}
            data-testid="wallet-settings"
            onClick={openSettings}
            Icon={Settings}
          />
          <Trace
            logPress
            element={InterfaceElementName.DISCONNECT_WALLET_BUTTON}
          >
            <IconWithConfirmTextButton
              data-testid="wallet-disconnect"
              onConfirm={disconnect}
              onShowConfirm={setShowDisconnectConfirm}
              Icon={Power}
              text="Disconnect"
              dismissOnHoverOut
            />
          </Trace>
        </IconContainer>
      </HeaderWrapper>
      <PortfolioDrawerContainer>
        {nativeBalance.coin_balance !== undefined ? (
          <FadeInColumn gap="xs">
            <ThemedText.HeadlineLarge
              fontWeight={535}
              data-testid="portfolio-total-balance"
            >
              <PortfolioRow
                left={
                  <PortfolioLogo
                    chainId={nativeCurrency.chainId}
                    currencies={[nativeCurrency]}
                    size={40}
                  />
                }
                title={<TokenNameText>{nativeCurrency.name}</TokenNameText>}
                descriptor={
                  <TokenBalanceText style={{ fontWeight: 535 }}>
                    {Number(
                      formatEther(BigInt(nativeBalance.coin_balance))
                    ).toFixed(6)}{" "}
                  </TokenBalanceText>
                }
                right={<></>}
              />
            </ThemedText.HeadlineLarge>
          </FadeInColumn>
        ) : (
          <Column gap="xs">
            <LoadingBubble height="44px" width="170px" />
            <LoadingBubble height="16px" width="100px" margin="4px 0 20px 0" />
          </Column>
        )}
        {/* <Row
          gap="8px"
          marginBottom={
            !fiatOnrampAvailable && fiatOnrampAvailabilityChecked
              ? "20px"
              : "0px"
          }
        >
          {shouldShowBuyFiatButton && (
            <ActionTile
              dataTestId="wallet-buy-crypto"
              Icon={<CreditCardIcon />}
              name={t("common.buy.label")}
              onClick={handleBuyCryptoClick}
              disabled={disableBuyCryptoButton}
              loading={fiatOnrampAvailabilityLoading}
              error={Boolean(
                !fiatOnrampAvailable && fiatOnrampAvailabilityChecked
              )}
              errorMessage={t("common.restricted.region")}
              errorTooltip={t("moonpay.restricted.region")}
            />
          )}
          {!shouldDisableNFTRoutes && (
            <ActionTile
              dataTestId="nft-view-self-nfts"
              Icon={<ImagesIcon />}
              name={t("nft.view")}
              onClick={navigateToProfile}
            />
          )}
        </Row> */}
        <MiniPortfolio account={account} />
        {/* {isUnclaimed && (
          <UNIButton
            onClick={openClaimModal}
            size={ButtonSize.medium}
            emphasis={ButtonEmphasis.medium}
          >
            <Trans
              i18nKey="account.authHeader.claimReward"
              values={{ amount }}
            />
          </UNIButton>
        )} */}
      </PortfolioDrawerContainer>
    </AuthenticatedHeaderWrapper>
  );
}
