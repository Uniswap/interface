export const GOOGLE_RECAPTCHA_KEY = process.env.REACT_APP_GOOGLE_RECAPTCHA_KEY as string
if (GOOGLE_RECAPTCHA_KEY === undefined) throw new Error('process.env.REACT_APP_GOOGLE_RECAPTCHA_KEY is undefined.')

export const KS_SETTING_API = process.env.REACT_APP_KS_SETTING_API as string
if (KS_SETTING_API === undefined) throw new Error('process.env.REACT_APP_KS_SETTING_API is undefined.')
