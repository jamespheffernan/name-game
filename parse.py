import os
import fitz  # PyMuPDF

def match_images_to_names_and_save(pdf_path, output_img_dir="extracted_images"):
    """
    Extracts images from the PDF using get_images(), saves them, and attempts to match each
    image to the name text block that appears directly underneath it.
    
    Returns a list of dicts with:
      {
        "page": int,
        "image_bbox": tuple,
        "image_path": str,
        "matched_text": str
      }
    """
    os.makedirs(output_img_dir, exist_ok=True)

    doc = fitz.open(pdf_path)
    results = []

    for page_index in range(len(doc)):
        page = doc[page_index]
        print(f"\nProcessing Page {page_index}")

        # Step 1: extract all text blocks
        text_blocks = []
        rawdict = page.get_text("rawdict")
        for block in rawdict["blocks"]:
            if block["type"] == 0:  # text
                combined_text = []
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        if "text" in span:
                            combined_text.append(span["text"])
                text_str = " ".join(combined_text).strip()
                if text_str:
                    text_blocks.append({
                        "bbox": block["bbox"],
                        "text": text_str
                    })

        # Step 2: extract all images using get_images()
        image_list = page.get_images(full=True)
        print(f"  Found {len(image_list)} images on page")

        for img_index, img in enumerate(image_list):
            xref = img[0]
            image_filename = f"page{page_index}_img{img_index}.png"
            image_filepath = os.path.join(output_img_dir, image_filename)

            # Save image
            pix = fitz.Pixmap(doc, xref)
            if pix.n > 4:
                pix = fitz.Pixmap(fitz.csRGB, pix)  # handle CMYK
            pix.save(image_filepath)

            # No bbox info available via get_images, so use rough heuristics
            matched_text = ""  # fallback

            if text_blocks:
                # Use vertical position of image (if available via img[7]) — not always reliable
                img_y = img[7] if len(img) > 7 else 0

                best_dist = float('inf')
                for tb in text_blocks:
                    tb_top_y = tb["bbox"][1]
                    if tb_top_y >= img_y:
                        dist = tb_top_y - img_y
                        if dist < best_dist:
                            best_dist = dist
                            matched_text = tb["text"]

            results.append({
                "page": page_index,
                "image_path": image_filepath,
                "image_bbox": None,
                "matched_text": matched_text
            })

    return results


if __name__ == "__main__":
    pdf_file = "MBA_Profile_Book_2024-25.pdf"
    pairs = match_images_to_names_and_save(pdf_file)

    print("\n--- Results ---\n")
    for p in pairs:
        print(f"Page {p['page']}:")
        print(f"  Image file: {p['image_path']}")
        print(f"  Matched text: {p['matched_text']}\n")