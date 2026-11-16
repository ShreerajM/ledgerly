import { QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider } from 'react-router/dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { queryClient } from './lib/queryClient.js'
import { router } from './router.jsx'

async function openApp(path = '/login') {
  await router.navigate(path)
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

async function signIn(user, email, password) {
  await user.type(await screen.findByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

beforeEach(() => {
  localStorage.clear()
  queryClient.clear()
})
afterEach(cleanup)

describe('Ledgerly UI (mock API)', () => {
  it('shows validation errors on an empty sign-in', async () => {
    const user = userEvent.setup()
    await openApp()
    await user.click(await screen.findByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Enter a valid email address.')).toBeTruthy()
    expect(screen.getByText('Enter your password.')).toBeTruthy()
  })

  it('rejects a wrong password with a clear message', async () => {
    const user = userEvent.setup()
    await openApp()
    await signIn(user, 'asha@example.com', 'wrong-password')
    expect(await screen.findByText('Incorrect email or password.')).toBeTruthy()
  })

  it('signs an admin in, shows the dashboard and the Users link', async () => {
    const user = userEvent.setup()
    await openApp()
    await signIn(user, 'asha@example.com', 'Admin@123')
    expect(await screen.findByRole('heading', { name: /Asha/ })).toBeTruthy()
    expect(await screen.findByText(/Settled, last 30 days/)).toBeTruthy()
    expect(screen.getAllByRole('link', { name: 'Users' }).length).toBeGreaterThan(0)
  })

  it('hides Users from a regular user and blocks /users with a 403 page', async () => {
    const user = userEvent.setup()
    await openApp()
    await signIn(user, 'meera@example.com', 'Password@123')
    expect(await screen.findByRole('heading', { name: /Meera/ })).toBeTruthy()
    expect(screen.queryAllByRole('link', { name: 'Users' }).length).toBe(0)
    cleanup()
    await openApp('/users')
    expect(await screen.findByText('No access')).toBeTruthy()
  })

  it('validates the amount when creating a transaction (boundary: 0)', async () => {
    const user = userEvent.setup()
    await openApp()
    await signIn(user, 'meera@example.com', 'Password@123')
    await screen.findByRole('heading', { name: /Meera/ })
    await router.navigate('/transactions')
    const panel = await screen.findByLabelText('New transaction', { selector: 'div' })
    const amount = within(panel).getByLabelText('Amount (₹)')
    await user.type(amount, '0')
    await user.click(within(panel).getByRole('button', { name: 'Create transaction' }))
    expect(await within(panel).findByText('Amount must be greater than 0.')).toBeTruthy()
  })

  it('creates a transaction and lists it for an admin', async () => {
    const user = userEvent.setup()
    await openApp()
    await signIn(user, 'asha@example.com', 'Admin@123')
    await screen.findByRole('heading', { name: /Asha/ })
    await router.navigate('/transactions')
    const panel = await screen.findByLabelText('New transaction', { selector: 'div' })
    await within(panel).findByRole('option', { name: 'Meera Kulkarni' })
    await user.selectOptions(within(panel).getByLabelText('Customer'), 'Meera Kulkarni')
    await user.type(within(panel).getByLabelText('Amount (₹)'), '12400')
    await user.click(within(panel).getByRole('button', { name: 'Create transaction' }))
    expect(await within(panel).findByText(/created for/)).toBeTruthy()
  })

  it('lets an admin filter and manage users, but not change themselves', async () => {
    const user = userEvent.setup()
    await openApp()
    await signIn(user, 'asha@example.com', 'Admin@123')
    await screen.findByRole('heading', { name: /Asha/ })
    await router.navigate('/users')
    expect(await screen.findByText(/people in this workspace/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /add user/i })).toBeNull()
    expect(screen.getAllByText('You').length).toBeGreaterThan(0)
    await user.click(screen.getAllByRole('button', { name: 'Admin' })[0])
    expect(await screen.findByText(/Showing 1–2 of 2/)).toBeTruthy()
  })
})
