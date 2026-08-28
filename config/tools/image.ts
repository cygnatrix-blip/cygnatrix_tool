import type { ToolConfig } from '@/types/tool';

const UPDATED = '2026-08-27';

const base = {
  category: 'image' as const,
  active: true,
  updatedAt: UPDATED,
};

export const IMAGE_TOOLS: ToolConfig[] = [
  {
    ...base,
    id: 'compress-image',
    name: 'Image Compressor',
    slug: 'compress-image',
    path: '/image/compress-image',
    icon: 'file-image',
    toolType: 'file',
    featured: true,
    popular: true,
    sortOrder: 1,
    shortDescription: 'Reduce image file size while keeping the quality you want.',
    description:
      'Compress JPG, PNG and WebP images in your browser. Set a quality level or a target size, preview the result and see exactly how much smaller the file became.',
    keywords: ['compress image', 'image compressor', 'reduce image size', 'optimise image', 'shrink photo', 'compress jpg'],
    seoTitle: 'Image Compressor — Reduce JPG, PNG & WebP Size Online Free',
    seoDescription:
      'Free online image compressor. Shrink JPG, PNG and WebP files in your browser with a quality slider or target size, live preview and before/after comparison. No upload.',
    content: {
      howItWorks: [
        { title: 'Add your images', body: 'Drop in one or many JPG, PNG or WebP files.' },
        { title: 'Set the quality', body: 'Move the quality slider or enter a target file size. A live preview shows the effect.' },
        { title: 'Download', body: 'Save each compressed image, or all of them at once.' },
      ],
      features: [
        'JPG, JPEG, PNG and WebP supported',
        'Quality slider and target-size mode',
        'Live before/after preview',
        'File-size and percentage-saved readout',
        'Batch compression',
        'Runs in a Web Worker — your images never upload',
      ],
      sections: [
        {
          heading: 'How much can you save?',
          paragraphs: [
            'A photo straight from a phone camera is often 3–6 MB. Compressed to quality 80 it typically drops to 300–800 KB with no visible difference — a 85–90% reduction.',
            'PNG screenshots and graphics compress less because PNG is already lossless. For big savings on those, convert to WebP with our converter instead.',
          ],
        },
      ],
      example: {
        inputs: [
          { label: 'Input', value: 'IMG_2043.jpg — 4.8 MB, 4032×3024' },
          { label: 'Quality', value: '80' },
        ],
        result: [
          { label: 'Output', value: '612 KB' },
          { label: 'Saved', value: '87%' },
        ],
        walkthrough:
          'The image is decoded, drawn to a canvas and re-encoded as JPEG at quality 80. Fine detail your eye ignores is discarded, cutting the file to a fraction of the original while dimensions stay the same.',
      },
    },
    faq: [
      { q: 'Does compressing reduce the image dimensions?', a: 'No. Only the file size changes. Use the Image Resizer if you also want fewer pixels — combining both gives the smallest files.' },
      { q: 'Is compression lossless?', a: 'For JPG and WebP it is lossy — you trade a little detail for a much smaller file, and you control how much. For PNG the tool applies lossless optimisation only.' },
      { q: 'Can I compress many images at once?', a: 'Yes, up to 30 files per batch. Each is processed independently and you can download them together.' },
      { q: 'Do you keep my photos?', a: 'No. Compression happens entirely in your browser using a background Web Worker. Nothing is uploaded or stored.' },
    ],
    relatedTools: ['resize-image', 'webp-converter', 'jpg-to-png', 'png-to-jpg'],
  },
  {
    ...base,
    id: 'resize-image',
    name: 'Image Resizer',
    slug: 'resize-image',
    path: '/image/resize-image',
    icon: 'move',
    toolType: 'file',
    featured: true,
    popular: false,
    sortOrder: 2,
    shortDescription: 'Resize images to exact pixels or by percentage.',
    description:
      'Change an image’s dimensions by width, height or percentage, with the option to lock the aspect ratio. Preview before you download.',
    keywords: ['resize image', 'image resizer', 'change image dimensions', 'scale image', 'resize photo', 'resize png'],
    seoTitle: 'Image Resizer — Resize Images by Pixels or Percent Online Free',
    seoDescription:
      'Free online image resizer. Set an exact width and height or scale by percentage, keep or unlock the aspect ratio, preview the result and download. Browser-based, no upload.',
    content: {
      howItWorks: [
        { title: 'Upload an image', body: 'Its current dimensions are shown.' },
        { title: 'Enter the new size', body: 'Type a width, a height, or a percentage. Keep “lock aspect ratio” on to avoid stretching.' },
        { title: 'Preview and download', body: 'Check the preview, then save the resized image.' },
      ],
      features: [
        'Resize by width, height or percentage',
        'Lock or unlock the aspect ratio',
        'Live preview at the new size',
        'Keeps the original format (JPG, PNG, WebP)',
        'High-quality canvas scaling',
        'Entirely in-browser',
      ],
      sections: [
        {
          heading: 'Enlarging vs shrinking',
          paragraphs: [
            'Shrinking an image is safe — the browser averages pixels together and the result stays sharp.',
            'Enlarging beyond the original size cannot invent detail that was never captured, so a small image scaled up will look soft. For print, start from the highest-resolution original you have.',
          ],
        },
      ],
      example: {
        inputs: [
          { label: 'Input', value: 'banner.png — 3000×1200' },
          { label: 'New width', value: '1200 (aspect locked)' },
        ],
        result: [{ label: 'Output', value: 'banner.png — 1200×480' }],
        walkthrough:
          'With the aspect ratio locked, setting width to 1200 sets height to 480 automatically. The image is redrawn at the new size on a canvas and exported in its original format.',
      },
    },
    faq: [
      { q: 'Will resizing distort my image?', a: 'Not if you keep “lock aspect ratio” enabled. Unlock it only when you deliberately want to stretch or squash the image to specific dimensions.' },
      { q: 'What is the best size for web images?', a: 'Match the display size. A full-width hero is usually 1600–2000px wide; a blog image 800–1200px; a thumbnail 300–400px. Resize down to what you actually need, then compress.' },
      { q: 'Does it change the file format?', a: 'No, the output keeps the input format. To change format as well, use one of our converters afterwards.' },
      { q: 'Is my image uploaded?', a: 'No. Resizing uses the browser’s canvas and never sends your file anywhere.' },
    ],
    relatedTools: ['compress-image', 'webp-converter', 'png-to-jpg', 'jpg-to-png'],
  },
  {
    ...base,
    id: 'jpg-to-png',
    name: 'JPG to PNG',
    slug: 'jpg-to-png',
    path: '/image/jpg-to-png',
    icon: 'file-image',
    toolType: 'converter',
    featured: false,
    popular: true,
    sortOrder: 3,
    shortDescription: 'Convert JPG photos to lossless PNG images.',
    description:
      'Convert one or many JPG images to PNG. PNG is lossless, so the converted file will not degrade on further editing or re-saving.',
    keywords: ['jpg to png', 'jpeg to png', 'convert jpg to png', 'change jpg to png', 'jpg png converter'],
    seoTitle: 'JPG to PNG — Convert JPEG to PNG Online Free',
    seoDescription:
      'Free online JPG to PNG converter. Turn JPEG photos into lossless PNG images in your browser, one at a time or in a batch. No upload, no quality loss, no sign-up.',
    content: {
      howItWorks: [
        { title: 'Add JPG files', body: 'Select one or more .jpg or .jpeg images.' },
        { title: 'Convert', body: 'Each image is decoded and re-encoded as PNG in your browser.' },
        { title: 'Download', body: 'Save the PNGs individually or as a ZIP.' },
      ],
      features: [
        'Lossless PNG output',
        'Batch conversion',
        'Original dimensions preserved',
        'No quality loss on the conversion step',
        'Fully browser-based',
      ],
      sections: [
        {
          heading: 'When converting JPG to PNG makes sense',
          paragraphs: [
            'Convert to PNG when you need to edit an image repeatedly without accumulating JPG compression artefacts, when a tool or platform specifically requires PNG, or when you are about to add transparency in an editor.',
            'Note that the JPG has already discarded some detail — converting to PNG locks in the current quality but cannot restore what the JPG compression removed. The PNG will also usually be larger.',
          ],
        },
      ],
      example: {
        inputs: [{ label: 'Input', value: 'photo.jpg — 2.1 MB, 3000×2000' }],
        result: [{ label: 'Output', value: 'photo.png — ~8 MB, 3000×2000, lossless' }],
        walkthrough:
          'The JPG is drawn to a canvas at full resolution and exported with toBlob("image/png"). Every pixel currently in the JPG is preserved exactly in the PNG.',
      },
    },
    faq: [
      { q: 'Will the PNG look better than the JPG?', a: 'No — it will look identical. PNG preserves exactly what is in the JPG; it does not undo compression that already happened. The benefit is no further loss from here on.' },
      { q: 'Why is the PNG so much bigger?', a: 'PNG is lossless, so it stores full colour information for every pixel. Photos, which have millions of subtly different colours, do not compress well as PNG.' },
      { q: 'Can I convert many JPGs at once?', a: 'Yes, up to 30 per batch, with a ZIP download.' },
      { q: 'Are my images uploaded?', a: 'No. Conversion is done entirely by your browser.' },
    ],
    relatedTools: ['png-to-jpg', 'webp-converter', 'compress-image', 'resize-image'],
  },
  {
    ...base,
    id: 'png-to-jpg',
    name: 'PNG to JPG',
    slug: 'png-to-jpg',
    path: '/image/png-to-jpg',
    icon: 'file-image',
    toolType: 'converter',
    featured: false,
    popular: true,
    sortOrder: 4,
    shortDescription: 'Convert PNG images to smaller JPG files, with background control.',
    description:
      'Convert PNG images to JPG to cut file size dramatically. Choose the background colour that replaces transparency, and set the JPG quality.',
    keywords: ['png to jpg', 'png to jpeg', 'convert png to jpg', 'png jpg converter', 'remove png transparency'],
    seoTitle: 'PNG to JPG — Convert PNG to JPEG Online Free',
    seoDescription:
      'Free online PNG to JPG converter. Turn PNG images into smaller JPEG files in your browser, choose the background colour for transparent areas and set the quality. No upload.',
    content: {
      howItWorks: [
        { title: 'Add PNG files', body: 'Select one or more .png images.' },
        { title: 'Set background and quality', body: 'Pick the colour that fills transparent areas (white by default) and choose a JPG quality level.' },
        { title: 'Download', body: 'Save the JPGs individually or as a ZIP.' },
      ],
      features: [
        'Large file-size reduction',
        'Configurable background colour for transparency',
        'JPG quality control',
        'Batch conversion',
        'Browser-based and private',
      ],
      sections: [
        {
          heading: 'Handling transparency',
          paragraphs: [
            'JPG has no transparency channel. When a transparent PNG becomes a JPG, every see-through pixel has to be given a solid colour. This tool fills them with a background colour you choose — white works for most documents, but you can match a page or brand colour.',
            'If preserving transparency matters, convert to WebP instead — it keeps the alpha channel and is still much smaller than PNG.',
          ],
        },
      ],
      example: {
        inputs: [
          { label: 'Input', value: 'logo.png — 1.4 MB, transparent background' },
          { label: 'Background', value: 'White' },
          { label: 'Quality', value: '90' },
        ],
        result: [{ label: 'Output', value: 'logo.jpg — ~120 KB, white background' }],
        walkthrough:
          'The canvas is filled with white, the PNG is drawn on top so transparent areas show white, and the result is exported as JPEG at quality 90 — roughly a tenth of the PNG size.',
      },
    },
    faq: [
      { q: 'My transparent logo now has a white box around it. Why?', a: 'That is expected — JPG cannot be transparent, so transparency was replaced with the background colour you selected. Use WebP if you need to keep transparency.' },
      { q: 'How much smaller will the JPG be?', a: 'For photos and detailed graphics, typically 70–95% smaller. For simple flat-colour logos the saving is smaller and WebP or PNG-8 may be better.' },
      { q: 'Can I choose a background other than white?', a: 'Yes. Pick any colour with the background control before converting.' },
      { q: 'Is my file uploaded?', a: 'No. The conversion runs in your browser.' },
    ],
    relatedTools: ['jpg-to-png', 'webp-converter', 'compress-image', 'resize-image'],
  },
  {
    ...base,
    id: 'webp-converter',
    name: 'WebP Converter',
    slug: 'webp-converter',
    path: '/image/webp-converter',
    icon: 'repeat',
    toolType: 'converter',
    featured: true,
    popular: false,
    sortOrder: 5,
    shortDescription: 'Convert JPG and PNG images to modern WebP (and back).',
    description:
      'Convert JPG or PNG images to WebP for 25–35% smaller files at the same quality, with transparency preserved. Convert WebP back to JPG or PNG too.',
    keywords: ['webp converter', 'convert to webp', 'jpg to webp', 'png to webp', 'webp to jpg', 'webp to png'],
    seoTitle: 'WebP Converter — Convert JPG & PNG to WebP Online Free',
    seoDescription:
      'Free online WebP converter. Convert JPG and PNG to WebP for smaller files with transparency support, or convert WebP back to JPG or PNG. Browser-based, batch, no upload.',
    content: {
      howItWorks: [
        { title: 'Add images', body: 'Select JPG, PNG or WebP files.' },
        { title: 'Choose the target format', body: 'Convert to WebP, or from WebP to JPG or PNG. Set quality for lossy targets.' },
        { title: 'Download', body: 'Save the converted files individually or as a ZIP.' },
      ],
      features: [
        'JPG → WebP and PNG → WebP',
        'WebP → JPG and WebP → PNG',
        'Transparency preserved when converting PNG ↔ WebP',
        'Quality control for lossy output',
        'Batch conversion',
        'Extensible to more format pairs',
      ],
      sections: [
        {
          heading: 'Why WebP',
          paragraphs: [
            'WebP was designed by Google specifically for the web. At a visually equivalent quality it is usually 25–35% smaller than JPG and far smaller than PNG, and it supports transparency and animation.',
            'Every current browser supports WebP, so it is a safe default for any website where you control the image tags. Keep a JPG or PNG fallback only if you must support very old software.',
          ],
        },
      ],
      example: {
        inputs: [
          { label: 'Input', value: 'hero.jpg — 480 KB, 1920×1080' },
          { label: 'Target', value: 'WebP, quality 82' },
        ],
        result: [{ label: 'Output', value: 'hero.webp — ~300 KB' }],
        walkthrough:
          'The JPG is decoded to a canvas and re-encoded with toBlob("image/webp", 0.82). The WebP encoder packs the same visual quality into about 60% of the bytes.',
      },
    },
    faq: [
      { q: 'Do all browsers support WebP?', a: 'Yes. Chrome, Edge, Firefox, Safari and their mobile versions have supported WebP for years. Only very old browsers do not.' },
      { q: 'Is WebP lossy or lossless?', a: 'It can be either. Converting from JPG uses lossy WebP with a quality setting. Converting from PNG can use lossless WebP to keep every pixel and the transparency.' },
      { q: 'Can I convert WebP back to JPG or PNG?', a: 'Yes. Choose JPG or PNG as the target format. Going WebP → JPG drops transparency; WebP → PNG keeps it.' },
      { q: 'Will more format combinations be added?', a: 'The converter is built around a from/to model, so new pairs (such as AVIF) can be added without redesigning the tool.' },
    ],
    relatedTools: ['compress-image', 'jpg-to-png', 'png-to-jpg', 'resize-image'],
  },
];
