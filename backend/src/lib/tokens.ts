import { jwtVerify, SignJWT } from 'jose'
import type { Env } from '../config/env.ts'

export interface TokenService {
  sign(user: { id: number }): Promise<string>
  /** Returns the user id from a valid token, or throws. */
  verify(token: string): Promise<number>
}

// Short-lived signed access token (HS256). The only claim we rely on is `sub` (the user id):
// role and active status are always read from the database, so a demoted or deactivated
// user loses access immediately instead of when the token expires.
export function createTokenService(env: Env): TokenService {
  const key = new TextEncoder().encode(env.JWT_SECRET)

  return {
    sign(user) {
      return new SignJWT({})
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(String(user.id))
        .setIssuer(env.JWT_ISSUER)
        .setAudience(env.JWT_AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(env.JWT_EXPIRES_IN)
        .sign(key)
    },

    async verify(token) {
      // Pin the algorithm so a forged "alg: none" or RS256 token is rejected.
      const { payload } = await jwtVerify(token, key, {
        algorithms: ['HS256'],
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      })
      const id = Number(payload.sub)
      if (!Number.isInteger(id) || id < 1) throw new Error('Token subject is not a valid user id')
      return id
    },
  }
}
