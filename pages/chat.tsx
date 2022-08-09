import { useAuth0 } from '@auth0/auth0-react'
import { Avatar, Box, Button, Card, CircularProgress, Grid, Icon, Paper, styled, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'

import { PubNubProvider } from 'pubnub-react'

import Head from 'next/head'
import LoginError from '../components/LoginError'
import { useEffect, useMemo, useState } from 'react'
import Pubnub from 'pubnub'
import ChatView from '../components/ChatView'

export default function ChatPage() {
  const { isAuthenticated, isLoading, user, getAccessTokenWithPopup, getAccessTokenSilently } = useAuth0()
  const [isReady, setReady] = useState(false)

  const pubnub = useMemo(() => {
    if (isAuthenticated && user?.sub && !isLoading) {
      return new Pubnub({
        subscribeKey: process.env.NEXT_PUBLIC_PN_SUB_KEY!,
        publishKey: process.env.NEXT_PUBLIC_PN_PUB_KEY!,
        uuid: user.sub,
      })
    }
  }, [isAuthenticated, isLoading, user?.sub])

  useEffect(() => {
    async function fetchToken() {
      if (isAuthenticated && !isLoading && pubnub) {
        let token

        try {
          token = await getAccessTokenSilently({ audience: `http://localhost:3000/api` })
        } catch (e) {
          token = await getAccessTokenWithPopup({ audience: `http://localhost:3000/api` })
        }

        const res = await fetch(new URL('/api/login', window.location.origin), {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token}`,
          },
        })

        const result = await res.json()

        if (result.success === true) {
          pubnub.setToken(result.token)
          setReady(true)
        }
      }
    }

    fetchToken().catch(console.error)
  }, [isAuthenticated, isLoading, getAccessTokenWithPopup, getAccessTokenSilently, pubnub])

  if (isLoading) {
    return (
      <Grid container justifyContent="center" alignItems="center" height="100%">
        <Grid item>
          <CircularProgress />
        </Grid>
      </Grid>
    )
  }

  if (!isAuthenticated && !isLoading) {
    return (
      <>
        <Head>
          <title>Chat - PubNub + Auth0</title>
        </Head>

        <LoginError />
      </>
    )
  }

  return (
    <PubNubProvider client={pubnub!}>
      <Head>
        <title>Chat - PubNub + Auth0</title>
      </Head>

      <ChatView ready={isReady} userId={user!.sub!} />
    </PubNubProvider>
  )
}
