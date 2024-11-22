import { useTranslation } from "react-i18next";
import { FeatureFlags } from "uniswap/src/features/gating/flags";
import { useFeatureFlag } from "uniswap/src/features/gating/hooks";

export interface MenuItem {
  label: string;
  href: string;
  internal?: boolean;
  overflow?: boolean;
  closeMenu?: () => void;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
  closeMenu?: () => void;
}

export const useMenuContent = (): MenuSection[] => {
  const { t } = useTranslation();
  const isLegacyNav = !useFeatureFlag(FeatureFlags.NavRefresh);

  const legacyAppLinks = {
    title: t("common.app"),
    key: "App",
    items: [
      {
        label: t("common.pool"),
        href: "/pool",
        internal: true,
        overflow: true,
      },
      { label: t("common.vote"), href: "https://vote.taraswap.org/" },
      {
        label: t("common.analytics"),
        href: `${process.env.REACT_APP_INFO_ROOT}/#/pools`,
        internal: true,
      },
    ],
  };
  const companyLinks = {
    title: t("common.docs"),
    key: "Whitepaper",
    items: [
      {
        label: t("common.whitepaper"),
        href: "https://whitepaper.taraswap.org/",
      },
      { label: t("common.blog"), href: "https://blog.taraswap.org/" },
    ],
  };
  const protocolLinks = {
    title: t("common.protocol"),
    key: "Protocol",
    items: [
      ...(!isLegacyNav
        ? [
            {
              label: t("common.vote"),
              href: "https://vote.taraswap.org/",
            },
          ]
        : [
            {
              label: t("common.vote"),
              href: "https://vote.taraswap.org/",
            },
          ]),
    ],
  };
  // const helpLinks = {
  //   title: t("common.needHelp"),
  //   key: "Help",
  //   items: [
  //     {
  //       label: t("common.helpCenter"),
  //       href: "https://support.uniswap.org/hc/en-us",
  //     },
  //     {
  //       label: t("common.contactUs.button"),
  //       href: "https://support.uniswap.org/hc/en-us/requests/new",
  //     },
  //   ],
  // };

  return [
    ...(isLegacyNav ? [legacyAppLinks] : []),
    companyLinks,
    protocolLinks,
    // helpLinks,
  ];
};
