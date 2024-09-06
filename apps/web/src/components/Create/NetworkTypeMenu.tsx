import { ButtonGray } from "components/Button";
import { Pool } from "components/Icons/Pool";
import { FlyoutAlignment, Menu } from "./Menu";
import { Trans } from "i18n";
import { ChevronDown } from "react-feather";
import { useModalIsOpen } from "state/application/hooks";
import { ApplicationModal } from "state/application/reducer";
import styled, { css } from "styled-components";
import { ThemedText } from "theme/components";
import { useState } from "react";

export enum NetworkType {
  Type1 = "Taraxa/Taraswap",
  Type2 = "Coming soon",
}

const PoolVersionItem = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
`;

const PoolOptionsButton = styled(ButtonGray)<{ $isOpen: boolean }>`
  flex: 1 1 auto;
  padding: 10px;
  width: 100%;
  background-color: ${({ theme }) => theme.surface2};
  border: none;
  border-radius: 20px;
  gap: 6px;

  &:hover {
    background-color: ${({ theme, $isOpen }) =>
      $isOpen ? theme.surface1 : theme.surface3};
    opacity: 0.9;
  }

  ${({ $isOpen }) =>
    $isOpen &&
    css`
      background-color: ${({ theme }) => theme.surface1};
      border: ${({ theme }) => `1px solid ${theme.neutral3}`};
    `}
`;

const StyledChevron = styled(ChevronDown)<{ $isOpen: boolean }>`
  transform: ${({ $isOpen }) => ($isOpen ? "rotate(180deg)" : "rotate(0deg)")};
  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => `transform ${duration.fast} ${timing.ease}`};
`;

const menuItems = {
  [NetworkType.Type2]: {
    content: (
      <PoolVersionItem>
        <Pool width="20px" height="20px" />
        <ThemedText.BodyPrimary lineHeight="24px" color="currentColor">
          <Trans i18nKey="common.network.type2" />
        </ThemedText.BodyPrimary>
      </PoolVersionItem>
    ),
    external: false,
  },
  [NetworkType.Type1]: {
    content: (
      <PoolVersionItem>
        <Pool width="20px" height="20px" />
        <ThemedText.BodyPrimary lineHeight="24px" color="currentColor">
          <Trans i18nKey="common.network.type1" />
        </ThemedText.BodyPrimary>
      </PoolVersionItem>
    ),
    external: false,
  },
};

const titles = {
  [NetworkType.Type1]: <Trans i18nKey="common.network.type1" />,
  [NetworkType.Type2]: <Trans i18nKey="common.network.type2" />,
};

export default function NetworkTypeMenu({
  networkType,
}: {
  networkType: NetworkType;
}) {
  const isOpen = useModalIsOpen(ApplicationModal.POOL_VERSION);

  const [networkTypeValue, setNetworkTypeValue] = useState(networkType);

  const handleNetworkTypeChange = (content: any) => {
    if (content === "common.network.type1")
      setNetworkTypeValue(NetworkType.Type1);
    else setNetworkTypeValue(NetworkType.Type2);
  };

  return (
    <Menu
      modal={ApplicationModal.POOL_VERSION}
      menuItems={[
        menuItems[
          networkTypeValue === NetworkType.Type1
            ? NetworkType.Type2
            : NetworkType.Type1
        ],
      ]}
      flyoutAlignment={FlyoutAlignment.LEFT}
      ToggleUI={(props: any) => (
        <PoolOptionsButton {...props} $isOpen={isOpen}>
          <ThemedText.BodyPrimary color="neutral2">
            {titles[networkTypeValue]}
          </ThemedText.BodyPrimary>
          <StyledChevron $isOpen={isOpen} />
        </PoolOptionsButton>
      )}
      onNetworkTypeChange={handleNetworkTypeChange}
    />
  );
}
