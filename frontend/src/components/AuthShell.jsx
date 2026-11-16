import { cx } from '../lib/cx.js'
import { Chip } from './ui.jsx'

const card = 'absolute rounded-[22px] bg-white text-ink shadow-2xl'

function SignInPreview() {
  return (
    <div aria-hidden className="relative h-[300px]">
      <div className={cx(card, 'top-0 left-0 w-[340px] p-6')}>
        <p className="text-xs font-medium text-muted">Settled, last 30 days</p>
        <p className="mt-1 mb-3 text-[30px] font-semibold tracking-[-0.03em]">₹4,82,650</p>
        <div className="flex h-16 items-end gap-1.5">
          {[50, 66, 42, 78, 58, 30, 86, 64, 92, 56, 72].map((h, i) => (
            <span key={i} style={{ height: `${h}%` }} className={cx('flex-1 rounded-md', i === 10 ? 'bg-[#cce3fa]' : 'bg-brand')} />
          ))}
        </div>
      </div>
      <div className={cx(card, 'top-[150px] left-[250px] flex w-[300px] items-center justify-between px-6 py-5')}>
        <div>
          <p className="text-xs text-muted">TXN-0049</p>
          <p className="text-[15px] font-semibold">₹8,250.00</p>
        </div>
        <Chip tone="ok" dot>Success</Chip>
      </div>
      <div className={cx(card, 'top-[210px] left-[60px] flex w-[240px] items-center justify-between px-6 py-4')}>
        <p className="text-sm font-semibold">4 failed</p>
        <Chip tone="bad" dot>Review</Chip>
      </div>
    </div>
  )
}

function SignUpPreview() {
  const rows = [['AV', 'Asha Verma', 'brand', 'Admin'], ['RD', 'Rohan Deshmukh', 'neutral', 'User'], ['FS', 'Farah Sheikh', 'neutral', 'User']]
  return (
    <div aria-hidden className="relative h-[320px]">
      <div className={cx(card, 'top-0 left-0 w-[360px] p-6')}>
        <p className="mb-3 text-[13px] font-semibold">Your team</p>
        {rows.map(([ini, name, tone, role]) => (
          <div key={name} className="flex items-center gap-3 py-2">
            <span className="grid size-[34px] place-items-center rounded-full bg-chip text-xs font-semibold text-[#424245]">{ini}</span>
            <span className="flex-1 text-sm font-medium">{name}</span>
            <Chip tone={tone}>{role}</Chip>
          </div>
        ))}
      </div>
      <div className={cx(card, 'top-[200px] left-[230px] w-[300px] px-6 py-5')}>
        <p className="text-xs text-muted">New transaction</p>
        <p className="mt-1 mb-3.5 text-[26px] font-semibold tracking-[-0.03em]">₹12,400.00</p>
        <div className="flex items-center justify-between">
          <Chip tone="warn" dot>Pending</Chip>
          <span className="rounded-full bg-brand px-4 py-1.5 text-[13px] font-medium text-white">Create</span>
        </div>
      </div>
    </div>
  )
}

export function AuthShell({ variant, children }) {
  const signin = variant === 'signin'
  return (
    <div className={cx('min-h-dvh lg:flex', !signin && 'lg:flex-row-reverse')}>
      <section className="relative overflow-hidden bg-hero px-7 pt-14 pb-16 text-white lg:flex lg:flex-1 lg:flex-col lg:gap-8 lg:p-14">
        <div aria-hidden className="absolute top-10 -right-24 size-72 rounded-full bg-brand opacity-35 blur-[70px] lg:size-[420px]" />
        <p className="relative text-xl font-semibold tracking-tight">Ledgerly</p>
        <div className="relative mt-9 lg:mt-6">
          <h1 className="text-4xl leading-[1.08] font-semibold tracking-[-0.035em] lg:text-[50px]">
            {signin ? (<>Every rupee,<br />accounted for.</>) : (<>Up and running<br />in minutes.</>)}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#b9c6e4] lg:text-base">
            {signin
              ? 'Track transactions, see what is pending, and catch failures before your client does.'
              : 'Create your account and start recording transactions today.'}
          </p>
        </div>
        <div className="relative mt-auto hidden lg:block">{signin ? <SignInPreview /> : <SignUpPreview />}</div>
      </section>
      <section className="relative -mt-7 flex-1 rounded-t-[28px] bg-white px-6 py-8 lg:mt-0 lg:flex lg:items-center lg:justify-center lg:rounded-none lg:p-14">
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </section>
    </div>
  )
}
