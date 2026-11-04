# Token Protection scenarios — Fee-on-transfer & honeypot warnings

Fee-on-transfer (FoT) tiers and honeypot detection. Severity is derived in
`safetyUtils.getTokenProtectionWarning` from the token's buy/sell fee percent against the
breakpoints `TOKEN_PROTECTION_FOT_FEE_BREAKPOINT=15`, `TOKEN_PROTECTION_FOT_HIGH_FEE_BREAKPOINT=80`,
`TOKEN_PROTECTION_FOT_HONEYPOT_BREAKPOINT=100`. The pure severity/enum mapping is unit-covered by
`token-protection-severity-mapping-unit` (unit-integration.md); the Testlio-sourced cases below carry
the manual modal/UX half at e2e level. Shared defaults: `_defaults.yaml`.

---
id: token-protection-fot-low-fee-warning
title: Low fee-on-transfer token shows a medium "fee detected" warning
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Testlio wallet suites 'Fee on Transfer Token - iOS/Android', 'Fee on Transfer Token - Extension', 'Low Fee token - Extension'. The FotLow severity mapping is unit-covered by safetyUtils.test.ts ('getTokenWarningSeverity > should return Medium for low fee on transfer' and the getFeeWarning it.each FotLow rows), catalogued at unit level in token-protection-severity-mapping-unit — this case carries the modal UX at e2e level. Not e2e-automatable today: FoT flagging depends on live Blockaid/fees-DB token data with no e2e mock harness."
testlioRef: "Fee on Transfer Token - iOS/Android; Fee on Transfer Token - Extension; Low Fee token - Extension"
# scope
chains:
  - ethereum
  - bnb
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - fee-on-transfer
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/tokens/warnings/safetyUtils.ts
  - packages/uniswap/src/features/tokens/warnings/TokenWarningModal.tsx
  - packages/uniswap/src/features/transactions/TransactionDetails/utils/getFeeSeverity.ts
automationRefs: []
---

> **medium · e2e · release · manual** · chains: ethereum, bnb

**Given** a token with a buy/sell fee greater than 0% and below the 15% high-fee breakpoint (a low FoT token)
**When** the user opens the token in the swap token selector / TDP and starts a swap
**Then** a "Fee detected" warning modal is shown with the token's buy/sell fee percent and Go Back / Continue CTAs, and after Continue the user can proceed to the swap review with the same fee reflected in the transaction details

---
id: token-protection-fot-high-fee-warning
title: High fee-on-transfer token (>=15%) shows a high-severity fee warning
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'High Warning Token with 15% - iOS/Android' plus the web Testlio feature 'Token Protection'. The 15-80% FotHigh tier's unit coverage is the getFeeWarning it.each breakpoint rows ('15% -> FotHigh', '50% -> FotHigh', '79.9% -> FotHigh') in safetyUtils.test.ts, catalogued at unit level in token-protection-severity-mapping-unit. An earlier revision cited 'getTokenWarningSeverity > should return High for very high fee on transfer', which uses an 81% fee and exercises the FotVeryHigh tier — wrong tier, removed. Manual at e2e level: no automated test exercises the review-card UX."
testlioRef: "High Warning Token with 15% - iOS/Android; Token Protection"
# scope
chains:
  - ethereum
  - bnb
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - fee-on-transfer
wallets:
  - TW-TOKENPROTECTION-01
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/tokens/warnings/safetyUtils.ts
  - packages/uniswap/src/features/tokens/warnings/TokenWarningModal.tsx
  - packages/uniswap/src/features/transactions/TransactionDetails/SwapReviewTokenWarningCard.tsx
automationRefs: []
---

> **high · e2e · release · manual** · chains: ethereum, bnb

**Given** test wallet TW-TOKENPROTECTION-01 (funded, native gas on Ethereum + BNB) and a token whose fee-on-transfer is at or above the 15% breakpoint
**When** the user selects the token for a swap and reaches the review screen
**Then** the high-severity fee warning card shows the buy/sell fee percent, the copy notes Uniswap Labs does not receive the fee, and the fee shown in review matches the token warning

---
id: token-protection-fot-very-high-fee-warning
title: Very high fee-on-transfer token (>=80%) is flagged high severity
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Derived from existing unit tests in safetyUtils.test.ts, including the Blockaid-fees fallback path where the fees DB has no data."
# scope
chains:
  - ethereum
  - bnb
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - fee-on-transfer
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/tokens/warnings/safetyUtils.ts
automationRefs:
  - path: packages/uniswap/src/features/tokens/warnings/safetyUtils.test.ts
    testName: getTokenWarningSeverity > should return High for very high fee on transfer
  - path: packages/uniswap/src/features/tokens/warnings/safetyUtils.test.ts
    testName: getTokenWarningSeverity > should return High for very high fee on transfer even if our fees DB doesnt have fees data
---

> **high · unit · pr-check · automated** · chains: ethereum, bnb

**Given** a token whose fee-on-transfer is at or above the 80% very-high breakpoint (including the case where our fees DB has no data but Blockaid reports high fees / a Malicious+HighFees attack type)
**When** the token protection warning is computed
**Then** `getTokenProtectionWarning` returns `FotVeryHigh`, which maps to `WarningSeverity.High`, so the high-severity fee treatment is applied everywhere the warning surfaces

---
id: token-protection-honeypot-100-fee
title: Honeypot token (100% sell fee) is flagged malicious and blocks value extraction
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Honeypot Warning' plus the web Testlio feature 'Token Protection'. The 100% breakpoint mapping is unit-covered in safetyUtils.test.ts by the getFeeWarning it.each row '100% -> MaliciousHoneypot' (the it.each('%s') title renders as the fee number) and the getTokenProtectionWarning it.each row '100% fee -> MaliciousHoneypot', catalogued at unit level in token-protection-severity-mapping-unit. A previously cited test name ('getFeeWarning > returns MaliciousHoneypot at the 100 breakpoint') does not exist and was removed. Manual at e2e level: honeypot flagging depends on live Blockaid/fees data with no e2e mock harness."
testlioRef: "Honeypot Warning; Token Protection"
# scope
chains:
  - ethereum
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - honeypot
  - funds-loss
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/tokens/warnings/safetyUtils.ts
  - packages/uniswap/src/features/tokens/warnings/TokenWarningModal.tsx
automationRefs: []
---

> **urgent · e2e · release · manual** · chains: ethereum

**Given** a token whose sell fee equals the 100% honeypot breakpoint
**When** the user searches for or attempts to swap the token
**Then** the malicious/honeypot warning modal is shown before review, its copy explains the 100% sell fee would trap the funds, and the flow warns before any value-losing trade can be signed

---
id: token-protection-potential-honeypot-warning
title: Potential-honeypot attack type shows a medium warning
# importance
priority: high
severity: medium
# provenance
source: existing-unit
sourceNote: "Derived from existing unit tests in safetyUtils.test.ts covering both the severity mapping and the potential-honeypot copy hooks."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - honeypot
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/tokens/warnings/safetyUtils.ts
  - packages/uniswap/src/features/dataApi/utils/getCurrencySafetyInfo.ts
automationRefs:
  - path: packages/uniswap/src/features/tokens/warnings/safetyUtils.test.ts
    testName: getTokenWarningSeverity > should return Medium for potential honeypot
  - path: packages/uniswap/src/features/tokens/warnings/safetyUtils.test.ts
    testName: useModalHeaderText > returns correct text for potential honeypot
  - path: packages/uniswap/src/features/tokens/warnings/safetyUtils.test.ts
    testName: useCardSubtitleText > returns correct text for potential honeypot warning
---

> **high · unit · pr-check · automated** · platforms: web, extension, mobile

**Given** a token whose safety info carries `AttackType.Honeypot` (without a 100% fee)
**When** the token protection warning and its copy hooks are computed
**Then** `getTokenProtectionWarning` returns `PotentialHoneypot`, which maps to `WarningSeverity.Medium`, and the copy hooks resolve the potential-honeypot strings (`token.safety.warning.potentialHoneypot.title` for the modal header and `token.safety.warning.potentialHoneypot.card.message` for the card subtitle)

---
id: token-protection-warning-copy-unit
title: Warning modal and card copy render correctly per warning type
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "Documents the existing safetyUtils.test.ts copy-hook describe blocks (useModalHeaderText, useModalSubtitleText, useTokenWarningCardText)."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - unit
  - i18n
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/tokens/warnings/safetyUtils.ts
automationRefs:
  - path: packages/uniswap/src/features/tokens/warnings/safetyUtils.test.ts
    testName: useModalHeaderText
  - path: packages/uniswap/src/features/tokens/warnings/safetyUtils.test.ts
    testName: useModalSubtitleText
  - path: packages/uniswap/src/features/tokens/warnings/safetyUtils.test.ts
    testName: useTokenWarningCardText
---

> **medium · unit · pr-check · automated** · platforms: web, extension, mobile

**Given** a warning type plus token symbols and buy/sell fee percents
**When** the header/subtitle/card copy hooks are rendered
**Then** the correct localized strings are produced per warning type, plural (combined two-token) treatment is used only when both tokens are low or both are blocked, and an error is logged if a second token symbol is passed without plural treatment
