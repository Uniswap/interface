import Column from "components/Column";
import { BlockedIcon } from "components/TokenSafety/TokenSafetyIcon";
import { Trans } from "i18n";
import styled, { useTheme } from "styled-components";
import { CopyHelper, ExternalLink, ThemedText } from "theme/components";

import { Text } from "ui/src";
import Modal from "../Modal";

const ContentWrapper = styled(Column)`
  align-items: center;
  margin: 32px;
  text-align: center;
  font-size: 12px;
`;
interface ConnectedAccountBlockedProps {
  account?: string | null;
  isOpen: boolean;
}

export default function ConnectedAccountBlocked(
  props: ConnectedAccountBlockedProps
) {
  const theme = useTheme();
  return (
    <Modal isOpen={props.isOpen} onDismiss={Function.prototype()}>
      <ContentWrapper>
        <BlockedIcon size="22px" />
        <ThemedText.DeprecatedLargeHeader
          lineHeight={2}
          marginBottom={1}
          marginTop={1}
        >
          <Trans i18nKey="common.blockedAddress" />
        </ThemedText.DeprecatedLargeHeader>
        <Text color="$neutral2" fontSize={12} mb={12}>
          {props.account}
        </Text>
        <ThemedText.DeprecatedMain fontSize={14} marginBottom={12}>
          <Trans i18nKey="common.blocked.reason" />{" "}
          <Trans i18nKey="common.blocked.activities" />.
        </ThemedText.DeprecatedMain>
        <ThemedText.DeprecatedMain fontSize={12}>
          <Trans i18nKey="common.blocked.ifError" />{" "}
        </ThemedText.DeprecatedMain>

        <CopyHelper
          toCopy="compliance@taraswap.app"
          fontSize={14}
          iconSize={16}
          color={theme.accent1}
          iconPosition="right"
        >
          compliance@taraswap.app
        </CopyHelper>
      </ContentWrapper>
    </Modal>
  );
}
