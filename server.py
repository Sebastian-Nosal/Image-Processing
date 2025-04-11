"""
server.py
---------

Lokalny serwer HTTP dla aplikacji WebAssembly i dokumentacji Doxygen.

Funkcje:
- Serwowanie plików statycznych (HTML, JS, WASM, CSS)
- Ustawienie poprawnego MIME-type dla plików .wasm
- Udostępnienie dokumentacji Doxygen pod ścieżką /docs
- Obsługa błędów i zatrzymywanie serwera

Uruchomienie:
    $ python server.py

Serwer dostępny pod adresem:
    http://localhost:8000

Wymagania:
- Python 3.7+
"""

import http.server
import socketserver
import sys
import os

PORT = 8000
DIRECTORY = "."

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """
    Rozszerzona obsługa HTTP z poprawnym ustawieniem MIME-type dla plików .wasm
    oraz specjalną obsługą ścieżki /docs dla dokumentacji Doxygen.

    Dziedziczy:
        http.server.SimpleHTTPRequestHandler

    Atrybuty:
        directory (str): katalog bazowy dla serwowanych plików.
    """

    def __init__(self, *args, **kwargs):
        """
        Inicjalizuje handler HTTP z własnym katalogiem serwowania.

        Args:
            *args: Argumenty pozycyjne przekazywane do klasy bazowej.
            **kwargs: Argumenty nazwane przekazywane do klasy bazowej.
        """
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def translate_path(self, path):
        """
        Tłumaczy żądaną ścieżkę URL na lokalną ścieżkę pliku.

        Specjalne zachowanie:
        - Jeśli URL zaczyna się od /docs, automatycznie przekierowuje
          do katalogu 'docs/html'.

        Args:
            path (str): Żądana ścieżka URL.

        Returns:
            str: Lokalna ścieżka pliku na dysku.
        """
        if path.startswith('/docs'):
            path = path.replace('/docs', '/docs/html', 1)
        return super().translate_path(path)

    def end_headers(self):
        """
        Dodaje dodatkowe nagłówki HTTP przed zakończeniem odpowiedzi.

        Jeśli serwowany plik ma rozszerzenie '.wasm', ustawia Content-Type
        na 'application/wasm'.
        """
        if self.path.endswith(".wasm"):
            self.send_header("Content-Type", "application/wasm")
        super().end_headers()

def run_server():
    """
    Uruchamia lokalny serwer HTTP na określonym porcie.

    Obsługuje KeyboardInterrupt i błędy związane z portem.

    Raises:
        SystemExit: w przypadku błędu lub zatrzymania przez użytkownika.
    """
    try:
        with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
            print(f"✅ Serwer wystartował: http://localhost:{PORT}")
            print("📂 Serwowany katalog:", os.path.abspath(DIRECTORY))
            print("🛑 Naciśnij CTRL+C, aby zatrzymać serwer.")
            httpd.serve_forever()
    except OSError as e:
        print(f"❌ Błąd: Nie można uruchomić serwera na porcie {PORT}: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Serwer zatrzymany przez użytkownika.")
        sys.exit(0)

if __name__ == "__main__":
    run_server()
