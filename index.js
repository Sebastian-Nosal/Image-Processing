
/**
 * @module ImageProcessingModule
 * @description Główna logika do przetwarzania obrazu z wykorzystaniem WebAssembly (WASM). Umożliwia załadowanie obrazu, przetworzenie go na skalę szarości, binarizację oraz nakładanie efektów.
 */

import ImageProcessor from './image_processing.js';

let module, cwrap, _malloc, _free;
let imagePointer, grayscalePointer, binaryPointer;
let grayscaleData, imageWidth, imageHeight, imageLength;

/**
 * Ładuje plik obrazu i inicjalizuje przetwarzanie przy użyciu WebAssembly.
 * @async
 * @function
 * @param {Event} event Zdarzenie zmiany pliku (input).
 */
async function loadFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!module) {
        module = await ImageProcessor();
        ({ cwrap, _malloc, _free } = module);
    }

    if (grayscalePointer) _free(grayscalePointer);
    if (binaryPointer) _free(binaryPointer);
    if (window.imagePointer) _free(window.imagePointer);

    const reader = new FileReader();
    reader.onload = function () {
        const image = new Image();
        image.onload = function () {
            imageWidth = image.width;
            imageHeight = image.height;

            renderOriginalCanvas(image);

            const ctx = document.getElementById('originalCanvas').getContext('2d');
            const imageData = ctx.getImageData(0, 0, imageWidth, imageHeight);
            const imageLength = imageData.data.length;

            window.imagePointer = _malloc(imageLength);
            grayscalePointer = _malloc(imageLength / 4);
            binaryPointer = _malloc(imageLength / 4);

            module.HEAPU8.set(imageData.data, window.imagePointer);
        };
        image.src = URL.createObjectURL(file);
    };
    reader.readAsDataURL(file);
}

/**
 * Konwertuje obraz na skalę szarości i aktualizuje canvas z wynikiem.
 * Wyznacza również automatycznie próg binaryzacji metodą Otsu.
 * @function
 */
function imageToGrayscale() {
    const imageLength = imageWidth * imageHeight * 4;

    const toGrayscale = cwrap('toGrayscale', null, ['number', 'number', 'number']);
    toGrayscale(window.imagePointer, grayscalePointer, imageLength);

    grayscaleData = new Uint8Array(module.HEAPU8.buffer, grayscalePointer, imageLength / 4);

    const grayscaleCtx = document.getElementById('grayscaleCanvas').getContext('2d');
    const grayscaleImageData = grayscaleCtx.createImageData(imageWidth, imageHeight);

    for (let i = 0, j = 0; i < grayscaleData.length; i++, j += 4) {
        const gray = grayscaleData[i];
        grayscaleImageData.data[j] = gray;
        grayscaleImageData.data[j + 1] = gray;
        grayscaleImageData.data[j + 2] = gray;
        grayscaleImageData.data[j + 3] = 255;
    }

    grayscaleCtx.putImageData(grayscaleImageData, 0, 0);

    const otsuThreshold = cwrap('otsuThreshold', 'number', ['number', 'number']);
    const threshold = otsuThreshold(grayscalePointer, grayscaleData.length);
    document.getElementById('thresholdSlider').value = threshold;
}

/**
 * Wykonuje binaryzację obrazu na podstawie zadanego progu.
 * Aktualizuje canvas z binarizowanym obrazem.
 * @function
 */
function binarize() {
    const threshold = parseInt(document.getElementById('thresholdSlider').value, 10);

    if (!grayscaleData) return alert("Najpierw wygeneruj obraz grayscale.");

    const binaryLength = grayscaleData.length;

    const binarize = cwrap('binarize', null, ['number', 'number', 'number', 'number']);
    binarize(grayscalePointer, binaryPointer, binaryLength, threshold);

    const binaryData = new Uint8Array(module.HEAPU8.buffer, binaryPointer, binaryLength);

    const binarizedCtx = document.getElementById('binarizedCanvas').getContext('2d');
    const binarizedImageData = binarizedCtx.createImageData(imageWidth, imageHeight);

    for (let i = 0; i < binaryData.length; i++) {
        const value = binaryData[i];
        binarizedImageData.data[i * 4] = value;
        binarizedImageData.data[i * 4 + 1] = value;
        binarizedImageData.data[i * 4 + 2] = value;
        binarizedImageData.data[i * 4 + 3] = 255;
    }

    binarizedCtx.putImageData(binarizedImageData, 0, 0);
}

/**
 * Nakłada obraz grayscale na binarizowany obraz i aktualizuje canvas z wynikiem.
 * @function
 */
function overlayGrayscale () {
    const imageLength = imageWidth * imageHeight * 4;

    if (!grayscalePointer || !binaryPointer) {
        return alert("Najpierw załaduj obraz i wykonaj binaryzację.");
    }

    const resultPointer = _malloc(imageLength);

    const _overlayGray = cwrap('overlayGray', null, ['number', 'number', 'number', 'number']);
    _overlayGray(grayscalePointer, binaryPointer, resultPointer, imageLength);

    const overlayCtx = document.getElementById('overlayCanvas').getContext('2d');
    const overlayImageData = overlayCtx.createImageData(imageWidth, imageHeight);

    const binaryData = new Uint8Array(module.HEAPU8.buffer, resultPointer, imageLength);
    for (let i = 0; i < binaryData.length; i++) {
        const value = binaryData[i];
        overlayImageData.data[i] = value;
    }

    overlayCtx.putImageData(overlayImageData, 0, 0);

    _free(resultPointer);
}

/**
 * Nakłada binarizowany obraz na oryginalny obraz i aktualizuje canvas z wynikiem.
 * @function
 */
function overlayOriginal() {
    const imageLength = imageWidth * imageHeight * 4;

    if (!window.imagePointer || !binaryPointer) {
        return alert("Najpierw załaduj obraz i wykonaj binaryzację.");
    }

    const resultPointer = _malloc(imageLength);

    const _overlayImages = cwrap('overlayImages', null, ['number', 'number', 'number', 'number']);
    _overlayImages(window.imagePointer, binaryPointer, resultPointer, imageLength);

    const overlayCtx = document.getElementById('overlayCanvas').getContext('2d');
    const overlayImageData = overlayCtx.createImageData(imageWidth, imageHeight);

    const binaryData = new Uint8Array(module.HEAPU8.buffer, resultPointer, imageLength);
    for (let i = 0; i < binaryData.length; i++) {
        const value = binaryData[i];
        overlayImageData.data[i] = value;
    }

    overlayCtx.putImageData(overlayImageData, 0, 0);

    _free(resultPointer);
}

/**
 * Renderuje oryginalny obraz na kilku canvasach.
 * Ustawia odpowiednie rozmiary wszystkich kanw.
 * @function
 * @param {HTMLImageElement} image Obraz, który ma zostać wyrenderowany.
 */
function renderOriginalCanvas(image) {
    const originalCanvas = document.getElementById('originalCanvas');
    const grayscaleCanvas = document.getElementById('grayscaleCanvas');
    const binarizedCanvas = document.getElementById('binarizedCanvas');
    const overlayCanvas = document.getElementById('overlayCanvas');

    originalCanvas.width = grayscaleCanvas.width = binarizedCanvas.width = overlayCanvas.width = image.width;
    originalCanvas.height = grayscaleCanvas.height = binarizedCanvas.height = overlayCanvas.height = image.height;

    const ctx = originalCanvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
}

document.getElementById('fileInput').addEventListener('change',  loadFile);
document.getElementById('grayscaleBtn').addEventListener('click', imageToGrayscale);
document.getElementById('binarizeBtn').addEventListener('click', binarize);
document.getElementById('overlayBtnGrayScale').addEventListener('click', overlayGrayscale);
document.getElementById('overlayBtn').addEventListener('click', overlayOriginal);


const checkboxes = [
    { checkboxId: 'showOriginal', canvasId: 'originalCanvas' },
    { checkboxId: 'showGrayscale', canvasId: 'grayscaleCanvas' },
    { checkboxId: 'showBinarized', canvasId: 'binarizedCanvas' },
    { checkboxId: 'showOverlay', canvasId: 'overlayCanvas' },
];

checkboxes.forEach(({ checkboxId, canvasId }) => {
    const checkbox = document.getElementById(checkboxId);
    const canvas = document.getElementById(canvasId);
    checkbox.addEventListener('change', () => {
        canvas.style.display = checkbox.checked ? 'block' : 'none';
    });
});

const canvasContainer = document.getElementById('canvas_container');
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');

btnLeft.addEventListener('click', () => {
    canvasContainer.scrollBy({
        left: -imageWidth || -500,
        behavior: 'smooth'
    });
});

btnRight.addEventListener('click', () => {
    canvasContainer.scrollBy({
        left: imageWidth || 500,
        behavior: 'smooth'
    });
});
