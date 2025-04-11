/**
 * @file image_processing.cpp
 * @brief Zestaw funkcji do podstawowego przetwarzania obrazów w C++.
 *
 * Funkcje umożliwiają:
 * - Konwersję obrazu na odcienie szarości,
 * - Wyznaczenie progu binarnego metodą Otsu,
 * - Binarizację obrazu,
 * - Nakładanie binarnego maskowania na obraz kolorowy,
 * - Zmianę nasycenia koloru czerwonego, zielonego lub niebieskiego.
 *
 * @author 
 * @date 2025
 */

#include <stdint.h>
#include <stdlib.h>
#include <cmath>

extern "C" {

/**
 * @brief Oblicza optymalny próg binarizacji obrazu metodą Otsu.
 * 
 * @param grayscale Wskaźnik na dane obrazu w skali szarości.
 * @param length Liczba pikseli w obrazie.
 * @return Optymalny próg binarizacji (0-255).
 */
int otsuThreshold(const uint8_t* grayscale, size_t length) {
    int histogram[256] = {0};
    for (size_t i = 0; i < length; i++) {
        histogram[grayscale[i]]++;
    }

    int total = length;
    float sum = 0;
    for (int i = 0; i < 256; i++) {
        sum += i * histogram[i];
    }

    float sumB = 0;
    int wB = 0, wF = 0;
    float maxVariance = 0;
    int threshold = 0;

    for (int i = 0; i < 256; i++) {
        wB += histogram[i];
        if (wB == 0) continue;
        wF = total - wB;
        if (wF == 0) break;

        sumB += i * histogram[i];
        float mB = sumB / wB;
        float mF = (sum - sumB) / wF;

        float variance = wB * wF * std::pow(mB - mF, 2);
        if (variance > maxVariance) {
            maxVariance = variance;
            threshold = i;
        }
    }

    return threshold;
}

/**
 * @brief Konwertuje obraz RGBA na skalę szarości.
 * 
 * @param image Wskaźnik na dane obrazu RGBA.
 * @param grayscale Wskaźnik na wyjściową tablicę odcieni szarości.
 * @param length Liczba bajtów w obrazie (liczba pikseli × 4).
 */
void toGrayscale(const uint8_t* image, uint8_t* grayscale, size_t length) {
  size_t pixelCount = length / 4;
  for (size_t i = 0; i < pixelCount; i++) {
      size_t pixelIndex = i * 4;
      uint8_t r = image[pixelIndex];
      uint8_t g = image[pixelIndex + 1];
      uint8_t b = image[pixelIndex + 2];
      grayscale[i] = static_cast<uint8_t>(0.299 * r + 0.587 * g + 0.114 * b);
  }
}

/**
 * @brief Binarizuje obraz na podstawie ustalonego progu.
 * 
 * @param grayscale Wskaźnik na dane obrazu w skali szarości.
 * @param binary Wskaźnik na wyjściowy obraz binarny (0 lub 255).
 * @param length Liczba pikseli w obrazie.
 * @param threshold Próg binarizacji.
 */
void binarize(const uint8_t* grayscale, uint8_t* binary, size_t length, int threshold) {
    for (size_t i = 0; i < length; i++) {
        binary[i] = (grayscale[i] > threshold) ? 255 : 0;
    }
}

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


/**
 * @brief Modyfikuje nasycenie kanału czerwonego (R) w obrazie RGBA.
 * 
 * @param image Wskaźnik na dane obrazu RGBA.
 * @param length Liczba bajtów w obrazie.
 * @param difference Wartość do dodania do kanału czerwonego.
 */
void adjustRedSaturation(uint8_t* image,size_t length, int difference) {
    for(size_t i=0; i<length; i+=4) {
        int tmp = image[i];
        tmp +=difference;
        if(tmp) tmp = 0;
        else if(tmp) tmp = 255;
        image[i] = (uint8_t)tmp;
    }
}

/**
 * @brief Modyfikuje nasycenie kanału zielonego (G) w obrazie RGBA.
 * 
 * @param image Wskaźnik na dane obrazu RGBA.
 * @param length Liczba bajtów w obrazie.
 * @param difference Wartość do dodania do kanału zielonego.
 */
void adjustGreenSaturation(uint8_t* image,size_t length, int difference) {
    for(size_t i=1; i<length; i+=4) {
        int tmp = image[i];
        tmp +=difference;
        if(tmp) tmp = 0;
        else if(tmp) tmp = 255;
        image[i] = (uint8_t)tmp;
    }
}

/**
 * @brief Modyfikuje nasycenie kanału niebieskiego (B) w obrazie RGBA.
 * 
 * @param image Wskaźnik na dane obrazu RGBA.
 * @param length Liczba bajtów w obrazie.
 * @param difference Wartość do dodania do kanału niebieskiego.
 */
void adjustBlueSaturation(uint8_t* image,size_t length, int difference) {
    for(size_t i=2; i<length; i+=4) {
        int tmp = image[i];
        tmp +=difference;
        if(tmp) tmp = 0;
        else if(tmp) tmp = 255;
        image[i] = (uint8_t)tmp;
    }
}
}