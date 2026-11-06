import { useState } from 'react'
import { Link } from '../lib/router'
import { prefillEnquiry } from '../lib/widgets'

// The published payment plans, figures exactly as issued by the sales team.
const PLANS = [
  { area: 50, kind: 'Smart Property Unit', rate: 45000, total: 2250000, down: 675000, monthly: 43750 },
  { area: 667, kind: '1 BHK', rate: 40000, total: 26680000, down: 8004000, monthly: 518778 },
  { area: 673, kind: '1 BHK', rate: 40000, total: 26920000, down: 8076000, monthly: 523444 },
  { area: 734, kind: '1 BHK', rate: 40000, total: 29360000, down: 8808000, monthly: 570889 },
]

// Projected yearly return on the total amount, as given by the client.
const ROI = 0.12

const pkr = (n: number) => `PKR ${Math.round(n).toLocaleString('en-US')}`

/** Amounts as people here say them: PKR 2.67 crore, PKR 6.75 lakh. Under a lakh stays exact. */
const short = (n: number) => {
  const two = (x: number) => String(Number(x.toFixed(2)))
  if (n >= 1e7) return `PKR ${two(n / 1e7)} crore`
  if (n >= 1e5) return `PKR ${two(n / 1e5)} lakh`
  return pkr(n)
}

/** A published amount: the spoken form, with the exact figure under it. */
const Amount = ({ n }: { n: number }) => (
  <dd>{short(n)}{n >= 1e5 && <small>{pkr(n)}</small>}</dd>
)

/** Pick a plan to see its published price, down payment, installments and projected return. */
export function PaymentCalc() {
  const [picked, setPicked] = useState(0)
  const plan = PLANS[picked]
  const yearly = plan.total * ROI
  const enquire = () => prefillEnquiry(
    plan.kind === '1 BHK' ? 'Hotel apartment' : plan.kind,
    `I would like the figures for the ${plan.area} sq ft ${plan.kind}.`,
  )
  return (
    <div className="calc">
      <h3>Estimate your payments</h3>
      <div className="calc__plans" role="group" aria-label="Choose a unit">
        {PLANS.map((p, i) => (
          <button key={p.area} type="button" className={`calc__plan${i === picked ? ' on' : ''}`} aria-pressed={i === picked} onClick={() => setPicked(i)}>
            <strong>{p.area} sq ft</strong>
            <small>{p.kind}</small>
          </button>
        ))}
      </div>
      <dl className="calc__out">
        <div><dt>Rate per sq ft</dt><dd>{pkr(plan.rate)}</dd></div>
        <div><dt>Total amount</dt><Amount n={plan.total} /></div>
        <div><dt>Down payment (30%)</dt><Amount n={plan.down} /></div>
        <div><dt>Monthly × 36</dt><Amount n={plan.monthly} /></div>
      </dl>
      <h4 className="calc__sub">ROI calculator</h4>
      <dl className="calc__out calc__out--roi">
        <div><dt>Yearly return ({ROI * 100}%)</dt><dd>{short(yearly)}</dd></div>
        <div><dt>Monthly return ({ROI * 100 / 12}%)</dt><dd>{short(yearly / 12)}</dd></div>
        <div><dt>Return over 5 years</dt><dd>{short(yearly * 5)}</dd></div>
        <div><dt>Return over 10 years</dt><dd>{short(yearly * 10)}</dd></div>
        <div><dt>Years to pay back</dt><dd>{(1 / ROI).toFixed(1)} years</dd></div>
      </dl>
      <Link className="btn btn--sm calc__cta" to="/contact" onClick={enquire}>Get the figures for this unit <span className="btn__dot">→</span></Link>
      <p className="calc__note">Returns are projected on the total amount at {ROI * 100}% every year and are not guaranteed. Final pricing and schedule are confirmed by the sales team.</p>
    </div>
  )
}
