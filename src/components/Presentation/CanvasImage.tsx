import { useEffect, useRef } from 'react';

interface Props {
  image: ImageData;
  height: number;
  width: number;
  description?: string
}

const CanvasImage = ({ image, height,width,description }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current && image) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.putImageData(image, 0, 0);
      }
    }
  }, [image]);

  return <div className='m-5 relative'>
    <div className="bottom-0 left-0 right-0 bg-zinc-700 text-zinc-100 text-2xl p-2 px-6 font-bold whitespace-break-spaces">{description}</div>
    <canvas ref={canvasRef} className="border block max-w-[49vw] " />
  </div>;
};

export default CanvasImage;
