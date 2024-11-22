import { Limit } from "components/Icons/Limit";
import { Send } from "components/Icons/Send";
import { SwapV2 } from "components/Icons/SwapV2";
import { MenuItem } from "components/NavBar/CompanyMenu/Content";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useTheme } from "styled-components";
import { FeatureFlags } from "uniswap/src/features/gating/flags";
import { useFeatureFlag } from "uniswap/src/features/gating/hooks";

export type TabsSection = {
  title: string;
  href: string;
  isActive?: boolean;
  items?: TabsItem[];
  closeMenu?: () => void;
};

export type TabsItem = MenuItem & {
  icon?: JSX.Element;
  quickKey: string;
};

export const useTabsContent = (): TabsSection[] => {
  const { t } = useTranslation();
  const isLegacyNav = !useFeatureFlag(FeatureFlags.NavRefresh);
  const { pathname } = useLocation();
  const theme = useTheme();

  return isLegacyNav
    ? [
        {
          title: t("common.swap"),
          href: "/swap",
        },
        {
          title: t("common.explore"),
          href: "/explore",
        },
        {
          title: t("common.nfts"),
          href: "/nfts",
        },
      ]
    : [
        {
          title: t("common.trade"),
          href: "/swap",
          isActive:
            pathname.startsWith("/swap") ||
            pathname.startsWith("/limit") ||
            pathname.startsWith("/send"),
          items: [
            {
              label: t("common.swap"),
              icon: <SwapV2 fill={theme.neutral2} />,
              quickKey: t`U`,
              href: "/swap",
              internal: true,
            },
            {
              label: t("swap.limit"),
              icon: <Limit fill={theme.neutral2} />,
              quickKey: t`L`,
              href: "/limit",
              internal: true,
            },
            {
              label: t("common.send.button"),
              icon: <Send fill={theme.neutral2} />,
              quickKey: t`E`,
              href: "/send",
              internal: true,
            },
          ],
        },
        {
          title: t("common.farms"),
          href: "/farms",
          isActive: pathname.startsWith("/farms"),
        },
        {
          title: t("common.pool"),
          href: "/pool",
          isActive: pathname.startsWith("/pool"),
        },
        {
          title: t("common.explore"),
          href: "/explore",
          isActive: pathname.startsWith("/explore"),
          items: [
            {
              label: t("common.generalInfo"),
              quickKey: t`X`,
              href: `${process.env.REACT_APP_INFO_ROOT}/#`,
              internal: false,
            },
            {
              label: t("common.tokens"),
              quickKey: t`T`,
              href: `${process.env.REACT_APP_INFO_ROOT}/#/tokens`,
              internal: false,
            },
            {
              label: t("common.pools"),
              quickKey: t`P`,
              href: `${process.env.REACT_APP_INFO_ROOT}/#/pools`,
              internal: false,
            },
          ],
        },
      ];
};
