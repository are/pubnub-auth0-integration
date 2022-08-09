import type { NextApiRequest, NextApiResponse } from 'next'
import { expressjwt } from 'express-jwt'
import { expressJwtSecret } from 'jwks-rsa'
import { ManagementClient } from 'auth0'

import Pubnub from 'pubnub'

const port = process.env.PORT || 8080

const jwtCheck = expressjwt({
  secret: expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: 'https://dev-go9eq5m8.us.auth0.com/.well-known/jwks.json',
  }) as any,
  audience: `https://${process.env.VERCEL_URL ?? 'localhost:3000'}/api`,
  issuer: 'https://dev-go9eq5m8.us.auth0.com/',
  algorithms: ['RS256'],
})

const auth0 = new ManagementClient({
  domain: 'dev-go9eq5m8.us.auth0.com',
  clientId: 'dN7iWMU29VjQf9zAaxOFKuycawjAKwsZ',
  clientSecret: 'IrM3HrdxbvPRJjAg9okGWAgW7B9m1IgsOeUf1F2OaLI0pQGBJL9yViggj7p0kZLV',
  scope: 'read:users',
})

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result)
      }

      return resolve(result)
    })
  })
}

const pubnub = new Pubnub({
  publishKey: process.env.NEXT_PUBLIC_PN_PUB_KEY!,
  subscribeKey: process.env.NEXT_PUBLIC_PN_SUB_KEY!,
  secretKey: process.env.PN_SEC_KEY!,
  userId: 'server',
})

export default async function handler(req: NextApiRequest & { auth: { sub: string } }, res: NextApiResponse) {
  try {
    await runMiddleware(req, res, jwtCheck)
  } catch (e) {
    return res.status(403).json({ success: false, error: 'Unauthenticated' })
  }

  const userId = req.auth.sub

  const userData = await auth0.getUser({ id: userId })

  try {
    const token = await pubnub.grantToken({
      authorized_uuid: userId,
      ttl: 60,
      resources: {
        channels: {
          global: { read: true, write: true },
          'global-pnpres': { read: true, write: true },
        },
        uuids: {
          [userId]: { update: true, get: true },
        },
      },
      patterns: {
        uuids: {
          '.*': { get: true },
        },
      },
    })

    await pubnub.objects.setUUIDMetadata({
      uuid: userId,
      data: {
        profileUrl: userData.user_metadata?.profile ?? userData.picture,
        email: userData.email,
        name: userData.name,
      },
    })

    return res.status(200).json({ success: true, token: token })
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Grant failed' })
  }
}
