/**
 * @file image_processing.cpp
 * @brief Zestaw funkcji do podstawowego przetwarzania obrazów w C++.
 *
 * Funkcje umożliwiają:
 * - Nakładanie obrazu zbinaryzowanego na oryginał
 * - Nakładanie obrazu zbinaryzowanego na skalę szarości
 *
 * @author Sebastian Nosal
 * @date 04.2025
 */

 #include <stdint.h>
 #include <stdlib.h>
 #include <cmath>
 
extern "C" {
/**
  * @brief Nakłada maskę binarną na obraz kolorowy.
  * 
  * Piksle oznaczone jako 0 są zamalowane na czarno, inne zostają bez zmian.
  *
  * @param image Wskaźnik na dane obrazu RGBA.
  * @param binarized Wskaźnik na dane obrazu binarnego.
  * @param result Wskaźnik na wynikowy obraz RGBA.
  * @param length Liczba bajtów w obrazie (liczba pikseli × 4).
  */
 void overlayImages(const uint8_t* image, const uint8_t* binarized, uint8_t* result, size_t length) {
  for (size_t i = 0; i < length; i += 4) {
      if (binarized[i/4] == 0) {
          result[i] = 0;
          result[i + 1] = 0;
          result[i + 2] = 0;
          result[i + 3] = 255; 
      } else {
          result[i] = image[i];
          result[i + 1] = image[i + 1];
          result[i + 2] = image[i + 2];
          result[i + 3] = image[i + 3];
      }
  }
}

/**
* @brief Nakłada obraz binarny na oryginalny, tworząc efekt półprzezroczysty odcieni szarości.
* 
* @param image Wskaźnik na dane oryginalnego obrazu.
* @param binarized Wskaźnik na dane obrazu binarnego.
* @param result Wskaźnik na wynikowy obraz RGBA w skali szarości.
* @param length Liczba bajtów w obrazie (liczba pikseli × 4).
*/
void overlayGray(const uint8_t* image, const uint8_t* binarized, uint8_t* result, size_t length) {
  for (size_t i = 0; i < length; i += 4) {
      int j = i/4;
      int value = (binarized[j]+image[j])/2;
      result[i] = value ;
      result[i + 1] = value;
      result[i + 2] = value;
      result[i + 3] = 255; 
  }
}
}
