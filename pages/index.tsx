import { useAuth0 } from '@auth0/auth0-react'

import { Button, Icon, Stack } from '@mui/material'
import Typography from '@mui/material/Typography'

export default function Home() {
  const { loginWithRedirect } = useAuth0()

  return (
    <Stack direction="column" justifyContent="center" alignItems="center" height="100%" spacing={12}>
      <Typography variant="h2" marginTop={4}>
        PubNub + Auth0
      </Typography>
      <Button
        variant="contained"
        startIcon={<Icon>login</Icon>}
        onClick={() =>
          loginWithRedirect({
            redirectUri: `${typeof window !== undefined ? window?.location.origin : 'localhost:3000'}/chat`,
          })
        }
      >
        Log in using Auth0
      </Button>
    </Stack>
  )
}
