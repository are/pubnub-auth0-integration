import { useAuth0 } from '@auth0/auth0-react'
import { Avatar, Button, CircularProgress, Icon, Paper, Skeleton, Stack, TextField, Typography } from '@mui/material'
import Grid from '@mui/material/Grid'
import { MessageEvent, PresenceEvent } from 'pubnub'
import { usePubNub } from 'pubnub-react'
import { useEffect, useRef, useState } from 'react'
import useCache from '../utils/useCache'
import OnlineUsers from './OnlineUsers'

export default function ChatView({ ready, userId }: { ready: boolean; userId: string }) {
  const { logout } = useAuth0()
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [messages, setMessages] = useState<MessageEvent[]>([])
  const [newMessage, setNewMessage] = useState<string>('')
  const chatboxRef = useRef<any>()

  const pubnub = usePubNub()

  const cache = useCache(async (key: string) => {
    const result = await pubnub.objects.getUUIDMetadata({ uuid: key, include: { customFields: true } })

    return result.data
  })

  useEffect(() => {
    async function setup() {
      const listener = {
        message(messageEvent: MessageEvent) {
          setMessages((m) => [messageEvent, ...m])
          if (chatboxRef.current) {
            chatboxRef.current.scrollIntoView(false)
          }
        },
        presence(presenceEvent: PresenceEvent) {
          switch (presenceEvent.action) {
            case 'join':
              setOnlineUsers((u) => [...u, presenceEvent.uuid])
              break
            case 'leave':
              setOnlineUsers((u) => u.filter((i) => i !== presenceEvent.uuid))
              break
            default:
              console.log(presenceEvent)
          }
        },
      }

      if (ready) {
        setOnlineUsers([])
        setMessages([])

        pubnub.addListener(listener)

        pubnub.subscribe({ channels: ['global'], withPresence: true })

        const result = await pubnub.hereNow({ channels: ['global'] })

        if (result.totalOccupancy > 0) {
          setOnlineUsers((u) => [...result.channels['global'].occupants.map((o) => o.uuid)])
        }
      }

      return () => {
        pubnub.removeListener(listener)

        pubnub.unsubscribe({ channels: ['global'] })
      }
    }

    setup().catch(console.error)
  }, [pubnub, ready])

  const onChange = (event: any) => {
    setNewMessage(event.target.value)
  }

  const onKeyUp = async (event: any) => {
    if (event.key === 'Enter') {
      setNewMessage('')
      await pubnub.publish({ channel: 'global', message: newMessage })
    }
  }

  const userData = ready ? cache.get(userId) : undefined

  return (
    <Grid container direction="column" justifyContent="start" alignItems="stretch" height="100%">
      <Grid item>
        <Stack direction="row" alignItems="center" justifyContent="space-between" marginY={4}>
          <Typography variant="h4">PubNub + Auth0</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="text"
              startIcon={<Icon>logout</Icon>}
              size="small"
              onClick={() => logout({ returnTo: window.location.origin })}
            >
              Log out
            </Button>
            {userData ? (
              <Avatar src={userData.profileUrl!} />
            ) : (
              <Skeleton variant="circular">
                <Avatar />
              </Skeleton>
            )}
          </Stack>
        </Stack>
      </Grid>
      <Grid item container direction="row" justifyContent="center" alignItems="stretch" gap={2} flexGrow={1}>
        <Grid item container direction="column" xs={8} flexWrap="nowrap" maxHeight="90vh">
          <Grid
            item
            container
            direction="column-reverse"
            flexGrow={1}
            gap={2}
            overflow="scroll"
            flexWrap="nowrap"
            paddingRight="32px"
            ref={chatboxRef as any}
          >
            {messages.map((messageEvent) => (
              <Grid item key={messageEvent.timetoken} alignSelf={messageEvent.publisher === userId ? 'end' : 'start'}>
                <Stack direction="column" alignItems={messageEvent.publisher === userId ? 'end' : 'start'}>
                  <Typography variant="caption">{cache.get(messageEvent.publisher)?.name ?? <Skeleton />}</Typography>

                  {messageEvent.message}
                </Stack>
              </Grid>
            ))}
          </Grid>
          <Grid item marginBottom={2} marginTop={3}>
            <TextField
              variant="standard"
              fullWidth
              onChange={onChange}
              onKeyUp={onKeyUp}
              value={newMessage}
              disabled={!ready}
            />
          </Grid>
        </Grid>
        <Grid item xs={3}>
          <OnlineUsers cache={cache} onlineUserIds={onlineUsers} />
        </Grid>
      </Grid>
    </Grid>
  )
}
