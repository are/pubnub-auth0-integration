import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Link from 'next/link'

export default function LoginError() {
  return (
    <Stack height="100vh" alignItems="center" justifyContent="center">
      <Alert severity="error">
        You must be <Link href="/">logged in</Link> to see this page!
      </Alert>
    </Stack>
  )
}
