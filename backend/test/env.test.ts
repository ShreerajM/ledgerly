import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { loadEnv } from '../src/config/env.ts'

const REAL = {
  DATABASE_URL: 'postgres://ledgerly:a-real-password@db:5432/ledgerly',
  JWT_SECRET: 'x'.repeat(48),
}
const DEMO = {
  DATABASE_URL: 'postgres://ledgerly:demo-only-db-password@db:5432/ledgerly',
  JWT_SECRET: 'demo-only-jwt-secret-change-me-0123456789',
}

describe('environment validation', () => {
  it('applies sensible defaults', () => {
    const env = loadEnv({ ...REAL })
    assert.equal(env.PORT, 4000)
    assert.equal(env.NODE_ENV, 'development')
    assert.equal(env.TRUST_PROXY, 0)
    assert.equal(env.RATE_LIMIT_ENABLED, true)
  })

  it('fails fast with a readable message when required values are missing or weak', () => {
    assert.throws(() => loadEnv({}), /DATABASE_URL/)
    assert.throws(() => loadEnv({ ...REAL, JWT_SECRET: 'too-short' }), /at least 32 characters/)
    assert.throws(() => loadEnv({ ...REAL, DATABASE_URL: 'mysql://nope' }), /postgres/)
    assert.throws(() => loadEnv({ ...REAL, PORT: '99999' }), /PORT/)
    assert.throws(() => loadEnv({ ...REAL, JWT_EXPIRES_IN: 'soon' }), /JWT_EXPIRES_IN/)
  })

  it('refuses demo secrets in production', () => {
    assert.throws(() => loadEnv({ ...DEMO, NODE_ENV: 'production' }), /demo-only/)
    // Either value on its own is enough to refuse.
    assert.throws(() => loadEnv({ ...REAL, JWT_SECRET: DEMO.JWT_SECRET, NODE_ENV: 'production' }), /JWT_SECRET/)
    assert.throws(() => loadEnv({ ...REAL, DATABASE_URL: DEMO.DATABASE_URL, NODE_ENV: 'production' }), /DATABASE_URL/)
  })

  it('allows demo secrets in production only when explicitly switched on', () => {
    const env = loadEnv({ ...DEMO, NODE_ENV: 'production', ALLOW_DEMO_SECRETS: 'true' })
    assert.equal(env.ALLOW_DEMO_SECRETS, true)
  })

  it('allows demo secrets outside production and real secrets in production', () => {
    assert.doesNotThrow(() => loadEnv({ ...DEMO, NODE_ENV: 'development' }))
    assert.doesNotThrow(() => loadEnv({ ...REAL, NODE_ENV: 'production' }))
  })

  it('the demo values shipped in .env.example are valid for a demo run', () => {
    assert.doesNotThrow(() => loadEnv({ ...DEMO, NODE_ENV: 'production', ALLOW_DEMO_SECRETS: 'true' }))
  })
})
