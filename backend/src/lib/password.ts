import argon2 from 'argon2'

// Argon2id with the OWASP minimum: 19 MiB memory, 2 iterations, 1 lane.
// Parameters are stored inside each hash, so they can be raised later without breaking old hashes.
const OPTIONS = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const

export const hashPassword = (password: string) => argon2.hash(password, OPTIONS)
export const needsRehash = (hash: string) => argon2.needsRehash(hash, OPTIONS)

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password)
  } catch {
    return false // malformed hash
  }
}

// Used when the email does not exist, so "unknown email" takes about as long as "wrong password".
let dummyHash: string | undefined
export async function burnVerifyTime(password: string): Promise<void> {
  dummyHash ??= await hashPassword('not-a-real-password')
  await verifyPassword(dummyHash, password)
}
