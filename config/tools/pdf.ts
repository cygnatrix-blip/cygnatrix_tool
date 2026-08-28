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
    ],
    relatedTools: ['pdf-to-word', 'compress-pdf', 'split-pdf', 'jpg-to-png'],
  },
];
