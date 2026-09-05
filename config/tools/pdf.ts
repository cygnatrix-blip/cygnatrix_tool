import type { ToolConfig } from '@/types/tool';

const UPDATED = '2026-08-27';

const base = {
  category: 'pdf' as const,
  toolType: 'file' as const,
  active: true,
  updatedAt: UPDATED,
};

export const PDF_TOOLS: ToolConfig[] = [
  {
    ...base,
    id: 'merge-pdf',
    name: 'Merge PDF',
    slug: 'merge-pdf',
    path: '/pdf/merge-pdf',
    icon: 'combine',
    featured: true,
    popular: true,
    sortOrder: 1,
    shortDescription: 'Combine multiple PDF files into one document, in any order.',
    description:
      'Combine several PDF files into a single document. Drag to reorder pages, remove files you do not need, and download the merged PDF — all without uploading anything.',
    keywords: ['merge pdf', 'combine pdf', 'join pdf', 'pdf merger', 'add pdf together'],
    seoTitle: 'Merge PDF — Combine PDF Files Online Free',
    seoDescription:
      'Free online tool to merge PDF files into one document. Drag-and-drop, reorder, and combine unlimited PDFs in your browser. No upload, no watermark, no sign-up.',
    content: {
      howItWorks: [
        { title: 'Add your PDFs', body: 'Drop your PDF files onto the upload area or browse to select them. Add as many as you need.' },
        { title: 'Put them in order', body: 'Drag the file cards to arrange them. The merged document follows this order, top to bottom.' },
        { title: 'Merge and download', body: 'Press Merge PDF. The combined file is built in your browser and downloads immediately.' },
      ],
      features: [
        'Unlimited files per merge (device memory permitting)',
        'Drag-and-drop reordering',
        'Remove individual files before merging',
        'Preserves the original page quality and text',
        'Works offline once the page has loaded',
        '100% private — files never leave your device',
      ],
      sections: [
        {
          heading: 'When to merge PDFs',
          paragraphs: [
            'Merging is useful whenever a single logical document lives in several files: a signed contract plus its annexures, a set of scanned receipts for an expense claim, or chapters exported separately from a word processor.',
            'Because the merge happens locally, page text, form fields and bookmarks from each source file are carried into the result rather than being flattened into images.',
          ],
        },
        {
          heading: 'If a merge fails partway through',
          paragraphs: [
            'A merge usually fails for one of two reasons: one of the source files is corrupted or was never really a PDF (a renamed image, or a download that was cut off), or the combined document has grown large enough that your browser tab is running low on memory — far more likely on an older phone than a desktop.',
            'If a specific file is the problem, remove it from the list and merge the rest; the file causing the error is often the smallest one relative to its page count, a common sign of a broken export. If it is a memory issue instead, merge in two smaller batches and then merge those two results together.',
          ],
          bullets: [
            'Corrupted or fake-PDF file: remove it and re-export it from its original source.',
            'Large combined size on mobile: merge in two batches, then merge the batches.',
          ],
        },
      ],
      example: {
        inputs: [
          { label: 'File 1', value: 'cover-letter.pdf (1 page)' },
          { label: 'File 2', value: 'resume.pdf (2 pages)' },
          { label: 'File 3', value: 'certificates.pdf (3 pages)' },
        ],
        result: [{ label: 'Output', value: 'merged.pdf — 6 pages, in the order above' }],
        walkthrough:
          'The three files are read into memory, their pages are copied sequentially into a new document, and the 6-page result is saved. Total time is under a second for typical files.',
      },
    },
    faq: [
      { q: 'Is there a limit on the number of files?', a: 'There is no fixed limit. Very large merges are bounded only by your device’s available memory. On a phone, keep the total under roughly 100 MB.' },
      { q: 'Will merging change the quality of my pages?', a: 'No. Pages are copied as-is. Text stays selectable and images keep their original resolution.' },
      { q: 'Can I merge password-protected PDFs?', a: 'You need to remove the password first. Encrypted files cannot be read without it, and this tool does not attempt to bypass protection.' },
      { q: 'Does the merged file keep bookmarks and links?', a: 'Internal page structure and most links are preserved. Some complex interactive features may not carry over.' },
      { q: 'Can I merge PDFs on my phone?', a: 'Yes — the tool works the same in a mobile browser as on desktop, including picking files from your camera roll or a cloud drive app. Very large merges just take a little longer on a phone\'s more limited memory.' },
    ],
    relatedTools: ['split-pdf', 'compress-pdf', 'pdf-to-word', 'pdf-to-jpg'],
  },
  {
    ...base,
    id: 'split-pdf',
    name: 'Split PDF',
    slug: 'split-pdf',
    path: '/pdf/split-pdf',
    icon: 'scissors',
    featured: true,
    popular: false,
    sortOrder: 2,
    shortDescription: 'Extract pages or split a PDF into separate files.',
    description:
      'Split a PDF by every page, by a custom selection, or by page ranges. Download the results individually or as a ZIP — processed entirely in your browser.',
    keywords: ['split pdf', 'extract pdf pages', 'separate pdf', 'pdf splitter', 'delete pdf pages'],
    seoTitle: 'Split PDF — Extract & Separate PDF Pages Online Free',
    seoDescription:
      'Free online tool to split a PDF into separate files or extract specific pages and ranges. Runs in your browser — no upload, no watermark, no sign-up.',
    content: {
      howItWorks: [
        { title: 'Upload a PDF', body: 'Select the PDF you want to split. Its page count is detected automatically.' },
        { title: 'Choose how to split', body: 'Split every page into its own file, extract a specific selection, or define ranges like 1-3, 5, 8-10.' },
        { title: 'Download the results', body: 'Grab each output file, or download them all together as a ZIP.' },
      ],
      features: [
        'Split every page into individual PDFs',
        'Extract a custom page selection',
        'Split by multiple page ranges',
        'Download individually or as a ZIP archive',
        'Original page quality preserved',
        'Entirely browser-based and private',
      ],
      sections: [
        {
          heading: 'Range syntax',
          paragraphs: [
            'The range field accepts comma-separated page numbers and hyphenated ranges. For example, 1-3, 5, 9-12 produces one file with pages 1 to 3, page 5, and pages 9 to 12 — or three separate files if you choose “one file per range”.',
            'Pages outside the document are ignored, and overlapping ranges are handled gracefully.',
          ],
        },
        {
          heading: 'Common problems when splitting',
          paragraphs: [
            'The most frequent mistake is off-by-one counting: page numbers here always refer to position in the file (page 1 is the first page you see), not any page number printed on the page itself, which can differ if a document has a cover page or starts its printed numbering later.',
            'If you are trying to separate a batch of scanned documents that were fed through a scanner as one long file, first check whether the page count per document is consistent — most scanners produce a predictable number of pages per item, which makes writing the range list much faster than counting individually.',
          ],
        },
      ],
      example: {
        inputs: [
          { label: 'Input', value: 'report.pdf (20 pages)' },
          { label: 'Mode', value: 'Ranges: 1-2, 5-8' },
        ],
        result: [
          { label: 'File 1', value: 'report-1-2.pdf (2 pages)' },
          { label: 'File 2', value: 'report-5-8.pdf (4 pages)' },
        ],
        walkthrough:
          'The tool reads the 20-page document, copies the requested pages into two new PDFs, and offers both as downloads or a single ZIP.',
      },
    },
    faq: [
      { q: 'How do I extract just one page?', a: 'Use the selection mode and tick the page you want, or type its number in the range field (for example, just “7”).' },
      { q: 'Can I remove pages instead of extracting them?', a: 'Yes — select or list all the pages you want to keep. The pages you leave out are effectively removed from the output.' },
      { q: 'What is the maximum page count?', a: 'Up to 500 pages per document. Larger files usually still work but may be slow on mobile.' },
      { q: 'Are the split files watermarked?', a: 'No. There are no watermarks anywhere on Cygnatrix Tools.' },
      { q: 'Can I preview a page before deciding to include it?', a: 'Thumbnails are shown for the whole document before you split, so you can check page content and orientation before finalising your ranges or selection.' },
      { q: 'Can I split a PDF and then merge some of the results back together?', a: 'Yes — split off the files you need, then use Merge PDF to recombine any subset of them in a new order, all still without leaving your browser.' },
      { q: 'Is there a fee for splitting more than a few pages?', a: 'No. There is no file-count, page-count or usage limit anywhere on Cygnatrix Tools — split as many documents as you like, as often as you like, for free.' },
      { q: 'Will the split files be named automatically?', a: 'Yes — each output file is named after the original document with its page range appended, so you can easily tell them apart without opening each one individually.' },
    ],
    relatedTools: ['merge-pdf', 'compress-pdf', 'pdf-to-jpg', 'pdf-to-word'],
  },
  {
    ...base,
    id: 'compress-pdf',
    name: 'Compress PDF',
    slug: 'compress-pdf',
    path: '/pdf/compress-pdf',
    icon: 'file-archive',
    featured: true,
    popular: true,
    sortOrder: 3,
    shortDescription: 'Reduce PDF file size so it is easier to email and upload.',
    description:
      'Shrink a PDF by downsampling embedded images and stripping unused data. See the original size, the new size and the percentage saved before you download.',
    keywords: ['compress pdf', 'reduce pdf size', 'shrink pdf', 'pdf compressor', 'make pdf smaller'],
    seoTitle: 'Compress PDF — Reduce PDF File Size Online Free',
    seoDescription:
      'Free online PDF compressor. Reduce PDF file size in your browser by downsampling images and removing unused data. Shows before/after size. No upload, no sign-up.',
    content: {
      howItWorks: [
        { title: 'Upload a PDF', body: 'Choose the PDF you want to make smaller.' },
        { title: 'Pick a compression level', body: 'Choose Strong, Balanced or Light. Stronger settings downsample images more aggressively.' },
        { title: 'Compare and download', body: 'The tool shows the original size, the compressed size and the reduction. Download if you are happy with the trade-off.' },
      ],
      features: [
        'Three compression levels',
        'Image downsampling and re-encoding',
        'Metadata and unused-object removal',
        'Before/after size and percentage saved',
        'No quality surprises — you see the result first',
        'Processed entirely in your browser',
      ],
      sections: [
        {
          heading: 'What “compress” means without a server',
          paragraphs: [
            'Desktop tools like Acrobat use a print engine (Ghostscript-style) to rebuild a PDF from scratch. That is not available in a browser, so this tool takes a pragmatic approach: it re-renders image-heavy pages at a lower resolution, re-encodes them as efficient JPEGs, and removes metadata and orphaned objects.',
            'For scanned documents and image-rich brochures this often cuts the file by 40–70%. For a PDF that is mostly text, the savings are small because the text is already compact — in that case the tool mainly strips metadata.',
          ],
          bullets: [
            'Best results: scanned pages, photo-heavy PDFs, exported presentations.',
            'Limited results: text-only reports, PDFs already optimised for web.',
          ],
        },
        {
          heading: 'Choosing between the three levels',
          paragraphs: [
            'Light only strips metadata and rewrites the file structure — it never touches images, so it is the safest choice when the document must stay pixel-perfect and text must remain selectable, at the cost of a smaller size reduction.',
            'Balanced and Strong both rasterise image-heavy pages at a lower resolution; Strong pushes the DPI and JPEG quality further down for a smaller file. If the compressed result looks too soft, step back one level rather than assuming compression itself is the problem — the three levels exist precisely so you can trade size against sharpness.',
          ],
        },
      ],
      example: {
        inputs: [
          { label: 'Input', value: 'scanned-contract.pdf' },
          { label: 'Original size', value: '8.4 MB' },
          { label: 'Level', value: 'Balanced' },
        ],
        result: [
          { label: 'Compressed size', value: '2.1 MB' },
          { label: 'Saved', value: '75%' },
        ],
        walkthrough:
          'Each page is rasterised at 150 DPI, saved as JPEG at quality 70, and reassembled. The scanned text remains clearly legible while the file becomes small enough to email.',
      },
    },
    faq: [
      { q: 'Why did my text-only PDF barely shrink?', a: 'Text in a PDF is stored as compact font instructions that are already compressed. There is little to remove. Compression mainly helps files that contain scanned pages or photographs.' },
      { q: 'Will the text stay selectable?', a: 'In Light mode, yes. In Balanced and Strong mode, image-heavy pages may be rasterised, which can turn selectable text into an image. The tool tells you when this happens.' },
      { q: 'Is my file uploaded for compression?', a: 'No. All rendering and re-encoding happens on your device.' },
      { q: 'Can I compress a PDF that is already small?', a: 'You can, but expect minimal change. The before/after comparison will make the trade-off obvious.' },
      { q: 'What if the compressed file is still too big for my email limit?', a: 'Try the Strong level, or, if the document mainly contains large images, compress those images individually first with our image compressor before assembling them into a PDF.' },
      { q: 'Does compression run more than once if I try different levels?', a: 'Yes — you can try Light, Balanced and Strong on the same upload one after another and compare the results before choosing which one to download.' },
    ],
    relatedTools: ['merge-pdf', 'split-pdf', 'pdf-to-jpg', 'pdf-to-word'],
  },
  {
    ...base,
    id: 'pdf-to-word',
    name: 'PDF to Word',
    slug: 'pdf-to-word',
    path: '/pdf/pdf-to-word',
    icon: 'file-type',
    featured: false,
    popular: true,
    sortOrder: 4,
    shortDescription: 'Convert a PDF into an editable Word (.docx) document.',
    description:
      'Extract the text and basic layout from a PDF and save it as a .docx file you can edit in Word, Google Docs or LibreOffice. Best for text-based PDFs.',
    keywords: ['pdf to word', 'pdf to docx', 'convert pdf to word', 'pdf to editable document', 'extract text from pdf'],
    seoTitle: 'PDF to Word — Convert PDF to Editable DOCX Online Free',
    seoDescription:
      'Free online PDF to Word converter. Turn text-based PDFs into editable .docx documents in your browser. Honest about limits with scanned files and complex layouts.',
    content: {
      howItWorks: [
        { title: 'Upload a PDF', body: 'Select a text-based PDF. The tool checks whether it contains a real text layer.' },
        { title: 'Convert', body: 'Text is extracted page by page, grouped into paragraphs and headings by position and font size.' },
        { title: 'Download the .docx', body: 'Open the result in Word, Google Docs or LibreOffice and edit freely.' },
      ],
      features: [
        'Real .docx output, not a renamed PDF',
        'Paragraph and heading detection',
        'Preserves reading order',
        'Scanned-PDF detection with a clear warning',
        'Runs entirely in your browser',
      ],
      sections: [
        {
          heading: 'What converts well, and what does not',
          paragraphs: [
            'This converter reads the text layer that most PDFs carry and rebuilds it as flowing Word paragraphs. Documents created from a word processor, a report generator or a web page convert cleanly.',
            'It cannot do optical character recognition, so a scanned document (which is really a picture of text) comes through as an image with no editable text — the tool detects this and warns you before converting.',
          ],
          bullets: [
            'Good: articles, letters, contracts, reports exported from software.',
            'Limited: multi-column layouts, tables, text boxes, footnotes.',
            'Not supported: scanned pages, handwriting, text embedded in graphics.',
          ],
        },
        {
          heading: 'After converting: what to check first',
          paragraphs: [
            'Open the .docx and skim the paragraph breaks first — since the converter infers structure from position and font size rather than reading explicit formatting tags, an unusual layout (a two-column CV, a form with boxes) can occasionally merge two lines that were meant to stay separate, or split one that should have stayed together.',
            'Headings are the next thing worth a quick check: the tool promotes noticeably larger text to a heading style, which works well for documents with a clear title hierarchy but can occasionally catch a large pull-quote or a page number styled in big text. Both are quick manual fixes once you\'re in Word.',
          ],
        },
      ],
      example: {
        inputs: [
          { label: 'Input', value: 'offer-letter.pdf (2 pages, text-based)' },
        ],
        result: [{ label: 'Output', value: 'offer-letter.docx — editable paragraphs and headings' }],
        walkthrough:
          'The tool pulls each text run with its position and size, groups runs on the same line, joins lines into paragraphs, promotes larger text to headings, and writes a Word document with that structure.',
      },
    },
    faq: [
      { q: 'Why is my converted document missing its formatting?', a: 'PDF stores where each character sits on the page, not that “this is a heading” or “this is a table”. The converter reconstructs paragraphs and headings from position and size, but fine formatting and complex tables cannot be fully recovered.' },
      { q: 'My scanned PDF came out as a blank or image-only document. Why?', a: 'A scanned PDF contains no text, only an image of text. Converting it needs OCR, which this browser-based tool does not perform. You will see a warning when the tool detects a scan.' },
      { q: 'Is the .docx compatible with Google Docs?', a: 'Yes. The output is a standard Office Open XML file that opens in Word, Google Docs, LibreOffice and Pages.' },
      { q: 'Are my documents uploaded?', a: 'No. Text extraction and .docx generation both happen in your browser.' },
      { q: 'Can I convert just a few pages instead of the whole PDF?', a: 'Not directly — split out the pages you need first with our Split PDF tool, then convert that smaller file to Word.' },
    ],
    relatedTools: ['pdf-to-jpg', 'merge-pdf', 'split-pdf', 'compress-pdf'],
  },
  {
    ...base,
    id: 'pdf-to-jpg',
    name: 'PDF to JPG',
    slug: 'pdf-to-jpg',
    path: '/pdf/pdf-to-jpg',
    icon: 'image-down',
    featured: false,
    popular: false,
    sortOrder: 5,
    shortDescription: 'Turn each PDF page into a high-quality JPG image.',
    description:
      'Render PDF pages to JPG images at the resolution and quality you choose. Download pages individually or as a ZIP. Everything runs in your browser.',
    keywords: ['pdf to jpg', 'pdf to image', 'convert pdf to jpg', 'pdf pages to picture', 'pdf to jpeg'],
    seoTitle: 'PDF to JPG — Convert PDF Pages to Images Online Free',
    seoDescription:
      'Free online PDF to JPG converter. Render every PDF page to a high-quality JPG image at your chosen DPI and quality, in your browser. No upload, no watermark.',
    content: {
      howItWorks: [
        { title: 'Upload a PDF', body: 'Choose the PDF you want to convert to images.' },
        { title: 'Set quality and pages', body: 'Pick a DPI (resolution), a JPG quality level and which pages to render.' },
        { title: 'Download the images', body: 'Save each page as a JPG, or download every page in one ZIP file.' },
      ],
      features: [
        'Adjustable resolution (DPI) up to print quality',
        'JPG quality control',
        'Convert all pages or a selection',
        'Individual downloads or a single ZIP',
        'Rendered locally with the same engine browsers use to display PDFs',
      ],
      sections: [
        {
          heading: 'Choosing a resolution',
          paragraphs: [
            'For on-screen use — a website, a slide, a preview — 96 to 150 DPI is plenty and keeps the files small.',
            'For printing or archiving, choose 300 DPI. The images will be several times larger but will hold up when enlarged.',
          ],
        },
        {
          heading: 'Common problems and how to fix them',
          paragraphs: [
            'If a page comes out with a white background where the PDF had transparency, that is expected — JPG has no transparency channel, so any transparent area is filled with white during rendering. If you need to keep transparency, there isn\'t a way around this within JPG; it is a format limitation, not a bug.',
            'On mobile browsers, converting a very long document (100+ pages) at 300 DPI and downloading it as one ZIP can be slow or run low on memory. Converting the document in two smaller page ranges, one after another, usually finishes far faster and more reliably than one huge batch.',
          ],
        },
      ],
      example: {
        inputs: [
          { label: 'Input', value: 'brochure.pdf (4 pages)' },
          { label: 'Settings', value: '150 DPI, quality 90, all pages' },
        ],
        result: [{ label: 'Output', value: 'brochure-1.jpg … brochure-4.jpg, or brochure-images.zip' }],
        walkthrough:
          'Each page is drawn onto an off-screen canvas at 150 DPI and exported as a JPEG at quality 90. The four images are offered individually and bundled into a ZIP.',
      },
    },
    faq: [
      { q: 'Can I get PNG instead of JPG?', a: 'This tool outputs JPG, which is ideal for page images. For a transparent or lossless copy, convert the resulting JPG with our JPG to PNG tool, or use PDF to JPG at high quality.' },
      { q: 'Why are large pages slow to convert?', a: 'Higher DPI means far more pixels to render and encode. A 300 DPI A4 page is about 8.7 megapixels. Reduce the DPI if speed matters more than print quality.' },
      { q: 'Does this work for a 200-page PDF?', a: 'Yes, up to our 500-page limit, though rendering every page at high DPI on a phone will take time and memory. Convert in batches if needed.' },
      { q: 'Are my pages uploaded to convert them?', a: 'No. Rendering happens entirely in your browser.' },
      { q: 'Can I convert only some pages instead of the whole document?', a: 'Yes — the page selection lets you tick individual pages or type a range, so you only get images for the pages you actually need.' },
      { q: 'Can I use the JPGs I get for social media or a presentation?', a: 'Yes — at 150 DPI or higher, the images look sharp on screen and are a common way to share individual PDF pages where the recipient can\'t or won\'t open a PDF.' },
      { q: 'Will the image dimensions match the original page size?', a: 'Yes, proportionally — an A4 page at 150 DPI renders to roughly 1240×1754 pixels, scaling up or down consistently with whatever DPI you choose.' },
      { q: 'Can I rename the downloaded images?', a: 'Yes, once downloaded they are ordinary JPG files on your device — rename them however your workflow needs, the tool has no control over that after download.' },
    ],
    relatedTools: ['pdf-to-word', 'compress-pdf', 'split-pdf', 'jpg-to-png'],
  },
  {
    ...base,
    id: 'image-to-pdf',
    name: 'Image to PDF',
    slug: 'image-to-pdf',
    path: '/pdf/image-to-pdf',
    icon: 'file-plus',
    featured: true,
    popular: false,
    sortOrder: 6,
    updatedAt: '2026-08-28',
    shortDescription: 'Combine JPG, PNG or WebP photos into a single PDF.',
    description:
      'Turn one or more images into a PDF document. Drag to set the page order, choose A4, Letter or a page sized to fit each photo, pick orientation and margins.',
    keywords: ['image to pdf', 'jpg to pdf', 'png to pdf', 'photos to pdf', 'convert images to pdf'],
    seoTitle: 'Image to PDF — Convert JPG & PNG to PDF Online Free',
    seoDescription:
      'Free online tool to combine JPG, PNG or WebP images into one PDF. Reorder pages, choose A4/Letter/fit-to-image, set orientation and margins. No upload, no sign-up.',
    content: {
      howItWorks: [
        { title: 'Add your images', body: 'Drop in one or more photos or scans. Add as many as you need.' },
        { title: 'Set the order and layout', body: 'Drag to reorder, then choose page size, orientation and margins.' },
        { title: 'Create the PDF', body: 'Each image becomes one page, built in your browser and downloaded instantly.' },
      ],
      features: [
        'Multiple images per PDF, in the order you choose',
        'A4, Letter or fit-to-image page sizing',
        'Portrait or landscape orientation',
        'Adjustable margins',
        'Works with JPG, PNG and WebP',
        '100% private — files never leave your device',
      ],
      sections: [
        {
          heading: 'Choosing a page size',
          paragraphs: [
            'A4 and Letter are the standard choices for documents you plan to print or send formally — each photo is centred and scaled to fit within your chosen margin.',
            'Fit to image keeps every page sized to match its photo’s own proportions, which looks best for a PDF of scans or screenshots that will only be viewed on screen.',
          ],
        },
        {
          heading: 'Common problems with phone photos',
          paragraphs: [
            'Photos taken in mixed portrait and landscape orientation are the most frequent source of an odd-looking PDF — on a fixed page size, a landscape photo gets shrunk down much smaller than a portrait one to fit within the same page, leaving a lot of empty margin around it. Fit to image avoids this entirely by letting each page match its own photo\'s shape.',
            'If a scanned or photographed document reads sideways once combined into the PDF, rotate the source image itself (most phone gallery apps can do this in a couple of taps) before adding it here — this tool lays out images as given and does not auto-detect or correct orientation.',
          ],
        },
      ],
      example: {
        inputs: [
          { label: 'Images', value: '3 photos, various sizes' },
          { label: 'Page size', value: 'A4, portrait, 10mm margin' },
        ],
        result: [{ label: 'Output', value: 'images.pdf — 3 pages, each photo centred on an A4 page' }],
        walkthrough:
          'Each photo is drawn onto its own A4 page, scaled to fit inside a 10mm margin while keeping its original aspect ratio, then centred.',
      },
    },
    faq: [
      { q: 'Can I mix JPG and PNG images in one PDF?', a: 'Yes. Every image is normalised to a consistent format internally, so you can mix JPG, PNG and WebP freely in the same document.' },
      { q: 'Will my photos lose quality?', a: 'Images are embedded at high quality (92%) with no resizing beyond fitting the page, so quality loss is minimal.' },
      { q: 'Can I change the order after adding images?', a: 'Yes, use the up/down arrows on each file to reorder before creating the PDF.' },
      { q: 'Are my images uploaded?', a: 'No. The PDF is assembled entirely in your browser.' },
      { q: 'Can I add more images after I have already added some?', a: 'Yes — keep dropping in more files at any point before you create the PDF; new images are appended to the end of the current order and can then be dragged into place.' },
      { q: 'What is the maximum number of images I can combine?', a: 'Up to 100 images per PDF. That covers everything from a single scanned form to a full multi-page document photographed page by page.' },
      { q: 'Does the tool add its own branding or watermark to the PDF?', a: 'No. The only thing embedded is your own images, laid out on the page size and margin you chose.' },
      { q: 'Can I use screenshots as well as photos?', a: 'Yes — any JPG, PNG or WebP file works, screenshots included, so this also doubles as a quick way to turn a set of screenshots into one shareable document.' },
    ],
    relatedTools: ['merge-pdf', 'pdf-to-jpg', 'compress-pdf', 'organize-pdf'],
  },
  {
    ...base,
    id: 'rotate-pdf',
    name: 'Rotate PDF',
    slug: 'rotate-pdf',
    path: '/pdf/rotate-pdf',
    icon: 'rotate-cw',
    featured: false,
    popular: false,
    sortOrder: 7,
    updatedAt: '2026-08-28',
    shortDescription: 'Rotate one page or every page of a PDF, with a live preview.',
    description:
      'Fix sideways or upside-down pages. Rotate a single page or the whole document by 90, 180 or 270 degrees and preview the result before saving.',
    keywords: ['rotate pdf', 'turn pdf page', 'fix pdf orientation', 'rotate pdf pages online'],
    seoTitle: 'Rotate PDF — Turn PDF Pages Online Free',
    seoDescription:
      'Free online tool to rotate PDF pages 90, 180 or 270 degrees. Rotate a single page or the whole document with a live thumbnail preview. No upload, no sign-up.',
    content: {
      howItWorks: [
        { title: 'Upload a PDF', body: 'Every page renders as a thumbnail so you can see the current orientation.' },
        { title: 'Rotate pages', body: 'Rotate individual pages or use "rotate all" for the whole document. The preview updates instantly.' },
        { title: 'Save', body: 'Download the corrected PDF with your rotations applied.' },
      ],
      features: [
        'Rotate a single page or every page at once',
        '90°, 180° or 270° turns',
        'Live thumbnail preview before saving',
        'Preserves page content and quality',
        'Entirely browser-based',
      ],
      sections: [
        {
          heading: 'Why pages end up sideways',
          paragraphs: [
            'Scanners and phone cameras often save a page in the orientation it was physically fed or held, not the orientation it should be read in — the PDF viewer then displays it sideways or upside down.',
            'Rotating in the PDF itself (rather than just how your viewer displays it) fixes this permanently for anyone who opens the file.',
          ],
        },
        {
          heading: 'Mixed-orientation scans',
          paragraphs: [
            'A very common case is a multi-page scan where most pages read correctly but one or two — often a landscape table or diagram inserted into an otherwise portrait document — come out sideways. Rather than rotating the whole document, use the per-page rotate buttons so the correctly-oriented pages are left untouched and only the sideways ones are fixed.',
            'If a whole batch scanned upside down (a common result of feeding paper into a scanner the wrong way round), "rotate all" by 180 degrees fixes every page in one action instead of clicking through each thumbnail individually.',
          ],
          bullets: [
            'One or two pages wrong: rotate those pages individually.',
            'Every page wrong the same way: use "rotate all" once.',
          ],
        },
      ],
      example: {
        inputs: [
          { label: 'Input', value: 'scan.pdf — page 3 upside down' },
          { label: 'Action', value: 'Rotate page 3 by 180°' },
        ],
        result: [{ label: 'Output', value: 'rotated.pdf — page 3 now reads correctly' }],
        walkthrough:
          'Page 3’s stored rotation is adjusted by 180 degrees; every PDF viewer will now display it right-side up without changing the underlying content.',
      },
    },
    faq: [
      { q: 'Can I rotate just one page?', a: 'Yes — each page thumbnail has its own rotate-left and rotate-right buttons.' },
      { q: 'Does rotating reduce quality?', a: 'No. Rotation only changes the page’s display orientation metadata; the content itself is untouched.' },
      { q: 'Can I undo a rotation before saving?', a: 'Yes, keep clicking rotate on that page to cycle back, or refresh and start again before you download.' },
      { q: 'Is my file uploaded?', a: 'No. Rotation happens entirely in your browser.' },
      { q: 'Will the rotated PDF print correctly?', a: 'Yes. Because the rotation is saved into the page itself rather than just how one viewer happens to display it, printing from any application respects the corrected orientation.' },
      { q: 'Does rotating affect selectable text or form fields?', a: 'No — rotation only changes the page\'s orientation metadata. Text stays selectable and any form fields keep working exactly as before.' },
      { q: 'What angle should I use for a page that\'s 90 degrees off?', a: 'Rotate it 90 degrees in whichever direction makes it read correctly — try one direction on the thumbnail first, and switch to the other if it goes the wrong way.' },
      { q: 'Does this work on large, multi-hundred-page PDFs?', a: 'Yes, up to the 500-page limit shared by our PDF tools. Thumbnail rendering for a very large document takes a moment longer, but rotation itself is instant.' },
      { q: 'Does the rotated file keep the same filename?', a: 'The download uses a clear "rotated" suffix by default so you can tell it apart from the original — rename it after download if you prefer to keep the original name.' },
    ],
    relatedTools: ['organize-pdf', 'split-pdf', 'merge-pdf', 'compress-pdf'],
  },
  {
    ...base,
    id: 'organize-pdf',
    name: 'Organize PDF',
    slug: 'organize-pdf',
    path: '/pdf/organize-pdf',
    icon: 'layout-grid',
    featured: true,
    popular: false,
    sortOrder: 8,
    updatedAt: '2026-08-28',
    shortDescription: 'Reorder, delete or extract pages with drag-and-drop thumbnails.',
    description:
      'See every page as a thumbnail, drag pages into a new order, remove the ones you don’t need, or tick a selection to pull out into a brand-new PDF.',
    keywords: ['organize pdf', 'reorder pdf pages', 'delete pdf pages', 'rearrange pdf', 'pdf page organizer'],
    seoTitle: 'Organize PDF — Reorder, Delete & Extract Pages Online Free',
    seoDescription:
      'Free online PDF organizer. Reorder pages, delete pages, or extract a selection into a new PDF using drag-and-drop thumbnails. No upload, no sign-up.',
    content: {
      howItWorks: [
        { title: 'Upload a PDF', body: 'Every page appears as a thumbnail in its current order.' },
        { title: 'Reorder, delete or select', body: 'Move pages with the arrows, remove pages with the ✕, or tick pages to extract.' },
        { title: 'Save or extract', body: 'Save the reordered document, or extract just the pages you ticked into a separate file.' },
      ],
      features: [
        'Drag-style reordering via simple controls',
        'Delete pages you don’t need',
        'Extract a selection into a brand-new PDF',
        'Visual thumbnails for every page',
        'One tool, three actions — no need to switch pages',
      ],
      sections: [
        {
          heading: 'One page, three jobs',
          paragraphs: [
            'Organize PDF replaces three separate tasks — reordering, deleting and extracting — with one visual workspace. Every action works on the same set of page thumbnails, so you can combine them: drop pages you don’t need, reorder what’s left, and pull out a selection, all before downloading.',
          ],
        },
        {
          heading: 'Fixing a double-sided scan that came out interleaved',
          paragraphs: [
            'A common scanning problem: feeding a double-sided document through a single-sided scanner produces all the front pages first, followed by all the back pages in reverse order (page 1, 2, 3 … then the last back page, second-to-last, and so on). The thumbnail view makes this pattern easy to spot, and reordering pages into the correct sequence — front 1, back 1, front 2, back 2 — turns the scan into a properly readable document.',
            'For a large document, do this once and save the corrected order; there is no need to repeat the fix every time you reopen the file.',
          ],
        },
      ],
      example: {
        inputs: [
          { label: 'Input', value: 'report.pdf — 10 pages' },
          { label: 'Action', value: 'Remove page 4, move page 10 to the front' },
        ],
        result: [{ label: 'Output', value: 'organized.pdf — 9 pages in the new order' }],
        walkthrough:
          'Page 4 is removed from the working set and page 10 is dragged to position 1; saving builds a new 9-page PDF in exactly that order.',
      },
    },
    faq: [
      { q: 'Does this change my original file?', a: 'No. Nothing is modified until you click Save or Extract — up to that point you’re only arranging a working copy in your browser.' },
      { q: 'What is the difference between Save and Extract?', a: 'Save keeps every page currently in your working set, in your chosen order. Extract ignores the working set order and instead pulls out only the pages you’ve ticked, in their original order, into a separate file.' },
      { q: 'Can I reorder and delete in the same pass?', a: 'Yes — arrange pages and remove the ones you don’t want, then click Save once.' },
      { q: 'Is my file uploaded?', a: 'No. Everything happens locally in your browser.' },
      { q: 'What is the difference between this and Split PDF?', a: 'Split PDF is built around ranges and producing multiple output files at once. Organize PDF is built around a single visual working copy where you can reorder, delete and extract together before saving one result.' },
      { q: 'Can I undo a mistake before saving?', a: 'Refreshing the page resets the working copy back to the original file order, since nothing is written until you click Save or Extract — so a mistake mid-way through never affects your actual file.' },
      { q: 'Can I extract pages in a different order than they originally appeared?', a: 'Extract always keeps the pages you\'ve ticked in their original document order. If you need a different order, reorder the pages first and then use Save instead.' },
      { q: 'How many pages can I organize at once?', a: 'Up to 500 pages per document, the same ceiling shared across all of our PDF tools.' },
    ],
    relatedTools: ['split-pdf', 'merge-pdf', 'rotate-pdf', 'compress-pdf'],
  },
  {
    ...base,
    id: 'protect-pdf',
    name: 'Protect / Unlock PDF',
    slug: 'protect-pdf',
    path: '/pdf/protect-pdf',
    icon: 'lock',
    featured: true,
    popular: false,
    sortOrder: 9,
    updatedAt: '2026-08-28',
    shortDescription: 'Add an open password to a PDF, or remove one you already know.',
    description:
      'Protect a PDF with a password so it can’t be opened without it, or remove a password you already know from a protected file. Standard 128-bit encryption, opens in every PDF reader.',
    keywords: ['protect pdf', 'password protect pdf', 'unlock pdf', 'remove pdf password', 'encrypt pdf', 'pdf password remover'],
    seoTitle: 'Protect / Unlock PDF — Add or Remove a PDF Password Free',
    seoDescription:
      'Free online tool to password-protect a PDF or remove a known password. Standard 128-bit encryption compatible with every PDF reader. Cannot crack unknown passwords. No upload.',
    content: {
      howItWorks: [
        { title: 'Choose Add or Remove', body: 'Pick whether you want to protect a PDF or unlock one you already have the password for.' },
        { title: 'Upload and enter the password', body: 'Set a new password to protect the file, or enter the current one to remove it.' },
        { title: 'Download', body: 'Your protected or unlocked PDF is ready immediately.' },
      ],
      features: [
        'Add a password required to open the PDF',
        'Remove a password you already know',
        'Standard 128-bit encryption, opens in every reader',
        'Clear about its limits — no password cracking',
        'Processed entirely in your browser',
      ],
      sections: [
        {
          heading: 'What this tool will not do',
          paragraphs: [
            'This is not a password-recovery or password-cracking tool. Removing a password requires knowing it — the tool checks your password against the file’s own security details and only proceeds if it is correct.',
            'It also does not yet support PDFs protected with the newer AES-256 (PDF 2.0) encryption used by some recent Adobe Acrobat exports; those need a desktop PDF reader to remove the password.',
          ],
        },
        {
          heading: 'Choosing a password worth using',
          paragraphs: [
            'A PDF open-password is only as strong as the password itself — a short or common word defeats the purpose of encrypting the file at all. Aim for at least 10–12 characters mixing letters, numbers and a symbol, and avoid anything guessable from your name, birthday or the document\'s own subject.',
            'Write the password down somewhere safe before you protect the file: this tool has no password-recovery feature by design, and neither does the encryption standard it uses — if the password is lost, the document is permanently inaccessible.',
          ],
        },
      ],
      example: {
        inputs: [
          { label: 'Action', value: 'Add a password' },
          { label: 'Input', value: 'contract.pdf' },
          { label: 'Password', value: 'chosen by you' },
        ],
        result: [{ label: 'Output', value: 'protected.pdf — requires the password to open' }],
        walkthrough:
          'The PDF is re-saved with standard 128-bit encryption tied to your chosen password. Any PDF reader will now prompt for it before opening the file.',
      },
    },
    faq: [
      { q: 'Can this remove a password if I don’t know it?', a: 'No, and it never will — that would make it a password-cracking tool, not a convenience one. You must know the current password to remove it.' },
      { q: 'Which PDF readers can open a file I protect here?', a: 'Any of them — Adobe Acrobat, Preview, browser PDF viewers, mobile apps. The 128-bit encryption used is the universal standard.' },
      { q: 'What if my PDF uses AES-256 encryption?', a: 'That newer PDF 2.0 encryption type isn’t supported yet. You’ll see a clear message if this happens; a desktop PDF reader with your password will still be able to remove it.' },
      { q: 'Is my password sent anywhere?', a: 'No. Both protecting and unlocking happen entirely in your browser — your password and file never leave your device.' },
      { q: 'Can I change a PDF\'s password to a new one?', a: 'Yes — unlock it with the current password first, then run it back through Add with the new password you want.' },
      { q: 'Does protecting a PDF also stop copying or printing?', a: 'This tool sets an open password only — the file cannot be viewed at all without it. It does not set the separate "permissions" restrictions some PDFs use to limit copying or printing once already open.' },
      { q: 'Can I protect the same PDF more than once with different passwords for different people?', a: 'Not at the same time — a PDF has one open password. To share different copies with different recipients, protect separate copies of the file with a different password each.' },
    ],
    relatedTools: ['compress-pdf', 'merge-pdf', 'organize-pdf', 'split-pdf'],
  },
];
