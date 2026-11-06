import { useState } from 'react'

// The published payment plans, figures exactly as issued by the sales team.
const PLANS = [
  { area: 50, kind: 'Smart Property Unit', rate: 45000, total: 2250000, down: 675000, monthly: 43750 },
  { area: 667, kind: '1 BHK', rate: 40000, total: 26680000, down: 8004000, monthly: 518778 },
  { area: 673, kind: '1 BHK', rate: 40000, total: 26920000, down: 8076000, monthly: 523444 },
  { area: 734, kind: '1 BHK', rate: 40000, total: 29360000, down: 8808000, monthly: 570889 },
]

// Projected yearly return on the total amount, as given by the client.
const ROI = 0.12

const pkr = (n: number) => `PKR ${n.toLocaleString('en-US')}`

/** Pick a plan to see its published price, down payment, installments and projected return. */
export function PaymentCalc() {
  const [picked, setPicked] = useState(0)
  const plan = PLANS[picked]
  const yearly = plan.total * ROI
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
        <div><dt>Total amount</dt><dd>{pkr(plan.total)}</dd></div>
        <div><dt>Down payment (30%)</dt><dd>{pkr(plan.down)}</dd></div>
        <div><dt>Monthly × 36</dt><dd>{pkr(plan.monthly)}</dd></div>
      </dl>
      <h4 className="calc__sub">ROI calculator</h4>
      <dl className="calc__out calc__out--roi">
        <div><dt>Yearly return ({ROI * 100}%)</dt><dd>{pkr(yearly)}</dd></div>
        <div><dt>Monthly return ({ROI * 100 / 12}%)</dt><dd>{pkr(yearly / 12)}</dd></div>
      </dl>
      <p className="calc__note">Returns are projected on the total amount and are not guaranteed. Final pricing and schedule are confirmed by the sales team.</p>
    </div>
  )
}
