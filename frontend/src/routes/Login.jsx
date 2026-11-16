import { Form, Link, useActionData, useNavigation } from 'react-router'
import { AuthShell } from '../components/AuthShell.jsx'
import { Button, Field } from '../components/ui.jsx'

export function Component() {
  const data = useActionData()
  const busy = useNavigation().state === 'submitting'
  return (
    <AuthShell variant="signin">
      <title>Sign in · Ledgerly</title>
      <h2 className="text-[30px] font-semibold tracking-[-0.025em]">Welcome back</h2>
      <p className="mt-1.5 mb-7 text-[15px] text-muted">Sign in with your work email.</p>

      <Form method="post" noValidate className="flex flex-col gap-4">
        {data?.formError && (
          <p role="alert" className="rounded-xl bg-bad-bg px-4 py-3 text-sm text-bad">{data.formError}</p>
        )}
        <Field name="email" type="email" label="Email" autoComplete="email" placeholder="you@company.com" defaultValue={data?.values?.email} error={data?.errors?.email} />
        <Field name="password" type="password" label="Password" autoComplete="current-password" placeholder="Your password" error={data?.errors?.password} />
        <Button type="submit" disabled={busy} className="mt-2 min-h-12 w-full text-[15px]">
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </Form>

      <p className="mt-6 text-center text-sm text-muted">
        New to Ledgerly?{' '}
        <Link to="/register" className="font-medium text-brand-ink">Create an account</Link>
      </p>

      {import.meta.env.VITE_USE_MOCK === 'true' && (
        <div className="mt-8 rounded-2xl bg-canvas p-4 text-xs leading-relaxed text-muted">
          <p className="mb-1 font-semibold text-ink">Demo mode (mock API)</p>
          <p>Admin: asha@example.com / Admin@123</p>
          <p>User: meera@example.com / Password@123</p>
        </div>
      )}
    </AuthShell>
  )
}
