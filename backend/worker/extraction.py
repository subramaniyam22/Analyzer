import fitz  # PyMuPDF
import docx
import pandas as pd
from PIL import Image
import pytesseract
import io
import os

def extract_text_from_pdf(file_bytes):
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    
    # If text is too short, try OCR
    if len(text.strip()) < 100:
        text = ""
        for page in doc:
            pix = page.get_pixmap()
            img = Image.open(io.BytesIO(pix.tobytes()))
            text += pytesseract.image_to_string(img)
    return text

def extract_text_from_docx(file_bytes):
    doc = docx.Document(io.BytesIO(file_bytes))
    return "\n".join([para.text for para in doc.paragraphs])

def extract_text_from_xlsx(file_bytes):
    df_dict = pd.read_excel(io.BytesIO(file_bytes), sheet_name=None)
    text = ""
    for sheet_name, df in df_dict.items():
        text += f"Sheet: {sheet_name}\n"
        text += df.to_string() + "\n\n"
    return text

def extract_text_from_image(file_bytes):
    img = Image.open(io.BytesIO(file_bytes))
    return pytesseract.image_to_string(img)

def extract_content(file_bytes, content_type, filename):
    ext = os.path.splitext(filename)[1].lower()
    
    if ext == ".pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in [".docx", ".doc"]:
        return extract_text_from_docx(file_bytes)
    elif ext in [".xlsx", ".xls"]:
        return extract_text_from_xlsx(file_bytes)
    elif ext in [".png", ".jpg", ".jpeg", ".webp"]:
        return extract_text_from_image(file_bytes)
    else:
        return "Unsupported file type"
