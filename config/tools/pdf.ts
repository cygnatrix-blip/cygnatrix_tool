import type { ToolConfig } from '@/types/tool';

const UPDATED = '2026-09-05';

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
    updatedAt: '2026-09-05',
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
    updatedAt: '2026-09-05',
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
    updatedAt: '2026-09-05',
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
    updatedAt: '2026-09-05',
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
  {
    ...base,
    id: 'edit-pdf',
    name: 'Edit PDF',
    slug: 'edit-pdf',
    path: '/pdf/edit-pdf',
    icon: 'pencil-line',
    featured: true,
    popular: false,
    sortOrder: 10,
    updatedAt: UPDATED,
    shortDescription: 'Add text, a signature, highlights, whiteout and shapes to a PDF in your browser.',
    description:
      'A visual PDF editor that runs entirely on your device. Drop a PDF, then type text anywhere, draw or upload a signature, highlight passages, cover mistakes with whiteout, draw freehand and add boxes — then download the edited file. Nothing is uploaded.',
    keywords: [
      'edit pdf',
      'pdf editor',
      'add text to pdf',
      'sign pdf',
      'highlight pdf',
      'draw on pdf',
      'whiteout pdf',
      'free pdf editor online',
    ],
    seoTitle: 'Edit PDF — Add Text, Signature & Highlights Online Free',
    seoDescription:
      'Free online PDF editor. Add text, insert a hand-drawn or uploaded signature, highlight, whiteout, draw freehand and add shapes on any page — 100% in your browser, no upload, no watermark, no sign-up.',
    content: {
      howItWorks: [
        {
          title: 'Open your PDF',
          body: 'Drop in a PDF and every page renders as an editable canvas you can scroll through.',
        },
        {
          title: 'Pick a tool and mark up the page',
          body: 'Use Edit text to click a line of existing text and retype it, or Text, Draw, Highlight, Whiteout, Rectangle and Image / signature to add your own. Switch to Select to move, resize or delete anything.',
        },
        {
          title: 'Apply and download',
          body: 'Press “Apply edits & download PDF”. Your marks are stamped into the page content and the finished file saves straight to your device.',
        },
      ],
      features: [
        'Edit text: click an existing line, and it is covered and reopened for retyping at the same spot, size and font',
        'Add text boxes anywhere, with size, colour, font family and bold',
        'Insert a signature — draw it with a mouse or finger, or upload a PNG / JPG',
        'Highlight text, cover mistakes with opaque whiteout, or draw outlined rectangles',
        'Freehand pen for ticks, arrows and circling',
        'Move, resize and delete any edit before saving; one-click undo and clear',
        'Runs fully in your browser — the PDF and your signature never leave your device',
      ],
      sections: [
        {
          heading: 'What "editing" a PDF actually means here',
          paragraphs: [
            'A PDF is a fixed layout, not a word-processor document, so no browser tool can truly re-flow the original paragraphs. What works instead — and what every online PDF editor does — is to cover the old content and place new content on top. The Edit text tool automates this: it reads where each line of text sits, and when you click one it drops an opaque patch over it (colour-matched to the page) and opens a text box in the same place, at the same size, pre-filled with the words so you can change them.',
            'Every addition is stamped into the page content when you save, so it appears in any PDF reader, prints correctly, and cannot be toggled off. A whiteout patch only covers text visually — to remove confidential text so it can never be recovered, use a dedicated redaction workflow.',
          ],
        },
        {
          heading: 'Signing a document without printing it',
          paragraphs: [
            'The most common reason to edit a PDF is to sign it. Open the Image / signature tool, draw your signature in the box (or upload a photo of one on white paper), and drop it onto the signature line. Resize it with the corner handle and nudge it into place.',
            'Add the date and your name as separate text boxes if the form needs them. Because everything happens locally, a signature you draw here is never sent to a server or stored anywhere after you close the tab.',
          ],
        },
        {
          heading: 'Filling a form that has no fillable fields',
          paragraphs: [
            'Many "forms" are just scanned or exported pages with lines to write on and no interactive fields. Use the Text tool to click next to each label and type your answer, matching the font size to the printed text. For tick boxes, either type an "X" or use the Draw tool.',
            'If a page is rotated, straighten it first with Rotate PDF so text lands where you expect. For a very long document, split out the pages you need with Split PDF, edit those, and merge everything back together.',
          ],
        },
      ],
      example: {
        inputs: [
          { label: 'Input', value: 'agreement.pdf — 3 pages, a signature line on page 3' },
          { label: 'Edits', value: 'Signature + typed date on page 3, one highlight on page 1' },
        ],
        result: [{ label: 'Output', value: 'edited.pdf — same 3 pages with the marks stamped in' }],
        walkthrough:
          'The signature image is embedded on page 3 at the position and size you placed it, the date is drawn as text next to it, and the page-1 highlight becomes a semi-transparent yellow rectangle. Page count and existing content are unchanged.',
      },
    },
    faq: [
      {
        q: 'Can I edit the existing text in the PDF?',
        a: 'Yes, with the Edit text tool: click a line and it is covered with a page-matched patch and reopened as a text box holding the same words, size and font, ready to change. It is a cover-and-retype flow, not true glyph editing — check the size and font after editing, and expect small position shifts on complex layouts.',
      },
      {
        q: 'Is my file or signature uploaded anywhere?',
        a: 'No. The PDF is opened in your browser, all editing happens on your device, and the finished file is generated locally. Your document and any signature you draw never leave your computer.',
      },
      {
        q: 'Will my edits show up in Adobe Acrobat and other readers?',
        a: 'Yes. When you save, the edits are written into the page content itself, so they appear and print identically in every PDF reader.',
      },
      {
        q: 'Can I use a rupee sign or Hindi text?',
        a: 'Text uses the standard built-in PDF fonts, which cover Latin characters. The rupee sign is converted to “Rs.” automatically; other non-Latin characters are not supported yet and are shown as “?”.',
      },
      {
        q: 'How do I move or delete something after adding it?',
        a: 'Switch to the Select tool, then click the item to pick it up — drag to move, use the corner dot to resize, or press Delete in the toolbar. Undo removes the last edit; Clear removes them all.',
      },
      {
        q: 'Does whiteout permanently remove the text underneath?',
        a: 'It covers it visually and prints as a solid block, which is fine for tidying up a document. It is not secure redaction — the original text can still be extracted from the file, so do not rely on it for confidential information.',
      },
      {
        q: 'Is there a page limit?',
        a: 'You can edit the first 60 pages of a document in one session. For a longer PDF, extract the pages you need with Split PDF, edit them here, and recombine with Merge PDF.',
      },
      {
        q: 'Can I add the same signature to several pages?',
        a: 'Add it once, then insert it again for each page — each placement is independent, so you can position and size them separately.',
      },
    ],
    relatedTools: ['organize-pdf', 'rotate-pdf', 'protect-pdf', 'merge-pdf'],
  },
  {
    ...base,
    id: 'document-scanner',
    name: 'Document Scanner',
    slug: 'document-scanner',
    path: '/pdf/document-scanner',
    icon: 'scan-line',
    featured: true,
    popular: false,
    sortOrder: 11,
    updatedAt: UPDATED,
    shortDescription: 'Scan paper to a clean, straightened PDF with your phone camera — no app.',
    description:
      'Turn your phone into a document scanner. Point the camera at a page, the edges are found automatically, and the photo is straightened, cropped and cleaned into a crisp scan. Add more pages, then export one PDF — all processed on your device, nothing uploaded.',
    keywords: [
      'document scanner',
      'scan document to pdf',
      'scan with phone',
      'photo to pdf scanner',
      'free scanner online',
      'scan pdf no app',
      'camera scanner',
      'scan multiple pages to pdf',
    ],
    seoTitle: 'Document Scanner — Scan to PDF with Your Phone, Free',
    seoDescription:
      'Free online document scanner. Use your phone camera with automatic edge detection to scan pages to a clean, deskewed multi-page PDF. B&W and colour modes, manual corner adjust, 100% in your browser — no app, no upload, no sign-up.',
    content: {
      howItWorks: [
        {
          title: 'Open the camera or upload a photo',
          body: 'On a phone, tap Open camera for a live preview with automatic edge detection. On a desktop, or in an app that blocks the camera, upload photos of your pages instead.',
        },
        {
          title: 'Capture each page',
          body: 'Fill the frame with the page — the outline turns green when it locks on, and it can capture automatically once the shot is steady. Adjust the four corner dots if the detection is slightly off, then rotate if needed.',
        },
        {
          title: 'Choose a look and export',
          body: 'Set a filter per page — Auto, Magic Colour, Colour, Greyscale, Grey Text, B&W or Original — with a live before/after preview. Reorder or delete pages, then download a single PDF (or a ZIP of images).',
        },
      ],
      features: [
        'Automatic page-edge detection with a live camera outline',
        'Drag the four corners to correct the crop by hand any time',
        'Perspective de-warp straightens a photo taken at an angle',
        'Seven cleanup filters chosen per page (Auto, Magic Colour, Colour, Greyscale, Grey Text, B&W, Original) with a live preview, plus 90° rotate',
        'Multi-page: capture, reorder and delete pages, export one PDF',
        'Full-resolution capture where the browser allows it; upload path for everything else',
        'Runs entirely in your browser — camera frames and scans never leave your device',
      ],
      sections: [
        {
          heading: 'How the scan is built',
          paragraphs: [
            'A phone photo of a document is never quite square: you are holding the camera at an angle, so the page looks like a trapezoid, and the lighting is uneven. The scanner fixes both. First it finds the page boundary — in the live preview this runs several times a second so you can see the outline track the page. Then, on capture, it maps the four detected corners onto a true rectangle (a perspective transform), which pulls the page flat as if it had been laid on a copier.',
            'After straightening, a cleanup filter evens out the lighting and lifts the contrast. B&W goes further, using an adaptive threshold so text becomes solid black on clean white — the smallest files and the most readable result for printed or handwritten pages. Each page carries its own filter with a live before/after preview, so a batch that mixes a printed letter, a colour ID card and a hand-drawn diagram can each get the right treatment in one PDF.',
          ],
        },
        {
          heading: 'When auto-detection struggles',
          paragraphs: [
            'Edge detection needs contrast between the page and what is behind it. A white page on a white desk, heavy glare, a busy background or a page that runs off the edge of the frame can all throw it off. Two things help: put the page on a darker, plain surface and get the whole page in shot.',
            'If the outline is still wrong, it is not a dead end — every capture opens with four draggable corner dots. Drag them to the actual corners of the page and the de-warp uses those instead. You can also come back to any page in the tray later and re-adjust it.',
          ],
        },
        {
          heading: 'Camera access and privacy',
          paragraphs: [
            'The live preview uses your browser’s camera, which needs your permission and a secure (https) connection. If you decline, or your browser or in-app viewer blocks it, the Upload / take a photo button still works — on a phone it opens the normal camera app and hands the photo straight back.',
            'Either way, the image is processed on your device. No frame, photo or finished scan is ever sent to a server, and nothing is stored once you leave the page.',
          ],
        },
      ],
      example: {
        inputs: [
          { label: 'Input', value: 'Three A4 pages photographed on a desk, slightly skewed' },
          { label: 'Settings', value: 'Auto-capture on, B&W mode' },
        ],
        result: [{ label: 'Output', value: 'scan.pdf — 3 straightened, high-contrast pages' }],
        walkthrough:
          'Each page is detected, captured when steady, de-warped to a rectangle and thresholded to black-on-white. The three pages are combined into one PDF sized to the page aspect ratio.',
      },
    },
    faq: [
      {
        q: 'Do I need to install an app?',
        a: 'No. It runs in your mobile or desktop browser. There is nothing to download and no account to create.',
      },
      {
        q: 'Are my documents uploaded anywhere?',
        a: 'No. The camera feed and every captured page are processed on your device using your browser. No image is transmitted to a server or stored after you close the page.',
      },
      {
        q: 'The camera will not turn on — what now?',
        a: 'Camera access needs your permission and an https connection, and some in-app browsers (inside social apps) block it entirely. Use the Upload / take a photo button instead — on a phone it opens your normal camera app.',
      },
      {
        q: 'The auto-detected border is wrong.',
        a: 'Drag the four corner dots to the real corners of the page before adding it. Detection works best with the whole page in frame on a plain, contrasting surface. You can re-adjust any page later from the tray.',
      },
      {
        q: 'Which filter should I use?',
        a: 'B&W for printed or handwritten text — most readable, smallest file. Grey Text is a softer version that keeps anti-aliased edges. Greyscale keeps shading like pencil. Colour or Auto for natural colour (ID cards, photos). Magic Colour flattens the background to white and boosts colour — good for whiteboards, sticky notes and printed diagrams. Each page has its own filter, so a mixed batch is fine.',
      },
      {
        q: 'Can I scan more than one page into a single PDF?',
        a: 'Yes. Capture or upload as many pages as you need, reorder or delete them in the tray, then export one multi-page PDF.',
      },
      {
        q: 'How good is the resolution?',
        a: 'Uploaded photos and, on Android Chrome, live captures use the full camera resolution. On iPhone the live capture is limited by the browser to around 1080p, which is fine for text; use the upload button if you need maximum detail.',
      },
      {
        q: 'Does it do OCR / make the text selectable?',
        a: 'Not yet — the output is an image-based PDF. Run it through a separate OCR step if you need selectable text.',
      },
    ],
    relatedTools: ['image-to-pdf', 'compress-pdf', 'edit-pdf', 'pdf-to-jpg'],
  },
  {
    ...base,
    id: 'crop-pdf',
    name: 'Crop PDF',
    slug: 'crop-pdf',
    path: '/pdf/crop-pdf',
    icon: 'crop',
    featured: false,
    popular: false,
    sortOrder: 12,
    updatedAt: UPDATED,
    shortDescription: 'Trim margins or cut a PDF page down to a chosen area, visually.',
    description:
      'Drag a crop box over a PDF page — the same margin on every page, or a different area on each — and download the trimmed file. Text stays selectable and vector quality is untouched; nothing is uploaded.',
    keywords: [
      'crop pdf',
      'trim pdf margins',
      'cut pdf page',
      'remove pdf white space',
      'resize pdf page area',
      'crop pdf online free',
    ],
    seoTitle: 'Crop PDF — Trim Page Margins Online Free',
    seoDescription:
      'Free online PDF cropper. Drag a crop box to trim margins or cut a page down to a chosen area — the same crop on every page or a different one per page. Text stays selectable, no upload, no sign-up.',
    content: {
      howItWorks: [
        {
          title: 'Upload a PDF',
          body: 'Every page renders as a preview so you can see exactly what you are cropping.',
        },
        {
          title: 'Drag the crop box',
          body: 'Resize it from the corners or move it, use a margin preset, or type exact percentages for each side. Choose whether the same crop applies to every page or each page gets its own.',
        },
        {
          title: 'Crop and download',
          body: 'The cropped PDF downloads immediately — the same size or smaller, with everything outside the box trimmed from view and from print.',
        },
      ],
      features: [
        'Visual drag-to-crop with corner handles and a live preview',
        'Exact numeric margins (top, bottom, left, right, in %)',
        'One-click presets: margin removal, top/bottom/left/right half',
        'Same crop for every page, or a different crop per page',
        'Text stays selectable — this changes the visible area, not the content',
        'Runs entirely in your browser',
      ],
      sections: [
        {
          heading: 'What cropping a PDF actually changes',
          paragraphs: [
            'Cropping does not delete anything from the page or shrink the file by re-drawing it — it sets the page\'s crop box, the same mechanism Adobe Acrobat\'s crop tool uses. Every PDF viewer and printer then shows and prints only what is inside that box. Text stays selectable, images keep their original resolution, and the change is instant because nothing is re-rendered.',
            'This is different from cropping a photo, where pixels outside the frame are gone for good. Here, the original content is still in the file — a PDF editor that resets the crop box (or exports the raw MediaBox) can reveal it again. For that reason this tool is not a way to redact or permanently remove something from a page; use whiteout or a proper redaction tool for that instead.',
          ],
        },
        {
          heading: 'Common reasons to crop',
          paragraphs: [
            'Scanned documents often carry wide, uneven margins, or a strip of the scanner bed along one edge — cropping tightens the page so it prints or displays without wasted white space. Slide decks exported to PDF sometimes need only the content area, not the surrounding canvas. And a page that mixes a full-size diagram with a footer you do not need can be cut down to just the useful region.',
            'If a scanned batch has consistent margins across every page, use "same crop for every page" and set it once. If pages differ — a mix of portrait letters and a landscape table, say — switch to "each page individually" and adjust the ones that need it.',
          ],
        },
      ],
      example: {
        inputs: [
          { label: 'Input', value: 'scan.pdf — 4 pages, a 12% margin of scanner bed on every edge' },
          { label: 'Action', value: '"Same for every page", 10% margin preset' },
        ],
        result: [{ label: 'Output', value: 'cropped.pdf — 4 pages, same content, tighter margins' }],
        walkthrough:
          'Each page\'s crop box is set to the inner 80% of the page (10% trimmed from every edge), accounting for that page\'s own rotation. The document opens and prints showing only the cropped area.',
      },
    },
    faq: [
      {
        q: 'Does cropping reduce the file size?',
        a: 'Usually only slightly. Cropping changes what is visible, not the underlying content, so the file size is roughly unchanged. To also shrink the file size, run the result through Compress PDF afterwards.',
      },
      {
        q: 'Is the cropped-out content permanently deleted?',
        a: 'No — cropping sets the page\'s crop box rather than deleting content, which is exactly what desktop PDF editors do too. It is not a redaction tool; do not rely on it to permanently remove sensitive information.',
      },
      {
        q: 'Can I crop each page differently?',
        a: 'Yes — switch to "each page individually", select a page in the strip below the preview, and adjust its crop box. Pages you have not touched keep the full page until you set one.',
      },
      {
        q: 'Will the cropped PDF still have selectable text?',
        a: 'Yes. Cropping only changes the visible area — text, links and form fields inside that area work exactly as before.',
      },
      {
        q: 'What happens to a rotated page?',
        a: 'The crop box is set correctly relative to how the page actually displays, not its raw orientation, so a sideways-scanned page crops where you see it, not where the file stores it.',
      },
      {
        q: 'Is my file uploaded anywhere?',
        a: 'No. Every page renders and crops entirely in your browser; the PDF never leaves your device.',
      },
    ],
    relatedTools: ['organize-pdf', 'rotate-pdf', 'compress-pdf', 'split-pdf'],
  },
];
