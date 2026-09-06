import type { ToolConfig } from '@/types/tool';

const UPDATED = '2026-09-05';

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
        {
          heading: 'Quality slider vs an exact target size',
          paragraphs: [
            'The quality slider is the right tool when you just want "smaller, without looking worse" and don\'t care about the exact final number of kilobytes — move it until the preview still looks good, then download.',
            'If a form or portal instead demands a precise size range (a maximum, or a maximum and minimum together), switch to target-size mode, or use our dedicated Compress Image to Exact Size tool, which automates the trial and error of hitting that number exactly.',
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
      { q: 'Can I compress many images at once?', a: 'Yes, up to 100 files per batch. Each is processed independently and you can download them together.' },
      { q: 'Do you keep my photos?', a: 'No. Compression happens entirely in your browser using a background Web Worker. Nothing is uploaded or stored.' },
      { q: 'Why does the same quality number give different file sizes for different photos?', a: 'A busy, detailed photo (foliage, crowds, textures) needs more data to describe than a simple one (a plain background, a logo), so the same quality setting produces a larger file for the busier image. This is normal.' },
      { q: 'Can I compare quality settings before committing?', a: 'Yes — the live preview updates as you move the slider, so you can check the visual trade-off before downloading anything.' },
      { q: 'What image formats can I upload?', a: 'JPG, JPEG, PNG and WebP are all accepted as input, and the tool keeps the same format on output unless you choose target-size mode with a different output format.' },
      { q: 'Is there a file size limit?', a: 'Very large source files (well over 50 MB) may be slow to process on an older phone, but there is no artificial cap — the practical limit is your device\'s own memory.' },
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
        {
          heading: 'Pixels, percentage or exact dimensions — which to use',
          paragraphs: [
            'Use exact pixel dimensions when a form or platform states a specific requirement, like a 1200×630 social share image or a 300×400 ID photo — type the numbers directly and let aspect lock handle the other one.',
            'Use percentage scaling when you just want a proportionally smaller (or larger) version of what you already have, without needing to calculate the exact resulting pixel count yourself — 50% halves both dimensions in one step.',
          ],
          bullets: [
            'Exact pixels: matching a stated requirement.',
            'Percentage: quick proportional scaling.',
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
      { q: 'Can I resize many images to the same dimensions at once?', a: 'Yes — add all your files, set the size once, and every image resizes to those dimensions (or that percentage) in one batch, downloadable together as a ZIP.' },
      { q: 'Does resizing reduce file size too?', a: 'Usually yes, since fewer pixels means less data to encode — but resizing and compressing are separate controls. For the smallest possible file, resize down to what you need and then run it through our Image Compressor.' },
      { q: 'Can I resize an image and change its format at the same time?', a: 'Not in a single step here — resize first, then run the result through the relevant converter (JPG to PNG, PNG to JPG or WebP Converter) for the format change.' },
      { q: 'Why does my resized image look slightly different in colour?', a: 'It shouldn\'t — resizing uses the browser\'s own canvas scaling, which preserves colour data faithfully. If a difference is visible, check whether your image viewer is applying its own colour profile handling differently between the two files.' },
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
        {
          heading: 'PNG vs WebP for lossless needs',
          paragraphs: [
            'PNG is the safest choice when a specific tool, printer or older platform explicitly requires it — support for PNG is close to universal, going back decades. If compatibility isn\'t the concern and you just want a smaller lossless file, WebP\'s lossless mode typically beats PNG on file size for the same image while still avoiding any further quality loss.',
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
      { q: 'Can I convert many JPGs at once?', a: 'Yes, up to 100 per batch, with a ZIP download.' },
      { q: 'Are my images uploaded?', a: 'No. Conversion is done entirely by your browser.' },
      { q: 'Does converting to PNG add transparency to my photo?', a: 'No — a JPG has no transparency to begin with, so the resulting PNG is fully opaque, just like the source. PNG only preserves transparency that already exists.' },
      { q: 'Will the converted PNG open in every image editor?', a: 'Yes. PNG is one of the most widely supported image formats, opening in every mainstream editor, browser and operating system without exception.' },
      { q: 'Does this tool add compression artefacts of its own?', a: 'No — PNG output is always lossless here, so no additional artefacts are introduced during the conversion step itself.' },
      { q: 'Can I convert a JPG that already has a transparent-looking edge?', a: 'A JPG can never actually contain transparency, so what looks like a transparent edge is really a matched background colour — the PNG will preserve that same solid colour, not real transparency.' },
      { q: 'Does this tool resize my image during conversion?', a: 'No — the output PNG keeps the exact same pixel dimensions as the input JPG. Use the Image Resizer separately if you also want to change the size.' },
      { q: 'Can I convert many JPGs to PNG with different settings each?', a: 'The conversion itself has no per-file settings to vary — every file in a batch is converted the same way, from JPG to lossless PNG.' },
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
        {
          heading: 'When PNG to JPG is the right move',
          paragraphs: [
            'Screenshots, scanned documents and photos saved as PNG are the classic case — PNG stores every pixel losslessly, which is great for sharp lines and text but wasteful for photographic detail with millions of subtly different colours. Converting those to JPG typically shrinks the file dramatically with no visible loss at a sensible quality setting.',
            'Keep the source as PNG (or convert to WebP instead) if the image has fine text you plan to zoom into closely, or transparency you still need after conversion — both are things a JPG cannot represent.',
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
      { q: 'Can I batch-convert PNGs with different backgrounds needed?', a: 'The background colour applies to the whole batch in one pass. For different colours per image, run the tool again with each colour on the relevant files.' },
      { q: 'What quality setting should I use by default?', a: '85–92 is a good starting point for most photos — high enough that quality loss is essentially invisible, while still meaningfully smaller than the PNG original.' },
      { q: 'What happens to a PNG that has no transparency at all?', a: 'It converts the same way — the background colour setting simply has nothing to fill, since there are no transparent pixels to replace.' },
      { q: 'Does this tool change the image dimensions?', a: 'No — only the format, background handling and compression change. Pixel dimensions stay exactly as they were in the source PNG.' },
      { q: 'Can I preview the result before downloading?', a: 'Yes — a preview of the converted JPG, including the chosen background colour where it applies, is shown before you commit to downloading.' },
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
        {
          heading: 'When to convert away from WebP',
          paragraphs: [
            'Some platforms and older editing software still don\'t accept WebP uploads directly — a print shop, an older design tool, or a form that explicitly asks for JPG or PNG. Converting WebP back to one of those formats here takes a few seconds and avoids re-exporting from the original source.',
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
      { q: 'Does converting to WebP always shrink the file?', a: 'Almost always for photos at an equivalent quality. Very simple images (flat icons, tiny graphics) occasionally see little difference, since there is little redundancy left for any format to compress further.' },
      { q: 'Can I batch-convert a mix of JPG and PNG files at once?', a: 'Yes — add files of different formats together and each one converts to your chosen target, regardless of what it started as.' },
      { q: 'Does WebP support animation like GIF?', a: 'The WebP format itself does, but this converter handles still images only — animated WebP or GIF conversion is not currently supported.' },
      { q: 'Is there a quality setting for lossless WebP conversion?', a: 'Lossless mode has no quality slider by definition — it keeps every pixel exactly, so there is nothing to trade off. The quality control only applies to lossy JPG-to-WebP and WebP-to-JPG conversions.' },
      { q: 'Is my file kept anywhere after converting?', a: 'No — nothing is uploaded, stored or logged. The conversion happens entirely in your browser and the file exists only on your own device.' },
      { q: 'Does converting a photo to WebP and back to JPG lose extra quality?', a: 'Yes, a little — each lossy re-encode discards a small amount of additional detail, the same as re-saving any JPG repeatedly. Keep an original copy if you might need to go back and forth.' },
    ],
    relatedTools: ['compress-image', 'jpg-to-png', 'png-to-jpg', 'resize-image'],
  },
  {
    ...base,
    id: 'heic-to-jpg',
    name: 'HEIC to JPG',
    slug: 'heic-to-jpg',
    path: '/image/heic-to-jpg',
    icon: 'image',
    toolType: 'converter',
    featured: true,
    popular: false,
    sortOrder: 6,
    updatedAt: '2026-09-05',
    shortDescription: 'Convert iPhone HEIC/HEIF photos to widely-supported JPG.',
    description:
      'Convert HEIC or HEIF photos from an iPhone into JPG images that open everywhere. Batch convert, control quality, and choose whether to keep EXIF metadata.',
    keywords: ['heic to jpg', 'heic to jpeg', 'iphone photo converter', 'heif to jpg', 'convert heic'],
    seoTitle: 'HEIC to JPG — Convert iPhone Photos Online Free',
    seoDescription:
      'Free online HEIC to JPG converter. Convert iPhone HEIC/HEIF photos to JPG in your browser, in batches, with quality control and an EXIF preserve/strip choice. No upload.',
    content: {
      howItWorks: [
        { title: 'Add your HEIC photos', body: 'Select one or many .heic or .heif files, typically from an iPhone.' },
        { title: 'Set quality and EXIF', body: 'Choose the JPG quality and whether to keep the original EXIF metadata.' },
        { title: 'Convert and download', body: 'Save each JPG individually, or all of them together as a ZIP.' },
      ],
      features: [
        'Batch conversion',
        'Adjustable JPG quality',
        'Preserve or strip EXIF metadata',
        'Download individually or as a ZIP',
        'Runs entirely in your browser',
      ],
      sections: [
        {
          heading: 'Why HEIC needs converting',
          paragraphs: [
            'iPhones save photos as HEIC by default because it compresses better than JPG at the same quality. The trade-off is compatibility — many Windows apps, older Android devices and websites either can’t open HEIC at all or handle it poorly.',
            'Converting to JPG trades a little file size for near-universal compatibility, which is usually the right call whenever you are sharing a photo outside Apple’s ecosystem.',
          ],
        },
        {
          heading: 'Common situations where this comes up',
          paragraphs: [
            'The most frequent trigger is emailing or uploading an iPhone photo to a website, form or older Windows program that rejects HEIC outright with an unhelpful "unsupported file type" error — converting first avoids the back-and-forth of figuring out why the upload failed.',
            'It also comes up when sharing photos with someone on Android or an older Windows PC without HEIC support installed; JPG guarantees they can simply open the file without installing anything extra.',
          ],
        },
      ],
      example: {
        inputs: [
          { label: 'Input', value: 'IMG_4821.HEIC — 2.4 MB' },
          { label: 'Quality', value: '85' },
        ],
        result: [{ label: 'Output', value: 'IMG_4821.jpg — ~2.6 MB, opens everywhere' }],
        walkthrough:
          'The HEIC image is decoded in your browser and re-encoded as a JPG at quality 85. File size is similar to the original — the benefit here is compatibility, not compression.',
      },
    },
    faq: [
      { q: 'Will I lose photo quality converting from HEIC?', a: 'At quality 85 and above the difference is generally invisible. HEIC is a more efficient format, so a same-quality JPG is often a little larger, not smaller.' },
      { q: 'What happens to my photo’s date, location and camera info?', a: 'By default nothing is carried over, for privacy. Tick "preserve EXIF" before converting if you want that metadata kept — this is a best-effort feature and may not work for every photo.' },
      { q: 'Can I convert a whole camera roll at once?', a: `Yes, up to ${100} photos per batch. Download them together as a ZIP.` },
      { q: 'Are my photos uploaded anywhere?', a: 'No. Conversion happens entirely in your browser.' },
      { q: 'Can I convert HEIC to a format other than JPG?', a: 'This tool targets JPG specifically since it is the most universally compatible choice. For WebP or PNG, convert the resulting JPG through our WebP Converter or JPG to PNG tool.' },
      { q: 'Does this work for HEIC videos too?', a: 'No — this converts still HEIC/HEIF images only. Live Photos and HEVC video clips are not supported.' },
      { q: 'Why does my HEIC file look rotated after converting?', a: 'This shouldn\'t happen — the converter reads the photo\'s stored orientation and applies it during conversion. If you do see this, try re-exporting the HEIC from your phone and converting again.' },
      { q: 'Does this reduce my photo\'s resolution?', a: 'No — the converted JPG keeps the same pixel dimensions as the original HEIC. Only the file format and, depending on your quality setting, the compression change.' },
      { q: 'My iPhone photo is actually saved as JPG already — do I need this tool?', a: 'No — if your iPhone\'s camera format setting is already "Most Compatible" rather than "High Efficiency", your photos are already JPG and this tool has nothing to convert.' },
    ],
    relatedTools: ['compress-image', 'jpg-to-png', 'webp-converter', 'resize-image'],
  },
  {
    ...base,
    id: 'compress-to-size',
    name: 'Compress Image to Exact Size',
    slug: 'compress-to-size',
    path: '/image/compress-to-size',
    icon: 'file-image',
    toolType: 'file',
    featured: true,
    popular: true,
    sortOrder: 7,
    updatedAt: '2026-09-05',
    shortDescription: 'Hit an exact file size in KB — for forms that demand it.',
    description:
      'Tell it a target size — like 50 KB for a government form — and it finds the right quality automatically. No guessing with a slider, no repeated re-uploads.',
    keywords: ['compress image to 50kb', 'compress image to 100kb', 'reduce image size to kb', 'exact file size compressor', 'image size reducer kb'],
    seoTitle: 'Compress Image to Exact KB — 20KB, 50KB, 100KB & More',
    seoDescription:
      'Free tool to compress a JPG or WebP to an exact target file size — 20 KB, 50 KB, 100 KB, 200 KB, 500 KB, 1 MB or a custom value. Automatic, in your browser, no sign-up.',
    content: {
      howItWorks: [
        { title: 'Add your image', body: 'Drop in one or more photos.' },
        { title: 'Pick a target size', body: 'Choose a quick-pick chip (20 KB–1 MB) or type a custom target, plus an optional minimum.' },
        { title: 'Get an exact match', body: 'The tool searches automatically and tells you exactly what it did — no slider guessing.' },
      ],
      features: [
        'Targets an exact KB size, not a vague quality level',
        'Quick-pick chips: 20KB, 50KB, 100KB, 200KB, 500KB, 1MB',
        'Optional minimum size for forms with a size range',
        'Runs in a Web Worker — the page never freezes, even on large photos',
        'Tells you exactly what changed: dimensions, quality and final size',
        'JPG or WebP output',
      ],
      sections: [
        {
          heading: 'How the search works',
          paragraphs: [
            'Most compressors make you drag a quality slider and check the result yourself, again and again. This tool automates that: it binary-searches the JPEG/WebP quality setting, testing a handful of values until it finds the highest quality that still fits under your target size.',
            'If even the lowest quality is still too big — common with very small targets like 20 KB on a large photo — it also reduces the image dimensions in small steps and searches again, until it fits or it has tried as much as it reasonably can.',
          ],
        },
        {
          heading: 'Why a minimum size matters',
          paragraphs: [
            'Some forms (competitive exam applications are a classic example) reject a file for being too small as well as too large — for instance, "between 20 KB and 50 KB". Set a minimum and the tool will nudge the quality back up if its first result lands below it, without ever going over your maximum.',
          ],
        },
      ],
      example: {
        inputs: [
          { label: 'Input', value: 'photo.jpg — 1024×768, 1.4 MB' },
          { label: 'Target', value: '100 KB' },
        ],
        result: [{ label: 'Output', value: '1024×768 → 800×600, quality 72%, 96 KB' }],
        walkthrough:
          'Quality alone at full size couldn’t reach 100 KB, so the tool reduced the dimensions once and re-searched quality, landing at 96 KB — just under the target — at quality 72%.',
      },
    },
    faq: [
      { q: 'Why not just use a quality slider?', a: 'A slider makes you guess and check repeatedly. This tool does that searching for you and stops exactly when it finds the best quality that still fits your target size.' },
      { q: 'What happens if the target is impossible to hit?', a: 'For an extremely small target on a highly detailed image, even the lowest quality and smallest reasonable size may not fit. The tool tries its best across several downscale steps and clearly marks the result if it couldn’t fully meet your target.' },
      { q: 'Does resizing distort my photo?', a: 'No. When the tool needs to shrink dimensions to hit a target, it always scales proportionally — width and height shrink together.' },
      { q: 'Can I set both a minimum and maximum size?', a: 'Yes — enter a target (the maximum) and an optional minimum. This exactly matches forms that specify a size range like "20 KB to 50 KB".' },
      { q: 'Does this work for a signature scan as well as a photo?', a: 'Yes — the same target-size search works on any JPG or WebP image, signatures included, though a simple signature scan usually reaches a small target with better visual quality than a detailed photo would.' },
      { q: 'How long does the search take?', a: 'Typically well under a second per image for common target sizes, since the whole binary search runs locally in a Web Worker without any network round-trip.' },
      { q: 'Which output format should I choose, JPG or WebP?', a: 'JPG is the safer default since virtually every form and portal accepts it. Choose WebP only if you\'ve confirmed the destination accepts it — it can sometimes reach a target size with slightly better visual quality.' },
    ],
    relatedTools: ['compress-image', 'resize-image', 'webp-converter', 'jpg-to-png'],
  },
  {
    ...base,
    id: 'exam-photo-signature',
    name: 'Exam Photo & Signature Tool',
    slug: 'exam-photo-signature',
    path: '/image/exam-photo-signature',
    icon: 'id-card',
    toolType: 'file',
    featured: true,
    popular: true,
    sortOrder: 8,
    updatedAt: '2026-09-05',
    shortDescription: 'Crop, resize and compress your photo and signature to an exam’s exact spec.',
    description:
      'Pick your exam, upload a photo and a signature, and get back files already matching the required dimensions, file size range and format — no manual cropping or trial-and-error compression.',
    keywords: ['exam photo size', 'signature size for exam', 'photo resizer for exam form', 'ibps photo size', 'ssc photo signature size', 'exam application photo'],
    seoTitle: 'Exam Photo & Signature Resizer — Exact Size for Any Form',
    seoDescription:
      'Free tool to crop, resize and compress your photo and signature to match an exam or form’s exact requirements — dimensions, DPI and file size range. Pass/fail check included, no upload.',
    content: {
      howItWorks: [
        { title: 'Pick your exam', body: 'Search for it or browse by category. Each preset lists its exact photo and signature requirements.' },
        { title: 'Crop your photo and signature', body: 'Drag to position and zoom to fit the required aspect ratio exactly.' },
        { title: 'Get a pass/fail result', body: 'The tool automatically finds the right quality to land inside the required size range and shows you a clear pass or fail against every requirement.' },
      ],
      features: [
        'Searchable exam picker, grouped by category',
        'Crop locked to the exact required aspect ratio',
        'Automatic compression to hit an exact file-size range',
        'Signature background whitening for photographed signatures on paper',
        'Clear pass/fail check against width, height and file size',
        'Download individually or as a ZIP',
      ],
      sections: [
        {
          heading: 'Why exam photo requirements are so specific',
          paragraphs: [
            'Exam portals validate uploads with strict, automated checks — a photo one pixel outside the required dimensions, or a few KB over the size limit, can be rejected outright, sometimes at the worst possible moment near a deadline.',
            'This tool does the fiddly part for you: it crops to the exact aspect ratio, resizes to the exact pixel dimensions, and searches for the JPEG quality that lands your file inside the required size range — then tells you plainly whether it succeeded.',
          ],
        },
        {
          heading: 'About the signature cleanup',
          paragraphs: [
            'A signature photographed or scanned on paper usually picks up an off-white or gray background from the paper and lighting. The cleanup pass estimates that background tone and stretches it toward pure white while keeping the ink dark, which is what most forms expect from a signature image.',
          ],
        },
      ],
      example: {
        inputs: [
          { label: 'Exam', value: 'Example — Banking PO (sample spec)' },
          { label: 'Photo requirement', value: '200×230px, 20–50 KB' },
        ],
        result: [{ label: 'Photo result', value: '200×230px, 41 KB — passes' }],
        walkthrough:
          'The uploaded photo is cropped to a 200:230 aspect ratio using the position you chose, resized to exactly 200×230 pixels, then compressed to land inside the 20–50 KB range.',
      },
    },
    faq: [
      { q: 'Where do the exam specs come from?', a: 'Each preset lists the notification it was verified against and the date it was checked. Requirements can change between notification cycles, so always cross-check against the current official notification before submitting — every preset says this explicitly.' },
      { q: 'Can I use this for an exam that isn’t listed?', a: 'Not yet with an exact preset, but you can use our general Compress Image to Exact Size and Image Resizer tools with the dimensions and size range from your own notification.' },
      { q: 'Why does it say "couldn’t hit every requirement"?', a: 'This happens on rare, very restrictive size ranges where the required pixel dimensions can’t be compressed into the target range without visibly damaging the image. The tool always shows you the closest possible result rather than silently failing.' },
      { q: 'Is my photo uploaded anywhere?', a: 'No. Cropping, resizing, cleanup and compression all happen in your browser.' },
      { q: 'What if my photo doesn\'t fit the required aspect ratio?', a: 'The crop tool lets you pan and zoom freely within the locked aspect ratio, so you choose exactly what part of your photo fills the frame rather than being forced into an automatic, possibly awkward crop.' },
      { q: 'Can I redo the photo and signature separately?', a: 'Yes — each has its own crop and result step, so you can retake or re-crop just the signature without redoing the photo, or the other way around.' },
      { q: 'What image formats can I upload for the photo and signature?', a: 'JPG, PNG or WebP for either one — the tool normalises both internally before cropping and compressing to the exam\'s required format.' },
    ],
    relatedTools: ['passport-photo', 'compress-to-size', 'resize-image', 'compress-image'],
  },
  {
    ...base,
    id: 'passport-photo',
    name: 'Passport Photo Maker',
    slug: 'passport-photo',
    path: '/image/passport-photo',
    icon: 'camera',
    toolType: 'file',
    featured: true,
    popular: true,
    sortOrder: 9,
    updatedAt: '2026-09-05',
    shortDescription: 'Crop to India, US or Schengen passport photo standards, plus a printable sheet.',
    description:
      'Crop your photo to the exact passport or visa photo standard — India (35×45mm), US (2×2in) or Schengen (35×45mm) — at 300 DPI on a white background, then generate a 4×6in print sheet with multiple copies and cut guides.',
    keywords: ['passport photo maker', 'passport size photo online', 'us visa photo size', 'schengen visa photo', 'passport photo 4x6 sheet', 'passport photo print'],
    seoTitle: 'Passport Photo Maker — India, US & Schengen + Print Sheet',
    seoDescription:
      'Free passport and visa photo maker. Crop to the exact India (35×45mm), US (2×2in) or Schengen (35×45mm) standard at 300 DPI, then print multiple copies on one 4×6in sheet with cut guides.',
    content: {
      howItWorks: [
        { title: 'Choose your photo standard', body: 'India, US or Schengen — each maps to the exact required pixel size at 300 DPI.' },
        { title: 'Crop your photo', body: 'Drag to position and zoom to fit the required aspect ratio exactly, on a white background.' },
        { title: 'Download or print', body: 'Save the single photo, or generate a 4×6in sheet tiled with as many copies as fit, complete with cut guides.' },
      ],
      features: [
        'India (35×45mm), US (2×2in) and Schengen (35×45mm) presets',
        '300 DPI output for genuine print quality',
        'Crop locked to the exact required aspect ratio',
        '4×6in print sheet with multiple copies and dashed cut guides',
        'White background, standard JPEG output',
        'Runs entirely in your browser',
      ],
      sections: [
        {
          heading: 'Why print a sheet instead of one photo',
          paragraphs: [
            'Passport applications and photo studios both typically ask for more than one print. Rather than pay per print or crop the same photo six times, this tool tiles as many copies as fit on a standard 4×6in photo print size — the size almost every pharmacy and photo kiosk print machine accepts — with light dashed guides so you can cut them apart cleanly.',
          ],
        },
        {
          heading: 'A note on photo studio requirements',
          paragraphs: [
            'This tool handles the sizing, DPI and print layout precisely. It does not attempt to verify facial positioning, expression, or lighting rules that passport authorities also require (like head size within the frame or a truly neutral expression) — take the source photo against a plain, well-lit background and check your country’s official photo guidelines before submitting.',
          ],
        },
      ],
      example: {
        inputs: [
          { label: 'Standard', value: 'India (35×45mm)' },
          { label: 'Output', value: '413×531px at 300 DPI' },
        ],
        result: [{ label: 'Print sheet', value: '6 copies tiled on one 4×6in sheet' }],
        walkthrough:
          'The cropped photo is resized to exactly 413×531 pixels, then tiled six times on a 1200×1800 pixel (4×6in at 300 DPI) sheet with a small gap and a dashed cut line around each copy.',
      },
    },
    faq: [
      { q: 'Will this photo be accepted for my passport application?', a: 'It gets the size, DPI and background right, but passport authorities also check things like head position and expression that this tool can’t verify. Always check your country’s official photo guidelines as well.' },
      { q: 'What paper size should I print the sheet on?', a: 'A standard 4×6 inch photo print, available at almost any pharmacy, photo kiosk or home printer with photo paper.' },
      { q: 'Can I add more sizes later?', a: 'Yes — passport sizes are defined in one small config file, so adding a new country’s standard is a quick addition.' },
      { q: 'Is my photo uploaded anywhere?', a: 'No. Cropping, resizing and print-sheet generation all happen in your browser.' },
      { q: 'Can I make a passport photo for a country not listed?', a: 'Use the closest matching standard\'s dimensions as a starting point, or crop with our general Image Resizer to your country\'s specific millimetre or pixel requirement.' },
      { q: 'Will the background always be pure white?', a: 'Yes — the standards here call for a plain white background, so the tool always renders one regardless of your original photo\'s background, provided your subject is reasonably separated from it.' },
      { q: 'Can I download just one copy instead of the full sheet?', a: 'Yes — the single cropped photo is available as its own download alongside the print sheet, so you can use whichever your application actually needs.' },
      { q: 'Why 300 DPI specifically?', a: '300 DPI is the standard resolution photo labs and passport authorities expect for a genuinely print-quality photo — lower resolutions can look visibly soft once printed at actual passport-photo size.' },
    ],
    relatedTools: ['exam-photo-signature', 'compress-to-size', 'resize-image', 'compress-image'],
  },
];
