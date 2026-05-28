import React from 'react'
import { Flex } from 'ui/src'
import { getInternalLinkHref } from 'utils/routing'

type Section = {
  title: string
  paragraphs?: string[]
  subSections?: {
    title: string
    paragraphs: string[]
    bullets?: string[]
  }[]
}

const introParagraphs = [
  'These Terms of Service (the "Agreement") explain the terms and conditions by which you may access and use the Products provided by BOTBOT LTD., doing business as Ring Labs (referred to herein as "Ring Labs", "we", "our", or "us"). The Products shall include, but shall not necessarily be limited to, https://ring.exchange, a website-hosted user interface (the "Interface" or "App"). You must read this Agreement carefully as it governs your use of the Products. By accessing or using any of the Products, you signify that you have read, understand, and agree to be bound by this Agreement in its entirety. If you do not agree, you are not authorized to access or use any of our Products and should not use our Products.',
  'To access or use any of our Products, you must be able to form a legally binding contract with us. Accordingly, you represent that you are at least the age of majority in your jurisdiction and have the full right, power, and authority to enter into and comply with the terms and conditions of this Agreement on behalf of yourself and any company or legal entity for which you may access or use the Interface. If you are entering into this Agreement on behalf of an entity, you represent to us that you have the legal authority to bind such entity.',
  'You further represent that you are not (a) the subject of economic or trade sanctions administered or enforced by any governmental authority or otherwise designated on any list of prohibited or restricted parties or (b) a citizen, resident, or organized in a jurisdiction or territory that is the subject of comprehensive sanctions by the United States. Finally, you represent that your access and use of any of our Products will fully comply with all applicable laws and regulations, and that you will not access or use any of our Products to conduct, promote, or otherwise facilitate any illegal activity.',
  'NOTICE: This Agreement contains important information, including a binding arbitration provision and a class action waiver, both of which impact your rights as to how disputes are resolved. Our Products are only available to you if you agree completely with these terms.',
]

const sections: Section[] = [
  {
    title: '1. Our Products',
    subSections: [
      {
        title: '1.1 The Interface',
        paragraphs: [
          'The Interface provides a web or mobile-based means of access to decentralized protocols on various public blockchains, including but not limited to Ethereum and Ethereum-compatible chains, that allow users to trade, provide liquidity for, and otherwise interact with certain compatible digital assets (the "Ring protocol" or the "Protocol"). The Interface supports multiple interaction modes, including but not limited to token swaps, limit orders, token wrapping, liquidity provision and management, and cross-chain operations.',
          'The Interface is distinct from the Protocol and is one, but not the exclusive, means of accessing the Protocol. The Protocol itself has multiple versions comprising open-source or source-available self-executing smart contracts deployed on public blockchains. Ring Labs does not control or operate any version of the Protocol on any blockchain network.',
          'By using the Interface, you understand that you are not buying or selling digital assets from us and that we do not operate any liquidity pools on the Protocol or control trade execution on the Protocol. Fees paid for trades generally accrue to liquidity providers for the Protocol.',
          'To access the Interface, you must use a non-custodial wallet software, which may include third-party browser extension wallets, WalletConnect-compatible wallets, or an embedded wallet provided through the Interface. We do not have custody or control over the contents of your wallet and have no ability to retrieve or transfer its contents. By connecting your wallet to our Interface, you agree to be bound by this Agreement and all terms incorporated by reference.',
        ],
      },
      {
        title: '1.2 Fiat On-Ramp Services',
        paragraphs: [
          "The Interface may offer functionality that allows you to purchase digital assets using fiat currency through third-party service providers. When you use these features, you are redirected to or interact with a third-party provider that is solely responsible for processing your transaction, conducting any required identity verification, and complying with applicable financial regulations. Ring Labs does not process, facilitate, or have access to any fiat payment or identity verification data. Your use of fiat on-ramp services is governed by the third-party provider's own terms and privacy policy.",
        ],
      },
      {
        title: '1.3 Referral and Rewards Programs',
        paragraphs: [
          'We may from time to time offer referral programs, incentives, prizes, or rewards for certain activities related to the use of our Products. The terms, availability, and eligibility of any such program may change at any time at our sole discretion, and we reserve the right to modify, suspend, or cancel any rewards program without prior notice. Participation in any referral or rewards program does not create an employment, partnership, or agency relationship between you and Ring Labs.',
        ],
      },
      {
        title: '1.4 Privacy Policy',
        paragraphs: [
          'Your use of the Products is also governed by our Privacy Policy, available at https://ring.exchange/#/privacy-policy, which is incorporated into this Agreement by reference. Please review the Privacy Policy to understand how we collect, use, and share data in connection with the Products.',
        ],
      },
      {
        title: '1.5 Other Products',
        paragraphs: [
          'We may from time to time offer additional products, and such additional products shall be considered a Product as used herein, regardless of whether such product is specifically defined in this Agreement.',
        ],
      },
      {
        title: '1.6 Third Party Services and Content',
        paragraphs: [
          'When you use any of our Products, you may also be using products, services, or content of one or more third parties, including but not limited to wallet providers, RPC node providers, blockchain data services, fiat on-ramp providers, and compliance screening services. Your use of such third party products, services, or content may be subject to separate policies, terms of use, and fees of these third parties, and you agree to abide by and be responsible for such policies, terms of use, and fees, as applicable.',
        ],
      },
    ],
  },
  {
    title: '2. Modifications of this Agreement or our Products',
    subSections: [
      {
        title: '2.1 Modifications of this Agreement',
        paragraphs: [
          'We reserve the right, in our sole discretion, to modify this Agreement from time to time. If we make any material modifications, we will notify you by updating the date at the top of the Agreement and by maintaining a current version of the Agreement at https://ring.exchange/#/terms-of-service.',
          "For material modifications, we will use commercially reasonable efforts to provide at least thirty (30) days' advance notice before the changes take effect, through the Products or by other reasonable means. All modifications will be effective when posted (or, for material modifications, at the end of the applicable notice period), and your continued access or use of any Product after the effective date confirms your acceptance of those modifications. If you do not agree with any modifications, you must stop accessing and using all of our Products immediately.",
        ],
      },
      {
        title: '2.2 Modifications of our Products',
        paragraphs: [
          'We reserve the following rights, which do not constitute obligations of ours: (a) with or without notice to you, to modify, substitute, eliminate, or add to any of the Products; and (b) to review, modify, filter, disable, delete, and remove any and all content and information from any of the Products.',
        ],
      },
    ],
  },
  {
    title: '3. Intellectual Property Rights',
    subSections: [
      {
        title: '3.1 IP Rights Generally',
        paragraphs: [
          'We own all intellectual property and other rights in each of our Products and their contents, including software, text, images, trademarks, service marks, copyrights, patents, designs, and look and feel. Subject to this Agreement, we grant you a limited, revocable, non-exclusive, non-sublicensable, non-transferable license to access and use our Products solely in accordance with this Agreement.',
          'You agree not to use, modify, distribute, tamper with, reverse engineer, disassemble, or decompile any of our Products except as expressly permitted. Except as set forth in this Agreement, we grant you no rights to any of our Products, including any intellectual property rights.',
          'By using any of our Products, you grant us a worldwide, non-exclusive, sublicensable, royalty-free license to use, copy, modify, and display content you post through our Products for current and future business purposes, including to provide, promote, and improve services.',
        ],
      },
      {
        title: '3.2 Third-Party Resources and Promotions',
        paragraphs: [
          'Our Products may contain references or links to third-party resources and promotions that we do not own or control. We do not approve, monitor, endorse, warrant, or assume responsibility for any such resources or promotions. If you access or participate in them, you do so at your own risk.',
        ],
      },
      {
        title: '3.3 Additional Rights',
        paragraphs: [
          'We reserve the right to cooperate with any law enforcement, court, or government investigation or order, or third party requesting or directing that we disclose information or content that you provide.',
        ],
      },
    ],
  },
  {
    title: '4. Your Responsibilities',
    subSections: [
      {
        title: '4.1 Prohibited Activity',
        paragraphs: [
          'You agree not to engage in, or attempt to engage in, prohibited activity in relation to your access and use of the Interface, including:',
        ],
        bullets: [
          'Intellectual property infringement.',
          'Cyberattacks or disruption of system integrity and security.',
          'Fraud and misrepresentation.',
          'Market manipulation (including rug pulls, pump and dump, wash trading).',
          'Securities and derivatives violations.',
          'Buying, selling, or transferring stolen or illegally obtained property.',
          'Data mining, scraping, robots, or similar extraction methods.',
          'Objectionable content that is harmful, threatening, abusive, hateful, discriminatory, obscene, or otherwise unlawful.',
          'Any other conduct that violates applicable law or regulation.',
        ],
      },
      {
        title: '4.2 Trading',
        paragraphs: [
          'You agree and understand that all trades you submit through our Products are unsolicited and solely initiated by you, that you have not received investment advice from us in connection with such trades, and that we do not conduct suitability reviews of your trades.',
        ],
      },
      {
        title: '4.3 Non-Custodial and No Fiduciary Duties',
        paragraphs: [
          'Each Product is non-custodial, meaning we do not have custody, possession, or control of your digital assets. You are solely responsible for safeguarding your private keys, wallet credentials, and seed phrase.',
          'This Agreement does not create fiduciary duties. To the fullest extent permitted by law, any such duties are disclaimed, waived, and eliminated, and our duties to you are only those expressly set out in this Agreement.',
        ],
      },
      {
        title: '4.4 Compliance and Tax Obligations',
        paragraphs: [
          'One or more Products may not be available or appropriate for use in your jurisdiction. You are solely responsible for compliance with all laws and regulations applicable to you.',
          'Your use of our Products or the Protocol may result in tax consequences. You are responsible for determining whether taxes apply and for reporting and remitting correct taxes to the appropriate authority.',
        ],
      },
      {
        title: '4.5 Gas Fees',
        paragraphs: [
          'Blockchain transactions require payment of network fees ("Gas Fees"). Except as otherwise expressly set out in another offer by Ring Labs, you are solely responsible for paying Gas Fees for transactions initiated via our Products.',
        ],
      },
      {
        title: '4.6 Release of Claims',
        paragraphs: [
          'You assume all risks in connection with your access and use of our Products and waive and release us from liability, claims, causes of action, or damages arising from or relating to such use.',
        ],
      },
    ],
  },
  {
    title: '5. DISCLAIMERS',
    subSections: [
      {
        title: '5.1 ASSUMPTION OF RISK -- GENERALLY',
        paragraphs: [
          'By accessing and using our Products, you represent that you are financially and technically sophisticated enough to understand the risks associated with cryptographic and blockchain-based systems and digital assets.',
          'You acknowledge that digital asset markets are nascent and highly volatile. Smart contract and blockchain-based transactions may be irreversible, and transaction cost and speed may vary dramatically.',
          'You acknowledge and accept all risks of using the Interface to interact with the Protocol and agree that we are not responsible for these variables or resulting losses.',
        ],
      },
      {
        title: '5.2 NO WARRANTIES',
        paragraphs: [
          'Each Product is provided on an "AS IS" and "AS AVAILABLE" basis. To the fullest extent permitted by law, we disclaim all representations and warranties of any kind, express, implied, or statutory, including merchantability and fitness for a particular purpose.',
          'We do not warrant continuous or uninterrupted access, accuracy of information, or absence of errors, defects, viruses, or harmful elements.',
          'Payments and financial transactions are processed via automated smart contracts. Once executed, we have no control over and no ability to reverse those transactions.',
        ],
      },
      {
        title: '5.3 SMART CONTRACT AND PROTOCOL RISKS',
        paragraphs: [
          'YOU ACKNOWLEDGE THAT SMART CONTRACTS AND DECENTRALIZED PROTOCOLS MAY CONTAIN BUGS, VULNERABILITIES, OR EXPLOITS THAT COULD RESULT IN THE LOSS OF YOUR DIGITAL ASSETS. RING LABS DOES NOT AUDIT, GUARANTEE, OR WARRANT THE SECURITY OR CORRECTNESS OF ANY SMART CONTRACT OR PROTOCOL ACCESSIBLE THROUGH THE INTERFACE. YOU INTERACT WITH ON-CHAIN PROTOCOLS ENTIRELY AT YOUR OWN RISK.',
        ],
      },
      {
        title: '5.4 NO INVESTMENT ADVICE',
        paragraphs: [
          'Any token information we provide is for informational purposes only and does not constitute investment advice or a recommendation to buy, sell, or hold any asset.',
          'You alone are responsible for determining whether any investment, strategy, or related transaction is appropriate for you based on your objectives, financial circumstances, and risk tolerance.',
        ],
      },
    ],
  },
  {
    title: '6. Indemnification',
    paragraphs: [
      'You agree to hold harmless, release, defend, and indemnify us and our officers, directors, employees, contractors, agents, affiliates, and subsidiaries from and against claims, damages, losses, liabilities, costs, and expenses arising out of your access and use of our Products, your violation of this Agreement or law, and disputes involving your account or usage.',
    ],
  },
  {
    title: '7. Limitation of Liability',
    paragraphs: [
      'Under no circumstances shall we or our officers, directors, employees, contractors, agents, affiliates, or subsidiaries be liable for indirect, punitive, incidental, special, consequential, or exemplary damages arising out of or relating to your access to or use of any Product.',
      'We are not liable for hacking, unauthorized access, service interruption, malware, third-party conduct, or losses arising from third-party services. In no event shall our total liability exceed USD $100 (or local equivalent), except to the extent prohibited by law.',
    ],
  },
  {
    title: '8. Governing Law, Dispute Resolution and Class Action Waivers',
    subSections: [
      {
        title: '8.1 Governing Law',
        paragraphs: [
          'This Agreement and any dispute are governed by the laws of the State of New York, without regard to conflict-of-laws principles, and arbitration is governed by the Federal Arbitration Act.',
        ],
      },
      {
        title: '8.2 Dispute Resolution',
        paragraphs: [
          'Parties will first attempt informal good-faith resolution. If unresolved, disputes are to be finally and exclusively settled by binding arbitration under JAMS Optional Expedited Arbitration Procedures, generally in New York, New York.',
        ],
      },
      {
        title: '8.3 Class Action and Jury Trial Waiver',
        paragraphs: [
          'You must bring disputes in your individual capacity and not as part of a class, collective, representative, or private attorney general action. You and we both waive the right to a jury trial.',
        ],
      },
    ],
  },
  {
    title: '9. Miscellaneous',
    subSections: [
      {
        title: '9.1 Entire Agreement',
        paragraphs: [
          'These terms constitute the entire agreement between you and us with respect to the subject matter and supersede prior understandings or agreements.',
        ],
      },
      {
        title: '9.2 Assignment',
        paragraphs: [
          'You may not assign or transfer this Agreement without our prior written consent. We may freely assign or transfer this Agreement.',
        ],
      },
      {
        title: '9.3 Not Registered with the SEC or Any Other Agency',
        paragraphs: [
          'We are not registered with the U.S. Securities and Exchange Commission as a national securities exchange or in any other capacity, and we do not broker, execute, or settle your trades.',
        ],
      },
      {
        title: '9.4 Notice',
        paragraphs: [
          'We may provide notice under this Agreement using commercially reasonable means, including public communication channels; such notices are effective upon posting.',
        ],
      },
      {
        title: '9.5 Severability',
        paragraphs: [
          'If any provision of this Agreement is invalid or unenforceable, that provision will be interpreted to accomplish its objectives to the greatest extent possible under applicable law, and the remaining provisions remain in full force.',
        ],
      },
      {
        title: '9.6 Term and Termination',
        paragraphs: [
          'This Agreement is effective until terminated. We may terminate or suspend your access to any of our Products immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach any term of this Agreement. Upon termination: (a) all rights and licenses granted to you under this Agreement will immediately terminate; and (b) you must cease all use of the Products. Because the Interface is non-custodial, termination of your access does not affect your ability to interact with blockchain protocols independently. Sections 3 (Intellectual Property), 4.3 (Non-Custodial and No Fiduciary Duties), 4.6 (Release of Claims), 5 (Disclaimers), 6 (Indemnification), 7 (Limitation of Liability), 8 (Governing Law, Dispute Resolution and Class Action Waivers), and 9 (Miscellaneous) shall survive any termination of this Agreement.',
        ],
      },
      {
        title: '9.7 Force Majeure',
        paragraphs: [
          'We shall not be liable for any failure or delay in performing our obligations under this Agreement where such failure or delay results from circumstances beyond our reasonable control, including but not limited to: (a) acts of God, natural disasters, epidemics, or pandemics; (b) war, terrorism, riots, or civil unrest; (c) government actions, laws, regulations, embargoes, or sanctions; (d) power outages, telecommunications failures, or internet service disruptions; (e) blockchain network congestion, forks, or protocol-level failures; (f) third-party RPC provider, indexer, or infrastructure outages; (g) cyberattacks, including denial-of-service attacks, hacking, or malware; or (h) any other event beyond our reasonable control.',
        ],
      },
      {
        title: '9.8 Time Limitation on Claims',
        paragraphs: [
          'You agree that any claim you may have arising out of or related to your relationship with us or this Agreement must be filed within one (1) year after such claim arose; otherwise, your claim is permanently barred.',
        ],
      },
      {
        title: '9.9 Consumer Rights Preservation',
        paragraphs: [
          'Nothing in this Agreement shall limit or exclude any rights you may have under applicable consumer protection laws that cannot be lawfully limited or excluded. Some jurisdictions do not allow the exclusion of certain warranties or the limitation of certain liabilities. If these laws apply to you, some or all of the above exclusions or limitations may not apply, and you may have additional rights.',
        ],
      },
    ],
  },
]

const HOME_URL_TEXT = 'https://ring.exchange'
const TERMS_URL_TEXT = 'https://ring.exchange/#/terms-of-service'

function renderTextWithLinks(text: string) {
  const homeHref = getInternalLinkHref('/')
  const termsHref = getInternalLinkHref('/terms-of-service')

  const withTermsMarker = text.replaceAll(TERMS_URL_TEXT, '__TERMS_URL_LINK__')
  const withAllMarkers = withTermsMarker.replaceAll(HOME_URL_TEXT, '__HOME_URL_LINK__')

  const parts = withAllMarkers.split(/(__TERMS_URL_LINK__|__HOME_URL_LINK__)/g)

  if (parts.length === 1) {
    return text
  }

  return (
    <>
      {parts.map((part, index) => {
        if (part === '__TERMS_URL_LINK__') {
          return (
            <a key={`${text}-${index}-terms`} href={termsHref}>
              {TERMS_URL_TEXT}
            </a>
          )
        }

        if (part === '__HOME_URL_LINK__') {
          return (
            <a key={`${text}-${index}-home`} href={homeHref}>
              {HOME_URL_TEXT}
            </a>
          )
        }

        return <React.Fragment key={`${text}-${index}-text`}>{part}</React.Fragment>
      })}
    </>
  )
}

export default function TermsOfService() {
  return (
    <Flex style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px 80px' }}>
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>Ring Labs Terms of Service</h1>
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

          {section.subSections?.map((subSection) => (
            <Flex key={subSection.title} style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>{subSection.title}</h3>
              {subSection.paragraphs.map((paragraph) => (
                <p key={paragraph} style={{ lineHeight: 1.7 }}>
                  {renderTextWithLinks(paragraph)}
                </p>
              ))}
              {subSection.bullets && (
                <ul>
                  {subSection.bullets.map((item) => (
                    <li key={item}>{renderTextWithLinks(item)}</li>
                  ))}
                </ul>
              )}
            </Flex>
          ))}
        </section>
      ))}
    </Flex>
  )
}
