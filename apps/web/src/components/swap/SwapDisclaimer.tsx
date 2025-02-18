import Column from "components/Column";
import { Trans } from "i18n";
import styled from "styled-components";
import { ExternalLink, ThemedText } from "theme/components";

const Container = styled(Column)`
  background-color: ${({ theme }) => theme.surface2};
  border-radius: 12px;
  padding: 12px;
  margin-top: 12px;
`;

const DisclaimerText = styled(ThemedText.LabelMicro)`
  line-height: 16px;
`;

export function SwapDisclaimer({ className }: { className?: string }) {
  return (
    <Container gap="sm" className={className}>
      <DisclaimerText lineHeight="22px">
        By using Taraswap, you agree to our{" "}
        <ExternalLink href="https://docs.taraswap.info/docs/terms-of-service">
          Terms of Service
        </ExternalLink>{" "}
        and{" "}
        <ExternalLink href="https://docs.taraswap.info/docs/privacy-policy">
          Privacy Policy
        </ExternalLink>
        .
      </DisclaimerText>
    </Container>
  );
}
