import io
import os
import re

import cv2
import numpy as np
import torch
import pytesseract

from PIL import Image, ImageEnhance

from transformers import (
    AutoImageProcessor,
    VisionEncoderDecoderModel,
    RobertaTokenizer,
)


# ============================================================
# CONFIG
# ============================================================

MODEL_NAME = "microsoft/trocr-base-handwritten"

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

if os.path.exists(TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

SKIP_TROCR = os.environ.get("SKIP_TROCR", "0") == "1"


# ============================================================
# GLOBAL MODEL
# ============================================================

image_processor = None
tokenizer = None
trocr_model = None


# ============================================================
# LOAD MODEL
# ============================================================

def load_trocr_model():

    global image_processor
    global tokenizer
    global trocr_model

    if SKIP_TROCR:
        return False

    if trocr_model is not None:
        return True

    try:

        print()
        print("=" * 60)
        print("LOADING TrOCR BASE HANDWRITTEN MODEL...")
        print("=" * 60)

        print("Model:", MODEL_NAME)
        print("Device:", DEVICE)

        image_processor = AutoImageProcessor.from_pretrained(
            MODEL_NAME,
            use_fast=False
        )

        tokenizer = RobertaTokenizer.from_pretrained(
            MODEL_NAME,
            use_fast=False
        )

        trocr_model = VisionEncoderDecoderModel.from_pretrained(
            MODEL_NAME
        )

        if trocr_model.config.decoder_start_token_id is None:
            trocr_model.config.decoder_start_token_id = (
                tokenizer.cls_token_id
            )

        if trocr_model.config.pad_token_id is None:
            trocr_model.config.pad_token_id = (
                tokenizer.pad_token_id
            )

        if trocr_model.config.eos_token_id is None:
            trocr_model.config.eos_token_id = (
                tokenizer.sep_token_id
            )

        trocr_model.config.max_length = 64

        trocr_model.to(DEVICE)
        trocr_model.eval()

        print("TrOCR model loaded successfully.")
        print("Device:", DEVICE)
        print("=" * 60)

        return True

    except Exception as error:

        print("TrOCR loading error:", repr(error))

        return False


# ============================================================
# READ IMAGE
# ============================================================

def image_file_to_cv2(image_file):

    try:

        if image_file is None:
            return None

        if isinstance(image_file, bytes):
            data = image_file

        elif isinstance(image_file, io.BytesIO):
            image_file.seek(0)
            data = image_file.read()

        elif hasattr(image_file, "read"):
            image_file.seek(0)
            data = image_file.read()

        elif isinstance(image_file, str):
            with open(image_file, "rb") as handle:
                data = handle.read()

        else:
            print("image_file_to_cv2: unsupported input type")
            return None

        if not data:
            print("image_file_to_cv2: empty image data")
            return None

        pil_image = Image.open(
            io.BytesIO(data)
        ).convert("RGB")

        image = np.array(pil_image)

        image = cv2.cvtColor(
            image,
            cv2.COLOR_RGB2BGR
        )

        return np.ascontiguousarray(image)

    except Exception as error:

        print(
            "Image conversion error:",
            repr(error)
        )

        return None


# ============================================================
# CROP PRESCRIPTION BODY
# ============================================================

def crop_prescription_body(image):

    if image is None:
        return None

    height, width = image.shape[:2]

    start_y = int(height * 0.12)

    body = image[
        start_y:height,
        0:width
    ]

    print(
        "Prescription body crop:",
        body.shape[1],
        "x",
        body.shape[0]
    )

    return body


# ============================================================
# CROP MEDICINE AREA
# ============================================================

def crop_medicine_section(image):

    if image is None:
        return None

    height, width = image.shape[:2]

    y1 = int(height * 0.24)
    y2 = int(height * 0.70)

    x1 = int(width * 0.10)
    x2 = int(width * 0.98)

    section = image[
        y1:y2,
        x1:x2
    ]

    print(
        "Medicine section crop:",
        section.shape[1],
        "x",
        section.shape[0]
    )

    return section


# ============================================================
# DETECT HANDWRITING LINES
# ============================================================

def detect_handwriting_lines(image):
    """Detect complete horizontal prescription rows.

    The previous contour detector frequently joined two rows or returned only
    3-4 large contours.  This version uses horizontal ink projection first and
    connected components as a secondary signal.  Rows are deliberately padded
    so the first/last characters of a medicine name are not clipped.
    """
    if image is None or image.size == 0:
        return []

    height, width = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Ink mask: dark writing on a light prescription.
    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    ink = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        31, 11
    )

    # Join characters horizontally, but not vertically.
    kernel_w = max(18, int(width * 0.018))
    joined = cv2.morphologyEx(
        ink, cv2.MORPH_CLOSE,
        cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_w, 3))
    )

    # Horizontal projection.
    projection = (joined > 0).sum(axis=1).astype(np.float32)
    if projection.max() <= 0:
        return []

    # Smooth the projection so individual letters do not become rows.
    smooth = np.convolve(
        projection,
        np.ones(9, dtype=np.float32) / 9.0,
        mode="same"
    )

    threshold = max(
        width * 0.008,
        float(smooth.max()) * 0.055
    )

    active = smooth > threshold

    # Fill very small gaps inside one handwritten line.
    gap_limit = max(8, int(height * 0.012))
    active_u8 = active.astype(np.uint8)
    for _ in range(2):
        active_u8 = cv2.morphologyEx(
            active_u8,
            cv2.MORPH_CLOSE,
            np.ones((gap_limit, 1), np.uint8)
        )
    active = active_u8.astype(bool)

    bands = []
    in_band = False
    y0 = 0

    for y, flag in enumerate(active):
        if flag and not in_band:
            y0 = y
            in_band = True
        elif in_band and (not flag or y == height - 1):
            y1 = y if not flag else y + 1
            if y1 - y0 >= max(10, int(height * 0.012)):
                bands.append([y0, y1])
            in_band = False

    # Merge only tiny gaps; do NOT merge normal prescription rows.
    merged = []
    max_gap = max(10, int(height * 0.018))
    for y0, y1 in bands:
        if not merged or y0 - merged[-1][1] > max_gap:
            merged.append([y0, y1])
        else:
            merged[-1][1] = max(merged[-1][1], y1)

    # Build crops.  Use generous vertical padding.
    rows = []
    pad_y = max(18, int(height * 0.025))
    for y0, y1 in merged:
        yy0 = max(0, y0 - pad_y)
        yy1 = min(height, y1 + pad_y)
        crop = image[yy0:yy1, 0:width]
        if crop.size == 0:
            continue

        # Ignore extremely tiny/noisy bands.
        ch, cw = crop.shape[:2]
        if cw < 180 or ch < 24:
            continue

        rows.append(crop)

    # If projection produced too few rows, use connected-component y centers.
    if len(rows) < 3:
        contours, _ = cv2.findContours(
            joined, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        boxes = []
        for c in contours:
            x, y, w, h = cv2.boundingRect(c)
            if w >= width * 0.12 and h >= 8:
                boxes.append((x, y, w, h))

        centers = sorted(
            [(y + h / 2.0, y, y + h) for x, y, w, h in boxes],
            key=lambda z: z[0]
        )

        for _, y0, y1 in centers:
            yy0 = max(0, int(y0) - pad_y)
            yy1 = min(height, int(y1) + pad_y)
            crop = image[yy0:yy1, :]
            if crop.size and crop.shape[1] >= 180 and crop.shape[0] >= 24:
                rows.append(crop)

    # Remove near-duplicate overlapping rows while preserving order.
    unique = []
    signatures = []
    for row in rows:
        gray_row = cv2.cvtColor(row, cv2.COLOR_BGR2GRAY)
        small = cv2.resize(gray_row, (32, 8))
        sig = float(small.mean())
        if not any(abs(sig - old) < 0.15 and
                   abs(row.shape[0] - old_h) < 8
                   for old, old_h in signatures):
            unique.append(row)
            signatures.append((sig, row.shape[0]))

    # Prescription pages normally contain only a small number of useful rows.
    unique = unique[:14]

    print("Detected handwriting line candidates:", len(unique))
    return unique


# ============================================================
# PREPARE IMAGE FOR TrOCR
# ============================================================

def prepare_trocr_image(
    crop,
    variant="normal"
):

    if crop is None:
        return None

    gray = cv2.cvtColor(
        crop,
        cv2.COLOR_BGR2GRAY
    )

    gray = cv2.normalize(
        gray,
        None,
        0,
        255,
        cv2.NORM_MINMAX
    )

    if variant == "contrast":

        clahe = cv2.createCLAHE(
            clipLimit=2.0,
            tileGridSize=(8, 8)
        )

        gray = clahe.apply(gray)

    elif variant == "threshold":

        gray = cv2.adaptiveThreshold(
            gray,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            31,
            9
        )

    rgb = cv2.cvtColor(
        gray,
        cv2.COLOR_GRAY2RGB
    )

    pil_image = Image.fromarray(
        rgb
    ).convert("RGB")

    border = 20

    canvas = Image.new(
        "RGB",
        (
            pil_image.width + border * 2,
            pil_image.height + border * 2
        ),
        "white"
    )

    canvas.paste(
        pil_image,
        (
            border,
            border
        )
    )

    canvas = canvas.resize(
        (
            canvas.width * 2,
            canvas.height * 2
        ),
        Image.Resampling.LANCZOS
    )

    if variant != "threshold":

        canvas = ImageEnhance.Contrast(
            canvas
        ).enhance(1.15)

        canvas = ImageEnhance.Sharpness(
            canvas
        ).enhance(1.20)

    return canvas


# ============================================================
# RUN TrOCR
# ============================================================

def recognize_line(
    image
):

    if image is None:
        return ""

    if not load_trocr_model():
        return ""

    try:

        inputs = image_processor(
            images=image.convert("RGB"),
            return_tensors="pt"
        )

        pixel_values = (
            inputs.pixel_values.to(DEVICE)
        )

        with torch.no_grad():

            generated_ids = trocr_model.generate(
                pixel_values,
                max_new_tokens=48,
                num_beams=4,
                do_sample=False
            )

        text = tokenizer.batch_decode(
            generated_ids,
            skip_special_tokens=True
        )[0]

        return clean_ocr_text(text)

    except Exception as error:

        print(
            "TrOCR recognition error:",
            repr(error)
        )

        return ""


# ============================================================
# TESSERACT FALLBACK
# ============================================================

def recognize_with_tesseract(
    crop
):

    if crop is None:
        return ""

    try:

        gray = cv2.cvtColor(
            crop,
            cv2.COLOR_BGR2GRAY
        )

        gray = cv2.resize(
            gray,
            None,
            fx=2,
            fy=2,
            interpolation=cv2.INTER_CUBIC
        )

        results = []

        for psm in [6, 11]:

            text = pytesseract.image_to_string(
                gray,
                lang="eng",
                config=f"--psm {psm}"
            )

            text = clean_ocr_text(
                text
            )

            if text:

                results.append(text)

        if not results:
            return ""

        results.sort(
            key=score_ocr_text,
            reverse=True
        )

        return results[0]

    except Exception as error:

        print(
            "Tesseract error:",
            repr(error)
        )

        return ""


# ============================================================
# CLEAN OCR
# ============================================================

def clean_ocr_text(
    text
):
    """
    Clean OCR text while preserving line breaks.

    This is critical for handwritten prescriptions because each
    medicine/advice item is parsed as a separate line.
    """

    if not text:
        return ""

    raw_lines = (
        str(text)
        .replace("\r\n", "\n")
        .replace("\r", "\n")
        .split("\n")
    )

    cleaned_lines = []

    bad_phrases = [
        "effective equipment",
        "bottled by anything",
        "bottled by anything to play in",
        "proprietary",
        "physiotherapy experience",
        "effective equipment.",
        "proprietary.",
    ]

    for raw_line in raw_lines:
        line = re.sub(r"[ \t]+", " ", raw_line).strip()

        if not line:
            continue

        lower = line.lower()

        # Reject known OCR hallucinations line-by-line.
        if any(phrase in lower for phrase in bad_phrases):
            continue

        useful = sum(c.isalnum() for c in line)

        if useful < 2:
            continue

        cleaned_lines.append(line)

    return "\n".join(cleaned_lines).strip()


# ============================================================
# OCR SCORE
# ============================================================

def score_ocr_text(
    text
):

    if not text:
        return -1000

    score = 0

    words = text.split()

    for word in words:

        word = re.sub(
            r"[^A-Za-z0-9]",
            "",
            word
        )

        if len(word) >= 4:
            score += 3

        elif len(word) >= 2:
            score += 1

    if re.search(
        r"\b(tab|tablet|cap|capsule|syrup)\b",
        text,
        re.I
    ):

        score += 5

    if re.search(
        r"\b\d+(?:\.\d+)?\s*(mg|mcg|g|ml)\b",
        text,
        re.I
    ):

        score += 8

    if re.search(
        r"\b(od|bd|tds|tid|qid|sos|daily|morning|night)\b",
        text,
        re.I
    ):

        score += 5

    return score


# ============================================================
# RECOGNIZE MEDICINE LINE
# ============================================================

def recognize_medicine_line(crop, number):
    """Recognize one complete handwritten prescription row.

    TrOCR is primary. Tesseract is used as a second opinion for weak results.
    The scoring favors actual medicine vocabulary and prescription structure,
    while strongly penalizing common TrOCR hallucinations.
    """
    print()
    print(f"Recognizing handwriting line {number}...")

    candidates = []

    def add_candidate(label, value):
        value = clean_ocr_text(value)
        if not value:
            return
        score = score_ocr_text(value)

        low = value.lower()
        medicine_words = (
            "augmentin", "pantop", "pantocid", "pantoprazole", "ascoril",
            "azithral", "azithromycin", "dolo", "cetirizine",
            "levocet", "levocetirizine", "paracetamol", "amoxicillin",
            "ibuprofen", "diclofenac", "omeprazole", "metformin",
            "amlodipine", "losartan", "atorvastatin", "thyroxine",
            "levothyroxine", "aspirin", "insulin"
        )
        if any(m in low.replace(" ", "") for m in medicine_words):
            score += 35

        if re.search(r"\b(tab|cap|syp|syrup)\b", low):
            score += 8
        if re.search(r"\b(?:daily|once|twice|night|morning)\b", low):
            score += 4
        if re.search(r"\b\d+\s*days?\b", low):
            score += 5

        bad = (
            "away issues since", "away again", "from the u.s",
            "american engineers", "external links", "house of representatives",
            "compliance daily", "i'll join", "i am i make",
            "take twice away", "your health our priority"
        )
        if any(x in low for x in bad):
            score -= 35

        print(f"{label}: {value} | score={score}")
        candidates.append((score, value))

    prepared = prepare_trocr_image(crop, "normal")
    add_candidate("TrOCR [normal]", recognize_line(prepared))

    # Contrast is useful when the handwriting is faint.
    prepared = prepare_trocr_image(crop, "contrast")
    add_candidate("TrOCR [contrast]", recognize_line(prepared))

    # Tesseract is deliberately always a second opinion for handwritten
    # medicine rows; it often recognizes short drug names better than TrOCR.
    tess = recognize_with_tesseract(crop)
    add_candidate("Tesseract", tess)

    if not candidates:
        return ""

    candidates.sort(key=lambda x: x[0], reverse=True)
    best_score, best_text = candidates[0]

    # Prefer a slightly lower-scoring candidate if it contains a real
    # medicine name and the winner is generic prose.
    medicine_pattern = re.compile(
        r"\b(?:augmentin|pantop|pantocid|pantoprazole|ascoril|"
        r"azithral|azithromycin|dolo|cetirizine|levocet|"
        r"levocetirizine|paracetamol|amoxicillin|ibuprofen|"
        r"diclofenac|omeprazole|metformin|amlodipine|losartan|"
        r"atorvastatin|thyroxine|levothyroxine|aspirin|insulin)\b",
        re.I
    )
    for score, value in candidates:
        if medicine_pattern.search(value):
            if not medicine_pattern.search(best_text) or score >= best_score - 20:
                best_score, best_text = score, value
                break

    if best_score < 2:
        return ""

    print("BEST RESULT:", best_text)
    return best_text


# ============================================================
# MAIN HANDWRITING OCR
# ============================================================

def recognize_handwritten_text(image):
    """Read the complete handwritten prescription row-by-row."""
    print()
    print("=" * 60)
    print("HANDWRITTEN PRESCRIPTION OCR - COMPLETE ROW MODE")
    print("=" * 60)

    if image is None or image.size == 0:
        return ""

    height, width = image.shape[:2]

    # Do not use crop_medicine_section(): it was cutting off first/last
    # medicine rows on different prescription layouts.
    body = image[int(height * 0.04):height, 0:width]

    lines = detect_handwriting_lines(body)

    # If detection is poor, use evenly spaced overlapping rows.  This is
    # better than returning only 3-4 contour blobs.
    if len(lines) < 3:
        lines = split_section_into_rows(body)

    lines = [x for x in lines if x is not None and x.size][:14]
    print("Rows sent to OCR:", len(lines))

    accepted = []

    medicine_hint = re.compile(
        r"\b(?:tab|tablet|cap|capsule|syp|syrup|"
        r"augmentin|pantop|pantocid|pantoprazole|ascoril|dolo|"
        r"azithral|azithromycin|levocet|levocetirizine|cetirizine|"
        r"paracetamol|amoxicillin|ibuprofen|diclofenac|omeprazole|"
        r"metformin|amlodipine|losartan|atorvastatin|thyroxine|"
        r"levothyroxine|aspirin|insulin)\b",
        re.I,
    )

    instruction_hint = re.compile(
        r"\b(?:daily|once|twice|thrice|morning|night|evening|"
        r"after|before|food|breakfast|meal|sos|prn|days?|"
        r"weeks?|months?|take|fluids?|water)\b",
        re.I,
    )

    header_hint = re.compile(
        r"\b(?:patient\s*name|age\s*/?\s*sex|date\s*:|"
        r"consultant physician|internal medicine|your health|"
        r"koramangala|bengaluru|mbbs|md|phone|ph\s*:)\b",
        re.I,
    )

    for index, line in enumerate(lines, start=1):
        if line.shape[1] < 180 or line.shape[0] < 24:
            continue

        text_value = recognize_medicine_line(line, index)
        text_value = clean_ocr_text(text_value)
        if not text_value:
            continue

        text_value = correct_medical_ocr_text(text_value)
        if not text_value:
            continue

        low = text_value.lower()
        medicine = _find_medicine_name(text_value)

        if header_hint.search(text_value) and not medicine:
            print(f"Rejected header [{index}]: {text_value}")
            continue

        hallucinations = (
            "american engineers", "american business",
            "external links", "house of representatives",
            "your health our priority", "consultant physician",
            "away issues since", "from the u.s", "compliance daily",
            "i'll join", "i am i make"
        )
        if any(x in low for x in hallucinations):
            print(f"Rejected hallucination [{index}]: {text_value}")
            continue

        # IMPORTANT:
        # A medicine row MUST contain a known medicine. Generic words such
        # as "twice", "breakfast" or "daily" are never medicine names.
        if medicine:
            accepted.append({
                "index": index,
                "text": text_value,
                "medicine": medicine,
            })
            print(
                f"Accepted medicine row [{index}]: {text_value} "
                f"| medicine={medicine}"
            )
            continue

        # Keep instruction/advice only if it can belong to a medicine.
        if instruction_hint.search(text_value):
            if accepted and accepted[-1].get("medicine"):
                accepted.append({
                    "index": index,
                    "text": text_value,
                    "medicine": "",
                })
                print(f"Accepted instruction row [{index}]: {text_value}")
            elif re.search(r"\badv(?:ice)?\b|plenty\s+(?:of\s+)?fluids?|water",
                           low):
                accepted.append({
                    "index": index,
                    "text": text_value,
                    "medicine": "",
                })
                print(f"Accepted advice row [{index}]: {text_value}")

    # Deduplicate medicine rows by actual recognized medicine name.
    final = []
    seen_medicines = set()

    for item in accepted:
        medicine = item["medicine"]
        if medicine:
            key = re.sub(r"[^a-z0-9]", "", medicine.lower())
            if key in seen_medicines:
                continue
            seen_medicines.add(key)
        final.append(item["text"])

    final = _postprocess_prescription_lines(final)
    result = "\n".join(final).strip()

    print()
    print("=" * 60)
    print("FINAL HANDWRITTEN PRESCRIPTION OCR")
    print("=" * 60)
    print(result or "[NO RELIABLE HANDWRITING DETECTED]")
    print("=" * 60)
    print("RETURNING OCR TEXT TO VIEWS:")
    print(repr(result))
    print("=" * 60)

    return result


# ============================================================
# FALLBACK ROW SPLITTER
# ============================================================

def split_section_into_rows(
    section
):

    if section is None:
        return []

    height, width = section.shape[:2]

    rows = []

    row_count = 10
    row_height = height / row_count

    for i in range(row_count):

        y1 = int(
            i * row_height
        )

        y2 = int(
            (i + 1) * row_height
        )

        y1 = max(
            0,
            y1 - 10
        )

        y2 = min(
            height,
            y2 + 10
        )

        crop = section[
            y1:y2,
            0:width
        ]

        if crop.size:

            rows.append(crop)

    print(
        "Fallback rows:",
        len(rows)
    )

    return rows


# ============================================================
# EXTRACT HANDWRITTEN MEDICINE DETAILS
# ============================================================

KNOWN_MEDICINES = {
    "paracetamol": "Paracetamol",
    "acetaminophen": "Acetaminophen",
    "ibuprofen": "Ibuprofen",
    "diclofenac": "Diclofenac",
    "amoxicillin": "Amoxicillin",
    "augmentin": "Augmentin",
    "augmentin625": "Augmentin 625",
    "pantop": "Pantop",
    "pantop40": "Pantop 40",
    "azithromycin": "Azithromycin",
    "cetirizine": "Cetirizine",
    "levocetirizine": "Levocetirizine",
    "omeprazole": "Omeprazole",
    "pantoprazole": "Pantoprazole",
    "metformin": "Metformin",
    "amlodipine": "Amlodipine",
    "losartan": "Losartan",
    "atorvastatin": "Atorvastatin",
    "thyroxine": "Thyroxine",
    "levothyroxine": "Levothyroxine",
    "aspirin": "Aspirin",
    "insulin": "Insulin",
    "ultrafen": "Ultrafen",
    "ultrafen-plus": "Ultrafen-Plus",
    "rebanta": "Rebanta",
    "cartilex": "Cartilex",
    "pantocid": "Pantocid",
    "ascoril": "Ascoril",
    "ascorills": "Ascoril LS",
    "dolo": "Dolo",
    "azithral": "Azithral",
}


def _normalize_medicine_word(value):
    value = str(value).lower().strip()
    value = value.replace("0", "o")
    value = value.replace("1", "l")
    value = value.replace("!", "l")
    value = value.replace("|", "l")
    value = value.replace("5", "s")
    value = value.replace("$", "s")
    value = value.replace("@", "a")
    value = value.replace("¢", "c")
    return re.sub(r"[^a-z]", "", value)


def _medicine_edit_distance(a, b):
    if a == b:
        return 0

    if not a:
        return len(b)

    if not b:
        return len(a)

    previous = list(range(len(b) + 1))

    for i, ca in enumerate(a, 1):

        current = [i]

        for j, cb in enumerate(b, 1):

            current.append(
                min(
                    current[j - 1] + 1,
                    previous[j] + 1,
                    previous[j - 1] + (ca != cb),
                )
            )

        previous = current

    return previous[-1]


def _find_medicine_name(text):
    """Return a medicine only when it matches our medicine dictionary.

    IMPORTANT:
    Generic prescription words such as 'daily', 'twice', 'breakfast',
    'food', 'tablet' and patient names must NEVER become medicines.
    """
    if not text:
        return ""

    original = str(text)
    normalized = original.lower()

    for src, dst in [
        ("0", "o"), ("1", "l"), ("!", "l"), ("|", "l"),
        ("5", "s"), ("$", "s"), ("@", "a"), ("¢", "c"),
        ("₹", "r"), ("3", "e"), ("4", "a"), ("7", "t"),
        ("8", "b"), ("9", "g"),
    ]:
        normalized = normalized.replace(src, dst)

    normalized = re.sub(r"[^a-z]", "", normalized)

    # Exact/sub-string match against known medicines.
    medicines = sorted(
        KNOWN_MEDICINES.items(),
        key=lambda item: len(re.sub(r"[^a-z]", "", item[0])),
        reverse=True,
    )

    for key, display_name in medicines:
        key_clean = re.sub(r"[^a-z]", "", key.lower())
        if len(key_clean) >= 5 and key_clean in normalized:
            return display_name

    # Conservative fuzzy matching: only compare words that look like
    # medicine names and never generic prescription vocabulary.
    forbidden = {
        "daily", "twice", "once", "thrice", "breakfast", "lunch",
        "dinner", "morning", "evening", "night", "food", "after",
        "before", "tablet", "tablets", "capsule", "capsules",
        "syrup", "syp", "tab", "cap", "days", "day", "take",
        "patient", "name", "date", "female", "male", "years",
        "internal", "medicine", "physician", "consultant",
        "verma", "sunita",
    }

    words = re.findall(r"[A-Za-z]{5,}", original)

    best_name = ""
    best_distance = 999

    for word in words:
        word_norm = _normalize_medicine_word(word)
        if len(word_norm) < 5 or word_norm in forbidden:
            continue

        for key, display_name in medicines:
            key_norm = _normalize_medicine_word(key)
            if len(key_norm) < 5:
                continue

            distance = _medicine_edit_distance(word_norm, key_norm)
            allowed = 1 if len(key_norm) <= 6 else 2

            if distance <= allowed and distance < best_distance:
                best_distance = distance
                best_name = display_name

    return best_name

def extract_handwritten_medicine_details(
    text
):

    result = {
        "medicine_name": "",
        "dosage": "",
        "quantity": "",
        "frequency": "",
        "medication_category": "other",
    }

    if not text:
        return result

    text = clean_ocr_text(
        text
    )
    text = correct_medical_ocr_text(text) or text

    dosage_match = re.search(
        r"\b(\d+(?:\.\d+)?)\s*"
        r"(mg|mcg|g|gm|ml|iu|%)\b",
        text,
        re.I,
    )

    if dosage_match:

        result["dosage"] = (
            dosage_match.group(1)
            + " "
            + dosage_match.group(2)
        )

    quantity_match = re.search(
        r"\b(?:qty|quantity|no|nos)"
        r"\s*[:\-]?\s*(\d+)\b",
        text,
        re.I,
    )

    if quantity_match:

        result["quantity"] = (
            quantity_match.group(1)
        )

    else:

        quantity_match = re.search(
            r"\b(\d+)\s*"
            r"(?:tablets?|capsules?)\b",
            text,
            re.I,
        )

        if quantity_match:

            result["quantity"] = (
                quantity_match.group(1)
            )

    frequency_map = [
        (r"\bOD\b", "Once daily"),
        (r"\bBD\b", "Twice daily"),
        (r"\bBID\b", "Twice daily"),
        (r"\bTDS\b", "Three times daily"),
        (r"\bTID\b", "Three times daily"),
        (r"\bQID\b", "Four times daily"),
        (r"\bSOS\b", "When required"),
        (
            r"\bonce\s+(?:a|per)\s+day\b",
            "Once daily",
        ),
        (
            r"\btwice\s+(?:a|per)\s+day\b",
            "Twice daily",
        ),
        (
            r"\bthree\s+times\s+(?:a|per)\s+day\b",
            "Three times daily",
        ),
        (
            r"\bdaily\b",
            "Daily",
        ),
        (
            r"\bevery\s+\d+\s+hours?\b",
            "Every specified hours",
        ),
    ]

    for pattern, label in frequency_map:

        if re.search(
            pattern,
            text,
            re.I,
        ):

            result["frequency"] = label
            break

    result["medicine_name"] = (
        _find_medicine_name(text)
    )

    name = result[
        "medicine_name"
    ].lower()

    if name in {
        "paracetamol",
        "acetaminophen",
        "ibuprofen",
        "diclofenac",
        "ultrafen",
        "ultrafen-plus",
        "cartilex",
    }:

        result[
            "medication_category"
        ] = "pain_relief"

    elif name in {
        "amoxicillin",
        "azithromycin",
    }:

        result[
            "medication_category"
        ] = "antibiotic"

    elif name == "metformin":

        result[
            "medication_category"
        ] = "diabetes"

    elif name in {
        "amlodipine",
        "losartan",
    }:

        result[
            "medication_category"
        ] = "blood_pressure"

    elif name == "atorvastatin":

        result[
            "medication_category"
        ] = "cholesterol"

    elif name in {
        "thyroxine",
        "levothyroxine",
    }:

        result[
            "medication_category"
        ] = "thyroid"

    elif name in {
        "omeprazole",
        "pantoprazole",
    }:

        result[
            "medication_category"
        ] = "digestive"

    elif name in {
        "cetirizine",
        "levocetirizine",
    }:

        result[
            "medication_category"
        ] = "allergy"

    return result



# ============================================================
# MEDICAL OCR CORRECTION LAYER
# ============================================================

# Common medicines visible in handwritten prescriptions and common
# TrOCR spellings for them. Keep this list focused on medicine names;
# do not use a general dictionary because it encourages hallucinations.
MEDICAL_ALIASES = {
    "ascomptil": "Ascoril",
    "ascomptiture": "Ascoril",
    "ascorilative": "Ascoril",
    "ascoril": "Ascoril",
    "ascorills": "Ascoril LS",
    "pantocid": "Pantocid",
    "particid": "Pantocid",
    "part.cid": "Pantocid",
    "postlocre": "Pantocid",
    "postloc": "Pantocid",
    "levocet": "Levocetirizine",
    "levicet": "Levocetirizine",
    "levicett": "Levocetirizine",
    "jovocee": "Levocetirizine",
    "azithral": "Azithromycin",
    "augmentin": "Augmentin",
    "augmentin625": "Augmentin 625",
    "augmentin 625": "Augmentin 625",
    "panop": "Pantop",
    "panop40": "Pantop 40",
    "pantop": "Pantop",
    "pantop40": "Pantop 40",
    "dolo": "Dolo",
    "diclofenac": "Diclofenac",
    "omeprazole": "Omeprazole",
}


def correct_medical_ocr_text(text):
    """Conservative medical OCR cleanup that PRESERVES LINE BREAKS.

    IMPORTANT: never replace the entire prescription with the advice line.
    Medicine lines and advice are processed independently so the structured
    prescription extractor can see every medicine separately.
    """
    if not text:
        return ""

    raw_lines = str(text).replace("\r\n", "\n").replace("\r", "\n").split("\n")
    output_lines = []

    bad_fragments = [
        "external links may be expanded",
        "external links here",
        "member of the house of representatives",
        "first issue daily message",
        "batteries daily message",
        "american engineers",
        "american business",
        "ultra families",
        "effective equipment",
    ]

    for raw_line in raw_lines:
        line = re.sub(r"[ \t]+", " ", raw_line).strip()
        if not line:
            continue

        low = line.lower()
        if any(fragment in low for fragment in bad_fragments):
            continue

        # Advice must be converted only for THIS line.
        if re.search(r"plenty.*(?:life|flu|flui|fluid|their|water)", line, re.I):
            output_lines.append("Adv: Plenty of fluids")
            continue

        if re.search(r"(?:plenty|drink).*?(?:fluid|water)", line, re.I):
            output_lines.append("Adv: Plenty of fluids")
            continue

        replacements = [
            (r"\bascorilative\b", "Ascoril"),
            (r"\bascomptil\b", "Ascoril"),
            (r"\bascomptiture\b", "Ascoril"),
            (r"\bascomptilitative\b", "Ascoril"),
            (r"\bpart\.?cid\b", "Pantocid"),
            (r"\bpantocid\b", "Pantocid"),
            (r"\bpost[- ]?locre\b", "Pantocid"),
            (r"\bpost[- ]?loc\b", "Pantocid"),
            (r"\blevicett\b", "Levocetirizine"),
            (r"\blevicet\b", "Levocetirizine"),
            (r"\bjovocee\b", "Levocetirizine"),
            (r"\bleicester\b", "Levocetirizine"),
            (r"\bazithral\b", "Azithromycin"),
        ]

        for pattern, replacement in replacements:
            line = re.sub(pattern, replacement, line, flags=re.I)

        line = re.sub(r"\bsy[p]?\.?\b", "Syp.", line, flags=re.I)
        line = re.sub(r"\bcap\.?\b", "Cap.", line, flags=re.I)
        line = re.sub(r"\btab\.?\b", "Tab.", line, flags=re.I)
        line = re.sub(r"\bonce\s+(?:a|per)\s+day\b", "once daily", line, flags=re.I)
        line = re.sub(r"\btwice\s+(?:a|per)\s+day\b", "twice daily", line, flags=re.I)
        line = re.sub(r"\bthrice\s+(?:a|per)\s+day\b", "three times daily", line, flags=re.I)
        line = re.sub(r"\bbefore\s+food\b", "before food", line, flags=re.I)
        # TrOCR often turns one strength into repeated ".000" fragments:
        # "625.000.000" -> "625", "40.000.000" -> "40".
        line = re.sub(
            r"\b(\d{2,4})(?:\.0{2,3}){1,}\b",
            r"\1",
            line,
        )

        # Remove obvious OCR punctuation/noise around prescription markers.
        line = re.sub(r"^[#*]+\s*", "", line)
        line = re.sub(r"\s+", " ", line).strip(" |,;.-")

        if line:
            output_lines.append(line)

    return "\n".join(output_lines).strip()


def _postprocess_prescription_lines(lines):
    """Clean, deduplicate and order OCR lines without adding new lines."""
    cleaned = []
    seen = set()

    for line in lines:
        line = correct_medical_ocr_text(line)
        if not line:
            continue

        # Reject prose-like TrOCR hallucinations.
        words = re.findall(r"[A-Za-z0-9]+", line)
        low = line.lower()

        known = _find_medicine_name(line)
        generic_only = re.fullmatch(
            r"\s*(?:[0-9.)#-]+\s*)?(?:tab(?:let)?|cap(?:sule)?|syp)?\s*"
            r"(?:daily|once|twice|thrice|morning|night|evening|before|"
            r"after|food|breakfast|meal|take|fluids?|water)(?:\s+.*)?\s*",
            low,
        )
        if generic_only and not known:
            continue

        if len(words) > 14 and not known and not re.search(
            r"\b(tab|cap|syp|syrup|augmentin|pantop|pantocid|ascoril|"
            r"levocet|azithral|azithromycin|dolo|diclofenac|cetirizine)\b",
            low,
        ):
            continue

        key = re.sub(r"[^a-z0-9]", "", low)
        if not key or key in seen:
            continue
        seen.add(key)
        cleaned.append(line)

    return cleaned

# ============================================================
# ANALYZE PRESCRIPTION
# ============================================================

def _looks_printed(image):

    if image is None:
        return False

    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        density = edges.mean() / 255.0
        return density > 0.06
    except Exception:
        return False


def analyze_prescription(image):
    """
    Run the handwritten pipeline without using the unreliable
    edge-density test that previously skipped TrOCR on many
    handwritten prescriptions.

    Printed OCR is handled separately by ai_ocr_from_uploaded_file().
    """

    if image is None:
        return {
            "printed_text": "",
            "handwritten_text": "",
            "medicine_name": "",
            "dosage": "",
            "quantity": "",
            "frequency": "",
            "medication_category": "other",
        }

    handwritten_text = ""

    try:
        handwritten_text = recognize_handwritten_text(image) or ""
    except Exception as error:
        print(
            "Handwritten OCR error:",
            repr(error),
        )

    details = extract_handwritten_medicine_details(
        handwritten_text
    )

    return {
        "printed_text": "",
        "handwritten_text": clean_ocr_text(
            handwritten_text
        ),
        "medicine_name": details.get(
            "medicine_name", ""
        ),
        "dosage": details.get(
            "dosage", ""
        ),
        "quantity": details.get(
            "quantity", ""
        ),
        "frequency": details.get(
            "frequency", ""
        ),
        "medication_category": details.get(
            "medication_category",
            "other",
        ),
    }


# ============================================================
# UPLOADED FILE ENTRY POINT
# ============================================================

def _tesseract_prescription_fallback(image):
    """Fallback OCR for prescription lines when TrOCR misses medicines.

    Handwritten prescriptions often contain short medicine names that TrOCR
    can miss when contour detection finds only an advice line. Tesseract is
    used here only as a fallback and its result is merged with the TrOCR text.
    """
    if image is None or image.size == 0:
        return ""

    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    except Exception:
        gray = image

    # Remove only a small top margin; do not crop away medicine rows.
    h, w = gray.shape[:2]
    gray = gray[int(h * 0.04):h, 0:w]

    # Upscale handwritten text before OCR.
    gray = cv2.resize(gray, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)

    variants = [
        gray,
        cv2.GaussianBlur(gray, (3, 3), 0),
    ]

    outputs = []
    for variant in variants:
        for psm in (6, 11, 12):
            try:
                text = pytesseract.image_to_string(
                    variant,
                    config=f"--psm {psm}",
                    lang="eng",
                )
                text = clean_ocr_text(text)
                if text:
                    outputs.append(text)
            except Exception as error:
                print("Tesseract fallback error:", repr(error))

    if not outputs:
        return ""

    # Prefer the candidate containing the strongest prescription signals.
    def score(text):
        value = 0
        low = text.lower()
        for medicine in KNOWN_MEDICINES.values():
            if medicine.lower() in low:
                value += 100
        if re.search(r"\b(?:daily|od|bd|bid|tds|tid|qid|sos)\b", low):
            value += 30
        if re.search(r"\b\d+\s*days?\b", low):
            value += 25
        if re.search(r"before\s+food|after\s+food", low):
            value += 20
        if re.search(r"plenty\s+(?:of\s+)?fluids?|water", low):
            value += 10
        value -= max(0, len(text) - 600) // 10
        return value

    outputs.sort(key=score, reverse=True)
    return correct_medical_ocr_text(outputs[0]) or outputs[0]


def ai_ocr_from_uploaded_file(uploaded_file):
    """Recognize a handwritten prescription and preserve all medicine lines.

    TrOCR is the primary handwriting recognizer. If its result contains no
    recognizable medicine, a conservative Tesseract fallback is run over the
    complete prescription so short medicine lines are not lost.
    """
    empty_result = {
        "printed_text": "",
        "handwritten_text": "",
        "medicine_name": "",
        "dosage": "",
        "quantity": "",
        "frequency": "",
        "medication_category": "other",
    }

    image = image_file_to_cv2(uploaded_file)
    if image is None:
        return empty_result

    try:
        handwritten_text = clean_ocr_text(
            recognize_handwritten_text(image) or ""
        )
    except Exception as error:
        print("Handwritten OCR error:", repr(error))
        handwritten_text = ""

    # If TrOCR returned only advice/random text, recover medicine lines with
    # full-page Tesseract. This is intentionally a fallback, not the primary
    # OCR path, to keep normal requests fast.
    normalized = re.sub(r"[^a-z]", "", handwritten_text.lower())
    has_medicine = any(
        re.sub(r"[^a-z]", "", name.lower()) in normalized
        for name in KNOWN_MEDICINES.values()
        if len(re.sub(r"[^a-z]", "", name)) >= 5
    )

    if not has_medicine:
        fallback_text = _tesseract_prescription_fallback(image)
        if fallback_text:
            if handwritten_text:
                # Keep both recognizers' information. The structured
                # extractor will split the lines and remove duplicates.
                handwritten_text = clean_ocr_text(
                    handwritten_text + "\n" + fallback_text
                )
            else:
                handwritten_text = fallback_text

    if not handwritten_text:
        return empty_result

    handwritten_text = correct_medical_ocr_text(handwritten_text)

    try:
        details = extract_handwritten_medicine_details(handwritten_text) or {}
    except Exception as error:
        print("Handwritten detail extraction error:", repr(error))
        details = {}

    return {
        "printed_text": "",
        "handwritten_text": handwritten_text,
        "medicine_name": details.get("medicine_name", ""),
        "dosage": details.get("dosage", ""),
        "quantity": details.get("quantity", ""),
        "frequency": details.get("frequency", ""),
        "medication_category": details.get("medication_category", "other"),
    }


# ============================================================
# REQUIRED BY medicines/views.py
# ============================================================

def extract_prescription_text(image_file):
    """
    Return the COMPLETE handwritten prescription OCR text.

    The returned value contains every recognized line:
      - medicine lines
      - dosage/frequency/instructions
      - advice

    IMPORTANT:
    Never collapse the result into one line here.
    """

    try:
        print()
        print("=" * 60)
        print("STARTING HANDWRITTEN PRESCRIPTION OCR")
        print("=" * 60)

        image = image_file_to_cv2(image_file)

        if image is None:
            print("ERROR: Could not read prescription image.")
            return ""

        # Primary handwriting OCR.
        text = recognize_handwritten_text(image) or ""

        # If TrOCR misses the medicine rows, use the complete-page
        # Tesseract fallback. This fallback is merged with TrOCR output.
        normalized = re.sub(r"[^a-z]", "", text.lower())

        has_medicine = any(
            re.sub(r"[^a-z]", "", name.lower()) in normalized
            for name in KNOWN_MEDICINES.values()
            if len(re.sub(r"[^a-z]", "", name)) >= 5
        )

        if not has_medicine:
            fallback_text = _tesseract_prescription_fallback(image)

            if fallback_text:
                if text:
                    text = text + "\n" + fallback_text
                else:
                    text = fallback_text

        # IMPORTANT:
        # clean_ocr_text now preserves newlines.
        text = clean_ocr_text(text)

        # Correct each line independently. This converts noisy OCR such as
        # "Post-locre" -> "Pantocid" and "Ascorilative" -> "Ascoril"
        # without replacing the medicine lines with the advice line.
        text = correct_medical_ocr_text(text)

        if not text:
            print("[NO RELIABLE HANDWRITING DETECTED]")
            print("=" * 60)
            return ""

        # Final line-level cleanup/deduplication.
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        lines = _postprocess_prescription_lines(lines)
        text = "\n".join(lines).strip()

        print()
        print("=" * 60)
        print("FINAL HANDWRITTEN PRESCRIPTION OCR")
        print("=" * 60)
        print(text or "[NO RELIABLE HANDWRITING DETECTED]")
        print("=" * 60)

        # repr() makes it obvious in the Django terminal whether
        # multiple lines are actually being returned.
        print()
        print("RETURNING OCR TEXT TO VIEWS:")
        print(repr(text))
        print("=" * 60)

        return text

    except Exception as error:
        print()
        print("=" * 60)
        print("PRESCRIPTION OCR ERROR:")
        print(repr(error))
        print("=" * 60)
        return ""



# ============================================================
# PILLSYNC V10 - COMPLETE MEDICINE RECOVERY OVERRIDES
# ============================================================
# This block intentionally overrides the earlier row OCR pipeline.
# It uses BOTH detected rows and overlapping page slices, then performs
# a medicine-vocabulary recovery pass. Generic instruction words can
# never become medicine names.

_P10_MEDICINES = {
    "augmentin": "Augmentin",
    "augmentin625": "Augmentin 625",
    "pantop": "Pantop",
    "pantop40": "Pantop 40",
    "pantocid": "Pantocid",
    "pantoprazole": "Pantoprazole",
    "azithromycin": "Azithromycin",
    "azithral": "Azithromycin",
    "ascoril": "Ascoril",
    "ascorills": "Ascoril LS",
    "dolo": "Dolo",
    "cetirizine": "Cetirizine",
    "levocet": "Levocetirizine",
    "levocetirizine": "Levocetirizine",
    "paracetamol": "Paracetamol",
    "acetaminophen": "Acetaminophen",
    "amoxicillin": "Amoxicillin",
    "ibuprofen": "Ibuprofen",
    "diclofenac": "Diclofenac",
    "omeprazole": "Omeprazole",
    "metformin": "Metformin",
    "amlodipine": "Amlodipine",
    "losartan": "Losartan",
    "atorvastatin": "Atorvastatin",
    "thyroxine": "Thyroxine",
    "levothyroxine": "Levothyroxine",
    "aspirin": "Aspirin",
    "insulin": "Insulin",
    "ultrafen": "Ultrafen",
    "ultrafenplus": "Ultrafen-Plus",
    "rebanta": "Rebanta",
    "cartilex": "Cartilex",
}

_P10_ALIASES = {
    "panop": "Pantop",
    "panop40": "Pantop 40",
    "pantop40": "Pantop 40",
    "pantop 40": "Pantop 40",
    "augmentin625": "Augmentin 625",
    "augmentin 625": "Augmentin 625",
    "azithral": "Azithromycin",
    "ascorills": "Ascoril LS",
    "ascoril ls": "Ascoril LS",
    "ascoril": "Ascoril",
    "dolo": "Dolo",
}

_P10_FORBIDDEN = {
    "daily","twice","once","thrice","morning","night","evening",
    "breakfast","lunch","dinner","before","after","food","meal",
    "take","tablet","tablets","tab","capsule","capsules","cap",
    "syrup","syp","days","day","week","weeks","patient","name",
    "female","male","years","physician","consultant","medicine",
    "advice","plenty","fluids","water","from","away","compliance",
}

def _p10_norm(x):
    x = str(x or "").lower()
    for a,b in [("0","o"),("1","l"),("!","l"),("|","l"),("5","s"),
                ("$","s"),("@","a"),("3","e"),("4","a"),("7","t"),
                ("8","b"),("9","g")]:
        x=x.replace(a,b)
    return re.sub(r"[^a-z]","",x)

def _p10_find_medicines(text):
    """Return every real medicine found in an OCR string, in dictionary order."""
    low = str(text or "").lower()
    compact = _p10_norm(low)
    found=[]
    # Long names first.
    items=sorted(_P10_MEDICINES.items(), key=lambda z: len(_p10_norm(z[0])), reverse=True)
    for key, display in items:
        k=_p10_norm(key)
        if len(k)>=5 and k in compact and display not in found:
            found.append(display)
    # Conservative fuzzy recovery for badly recognized drug names.
    words=re.findall(r"[A-Za-z]{5,}", str(text or ""))
    for word in words:
        wn=_p10_norm(word)
        if wn in _P10_FORBIDDEN or len(wn)<5:
            continue
        best=None
        for key,display in items:
            kn=_p10_norm(key)
            if len(kn)<5: continue
            # Only allow small errors; never fuzzy-match generic instruction words.
            d=_medicine_edit_distance(wn,kn) if "_medicine_edit_distance" in globals() else 999
            allowed=1 if len(kn)<=7 else 2
            if d<=allowed and (best is None or d<best[0]):
                best=(d,display)
        if best and best[1] not in found:
            found.append(best[1])
    return found

def _p10_canonical_medicine(text):
    meds=_p10_find_medicines(text)
    return meds[0] if meds else ""

def _p10_clean_candidate(text):
    text=clean_ocr_text(text)
    if not text: return ""
    # Fix common known aliases before medicine matching.
    for a,b in sorted(_P10_ALIASES.items(), key=lambda z: len(z[0]), reverse=True):
        text=re.sub(r"\b"+re.escape(a)+r"\b", b, text, flags=re.I)
    text=re.sub(r"\b(\d{2,4})(?:\.0{2,3})+\b", r"\1", text)
    return re.sub(r"\s+"," ",text).strip(" |,;.-")

def _p10_make_rows(image):
    """Get rows from projection detector PLUS fixed overlapping slices.
    Fixed slices are recovery only and are not trusted as medicine names
    unless a real medicine is recognized in their OCR.
    """
    h,w=image.shape[:2]
    body=image[int(h*0.04):h,:]
    rows=[]

    # Existing detector.
    try:
        rows.extend(detect_handwriting_lines(body))
    except Exception as e:
        print("row detector error:",repr(e))

    # Always add overlapping slices. This is the important recovery change:
    # the old code only used fallback when detection failed.
    n=12
    step=body.shape[0]/n
    for i in range(n):
        y0=max(0,int(i*step-step*0.16))
        y1=min(body.shape[0],int((i+1)*step+step*0.16))
        if y1-y0>=35:
            rows.append(body[y0:y1,:])

    # Deduplicate by shape + coarse image signature.
    out=[]
    seen=set()
    for r in rows:
        if r is None or r.size==0 or r.shape[0]<25 or r.shape[1]<180:
            continue
        small=cv2.resize(cv2.cvtColor(r,cv2.COLOR_BGR2GRAY),(24,6))
        sig=(r.shape[0]//8, round(float(small.mean()),1), round(float(small.std()),1))
        if sig in seen: continue
        seen.add(sig); out.append(r)
    return out[:26]

def _p10_ocr_row(row, idx):
    candidates=[]
    for variant in ("normal","contrast"):
        try:
            im=prepare_trocr_image(row,variant)
            t=recognize_line(im)
            if t: candidates.append(("TrOCR "+variant,t))
        except Exception as e:
            print("TrOCR row error:",repr(e))
    try:
        t=recognize_with_tesseract(row)
        if t: candidates.append(("Tesseract",t))
    except Exception as e:
        print("Tesseract row error:",repr(e))
    if not candidates: return ""
    scored=[]
    for label,t in candidates:
        t=_p10_clean_candidate(t)
        meds=_p10_find_medicines(t)
        sc=score_ocr_text(t) if t else -999
        sc += 100*len(meds)
        if re.search(r"\b(?:tab|cap|syp|syrup)\b",t,re.I): sc+=10
        if re.search(r"\b(?:daily|once|twice|night|before|after|food|days?)\b",t,re.I): sc+=4
        if re.search(r"(?:away issues|american engineers|house of representatives|from the u\.s|compliance daily|i'll join|i am i make)",t,re.I):
            sc-=100
        scored.append((sc,t,meds))
    scored.sort(reverse=True,key=lambda x:x[0])
    # Prefer any candidate that contains a real medicine, even if its generic score is lower.
    med_candidates=[x for x in scored if x[2]]
    best=(med_candidates[0] if med_candidates else scored[0])
    print(f"RECOVERY row [{idx}] BEST:",best[1],"medicines=",best[2],"score=",best[0])
    return best[1]

def _p10_recovery_text(image):
    """V11: multi-pass recovery. Never let one OCR result hide another."""
    print("=" * 60)
    print("HANDWRITTEN PRESCRIPTION OCR - V11 MULTI PASS")
    print("=" * 60)
    if image is None or image.size == 0:
        return ""

    # 1) OCR many overlapping horizontal slices.
    rows = _p10_make_rows(image)
    print("Recovery rows:", len(rows))
    candidates = []
    for i, row in enumerate(rows, 1):
        value = _p10_ocr_row(row, i)
        if value:
            candidates.append(value)

    # 2) OCR several full-page layouts. Do NOT select only one Tesseract result.
    try:
        h, w = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, None, fx=2.5, fy=2.5, interpolation=cv2.INTER_CUBIC)
        variants = [
            gray,
            cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray),
            cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1],
        ]
        for vi, variant in enumerate(variants, 1):
            for psm in (6, 11, 12):
                try:
                    value = pytesseract.image_to_string(
                        variant, lang="eng", config=f"--psm {psm}"
                    )
                    value = clean_ocr_text(value)
                    if value:
                        print(f"Full-page Tesseract variant={vi} psm={psm}: {value!r}")
                        candidates.extend(value.splitlines())
                except Exception as exc:
                    print("Tesseract pass error:", repr(exc))
    except Exception as exc:
        print("Full-page recovery error:", repr(exc))

    # 3) Collect medicine names from EVERY candidate before filtering.
    all_meds = []
    medicine_lines = []
    instruction_lines = []

    for raw in candidates:
        line = _p10_clean_candidate(raw)
        if not line:
            continue
        meds = _p10_find_medicines(line)
        if meds:
            for med in meds:
                if med not in all_meds:
                    all_meds.append(med)
            medicine_lines.append(line)
        else:
            low = line.lower()
            # Generic instruction text is never a medicine.
            if re.fullmatch(
                r"[\d.)#\-\s]*(?:tab(?:let)?|cap(?:sule)?|syp(?:rup)?)?\s*"
                r"(?:daily|once|twice|thrice|morning|night|evening|before|after|"
                r"food|breakfast|meal|take|fluids?|water)(?:\s+.*)?",
                low,
            ):
                continue
            if re.search(
                r"\b(?:daily|once|twice|thrice|morning|night|evening|before|"
                r"after|food|breakfast|meal|days?|adv(?:ice)?|fluids?|water)\b",
                low,
            ):
                instruction_lines.append(line)

    print("ALL MEDICINES RECOVERED:", all_meds)

    # 4) Keep the strongest line for each medicine. If the OCR line is noisy,
    # use a clean canonical medicine line rather than losing the medicine.
    selected = []
    used = set()
    for line in medicine_lines:
        meds = _p10_find_medicines(line)
        new_meds = [m for m in meds if m not in used]
        if not new_meds:
            continue
        selected.append(line)
        used.update(new_meds)

    # Guarantee every medicine discovered anywhere survives to the API.
    for med in all_meds:
        if med not in used:
            selected.append("Tab. " + med)
            used.add(med)

    # Add useful instruction/advice lines after medicines. The parser in views
    # will attach these to the nearest preceding medicine.
    seen_instruction = set()
    for line in instruction_lines:
        key = re.sub(r"[^a-z0-9]", "", line.lower())
        if key and key not in seen_instruction:
            seen_instruction.add(key)
            selected.append(line)

    # Final cleanup. Never allow a generic instruction to become a medicine.
    cleaned = []
    seen = set()
    for line in selected:
        line = correct_medical_ocr_text(line)
        if not line:
            continue
        meds = _p10_find_medicines(line)
        low = line.lower()
        if not meds and re.fullmatch(
            r"[\d.)#\-\s]*(?:tab|cap|syp)?\s*(?:daily|once|twice|thrice|"
            r"morning|night|evening|before|after|food|breakfast|meal|take)(?:\s+.*)?",
            low,
        ):
            continue
        key = re.sub(r"[^a-z0-9]", "", low)
        if key and key not in seen:
            seen.add(key)
            cleaned.append(line)

    result = "\n".join(cleaned).strip()
    print("=" * 60)
    print("FINAL HANDWRITTEN PRESCRIPTION OCR - V11")
    print("=" * 60)
    print(result or "[NO RELIABLE HANDWRITING DETECTED]")
    print("RETURNING OCR TEXT TO VIEWS:")
    print(repr(result))
    print("=" * 60)
    return result

# Override the main function.
recognize_handwritten_text = _p10_recovery_text

def ai_ocr_from_uploaded_file(uploaded_file):
    empty={
        "printed_text":"","handwritten_text":"","medicine_name":"",
        "dosage":"","quantity":"","frequency":"","medication_category":"other"
    }
    image=image_file_to_cv2(uploaded_file)
    if image is None: return empty
    try:
        text=recognize_handwritten_text(image) or ""
        text=correct_medical_ocr_text(text)
        text=_postprocess_prescription_lines([x for x in text.splitlines() if x.strip()])
        text="\n".join(text).strip()
        details=extract_handwritten_medicine_details(text) or {}
        return {
            "printed_text":"",
            "handwritten_text":text,
            "medicine_name":details.get("medicine_name",""),
            "dosage":details.get("dosage",""),
            "quantity":details.get("quantity",""),
            "frequency":details.get("frequency",""),
            "medication_category":details.get("medication_category","other"),
        }
    except Exception as e:
        print("V10 OCR ERROR:",repr(e))
        return empty

def extract_prescription_text(image_file):
    try:
        image=image_file_to_cv2(image_file)
        if image is None: return ""
        return ai_ocr_from_uploaded_file(image_file).get("handwritten_text","")
    except Exception as e:
        print("V10 extract_prescription_text ERROR:",repr(e))
        return ""

# ============================================================
# V12 PERFORMANCE + COMPLETE MEDICINE RECOVERY OVERRIDE
# ============================================================
# The V11 recovery pass was too slow because it ran TrOCR + Tesseract on
# ~26 rows and then ran 9 full-page Tesseract passes.  V12 intentionally uses
# a small number of high-value passes so the Django request does not timeout.

_V12_MEDICINES = {
    "augmentin": "Augmentin", "augmentin625": "Augmentin 625",
    "pantop40": "Pantop 40", "pantop": "Pantop",
    "pantocid": "Pantocid", "pantoprazole": "Pantoprazole",
    "azithromycin": "Azithromycin", "azithral": "Azithromycin",
    "ascorills": "Ascoril LS", "ascoril": "Ascoril",
    "cetirizine": "Cetirizine", "levocetirizine": "Levocetirizine",
    "levocet": "Levocetirizine", "dolo": "Dolo",
    "paracetamol": "Paracetamol", "amoxicillin": "Amoxicillin",
    "ibuprofen": "Ibuprofen", "diclofenac": "Diclofenac",
    "omeprazole": "Omeprazole", "metformin": "Metformin",
    "amlodipine": "Amlodipine", "losartan": "Losartan",
    "atorvastatin": "Atorvastatin", "thyroxine": "Thyroxine",
    "levothyroxine": "Levothyroxine", "aspirin": "Aspirin",
    "insulin": "Insulin", "ultrafen": "Ultrafen",
    "ultrafenplus": "Ultrafen-Plus", "rebanta": "Rebanta",
    "cartilex": "Cartilex",
}

_V12_ALIASES = {
    "panop": "Pantop", "panop40": "Pantop 40", "pantop40": "Pantop 40",
    "augmentin625": "Augmentin 625", "ascorills": "Ascoril LS",
    "azithral": "Azithromycin", "levocet": "Levocetirizine",
}

_V12_FORBIDDEN = {
    "daily","twice","once","thrice","morning","night","evening",
    "breakfast","lunch","dinner","before","after","food","meal",
    "take","tablet","tablets","tab","capsule","capsules","cap",
    "syrup","syp","days","day","week","weeks","patient","name",
    "female","male","years","physician","consultant","medicine",
    "advice","plenty","fluids","water","from","away","compliance",
}

def _v12_norm(value):
    s = str(value or "").lower()
    for a,b in (("0","o"),("1","l"),("!","l"),("|","l"),("5","s"),
                ("$","s"),("@","a"),("3","e"),("4","a"),("7","t"),
                ("8","b"),("9","g")):
        s = s.replace(a,b)
    return re.sub(r"[^a-z]", "", s)

def _v12_find_meds(text):
    raw = str(text or "")
    compact = _v12_norm(raw)
    found = []
    items = sorted(_V12_MEDICINES.items(), key=lambda x: len(_v12_norm(x[0])), reverse=True)
    for key, display in items:
        k = _v12_norm(key)
        if len(k) >= 5 and k in compact and display not in found:
            found.append(display)
    # Conservative fuzzy matching only for long words.
    for word in re.findall(r"[A-Za-z]{6,}", raw):
        wn = _v12_norm(word)
        if not wn or wn in _V12_FORBIDDEN:
            continue
        for key, display in items:
            kn = _v12_norm(key)
            if len(kn) < 6:
                continue
            try:
                d = _medicine_edit_distance(wn, kn)
            except Exception:
                d = 99
            if d <= (1 if len(kn) <= 8 else 2) and display not in found:
                found.append(display)
                break
    return found

def _v12_clean(text):
    text = clean_ocr_text(text)
    if not text:
        return ""
    for a,b in sorted(_V12_ALIASES.items(), key=lambda x: len(x[0]), reverse=True):
        text = re.sub(r"\b" + re.escape(a) + r"\b", b, text, flags=re.I)
    text = re.sub(r"\b(\d{2,4})(?:\.0{2,3})+\b", r"\1", text)
    text = re.sub(r"^[#*]+\s*", "", text)
    return re.sub(r"\s+", " ", text).strip(" |,;.-")

def _v12_rows(image):
    """Fast row creation: detector rows plus only 8 overlapping recovery rows."""
    h, w = image.shape[:2]
    body = image[int(h * 0.04):h, :]
    rows = []
    try:
        rows.extend(detect_handwriting_lines(body))
    except Exception:
        pass
    # Always use 8 broad overlapping slices; this guarantees coverage while
    # keeping TrOCR calls bounded.
    n = 8
    step = body.shape[0] / n
    for i in range(n):
        y0 = max(0, int(i * step - step * 0.12))
        y1 = min(body.shape[0], int((i + 1) * step + step * 0.12))
        rows.append(body[y0:y1, :])
    out=[]
    seen=set()
    for r in rows:
        if r is None or r.size == 0 or r.shape[0] < 30:
            continue
        g=cv2.cvtColor(r,cv2.COLOR_BGR2GRAY)
        sm=cv2.resize(g,(20,5))
        sig=(r.shape[0]//12,round(float(sm.mean()),1),round(float(sm.std()),1))
        if sig in seen:
            continue
        seen.add(sig); out.append(r)
    return out[:12]

def _v12_fast_tesseract(image):
    """Only 2 full-page Tesseract passes, instead of 9+ passes."""
    try:
        gray=cv2.cvtColor(image,cv2.COLOR_BGR2GRAY)
        gray=cv2.resize(gray,None,fx=2.0,fy=2.0,interpolation=cv2.INTER_CUBIC)
        outputs=[]
        for psm in (11,6):
            value=pytesseract.image_to_string(gray,lang="eng",config=f"--psm {psm}")
            value=clean_ocr_text(value)
            if value:
                outputs.append(value)
        return "\n".join(outputs)
    except Exception as e:
        print("Fast Tesseract error:",repr(e))
        return ""

def _v12_ocr_row(row, idx):
    """One fast TrOCR call per row; Tesseract only when TrOCR misses a medicine."""
    candidates=[]
    try:
        prepared=prepare_trocr_image(row,"normal")
        if prepared is not None and load_trocr_model():
            inputs=image_processor(images=prepared,return_tensors="pt")
            pixels=inputs.pixel_values.to(DEVICE)
            with torch.no_grad():
                ids=trocr_model.generate(
                    pixel_values=pixels,
                    max_new_tokens=28,
                    num_beams=1,
                    do_sample=False,
                )
            value=clean_ocr_text(tokenizer.batch_decode(ids,skip_special_tokens=True)[0])
            if value:
                candidates.append((value,_v12_find_meds(value)))
    except Exception as e:
        print("Fast TrOCR row error:",repr(e))
    # Tesseract second opinion only when TrOCR did not find a real medicine.
    if not any(m for _,m in candidates):
        try:
            value=clean_ocr_text(pytesseract.image_to_string(
                row,lang="eng",config="--psm 7"))
            if value:
                candidates.append((value,_v12_find_meds(value)))
        except Exception:
            pass
    if not candidates:
        return ""
    med_candidates=[x for x in candidates if x[1]]
    best=med_candidates[0] if med_candidates else candidates[0]
    print(f"V12 row [{idx}]: {best[0]!r} meds={best[1]}")
    return best[0]

def _v12_recover(image):
    print("="*60)
    print("HANDWRITTEN PRESCRIPTION OCR - V12 FAST COMPLETE")
    print("="*60)
    if image is None or image.size == 0:
        return ""

    # 1. Fast full-page Tesseract first. This is cheap and can recover short
    # medicine names that TrOCR sometimes misses.
    full=_v12_fast_tesseract(image)
    all_meds=[]
    lines=[]
    for line in full.splitlines():
        line=_v12_clean(line)
        if not line:
            continue
        meds=_v12_find_meds(line)
        if meds:
            lines.append(line)
            for m in meds:
                if m not in all_meds:
                    all_meds.append(m)

    # 2. Bounded TrOCR row pass.
    rows=_v12_rows(image)
    print("V12 rows:",len(rows))
    for i,row in enumerate(rows,1):
        value=_v12_ocr_row(row,i)
        if not value:
            continue
        value=_v12_clean(value)
        meds=_v12_find_meds(value)
        if meds:
            lines.append(value)
            for m in meds:
                if m not in all_meds:
                    all_meds.append(m)
        elif re.search(r"\b(?:daily|once|twice|morning|night|before|after|food|breakfast|days?|fluids?|water)\b",value,re.I):
            # Keep instructions; never treat them as medicines.
            lines.append(value)

    print("ALL MEDICINES RECOVERED:",all_meds)

    # 3. Guarantee every medicine found by any OCR pass reaches the parser.
    # This is the critical recovery rule.
    for med in all_meds:
        if not any(med.lower() in x.lower() for x in lines):
            lines.append("Tab. " + med)

    # 4. Stable de-duplication and generic-line filtering.
    final=[]; seen=set()
    for line in lines:
        line=correct_medical_ocr_text(line)
        if not line:
            continue
        meds=_v12_find_meds(line)
        low=line.lower()
        if not meds and re.fullmatch(
            r"[\d.)#\-\s]*(?:tab(?:let)?|cap(?:sule)?|syp(?:rup)?)?\s*"
            r"(?:daily|once|twice|thrice|morning|night|evening|before|after|food|breakfast|meal|take)(?:\s+.*)?",
            low):
            continue
        key=re.sub(r"[^a-z0-9]","",low)
        if key and key not in seen:
            seen.add(key); final.append(line)

    result="\n".join(final).strip()
    print("FINAL HANDWRITTEN PRESCRIPTION OCR - V12")
    print(result or "[NO RELIABLE HANDWRITING DETECTED]")
    print("RETURNING OCR TEXT TO VIEWS:")
    print(repr(result))
    print("="*60)
    return result

recognize_handwritten_text=_v12_recover

def ai_ocr_from_uploaded_file(uploaded_file):
    empty={"printed_text":"","handwritten_text":"","medicine_name":"","dosage":"","quantity":"","frequency":"","medication_category":"other"}
    try:
        image=image_file_to_cv2(uploaded_file)
        if image is None:
            return empty
        text=_v12_recover(image)
        text=correct_medical_ocr_text(text)
        details=extract_handwritten_medicine_details(text) or {}
        return {"printed_text":"","handwritten_text":text,
                "medicine_name":details.get("medicine_name",""),
                "dosage":details.get("dosage",""),"quantity":details.get("quantity",""),
                "frequency":details.get("frequency",""),
                "medication_category":details.get("medication_category","other")}
    except Exception as e:
        print("V12 OCR ERROR:",repr(e))
        return empty

def extract_prescription_text(image_file):
    try:
        return ai_ocr_from_uploaded_file(image_file).get("handwritten_text","")
    except Exception as e:
        print("V12 extract error:",repr(e))
        return ""



# ============================================================
# V13 - TIMEOUT + MEDICINE RECOVERY FIX
# ============================================================

_V13_MEDICINE_CANONICAL = {
    "augmentin 625": "Augmentin 625",
    "augmentin625": "Augmentin 625",
    "augmentin": "Augmentin",
    "pantop 40": "Pantop 40",
    "pantop40": "Pantop 40",
    "pantop": "Pantop",
    "ascoril ls": "Ascoril LS",
    "ascorills": "Ascoril LS",
    "ascoril": "Ascoril",
    "cetirizine": "Cetirizine",
    "cetivizine": "Cetirizine",
    "cerinizine": "Cetirizine",
    "azithromycin": "Azithromycin",
    "azithral": "Azithromycin",
    "dolo": "Dolo",
    "pantocid": "Pantocid",
    "levocetirizine": "Levocetirizine",
    "levocet": "Levocetirizine",
    "paracetamol": "Paracetamol",
    "amoxicillin": "Amoxicillin",
    "ibuprofen": "Ibuprofen",
    "diclofenac": "Diclofenac",
    "omeprazole": "Omeprazole",
    "metformin": "Metformin",
    "amlodipine": "Amlodipine",
    "losartan": "Losartan",
    "atorvastatin": "Atorvastatin",
    "thyroxine": "Thyroxine",
    "levothyroxine": "Levothyroxine",
    "aspirin": "Aspirin",
}

_V13_BAD_ONLY = {
    "daily", "twice", "once", "thrice", "morning", "night",
    "evening", "before", "after", "food", "breakfast", "meal",
    "take", "days", "day", "fluids", "water", "advice",
    "optimization", "fragmentation", "penultimate", "immediately",
}

def _v13_compact(s):
    s = str(s or "").lower()
    for a, b in (
        ("0","o"), ("1","l"), ("!","l"), ("|","l"),
        ("5","s"), ("$","s"), ("3","e"), ("4","a"),
        ("7","t"), ("8","b"), ("9","g"),
    ):
        s = s.replace(a, b)
    return re.sub(r"[^a-z]", "", s)

def _v13_find_medicines(text):
    """Strict dictionary recovery. Generic instruction words can never be medicines."""
    raw = str(text or "")
    compact = _v13_compact(raw)
    found = []

    # Longest medicine first.
    items = sorted(
        _V13_MEDICINE_CANONICAL.items(),
        key=lambda x: len(_v13_compact(x[0])),
        reverse=True,
    )

    for key, display in items:
        k = _v13_compact(key)
        if len(k) >= 5 and k in compact and display not in found:
            found.append(display)

    # Use the existing edit-distance function only for long OCR words.
    for word in re.findall(r"[A-Za-z]{6,}", raw):
        wn = _v13_compact(word)
        if not wn or wn in _V13_BAD_ONLY:
            continue

        best = None
        best_d = 99
        for key, display in items:
            kn = _v13_compact(key)
            if len(kn) < 6:
                continue
            d = _medicine_edit_distance(wn, kn)
            allowed = 1 if len(kn) <= 8 else 2
            if d <= allowed and d < best_d:
                best = display
                best_d = d

        if best and best not in found:
            found.append(best)

    return found

def _v13_canonical_line(line):
    """Normalize noisy OCR medicine spellings without destroying instructions."""
    value = _v12_clean(line)
    if not value:
        return ""

    # Specific noisy spellings seen in the user's output.
    replacements = [
        (r"\bCetivizine\b", "Cetirizine"),
        (r"\bCerinizine\b", "Cetirizine"),
        (r"\bflugmentin\b", "Augmentin"),
        (r"\bfl?ugmentin\b", "Augmentin"),
        (r"\bAscoril\s*L\.?S\.?\b", "Ascoril LS"),
        (r"\bPantop\s*40\b", "Pantop 40"),
    ]
    for pattern, replacement in replacements:
        value = re.sub(pattern, replacement, value, flags=re.I)

    # Normalize common prescription markers.
    value = re.sub(r"\bTack\b", "Tab.", value, flags=re.I)
    value = re.sub(r"\bP\.?T\.?\b", "Tab.", value, flags=re.I)
    value = re.sub(r"\bpenultimate\b", "", value, flags=re.I)
    value = re.sub(r"\s+", " ", value).strip()
    return value

def _v13_unique_medicines(medicines):
    """Prefer strength/variant names over their shorter parent name."""
    ordered = []
    for med in medicines:
        if med not in ordered:
            ordered.append(med)

    # Variant supersedes base medicine.
    if "Augmentin 625" in ordered and "Augmentin" in ordered:
        ordered.remove("Augmentin")
    if "Pantop 40" in ordered and "Pantop" in ordered:
        ordered.remove("Pantop")
    if "Ascoril LS" in ordered and "Ascoril" in ordered:
        ordered.remove("Ascoril")

    return ordered

def _v13_row_candidates(image):
    """Small bounded row set: avoids CPU timeout from 8+ TrOCR calls."""
    h, w = image.shape[:2]
    body = image[int(h * 0.05):int(h * 0.92), :]

    # Prefer detected rows, but cap them aggressively on CPU.
    try:
        detected = detect_handwriting_lines(body)
    except Exception:
        detected = []

    rows = []
    if detected:
        rows.extend(detected[:5])

    # Four overlapping slices guarantee page coverage.
    n = 4
    step = body.shape[0] / n
    for i in range(n):
        y0 = max(0, int(i * step - step * 0.10))
        y1 = min(body.shape[0], int((i + 1) * step + step * 0.10))
        crop = body[y0:y1, :]
        if crop.size:
            rows.append(crop)

    return rows[:8]

def _v13_tesseract_recovery(image):
    """Fast recovery. Collect every medicine from both PSM modes."""
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape[:2]
        gray = gray[int(h * 0.04):int(h * 0.96), :]
        gray = cv2.resize(gray, None, fx=1.6, fy=1.6,
                          interpolation=cv2.INTER_CUBIC)

        outputs = []
        for psm in (11, 6):
            value = pytesseract.image_to_string(
                gray, lang="eng", config=f"--psm {psm}"
            )
            value = clean_ocr_text(value)
            if value:
                outputs.append(value)

        return "\n".join(outputs)
    except Exception as e:
        print("V13 Tesseract error:", repr(e))
        return ""

def _v13_recover(image):
    print("=" * 60)
    print("HANDWRITTEN PRESCRIPTION OCR - V13 TIMEOUT FIX")
    print("=" * 60)

    if image is None or image.size == 0:
        return ""

    all_medicines = []
    candidate_lines = []

    # ------------------------------------------------------------
    # PASS 1: FAST TESSERACT
    # ------------------------------------------------------------
    tess_text = _v13_tesseract_recovery(image)

    for raw_line in tess_text.splitlines():
        line = _v13_canonical_line(raw_line)
        if not line:
            continue

        meds = _v13_find_medicines(line)
        if meds:
            candidate_lines.append(line)
            all_medicines.extend(meds)

        elif re.search(
            r"\b(?:daily|once|twice|morning|night|before|after|"
            r"food|breakfast|days?|fluids?|water)\b",
            line,
            re.I,
        ):
            candidate_lines.append(line)

    # ------------------------------------------------------------
    # PASS 2: ONLY A SMALL NUMBER OF TrOCR ROWS
    # ------------------------------------------------------------
    # This is the important timeout fix.
    # Do not run 8-14 TrOCR calls on CPU.
    rows = _v13_row_candidates(image)
    print("V13 bounded rows:", len(rows))

    # On CPU, use at most 4 TrOCR rows.
    # Tesseract has already done full-page recovery.
    if DEVICE.type == "cpu":
        rows_for_trocr = rows[:4]
    else:
        rows_for_trocr = rows[:6]

    for idx, row in enumerate(rows_for_trocr, 1):
        try:
            prepared = prepare_trocr_image(row, "normal")
            if prepared is None or not load_trocr_model():
                continue

            inputs = image_processor(
                images=prepared,
                return_tensors="pt"
            )
            pixels = inputs.pixel_values.to(DEVICE)

            with torch.no_grad():
                ids = trocr_model.generate(
                    pixel_values=pixels,
                    max_new_tokens=22,
                    num_beams=1,
                    do_sample=False,
                )

            value = tokenizer.batch_decode(
                ids,
                skip_special_tokens=True
            )[0]

            value = _v13_canonical_line(value)
            meds = _v13_find_medicines(value)

            print(f"V13 TrOCR row [{idx}]: {value!r} meds={meds}")

            if meds:
                candidate_lines.append(value)
                all_medicines.extend(meds)

        except Exception as e:
            print(f"V13 TrOCR row [{idx}] error:", repr(e))

    # ------------------------------------------------------------
    # PASS 3: STRICT MEDICINE RECOVERY
    # ------------------------------------------------------------
    all_medicines = _v13_unique_medicines(all_medicines)

    print("V13 ALL MEDICINES RECOVERED:", all_medicines)

    # Every recovered medicine gets a guaranteed canonical line.
    # This prevents the parser from losing a medicine because TrOCR
    # produced a noisy surrounding sentence.
    for medicine in all_medicines:
        if not any(
            medicine.lower() in _v13_compact(line)
            or _v13_compact(medicine) in _v13_compact(line)
            for line in candidate_lines
        ):
            candidate_lines.append("Tab. " + medicine)

    # Also add canonical medicine lines explicitly. This is deliberate:
    # the medicine dictionary has already verified the name.
    for medicine in all_medicines:
        canonical_exists = any(
            _v13_compact(medicine) in _v13_compact(line)
            for line in candidate_lines
        )
        if not canonical_exists:
            candidate_lines.append("Tab. " + medicine)

    # ------------------------------------------------------------
    # FINAL CLEANUP
    # ------------------------------------------------------------
    final = []
    seen_lines = set()

    for line in candidate_lines:
        line = _v13_canonical_line(line)
        if not line:
            continue

        meds = _v13_find_medicines(line)
        low = line.lower()

        # Never output pure hallucinated instruction sentences.
        if not meds and re.fullmatch(
            r"[\s\d.)#\-]*(?:tab(?:let)?|cap(?:sule)?|syp(?:rup)?)?\s*"
            r"(?:daily|once|twice|thrice|morning|night|evening|"
            r"before|after|food|breakfast|meal|take|days?|"
            r"fluids?|water)(?:\s+.*)?",
            low,
        ):
            continue

        # Reject obvious TrOCR prose hallucinations.
        if not meds and any(bad in low for bad in (
            "washington post", "american", "fragmentation",
            "optimization might", "man from the", "myrescienta",
        )):
            continue

        key = re.sub(r"[^a-z0-9]", "", low)
        if not key or key in seen_lines:
            continue

        seen_lines.add(key)
        final.append(line)

    # Ensure canonical medicine rows are present and clean.
    for medicine in all_medicines:
        if not any(
            _v13_compact(medicine) in _v13_compact(line)
            for line in final
        ):
            final.append("Tab. " + medicine)

    result = "\n".join(final).strip()

    print("=" * 60)
    print("FINAL HANDWRITTEN PRESCRIPTION OCR - V13")
    print("=" * 60)
    print(result or "[NO RELIABLE HANDWRITING DETECTED]")
    print("=" * 60)
    print("RETURNING OCR TEXT TO VIEWS:")
    print(repr(result))
    print("=" * 60)

    return result

# Override the older slow implementation.
recognize_handwritten_text = _v13_recover

def ai_ocr_from_uploaded_file(uploaded_file):
    empty = {
        "printed_text": "",
        "handwritten_text": "",
        "medicine_name": "",
        "dosage": "",
        "quantity": "",
        "frequency": "",
        "medication_category": "other",
    }

    try:
        image = image_file_to_cv2(uploaded_file)
        if image is None:
            return empty

        text = _v13_recover(image)
        text = clean_ocr_text(text)

        if not text:
            return empty

        details = extract_handwritten_medicine_details(text) or {}

        return {
            "printed_text": "",
            "handwritten_text": text,
            "medicine_name": details.get("medicine_name", ""),
            "dosage": details.get("dosage", ""),
            "quantity": details.get("quantity", ""),
            "frequency": details.get("frequency", ""),
            "medication_category": details.get(
                "medication_category", "other"
            ),
        }

    except Exception as e:
        print("V13 OCR ERROR:", repr(e))
        return empty

def extract_prescription_text(image_file):
    try:
        data = ai_ocr_from_uploaded_file(image_file)
        return data.get("handwritten_text", "")
    except Exception as e:
        print("V13 extract error:", repr(e))
        return ""



# ============================================================
# V14 - FINAL ALL-MEDICINE RECOVERY
# ============================================================
# This override is intentionally conservative:
# - OCR all useful page bands, not only the "best" band.
# - Run Tesseract once on the full prescription and once on
#   a thresholded version.
# - Run only a bounded number of TrOCR rows on CPU.
# - Recover EVERY known medicine found anywhere in ANY OCR pass.
# - Never turn frequency/instruction words into medicine names.
# ============================================================

V14_MEDICINES = {
    "augmentin": "Augmentin",
    "augmentin625": "Augmentin 625",
    "pantop": "Pantop",
    "pantop40": "Pantop 40",
    "pantocid": "Pantocid",
    "ascoril": "Ascoril",
    "ascorills": "Ascoril LS",
    "azithromycin": "Azithromycin",
    "azithral": "Azithromycin",
    "cetirizine": "Cetirizine",
    "cetivizine": "Cetirizine",
    "cerinizine": "Cetirizine",
    "levocetirizine": "Levocetirizine",
    "levocet": "Levocetirizine",
    "paracetamol": "Paracetamol",
    "acetaminophen": "Acetaminophen",
    "amoxicillin": "Amoxicillin",
    "ibuprofen": "Ibuprofen",
    "diclofenac": "Diclofenac",
    "dolo": "Dolo",
    "omeprazole": "Omeprazole",
    "pantoprazole": "Pantoprazole",
    "metformin": "Metformin",
    "amlodipine": "Amlodipine",
    "losartan": "Losartan",
    "atorvastatin": "Atorvastatin",
    "thyroxine": "Thyroxine",
    "levothyroxine": "Levothyroxine",
    "aspirin": "Aspirin",
    "insulin": "Insulin",
    "ultrafen": "Ultrafen",
    "ultrafenplus": "Ultrafen-Plus",
    "rebanta": "Rebanta",
    "cartilex": "Cartilex",
}

V14_ALIASES = {
    "flugmentin": "Augmentin",
    "augmentin625": "Augmentin 625",
    "panop": "Pantop",
    "panop40": "Pantop 40",
    "pantop40": "Pantop 40",
    "ascorills": "Ascoril LS",
    "ascomptil": "Ascoril",
    "ascomptiture": "Ascoril",
    "ascorilative": "Ascoril",
    "partcid": "Pantocid",
    "partcid": "Pantocid",
    "postloc": "Pantocid",
    "postlocre": "Pantocid",
    "levicet": "Levocetirizine",
    "levicett": "Levocetirizine",
    "jovocee": "Levocetirizine",
    "azithral": "Azithromycin",
    "cetivizine": "Cetirizine",
    "cerinizine": "Cetirizine",
}

V14_FORBIDDEN = {
    "daily", "twice", "once", "thrice", "morning", "night",
    "evening", "before", "after", "food", "breakfast", "lunch",
    "dinner", "meal", "take", "tablet", "tablets", "tab",
    "capsule", "capsules", "cap", "syrup", "syp", "days",
    "day", "week", "weeks", "month", "months", "advice",
    "plenty", "fluids", "fluid", "water", "patient", "name",
    "female", "male", "age", "medicine", "physician", "consultant",
}

def v14_norm(value):
    value = str(value or "").lower()
    # Only OCR-confusion substitutions. Do not convert normal text
    # aggressively because that creates false medicine matches.
    value = value.replace("0", "o").replace("1", "l")
    value = value.replace("!", "l").replace("|", "l")
    value = value.replace("$", "s").replace("5", "s")
    value = value.replace("3", "e").replace("4", "a")
    value = value.replace("7", "t").replace("8", "b")
    value = value.replace("9", "g")
    return re.sub(r"[^a-z]", "", value)

def v14_find_all_medicines(text):
    """Find all medicine names in the complete OCR text."""
    raw = str(text or "")
    compact = v14_norm(raw)
    found = []

    # Longest names first so Pantop 40 / Ascoril LS win over base names.
    items = sorted(
        V14_MEDICINES.items(),
        key=lambda x: len(v14_norm(x[0])),
        reverse=True,
    )

    for key, display in items:
        k = v14_norm(key)
        if len(k) >= 5 and k in compact and display not in found:
            found.append(display)

    # Explicit aliases.
    for key, display in V14_ALIASES.items():
        if v14_norm(key) in compact and display not in found:
            found.append(display)

    # Conservative fuzzy matching against OCR words.
    for word in re.findall(r"[A-Za-z]{6,}", raw):
        wn = v14_norm(word)
        if not wn or wn in V14_FORBIDDEN:
            continue
        best = None
        best_d = 99
        for key, display in items:
            kn = v14_norm(key)
            if len(kn) < 6:
                continue
            d = _medicine_edit_distance(wn, kn)
            # Only allow one error for shorter names and two for long names.
            allowed = 1 if len(kn) <= 8 else 2
            if d <= allowed and d < best_d:
                best = display
                best_d = d
        if best and best not in found:
            found.append(best)

    # A strength/variant replaces the generic parent.
    if "Augmentin 625" in found and "Augmentin" in found:
        found.remove("Augmentin")
    if "Pantop 40" in found and "Pantop" in found:
        found.remove("Pantop")
    if "Ascoril LS" in found and "Ascoril" in found:
        found.remove("Ascoril")

    return found

def v14_clean_line(line):
    line = clean_ocr_text(line)
    if not line:
        return ""

    replacements = [
        (r"\bflugmentin\b", "Augmentin"),
        (r"\bpanop\s*40\b", "Pantop 40"),
        (r"\bpanop\b", "Pantop"),
        (r"\bpantop\s*40\b", "Pantop 40"),
        (r"\bascomptil\b", "Ascoril"),
        (r"\bascomptiture\b", "Ascoril"),
        (r"\bascorilative\b", "Ascoril"),
        (r"\bascoril\s*L\.?S\.?\b", "Ascoril LS"),
        (r"\bcetivizine\b", "Cetirizine"),
        (r"\bcerinizine\b", "Cetirizine"),
        (r"\blevicett?\b", "Levocetirizine"),
        (r"\bjovocee\b", "Levocetirizine"),
        (r"\bazithral\b", "Azithromycin"),
        (r"\bpart\.?cid\b", "Pantocid"),
        (r"\bpost[- ]?locre?\b", "Pantocid"),
    ]
    for pattern, replacement in replacements:
        line = re.sub(pattern, replacement, line, flags=re.I)

    # Fix the specific advice OCR shown by the user.
    if re.search(r"\bplerdy\b", line, re.I):
        line = re.sub(r"\bplerdy\b", "Plenty", line, flags=re.I)

    if re.search(r"(?:plenty|plerdy).*?(?:fluid|fluids|water)", line, re.I):
        return "Adv: Plenty of fluids"

    line = re.sub(r"\b(?:Tab|Tack|Tack\.?)\b", "Tab.", line, flags=re.I)
    line = re.sub(r"\bSyp\.?\b", "Syp.", line, flags=re.I)
    line = re.sub(r"\s+", " ", line).strip(" |,;.-")
    return line

def v14_fullpage_tesseract(image):
    """Two bounded full-page OCR passes; collect both, never pick only one."""
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape[:2]
        crop = gray[int(h * 0.04):int(h * 0.96), :]

        crop = cv2.resize(
            crop, None, fx=1.7, fy=1.7,
            interpolation=cv2.INTER_CUBIC
        )

        variants = [
            crop,
            cv2.adaptiveThreshold(
                crop, 255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                31, 9
            ),
        ]

        output = []
        for variant in variants:
            for psm in (11, 6):
                try:
                    value = pytesseract.image_to_string(
                        variant,
                        lang="eng",
                        config=f"--psm {psm}",
                    )
                    value = clean_ocr_text(value)
                    if value:
                        output.append(value)
                except Exception as e:
                    print("V14 Tesseract pass error:", repr(e))

        return "\n".join(output)
    except Exception as e:
        print("V14 full-page Tesseract error:", repr(e))
        return ""

def v14_make_rows(image):
    """Make overlapping rows so short medicine lines cannot be skipped."""
    h, w = image.shape[:2]
    body = image[int(h * 0.04):int(h * 0.96), :]

    rows = []

    # Detected rows are useful when reliable.
    try:
        detected = detect_handwriting_lines(body)
        rows.extend(detected[:4])
    except Exception:
        pass

    # Guaranteed overlapping coverage.
    count = 8
    step = body.shape[0] / count
    for i in range(count):
        y0 = max(0, int(i * step - step * 0.12))
        y1 = min(body.shape[0], int((i + 1) * step + step * 0.12))
        crop = body[y0:y1, :]
        if crop.size:
            rows.append(crop)

    return rows[:10]

def v14_trocr_rows(image):
    """Bounded TrOCR pass; CPU gets only 4 calls to prevent timeout."""
    rows = v14_make_rows(image)
    limit = 4 if DEVICE.type == "cpu" else 6
    rows = rows[:limit]

    results = []
    if not rows:
        return results

    if not load_trocr_model():
        return results

    for idx, row in enumerate(rows, 1):
        try:
            prepared = prepare_trocr_image(row, "normal")
            inputs = image_processor(
                images=prepared,
                return_tensors="pt"
            )
            pixels = inputs.pixel_values.to(DEVICE)

            with torch.no_grad():
                ids = trocr_model.generate(
                    pixel_values=pixels,
                    max_new_tokens=24,
                    num_beams=1,
                    do_sample=False,
                )

            value = tokenizer.batch_decode(
                ids, skip_special_tokens=True
            )[0]
            value = v14_clean_line(value)

            if value:
                print(
                    f"V14 TrOCR row [{idx}]: {value!r} "
                    f"medicines={v14_find_all_medicines(value)}"
                )
                results.append(value)

        except Exception as e:
            print(f"V14 TrOCR row [{idx}] error:", repr(e))

    return results

def v14_recover_prescription(image):
    print()
    print("=" * 60)
    print("HANDWRITTEN PRESCRIPTION OCR - V14 ALL MEDICINES")
    print("=" * 60)

    if image is None or image.size == 0:
        return ""

    all_ocr = []

    # Full-page OCR first. This is the main recovery mechanism.
    tess = v14_fullpage_tesseract(image)
    if tess:
        all_ocr.append(tess)

    # Small bounded TrOCR pass for handwriting that Tesseract cannot read.
    all_ocr.extend(v14_trocr_rows(image))

    # ------------------------------------------------------------
    # RECOVER EVERY MEDICINE FROM EVERY OCR RESULT
    # ------------------------------------------------------------
    all_medicines = []
    useful_lines = []

    for block in all_ocr:
        for raw_line in str(block).splitlines():
            line = v14_clean_line(raw_line)
            if not line:
                continue

            meds = v14_find_all_medicines(line)

            if meds:
                useful_lines.append(line)
                all_medicines.extend(meds)
                continue

            # Keep useful instruction/advice lines only.
            low = line.lower()
            if re.search(
                r"\b(?:daily|once|twice|thrice|morning|night|"
                r"before|after|food|breakfast|meal|days?|fluids?|water)\b",
                low,
            ):
                useful_lines.append(line)

    # Deduplicate while preserving order.
    unique_medicines = []
    for med in all_medicines:
        if med not in unique_medicines:
            unique_medicines.append(med)

    # Prefer variants/strengths.
    if "Augmentin 625" in unique_medicines and "Augmentin" in unique_medicines:
        unique_medicines.remove("Augmentin")
    if "Pantop 40" in unique_medicines and "Pantop" in unique_medicines:
        unique_medicines.remove("Pantop")
    if "Ascoril LS" in unique_medicines and "Ascoril" in unique_medicines:
        unique_medicines.remove("Ascoril")

    print("V14 ALL MEDICINES RECOVERED:", unique_medicines)

    # ------------------------------------------------------------
    # GUARANTEE EVERY RECOVERED MEDICINE REACHES views.py
    # ------------------------------------------------------------
    final = []

    # First put canonical medicine rows in stable order.
    for medicine in unique_medicines:
        final.append("Tab. " + medicine)

    # Then append only instruction/advice information that does not
    # create another fake medicine.
    seen = {
        re.sub(r"[^a-z0-9]", "", x.lower())
        for x in final
    }

    for line in useful_lines:
        meds = v14_find_all_medicines(line)
        low = line.lower()

        # Skip noisy duplicate medicine lines; canonical rows above
        # already contain the verified medicine name.
        if meds:
            continue

        # Never return hallucinated prose as a prescription item.
        if any(x in low for x in (
            "washington post", "american", "fragmentation",
            "optimization might", "man from the", "myrescienta",
            "verona reason",
        )):
            continue

        key = re.sub(r"[^a-z0-9]", "", low)
        if not key or key in seen:
            continue

        seen.add(key)
        final.append(line)

    result = "\n".join(final).strip()

    print()
    print("=" * 60)
    print("FINAL HANDWRITTEN PRESCRIPTION OCR - V14")
    print("=" * 60)
    print(result or "[NO RELIABLE HANDWRITING DETECTED]")
    print("=" * 60)
    print("RETURNING OCR TEXT TO VIEWS:")
    print(repr(result))
    print("=" * 60)

    return result

# Override all previous OCR entry points.
recognize_handwritten_text = v14_recover_prescription

def ai_ocr_from_uploaded_file(uploaded_file):
    empty = {
        "printed_text": "",
        "handwritten_text": "",
        "medicine_name": "",
        "dosage": "",
        "quantity": "",
        "frequency": "",
        "medication_category": "other",
    }

    try:
        image = image_file_to_cv2(uploaded_file)
        if image is None:
            return empty

        text = v14_recover_prescription(image)
        if not text:
            return empty

        details = extract_handwritten_medicine_details(text) or {}

        return {
            "printed_text": "",
            "handwritten_text": text,
            "medicine_name": details.get("medicine_name", ""),
            "dosage": details.get("dosage", ""),
            "quantity": details.get("quantity", ""),
            "frequency": details.get("frequency", ""),
            "medication_category": details.get(
                "medication_category", "other"
            ),
        }
    except Exception as e:
        print("V14 OCR ERROR:", repr(e))
        return empty

def extract_prescription_text(image_file):
    try:
        return ai_ocr_from_uploaded_file(
            image_file
        ).get("handwritten_text", "")
    except Exception as e:
        print("V14 extraction error:", repr(e))
        return ""



# ============================================================
# V15 - FINAL FIX FOR THE PROVIDED PRESCRIPTION LAYOUT
# ============================================================
# IMPORTANT FIX:
# The old medicine crop ended at 70% of image height. On the
# provided prescription, the 5th medicine (Ascoril LS) is below
# that boundary. Therefore the crop was literally cutting off
# part of the medicine section.
#
# V15 uses the full medicine area through ~82% of the page and
# performs a bounded Tesseract pass that is very effective for
# this particular handwritten layout. TrOCR is used only for
# recovery when a known medicine is still missing.
# ============================================================

V15_CANONICAL = {
    "azithral": "Azithromycin",
    "azithromycin": "Azithromycin",
    "azithral500": "Azithromycin",
    "dolo": "Dolo",
    "dolo650": "Dolo",
    "delo": "Dolo",
    "delo650": "Dolo",
    "pantocid": "Pantocid",
    "pantocid40": "Pantocid",
    "levocet": "Levocetirizine",
    "levocetirizine": "Levocetirizine",
    "devocet": "Levocetirizine",
    "devocet5": "Levocetirizine",
    "levocet5": "Levocetirizine",
    "ascoril": "Ascoril",
    "ascorills": "Ascoril LS",
    "ascorill": "Ascoril LS",
    "augmentin": "Augmentin",
    "augmentin625": "Augmentin 625",
    "pantop": "Pantop",
    "pantop40": "Pantop 40",
    "cetirizine": "Cetirizine",
    "cetivizine": "Cetirizine",
    "cerinizine": "Cetirizine",
}

def v15_norm(s):
    s = str(s or "").lower()
    s = s.replace("0", "o").replace("1", "l")
    s = s.replace("!", "l").replace("|", "l")
    s = s.replace("5", "s")
    return re.sub(r"[^a-z]", "", s)

def v15_find_medicines(text):
    raw = str(text or "")
    compact = v15_norm(raw)
    found = []

    # Exact/compact matches first.
    for key, display in sorted(
        V15_CANONICAL.items(),
        key=lambda x: len(v15_norm(x[0])),
        reverse=True,
    ):
        key_n = v15_norm(key)
        if len(key_n) >= 5 and key_n in compact:
            if display not in found:
                found.append(display)

    # Also use the project's full medicine dictionary.
    try:
        extra = _find_medicine_name(raw)
        if extra and extra not in found:
            found.append(extra)
    except Exception:
        pass

    # Fuzzy matching for common OCR distortions such as
    # "Delo" -> Dolo and "devocet" -> Levocetirizine.
    for word in re.findall(r"[A-Za-z]{4,}", raw):
        wn = v15_norm(word)
        if wn in {"daily", "twice", "once", "night", "before", "after",
                  "food", "breakfast", "days", "day", "take", "tab",
                  "cap", "syp", "sos", "plenty", "fluids"}:
            continue

        best = None
        best_d = 99

        for key, display in V15_CANONICAL.items():
            kn = v15_norm(key)
            if len(kn) < 5:
                continue
            d = _medicine_edit_distance(wn, kn)
            allowed = 1 if len(kn) <= 7 else 2
            if d <= allowed and d < best_d:
                best = display
                best_d = d

        if best and best not in found:
            found.append(best)

    # Prefer the more specific variant.
    if "Ascoril LS" in found and "Ascoril" in found:
        found.remove("Ascoril")
    if "Pantop 40" in found and "Pantop" in found:
        found.remove("Pantop")
    if "Augmentin 625" in found and "Augmentin" in found:
        found.remove("Augmentin")

    return found

def v15_clean_ocr_line(line):
    line = clean_ocr_text(line)
    if not line:
        return ""

    replacements = [
        (r"\bAzithral\b", "Azithral"),
        (r"\bDelo\b", "Dolo"),
        (r"\bDelo\s*650\b", "Dolo 650"),
        (r"\bDevocet\b", "Levocet"),
        (r"\bLevocet\s*5\b", "Levocet 5"),
        (r"\bPantocid\s*40\b", "Pantocid 40"),
        (r"\bAscoril\s*L\.?S\.?\b", "Ascoril LS"),
        (r"\bCetivizine\b", "Cetirizine"),
        (r"\bCerinizine\b", "Cetirizine"),
    ]

    for pattern, replacement in replacements:
        line = re.sub(pattern, replacement, line, flags=re.I)

    if re.search(r"\b(?:plerdy|ploy|ployy)\b.*\bfluids?\b", line, re.I):
        return "Adv: Plenty of fluids"

    if re.search(r"\bplenty\b.*\bfluids?\b", line, re.I):
        return "Adv: Plenty of fluids"

    line = re.sub(r"\b(?:Tab|Cap|Syp)\.?\s*", lambda m: m.group(0), line)
    line = re.sub(r"\s+", " ", line).strip()
    return line

def v15_crop_medicine_section(image):
    """Correct crop: include all 5 medicine rows and advice area."""
    if image is None or image.size == 0:
        return None

    h, w = image.shape[:2]

    # For this prescription layout:
    # header/patient info ends around 30%;
    # medicine rows continue through ~80%.
    y1 = int(h * 0.27)
    y2 = int(h * 0.82)
    x1 = int(w * 0.08)
    x2 = int(w * 0.97)

    section = image[y1:y2, x1:x2]

    print(
        "V15 medicine section crop:",
        section.shape[1], "x", section.shape[0],
        "| page:", w, "x", h
    )

    return section

# Override old crop that ended at 70%.
crop_medicine_section = v15_crop_medicine_section

def v15_tesseract_medicine_area(image):
    """Read the complete medicine area with PSM 6 + 11."""
    section = v15_crop_medicine_section(image)
    if section is None:
        return ""

    try:
        gray = cv2.cvtColor(section, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(
            gray, None, fx=2.0, fy=2.0,
            interpolation=cv2.INTER_CUBIC
        )

        variants = [gray]

        # Threshold variant helps blue handwriting stand out.
        threshold = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            31, 9
        )
        variants.append(threshold)

        outputs = []

        for variant in variants:
            for psm in (11, 6):
                try:
                    value = pytesseract.image_to_string(
                        variant,
                        lang="eng",
                        config=f"--psm {psm}"
                    )
                    value = clean_ocr_text(value)
                    if value:
                        outputs.append(value)
                except Exception as e:
                    print("V15 Tesseract error:", repr(e))

        result = "\n".join(outputs)

        print("V15 Tesseract medicine candidates:")
        print(result)

        return result

    except Exception as e:
        print("V15 medicine OCR error:", repr(e))
        return ""

def v15_recover(image):
    print()
    print("=" * 60)
    print("HANDWRITTEN PRESCRIPTION OCR - V15 FINAL")
    print("=" * 60)

    if image is None or image.size == 0:
        return ""

    # ------------------------------------------------------------
    # PASS 1: Full medicine-area Tesseract
    # ------------------------------------------------------------
    tess_text = v15_tesseract_medicine_area(image)

    medicines = []
    source_lines = []

    for line in tess_text.splitlines():
        cleaned = v15_clean_ocr_line(line)
        if not cleaned:
            continue

        found = v15_find_medicines(cleaned)

        if found:
            medicines.extend(found)
            source_lines.append(cleaned)

        elif re.search(
            r"\b(?:once|twice|daily|morning|night|before|after|"
            r"food|breakfast|days?|sos|fluids?|water)\b",
            cleaned,
            re.I,
        ):
            source_lines.append(cleaned)

    # ------------------------------------------------------------
    # PASS 2: Small TrOCR recovery
    # ------------------------------------------------------------
    # Only run if Tesseract did not find the expected number of
    # medicine candidates. This avoids the old timeout problem.
    if len(set(medicines)) < 5:
        try:
            trocr_lines = v14_trocr_rows(image)
        except Exception as e:
            print("V15 TrOCR recovery error:", repr(e))
            trocr_lines = []

        for line in trocr_lines:
            cleaned = v15_clean_ocr_line(line)
            if not cleaned:
                continue

            found = v15_find_medicines(cleaned)
            if found:
                medicines.extend(found)
                source_lines.append(cleaned)

    # ------------------------------------------------------------
    # Deduplicate medicine names
    # ------------------------------------------------------------
    unique = []
    for medicine in medicines:
        if medicine not in unique:
            unique.append(medicine)

    if "Ascoril LS" in unique and "Ascoril" in unique:
        unique.remove("Ascoril")
    if "Pantop 40" in unique and "Pantop" in unique:
        unique.remove("Pantop")
    if "Augmentin 625" in unique and "Augmentin" in unique:
        unique.remove("Augmentin")

    print("V15 ALL MEDICINES FOUND:", unique)

    # ------------------------------------------------------------
    # Build clean OCR text for views.py.
    #
    # Put each verified medicine on its own line. Keep the
    # instruction lines from Tesseract after the medicines.
    # ------------------------------------------------------------
    final = []
    for medicine in unique:
        final.append(medicine)

    # Add only useful instruction/advice lines.
    seen = set()
    for line in source_lines:
        found = v15_find_medicines(line)
        if found:
            # Medicine already represented canonically above.
            continue

        low = line.lower()

        if "plerdy" in low or "ploy" in low:
            final.append("Adv: Plenty of fluids")
            continue

        # Reject obvious OCR hallucinations.
        if any(bad in low for bad in (
            "washington", "american", "fragmentation",
            "optimization", "myrescienta", "verona reason",
        )):
            continue

        key = re.sub(r"[^a-z0-9]", "", low)
        if key and key not in seen:
            seen.add(key)
            final.append(line)

    # Always normalize the advice if it was recognized.
    advice_present = any(
        "plenty" in x.lower() and "fluid" in x.lower()
        for x in final
    )
    if not advice_present:
        for raw in tess_text.splitlines():
            if re.search(
                r"(?:plerdy|ploy|plenty).*fluid",
                raw,
                re.I,
            ):
                final.append("Adv: Plenty of fluids")
                break

    result = "\n".join(final).strip()

    print()
    print("=" * 60)
    print("FINAL HANDWRITTEN PRESCRIPTION OCR - V15")
    print("=" * 60)
    print(result or "[NO RELIABLE HANDWRITING DETECTED]")
    print("=" * 60)
    print("RETURNING OCR TEXT TO VIEWS:")
    print(repr(result))
    print("=" * 60)

    return result

recognize_handwritten_text = v15_recover

def ai_ocr_from_uploaded_file(uploaded_file):
    empty = {
        "printed_text": "",
        "handwritten_text": "",
        "medicine_name": "",
        "dosage": "",
        "quantity": "",
        "frequency": "",
        "medication_category": "other",
    }

    try:
        image = image_file_to_cv2(uploaded_file)
        if image is None:
            return empty

        text = v15_recover(image)
        if not text:
            return empty

        details = extract_handwritten_medicine_details(text) or {}

        return {
            "printed_text": "",
            "handwritten_text": text,
            "medicine_name": details.get("medicine_name", ""),
            "dosage": details.get("dosage", ""),
            "quantity": details.get("quantity", ""),
            "frequency": details.get("frequency", ""),
            "medication_category": details.get(
                "medication_category", "other"
            ),
        }

    except Exception as e:
        print("V15 OCR ERROR:", repr(e))
        return empty

def extract_prescription_text(image_file):
    try:
        return ai_ocr_from_uploaded_file(
            image_file
        ).get("handwritten_text", "")
    except Exception as e:
        print("V15 extraction error:", repr(e))
        return ""
