import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ImageDataState {
  images: ImageData[]; 
  width: number;
  height: number;
  descriptions: string[]
}

const initialState: ImageDataState = {
  images: [],
  width: 0,
  height: 0,
  descriptions: []
};

export const imagDataSlice = createSlice({
  name: 'imagePointers',
  initialState,
  reducers: {
    addImage(state, action: PayloadAction<ImageData>) {
      state.images = [...state.images, action.payload];
    },
    clearImages(state) {
      state.images = [];
    },
    setSize(state, action: PayloadAction<{ width: number; height: number }>) {
      state.width = action.payload.width;
      state.height = action.payload.height;
    },
    addDescription(state, action:PayloadAction<string>) {
      state.descriptions?.push(action.payload)
    },
    removeNth(state,action:PayloadAction<{idx:number}>) {
      if(state.descriptions){
        state.descriptions.splice(action.payload.idx,1)
        state.descriptions = [...state.descriptions]
      } 
      state.images.splice(action.payload.idx,1);
      state.images = [...state.images]
    }
  }
});

export const { addImage, clearImages, setSize,removeNth,addDescription } = imagDataSlice.actions;
export default imagDataSlice.reducer;
