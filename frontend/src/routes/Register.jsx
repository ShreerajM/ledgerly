import { Form, Link, useActionData, useNavigation } from 'react-router'
import { AuthShell } from '../components/AuthShell.jsx'
import { Button, Field } from '../components/ui.jsx'

export function Component() {
  const data = useActionData()
  const busy = useNavigation().state === 'submitting'
  return (
    <AuthShell variant="signup">
      <title>Create account · Ledgerly</title>
      <h2 className="text-[30px] font-semibold tracking-[-0.025em]">Create your account</h2>
      <p className="mt-1.5 mb-7 text-[15px] text-muted">It takes less than a minute.</p>

      <Form method="post" noValidate className="flex flex-col gap-4">
        {data?.formError && (
          <p role="alert" className="rounded-xl bg-bad-bg px-4 py-3 text-sm text-bad">{data.formError}</p>
        )}
        <Field name="name" type="text" label="Full name" autoComplete="name" placeholder="Asha Verma" defaultValue={data?.values?.name} error={data?.errors?.name} />
        <Field name="email" type="email" label="Work email" autoComplete="email" placeholder="you@company.com" defaultValue={data?.values?.email} error={data?.errors?.email} />
        <Field name="password" type="password" label="Password" autoComplete="new-password" placeholder="At least 8 characters" hint="Use 8 or more characters with a number." error={data?.errors?.password} />
        <Field name="confirm" type="password" label="Confirm password" autoComplete="new-password" placeholder="Re-enter password" error={data?.errors?.confirm} />
        <Button type="submit" disabled={busy} className="mt-2 min-h-12 w-full text-[15px]">
          {busy ? 'Creating account…' : 'Create account'}
        </Button>
      </Form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account? <Link to="/login" className="font-medium text-brand-ink">Sign in</Link>
      </p>
    </AuthShell>
  )
}
