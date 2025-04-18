/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { useEffect, useState } from 'react';
import ImageProcessor from '../image_processing.js';
import {  useSelector } from 'react-redux';
import { StoreType } from '../store/store.js';
import { Uint8Array2ImageData } from './utils.js';

interface WasmModule
{
  cwrap: Function;
  _malloc: Function;
  _free: Function;
  HEAPU8: Uint8Array
}

let module:WasmModule;

export default function useImageProccesing() {
  const [globalThreshold,setGlobalThreshold] = useState<number>(0)
  const [grayscale,setGrayscale] = useState<Uint8Array>()
  const {height,width,images} = useSelector((state:StoreType)=>state.imageData)

  async function loadModule() {
    if (!module) {
      module = await ImageProcessor();
      console.log(module);
      
    }
  }

  function toGrayscale() {
    if(module){
      const size = width * height * 4;
      const toGrayscale = module.cwrap('toGrayscale', null, ['number', 'number', 'number']);
      const imagePointer = module._malloc(images[0].data.length)
      const grayscalePointer = module._malloc(width * height)
      module.HEAPU8?.set(images[0].data, imagePointer)
      toGrayscale(imagePointer, grayscalePointer, size);
      const grayscaleData = new Uint8Array(module.HEAPU8.buffer, grayscalePointer, size / 4);
      setGrayscale(grayscaleData)
      const result = Uint8Array2ImageData(grayscaleData,width,height)
      const otsuThreshold = module.cwrap('otsuThreshold', 'number', ['number', 'number']);
      setGlobalThreshold(otsuThreshold(grayscalePointer, grayscaleData.length));
      module._free(imagePointer);
      module._free(grayscalePointer);
      return result
    }
  }

  function binarizeWithGlobalThreshold(threshold:number) {
    if(module && grayscale){
      const grayscalePointer = module._malloc(width * height)
      const binarize = module.cwrap('binarize', null, ['number', 'number', 'number', 'number']);
      const binaryPointer = module._malloc(width*height)
      module.HEAPU8.set(grayscale,grayscalePointer);
      const binaryLength = width* height;
      binarize(grayscalePointer,binaryPointer,binaryLength,threshold);
      const binaryData = new Uint8Array(module.HEAPU8.buffer, binaryPointer, binaryLength);
      const result = Uint8Array2ImageData(binaryData,width,height);
      module._free(grayscalePointer);
      module._free(binaryPointer)
      return result
    }
    
  }
  
  function binarizeWithLocalOtsuThresholds(chunkSize:number,chunkOverlay:number) {
    if(module && grayscale) {

      const grayscalePointer = module._malloc(width * height)
      const binarize = module.cwrap('binarizeWithLocalOtsu', null, ['number', 'number', 'number', 'number', 'number', 'number']);
      const binaryPointer = module._malloc(width*height)
      module.HEAPU8.set(grayscale,grayscalePointer);

      const binaryLength = width* height;
      binarize(grayscalePointer,binaryPointer,width,height,chunkSize,chunkOverlay);

      const binaryData = new Uint8Array(module.HEAPU8.buffer, binaryPointer, binaryLength);
      const result = Uint8Array2ImageData(binaryData,width,height);

      module._free(grayscalePointer);
      module._free(binaryPointer)
      return result
    }
  }

  function binarizeByBradley() {

  }

  function binarizeBySauvola() {

  }

  function adjustRedSaturation(difference:number) {
    const image = images[0];
    
  }

  function adjustBlueSaturation(difference:number) {

  }

  function adjustGreenSaturaion(difference:number) {

  }

  function adjustBrightness(difference:number) {

  }

  function adjustGamma(difference:number) {

  }

  function adjustContrast(difference:number) {

  }

  useEffect(()=>{
    loadModule()
  },[])



  return {
    grayscale: toGrayscale,
    binarizate: {
      threshold: globalThreshold,
      globalOtsu: binarizeWithGlobalThreshold,
      localOtsu: binarizeWithLocalOtsuThresholds,
      bradley: binarizeByBradley,
      sauvola: binarizeBySauvola,
    },
    adjust: {
      red: adjustRedSaturation,
      blue: adjustBlueSaturation,
      green: adjustGreenSaturaion,
      brightnes: adjustBrightness,
      gamma: adjustGamma,
      contrast: adjustContrast,
    }
  }
}