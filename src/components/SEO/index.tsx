import React from 'react'
import Helmet from 'react-helmet'

interface SEOProps {
  title: string
  description: string
}

export const SEO = ({ title, description }: SEOProps) => {
  return (
    <Helmet title={title}>
      <meta charSet="utf-8" />
      <html lang="en" />
      <meta name="title" content={title} />
      <meta name="description" content={description} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
    </Helmet>
  )
}

export const SEOSwap = ({ canonicalUrl }: { canonicalUrl: string }) => {
  if (!canonicalUrl) return null
  return (
    <Helmet>
      <link href={canonicalUrl} rel="canonical"></link>
    </Helmet>
  )
}

export default SEO
