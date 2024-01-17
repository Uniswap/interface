import { t } from 'i18next'
import zxcvbn from 'zxcvbn'

export interface PasswordValidationResult {
  score: number
  suggestions?: string[]
  valid: boolean
  validationErrorString?: string
}

// These strings are enumerated like this so we can explicitly translate each english warning from zxcvbn.
function translateWarning(warning: string): string {
  if (warning === 'Straight rows of keys are easy to guess') {
    return t('Straight rows of keys are easy to guess')
  }
  if (warning === 'Short keyboard patterns are easy to guess') {
    return t('Short keyboard patterns are easy to guess')
  }
  if (warning === 'Use a longer keyboard pattern with more turns') {
    return t('Use a longer keyboard pattern with more turns')
  }
  if (warning === 'Repeats like "aaa" are easy to guess') {
    return t('Repeats like "aaa" are easy to guess')
  }
  if (warning === 'Repeats like "abcabcabc" are only slightly harder to guess than "abc"') {
    return t('Repeats like "abcabcabc" are only slightly harder to guess than "abc"')
  }
  if (warning === 'Sequences like abc or 6543 are easy to guess') {
    return t('Sequences like abc or 6543 are easy to guess')
  }
  if (warning === 'Recent years are easy to guess') {
    return t('Recent years are easy to guess')
  }
  if (warning === 'Dates are often easy to guess') {
    return t('Dates are often easy to guess')
  }
  if (warning === 'This is a top-10 common password') {
    return t('This is a top-10 common password')
  }
  if (warning === 'This is a top-100 common password') {
    return t('This is a top-100 common password')
  }
  if (warning === 'This is a very common password') {
    return t('This is a very common password')
  }
  if (warning === 'This is similar to a commonly used password') {
    return t('This is similar to a commonly used password')
  }
  if (warning === 'A word by itself is easy to guess') {
    return t('A word by itself is easy to guess')
  }
  if (warning === 'Names and surnames by themselves are easy to guess') {
    return t('Names and surnames by themselves are easy to guess')
  }
  if (warning === 'Common names and surnames are easy to guess') {
    return t('Common names and surnames are easy to guess')
  }
  return warning
}

export const REQUIRED_PASSWORD_STRENGTH_SCORE = 3

export function validatePassword(password: string): PasswordValidationResult {
  const { score, feedback } = zxcvbn(password)
  if (score >= REQUIRED_PASSWORD_STRENGTH_SCORE) {
    return { score, suggestions: feedback.suggestions, valid: true }
  }
  const warning = translateWarning(feedback.warning)
  return {
    score,
    suggestions: feedback.suggestions,
    valid: false,
    validationErrorString: warning || feedback.warning,
  }
}
