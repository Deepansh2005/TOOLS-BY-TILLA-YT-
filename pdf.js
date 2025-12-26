// Wait for PDF-lib to load
const { PDFDocument, rgb } = PDFLib;

// Page size configurations
const pageSizes = {
    a4: [595, 842],
    letter: [612, 792],
    a3: [842, 1191],
    a5: [420, 595]
};

// ========================
// PDF MERGE FUNCTIONALITY
// ========================
let mergePdfFiles = [];
const mergePdfInput = document.getElementById('mergePdfInput');
const mergeFileList = document.getElementById('mergeFileList');
const mergePdfBtn = document.getElementById('mergePdfBtn');
const mergeProgress = document.getElementById('mergeProgress');
const mergeStatus = document.getElementById('mergeStatus');
const mergePdfArea = document.getElementById('mergePdfArea');

// File input change handler
mergePdfInput.addEventListener('change', function(e) {
    console.log('Files selected:', e.target.files);
    handleMergePdfFiles(e.target.files);
});

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    mergePdfArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

// Highlight drop area when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
    mergePdfArea.addEventListener(eventName, function() {
        mergePdfArea.classList.add('dragover');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    mergePdfArea.addEventListener(eventName, function() {
        mergePdfArea.classList.remove('dragover');
    }, false);
});

// Handle dropped files
mergePdfArea.addEventListener('drop', function(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    console.log('Files dropped:', files);
    handleMergePdfFiles(files);
}, false);

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleMergePdfFiles(files) {
    console.log('Handling files:', files.length);
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log('File type:', file.type, 'Name:', file.name);
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            mergePdfFiles.push(file);
            console.log('PDF added:', file.name);
        }
    }
    updateMergeFileList();
}

function updateMergeFileList() {
    console.log('Updating list. Total files:', mergePdfFiles.length);
    mergeFileList.innerHTML = '';
    mergePdfFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${file.name}</span>
            <button class="remove-btn" data-index="${index}" data-type="merge">×</button>
        `;
        mergeFileList.appendChild(fileItem);
    });
    mergePdfBtn.disabled = mergePdfFiles.length < 2;
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-btn[data-type="merge"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            removeMergeFile(index);
        });
    });
}

function removeMergeFile(index) {
    mergePdfFiles.splice(index, 1);
    updateMergeFileList();
}

mergePdfBtn.addEventListener('click', async function() {
    if (mergePdfFiles.length < 2) return;
    
    mergePdfBtn.disabled = true;
    mergeProgress.classList.add('active');
    showStatus(mergeStatus, 'Processing PDFs...', 'success');
    
    try {
        const mergedPdf = await PDFDocument.create();
        
        for (let i = 0; i < mergePdfFiles.length; i++) {
            const progress = ((i + 1) / mergePdfFiles.length) * 100;
            mergeProgress.querySelector('.progress-fill').style.width = progress + '%';
            
            const fileBytes = await mergePdfFiles[i].arrayBuffer();
            const pdf = await PDFDocument.load(fileBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }
        
        const mergedPdfBytes = await mergedPdf.save();
        downloadFile(mergedPdfBytes, 'merged.pdf', 'application/pdf');
        
        showStatus(mergeStatus, '✓ PDFs merged successfully!', 'success');
        mergePdfFiles = [];
        updateMergeFileList();
        mergePdfInput.value = '';
        
    } catch (error) {
        console.error('Merge error:', error);
        showStatus(mergeStatus, '✗ Error: ' + error.message, 'error');
    }
    
    setTimeout(() => {
        mergeProgress.classList.remove('active');
        mergeProgress.querySelector('.progress-fill').style.width = '0%';
    }, 500);
    mergePdfBtn.disabled = false;
});

// ========================
// PDF RESIZE FUNCTIONALITY
// ========================
let resizePdfFile = null;
const resizePdfInput = document.getElementById('resizePdfInput');
const resizeFileList = document.getElementById('resizeFileList');
const resizePdfBtn = document.getElementById('resizePdfBtn');
const pageSizeSelect = document.getElementById('pageSizeSelect');
const scaleRange = document.getElementById('scaleRange');
const scaleValue = document.getElementById('scaleValue');
const resizeProgress = document.getElementById('resizeProgress');
const resizeStatus = document.getElementById('resizeStatus');
const resizePdfArea = document.getElementById('resizePdfArea');

resizePdfInput.addEventListener('change', function(e) {
    if (e.target.files[0]) {
        handleResizePdfFile(e.target.files[0]);
    }
});

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    resizePdfArea.addEventListener(eventName, preventDefaults, false);
});

['dragenter', 'dragover'].forEach(eventName => {
    resizePdfArea.addEventListener(eventName, function() {
        resizePdfArea.classList.add('dragover');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    resizePdfArea.addEventListener(eventName, function() {
        resizePdfArea.classList.remove('dragover');
    }, false);
});

resizePdfArea.addEventListener('drop', function(e) {
    const files = e.dataTransfer.files;
    if (files[0]) {
        handleResizePdfFile(files[0]);
    }
}, false);

scaleRange.addEventListener('input', function(e) {
    scaleValue.textContent = e.target.value + '%';
});

function handleResizePdfFile(file) {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        resizePdfFile = file;
        updateResizeFileList();
    }
}

function updateResizeFileList() {
    resizeFileList.innerHTML = '';
    if (resizePdfFile) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${resizePdfFile.name}</span>
            <button class="remove-btn" data-type="resize">×</button>
        `;
        resizeFileList.appendChild(fileItem);
        resizePdfBtn.disabled = false;
        
        document.querySelector('.remove-btn[data-type="resize"]').addEventListener('click', removeResizeFile);
    } else {
        resizePdfBtn.disabled = true;
    }
}

function removeResizeFile() {
    resizePdfFile = null;
    updateResizeFileList();
    resizePdfInput.value = '';
}

resizePdfBtn.addEventListener('click', async function() {
    if (!resizePdfFile) return;
    
    resizePdfBtn.disabled = true;
    resizeProgress.classList.add('active');
    showStatus(resizeStatus, 'Resizing PDF...', 'success');
    
    try {
        const fileBytes = await resizePdfFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBytes);
        const newPdf = await PDFDocument.create();
        
        const selectedSize = pageSizeSelect.value;
        const [newWidth, newHeight] = pageSizes[selectedSize];
        const scale = parseFloat(scaleRange.value) / 100;
        
        const pages = pdfDoc.getPages();
        
        for (let i = 0; i < pages.length; i++) {
            const progress = ((i + 1) / pages.length) * 100;
            resizeProgress.querySelector('.progress-fill').style.width = progress + '%';
            
            const [embeddedPage] = await newPdf.embedPdf(pdfDoc, [i]);
            const newPage = newPdf.addPage([newWidth, newHeight]);
            
            const { width: origWidth, height: origHeight } = embeddedPage;
            const scaleX = (newWidth / origWidth) * scale;
            const scaleY = (newHeight / origHeight) * scale;
            const finalScale = Math.min(scaleX, scaleY);
            
            const scaledWidth = origWidth * finalScale;
            const scaledHeight = origHeight * finalScale;
            const x = (newWidth - scaledWidth) / 2;
            const y = (newHeight - scaledHeight) / 2;
            
            newPage.drawPage(embeddedPage, {
                x: x,
                y: y,
                width: scaledWidth,
                height: scaledHeight
            });
        }
        
        const pdfBytes = await newPdf.save();
        downloadFile(pdfBytes, 'resized_' + resizePdfFile.name, 'application/pdf');
        
        showStatus(resizeStatus, '✓ PDF resized successfully!', 'success');
        resizePdfFile = null;
        updateResizeFileList();
        
    } catch (error) {
        console.error('Resize error:', error);
        showStatus(resizeStatus, '✗ Error: ' + error.message, 'error');
    }
    
    setTimeout(() => {
        resizeProgress.classList.remove('active');
        resizeProgress.querySelector('.progress-fill').style.width = '0%';
    }, 500);
    resizePdfBtn.disabled = false;
});

// ========================
// AUDIO COMPRESS FUNCTIONALITY
// ========================
let audioFiles = [];
const audioInput = document.getElementById('audioInput');
const audioFileList = document.getElementById('audioFileList');
const compressAudioBtn = document.getElementById('compressAudioBtn');
const qualityRange = document.getElementById('qualityRange');
const qualityValue = document.getElementById('qualityValue');
const audioProgress = document.getElementById('audioProgress');
const audioStatus = document.getElementById('audioStatus');
const audioArea = document.getElementById('audioArea');

audioInput.addEventListener('change', function(e) {
    handleAudioFiles(e.target.files);
});

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    audioArea.addEventListener(eventName, preventDefaults, false);
});

['dragenter', 'dragover'].forEach(eventName => {
    audioArea.addEventListener(eventName, function() {
        audioArea.classList.add('dragover');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    audioArea.addEventListener(eventName, function() {
        audioArea.classList.remove('dragover');
    }, false);
});

audioArea.addEventListener('drop', function(e) {
    const files = e.dataTransfer.files;
    handleAudioFiles(files);
}, false);

qualityRange.addEventListener('input', function(e) {
    qualityValue.textContent = e.target.value;
});

function handleAudioFiles(files) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('audio/')) {
            audioFiles.push(file);
        }
    }
    updateAudioFileList();
}

function updateAudioFileList() {
    audioFileList.innerHTML = '';
    audioFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${file.name}</span>
            <button class="remove-btn" data-index="${index}" data-type="audio">×</button>
        `;
        audioFileList.appendChild(fileItem);
    });
    compressAudioBtn.disabled = audioFiles.length === 0;
    
    document.querySelectorAll('.remove-btn[data-type="audio"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            removeAudioFile(index);
        });
    });
}

function removeAudioFile(index) {
    audioFiles.splice(index, 1);
    updateAudioFileList();
}

compressAudioBtn.addEventListener('click', async function() {
    if (audioFiles.length === 0) return;
    
    compressAudioBtn.disabled = true;
    audioProgress.classList.add('active');
    showStatus(audioStatus, 'Compressing audio...', 'success');
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        for (let i = 0; i < audioFiles.length; i++) {
            const progress = ((i + 1) / audioFiles.length) * 100;
            audioProgress.querySelector('.progress-fill').style.width = progress + '%';
            
            const file = audioFiles[i];
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            const quality = parseFloat(qualityRange.value);
            const sampleRate = Math.floor(audioBuffer.sampleRate * quality);
            
            const offlineContext = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                audioBuffer.duration * sampleRate,
                sampleRate
            );
            
            const source = offlineContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(offlineContext.destination);
            source.start(0);
            
            const renderedBuffer = await offlineContext.startRendering();
            const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);
            
            const fileName = file.name.replace(/\.[^/.]+$/, '') + '_compressed.wav';
            downloadFile(wavBlob, fileName, 'audio/wav');
        }
        
        showStatus(audioStatus, '✓ Audio compressed successfully!', 'success');
        audioFiles = [];
        updateAudioFileList();
        audioInput.value = '';
        
    } catch (error) {
        console.error('Audio compression error:', error);
        showStatus(audioStatus, '✗ Error: ' + error.message, 'error');
    }
    
    setTimeout(() => {
        audioProgress.classList.remove('active');
        audioProgress.querySelector('.progress-fill').style.width = '0%';
    }, 500);
    compressAudioBtn.disabled = false;
});

function bufferToWave(abuffer, len) {
    const numOfChan = abuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let sample;
    let offset = 0;
    let pos = 0;

    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length - pos - 4);

    for (let i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    while (pos < length) {
        for (let i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([buffer], { type: 'audio/wav' });

    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}

// ========================
// UTILITY FUNCTIONS
// ========================
function downloadFile(data, filename, mimeType) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showStatus(element, message, type) {
    element.textContent = message;
    element.className = 'status-message active ' + type;
    setTimeout(() => {
        element.classList.remove('active');
    }, 5000);
}

console.log('PDF & Audio Tool loaded successfully!');