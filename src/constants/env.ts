export const GOOGLE_RECAPTCHA_KEY = process.env.REACT_APP_GOOGLE_RECAPTCHA_KEY as string
if (GOOGLE_RECAPTCHA_KEY === undefined) throw new Error('process.env.REACT_APP_GOOGLE_RECAPTCHA_KEY is undefined.')
