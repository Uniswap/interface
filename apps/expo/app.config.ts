/* eslint-disable turbo/no-undeclared-env-vars */
import { ConfigContext, ExpoConfig } from '@expo/config'
import dotenv from 'dotenv'

dotenv.config({
  path: `.env.${process.env.APP_VARIANT} ?? 'development'`,
})

const { APP_VARIANT } = process.env

const getVariantConfig = (config: ConfigContext['config']) => ({
  development: {
    ...config,
    name: `[DEV] ${config.name}`,
    slug: `${config.slug}`,
    icon: './assets/icon-dev.png',
    android: {
      ...config.android,
      package: 'dev.com.REPLACE-ME',
    },
    ios: {
      ...config.ios,
      bundleIdentifier: 'dev.com.REPLACE-ME',
    },
  },
  staging: {
    ...config,
    name: `[STAGING] ${config.name}`,
    slug: `${config.slug}`,
    icon: './assets/icon-dev.png',
    android: {
      ...config.android,
      package: 'staging.com.REPLACE-ME',
    },
    ios: {
      ...config.ios,
      bundleIdentifier: 'staging.com.REPLACE-ME',
    },
  },
  preview: {
    ...config,
    name: `[PREVIEW] ${config.name}`,
    slug: `${config.slug}`,
    icon: './assets/icon.png',
    android: {
      ...config.android,
      package: 'preview.com.REPLACE-ME',
    },
    ios: {
      ...config.ios,
      bundleIdentifier: 'preview.com.REPLACE-ME',
    },
  },
  production: {
    ...config,
    name: `${config.name}`,
    slug: `${config.slug}`,
    icon: './assets/icon.png',
    android: {
      ...config.android,
      package: 'com.REPLACE-ME',
    },
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.REPLACE-ME',
    },
  },
})

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...getVariantConfig(config)[APP_VARIANT],
})
