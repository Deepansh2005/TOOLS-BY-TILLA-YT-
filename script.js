const { PDFDocument, degrees } = PDFLib;

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function setupDragAndDrop(area, handler) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        area.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        area.addEventListener(eventName, () => area.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        area.addEventListener(eventName, () => area.classList.remove('dragover'), false);
    });

    area.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        handler(files);
    }, false);
}

// ========================
// PDF MERGE WITH REORDERING
// ========================
let mergePdfFiles = [];
const mergePdfInput = document.getElementById('mergePdfInput');
const mergeFileList = document.getElementById('mergeFileList');
const mergePdfBtn = document.getElementById('mergePdfBtn');
const mergeProgress = document.getElementById('mergeProgress');
const mergeStatus = document.getElementById('mergeStatus');
const mergePdfArea = document.getElementById('mergePdfArea');

mergePdfInput.addEventListener('change', (e) => handleMergePdfFiles(e.target.files));
setupDragAndDrop(mergePdfArea, handleMergePdfFiles);

function handleMergePdfFiles(files) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            mergePdfFiles.push(file);
        }
    }
    updateMergeFileList();
}

function updateMergeFileList() {
    mergeFileList.innerHTML = '';
    mergePdfFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${index + 1}. ${file.name}</span>
            <div style="display: flex; gap: 5px;">
                <div class="reorder-controls">
                    <button class="reorder-btn" onclick="moveUp(${index})" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="reorder-btn" onclick="moveDown(${index})" ${index === mergePdfFiles.length - 1 ? 'disabled' : ''}>↓</button>
                </div>
                <button class="remove-btn" onclick="removeMergeFile(${index})">×</button>
            </div>
        `;
        mergeFileList.appendChild(fileItem);
    });
    mergePdfBtn.disabled = mergePdfFiles.length < 2;
}

function moveUp(index) {
    if (index > 0) {
        [mergePdfFiles[index - 1], mergePdfFiles[index]] = [mergePdfFiles[index], mergePdfFiles[index - 1]];
        updateMergeFileList();
    }
}

function moveDown(index) {
    if (index < mergePdfFiles.length - 1) {
        [mergePdfFiles[index], mergePdfFiles[index + 1]] = [mergePdfFiles[index + 1], mergePdfFiles[index]];
        updateMergeFileList();
    }
}

function removeMergeFile(index) {
    mergePdfFiles.splice(index, 1);
    updateMergeFileList();
}

mergePdfBtn.addEventListener('click', async () => {
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
        showStatus(mergeStatus, '✗ Error: ' + error.message, 'error');
    }
    
    setTimeout(() => {
        mergeProgress.classList.remove('active');
        mergeProgress.querySelector('.progress-fill').style.width = '0%';
    }, 500);
    mergePdfBtn.disabled = false;
});

// ========================
// PDF EXTRACT PAGES WITH VISUAL SELECTION
// ========================
let extractPdfFile = null;
let extractPdfData = null;
let selectedPages = new Set();
const extractPdfInput = document.getElementById('extractPdfInput');
const extractFileList = document.getElementById('extractFileList');
const extractPdfBtn = document.getElementById('extractPdfBtn');
const extractProgress = document.getElementById('extractProgress');
const extractStatus = document.getElementById('extractStatus');
const extractPdfArea = document.getElementById('extractPdfArea');
const pdfPreviewContainer = document.getElementById('pdfPreviewContainer');
const pdfPagesGrid = document.getElementById('pdfPagesGrid');
const selectionCount = document.getElementById('selectionCount');
const selectAllBtn = document.getElementById('selectAllBtn');
const deselectAllBtn = document.getElementById('deselectAllBtn');

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

extractPdfInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleExtractPdfFile(e.target.files[0]);
});
setupDragAndDrop(extractPdfArea, (files) => {
    if (files[0]) handleExtractPdfFile(files[0]);
});

async function handleExtractPdfFile(file) {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        extractPdfFile = file;
        updateExtractFileList();
        
        // Read file as data URL for PDF.js
        const reader = new FileReader();
        reader.onload = async function(e) {
            extractPdfData = await file.arrayBuffer();
            await renderPdfPreviews(e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

async function renderPdfPreviews(dataUrl) {
    try {
        showStatus(extractStatus, 'Loading PDF preview...', 'success');
        
        const loadingTask = pdfjsLib.getDocument(dataUrl);
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        
        pdfPagesGrid.innerHTML = '';
        selectedPages.clear();
        
        pdfPreviewContainer.style.display = 'block';
        updateSelectionCount();
        
        // Render all pages
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const scale = 0.5;
            const viewport = page.getViewport({ scale });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            // Create page item
            const pageItem = document.createElement('div');
            pageItem.className = 'pdf-page-item';
            pageItem.dataset.page = pageNum - 1; // 0-based index
            
            pageItem.innerHTML = `
                <div class="page-checkbox"></div>
                <div class="page-canvas-wrapper">
                    <canvas class="page-canvas"></canvas>
                </div>
                <div class="page-number">Page ${pageNum}</div>
            `;
            
            const pageCanvas = pageItem.querySelector('.page-canvas');
            pageCanvas.width = canvas.width;
            pageCanvas.height = canvas.height;
            pageCanvas.getContext('2d').drawImage(canvas, 0, 0);
            
            pageItem.addEventListener('click', () => togglePageSelection(pageItem));
            
            pdfPagesGrid.appendChild(pageItem);
        }
        
        showStatus(extractStatus, `✓ PDF loaded! Click pages to select`, 'success');
        
    } catch (error) {
        showStatus(extractStatus, '✗ Error loading PDF: ' + error.message, 'error');
    }
}

function togglePageSelection(pageItem) {
    const pageIndex = parseInt(pageItem.dataset.page);
    
    if (selectedPages.has(pageIndex)) {
        selectedPages.delete(pageIndex);
        pageItem.classList.remove('selected');
    } else {
        selectedPages.add(pageIndex);
        pageItem.classList.add('selected');
    }
    
    updateSelectionCount();
    extractPdfBtn.disabled = selectedPages.size === 0;
}

function updateSelectionCount() {
    selectionCount.textContent = `${selectedPages.size} pages selected`;
}

selectAllBtn.addEventListener('click', () => {
    const allPageItems = pdfPagesGrid.querySelectorAll('.pdf-page-item');
    allPageItems.forEach(item => {
        const pageIndex = parseInt(item.dataset.page);
        selectedPages.add(pageIndex);
        item.classList.add('selected');
    });
    updateSelectionCount();
    extractPdfBtn.disabled = false;
});

deselectAllBtn.addEventListener('click', () => {
    const allPageItems = pdfPagesGrid.querySelectorAll('.pdf-page-item');
    allPageItems.forEach(item => {
        item.classList.remove('selected');
    });
    selectedPages.clear();
    updateSelectionCount();
    extractPdfBtn.disabled = true;
});

function updateExtractFileList() {
    extractFileList.innerHTML = '';
    if (extractPdfFile) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${extractPdfFile.name}</span>
            <button class="remove-btn" onclick="removeExtractFile()">×</button>
        `;
        extractFileList.appendChild(fileItem);
    }
}

function removeExtractFile() {
    extractPdfFile = null;
    extractPdfData = null;
    selectedPages.clear();
    updateExtractFileList();
    extractPdfInput.value = '';
    pdfPreviewContainer.style.display = 'none';
    pdfPagesGrid.innerHTML = '';
    extractPdfBtn.disabled = true;
}

extractPdfBtn.addEventListener('click', async () => {
    if (!extractPdfFile || selectedPages.size === 0) return;
    
    extractPdfBtn.disabled = true;
    extractProgress.classList.add('active');
    showStatus(extractStatus, 'Extracting pages...', 'success');
    
    try {
        const pdfDoc = await PDFDocument.load(extractPdfData);
        const newPdf = await PDFDocument.create();
        
        const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);
        
        for (let i = 0; i < sortedPages.length; i++) {
            const progress = ((i + 1) / sortedPages.length) * 100;
            extractProgress.querySelector('.progress-fill').style.width = progress + '%';
            
            const [copiedPage] = await newPdf.copyPages(pdfDoc, [sortedPages[i]]);
            newPdf.addPage(copiedPage);
        }
        
        const pdfBytes = await newPdf.save();
        downloadFile(pdfBytes, 'extracted_' + extractPdfFile.name, 'application/pdf');
        
        showStatus(extractStatus, `✓ Extracted ${sortedPages.length} pages successfully!`, 'success');
        removeExtractFile();
        
    } catch (error) {
        showStatus(extractStatus, '✗ Error: ' + error.message, 'error');
    }
    
    setTimeout(() => {
        extractProgress.classList.remove('active');
        extractProgress.querySelector('.progress-fill').style.width = '0%';
    }, 500);
    extractPdfBtn.disabled = false;
});

// ========================
// PDF ROTATE
// ========================
let rotatePdfFile = null;
const rotatePdfInput = document.getElementById('rotatePdfInput');
const rotateFileList = document.getElementById('rotateFileList');
const rotatePdfBtn = document.getElementById('rotatePdfBtn');
const rotationSelect = document.getElementById('rotationSelect');
const pageRangeSelect = document.getElementById('pageRangeSelect');
const rotateProgress = document.getElementById('rotateProgress');
const rotateStatus = document.getElementById('rotateStatus');
const rotatePdfArea = document.getElementById('rotatePdfArea');

rotatePdfInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleRotatePdfFile(e.target.files[0]);
});
setupDragAndDrop(rotatePdfArea, (files) => {
    if (files[0]) handleRotatePdfFile(files[0]);
});

function handleRotatePdfFile(file) {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        rotatePdfFile = file;
        updateRotateFileList();
    }
}

function updateRotateFileList() {
    rotateFileList.innerHTML = '';
    if (rotatePdfFile) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${rotatePdfFile.name}</span>
            <button class="remove-btn" onclick="removeRotateFile()">×</button>
        `;
        rotateFileList.appendChild(fileItem);
        rotatePdfBtn.disabled = false;
    } else {
        rotatePdfBtn.disabled = true;
    }
}

function removeRotateFile() {
    rotatePdfFile = null;
    updateRotateFileList();
    rotatePdfInput.value = '';
}

rotatePdfBtn.addEventListener('click', async () => {
    if (!rotatePdfFile) return;
    
    rotatePdfBtn.disabled = true;
    rotateProgress.classList.add('active');
    showStatus(rotateStatus, 'Rotating PDF...', 'success');
    
    try {
        const fileBytes = await rotatePdfFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBytes);
        
        const rotation = parseInt(rotationSelect.value);
        const pageRange = pageRangeSelect.value;
        const pages = pdfDoc.getPages();
        
        for (let i = 0; i < pages.length; i++) {
            const progress = ((i + 1) / pages.length) * 100;
            rotateProgress.querySelector('.progress-fill').style.width = progress + '%';
            
            let shouldRotate = false;
            if (pageRange === 'all') {
                shouldRotate = true;
            } else if (pageRange === 'odd' && (i + 1) % 2 === 1) {
                shouldRotate = true;
            } else if (pageRange === 'even' && (i + 1) % 2 === 0) {
                shouldRotate = true;
            }
            
            if (shouldRotate) {
                pages[i].setRotation(degrees(rotation));
            }
        }
        
        const pdfBytes = await pdfDoc.save();
        downloadFile(pdfBytes, 'rotated_' + rotatePdfFile.name, 'application/pdf');
        
        showStatus(rotateStatus, '✓ PDF rotated successfully!', 'success');
        rotatePdfFile = null;
        updateRotateFileList();
        
    } catch (error) {
        showStatus(rotateStatus, '✗ Error: ' + error.message, 'error');
    }
    
    setTimeout(() => {
        rotateProgress.classList.remove('active');
        rotateProgress.querySelector('.progress-fill').style.width = '0%';
    }, 500);
    rotatePdfBtn.disabled = false;
});

// ========================
// AUDIO COMPRESS
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

audioInput.addEventListener('change', (e) => handleAudioFiles(e.target.files));
setupDragAndDrop(audioArea, handleAudioFiles);

qualityRange.addEventListener('input', (e) => {
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
            <button class="remove-btn" onclick="removeAudioFile(${index})">×</button>
        `;
        audioFileList.appendChild(fileItem);
    });
    compressAudioBtn.disabled = audioFiles.length === 0;
}

function removeAudioFile(index) {
    audioFiles.splice(index, 1);
    updateAudioFileList();
}

compressAudioBtn.addEventListener('click', async () => {
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