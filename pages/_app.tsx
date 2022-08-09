import { Container } from '@mui/material'
import type { AppProps } from 'next/app'
import Head from 'next/head'

import { Auth0Provider } from '@auth0/auth0-react'

export default function MyApp({ Component, pageProps }: AppProps) {
  let uri

  if (typeof window !== 'undefined') {
    uri = window?.location?.origin
  } else {
    uri = 'localhost:3000'
  }

  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <Container maxWidth="lg" style={{ height: '100vh' }} fixed>
        <Auth0Provider
          domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN!}
          clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENTID!}
          redirectUri={uri}
        >
          <Component {...pageProps} />
        </Auth0Provider>
      </Container>
    </>
  )
}
