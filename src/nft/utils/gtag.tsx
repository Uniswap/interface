declare global {
  interface Window {
    gtag: any
  }
}

export const pageview = (url: URL) => {
  window.gtag('config', process.env.REACT_APP_ANALYTICS_ID, {
    cookie_flags: 'SameSite=None;Secure',
    page_path: url,
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  })
}

export const event = ({ action, category, label, value }: { action: any; category: any; label: any; value: any }) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value,
  })
}
