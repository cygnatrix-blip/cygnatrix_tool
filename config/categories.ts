import type { CategoryConfig, CategorySlug } from '@/types/tool';

const UPDATED = '2026-08-27';

export const CATEGORIES: Record<CategorySlug, CategoryConfig> = {
  pdf: {
    slug: 'pdf',
    name: 'PDF Tools',
    navLabel: 'PDF Tools',
    title: 'Free Online PDF Tools',
    tagline: 'Merge, split, compress and convert PDF files — right in your browser.',
    description:
      'A complete set of free PDF tools that run entirely in your browser. Merge documents, split pages, shrink file size and convert PDFs to Word or JPG without uploading anything to a server.',
    seoTitle: 'Free Online PDF Tools — Merge, Split, Compress & Convert',
    seoDescription:
      'Free online PDF tools to merge, split, compress and convert PDF files. 100% browser-based — your files never leave your device. No sign-up, no watermarks.',
    keywords: [
      'pdf tools',
      'merge pdf',
      'split pdf',
      'compress pdf',
      'pdf to word',
      'pdf to jpg',
      'online pdf editor',
      'free pdf tools',
    ],
    icon: 'file-text',
    intro: [
      'PDF is the format the world uses to share finished documents, but editing one usually means expensive software or handing your file to a website you do not know.',
      'Cygnatrix PDF tools work differently. Every tool below processes your file locally in your browser using WebAssembly — nothing is uploaded, nothing is stored, and the result downloads straight back to your device.',
    ],
    helpfulContent: [
      {
        heading: 'Why browser-based PDF tools?',
        paragraphs: [
          'When a PDF tool runs on a server, your document — which may contain contracts, statements or personal identification — is transmitted to and processed on a computer you have no control over. Even well-meaning services keep temporary copies.',
          'Browser-based tools remove that risk. The processing code is downloaded to your device once, then does its work offline. You can even disconnect from the internet after the page loads and the tools still work.',
        ],
        bullets: [
          'No upload wait — large files start processing immediately.',
          'No file-size ceiling imposed by an upload limit (only your device memory).',
          'Nothing to delete afterwards because nothing was ever stored.',
        ],
      },
      {
        heading: 'Choosing the right PDF tool',
        paragraphs: [
          'Use Merge PDF to combine several documents — for example scanned pages, a cover letter and a report — into one file in the order you choose.',
          'Use Split PDF to pull specific pages out of a large document, or to break a bound PDF into single pages.',
          'Use Compress PDF when a file is too large to email or upload. Use PDF to Word when you need to edit the text, and PDF to JPG when you need images of the pages for a slide or a website.',
        ],
      },
    ],
    faq: [
      {
        q: 'Are these PDF tools really free?',
        a: 'Yes. Every PDF tool on Cygnatrix Tools is free to use with no sign-up, no watermark and no page limit. The site is supported by unobtrusive advertising.',
      },
      {
        q: 'Do my files get uploaded to a server?',
        a: 'No. All five PDF tools run entirely in your browser. Your file is read into memory on your own device, processed there, and the result is offered as a download. It is never transmitted to us.',
      },
      {
        q: 'Is there a file size limit?',
        a: `We set a practical limit of ${50} MB per PDF and up to ${20} files at once so the tools stay responsive on phones and older laptops. Larger files may still work on a powerful desktop.`,
      },
      {
        q: 'Which browsers are supported?',
        a: 'Any modern browser released in the last few years — Chrome, Edge, Firefox, Safari and their mobile versions. JavaScript must be enabled.',
      },
      {
        q: 'Can I use these tools on my phone?',
        a: 'Yes. Every tool is mobile-first and supports selecting files from your phone’s storage, camera roll or cloud drive.',
      },
    ],
    sortOrder: 1,
    updatedAt: UPDATED,
  },

  finance: {
    slug: 'finance',
    name: 'Finance Calculators',
    navLabel: 'Finance',
    title: 'Free Online Finance Calculators',
    tagline: 'Plan loans, investments and taxes with clear, transparent calculations.',
    description:
      'Free finance calculators for the Indian market — EMI, SIP, FD, RD, GST, loan, CAGR and salary. Every result comes with the formula, a worked example and a full breakdown so you can see exactly how the number was reached.',
    seoTitle: 'Free Online Finance Calculators — EMI, SIP, FD, GST & More',
    seoDescription:
      'Free finance calculators for India: EMI, SIP, FD, RD, GST, loan, CAGR and salary. Instant results with charts, amortization schedules, formulas and worked examples.',
    keywords: [
      'finance calculator',
      'emi calculator',
      'sip calculator',
      'fd calculator',
      'gst calculator',
      'loan calculator',
      'cagr calculator',
      'salary calculator india',
    ],
    icon: 'calculator',
    intro: [
      'Good financial decisions start with a clear number. How much will this loan actually cost? What could a monthly SIP grow into? How much of my CTC reaches my bank account?',
      'These eight calculators answer those questions instantly, in rupees, with the maths shown in full. Nothing is stored and no account is needed — open a calculator, enter your figures and read the result.',
    ],
    helpfulContent: [
      {
        heading: 'Built for the Indian context',
        paragraphs: [
          'Interest rates are entered as annual percentages the way Indian banks quote them. Amounts are in rupees with Indian-style grouping (lakh and crore). The GST calculator uses Indian slabs and splits tax into CGST and SGST. The salary calculator models Provident Fund, professional tax and the new and old income-tax regimes.',
          'Tax rules and rates change every year. Our calculation layer keeps every rate in a single dated configuration file, so when the Budget changes a slab we update one place and every calculator stays correct.',
        ],
      },
      {
        heading: 'Understanding the results',
        paragraphs: [
          'A loan EMI is fixed, but the split between interest and principal changes every month — early instalments are mostly interest. The amortization schedule on each loan calculator shows this month by month.',
          'Investment projections (SIP, FD, RD, CAGR) assume a constant rate of return. Real markets do not deliver constant returns, so treat these figures as planning estimates, not promises. Fixed deposits are the exception — the rate is contractually fixed for the term.',
        ],
      },
    ],
    faq: [
      {
        q: 'Are these calculators accurate?',
        a: 'The formulas are standard and every calculator is covered by an automated test suite checking normal, boundary and edge cases. Results are mathematically correct for the inputs you provide. Actual bank or fund figures can differ slightly due to rounding conventions, fees and day-count methods.',
      },
      {
        q: 'Is this financial advice?',
        a: 'No. These are calculation tools, not advice. They do not account for your full financial situation, and projected investment returns are not guaranteed. Always confirm the actual terms with your bank, fund house or a qualified adviser.',
      },
      {
        q: 'Do you store the amounts I enter?',
        a: 'No. All calculations happen in your browser. Nothing you type is sent to us or saved anywhere.',
      },
      {
        q: 'Which currency do the calculators use?',
        a: 'Indian rupees (₹). The calculators are designed for the Indian market first; the underlying maths applies to any currency if you read the ₹ as your own.',
      },
    ],
    sortOrder: 2,
    updatedAt: UPDATED,
  },

  image: {
    slug: 'image',
    name: 'Image Tools',
    navLabel: 'Image Tools',
    title: 'Free Online Image Tools',
    tagline: 'Compress, resize and convert JPG, PNG and WebP images privately.',
    description:
      'Free online image tools that run entirely in your browser. Compress photos, resize images to exact dimensions and convert between JPG, PNG and WebP without uploading a single file.',
    seoTitle: 'Free Online Image Tools — Compress, Resize & Convert JPG, PNG, WebP',
    seoDescription:
      'Free browser-based image tools to compress, resize and convert JPG, PNG and WebP images. Your photos never leave your device. No sign-up, no quality loss you did not ask for.',
    keywords: [
      'image tools',
      'compress image',
      'resize image',
      'jpg to png',
      'png to jpg',
      'webp converter',
      'image optimiser',
    ],
    icon: 'image',
    intro: [
      'Images are usually the heaviest thing on a web page and the most common reason an email bounces or an upload is rejected.',
      'These five tools fix that in seconds. They use the same image engine built into your browser, so processing is fast, private and produces predictable results.',
    ],
    helpfulContent: [
      {
        heading: 'JPG, PNG or WebP — which should you use?',
        paragraphs: [
          'JPG is best for photographs and any image with smooth colour gradients. It cannot store transparency and it is lossy, so every re-save discards a little more detail.',
          'PNG is best for logos, screenshots, diagrams and anything with sharp edges or transparency. It is lossless, which also makes it larger.',
          'WebP is a modern format that usually beats both — 25–35% smaller than JPG at the same quality, with support for transparency. Every current browser supports it; use it for websites where you control the markup.',
        ],
      },
      {
        heading: 'How compression works',
        paragraphs: [
          'Compressing a JPG or WebP lowers the quality factor, which lets the encoder discard detail your eye is unlikely to notice. A quality of 75–85 is usually indistinguishable from the original at a fraction of the size.',
          'PNG compression is lossless — it cannot throw away colour data — so the savings are smaller and come from smarter encoding. To make a PNG dramatically smaller, convert it to WebP or JPG instead.',
        ],
      },
    ],
    faq: [
      {
        q: 'Do my images get uploaded anywhere?',
        a: 'No. Every image tool works entirely inside your browser using the built-in Canvas engine. Your files are never sent to a server.',
      },
      {
        q: 'Will compressing an image ruin its quality?',
        a: 'You control the quality level and see a live before/after preview and file-size comparison. At the default setting most people cannot tell the compressed version from the original.',
      },
      {
        q: 'What happens to transparency when I convert PNG to JPG?',
        a: 'JPG cannot store transparency, so transparent areas are filled with a background colour. Our PNG to JPG tool lets you choose that colour (white by default).',
      },
      {
        q: 'Is there a limit on how many images I can process?',
        a: `You can process up to ${30} images at once, each up to ${25} MB. There is no daily limit.`,
      },
    ],
    sortOrder: 3,
    updatedAt: UPDATED,
  },
};

export const CATEGORY_LIST: CategoryConfig[] = Object.values(CATEGORIES).sort(
  (a, b) => a.sortOrder - b.sortOrder,
);

export function getCategory(slug: string): CategoryConfig | undefined {
  return (CATEGORIES as Record<string, CategoryConfig>)[slug];
}
