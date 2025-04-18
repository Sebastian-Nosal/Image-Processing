/**
 * @file binarization.cpp
 * @brief Zestaw funkcji do podstawowego przetwarzania obrazów w C++.
 *
 * Funkcje umożliwiają:
 * - Konwersję obrazu na odcienie szarości,
 * - Wyznaczenie progu binarnego metodą Otsu,
 * - Binarizację obrazu za pomocą progu globalnego,
 * - Binaryzację obrazu za pomocą metody otsu z podziałem na fragmenty
 * - Binaryzację metodą Bradley'a
 * - Binaryzację metodą Sauvola
 *
 * @author Sebastian Nosal
 * @date 04.2025
 */

#include <stdint.h>
#include <stdlib.h>
#include <cmath>

#define MIN(a, b) (((a) < (b)) ? (a) : (b))
#define MAX(a, b) (((a) > (b)) ? (a) : (b))

extern "C"
{

    /**
     * @brief Oblicza optymalny próg binarizacji obrazu metodą Otsu.
     *
     * @param grayscale Wskaźnik na dane obrazu w skali szarości.
     * @param length Liczba pikseli w obrazie.
     * @return Optymalny próg binarizacji (0-255) wg. metody Otsu.
     */
    int otsuThreshold(const uint8_t *grayscale, size_t length)
    {
        int histogram[256] = {0};
        for (size_t i = 0; i < length; i++)
        {
            histogram[grayscale[i]]++;
        }

        int total = length;
        float sum = 0;
        for (int i = 0; i < 256; i++)
        {
            sum += i * histogram[i];
        }

        float sumB = 0;
        int wB = 0, wF = 0;
        float maxVariance = 0;
        int threshold = 0;

        for (int i = 0; i < 256; i++)
        {
            wB += histogram[i];
            if (wB == 0)
                continue;
            wF = total - wB;
            if (wF == 0)
                break;

            sumB += i * histogram[i];
            float mB = sumB / wB;
            float mF = (sum - sumB) / wF;

            float variance = wB * wF * std::pow(mB - mF, 2);
            if (variance > maxVariance)
            {
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
    void toGrayscale(const uint8_t *image, uint8_t *grayscale, size_t length)
    {
        size_t pixelCount = length / 4;
        for (size_t i = 0; i < pixelCount; i++)
        {
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
    void binarize(const uint8_t *grayscale, uint8_t *binary, size_t length, int threshold)
    {
        for (size_t i = 0; i < length; i++)
        {
            binary[i] = (grayscale[i] > threshold) ? 255 : 0;
        }
    }

    /**
     * @brief binaryzuje obraz poprzez podział na nachodzące na siebie chunki dla których obliczany jest próg binaryzacji metodą Otsu
     *
     * @param grayscale Wskaźnik na dane obrazu w skali szarości.
     * @param binary Wskaźnik na wyjściowy obraz binarny (0 lub 255).
     * @param width Szerokość obrazu
     * @param height Wysokość obrazu
     * @param chunkSize Wielkość chunku (chunk jest kwadratem o boku chunkSize)
     * @param chunkOverlay Ilość pikseli wgłąb, na ile przenikają się dwa sąsiadujące chunki
     */
    void binarizeWithLocalOtsu(const uint8_t *grayscale, uint8_t *binary, size_t width, size_t height, unsigned int chunkSize, unsigned int chunkOverlay){
        if (!grayscale || !binary || chunkSize == 0 || width == 0 || height == 0)
            return;

        int stride = (int)width;
        int step = (int)(chunkSize / 2) - (int)chunkOverlay;
        if (step <= 0)
            step = 1;

        int chunksX = (int)(width - chunkSize + step) / step;
        int chunksY = (int)(height - chunkSize + step) / step;

        for (int cy = 0; cy < chunksY; ++cy)
        {
            for (int cx = 0; cx < chunksX; ++cx)
            {
                int startX = cx * step;
                int startY = cy * step;
                int endX = MIN(startX + (int)chunkSize, (int)width);
                int endY = MIN(startY + (int)chunkSize, (int)height);

                int actualWidth = endX - startX;
                int actualHeight = endY - startY;
                int chunkLength = actualWidth * actualHeight;

                uint8_t *chunkData = (uint8_t *)malloc(chunkLength);
                uint8_t *chunkBin = (uint8_t *)malloc(chunkLength);
                if (!chunkData || !chunkBin)
                {
                    free(chunkData);
                    free(chunkBin);
                    return;
                }

                int idx = 0;
                for (int y = startY; y < endY; ++y)
                {
                    for (int x = startX; x < endX; ++x)
                    {
                        if (idx >= chunkLength)
                            break;
                        chunkData[idx++] = grayscale[y * stride + x];
                    }
                }

                int threshold = otsuThreshold(chunkData, chunkLength);
                binarize(chunkData, chunkBin, chunkLength, threshold);

                idx = 0;
                for (int y = startY; y < endY; ++y)
                {
                    for (int x = startX; x < endX; ++x)
                    {
                        if (idx >= chunkLength)
                            break;
                        binary[y * stride + x] = chunkBin[idx++];
                    }
                }

                free(chunkData);
                free(chunkBin);
            }
        }

        if ((width - chunkSize) % step != 0)
        {
            int startX = (int)width - (int)chunkSize;
            for (int cy = 0; cy < chunksY; ++cy)
            {
                int startY = cy * step;
                int endY = MIN(startY + (int)chunkSize, (int)height);

                int actualWidth = (int)width - startX;
                int actualHeight = endY - startY;
                int chunkLength = actualWidth * actualHeight;

                uint8_t *chunkData = (uint8_t *)malloc(chunkLength);
                uint8_t *chunkBin = (uint8_t *)malloc(chunkLength);
                if (!chunkData || !chunkBin)
                {
                    free(chunkData);
                    free(chunkBin);
                    return;
                }

                int idx = 0;
                for (int y = startY; y < endY; ++y)
                {
                    for (int x = startX; x < (int)width; ++x)
                    {
                        if (idx >= chunkLength)
                            break;
                        chunkData[idx++] = grayscale[y * stride + x];
                    }
                }

                int threshold = otsuThreshold(chunkData, chunkLength);
                binarize(chunkData, chunkBin, chunkLength, threshold);

                idx = 0;
                for (int y = startY; y < endY; ++y)
                {
                    for (int x = startX; x < (int)width; ++x)
                    {
                        if (idx >= chunkLength)
                            break;
                        binary[y * stride + x] = chunkBin[idx++];
                    }
                }

                free(chunkData);
                free(chunkBin);
            }
        }

        if ((height - chunkSize) % step != 0)
        {
            int startY = (int)height - (int)chunkSize;
            for (int cx = 0; cx < chunksX; ++cx)
            {
                int startX = cx * step;
                int endX = MIN(startX + (int)chunkSize, (int)width);

                int actualWidth = endX - startX;
                int actualHeight = (int)height - startY;
                int chunkLength = actualWidth * actualHeight;

                uint8_t *chunkData = (uint8_t *)malloc(chunkLength);
                uint8_t *chunkBin = (uint8_t *)malloc(chunkLength);
                if (!chunkData || !chunkBin)
                {
                    free(chunkData);
                    free(chunkBin);
                    return;
                }

                int idx = 0;
                for (int y = startY; y < (int)height; ++y)
                {
                    for (int x = startX; x < endX; ++x)
                    {
                        if (idx >= chunkLength)
                            break;
                        chunkData[idx++] = grayscale[y * stride + x];
                    }
                }

                int threshold = otsuThreshold(chunkData, chunkLength);
                binarize(chunkData, chunkBin, chunkLength, threshold);

                idx = 0;
                for (int y = startY; y < (int)height; ++y)
                {
                    for (int x = startX; x < endX; ++x)
                    {
                        if (idx >= chunkLength)
                            break;
                        binary[y * stride + x] = chunkBin[idx++];
                    }
                }

                free(chunkData);
                free(chunkBin);
            }
        }
    }
}