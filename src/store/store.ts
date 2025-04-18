import { configureStore } from '@reduxjs/toolkit';
import imageData, { ImageDataState } from './imageSlice';

export const store = configureStore({
  reducer: {
    imageData: imageData,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type StoreType = {
  imageData: ImageDataState
}