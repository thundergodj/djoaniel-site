from pathlib import Path
import sys

import pdfplumber


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: extract_cv.py INPUT.pdf OUTPUT.txt")

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    sections: list[str] = []

    with pdfplumber.open(input_path) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            text = page.extract_text(layout=True) or ""
            sections.append(f"===== PAGE {page_number} =====\n{text.rstrip()}\n")

    output_path.write_text("\n".join(sections), encoding="utf-8")


if __name__ == "__main__":
    main()
