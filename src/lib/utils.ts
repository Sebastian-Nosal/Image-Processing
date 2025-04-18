import { addImage } from "../store/imageSlice";
import { store } from "../store/store";

export function Uint8Array2ImageData(array:Uint8Array,width:number,height:number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    console.error('Brak kontekstu 2D');
    return null;
  }

  const imageData = ctx.createImageData(width, height);

  if(array.length==width*height) {
    for (let i = 0; i < array.length; i++) {
      const grayValue = array[i];
      imageData.data[i * 4] = grayValue;
      imageData.data[i * 4 + 1] = grayValue;
      imageData.data[i * 4 + 2] = grayValue;
      imageData.data[i * 4 + 3] = 255;
    }
  }
  else if(array.length==width*height*4) {
    for (let i = 0; i < array.length; i++) {
      imageData.data[i ] = array[i];

    }
  }
  
  store.dispatch(addImage(imageData))
  return imageData;
}