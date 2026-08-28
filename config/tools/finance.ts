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
];
