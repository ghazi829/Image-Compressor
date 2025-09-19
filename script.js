/**
 * Modern Image Compressor
 * A client-side image compression web application
 * 
 * This script handles:
 * - File upload (file picker and drag & drop)
 * - Image compression using Canvas API
 * - Image resizing and format conversion
 * - UI interactions and display updates
 * - Web Worker implementation for batch processing
 */

// DOM Elements
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const uploadSection = document.getElementById('upload-section');
const controlsSection = document.getElementById('controls-section');
const previewSection = document.getElementById('preview-section');
const batchSection = document.getElementById('batch-section');

const qualitySlider = document.getElementById('quality-slider');
const qualityValue = document.getElementById('quality-value');
const resizeToggle = document.getElementById('resize-toggle');
const resizeOptions = document.getElementById('resize-options');
const widthInput = document.getElementById('width-input');
const heightInput = document.getElementById('height-input');
const maintainAspect = document.getElementById('maintain-aspect');
const percentageInput = document.getElementById('percentage-input');
const formatSelect = document.getElementById('format-select');

const compressBtn = document.getElementById('compress-btn');
const downloadBtn = document.getElementById('download-btn');
const downloadAllBtn = document.getElementById('download-all-btn');
const resetBtn = document.getElementById('reset-btn');

const originalPreview = document.getElementById('original-preview');
const compressedPreview = document.getElementById('compressed-preview');
const originalSize = document.getElementById('original-size');
const compressedSize = document.getElementById('compressed-size');
const originalDimensions = document.getElementById('original-dimensions');
const compressedDimensions = document.getElementById('compressed-dimensions');
const sizeReduction = document.getElementById('size-reduction');

const progressFill = document.getElementById('progress-fill');
const processedCount = document.getElementById('processed-count');
const totalCount = document.getElementById('total-count');
const batchResults = document.getElementById('batch-results');

// Global variables
let uploadedFiles = [];
let currentFile = null;
let compressedFile = null;
let compressedFiles = [];
let originalAspectRatio = 0;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
});

/**
 * Set up all event listeners for the application
 */
function initializeEventListeners() {
    // File upload event listeners
    fileInput.addEventListener('change', handleFileSelect);
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
    dropArea.addEventListener('click', () => fileInput.click());
    
    // Control event listeners
    qualitySlider.addEventListener('input', updateQualityValue);
    resizeToggle.addEventListener('change', toggleResizeOptions);
    widthInput.addEventListener('input', handleWidthChange);
    heightInput.addEventListener('input', handleHeightChange);
    
    // Button event listeners
    compressBtn.addEventListener('click', compressImages);
    downloadBtn.addEventListener('click', downloadCompressedImage);
    downloadAllBtn.addEventListener('click', downloadAllCompressedImages);
    resetBtn.addEventListener('click', resetApp);
}

/**
 * Handle file selection from the file input
 * @param {Event} event - The change event from the file input
 */
function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
        processFiles(files);
    }
}

/**
 * Handle dragover event for the drop area
 * @param {Event} event - The dragover event
 */
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    dropArea.classList.add('highlight');
}

/**
 * Handle dragleave event for the drop area
 * @param {Event} event - The dragleave event
 */
function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    dropArea.classList.remove('highlight');
}

/**
 * Handle drop event for the drop area
 * @param {Event} event - The drop event
 */
function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    dropArea.classList.remove('highlight');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processFiles(files);
    }
}

/**
 * Process the uploaded files
 * @param {FileList} files - The list of files to process
 */
function processFiles(files) {
    // Filter for only image files
    const imageFiles = Array.from(files).filter(file => {
        return file.type === 'image/jpeg' || 
               file.type === 'image/png' || 
               file.type === 'image/webp';
    });
    
    if (imageFiles.length === 0) {
        alert('Please upload JPG, PNG, or WebP images only.');
        return;
    }
    
    uploadedFiles = imageFiles;
    currentFile = uploadedFiles[0]; // Set the first file as current
    
    // Update UI
    showControls();
    displayOriginalImage(currentFile);
    
    // Update batch info
    totalCount.textContent = uploadedFiles.length;
    processedCount.textContent = '0';
    
    // Enable compress button
    compressBtn.disabled = false;
    
    // If there are multiple files, show batch section
    if (uploadedFiles.length > 1) {
        batchSection.style.display = 'block';
    }
}

/**
 * Display the original image in the preview
 * @param {File} file - The image file to display
 */
function displayOriginalImage(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        
        img.onload = function() {
            // Store original dimensions and aspect ratio
            originalPreview.width = img.width;
            originalPreview.height = img.height;
            originalAspectRatio = img.width / img.height;
            
            // Update dimension inputs with original values
            widthInput.value = img.width;
            heightInput.value = img.height;
            
            // Update original image info
            originalDimensions.textContent = `${img.width} x ${img.height}`;
            originalSize.textContent = formatFileSize(file.size);
            
            // Show preview section
            previewSection.style.display = 'block';
        };
        
        img.src = e.target.result;
        originalPreview.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

/**
 * Show the controls section
 */
function showControls() {
    uploadSection.style.display = 'none';
    controlsSection.style.display = 'block';
}

/**
 * Update the quality value display
 */
function updateQualityValue() {
    qualityValue.textContent = qualitySlider.value;
}

/**
 * Toggle the resize options visibility
 */
function toggleResizeOptions() {
    resizeOptions.style.display = resizeToggle.checked ? 'block' : 'none';
}

/**
 * Handle width input change and maintain aspect ratio if enabled
 */
function handleWidthChange() {
    if (maintainAspect.checked && originalAspectRatio > 0) {
        const newWidth = parseInt(widthInput.value) || 0;
        heightInput.value = Math.round(newWidth / originalAspectRatio);
    }
}

/**
 * Handle height input change and maintain aspect ratio if enabled
 */
function handleHeightChange() {
    if (maintainAspect.checked && originalAspectRatio > 0) {
        const newHeight = parseInt(heightInput.value) || 0;
        widthInput.value = Math.round(newHeight * originalAspectRatio);
    }
}

/**
 * Format file size to human-readable format
 * @param {number} bytes - The file size in bytes
 * @returns {string} - Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Compress the uploaded images
 */
function compressImages() {
    if (uploadedFiles.length === 0) return;
    
    // Reset compressed files array
    compressedFiles = [];
    
    // If there's only one file, compress it directly
    if (uploadedFiles.length === 1) {
        compressImage(uploadedFiles[0])
            .then(result => {
                compressedFile = result.blob;
                displayCompressedImage(result);
                downloadBtn.disabled = false;
            })
            .catch(error => {
                console.error('Error compressing image:', error);
                alert('Error compressing image. Please try again.');
            });
    } else {
        // For multiple files, use Web Worker for batch processing
        processBatchWithWorker();
    }
}

/**
 * Compress a single image
 * @param {File} file - The image file to compress
 * @returns {Promise<Object>} - Promise resolving to the compression result
 */
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            
            img.onload = function() {
                // Get compression settings
                const quality = parseInt(qualitySlider.value) / 100;
                const outputFormat = getOutputFormat(file.type);
                
                // Create canvas for image processing
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set dimensions based on resize options
                let width = img.width;
                let height = img.height;
                
                if (resizeToggle.checked) {
                    if (document.getElementById('resize-pixels').checked) {
                        width = parseInt(widthInput.value) || img.width;
                        height = parseInt(heightInput.value) || img.height;
                    } else if (document.getElementById('resize-percentage').checked) {
                        const percentage = parseInt(percentageInput.value) / 100;
                        width = Math.round(img.width * percentage);
                        height = Math.round(img.height * percentage);
                    }
                }
                
                // Set canvas dimensions
                canvas.width = width;
                canvas.height = height;
                
                // Draw image on canvas with new dimensions
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert canvas to blob with specified format and quality
                canvas.toBlob(blob => {
                    if (!blob) {
                        reject(new Error('Failed to create blob from canvas'));
                        return;
                    }
                    
                    // Create result object
                    const result = {
                        blob: blob,
                        url: URL.createObjectURL(blob),
                        size: blob.size,
                        width: width,
                        height: height,
                        originalSize: file.size,
                        originalWidth: img.width,
                        originalHeight: img.height,
                        name: getOutputFileName(file.name, outputFormat),
                        type: getMimeType(outputFormat)
                    };
                    
                    resolve(result);
                }, getMimeType(outputFormat), quality);
            };
            
            img.onerror = function() {
                reject(new Error('Failed to load image'));
            };
            
            img.src = e.target.result;
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsDataURL(file);
    });
}

/**
 * Get the output format based on user selection
 * @param {string} inputType - The input file's MIME type
 * @returns {string} - The output format (jpeg, png, webp)
 */
function getOutputFormat(inputType) {
    const selectedFormat = formatSelect.value;
    
    if (selectedFormat === 'same') {
        // Extract format from MIME type (e.g., 'image/jpeg' -> 'jpeg')
        return inputType.split('/')[1];
    }
    
    return selectedFormat;
}

/**
 * Get the MIME type for the specified format
 * @param {string} format - The image format
 * @returns {string} - The corresponding MIME type
 */
function getMimeType(format) {
    switch (format) {
        case 'jpeg':
        case 'jpg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'webp':
            return 'image/webp';
        default:
            return 'image/jpeg';
    }
}

/**
 * Generate output filename based on input filename and format
 * @param {string} inputName - The input filename
 * @param {string} outputFormat - The output format
 * @returns {string} - The output filename
 */
function getOutputFileName(inputName, outputFormat) {
    // Remove extension from input name
    const baseName = inputName.replace(/\.[^\.]+$/, '');
    
    // Add compressed suffix and new extension
    return `${baseName}-compressed.${outputFormat}`;
}

/**
 * Display the compressed image in the preview
 * @param {Object} result - The compression result
 */
function displayCompressedImage(result) {
    // Update compressed preview image
    compressedPreview.src = result.url;
    
    // Update compressed image info
    compressedDimensions.textContent = `${result.width} x ${result.height}`;
    compressedSize.textContent = formatFileSize(result.size);
    
    // Calculate and display size reduction
    const reduction = ((1 - (result.size / result.originalSize)) * 100).toFixed(1);
    sizeReduction.textContent = `${reduction}%`;
    
    // Show preview section
    previewSection.style.display = 'block';
}

/**
 * Process batch of images using Web Worker
 */
function processBatchWithWorker() {
    // Show batch section
    batchSection.style.display = 'block';
    
    // Reset progress
    progressFill.style.width = '0%';
    processedCount.textContent = '0';
    batchResults.innerHTML = '';
    
    // Create a Web Worker for image processing
    const workerCode = `
        self.onmessage = function(e) {
            const { file, quality, resize, width, height, outputFormat } = e.data;
            
            // Process the image
            const reader = new FileReader();
            
            reader.onload = function(event) {
                const img = new Image();
                
                img.onload = function() {
                    // Create canvas
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Set dimensions
                    let outputWidth = img.width;
                    let outputHeight = img.height;
                    
                    if (resize) {
                        outputWidth = width;
                        outputHeight = height;
                    }
                    
                    canvas.width = outputWidth;
                    canvas.height = outputHeight;
                    
                    // Draw image
                    ctx.drawImage(img, 0, 0, outputWidth, outputHeight);
                    
                    // Convert to blob
                    canvas.toBlob(function(blob) {
                        // Send result back to main thread
                        self.postMessage({
                            blob: blob,
                            name: file.name,
                            size: blob.size,
                            originalSize: file.size,
                            width: outputWidth,
                            height: outputHeight
                        });
                    }, outputFormat, quality);
                };
                
                img.src = event.target.result;
            };
            
            reader.readAsDataURL(file);
        };
    `;
    
    // Create a blob from the worker code
    const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);
    
    // Set up worker message handler
    worker.onmessage = function(e) {
        const result = e.data;
        
        // Add to compressed files array
        compressedFiles.push({
            blob: result.blob,
            name: getOutputFileName(result.name, getOutputFormat(getMimeType(result.blob.type))),
            url: URL.createObjectURL(result.blob),
            size: result.size,
            originalSize: result.originalSize
        });
        
        // Update progress
        const processed = compressedFiles.length;
        const total = uploadedFiles.length;
        const percentage = (processed / total) * 100;
        
        progressFill.style.width = `${percentage}%`;
        processedCount.textContent = processed;
        
        // Add to batch results
        addBatchResultItem(result);
        
        // If all files are processed, enable download all button
        if (processed === total) {
            downloadAllBtn.disabled = false;
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
        }
    };
    
    // Process each file
    uploadedFiles.forEach(file => {
        // Get compression settings
        const quality = parseInt(qualitySlider.value) / 100;
        const outputFormat = getMimeType(getOutputFormat(file.type));
        
        // Calculate dimensions
        let width = 0;
        let height = 0;
        let resize = false;
        
        if (resizeToggle.checked) {
            resize = true;
            if (document.getElementById('resize-pixels').checked) {
                width = parseInt(widthInput.value) || 0;
                height = parseInt(heightInput.value) || 0;
            } else if (document.getElementById('resize-percentage').checked) {
                // We'll calculate this in the worker based on original dimensions
                const percentage = parseInt(percentageInput.value) / 100;
                // Create a temporary image to get dimensions
                const tempImg = new Image();
                tempImg.onload = function() {
                    width = Math.round(tempImg.width * percentage);
                    height = Math.round(tempImg.height * percentage);
                    
                    // Send to worker
                    worker.postMessage({
                        file: file,
                        quality: quality,
                        resize: resize,
                        width: width,
                        height: height,
                        outputFormat: outputFormat
                    });
                    
                    URL.revokeObjectURL(tempImg.src);
                };
                tempImg.src = URL.createObjectURL(file);
                return; // Skip the postMessage below, we'll do it in the onload
            }
        }
        
        // Send to worker
        worker.postMessage({
            file: file,
            quality: quality,
            resize: resize,
            width: width,
            height: height,
            outputFormat: outputFormat
        });
    });
}

/**
 * Add a batch result item to the batch results container
 * @param {Object} result - The compression result
 */
function addBatchResultItem(result) {
    const reduction = ((1 - (result.size / result.originalSize)) * 100).toFixed(1);
    
    const itemHtml = `
        <div class="batch-item">
            <div class="batch-item-preview">
                <img src="${URL.createObjectURL(result.blob)}" alt="Compressed preview">
            </div>
            <div class="batch-item-info">
                <p>Size: ${formatFileSize(result.size)} (${reduction}% reduction)</p>
                <p>Dimensions: ${result.width} x ${result.height}</p>
            </div>
        </div>
    `;
    
    batchResults.insertAdjacentHTML('beforeend', itemHtml);
}

/**
 * Download the compressed image
 */
function downloadCompressedImage() {
    if (!compressedFile) return;
    
    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(compressedFile);
    link.download = getOutputFileName(currentFile.name, getOutputFormat(currentFile.type));
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Download all compressed images as a ZIP file
 */
function downloadAllCompressedImages() {
    if (compressedFiles.length === 0) return;
    
    // If there's only one file, download it directly
    if (compressedFiles.length === 1) {
        const link = document.createElement('a');
        link.href = compressedFiles[0].url;
        link.download = compressedFiles[0].name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
    }
    
    // For multiple files, create a ZIP file
    // Note: In a real implementation, you would use a library like JSZip
    // Since we're keeping this vanilla JS only, we'll simulate the ZIP download
    alert('In a real implementation, this would create a ZIP file with all compressed images. For now, please download images individually.');
    
    // Download each file individually
    compressedFiles.forEach(file => {
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

/**
 * Reset the application to its initial state
 */
function resetApp() {
    // Reset file inputs
    fileInput.value = '';
    uploadedFiles = [];
    currentFile = null;
    compressedFile = null;
    compressedFiles = [];
    
    // Reset UI sections
    uploadSection.style.display = 'block';
    controlsSection.style.display = 'none';
    previewSection.style.display = 'none';
    batchSection.style.display = 'none';
    
    // Reset preview images
    originalPreview.src = '';
    compressedPreview.src = '';
    
    // Reset info displays
    originalSize.textContent = '0 KB';
    compressedSize.textContent = '0 KB';
    originalDimensions.textContent = '0 x 0';
    compressedDimensions.textContent = '0 x 0';
    sizeReduction.textContent = '0%';
    
    // Reset batch results
    batchResults.innerHTML = '';
    progressFill.style.width = '0%';
    processedCount.textContent = '0';
    totalCount.textContent = '0';
    
    // Reset buttons
    downloadBtn.disabled = true;
    downloadAllBtn.disabled = true;
    
    // Revoke any object URLs to prevent memory leaks
    if (compressedFiles.length > 0) {
        compressedFiles.forEach(file => {
            if (file.url) URL.revokeObjectURL(file.url);
        });
    }
}