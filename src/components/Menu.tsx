import { useRef, useState } from 'react';
import { addDescription, addImage, clearImages, setSize } from '../store/imageSlice';
import { useDispatch } from 'react-redux';
import useImageProccesing from '../lib/wasm';

const Menu = () => {
  const [activeTab, setActiveTab] = useState(1);
  const dispatch = useDispatch()
  const {grayscale, binarizate} = useImageProccesing();
  const globalThresholdSlider = useRef<HTMLInputElement>(null);
  const chunkSizeSlider = useRef<HTMLInputElement>(null);
  const chunkOverlaySlider = useRef<HTMLInputElement>(null);

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(clearImages())
    const file = event.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.error('Brak kontekstu 2D');
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      canvas.remove()
      dispatch(addImage(imageData));
      dispatch(setSize({ width: img.width, height: img.height }));
      dispatch(addDescription(`Original Image`))

    };

    reader.readAsDataURL(file);
  };

  const handleGrayscale = () => {
    dispatch(addDescription(`Grayscale`));
    grayscale()
    if(globalThresholdSlider.current) {
      globalThresholdSlider.current.value = binarizate.threshold.toString()
    }
  }

  const handleGlobalThreshold = () => {
    if(globalThresholdSlider.current) {
      const threshold:number = globalThresholdSlider.current.valueAsNumber
      binarizate.globalOtsu(threshold)
      dispatch(addDescription(`Binarization global threshold: ${threshold}`))
    }
  }

  const handleLocalThreshold = () => {
    if(chunkSizeSlider.current&&chunkOverlaySlider.current)
    {
      const chunkSize = parseInt(chunkSizeSlider.current.value);
      const chunkOverlay = parseInt(chunkOverlaySlider.current.value);
      binarizate.localOtsu(chunkSize,chunkOverlay);
      dispatch(addDescription(`Binarization size:${chunkSize} overlay:${chunkOverlay}`))
    }
    
   
  }
  return (
    <div className=" bg-zinc-700 text-white h-[100vh] w-1/5 right-0 relative ">
      <div className="flex p-0">
        <button onClick={() => setActiveTab(1)} className={`${activeTab==1? 'bg-zinc-700':'bg-zinc-800 shadow-md shadow-zinc-800'} p-4`} >Adjustments</button>
        <button onClick={() => setActiveTab(2)} className={`${activeTab==2? 'bg-zinc-700':'bg-zinc-800 shadow-md shadow-zinc-800'} p-4`} >Binarization</button>
        <button onClick={() => setActiveTab(3)} className={`${activeTab==3? 'bg-zinc-700':'bg-zinc-800 shadow-md shadow-zinc-800'} p-4`} >File</button>
      </div>
      <div className="p-4">
      {activeTab === 1 && (
        <div>
          <div className='flex flex-col'>
            <label>Red Saturation</label>
            <div className='flex space-x-2 justify-center'>
              <button type="button">-</button>
              <input type="range" min="0" max="255" />
              <button type='button'>+</button>
            </div>
          </div>
          <div className='flex flex-col w-full'>
            <label>Green Saturation</label>
            <div className='flex space-x-2 justify-center'>
              <button type="button">-</button>
              <input type="range" min="0" max="255" />
              <button type='button'>+</button>
            </div>          </div>
          <div className='flex flex-col'>
            <label>Blue Saturation</label>
            <div className='flex space-x-2 justify-center'>
              <button type="button">-</button>
              <input type="range" min="0" max="255" />
              <button type='button'>+</button>
            </div>          </div>
          <div className='flex flex-col'>
            <label>Contrast</label>
            <div className='flex space-x-2 justify-center'>
              <button type="button">-</button>
              <input type="range" min="0" max="255" />
              <button type='button'>+</button>
            </div>          </div>
          <div className='flex flex-col'>
            <label>Brightness</label>
            <div className='flex space-x-2 justify-center'>
              <button type="button">-</button>
              <input type="range" min="0" max="255" />
              <button type='button'>+</button>
            </div>          </div>
          <div className='flex flex-col'>
            <label>Gamma</label>
            <div className='flex space-x-2 justify-center'>
              <button type="button">-</button>
              <input type="range" min="0" max="255" />
              <button type='button'>+</button>
            </div>         
          </div>
          <button>Commit</button>
        </div>
      )}

      {activeTab === 2 && (
        <div>
          <button onClick={handleGlobalThreshold }>Global Threshold Binarize</button>
          <div>
            <label>Threshold</label>
            <input ref={globalThresholdSlider} type="range" min="0" max="255" />
          </div>
          <button onClick={handleLocalThreshold}>Otsu (local chunks)</button>
          <div>
            <label>Chunks' Size</label>
            <input ref={chunkSizeSlider} type="range" min="1" max="400" defaultValue={"1"} />
          </div>
          <div>
            <label>Chunk Overlap</label>
            <input ref={chunkOverlaySlider} type="range" min="0" max="200" defaultValue={"1"} />
          </div>
          <button>Adaptive Binarization  - Bradley's Method</button>
          <button>Adaptive Binarization  - Sauvola Method</button>
        </div>
      )}

      {activeTab === 3 && (
        <div className="flex flex-col items-start gap-4">
          <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded">
            Upload Image
            <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
          </label>
          <button>Crop</button>
          <button>Perspective</button>
          <button onClick={handleGrayscale}>Grayscale</button>
        </div>
      )}
      </div>

      <div className="absolute bottom-5 w-full flex justify-center right-0 ">
        <button className="w-[30px] h-[30px] bg-zinc-800 border-white border mx-2 hover:bg-zinc-600" onClick={()=>setActiveTab(1)}>1</button>
        <button className="w-[30px] h-[30px] bg-zinc-800 border-white border mx-2 hover:bg-zinc-600"onClick={()=>setActiveTab(2)}>2</button>
        <button className="w-[30px] h-[30px] bg-zinc-800 border-white border mx-2 hover:bg-zinc-600"onClick={()=>setActiveTab(3)}>3</button>
      </div>
      
    </div>)
};

export default Menu;


