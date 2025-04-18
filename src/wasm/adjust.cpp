/**
 * @file adjust.cpp
 * @brief Zestaw funkcji do podstawowego przetwarzania obrazów w C++.
 *
 * Funkcje umożliwiają:
 * - Zmianę nasycenia koloru czerwonego, zielonego lub niebieskiego.
 * - Zmianę gammy
 * - Zmianę kontrastu
 * - Zmianę jasności
 *
 * @author Sebastian Nosal
 * @date 04.2025
 */

 #include <stdint.h>
 #include <stdlib.h>
 #include <cmath>
 
 extern "C" {
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