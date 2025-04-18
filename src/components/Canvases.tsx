import { useSelector } from 'react-redux';
import { StoreType } from '../store/store';
import CanvasImage from './Presentation/CanvasImage';

const Canvases = () => {
  const {images, height, width,descriptions} = useSelector((state:StoreType) => state.imageData);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('canvasContainer');
    if (container) {
      container.scrollBy({
        left: direction === 'left' ? -500 : 500,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div>
      <div className="flex absolute bottom-5 left-[45%] right-[45%] justify-center gap-2 ">
        <button onClick={() => handleScroll('left')}>Left</button>
        <span> {images.length}</span>
        <button onClick={() => handleScroll('right')}>Right</button>
      </div>

      <div id="canvasContainer" className=" max-w-[80vw] flex w-[80vw] h-full p-6 pb-12 overflow-hidden whitespace-nowrap">
        
          {images.map((image:ImageData, index:number) => (
          (
            <CanvasImage key={index} image={image} height={height} width={width} description={`${index+1}) `+descriptions[index]}/>          
          )
        ))}
        
      </div>
    </div>
  );
};

export default Canvases;
