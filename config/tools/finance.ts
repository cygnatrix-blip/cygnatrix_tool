import type { ToolConfig } from '@/types/tool';

const UPDATED = '2026-08-27';

const base = {
  category: 'finance' as const,
  toolType: 'calculator' as const,
  active: true,
  updatedAt: UPDATED,
};

export const FINANCE_TOOLS: ToolConfig[] = [
  {
    ...base,
    id: 'emi-calculator',
    name: 'EMI Calculator',
    slug: 'emi-calculator',
    path: '/finance/emi-calculator',
    icon: 'landmark',
    featured: true,
    popular: true,
    sortOrder: 1,
    shortDescription: 'Calculate monthly EMI, total interest and total repayment.',
    description:
      'Work out the Equated Monthly Instalment for any loan. See the full amortization schedule, the principal-versus-interest split and a breakdown chart.',
    keywords: ['emi calculator', 'loan emi', 'home loan emi', 'car loan emi', 'monthly instalment', 'equated monthly instalment'],
    seoTitle: 'EMI Calculator — Monthly Loan Instalment, Interest & Schedule',
    seoDescription:
      'Free EMI calculator for home, car and personal loans. Instantly see your monthly EMI, total interest, total repayment, amortization schedule and a principal vs interest chart. In ₹.',
    content: {
      howItWorks: [
        { title: 'Enter the loan amount', body: 'The principal — the amount you borrow.' },
        { title: 'Enter the interest rate', body: 'The annual rate your lender quotes, as a percentage.' },
        { title: 'Enter the tenure', body: 'The repayment period in months or years. The EMI, totals, schedule and chart update instantly.' },
      ],
      features: [
        'Instant monthly EMI',
        'Total interest and total repayment',
        'Full month-by-month amortization schedule',
        'Principal vs interest donut chart',
        'Handles 0% interest correctly',
        'Nothing stored — the maths runs in your browser',
      ],
      formula: {
        expression: 'EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1)',
        where: [
          { sym: 'P', meaning: 'Principal (loan amount)' },
          { sym: 'r', meaning: 'Monthly interest rate = annual rate ÷ 12 ÷ 100' },
          { sym: 'n', meaning: 'Number of monthly instalments' },
        ],
        notes: ['When r = 0, the loan is repaid in equal instalments of P ÷ n with no interest.'],
      },
      example: {
        inputs: [
          { label: 'Loan amount', value: '₹25,00,000' },
          { label: 'Interest rate', value: '8.5% per year' },
          { label: 'Tenure', value: '20 years (240 months)' },
        ],
        result: [
          { label: 'Monthly EMI', value: '≈ ₹21,696' },
          { label: 'Total interest', value: '≈ ₹27,07,000' },
          { label: 'Total repayment', value: '≈ ₹52,07,000' },
        ],
        walkthrough:
          'With r = 8.5 ÷ 12 ÷ 100 = 0.0070833 and n = 240, (1 + r)^n ≈ 5.44. EMI = 2500000 × 0.0070833 × 5.44 ÷ 4.44 ≈ ₹21,696. Over 240 months that is about ₹52.07 lakh, of which ₹27.07 lakh is interest.',
      },
      sections: [
        {
          heading: 'Why early EMIs are mostly interest',
          paragraphs: [
            'Interest each month is charged on the outstanding balance. At the start the balance is highest, so most of your fixed EMI goes to interest and only a little reduces the principal. As the balance falls, the interest portion shrinks and the principal portion grows.',
            'The amortization schedule shows this crossover point — the month where you finally start paying off more principal than interest.',
          ],
        },
      ],
    },
    faq: [
      { q: 'Does a higher tenure reduce my EMI?', a: 'Yes, but it increases the total interest you pay because the balance reduces more slowly. The calculator shows both figures so you can weigh the trade-off.' },
      { q: 'Is the EMI fixed for the whole loan?', a: 'For a fixed-rate loan, yes. For a floating-rate loan the EMI (or the tenure) changes whenever your lender revises the rate. Re-run the calculator with the new rate to see the effect.' },
      { q: 'Does this include processing fees or insurance?', a: 'No. It calculates the pure loan EMI. Add any one-time fees separately.' },
      { q: 'What if my interest rate is 0%?', a: 'The calculator handles it — the EMI becomes simply the loan amount divided by the number of months.' },
    ],
    relatedTools: ['loan-calculator', 'sip-calculator', 'fd-calculator', 'salary-calculator'],
  },
  {
    ...base,
    id: 'sip-calculator',
    name: 'SIP Calculator',
    slug: 'sip-calculator',
    path: '/finance/sip-calculator',
    icon: 'trending-up',
    featured: true,
    popular: true,
    sortOrder: 2,
    shortDescription: 'Estimate the future value of a monthly mutual-fund SIP.',
    description:
      'Project what a monthly Systematic Investment Plan could grow to. See total invested, estimated gains and a year-by-year growth chart. Optional annual step-up.',
    keywords: ['sip calculator', 'mutual fund sip', 'systematic investment plan', 'sip returns', 'sip future value', 'step up sip'],
    seoTitle: 'SIP Calculator — Mutual Fund SIP Returns & Future Value',
    seoDescription:
      'Free SIP calculator. Estimate the maturity value of a monthly mutual fund SIP with total invested, estimated returns, a growth chart and an optional annual step-up. In ₹.',
    content: {
      howItWorks: [
        { title: 'Enter your monthly investment', body: 'The amount you plan to invest every month.' },
        { title: 'Enter an expected return', body: 'A realistic long-term annual return for your fund category (equity funds have historically averaged 10–13%).' },
        { title: 'Enter the period', body: 'How many years you will keep investing. Add an annual step-up if you plan to raise the amount each year.' },
      ],
      features: [
        'Total invested vs estimated returns',
        'Estimated final value',
        'Year-by-year growth chart',
        'Optional annual step-up',
        'Handles 0% return as plain savings',
        'Clearly labelled as an estimate, not a guarantee',
      ],
      formula: {
        expression: 'FV = P × [ ((1 + i)^n − 1) ÷ i ] × (1 + i)',
        where: [
          { sym: 'P', meaning: 'Monthly investment amount' },
          { sym: 'i', meaning: 'Monthly return = annual return ÷ 12 ÷ 100' },
          { sym: 'n', meaning: 'Total number of monthly instalments' },
        ],
        notes: ['Contributions are assumed at the start of each month. When i = 0, FV = P × n.'],
      },
      example: {
        inputs: [
          { label: 'Monthly investment', value: '₹10,000' },
          { label: 'Expected return', value: '12% per year' },
          { label: 'Period', value: '10 years' },
        ],
        result: [
          { label: 'Total invested', value: '₹12,00,000' },
          { label: 'Estimated returns', value: '≈ ₹11,20,000' },
          { label: 'Estimated final value', value: '≈ ₹23,20,000' },
        ],
        walkthrough:
          'With i = 0.01 and n = 120, the annuity factor ((1.01^120 − 1) ÷ 0.01) × 1.01 ≈ 232. Multiplied by ₹10,000 that is roughly ₹23.2 lakh, against ₹12 lakh invested — an estimated gain of about ₹11.2 lakh.',
      },
      sections: [
        {
          heading: 'Why the return is only an estimate',
          paragraphs: [
            'This calculator assumes a steady monthly return. Real equity markets rise and fall — some years up 25%, some down 15%. Over long periods the average tends to smooth out, which is why SIPs work, but the final value can land well above or below the projection.',
            'Use a conservative return (say 10–11% for equity) for planning, and treat the result as a range rather than a precise figure.',
          ],
        },
      ],
    },
    faq: [
      { q: 'Are these returns guaranteed?', a: 'No. Mutual fund returns are market-linked and not guaranteed. The calculator projects a constant return for illustration only. Actual results will vary, and you can lose money.' },
      { q: 'What return rate should I use?', a: 'For diversified equity funds, 10–12% is a common long-term planning assumption. For hybrid funds use 8–10%, and for debt funds 6–7%. Past performance does not guarantee future returns.' },
      { q: 'What does the annual step-up do?', a: 'It increases your monthly investment by a fixed percentage each year, modelling the common practice of investing more as your income grows. It significantly raises the final value.' },
      { q: 'Does this account for exit load or capital gains tax?', a: 'No. The projection is before costs and taxes. Factor those in separately when planning.' },
    ],
    relatedTools: ['emi-calculator', 'cagr-calculator', 'fd-calculator', 'rd-calculator'],
  },
  {
    ...base,
    id: 'fd-calculator',
    name: 'FD Calculator',
    slug: 'fd-calculator',
    path: '/finance/fd-calculator',
    icon: 'piggy-bank',
    featured: false,
    popular: true,
    sortOrder: 3,
    shortDescription: 'Calculate fixed deposit maturity value and interest earned.',
    description:
      'Find the maturity amount and total interest on a fixed deposit for any principal, rate, tenure and compounding frequency.',
    keywords: ['fd calculator', 'fixed deposit calculator', 'fd maturity', 'fd interest', 'bank fd returns'],
    seoTitle: 'FD Calculator — Fixed Deposit Maturity & Interest',
    seoDescription:
      'Free fixed deposit calculator. Compute FD maturity value and interest earned for any principal, interest rate, tenure and compounding frequency (monthly, quarterly, half-yearly, yearly). In ₹.',
    content: {
      howItWorks: [
        { title: 'Enter the principal', body: 'The lump sum you deposit.' },
        { title: 'Enter the rate and tenure', body: 'The annual interest rate the bank offers and the deposit term.' },
        { title: 'Choose the compounding frequency', body: 'Most Indian banks compound quarterly. The maturity value and interest are shown instantly.' },
      ],
      features: [
        'Maturity value and interest earned',
        'Monthly, quarterly, half-yearly or yearly compounding',
        'Works for any tenure from 1 month to 50 years',
        'Handles 0% rate',
        'Instant, private, in-browser calculation',
      ],
      formula: {
        expression: 'M = P × (1 + r ÷ (100 × f)) ^ (f × t)',
        where: [
          { sym: 'P', meaning: 'Principal deposited' },
          { sym: 'r', meaning: 'Annual interest rate (%)' },
          { sym: 'f', meaning: 'Compounding periods per year (1, 2, 4 or 12)' },
          { sym: 't', meaning: 'Tenure in years' },
        ],
      },
      example: {
        inputs: [
          { label: 'Principal', value: '₹1,00,000' },
          { label: 'Rate', value: '7% per year' },
          { label: 'Tenure', value: '5 years' },
          { label: 'Compounding', value: 'Quarterly' },
        ],
        result: [
          { label: 'Maturity value', value: '≈ ₹1,41,478' },
          { label: 'Interest earned', value: '≈ ₹41,478' },
        ],
        walkthrough:
          'Quarterly compounding means f = 4 and 20 periods over 5 years, each adding 7 ÷ 4 = 1.75%. ₹1,00,000 × 1.0175^20 ≈ ₹1,41,478.',
      },
    },
    faq: [
      { q: 'Does this calculate TDS on FD interest?', a: 'No. Banks deduct TDS if interest exceeds the annual threshold and you have not submitted Form 15G/15H. The calculator shows gross interest; subtract applicable tax yourself.' },
      { q: 'Which compounding frequency should I choose?', a: 'Use whatever your bank states. Cumulative FDs in India almost always compound quarterly.' },
      { q: 'Is the FD rate fixed for the whole term?', a: 'Yes. Once booked, the rate is locked for the tenure regardless of later rate changes — that is the point of a fixed deposit.' },
      { q: 'What about premature withdrawal?', a: 'Breaking an FD early usually attracts a penalty (often 0.5–1% lower rate). This calculator assumes the deposit runs to maturity.' },
    ],
    relatedTools: ['rd-calculator', 'sip-calculator', 'cagr-calculator', 'emi-calculator'],
  },
  {
    ...base,
    id: 'rd-calculator',
    name: 'RD Calculator',
    slug: 'rd-calculator',
    path: '/finance/rd-calculator',
    icon: 'calendar-clock',
    featured: false,
    popular: false,
    sortOrder: 4,
    shortDescription: 'Calculate recurring deposit maturity value and interest.',
    description:
      'Find the maturity amount on a recurring deposit where you invest a fixed sum every month, with interest compounded quarterly the way Indian banks do it.',
    keywords: ['rd calculator', 'recurring deposit calculator', 'rd maturity', 'monthly deposit scheme', 'rd interest'],
    seoTitle: 'RD Calculator — Recurring Deposit Maturity & Interest',
    seoDescription:
      'Free recurring deposit calculator. Compute RD maturity value, total deposited and interest earned for any monthly deposit, rate and tenure. Quarterly compounding. In ₹.',
    content: {
      howItWorks: [
        { title: 'Enter the monthly deposit', body: 'The fixed amount you will pay in each month.' },
        { title: 'Enter the rate and tenure', body: 'The annual interest rate and the number of months the RD runs.' },
        { title: 'Read the result', body: 'Maturity value, total deposited and interest earned appear instantly.' },
      ],
      features: [
        'Maturity value, total deposited and interest earned',
        'Quarterly compounding (Indian bank convention)',
        'Any tenure from 6 months upward',
        'Handles 0% rate',
        'Private, in-browser calculation',
      ],
      formula: {
        expression: 'Each instalment compounds for its remaining term: balanceₖ = (balanceₖ₋₁ + D) × m',
        where: [
          { sym: 'D', meaning: 'Fixed monthly deposit' },
          { sym: 'm', meaning: 'Equivalent monthly growth factor = (1 + r ÷ (100 × f)) ^ (f ÷ 12)' },
          { sym: 'f', meaning: 'Compounding periods per year (4 for quarterly)' },
          { sym: 'r', meaning: 'Annual interest rate (%)' },
        ],
      },
      example: {
        inputs: [
          { label: 'Monthly deposit', value: '₹5,000' },
          { label: 'Rate', value: '7% per year' },
          { label: 'Tenure', value: '24 months' },
        ],
        result: [
          { label: 'Total deposited', value: '₹1,20,000' },
          { label: 'Maturity value', value: '≈ ₹1,29,000' },
          { label: 'Interest earned', value: '≈ ₹9,000' },
        ],
        walkthrough:
          'The first ₹5,000 earns interest for all 24 months; the last earns it for one. Compounding each instalment quarterly and summing gives a maturity of roughly ₹1.29 lakh.',
      },
    },
    faq: [
      { q: 'Why is RD interest lower than an FD for the same amount?', a: 'In an RD your money goes in gradually, so on average it is invested for about half the tenure. An FD puts the whole sum to work from day one.' },
      { q: 'Is TDS deducted on RD interest?', a: 'Yes, banks apply TDS on RD interest above the annual threshold, the same as FDs. The calculator shows gross interest.' },
      { q: 'What if I miss a monthly instalment?', a: 'Banks usually charge a small penalty and the maturity value drops. This calculator assumes every instalment is paid on time.' },
      { q: 'Can the monthly amount change during the RD?', a: 'No. A standard RD has a fixed monthly instalment set when you open it.' },
    ],
    relatedTools: ['fd-calculator', 'sip-calculator', 'emi-calculator', 'cagr-calculator'],
  },
  {
    ...base,
    id: 'gst-calculator',
    name: 'GST Calculator',
    slug: 'gst-calculator',
    path: '/finance/gst-calculator',
    icon: 'receipt',
    featured: false,
    popular: true,
    sortOrder: 5,
    shortDescription: 'Add or remove GST and split it into CGST and SGST.',
    description:
      'Calculate GST on any amount. Add GST to a base price, or extract the GST already included in a total. See the CGST/SGST split or IGST for inter-state supply.',
    keywords: ['gst calculator', 'gst india', 'cgst sgst calculator', 'add gst', 'remove gst', 'reverse gst', 'igst calculator'],
    seoTitle: 'GST Calculator — Add or Remove GST, CGST & SGST Split',
    seoDescription:
      'Free India GST calculator. Add GST to a net price or back out GST from a gross amount at 0.25%, 3%, 5%, 12%, 18% or 28%. Shows base amount, GST, CGST, SGST, IGST and total.',
    content: {
      howItWorks: [
        { title: 'Enter the amount', body: 'The price you are working with.' },
        { title: 'Choose exclusive or inclusive', body: 'Exclusive = the amount is before GST. Inclusive = GST is already in the amount and should be extracted.' },
        { title: 'Pick the GST rate', body: 'Select the slab. The base amount, GST, CGST/SGST split and total update instantly.' },
      ],
      features: [
        'Add GST (exclusive) or remove GST (inclusive)',
        'CGST and SGST split for intra-state supply',
        'Single IGST for inter-state supply',
        'All standard Indian slabs, plus a custom rate',
        'Instant, in-browser calculation',
      ],
      formula: {
        expression: 'Exclusive: GST = A × R ÷ 100.  Inclusive: Base = A × 100 ÷ (100 + R)',
        where: [
          { sym: 'A', meaning: 'Amount entered' },
          { sym: 'R', meaning: 'GST rate (%)' },
        ],
        notes: ['For intra-state supply, CGST = SGST = GST ÷ 2. For inter-state supply, IGST = GST.'],
      },
      example: {
        inputs: [
          { label: 'Amount', value: '₹1,000' },
          { label: 'Type', value: 'Exclusive (add GST)' },
          { label: 'Rate', value: '18%' },
        ],
        result: [
          { label: 'GST', value: '₹180 (CGST ₹90 + SGST ₹90)' },
          { label: 'Total', value: '₹1,180' },
        ],
        walkthrough:
          'GST = 1000 × 18 ÷ 100 = ₹180, split equally into CGST ₹90 and SGST ₹90. The invoice total becomes ₹1,180. To reverse: 1180 × 100 ÷ 118 = ₹1,000 base.',
      },
    },
    faq: [
      { q: 'What is the difference between CGST, SGST and IGST?', a: 'For a sale within the same state, GST is split equally into Central GST and State GST. For a sale across state lines, a single Integrated GST is charged at the full rate instead.' },
      { q: 'How do I remove GST from a price that already includes it?', a: 'Choose “inclusive”. The calculator divides by (100 + rate) and multiplies by 100 to find the pre-GST base, then shows the GST portion.' },
      { q: 'Which GST rate applies to my product?', a: 'GST rates depend on the HSN/SAC classification of the goods or service. Common slabs are 5%, 12%, 18% and 28%, with 0.25% and 3% for specific items. Check the official rate finder for your product.' },
      { q: 'Is the rate configuration easy to update?', a: 'Yes. Rates live in one place in our code, and you can also type any custom rate directly into the calculator.' },
    ],
    relatedTools: ['salary-calculator', 'emi-calculator', 'loan-calculator', 'cagr-calculator'],
  },
  {
    ...base,
    id: 'loan-calculator',
    name: 'Loan Calculator',
    slug: 'loan-calculator',
    path: '/finance/loan-calculator',
    icon: 'banknote',
    featured: false,
    popular: true,
    sortOrder: 6,
    shortDescription: 'Full loan breakdown: EMI, total interest, repayment and schedule.',
    description:
      'A complete loan calculator showing the monthly instalment, the total interest cost, the total repayment and a month-by-month amortization schedule.',
    keywords: ['loan calculator', 'personal loan calculator', 'loan repayment', 'loan interest calculator', 'amortization schedule'],
    seoTitle: 'Loan Calculator — EMI, Interest, Repayment & Amortization',
    seoDescription:
      'Free loan calculator. Enter the amount, rate and tenure to see the monthly EMI, total interest, total repayment and a full amortization schedule with a payoff chart. In ₹.',
    content: {
      howItWorks: [
        { title: 'Enter the loan amount', body: 'How much you want to borrow.' },
        { title: 'Enter the rate and tenure', body: 'The annual interest rate and repayment period.' },
        { title: 'Review the breakdown', body: 'EMI, total interest, total repayment and the amortization schedule appear instantly.' },
      ],
      features: [
        'Monthly EMI',
        'Total interest and total repayment',
        'Full amortization schedule',
        'Principal vs interest chart',
        'Yearly summary of principal and interest paid',
        'Correct handling of 0% interest',
      ],
      formula: {
        expression: 'EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1)',
        where: [
          { sym: 'P', meaning: 'Loan amount' },
          { sym: 'r', meaning: 'Monthly interest rate = annual rate ÷ 12 ÷ 100' },
          { sym: 'n', meaning: 'Number of monthly instalments' },
        ],
        notes: ['The Loan Calculator and EMI Calculator share one calculation engine, so results always match.'],
      },
      example: {
        inputs: [
          { label: 'Loan amount', value: '₹8,00,000' },
          { label: 'Interest rate', value: '11% per year' },
          { label: 'Tenure', value: '5 years (60 months)' },
        ],
        result: [
          { label: 'Monthly EMI', value: '≈ ₹17,393' },
          { label: 'Total interest', value: '≈ ₹2,43,600' },
          { label: 'Total repayment', value: '≈ ₹10,43,600' },
        ],
        walkthrough:
          'With r = 11 ÷ 1200 ≈ 0.009167 and n = 60, (1 + r)^n ≈ 1.729. EMI = 800000 × 0.009167 × 1.729 ÷ 0.729 ≈ ₹17,393. Total paid over 60 months is about ₹10.44 lakh.',
      },
      sections: [
        {
          heading: 'Reading the amortization schedule',
          paragraphs: [
            'Each row is one instalment. “Interest” is that month’s charge on the opening balance; “Principal” is the rest of the EMI, which actually reduces what you owe. Watch the closing balance fall to zero on the final row.',
            'Making a prepayment reduces the balance immediately, which cuts every future interest charge — the schedule is a good way to see how much a lump-sum prepayment early in the loan would save.',
          ],
        },
      ],
    },
    faq: [
      { q: 'How is this different from the EMI Calculator?', a: 'It uses the same formula and engine. The Loan Calculator leads with the total cost of borrowing and the schedule; the EMI Calculator leads with the monthly figure. Use whichever framing you prefer.' },
      { q: 'Can I model prepayments?', a: 'Not yet in a single run, but you can re-run the calculator with the reduced balance and a shorter tenure to approximate the effect of a prepayment.' },
      { q: 'Does it handle floating rates?', a: 'It calculates for one fixed rate. If your rate changes, re-run with the new rate and remaining tenure.' },
      { q: 'Are fees included?', a: 'No. Processing fees, insurance and stamp duty are separate one-time costs.' },
    ],
    relatedTools: ['emi-calculator', 'sip-calculator', 'fd-calculator', 'gst-calculator'],
  },
  {
    ...base,
    id: 'cagr-calculator',
    name: 'CAGR Calculator',
    slug: 'cagr-calculator',
    path: '/finance/cagr-calculator',
    icon: 'percent',
    featured: false,
    popular: false,
    sortOrder: 7,
    shortDescription: 'Find the compound annual growth rate of an investment.',
    description:
      'Calculate the Compound Annual Growth Rate between a starting value and an ending value over a number of years — the standard way to compare investment performance.',
    keywords: ['cagr calculator', 'compound annual growth rate', 'investment growth rate', 'annualised return', 'cagr formula'],
    seoTitle: 'CAGR Calculator — Compound Annual Growth Rate',
    seoDescription:
      'Free CAGR calculator. Enter the initial value, final value and number of years to get the compound annual growth rate, the absolute return and the growth multiple.',
    content: {
      howItWorks: [
        { title: 'Enter the initial value', body: 'What the investment was worth at the start.' },
        { title: 'Enter the final value', body: 'What it is worth now, or at the end of the period.' },
        { title: 'Enter the number of years', body: 'The CAGR, absolute return and growth multiple appear instantly.' },
      ],
      features: [
        'Compound annual growth rate (%)',
        'Absolute (total) return (%)',
        'Growth multiple (e.g. 2.4×)',
        'Accepts fractional years',
        'Handles losses (negative CAGR)',
      ],
      formula: {
        expression: 'CAGR = (Final ÷ Initial) ^ (1 ÷ years) − 1',
        where: [
          { sym: 'Initial', meaning: 'Starting value of the investment' },
          { sym: 'Final', meaning: 'Ending value of the investment' },
          { sym: 'years', meaning: 'Holding period in years' },
        ],
      },
      example: {
        inputs: [
          { label: 'Initial value', value: '₹1,00,000' },
          { label: 'Final value', value: '₹2,00,000' },
          { label: 'Period', value: '5 years' },
        ],
        result: [
          { label: 'CAGR', value: '≈ 14.87%' },
          { label: 'Absolute return', value: '100%' },
          { label: 'Growth multiple', value: '2.0×' },
        ],
        walkthrough:
          '(200000 ÷ 100000) ^ (1 ÷ 5) − 1 = 2^0.2 − 1 ≈ 1.1487 − 1 = 0.1487, i.e. about 14.87% compounded every year for 5 years.',
      },
      sections: [
        {
          heading: 'CAGR vs absolute return',
          paragraphs: [
            'Absolute return tells you the total growth over the whole period — doubling your money is a 100% absolute return whether it took 2 years or 20.',
            'CAGR converts that into a yearly rate so investments held for different lengths of time can be compared fairly. It is the number fund fact-sheets quote.',
          ],
        },
      ],
    },
    faq: [
      { q: 'Is CAGR the same as the actual yearly return?', a: 'No. CAGR is a smoothed average. The investment may have gained 40% one year and lost 10% the next; CAGR is the single constant rate that would produce the same final value.' },
      { q: 'Can CAGR be negative?', a: 'Yes. If the final value is below the initial value, the CAGR is negative — the investment shrank at that compounded rate each year.' },
      { q: 'Does CAGR account for additional investments made along the way?', a: 'No. CAGR is for a single lump sum. For regular contributions use XIRR (not covered here) or our SIP calculator for projections.' },
      { q: 'What period should I use for stock or fund comparison?', a: 'Use the same period for every option you compare — 3, 5 or 10 years are standard. Short periods are heavily influenced by market timing.' },
    ],
    relatedTools: ['sip-calculator', 'fd-calculator', 'rd-calculator', 'emi-calculator'],
  },
  {
    ...base,
    id: 'salary-calculator',
    name: 'Salary Calculator',
    slug: 'salary-calculator',
    path: '/finance/salary-calculator',
    icon: 'wallet',
    featured: true,
    popular: true,
    sortOrder: 8,
    shortDescription: 'Estimate in-hand salary from CTC with PF, tax and deductions.',
    description:
      'Break an annual CTC into basic, HRA, allowances and employer PF, then subtract employee PF, professional tax and income tax to estimate monthly take-home pay.',
    keywords: ['salary calculator', 'in hand salary', 'ctc to take home', 'take home salary india', 'net salary calculator', 'ctc breakup'],
    seoTitle: 'Salary Calculator India — CTC to In-Hand Take-Home Pay',
    seoDescription:
      'Free India salary calculator. Convert annual CTC to estimated monthly in-hand salary with a full breakup: basic, HRA, special allowance, employee & employer PF, professional tax and income tax (new or old regime).',
    content: {
      howItWorks: [
        { title: 'Enter your annual CTC', body: 'The total cost to company from your offer letter.' },
        { title: 'Adjust the assumptions (optional)', body: 'Set the basic %, HRA %, professional tax, tax regime and whether PF applies.' },
        { title: 'Read the take-home estimate', body: 'The calculator shows the full CTC breakup and your estimated monthly and annual in-hand salary.' },
      ],
      features: [
        'CTC → gross → in-hand breakdown',
        'Basic, HRA and special allowance split',
        'Employee and employer Provident Fund',
        'Professional tax and income tax (new & old regime)',
        'Every assumption listed on screen',
        'Rules kept in one dated config file for easy updates',
      ],
      formula: {
        expression: 'In-hand = Gross − Employee PF − Professional Tax − Income Tax − Other deductions',
        where: [
          { sym: 'Gross', meaning: 'Basic + HRA + Special allowance (= CTC − Employer PF)' },
          { sym: 'Basic', meaning: 'A set percentage of CTC (default 40%)' },
          { sym: 'HRA', meaning: 'A percentage of Basic (default 50%)' },
          { sym: 'Employee PF', meaning: '12% of Basic' },
        ],
        notes: [
          'Income tax uses the FY 2024-25 slabs with standard deduction and the 87A rebate.',
          'This is an estimate — it excludes HRA exemption, 80C/80D and other personal exemptions.',
        ],
      },
      example: {
        inputs: [
          { label: 'Annual CTC', value: '₹12,00,000' },
          { label: 'Basic', value: '40% of CTC' },
          { label: 'Regime', value: 'New' },
        ],
        result: [
          { label: 'Gross (annual)', value: '≈ ₹11,42,000' },
          { label: 'Total deductions', value: '≈ ₹1,15,000' },
          { label: 'In-hand (monthly)', value: '≈ ₹85,600' },
        ],
        walkthrough:
          'Basic = ₹4.8L, HRA = ₹2.4L, employer PF = ₹57,600, so gross ≈ ₹11.42L. Deduct employee PF ₹57,600, professional tax ₹2,500 and estimated income tax, leaving roughly ₹85,600 per month.',
      },
      sections: [
        {
          heading: 'Why your payslip may differ',
          paragraphs: [
            'Every company structures CTC differently — some add gratuity, meal cards, insurance premiums or variable pay into the figure. Your actual basic and allowance split is set by your employer, not a formula.',
            'Income tax on a payslip also reflects your investment declarations (80C, 80D, home loan interest, HRA rent proof). This calculator deliberately ignores those so it gives a conservative baseline; your real take-home is usually a little higher once exemptions are applied.',
          ],
        },
      ],
    },
    faq: [
      { q: 'Is this the exact salary I will receive?', a: 'No — it is a planning estimate. It uses standard assumptions for the CTC split and a simplified tax calculation. Your offer letter and first payslip are the authoritative figures.' },
      { q: 'New regime or old regime — which does it use?', a: 'You choose. The new regime is the default. The old regime allows more deductions but has higher slab rates; the calculator applies the standard deduction for whichever you pick.' },
      { q: 'Can I turn off Provident Fund?', a: 'Yes. Some roles and salary levels are outside mandatory PF. Toggle it off and the calculator removes both the employee deduction and the employer contribution.' },
      { q: 'How is this kept up to date with tax changes?', a: 'All slabs, PF rates and the professional tax figure live in a single dated configuration file. When the Budget changes a rule, that one file is updated and every result stays correct.' },
    ],
    relatedTools: ['gst-calculator', 'emi-calculator', 'sip-calculator', 'loan-calculator'],
  },
  {
    ...base,
    id: 'income-tax-calculator',
    name: 'Income Tax Calculator',
    slug: 'income-tax-calculator',
    path: '/finance/income-tax-calculator',
    icon: 'file-text',
    featured: true,
    popular: true,
    sortOrder: 9,
    shortDescription: 'Compare old vs new tax regime side by side for FY 2024-25.',
    description:
      'Enter your annual income and old-regime deductions to see income tax under both regimes side by side, with the standard deduction, taxable income, effective rate and which regime saves you more.',
    keywords: ['income tax calculator', 'old vs new tax regime', 'income tax india', 'new tax regime calculator', 'tax slabs fy 2024-25', 'income tax comparison'],
    seoTitle: 'Income Tax Calculator — Old vs New Regime Comparison',
    seoDescription:
      'Free India income tax calculator. Compare tax payable under the old and new regimes side by side for FY 2024-25, including standard deduction, 87A rebate, cess and which regime saves you more.',
    content: {
      howItWorks: [
        { title: 'Enter your annual income', body: 'Gross income before any deduction.' },
        { title: 'Enter old-regime deductions', body: 'Combine 80C, 80D, home loan interest and any other old-regime-only deductions into one figure.' },
        { title: 'Compare the two regimes', body: 'Tax, effective rate and in-hand income appear for both the old and new regime side by side, with the cheaper one highlighted.' },
      ],
      features: [
        'Old and new regime shown side by side',
        'Standard deduction applied automatically for each regime',
        'Section 87A rebate handled correctly',
        '4% health & education cess included',
        'Highlights which regime saves you money, and by how much',
        'Tax slabs kept in one dated config file for easy updates',
      ],
      formula: {
        expression: 'Tax = Σ(slab band × slab rate) on taxable income, × 1.04 for cess',
        where: [
          { sym: 'Taxable income', meaning: 'Annual income − standard deduction − (old regime only) other deductions' },
          { sym: 'Slabs', meaning: 'Progressive bands defined for each regime for the financial year' },
        ],
        notes: ['Rebate under Section 87A makes tax nil below a taxable-income threshold that differs by regime.'],
      },
      example: {
        inputs: [
          { label: 'Annual income', value: '₹12,00,000' },
          { label: 'Old regime deductions', value: '₹1,50,000' },
        ],
        result: [
          { label: 'Old regime tax', value: '≈ ₹96,000' },
          { label: 'New regime tax', value: '≈ ₹83,200' },
          { label: 'Better regime', value: 'New — saves ≈ ₹12,800' },
        ],
        walkthrough:
          'Old regime taxable income = 12,00,000 − 50,000 standard deduction − 1,50,000 deductions = 10,00,000. New regime taxable income = 12,00,000 − 75,000 = 11,25,000. Applying each regime\'s slabs and 4% cess gives the two tax figures compared above.',
      },
      sections: [
        {
          heading: 'Which regime should you pick?',
          paragraphs: [
            'The new regime has lower slab rates and a higher standard deduction but does not allow 80C, 80D, HRA exemption or home loan interest deductions. The old regime has higher rates but rewards those deductions.',
            'As a rule of thumb: if your old-regime deductions comfortably exceed roughly ₹3–4 lakh, the old regime often wins at middle incomes. Below that, the new regime usually comes out ahead. Run both numbers here rather than guessing.',
          ],
        },
      ],
    },
    faq: [
      { q: 'Which financial year do these slabs apply to?', a: 'FY 2024-25, as announced in the July 2024 Budget. Slabs are reviewed each Budget and this calculator is updated when they change.' },
      { q: 'Can I switch regimes every year?', a: 'Salaried individuals can choose either regime each financial year. Those with business income have restrictions on switching back after opting out once.' },
      { q: 'Does this include HRA exemption calculation?', a: 'No — HRA exemption is a separate old-regime deduction. Use the HRA Exemption Calculator to work that out, then add it to "old regime deductions" here.' },
      { q: 'Is this exact enough to file my return?', a: 'It is a planning estimate using standard slabs and the standard deduction. Your actual liability may include other income, TDS credits and exemptions this calculator does not model — verify with a tax professional or the official portal before filing.' },
    ],
    relatedTools: ['salary-calculator', 'hra-exemption-calculator', 'gratuity-calculator', 'capital-gains-calculator'],
  },
  {
    ...base,
    id: 'home-loan-prepayment-calculator',
    name: 'Home Loan Prepayment Calculator',
    slug: 'home-loan-prepayment-calculator',
    path: '/finance/home-loan-prepayment-calculator',
    icon: 'home',
    featured: true,
    popular: true,
    sortOrder: 10,
    shortDescription: 'See how much interest and time a loan prepayment actually saves.',
    description:
      'Model a one-time lump-sum prepayment or extra monthly payments on a home loan to see interest saved, EMIs saved, the new shorter tenure, and a chart comparing the original and prepaid payoff.',
    keywords: ['home loan prepayment calculator', 'loan prepayment', 'part payment calculator', 'foreclosure calculator', 'extra emi payment', 'home loan interest saved'],
    seoTitle: 'Home Loan Prepayment Calculator — Interest & Time Saved',
    seoDescription:
      'Free home loan prepayment calculator. See exactly how much interest and how many EMIs a one-time lump sum or extra monthly payment saves, with a before/after balance chart. In ₹.',
    content: {
      howItWorks: [
        { title: 'Enter your loan details', body: 'Loan amount, interest rate and tenure, same as your sanction letter.' },
        { title: 'Choose a prepayment style', body: 'A one-time lump sum in a specific month, or a fixed extra amount added to every EMI from now on.' },
        { title: 'See what you save', body: 'Interest saved, EMIs saved and the new tenure appear instantly, with a chart comparing the loan balance with and without the prepayment.' },
      ],
      features: [
        'One-time lump sum or recurring extra-monthly prepayment',
        'Interest saved and EMIs saved shown clearly',
        'New (shorter) tenure vs the original',
        'Balance-over-time chart, original vs with prepayment',
        'EMI amount stays fixed — only the tenure shortens, matching most lenders\' default',
        'Full month-by-month simulation, not an approximation',
      ],
      formula: {
        expression: 'Each month: balance = balance − (EMI − interest + extra payment), interest = balance × monthly rate',
        where: [
          { sym: 'EMI', meaning: 'The original fixed instalment — recalculated once, then held constant' },
          { sym: 'extra payment', meaning: 'The lump sum (in its chosen month) or the recurring extra amount' },
        ],
        notes: ['The loan is considered closed the month the balance reaches zero — that is the new, shorter tenure.'],
      },
      example: {
        inputs: [
          { label: 'Loan amount', value: '₹30,00,000' },
          { label: 'Interest rate', value: '8.5% per year' },
          { label: 'Tenure', value: '20 years' },
          { label: 'Extra every month', value: '₹5,000' },
        ],
        result: [
          { label: 'Original tenure', value: '240 months' },
          { label: 'New tenure', value: '≈ 191 months' },
          { label: 'Interest saved', value: '≈ ₹8.6 lakh' },
        ],
        walkthrough:
          'Adding ₹5,000 to every EMI reduces the outstanding balance faster each month, so less interest accrues going forward. Simulating month by month, the loan closes about 49 months early and total interest drops by roughly ₹8.6 lakh.',
      },
      sections: [
        {
          heading: 'Why prepaying early matters more than prepaying late',
          paragraphs: [
            'Interest is charged on the outstanding balance, which is highest in the early years. A rupee of prepayment in year 1 removes many more future interest charges than the same rupee in year 15, when the balance is already much smaller.',
            'If you have a choice, prepay as early in the loan as you can, and check whether your lender charges a prepayment penalty (most floating-rate home loans in India do not, by RBI mandate).',
          ],
        },
      ],
    },
    faq: [
      { q: 'Does prepayment reduce my EMI or my tenure?', a: 'This calculator assumes the common default: your EMI stays exactly the same and the tenure shortens. Some lenders let you choose to reduce the EMI instead and keep the original tenure — ask your lender which option they apply.' },
      { q: 'Are there prepayment charges?', a: 'By RBI rules, floating-rate home loans to individuals cannot carry a prepayment penalty. Fixed-rate loans and other loan types may still charge one — check your loan agreement.' },
      { q: 'What if I want to prepay more than once?', a: 'Run the calculator again using the reduced balance and remaining tenure as your new starting point to model a second prepayment.' },
      { q: 'Is a lump sum or extra-monthly prepayment better?', a: 'A lump sum applied early saves the most per rupee, but a smaller recurring extra payment is often easier to sustain. Try both here with the amounts you can realistically afford.' },
    ],
    relatedTools: ['emi-calculator', 'loan-calculator', 'sip-calculator', 'income-tax-calculator'],
  },
  {
    ...base,
    id: 'step-up-sip-calculator',
    name: 'Step-up SIP Calculator',
    slug: 'step-up-sip-calculator',
    path: '/finance/step-up-sip-calculator',
    icon: 'trending-up',
    featured: false,
    popular: true,
    sortOrder: 11,
    shortDescription: 'See how raising your SIP every year grows your final corpus.',
    description:
      'Project a Systematic Investment Plan where your monthly investment increases by a fixed percentage every year, and compare the result directly against a flat SIP of the same starting amount.',
    keywords: ['step up sip calculator', 'sip step up', 'increasing sip calculator', 'annual step up sip', 'sip with yearly increase'],
    seoTitle: 'Step-up SIP Calculator — Growing SIP vs Flat SIP',
    seoDescription:
      'Free step-up SIP calculator. See the future value of a mutual fund SIP that increases every year, compared side by side against a flat SIP with no step-up. In ₹.',
    content: {
      howItWorks: [
        { title: 'Enter your starting SIP', body: 'The monthly amount you will invest in year one.' },
        { title: 'Set the annual step-up', body: 'The percentage you plan to raise the SIP by every year, e.g. matching an expected salary increment.' },
        { title: 'Compare the outcomes', body: 'See the step-up SIP\'s final value against a flat SIP of the same starting amount, with a year-by-year chart.' },
      ],
      features: [
        'Custom starting amount, return and step-up percentage',
        'Direct comparison against an equivalent flat SIP',
        'Total invested vs estimated returns',
        'Year-by-year growth chart for both scenarios',
        'Handles a 0% step-up (identical to a flat SIP)',
      ],
      formula: {
        expression: 'Monthly investment in year k = starting amount × (1 + step-up%)^(k−1); FV compounds each month at the expected return',
        where: [
          { sym: 'step-up%', meaning: 'Annual percentage increase applied at each 12-month boundary' },
          { sym: 'k', meaning: 'The investment year (1, 2, 3, ...)' },
        ],
      },
      example: {
        inputs: [
          { label: 'Starting SIP', value: '₹10,000/month' },
          { label: 'Expected return', value: '12% per year' },
          { label: 'Period', value: '15 years' },
          { label: 'Step-up', value: '10% per year' },
        ],
        result: [
          { label: 'Step-up SIP final value', value: '≈ ₹65 lakh' },
          { label: 'Flat SIP final value', value: '≈ ₹50 lakh' },
          { label: 'Extra from stepping up', value: '≈ ₹15 lakh' },
        ],
        walkthrough:
          'Raising the SIP by 10% every year means later, larger instalments are invested for less time individually, but the total invested amount grows substantially — over 15 years this more than offsets the shorter compounding window for the later instalments, producing a noticeably higher final value than a flat SIP.',
      },
      sections: [
        {
          heading: 'Why step-up beats a flat SIP for most earners',
          paragraphs: [
            'Income typically rises faster than expenses in the early-to-mid career years. A step-up SIP channels that rising income into investing without ever feeling like a bigger commitment relative to your salary at the time.',
            'Because the step-up compounds every year, even a modest 5–10% annual increase produces a meaningfully larger corpus than holding the SIP flat for the whole period — the comparison chart here makes the gap concrete.',
          ],
        },
      ],
    },
    faq: [
      { q: 'How is this different from the SIP Calculator?', a: 'The plain SIP Calculator projects a constant monthly investment. This one increases the investment every year and shows the comparison against a flat SIP directly, so you can see the benefit of stepping up.' },
      { q: 'What step-up percentage is realistic?', a: 'Many investors tie it to their expected annual salary increment — commonly 8–12% in India. Use whatever you can realistically commit to increasing each year.' },
      { q: 'Are returns guaranteed?', a: 'No. As with any SIP projection, the return is an assumption for illustration; actual mutual fund returns are market-linked and vary year to year.' },
      { q: 'Does this account for taxes or exit load?', a: 'No, the projection is before costs and capital gains tax. Use the Capital Gains Calculator separately to estimate tax on withdrawal.' },
    ],
    relatedTools: ['sip-calculator', 'swp-calculator', 'capital-gains-calculator', 'cagr-calculator'],
  },
  {
    ...base,
    id: 'capital-gains-calculator',
    name: 'Capital Gains Calculator',
    slug: 'capital-gains-calculator',
    path: '/finance/capital-gains-calculator',
    icon: 'percent',
    featured: false,
    popular: true,
    sortOrder: 12,
    shortDescription: 'LTCG and STCG tax on equity, debt funds, gold and property.',
    description:
      'Work out long-term or short-term capital gains tax on equity shares, equity mutual funds, debt funds, gold or property, using the post-Budget-2024 holding periods, rates and equity LTCG exemption.',
    keywords: ['capital gains calculator', 'ltcg calculator', 'stcg calculator', 'ltcg tax on equity', 'capital gains tax india', 'long term capital gains'],
    seoTitle: 'Capital Gains Calculator — LTCG & STCG Tax (India)',
    seoDescription:
      'Free India capital gains calculator. Calculate LTCG or STCG tax on equity shares, equity mutual funds, debt funds, gold or property with the current holding-period thresholds, rates and equity LTCG exemption.',
    content: {
      howItWorks: [
        { title: 'Choose the asset type', body: 'Listed equity / equity mutual funds, or the "other" category covering debt funds, gold, property and unlisted shares.' },
        { title: 'Enter purchase and sale value', body: 'What you paid and what you received (or expect to receive).' },
        { title: 'Enter the holding period', body: 'In months. The calculator classifies it as long-term or short-term for that asset type and applies the matching rate automatically.' },
      ],
      features: [
        'Separate rules for equity vs other assets',
        'Automatic long-term / short-term classification',
        '₹1.25 lakh annual LTCG exemption applied for equity',
        'Post-July-2024-Budget rates',
        'Clear note when short-term tax depends on your slab rate rather than a flat rate',
        'Handles a loss as zero taxable gain',
      ],
      formula: {
        expression: 'Gain = Sale value − Purchase value; Tax = max(0, Gain − exemption) × rate',
        where: [
          { sym: 'Long-term threshold', meaning: '12 months for equity, 24 months for other assets' },
          { sym: 'Equity LTCG', meaning: '12.5% above a ₹1.25 lakh annual exemption' },
          { sym: 'Equity STCG', meaning: 'Flat 20%' },
          { sym: 'Other LTCG', meaning: 'Flat 12.5%, no exemption' },
        ],
        notes: ['Short-term gains on non-equity assets are added to your income and taxed at your slab rate — this calculator flags that case rather than guessing a number.'],
      },
      example: {
        inputs: [
          { label: 'Asset type', value: 'Equity mutual fund' },
          { label: 'Purchase value', value: '₹1,00,000' },
          { label: 'Sale value', value: '₹3,00,000' },
          { label: 'Holding period', value: '18 months' },
        ],
        result: [
          { label: 'Gain', value: '₹2,00,000' },
          { label: 'Exemption applied', value: '₹1,25,000' },
          { label: 'Tax', value: '≈ ₹9,375 (12.5% of ₹75,000)' },
        ],
        walkthrough:
          'At 18 months, the holding qualifies as long-term for equity (threshold: 12 months). The ₹2,00,000 gain is reduced by the ₹1,25,000 annual LTCG exemption, leaving ₹75,000 taxable at 12.5%, i.e. about ₹9,375.',
      },
      sections: [
        {
          heading: 'Equity vs "other" — why the rules differ',
          paragraphs: [
            'Listed equity and equity-oriented mutual funds get a shorter 12-month long-term threshold and an annual exemption because Securities Transaction Tax is already paid on these trades.',
            'Debt funds, gold, unlisted shares and property don\'t attract STT, use a 24-month threshold instead, and — for short-term holdings — are taxed at your regular income slab rate rather than a flat percentage, since there is no STT to justify a concessional flat rate.',
          ],
        },
      ],
    },
    faq: [
      { q: 'What counts as a metro city for HRA — wait, does this affect capital gains?', a: 'No, city has no bearing on capital gains tax; that question applies to the separate HRA Exemption Calculator.' },
      { q: 'Why does short-term tax on "other" assets show no number?', a: 'Because it is added to your total income and taxed at whatever income slab you fall into, which depends on your full income — not something a standalone gains calculator can know. Use the Income Tax Calculator with this gain included in your income to estimate it.' },
      { q: 'Does the ₹1.25 lakh exemption apply to STCG too?', a: 'No — the exemption applies only to long-term equity gains. Short-term equity gains are taxed on the full amount at 20%.' },
      { q: 'Can I offset a loss against a gain?', a: 'Indian tax law allows capital losses to be set off against gains and carried forward for up to 8 years under specific rules. This calculator computes tax for a single transaction and does not model loss set-off across a portfolio.' },
    ],
    relatedTools: ['income-tax-calculator', 'sip-calculator', 'cagr-calculator', 'step-up-sip-calculator'],
  },
  {
    ...base,
    id: 'hra-exemption-calculator',
    name: 'HRA Exemption Calculator',
    slug: 'hra-exemption-calculator',
    path: '/finance/hra-exemption-calculator',
    icon: 'home',
    featured: false,
    popular: true,
    sortOrder: 13,
    shortDescription: 'Work out your tax-exempt HRA under Section 10(13A).',
    description:
      'Calculate how much of your House Rent Allowance is exempt from income tax under Section 10(13A), using the standard three-way minimum of actual HRA, rent paid minus 10% of basic, and a percentage of basic salary.',
    keywords: ['hra exemption calculator', 'hra calculator', 'house rent allowance exemption', 'section 10 13a', 'hra tax exemption', 'hra income tax'],
    seoTitle: 'HRA Exemption Calculator — Section 10(13A) (India)',
    seoDescription:
      'Free HRA exemption calculator for India. Enter basic salary, HRA received and rent paid to see your exact tax-exempt HRA under Section 10(13A), with the full three-way calculation shown.',
    content: {
      howItWorks: [
        { title: 'Enter basic + DA', body: 'Your annual basic salary plus dearness allowance, if any.' },
        { title: 'Enter HRA received and rent paid', body: 'The annual HRA your employer pays you, and the annual rent you actually pay.' },
        { title: 'Select your city type', body: 'Metro (Delhi, Mumbai, Kolkata, Chennai) uses 50% of basic; other cities use 40%. The exempt and taxable HRA are shown instantly, along with which of the three factors limited the exemption.' },
      ],
      features: [
        'Full Section 10(13A) three-way minimum calculation',
        'Metro vs non-metro percentage applied automatically',
        'Shows exactly which factor limited your exemption',
        'Taxable HRA (the remainder, added to your income) shown separately',
        'Only relevant under the old tax regime — this calculator assumes that context',
      ],
      formula: {
        expression: 'Exempt HRA = minimum of (Actual HRA, Rent paid − 10% of basic, 50%/40% of basic)',
        where: [
          { sym: 'Actual HRA', meaning: 'HRA your employer actually pays you' },
          { sym: 'Rent paid − 10% of basic', meaning: 'Cannot be negative — floored at zero' },
          { sym: '50% / 40% of basic', meaning: '50% in a metro city, 40% elsewhere' },
        ],
        notes: ['HRA exemption is available only under the old tax regime; the new regime does not allow it.'],
      },
      example: {
        inputs: [
          { label: 'Basic + DA (annual)', value: '₹6,00,000' },
          { label: 'HRA received (annual)', value: '₹4,00,000' },
          { label: 'Rent paid (annual)', value: '₹3,00,000' },
          { label: 'City', value: 'Metro' },
        ],
        result: [
          { label: 'Rent − 10% of basic', value: '₹2,40,000' },
          { label: '50% of basic', value: '₹3,00,000' },
          { label: 'Exempt HRA', value: '₹2,40,000 (the smallest of the three)' },
        ],
        walkthrough:
          'The three candidates are: actual HRA ₹4,00,000, rent minus 10% of basic = 3,00,000 − 60,000 = ₹2,40,000, and 50% of basic = ₹3,00,000. The smallest, ₹2,40,000, is exempt; the remaining ₹1,60,000 of HRA received is added to taxable income.',
      },
      sections: [
        {
          heading: 'You need rent receipts and, above ₹1 lakh a year, your landlord\'s PAN',
          paragraphs: [
            'To actually claim this exemption, most employers require rent receipts and, if annual rent exceeds ₹1,00,000, your landlord\'s PAN for their records. Without proof, HRA received may be taxed in full even though you are genuinely paying rent.',
            'If you own the home you live in, you cannot claim HRA exemption on it — HRA exemption requires that you actually pay rent for the accommodation you occupy.',
          ],
        },
      ],
    },
    faq: [
      { q: 'Can I claim HRA exemption under the new tax regime?', a: 'No. HRA exemption under Section 10(13A) is available only if you opt for the old tax regime.' },
      { q: 'What if I don\'t pay any rent?', a: 'Then your exempt HRA is zero — the "rent paid minus 10% of basic" factor becomes zero or negative (floored at zero), which is always the smallest of the three, so nothing is exempt.' },
      { q: 'Can I claim HRA and a home loan deduction at the same time?', a: 'Yes, if you rent a home in one city while owning and paying a home loan on a property elsewhere (or renting it out) — the two are independent claims under the old regime.' },
      { q: 'Is Delhi NCR (Gurugram, Noida) treated as metro?', a: 'No. Only Delhi, Mumbai, Kolkata and Chennai are treated as metro cities for this 50% rule; Gurugram and Noida use the 40% non-metro rate.' },
    ],
    relatedTools: ['income-tax-calculator', 'salary-calculator', 'gratuity-calculator', 'home-loan-prepayment-calculator'],
  },
  {
    ...base,
    id: 'gratuity-calculator',
    name: 'Gratuity Calculator',
    slug: 'gratuity-calculator',
    path: '/finance/gratuity-calculator',
    icon: 'briefcase',
    featured: false,
    popular: false,
    sortOrder: 14,
    shortDescription: 'Gratuity payable under the Payment of Gratuity Act, 1972.',
    description:
      'Calculate the gratuity payable on leaving a job after 5+ years of service, using the standard Payment of Gratuity Act formula, along with the tax-exempt and taxable portion of the payout.',
    keywords: ['gratuity calculator', 'gratuity calculation india', 'payment of gratuity act', 'gratuity formula', 'gratuity tax exemption'],
    seoTitle: 'Gratuity Calculator — Payment of Gratuity Act, 1972',
    seoDescription:
      'Free gratuity calculator for India. Enter your last drawn salary and years of service to calculate gratuity payable under the Payment of Gratuity Act, plus the tax-exempt and taxable amount.',
    content: {
      howItWorks: [
        { title: 'Enter your last drawn monthly salary', body: 'Basic + dearness allowance, not your full CTC.' },
        { title: 'Enter years of service', body: 'A fractional year of 6 months or more rounds up to the next full year, per common practice under the Act.' },
        { title: 'Read the payout', body: 'Gratuity payable, along with how much of it is tax-exempt versus taxable, appears instantly.' },
      ],
      features: [
        'Standard 15/26 formula for employers covered under the Act',
        '30-day divisor variant for employers not covered under the Act',
        'Correct rounding of fractional years of service',
        'Statutory ₹20 lakh tax-exemption cap applied automatically',
        'Taxable portion (above the cap) shown separately',
      ],
      formula: {
        expression: 'Gratuity = (15 × last drawn monthly salary × years of service) ÷ 26',
        where: [
          { sym: '15', meaning: 'Days of salary paid per year of service' },
          { sym: '26', meaning: 'Working days per month, per the Act (30 for employers not covered by the Act)' },
          { sym: 'years of service', meaning: 'Rounded up if the fractional part is 6 months or more' },
        ],
        notes: ['Gratuity typically applies only after 5+ years of continuous service, except in case of death or disability.'],
      },
      example: {
        inputs: [
          { label: 'Last drawn monthly salary', value: '₹50,000' },
          { label: 'Years of service', value: '10' },
        ],
        result: [
          { label: 'Gratuity payable', value: '≈ ₹2,88,462' },
          { label: 'Tax-exempt amount', value: '₹2,88,462 (fully exempt)' },
        ],
        walkthrough:
          '(15 × 50,000 × 10) ÷ 26 = ₹2,88,462. Since this is well below the ₹20 lakh statutory exemption limit, the entire amount is tax-free.',
      },
      sections: [
        {
          heading: 'Eligibility comes before the formula',
          paragraphs: [
            'Gratuity under the Act generally requires at least 5 years of continuous service with the same employer, with an exception that waives this requirement in case of death or disability.',
            'The ₹20 lakh exemption limit is a lifetime cumulative cap across all employers for a private-sector employee, not a per-job allowance — factor in any gratuity already received tax-free elsewhere.',
          ],
        },
      ],
    },
    faq: [
      { q: 'Do I need 5 years of service to get gratuity?', a: 'Generally yes, under the Payment of Gratuity Act. The 5-year requirement is waived if employment ends due to death or disability.' },
      { q: 'Is gratuity part of my CTC?', a: 'Some employers include an estimated gratuity accrual in the CTC figure quoted at hiring, but it is only actually paid out when you leave after qualifying service — check your offer letter.' },
      { q: 'What is the difference between the 26-day and 30-day divisor?', a: 'Employers covered under the Payment of Gratuity Act use 26 (accounting for 4 weekly offs a month). Employers not covered by the Act commonly use 30 as a simple monthly divisor — a convention, not a statutory requirement.' },
      { q: 'Is gratuity taxed?', a: 'Up to ₹20 lakh (cumulative across employers, for private-sector employees) is exempt under Section 10(10). Any amount above that is added to your taxable income.' },
    ],
    relatedTools: ['income-tax-calculator', 'salary-calculator', 'hra-exemption-calculator', 'home-loan-prepayment-calculator'],
  },
  {
    ...base,
    id: 'swp-calculator',
    name: 'SWP Calculator',
    slug: 'swp-calculator',
    path: '/finance/swp-calculator',
    icon: 'calendar-clock',
    featured: false,
    popular: true,
    sortOrder: 15,
    shortDescription: 'See how long a lump sum lasts under a fixed monthly withdrawal.',
    description:
      'Model a Systematic Withdrawal Plan: withdraw a fixed amount every month from an invested lump sum and see whether the corpus grows, shrinks, or runs out — and exactly when.',
    keywords: ['swp calculator', 'systematic withdrawal plan', 'swp mutual fund', 'monthly withdrawal calculator', 'retirement withdrawal calculator'],
    seoTitle: 'SWP Calculator — Systematic Withdrawal Plan',
    seoDescription:
      'Free SWP calculator. See how a fixed monthly withdrawal from an invested lump sum affects your corpus over time — total withdrawn, final value, and whether or when the money runs out.',
    content: {
      howItWorks: [
        { title: 'Enter your lump sum', body: 'The amount already invested, e.g. in a mutual fund.' },
        { title: 'Enter the monthly withdrawal', body: 'The fixed amount you plan to withdraw each month for expenses or income.' },
        { title: 'Read the outcome', body: 'See the total withdrawn, the final corpus value, and — if the withdrawal rate is too high — exactly which month the corpus would run out.' },
      ],
      features: [
        'Month-by-month depletion simulation, not a rough estimate',
        'Clear warning if the corpus runs out before your target period',
        'Total withdrawn and final remaining value',
        'Year-by-year corpus value chart',
        'Handles a withdrawal rate low enough that the corpus keeps growing',
      ],
      formula: {
        expression: 'Each month: balance = (balance − withdrawal) × (1 + monthly return)',
        where: [
          { sym: 'withdrawal', meaning: 'Fixed monthly amount, capped at the remaining balance' },
          { sym: 'monthly return', meaning: 'Expected annual return ÷ 12 ÷ 100' },
        ],
        notes: ['Withdrawals are modelled at the start of each month, with growth applied to what remains for the rest of the month.'],
      },
      example: {
        inputs: [
          { label: 'Initial investment', value: '₹50,00,000' },
          { label: 'Monthly withdrawal', value: '₹30,000' },
          { label: 'Expected return', value: '8% per year' },
          { label: 'Period', value: '15 years' },
        ],
        result: [
          { label: 'Total withdrawn', value: '≈ ₹54 lakh' },
          { label: 'Final corpus value', value: '≈ ₹68 lakh' },
          { label: 'Corpus lasted', value: 'Full 15 years, and grew' },
        ],
        walkthrough:
          'At ₹30,000 a month (≈ 7.2% of the initial corpus annually) against an 8% expected return, the corpus\'s growth outpaces the withdrawals, so it not only lasts the full period but ends up larger than it started.',
      },
      sections: [
        {
          heading: 'Why the withdrawal rate matters more than the corpus size',
          paragraphs: [
            'A ₹1 crore corpus withdrawing ₹1,50,000 a month (18% annually) will deplete quickly no matter how large it started, because the withdrawal rate far exceeds any realistic return. The relationship between your monthly withdrawal and the expected return — not the absolute rupee amount — determines whether the corpus survives.',
            'A commonly cited safe withdrawal guideline is to keep annual withdrawals around 4–6% of the corpus for a multi-decade horizon, adjusted for your specific return expectations and how long you need the money to last.',
          ],
        },
      ],
    },
    faq: [
      { q: 'What happens if I withdraw more than the corpus earns?', a: 'The corpus shrinks over time and, at a high enough rate, is depleted before your target period ends. This calculator flags exactly which month that happens.' },
      { q: 'Is SWP the same as a pension?', a: 'It behaves similarly — regular payouts from an investment — but there is no guarantee: the amount, duration and outcome all depend on actual market returns, unlike an annuity or pension with contractual payouts.' },
      { q: 'Does this account for capital gains tax on each withdrawal?', a: 'No. Each SWP withdrawal from a mutual fund is technically a partial redemption and may attract capital gains tax depending on the fund type and holding period — use the Capital Gains Calculator alongside this one.' },
      { q: 'Can I increase my withdrawal amount over time for inflation?', a: 'This calculator assumes a fixed monthly withdrawal for simplicity. To model an increasing withdrawal, re-run it in segments with a higher monthly amount for later years.' },
    ],
    relatedTools: ['sip-calculator', 'step-up-sip-calculator', 'capital-gains-calculator', 'fd-calculator'],
  },
];
