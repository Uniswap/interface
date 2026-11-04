# Token Protection scenarios — Malicious, blocked & low-warning tokens

Blockaid protection-result / token-list driven warnings: malicious (impersonator, general),
blocked (swap + buy disabled), spam airdrop, and the low / non-default "always do your research"
warning with per-token dismissal. The pure severity mapping is unit-covered by
`token-protection-severity-mapping-unit` (unit-integration.md). Shared defaults: `_defaults.yaml`.

---
id: token-protection-malicious-impersonator-warning
title: Malicious impersonator token shows a high-severity warning
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "Testlio wallet suites 'Malicous Token - iOS/Android' and 'Malicous Token - Extension' (suite titles carry the repo's original spelling). The MaliciousImpersonator severity mapping and card copy are unit-covered by safetyUtils.test.ts ('getTokenWarningSeverity > should return High for malicious impersonator', 'useCardSubtitleText > returns correct text for impersonator warning'), catalogued at unit level in token-protection-severity-mapping-unit / token-protection-warning-copy-unit — this case carries the modal UX at e2e level. Manual: malicious flagging depends on live Blockaid data."
testlioRef: "Malicous Token - iOS/Android; Malicous Token - Extension"
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - malicious
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

> **high · e2e · release · manual** · platforms: web, extension, mobile

**Given** a token whose safety info has `ProtectionResult.Malicious`/`Spam` with `AttackType.Impersonator`
**When** the user opens the token (TDP) or attempts to swap it
**Then** a "malicious token detected" modal is shown noting it is not listed on leading US CEXs, and the impersonator warning copy renders on both the warning card and the modal

---
id: token-protection-malicious-general-review-ack
title: Malicious token swap requires explicit "I understand" acknowledgement in review
# importance
priority: urgent
severity: high
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Malicous Token - iOS/Android'. No automated coverage at any level for the review-screen acknowledgement gate; the ack-checkbox logic (getShouldDisplayTokenWarningCard + SwapReviewTokenWarningCard) is a candidate for future integration-level automation, but none exists today."
testlioRef: "Malicous Token - iOS/Android"
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - malicious
  - review
wallets:
  - TW-TOKENPROTECTION-01
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/tokens/warnings/safetyUtils.ts
  - packages/uniswap/src/features/transactions/TransactionDetails/SwapReviewTokenWarningCard.tsx
  - packages/uniswap/src/features/transactions/TransactionDetails/utils/getShouldDisplayTokenWarningCard.ts
automationRefs: []
---

> **urgent · e2e · release · manual** · platforms: web, extension, mobile

**Given** test wallet TW-TOKENPROTECTION-01 (funded signer) and a token flagged `MaliciousGeneral`
**When** the user dismisses the pre-swap warning modal (Continue), enters an amount, and taps Review
**Then** the review screen shows the malicious token warning card, the Swap CTA is disabled until the user checks the "I understand" acknowledgement box, and only after checking it can the swap be signed and submitted

---
id: token-protection-blocked-token-swap-disabled
title: Blocked token produces a blocking swap warning
# importance
priority: urgent
severity: urgent
# provenance
source: testlio
sourceNote: "Testlio wallet suites 'Blocked Token Warning - iOS/Android' and 'Blocked Token - Extension' plus the web Testlio feature 'Token Protection'. This case pins the blocking-warning computation at unit level; the user-visible 'token not available' modal and disabled-buy UX are carried at e2e level by token-protection-blocked-token-buy-disabled."
testlioRef: "Blocked Token Warning - iOS/Android; Blocked Token - Extension; Token Protection"
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - blocked
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/tokens/warnings/safetyUtils.ts
  - packages/uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getTokenBlockedWarning.ts
automationRefs:
  - path: packages/uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getTokenBlockedWarning.test.ts
    testName: getTokenBlockedWarning > returns warning when input token is blocked
  - path: packages/uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getTokenBlockedWarning.test.ts
    testName: getTokenBlockedWarning > returns warning when output token is blocked
---

> **urgent · unit · pr-check · automated** · platforms: web, extension, mobile

**Given** a token on the Blocked token list is selected as the swap input or output
**When** the swap warnings are computed for the pair
**Then** `getTokenProtectionWarning` returns `Blocked` (`WarningSeverity.Blocked`) and `getTokenBlockedWarning` returns a blocking warning naming the blocked token symbol (with fallback text when the symbol is missing), so the swap cannot be submitted

---
id: token-protection-blocked-token-buy-disabled
title: Blocked token TDP shows unavailable message with buy disabled
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Blocked Token Warning - iOS/Android'. Manual: the TDP blocked-state UX has no automated coverage; the underlying blocking-warning computation is unit-covered via token-protection-blocked-token-swap-disabled."
testlioRef: "Blocked Token Warning - iOS/Android"
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - blocked
  - tdp
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

> **high · e2e · release · manual** · platforms: web, extension, mobile

**Given** a blocked token address is searched from the token selector
**When** the user opens the token detail page and taps the blocked warning message
**Then** the TDP shows "you cannot trade this token using Uniswap Wallet", the "not available" modal is displayed, and the Buy/Swap button is disabled

---
id: token-protection-low-nondefault-do-your-research
title: Non-default (low) token shows "always do your research" warning
# importance
priority: medium
severity: low
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Low Warning Token - iOS/Android' plus the web Testlio feature 'Token Protection'. The NonDefault severity mapping is unit-covered by safetyUtils.test.ts ('getTokenWarningSeverity > should return Low for non-default token'), catalogued at unit level in token-protection-severity-mapping-unit — this case carries the modal UX at e2e level. Manual: no automated test exercises the modal flow."
testlioRef: "Low Warning Token - iOS/Android; Token Protection"
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - low-warning
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

> **medium · e2e · release · manual** · platforms: web, extension, mobile

**Given** a token that is on the non-default token list (not traded on leading US centralised exchanges)
**When** the user selects the token to swap
**Then** the "Always do your research" modal with the "not traded on leading US CEX" message and Go Back / Continue CTAs is shown, and Continue proceeds to the swap modal

---
id: token-protection-low-warning-dismissal-persists
title: "\"Don't show me this warning again\" suppresses the low warning per token"
# importance
priority: medium
severity: medium
# provenance
source: testlio
sourceNote: "Testlio wallet suite 'Low Warning Token - iOS/Android'. Manual: the dismissal persistence flow (warnings slice + useWarningModalCurrenciesDismissed) has no automated coverage at e2e level."
testlioRef: "Low Warning Token - iOS/Android"
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - low-warning
  - dismissal
# execution
automatable: false
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/tokens/warnings/TokenWarningModal.tsx
  - packages/uniswap/src/features/tokens/warnings/hooks/useWarningModalCurrenciesDismissed.ts
  - packages/uniswap/src/features/tokens/warnings/slice/slice.ts
automationRefs: []
---

> **medium · e2e · release · manual** · platforms: web, extension, mobile

**Given** a low / non-default token whose warning modal is showing
**When** the user checks "Do not show me this warning again" and taps Continue
**Then** the token address is recorded as dismissed in the warnings slice, the swap is allowed, and re-selecting the same token no longer re-prompts the low warning

---
id: token-protection-spam-airdrop-warning
title: Spam airdrop token shows a medium warning
# importance
priority: low
severity: medium
# provenance
source: existing-unit
sourceNote: "Derived from existing unit tests in safetyUtils.test.ts covering both the severity mapping and the spam warning card copy."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - spam
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/tokens/warnings/safetyUtils.ts
automationRefs:
  - path: packages/uniswap/src/features/tokens/warnings/safetyUtils.test.ts
    testName: getTokenWarningSeverity > should return Medium for spam airdrop
  - path: packages/uniswap/src/features/tokens/warnings/safetyUtils.test.ts
    testName: useTokenWarningCardText > returns correct text for spam airdrop warning
---

> **low · unit · pr-check · automated** · platforms: web, extension, mobile

**Given** a token whose safety info has `ProtectionResult.Spam` with `AttackType.Airdrop`
**When** the token protection warning and card copy are computed
**Then** `getTokenProtectionWarning` returns `SpamAirdrop`, which maps to `WarningSeverity.Medium`, and `useTokenWarningCardText` resolves the spam strings (`token.safety.warning.spam.title` heading and `token.safety.warning.spam.message` description)

---
id: token-protection-severity-mapping-unit
title: Warning-severity mapping is correct across all protection tiers
# importance
priority: high
severity: high
# provenance
source: existing-unit
sourceNote: "Documents the existing safetyUtils.test.ts describe blocks (getTokenWarningSeverity, getTokenProtectionWarning, getFeeWarning it.each suites), cited at describe level because the it.each('%s') rows render as their input values."
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - token-protection
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/tokens/warnings/safetyUtils.ts
automationRefs:
  - path: packages/uniswap/src/features/tokens/warnings/safetyUtils.test.ts
    testName: getTokenWarningSeverity
  - path: packages/uniswap/src/features/tokens/warnings/safetyUtils.test.ts
    testName: getTokenProtectionWarning
  - path: packages/uniswap/src/features/tokens/warnings/safetyUtils.test.ts
    testName: getFeeWarning
---

> **high · unit · pr-check · automated** · platforms: web, extension, mobile

**Given** currency infos spanning every protection tier (none, native, non-default, low/high/very-high FoT, honeypot, potential honeypot, spam airdrop, malicious impersonator/general, blocked)
**When** `getTokenProtectionWarning`, `getTokenWarningSeverity`, and `getFeeWarning` are evaluated
**Then** each input maps to the expected `TokenProtectionWarning` and `WarningSeverity` (fee breakpoints 15/80/100, blocked > malicious > fee > non-default priority order), and native currency always resolves to None
