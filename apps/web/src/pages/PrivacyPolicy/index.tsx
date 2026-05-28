import React from 'react'
import { Flex } from 'ui/src'
import { getInternalLinkHref } from 'utils/routing'

type PolicySection = {
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

const introParagraphs = [
  'This Privacy Policy (the "Policy") explains how BOTBOT LTD. ("Ring Labs", the "Company", "we", "us" or "our") collects, uses, and shares data in connection with the Ring web app (https://ring.exchange), the https://ring.exchange website, and all of our other properties, products, and services (the "Services").',
  'Your use of the Services is subject to this Policy as well as our Terms of Service.',
]

const sections: PolicySection[] = [
  {
    title: 'High Level Summary',
    bullets: [
      'Ring Labs is an incorporated company based in the United States and complies with applicable U.S. laws and regulations.',
      'Ring Protocol is a censorship-resistant set of smart contracts deployed across various Layer 1 and Layer 2 chains and is not governed by Ring Labs.',
      'Ring Labs does not collect and store personal data such as first name, last name, street address, date of birth, or similar identifying profile data in connection with normal use of the Services.',
      'Ring Labs collects non-identifiable data such as publicly available on-chain data and limited off-chain data (for example, browser type, device context, and an anonymous device identifier) to improve products and user experience.',
      'When you connect a wallet and submit transactions, your publicly-available wallet address is shared with RPC node providers and may be sent to compliance screening services. This is inherent to how blockchain networks operate.',
      'If you use the optional fiat on-ramp feature, you will be redirected to a third-party provider governed by its own privacy policy. Ring Labs does not receive or store any personal or payment data you provide to fiat on-ramp providers.',
      'If you contact us via email or other channels, Ring Labs stores that correspondence. We do not require you to provide any personal data to use the Services.',
      'Material privacy updates are reflected in an updated privacy policy.',
    ],
  },
  {
    title: 'Data We Collect',
    paragraphs: [
      'Privacy is central to the Company. We do not maintain user accounts and we seek to minimize personal-data collection.',
      'When you interact with the Services, data we may collect includes:',
    ],
    bullets: [
      'Publicly available blockchain data. Your wallet address and transaction data are publicly visible on the blockchain. We may access this data to provide features of the Services.',
      'Wallet connection information. When you connect a wallet, we receive your public wallet address and the type of wallet connector used (e.g., injected, WalletConnect, embedded wallet). We do not receive or store your private keys or seed phrase.',
      "Anonymous device identifier. We generate and store an anonymous device identifier (USER_ID) in your browser's localStorage. This identifier is not linked to your personal identity.",
      "Application preferences and cached data stored in your browser's localStorage, including: analytics opt-out preference, referral codes, selected chain, dismissed banner states, and cached query data. This data remains on your device.",
      'Transaction and interaction data via our analytics infrastructure (when enabled), including token symbols, trade amounts, chain identifiers, routing methods, and interaction events. This data is associated with anonymous device identifiers, not personal identity.',
      'Compliance screening results. Your wallet address may be screened against sanctions and risk databases via TRM Labs or similar compliance providers to prevent prohibited activity.',
      'Information from other service providers for compliance and fraud prevention.',
      'Correspondence, survey responses, and feedback you voluntarily provide.',
      'If you apply for a job, we may collect information you provide in that process, such as resume details and contact information.',
    ],
  },
  {
    title: 'How We Use Data',
    bullets: [
      'Providing, maintaining, personalizing, and improving the Services.',
      'Customer support and responding to inquiries.',
      'Safety and security, including fraud and abuse prevention, and compliance screening of wallet addresses.',
      'Legal and regulatory compliance.',
      'Aggregation and analytics to understand usage and improve user experience.',
      'Feature experimentation and product optimization via feature-flagging services.',
    ],
  },
  {
    title: 'How We Share Data',
    paragraphs: ['We may share or disclose data as follows:'],
    bullets: [
      'With RPC and blockchain data providers. When you submit a blockchain transaction or query, your wallet address and transaction data are sent to RPC node providers such as Infura, Alchemy, QuickNode, and various public endpoints. Ring Labs does not control how these providers handle your data.',
      'With analytics and monitoring providers. When analytics are enabled, anonymized interaction data may be shared with Amplitude (via proxy), Datadog (session monitoring and error logging), and Statsig (feature flags and experimentation). These services receive anonymous device identifiers and interaction events, not personal identity information.',
      'With compliance screening providers. Your wallet address may be sent to TRM Labs or similar services to screen for sanctions compliance and prohibited activity. Only your publicly-available wallet address is shared.',
      'With wallet connection providers. If you connect via WalletConnect, connection data is relayed through the WalletConnect network. If you use an embedded wallet, connection state is stored locally.',
      "With fiat on-ramp providers. If you use the optional fiat purchase feature, you are redirected to a third-party provider (such as MoonPay). Ring Labs shares only minimal data needed to initiate the redirect. Any personal data, identity verification, or payment information you provide is governed by that provider's own privacy policy.",
      'To comply with our legal obligations. We may share your data in the course of litigation, regulatory proceedings, compliance measures, and when compelled by subpoena, court order, or other legal procedure. We may also share data when we believe it is necessary to prevent harm to our users, our Company, or others, and to enforce our agreements and policies, including our Terms of Service.',
      'In connection with business transactions such as mergers, acquisitions, bankruptcy, dissolution, reorganization, or similar events.',
      'With your consent, when you authorize us to share your information.',
    ],
  },
  {
    title: 'Cookies and Tracking Technologies',
    paragraphs: [
      'The Services use browser localStorage to store application preferences, cached data, and an anonymous device identifier locally on your device. The Services may also use analytics and monitoring SDKs (including Amplitude, Datadog, and Statsig) that may set cookies or use similar technologies when analytics features are enabled. These tools collect anonymized interaction data to help us understand usage patterns and improve the Services.',
      "You can manage your analytics preferences through the Services' built-in analytics opt-out setting. You may also block cookies in your browser settings, limit advertising IDs on your device, or use privacy-focused browser extensions. Third-party DApps or services linked from the Interface may independently set cookies or use tracking technologies governed by their own privacy policies.",
    ],
  },
  {
    title: 'Data Retention',
    paragraphs: ['We retain data only as long as necessary for the purposes described in this Policy:'],
    bullets: [
      'On-device data (localStorage). Application preferences, cached data, anonymous device identifier, and other locally-stored data persist on your device until you clear your browser data or manually remove it. Ring Labs does not control this data.',
      'Blockchain data. Transaction data recorded on public blockchains is permanent and immutable. Neither Ring Labs nor any other party can modify or delete on-chain data.',
      'Analytics data. Anonymized interaction and usage data is retained for up to 24 months for product improvement purposes.',
      'Compliance screening data. Results of wallet address screening are retained as required by applicable regulations.',
      'Correspondence. If you contact us, we retain your correspondence for as long as necessary to address your inquiry and for legitimate business purposes.',
      'Aggregated data. Aggregated, de-identified data that cannot identify any individual may be retained indefinitely for analytical purposes.',
    ],
  },
  {
    title: 'Do Not Track',
    paragraphs: [
      'Some web browsers transmit "Do Not Track" (DNT) signals. There is currently no universally accepted standard for how to interpret and respond to DNT signals. We do not currently alter our data practices in response to DNT signals. You can manage your analytics preferences through the Services\' built-in opt-out setting.',
    ],
  },
  {
    title: 'International Data Transfers',
    paragraphs: [
      'Ring Labs is based in the United States. When you use the Services, certain data may be processed in the United States or other jurisdictions where our service providers operate. Your wallet address may be sent to RPC providers and compliance screening services located in various jurisdictions globally. Analytics data may be processed by providers in the United States.',
      'For users in the European Economic Area (EEA), United Kingdom, or Switzerland, where data is transferred to a country that has not received an adequacy decision from the European Commission, we rely on appropriate safeguards such as Standard Contractual Clauses (SCCs) or ensure that the transfer is otherwise lawful under applicable data protection laws.',
    ],
  },
  {
    title: 'Data Breach Notification',
    paragraphs: [
      'In the event of a data breach that affects your personal data, we will notify you as required by applicable law. For users in the European Economic Area, we will notify the relevant supervisory authority within 72 hours of becoming aware of a breach, where feasible, and will notify affected individuals without undue delay where the breach is likely to result in a high risk to their rights and freedoms. Our notification shall not be construed as an admission of fault or liability.',
    ],
  },
  {
    title: 'Third-Party Links and Sites',
    paragraphs: [
      'The Services may include links to websites, platforms, or services not operated by Ring Labs, including DApps accessible through third-party links, fiat on-ramp providers, feedback forms, and support platforms. Those parties may independently collect information from you according to their own policies and terms.',
    ],
  },
  {
    title: 'Security',
    paragraphs: [
      'We maintain reasonable administrative, physical, and technical safeguards to help protect data. However, no internet transmission is completely secure and we cannot guarantee the security of information about you.',
      'You remain responsible for activity on the Services and for the security of your wallets, addresses, and cryptographic keys.',
    ],
  },
  {
    title: 'Age Requirements',
    paragraphs: [
      'The Services are intended for a general audience and are not directed at children. We do not knowingly receive personal information (as defined by the U.S. Children\'s Privacy Protection Act, or "COPPA") from children. If you believe we have received personal information from someone under the age of 18, contact hello@ringprotocol.com.',
    ],
  },
  {
    title: 'Additional Notice to California Residents ("CCPA Notice")',
    paragraphs: [
      'We do not "sell" personal information as defined by the CCPA.',
      'California residents may have rights to request information about how we have collected, used, and shared their personal information. You may also request a copy of any information we maintain about you and ask us to delete personal information, subject to legal limitations and identity verification requirements.',
      'Requests can be submitted to hello@ringprotocol.com. California residents may also use authorized agents with proper written authorization.',
    ],
  },
  {
    title: 'Disclosures for European Union Data Subjects',
    paragraphs: [
      'We process personal data for the purposes described in this Policy. Our legal bases under the General Data Protection Regulation ("GDPR") include: (i) consent; (ii) contract performance; (iii) legal obligations; and/or (iv) legitimate interests, where your interests and fundamental rights do not override those interests.',
      'Your rights under the GDPR include: (a) Access (Art. 15) — request access to your personal data; (b) Rectification (Art. 16) — request correction of inaccurate data; (c) Erasure (Art. 17) — request deletion ("right to be forgotten"); (d) Restriction of processing (Art. 18); (e) Data portability (Art. 20); (f) Object to processing (Art. 21); (g) Automated decision-making (Art. 22) — not be subject to decisions based solely on automated processing (note: wallet address compliance screening via TRM Labs involves automated processing; you may contact us to request human review); (h) Withdraw consent at any time without affecting the lawfulness of prior processing; and (i) Lodge a complaint (Art. 77) with a supervisory authority in your EU Member State.',
      'Some blockchain-related data cannot be edited or deleted by Ring Labs due to the nature of public blockchains. Transaction data, wallet addresses, and asset holdings recorded on-chain are beyond our control.',
      'To exercise any GDPR rights, contact hello@ringprotocol.com. We may require additional information to verify your identity and process your request.',
    ],
  },
  {
    title: 'Changes to this Policy',
    paragraphs: [
      "If we make material changes to this Policy, we will notify users via the Services or by other reasonable means. For material changes, we will use commercially reasonable efforts to provide at least thirty (30) days' advance notice. Continued use of the Services after the effective date indicates your consent to the updated terms.",
    ],
  },
  {
    title: 'Contact Us',
    paragraphs: ['If you have questions about this Policy or data practices, contact hello@ringprotocol.com.'],
  },
]

const TERMS_OF_SERVICE_TEXT = 'Terms of Service'
const RING_EXCHANGE_TEXT = 'https://ring.exchange'

function renderTextWithLinks(text: string) {
  const homeHref = getInternalLinkHref('/')
  const termsHref = getInternalLinkHref('/terms-of-service')
  const withWebsiteLink = text.replaceAll(
    RING_EXCHANGE_TEXT,
    `__RING_LINK_START__${RING_EXCHANGE_TEXT}__RING_LINK_END__`,
  )
  const termsParts = withWebsiteLink.split(TERMS_OF_SERVICE_TEXT)

  return (
    <>
      {termsParts.map((part, index) => (
        <React.Fragment key={`${text}-${index}`}>
          {part.split('__RING_LINK_START__').map((segment, segmentIndex) => {
            if (segmentIndex === 0) {
              return <React.Fragment key={`${text}-${index}-${segmentIndex}`}>{segment}</React.Fragment>
            }

            const [linkText, rest] = segment.split('__RING_LINK_END__')
            return (
              <React.Fragment key={`${text}-${index}-${segmentIndex}`}>
                <a href={homeHref}>{linkText}</a>
                {rest}
              </React.Fragment>
            )
          })}
          {index < termsParts.length - 1 && <a href={termsHref}>{TERMS_OF_SERVICE_TEXT}</a>}
        </React.Fragment>
      ))}
    </>
  )
}

export default function PrivacyPolicy() {
  return (
    <Flex style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px 80px' }}>
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>Ring Labs Privacy Policy</h1>
      <p style={{ marginTop: 0, color: '#666' }}>Last modified: April 13, 2026</p>

      {introParagraphs.map((paragraph) => (
        <p key={paragraph} style={{ lineHeight: 1.7 }}>
          {renderTextWithLinks(paragraph)}
        </p>
      ))}

      {sections.map((section) => (
        <section key={section.title} style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 26, marginBottom: 10 }}>{section.title}</h2>

          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} style={{ lineHeight: 1.7 }}>
              {renderTextWithLinks(paragraph)}
            </p>
          ))}

          {section.bullets && (
            <ul>
              {section.bullets.map((item) => (
                <li key={item} style={{ lineHeight: 1.7 }}>
                  {renderTextWithLinks(item)}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </Flex>
  )
}
