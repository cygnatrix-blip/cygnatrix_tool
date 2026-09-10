import { z } from 'zod';
import type { LandingPageConfig } from '@/types/tool';
import { ALL_TOOLS } from './tools';

const UPDATED = '2026-09-05';

/** Top-level route segments that already exist — a landing page slug must never collide with these. */
const RESERVED_SLUGS = new Set([
  'about',
  'ads.txt',
  'api',
  'contact',
  'cookie-policy',
  'disclaimer',
  'finance',
  'icon.svg',
  'image',
  'llms.txt',
  'llms-full.txt',
  'manifest.webmanifest',
  'opengraph-image',
  'pdf',
  'privacy-policy',
  'robots.txt',
  'sitemap.xml',
  'terms',
  'tools',
]);

export const LANDING_PAGES: LandingPageConfig[] = [
  {
    slug: 'compress-image-to-20kb',
    targetToolId: 'compress-to-size',
    targetSizeKB: 20,
    h1: 'Compress an Image to 20 KB',
    intro:
      'A 20 KB limit is common on government exam portals (UPSC, SSC and many state PSC application forms) that ask for a small, fast-loading photo or signature scan. This tool finds the exact quality and, if needed, the exact dimensions to land under 20 KB automatically.',
    seoTitle: 'Compress Image to 20KB Online — Free, No Sign-Up',
    seoDescription:
      'Compress a JPG or PNG to under 20 KB for exam forms and government portals. Automatic quality search, runs entirely in your browser — no upload, no sign-up.',
    keywords: ['compress image to 20kb', 'reduce photo size to 20kb', 'compress photo for exam form', 'image size reducer 20kb', 'compress jpeg to 20kb online'],
    howItWorks: [
      { title: 'Upload your photo or signature scan', body: 'JPG, PNG or WebP — drag it in or pick it from your phone\'s camera roll.' },
      { title: 'The 20 KB target is already set', body: 'This page pre-selects the 20 KB chip so you don\'t have to hunt for it, but you can still switch to any other size.' },
      { title: 'Download the result', body: 'You get the exact final size, dimensions and quality used — no guesswork, no repeated re-uploads to a form that keeps rejecting your file.' },
    ],
    sections: [
      {
        heading: 'Why 20 KB is so hard to hit with a normal editor',
        paragraphs: [
          'Most photo editors only let you drag a quality slider and re-export, hoping you land close enough. At 20 KB, a typical smartphone photo needs both a heavy quality cut and a real reduction in pixel dimensions — get either one slightly wrong and you are either over the limit or the photo turns to mush.',
          'This tool automates that trial and error: it binary-searches the compression quality first, and only shrinks the dimensions if quality alone genuinely cannot reach 20 KB on your specific photo. That keeps the image as sharp as the limit allows.',
        ],
      },
      {
        heading: 'Common problems at this size',
        paragraphs: [
          'If your source photo has a very high resolution (typical of modern phone cameras, often 3–4000 pixels wide), expect the output to be resized down to somewhere around 200–300 pixels wide to fit 20 KB — that is normal and matches what most exam portals expect for a thumbnail-sized photo, not a print-quality one.',
          'If your form also enforces a minimum size (some say "between 10 KB and 20 KB"), use the optional minimum field so the tool won\'t compress harder than necessary once it is already under the cap.',
        ],
      },
    ],
    faq: [
      { q: 'Will 20 KB make my photo blurry?', a: 'Some quality loss is unavoidable at this size, especially for a high-resolution source photo. The tool picks the highest quality that still fits, so it is the best result achievable at 20 KB — not an arbitrary compression.' },
      { q: 'Does this work for signature images too?', a: 'Yes — a scanned signature is usually simpler than a photo (mostly flat background and thin lines), so it typically reaches 20 KB with better visual quality than a photo of a face would.' },
      { q: 'Is this the same as the general Compress Image to Exact Size tool?', a: 'Yes, exactly the same engine — this page just starts you with the 20 KB target already selected, since that is the most common size asked for on this kind of form.' },
      { q: 'What if my form wants JPG specifically?', a: 'JPG is the default output format here. If your form accepts WebP instead (rare, check the instructions), you can switch it in the tool.' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'compress-image-to-50kb',
    targetToolId: 'compress-to-size',
    targetSizeKB: 50,
    h1: 'Compress an Image to 50 KB',
    intro:
      '50 KB is one of the most frequently requested limits on exam and job application portals for a passport-style photo. This tool automatically finds the quality (and, if needed, the dimensions) that lands your photo right under 50 KB, without the usual slider guesswork.',
    seoTitle: 'Compress Image to 50KB Online — Free, No Sign-Up',
    seoDescription:
      'Compress a JPG, PNG or WebP photo to under 50 KB for exam and job application forms. Automatic, in-browser, no upload to a server — free with no sign-up.',
    keywords: ['compress image to 50kb', 'reduce photo size to 50kb', 'compress photo for job application', 'image compressor 50kb', 'photo size reducer for exam'],
    howItWorks: [
      { title: 'Add your photo', body: 'Drop in a JPG, PNG or WebP file, or select one from your phone.' },
      { title: '50 KB is already the target', body: 'This page starts with the 50 KB chip selected; change it any time if a different form needs a different size.' },
      { title: 'Download an exact match', body: 'You are told exactly what final size, dimensions and quality were used, so you know the result meets the form\'s requirement before you upload it.' },
    ],
    sections: [
      {
        heading: 'Why "just lower the quality a bit" rarely works',
        paragraphs: [
          'Manually re-exporting an image at, say, 60% quality can land anywhere from 30 KB to 90 KB depending on the photo\'s detail and resolution — there is no fixed relationship between a quality percentage and the resulting file size. That is exactly the problem this tool solves: it searches quality values automatically until the result is as close to 50 KB as possible without going over.',
          'For most standard passport-style photos (roughly 200×230 to 413×531 pixels, the typical range asked for), 50 KB is comfortably achievable without heavy dimension reduction, so the visual quality usually stays quite good at this target.',
        ],
      },
      {
        heading: 'A tip for repeated rejections',
        paragraphs: [
          'If a portal keeps rejecting your upload with a vague "file too large" or "file too small" message, check whether it also enforces a minimum — many exam forms specify a range like "20 KB to 50 KB" rather than just a maximum. Enter that minimum in the optional field here so the result never lands below it.',
        ],
      },
    ],
    faq: [
      { q: 'Why does the same 50 KB target give different quality for different photos?', a: 'A busier, more detailed photo needs a lower quality setting to reach the same file size as a simpler one. The tool automatically finds the right quality for your specific photo — it is not a fixed setting.' },
      { q: 'Can I compress several photos to 50 KB at once?', a: 'Yes — add multiple files and they process one after another with a progress bar, then download together as a ZIP.' },
      { q: 'Does this upload my photo anywhere?', a: 'No. All processing happens locally in your browser using the Canvas API — your photo never leaves your device.' },
      { q: 'What if I need a different exact size later?', a: 'Use the general Compress Image to Exact Size tool, which has the same engine with quick-pick chips for 20 KB, 50 KB, 100 KB, 200 KB, 500 KB, 1 MB, plus any custom value.' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'compress-image-to-100kb',
    targetToolId: 'compress-to-size',
    targetSizeKB: 100,
    h1: 'Compress an Image to 100 KB',
    intro:
      '100 KB is a common ceiling for document scans, ID photos and web uploads that need to stay reasonably sharp while loading fast. This tool automatically searches for the quality that gets you as close to 100 KB as possible without going over.',
    seoTitle: 'Compress Image to 100KB Online — Free, No Sign-Up',
    seoDescription:
      'Compress a JPG, PNG or WebP image to under 100 KB for forms, uploads and web use. Automatic in-browser compression — free, no sign-up, no server upload.',
    keywords: ['compress image to 100kb', 'reduce image size to 100kb', 'compress photo 100kb online', 'image compressor for web upload', 'reduce jpg size to 100kb'],
    howItWorks: [
      { title: 'Add your image', body: 'Any JPG, PNG or WebP file, up to 100 at once.' },
      { title: '100 KB is pre-selected', body: 'The target chip starts at 100 KB; switch it instantly if you need a different size for another form.' },
      { title: 'Get your compressed file', body: 'Download it directly, or as a ZIP if you compressed more than one.' },
    ],
    sections: [
      {
        heading: 'What 100 KB actually buys you',
        paragraphs: [
          'At 100 KB, most photos and document scans keep visibly good detail — this is usually enough headroom that the tool rarely needs to shrink the image dimensions at all, and can reach the target through quality reduction alone. That means sharper results than tighter targets like 20 or 50 KB.',
          'This makes 100 KB a good middle-ground choice for ID card photos, resume photos, and any web form that just wants "a reasonably small image" without a strict passport-photo-style requirement.',
        ],
      },
      {
        heading: 'If your file is a scanned document rather than a photo',
        paragraphs: [
          'Scanned text documents compress very differently from photos — flat white backgrounds and sharp black text compress much more efficiently, so a scan will often land well under 100 KB at a high quality setting. If you specifically need a multi-page document under a size limit, our PDF tools may be a better fit than compressing individual page images.',
        ],
      },
    ],
    faq: [
      { q: 'Will 100 KB be enough quality for printing?', a: 'Not for real printing — 100 KB targets are sized for on-screen/form use. For print-quality output, use a much larger target size or skip compression entirely.' },
      { q: 'Can I set 100 KB as a minimum instead of a maximum?', a: 'This chip sets 100 KB as the target ceiling. If you need a minimum as well (some forms specify a range), use the optional minimum field in the tool below the target size.' },
      { q: 'Does this change the image format?', a: 'By default it outputs JPG, which compresses more efficiently than PNG for photos. You can switch to WebP for typically even better quality per kilobyte, if your form accepts it.' },
      { q: 'Is there a limit on how many images I can compress?', a: 'Up to 100 images per batch, processed sequentially with a visible progress bar, all for free.' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'compress-image-to-200kb',
    targetToolId: 'compress-to-size',
    targetSizeKB: 200,
    h1: 'Compress an Image to 200 KB',
    intro:
      '200 KB is a typical upload cap for resume photos, LinkedIn-style profile pictures and many college or scholarship application portals. This tool automatically finds the quality that gets your photo right under 200 KB while keeping it looking sharp.',
    seoTitle: 'Compress Image to 200KB Online — Free, No Sign-Up',
    seoDescription:
      'Compress a JPG, PNG or WebP photo to under 200 KB for resumes, profile pictures and application forms. Free, automatic, entirely in your browser.',
    keywords: ['compress image to 200kb', 'reduce photo size to 200kb', 'compress resume photo', 'image compressor 200kb', 'reduce profile picture size'],
    howItWorks: [
      { title: 'Upload your photo', body: 'JPG, PNG or WebP, from your computer or phone.' },
      { title: '200 KB target is ready', body: 'This page starts you at the 200 KB chip; pick a different size any time.' },
      { title: 'Download and upload', body: 'The exact final size and quality are shown, so you can confirm it fits before submitting it to a form.' },
    ],
    sections: [
      {
        heading: 'Why 200 KB rarely needs a dimension cut',
        paragraphs: [
          'At 200 KB, the tool can almost always reach the target through quality reduction alone, without shrinking the photo\'s pixel dimensions — which means the result generally looks close to the original at normal viewing sizes. This is a comfortable target for a full-face profile or resume photo where detail still matters.',
          'If your source photo is unusually large (a very high-megapixel camera photo, for instance), the tool may still make a small dimension adjustment — it always tells you exactly what it did in the result summary.',
        ],
      },
      {
        heading: 'A note on portrait vs. landscape crops',
        paragraphs: [
          'This tool compresses your image as-is; it does not crop it. If your resume or application form specifies an aspect ratio (like a square profile photo), crop the image to that shape first — many phone gallery apps and our own Exam Photo & Passport Photo tools include a crop step, then run the result through here for the final size.',
        ],
      },
    ],
    faq: [
      { q: 'Is 200 KB good enough quality for a resume photo?', a: 'Yes — at 200 KB, quality loss is usually minimal for a normal headshot-style photo, well above what most resume templates or portals require.' },
      { q: 'Can I compress a screenshot to 200 KB?', a: 'Yes, though screenshots (especially of text or UI) sometimes compress unevenly with JPG. If the result looks off, try the WebP output option, which often handles flat colours and sharp edges better.' },
      { q: 'Does the tool keep my photo\'s EXIF/orientation correct?', a: 'Yes — the image is decoded and re-encoded through your browser\'s Canvas, which respects orientation, so a properly-oriented photo goes in and comes out the same way up.' },
      { q: 'What happens if 200 KB is more than my original file size?', a: 'If your file is already smaller than 200 KB, the tool will typically leave it close to its original quality rather than needlessly re-compressing it larger.' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'compress-image-to-500kb',
    targetToolId: 'compress-to-size',
    targetSizeKB: 500,
    h1: 'Compress an Image to 500 KB',
    intro:
      '500 KB is a common email attachment and web-upload limit — big enough to keep a photo looking sharp, small enough to avoid "attachment too large" errors or slow page loads. This tool finds the right quality automatically.',
    seoTitle: 'Compress Image to 500KB Online — Free, No Sign-Up',
    seoDescription:
      'Compress a JPG, PNG or WebP photo to under 500 KB for email attachments, web uploads and portfolios. Free, automatic, runs entirely in your browser.',
    keywords: ['compress image to 500kb', 'reduce photo size to 500kb', 'compress image for email attachment', 'image compressor 500kb', 'shrink photo for website upload'],
    howItWorks: [
      { title: 'Add your photo', body: 'Any JPG, PNG or WebP file — high-resolution camera photos included.' },
      { title: '500 KB is pre-set', body: 'The target chip starts at 500 KB; adjust it if a different limit applies.' },
      { title: 'Download the result', body: 'A clearly sharp, web-ready file at (or just under) 500 KB, ready to attach or upload.' },
    ],
    sections: [
      {
        heading: 'Why 500 KB is a good balance for photos',
        paragraphs: [
          'At 500 KB, high-resolution photos usually retain their full pixel dimensions and only need a moderate quality reduction, so visible quality loss is minimal even on close inspection. This makes it a sensible default for portfolio images, email attachments, and web pages where load speed matters but so does visual quality.',
          'Many email providers reject or silently compress attachments above a few megabytes; keeping individual photos around 500 KB is a reliable way to stay well within typical attachment limits, especially when sending several photos in one email.',
        ],
      },
      {
        heading: 'For website performance specifically',
        paragraphs: [
          'If your goal is faster page loads rather than a form requirement, consider WebP output here — it typically produces noticeably smaller files than JPG at the same visual quality, so a 500 KB WebP often looks better than a 500 KB JPG of the same photo.',
        ],
      },
    ],
    faq: [
      { q: 'Will 500 KB photos look noticeably worse than the original?', a: 'Usually not by much — 500 KB is large enough that most consumer photos need only mild compression to reach it, so quality loss is typically subtle.' },
      { q: 'Is WebP a better choice than JPG at 500 KB?', a: 'Often yes for the same visual quality, WebP files tend to be smaller — but check that wherever you\'re uploading to actually accepts WebP before switching.' },
      { q: 'Can I batch-compress a whole folder of photos to 500 KB?', a: 'Yes, add up to 100 images at once; they process one by one with a progress bar and download together as a ZIP.' },
      { q: 'Does compressing to 500 KB strip my photo\'s location/EXIF data?', a: 'Re-encoding through Canvas does not preserve embedded EXIF metadata (including GPS location), so compressed images are also a simple way to strip that data if privacy is a concern.' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'compress-image-to-1mb',
    targetToolId: 'compress-to-size',
    targetSizeKB: 1024,
    h1: 'Compress an Image to 1 MB',
    intro:
      '1 MB is the most common upload limit across social platforms, cloud forms and content management systems. This tool automatically finds the quality that gets a large photo down to 1 MB or under, with minimal visible quality loss.',
    seoTitle: 'Compress Image to 1MB Online — Free, No Sign-Up',
    seoDescription:
      'Compress a JPG, PNG or WebP photo to under 1 MB for social media, cloud forms and CMS uploads. Free, automatic, entirely in your browser — no sign-up.',
    keywords: ['compress image to 1mb', 'reduce photo size to 1mb', 'compress image for upload limit', 'image compressor 1mb', 'shrink large photo to 1mb'],
    howItWorks: [
      { title: 'Upload your photo', body: 'Works well even on very large camera or phone photos, several megabytes in size.' },
      { title: '1 MB target is pre-selected', body: 'This page starts at the 1 MB (1024 KB) chip — change it if you need something smaller.' },
      { title: 'Download a lighter file', body: 'The result keeps as much visual quality as possible while fitting comfortably under 1 MB.' },
    ],
    sections: [
      {
        heading: 'Why phone photos often exceed upload limits',
        paragraphs: [
          'Modern phone cameras routinely produce photos of 3–8 MB or more, well above the 1 MB (or smaller) limits enforced by many upload forms, messaging apps and content platforms. At a 1 MB target, this tool almost always needs only a modest quality reduction — dimensions are typically left untouched — so the compressed photo remains visually very close to the original.',
        ],
      },
      {
        heading: 'When you actually need something smaller than 1 MB',
        paragraphs: [
          'If the platform you\'re uploading to has a stricter limit than 1 MB, use the quick-pick chips inside the tool (20 KB up to 1 MB) or type any custom target — the same automatic search runs regardless of the size you choose.',
        ],
      },
    ],
    faq: [
      { q: 'Why is my phone photo several megabytes to begin with?', a: 'Modern smartphone cameras capture very high resolution and detail by default, which produces large files — that headroom is useful for cropping and printing, but overkill for most online uploads.' },
      { q: 'Does compressing to 1 MB reduce the photo\'s resolution?', a: 'Usually not — 1 MB is a large enough target that most photos reach it through quality reduction alone, keeping their original pixel dimensions.' },
      { q: 'Can I use this for videos too?', a: 'No, this tool only compresses still images (JPG, PNG, WebP). Video compression is not supported.' },
      { q: 'Is there a faster way to compress many large photos at once?', a: 'Yes — add up to 100 photos and they are processed sequentially with a progress bar, then downloaded together as one ZIP file.' },
    ],
    updatedAt: UPDATED,
  },
];

const faqSchema = z.object({ q: z.string().min(3), a: z.string().min(3) });

const landingPageSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  targetToolId: z.string().min(1),
  targetSizeKB: z.number().positive(),
  h1: z.string().min(10).max(70),
  intro: z.string().min(50),
  seoTitle: z.string().min(15).max(62),
  seoDescription: z.string().min(50).max(260),
  keywords: z.array(z.string().min(2)).min(3),
  howItWorks: z.array(z.object({ title: z.string(), body: z.string() })).min(2),
  sections: z.array(z.object({ heading: z.string(), paragraphs: z.array(z.string()).min(1), bullets: z.array(z.string()).optional() })).min(1),
  faq: z.array(faqSchema).min(3),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const toolIds = new Set(ALL_TOOLS.map((t) => t.id));
const seenSlugs = new Set<string>();

for (const page of LANDING_PAGES) {
  const parsed = landingPageSchema.safeParse(page);
  if (!parsed.success) {
    throw new Error(
      `Invalid landing page "${page.slug ?? 'unknown'}": ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`,
    );
  }
  if (RESERVED_SLUGS.has(page.slug)) {
    throw new Error(`Landing page slug "${page.slug}" collides with an existing top-level route.`);
  }
  if (seenSlugs.has(page.slug)) {
    throw new Error(`Duplicate landing page slug "${page.slug}".`);
  }
  seenSlugs.add(page.slug);
  if (!toolIds.has(page.targetToolId)) {
    throw new Error(`Landing page "${page.slug}" references unknown tool id "${page.targetToolId}".`);
  }
}

export function getLandingPage(slug: string): LandingPageConfig | undefined {
  return LANDING_PAGES.find((p) => p.slug === slug);
}
