import { MetaTagInjector } from './components/metaTagInjector'

export const onRequest: PagesFunction = async ({ request, next }) => {
  const imageUri = new URL(request.url).origin + '/images/1200x630_Rich_Link_Preview_Image.png'
  const data = {
    title: "Uniswap Interface",
    image: imageUri,
    url: request.url,
  }
  try {
    return new HTMLRewriter().on('head', new MetaTagInjector(data)).transform(await next())
  } catch (e) {
    return next()
  }
}
