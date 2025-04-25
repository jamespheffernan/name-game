import fitz  # PyMuPDF

def extract_names_by_fontsize(pdf_path):
    doc = fitz.open(pdf_path)
    name_data = []

    for page_index in range(len(doc)):
        page = doc[page_index]
        blocks = page.get_text("dict")["blocks"]

        candidates = []

        for block in blocks:
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    if "text" not in span or not span["text"].strip():
                        continue
                    font_size = span["size"]
                    text = span["text"].strip()
                    bbox = span["bbox"]
                    candidates.append({
                        "text": text,
                        "size": font_size,
                        "bbox": bbox,
                    })

        # Heuristic: top ~244 font sizes (based on name count) or top percentile
        if not candidates:
            continue

        # Determine name font size by finding the mode of top N sizes
        candidates.sort(key=lambda x: -x["size"])
        top_sizes = [c["size"] for c in candidates[:300]]
        name_font_threshold = min(top_sizes)

        # Extract only text with that large font
        name_spans = [c for c in candidates if c["size"] >= name_font_threshold]

        # Sort visually: top-to-bottom, then left-to-right
        name_spans.sort(key=lambda b: (round(b["bbox"][1] / 10) * 10, b["bbox"][0]))

        names_on_page = [n["text"] for n in name_spans]
        name_data.append({
            "page": page_index,
            "names": names_on_page
        })

    return name_data


if __name__ == "__main__":
    pdf_file = "MBA_Profile_Book_2024-25.pdf"
    pages = extract_names_by_fontsize(pdf_file)

    print("\n--- Extracted Names ---\n")
    for p in pages:
        print(f"Page {p['page']}:")
        for idx, name in enumerate(p["names"]):
            print(f"  {idx+1:02d}: {name}")