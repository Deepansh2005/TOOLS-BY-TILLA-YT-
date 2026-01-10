# 🎯 TOOLS BY TILLA YT

A powerful collection of PDF and audio manipulation tools that work entirely in your browser - no server uploads required!

![Tools Preview](https://img.shields.io/badge/PDF-Tools-667eea?style=for-the-badge)
![Audio](https://img.shields.io/badge/Audio-Compression-764ba2?style=for-the-badge)
![Offline](https://img.shields.io/badge/Works-Offline-2ed573?style=for-the-badge)

## ✨ Features

### 📄 Merge & Reorder PDFs
- Combine multiple PDF files into one document
- **Reorder files** with intuitive ↑↓ buttons before merging
- Drag & drop support
- Real-time file list with visual ordering

### ✂️ Extract PDF Pages (Visual Selection)
- **Visual page preview** - See all pages as thumbnails
- **Click to select** - Interactive page selection
- Select/Deselect individual pages with a single click
- **Quick actions**: Select All / Deselect All buttons
- Real-time selection counter
- Green border highlights selected pages
- Extract only the pages you need

### 🔄 Rotate PDF
- Rotate pages 90°, 180°, or 270° (counter-clockwise)
- Apply rotation to:
  - All pages
  - Odd pages only
  - Even pages only
- Perfect for fixing scanned documents

### 🎵 Compress Audio
- Reduce audio file sizes
- Adjustable quality slider (0.1 - 1.0)
- Supports multiple audio formats
- Batch processing support
- Output format: WAV

## 🚀 Quick Start

### Installation

1. **Download all files**:
   ```
   ├── index.html
   ├── style.css
   └── script.js
   ```

2. **Place all files in the same folder**

3. **Open `index.html` in your browser**

That's it! No installation, no server setup needed.

## 📋 Requirements

- Modern web browser (Chrome, Firefox, Edge, Safari)
- JavaScript enabled
- Internet connection (only for loading CDN libraries)

## 🎨 How to Use

### Merge & Reorder PDFs
1. Click or drag multiple PDF files to the upload area
2. Use ↑ ↓ buttons to reorder files
3. Click "Merge PDFs" button
4. Download your merged PDF

### Extract PDF Pages
1. Upload a PDF file
2. **Wait for page previews to load**
3. Click on pages you want to extract (green border = selected)
4. Use "Select All" or "Deselect All" for quick selection
5. Click "Extract Selected Pages"
6. Download your extracted PDF

### Rotate PDF
1. Upload a PDF file
2. Choose rotation angle (90°, 180°, 270°)
3. Select which pages to rotate (All/Odd/Even)
4. Click "Rotate PDF"
5. Download your rotated PDF

### Compress Audio
1. Upload one or multiple audio files
2. Adjust quality slider (lower = smaller file size)
3. Click "Compress Audio"
4. Download compressed files

## 🛠️ Technologies Used

- **PDF-lib** (v1.17.1) - PDF manipulation
- **PDF.js** (v3.11.174) - PDF rendering for previews
- **Web Audio API** - Audio compression
- **Pure JavaScript** - No frameworks
- **CSS3** - Modern gradient UI with animations

## 🎨 Design Features

- Beautiful purple gradient theme
- Smooth animations and transitions
- Responsive grid layout
- Drag & drop support
- Real-time progress bars
- Success/Error status messages
- Hover effects and micro-interactions

## 🔒 Privacy & Security

- **100% Client-side processing** - All operations happen in your browser
- **No server uploads** - Your files never leave your device
- **No data collection** - Zero tracking or analytics
- **Offline capable** - Works without internet (after initial load)

## 📱 Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome  | ✅ Full |
| Firefox | ✅ Full |
| Safari  | ✅ Full |
| Edge    | ✅ Full |

## 🐛 Troubleshooting

### PDF Preview Not Loading?
- Check your internet connection (needed for PDF.js CDN)
- Try refreshing the page
- Make sure JavaScript is enabled

### Extract Not Working?
- Ensure you've selected at least one page
- Check browser console for errors
- Try with a smaller PDF first

### Audio Compression Issues?
- Browser must support Web Audio API
- Some formats may not be supported
- Try converting to common formats first

## 📝 File Structure

```
project/
│
├── index.html          # Main HTML structure
├── style.css           # All styling and animations
└── script.js           # Core functionality
```

## 🔧 Customization

### Change Color Theme
Edit `style.css`:
```css
/* Main gradient colors */
background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #2d1b69 100%);

/* Accent colors */
color: #667eea;  /* Primary */
color: #764ba2;  /* Secondary */
```

### Adjust Page Preview Size
Edit `style.css`:
```css
.pdf-pages-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}
```

## ⚡ Performance Tips

- For large PDFs (100+ pages), extraction may take a few seconds
- Preview rendering scales down images for faster loading
- Batch audio compression processes files sequentially

## 🤝 Contributing

Feel free to fork and modify! Suggestions welcome.

## 📄 License

Free to use for personal and commercial projects.

## 👨‍💻 Created By

**TILLA YT**

---

### 🌟 Features Highlight

- ✅ No installation required
- ✅ Works offline
- ✅ No file size limits
- ✅ Free forever
- ✅ Privacy-focused
- ✅ Modern UI/UX
- ✅ Fast processing

---

**Enjoy your PDF and Audio tools! 🎉**
