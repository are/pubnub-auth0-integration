import { Avatar, Grid, Paper, styled, Typography } from '@mui/material'
import { Cache } from '../utils/useCache'

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
}))

export default function OnlineUsers({ cache, onlineUserIds }: { cache: Cache<any>; onlineUserIds: string[] }) {
  return (
    <>
      <Typography variant="h6" marginBottom={1}>
        Online Users
      </Typography>
      <Grid container direction="column" gap={2}>
        {onlineUserIds.map((userId) => {
          const userData = cache.get(userId)

          if (!userData) {
            return null
          }

          return (
            <Grid item key={userId} width="100%">
              <Paper>
                <Grid container direction="row" wrap="nowrap" maxWidth="100%" alignItems="center">
                  <Grid item>
                    <Avatar src={userData.profileUrl} sx={{ m: 1 }} />
                  </Grid>
                  <Grid item flexGrow={1} maxWidth="70%">
                    <Typography noWrap>{userData.name}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )
        })}
      </Grid>
    </>
  )
}
