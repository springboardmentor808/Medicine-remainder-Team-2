import re

import cv2
import numpy as np
import pytesseract


TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

if __import__("os").path.exists(TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


KNOWN_MEDICINES = {
    "paracetamol": "Paracetamol",
    "acetaminophen": "Acetaminophen",
    "ibuprofen": "Ibuprofen",
    "aspirin": "Aspirin",
    "amoxicillin": "Amoxicillin",
    "azithromycin": "Azithromycin",
    "cetirizine": "Cetirizine",
    "levocetirizine": "Levocetirizine",
    "pantoprazole": "Pantoprazole",
    "omeprazole": "Omeprazole",
    "rabeprazole": "Rabeprazole",
    "metformin": "Metformin",
    "amlodipine": "Amlodipine",
    "losartan": "Losartan",
    "telmisartan": "Telmisartan",
    "atorvastatin": "Atorvastatin",
    "rosuvastatin": "Rosuvastatin",
    "montelukast": "Montelukast",
    "diclofenac": "Diclofenac",
    "naproxen": "Naproxen",
    "domperidone": "Domperidone",
    "ondansetron": "Ondansetron",
    "doxycycline": "Doxycycline",
    "cefixime": "Cefixime",
    "ciprofloxacin": "Ciprofloxacin",
    "ofloxacin": "Ofloxacin",
    "metronidazole": "Metronidazole",
    "prednisolone": "Prednisolone",
    "salbutamol": "Salbutamol",
    "levothyroxine": "Levothyroxine",
    "glimepiride": "Glimepiride",
    "insulin": "Insulin",
}


def _normalize_text(text):
    if not text:
        return ""

    text = str(text)
    text = text.replace("\x0c", "")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("—", "-").replace("–", "-")
    text = re.sub(r"[ \t]+", " ", text)

    lines = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if not re.search(r"[A-Za-z]", line):
            continue
        if len(re.sub(r"[^A-Za-z0-9]", "", line)) < 2:
            continue
        lines.append(line)

    return "\n".join(lines).strip()


def _prepare_variants(image):
    variants = [("original", image)]

    enlarged = cv2.resize(
        image,
        None,
        fx=2.0,
        fy=2.0,
        interpolation=cv2.INTER_CUBIC,
    )
    variants.append(("enlarged", enlarged))

    gray = cv2.cvtColor(enlarged, cv2.COLOR_BGR2GRAY)
    variants.append(("gray", gray))

    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8),
    )
    variants.append(("clahe", clahe.apply(gray)))

    return variants


def _score_text(text):
    if not text:
        return -1000

    score = 0
    lower = text.lower()

    # Prefer useful medicine/package text.
    useful_words = [
        "tablet", "tablets", "capsule", "capsules",
        "syrup", "injection", "cream", "ointment",
        "paracetamol", "acetaminophen", "ibuprofen",
        "amoxicillin", "azithromycin",
        "medicine", "composition",
    ]

    for word in useful_words:
        if word in lower:
            score += 10

    if re.search(
        r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|gm|ml|iu|%)\b",
        text,
        re.I,
    ):
        score += 20

    if re.search(
        r"\b\d+\s*(?:tablets?|tabs?|capsules?|caps?)\b",
        text,
        re.I,
    ):
        score += 15

    # Medicine name recognition gets a strong boost.
    if _find_medicine_name(text):
        score += 40

    # Long readable text is preferable to one-word garbage.
    words = re.findall(r"[A-Za-z0-9]+", text)
    score += min(len(words), 20)

    # Penalize symbol-heavy garbage.
    symbols = len(re.findall(r"[^A-Za-z0-9\s.,/%()\-]", text))
    score -= symbols * 2

    return score


def extract_text_from_image(image_file):
    """
    Printed-text OCR for medicine boxes and printed prescriptions.

    This function is intentionally self-contained and imports no
    Django modules, preventing the circular-import error.
    """

    try:
        if image_file is None:
            return ""

        if isinstance(image_file, bytes):
            data = image_file
        elif hasattr(image_file, "read"):
            image_file.seek(0)
            data = image_file.read()
            image_file.seek(0)
        else:
            with open(str(image_file), "rb") as handle:
                data = handle.read()

        if not data:
            return ""

        array = np.frombuffer(data, dtype=np.uint8)
        image = cv2.imdecode(array, cv2.IMREAD_COLOR)

        if image is None:
            return ""

        candidates = []

        for variant_name, prepared in _prepare_variants(image):
            for psm in (6, 11, 12):
                try:
                    text = pytesseract.image_to_string(
                        prepared,
                        lang="eng",
                        config=f"--oem 3 --psm {psm}",
                    )
                    text = _normalize_text(text)

                    if text:
                        candidates.append(
                            (
                                _score_text(text),
                                text,
                                variant_name,
                                psm,
                            )
                        )
                except Exception as error:
                    print(
                        f"Tesseract error "
                        f"{variant_name}/psm{psm}: {repr(error)}"
                    )

        if not candidates:
            return ""

        candidates.sort(
            key=lambda item: item[0],
            reverse=True,
        )

        best_score, best_text, variant, psm = candidates[0]

        print(
            f"Printed OCR selected: "
            f"{variant}/psm{psm}, score={best_score}"
        )
        print(best_text)

        return best_text

    except Exception as error:
        print(
            "extract_text_from_image error:",
            repr(error),
        )
        return ""


def _normalize_medicine(value):
    value = str(value or "").lower()

    replacements = {
        "0": "o",
        "1": "l",
        "!": "l",
        "|": "l",
        "5": "s",
        "$": "s",
        "@": "a",
        "4": "a",
        "3": "e",
        "7": "t",
    }

    for old, new in replacements.items():
        value = value.replace(old, new)

    return re.sub(r"[^a-z]", "", value)


def _edit_distance(a, b):
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
    if not text:
        return ""

    normalized_text = _normalize_medicine(text)

    # Exact / substring match.
    for key, display_name in KNOWN_MEDICINES.items():
        clean_key = _normalize_medicine(key)

        if clean_key and clean_key in normalized_text:
            return display_name

    # Fuzzy word match.
    words = re.findall(r"[A-Za-z0-9!@$|]{4,30}", text)

    best_name = ""
    best_distance = 999

    for word in words:
        normalized_word = _normalize_medicine(word)

        if len(normalized_word) < 4:
            continue

        for key, display_name in KNOWN_MEDICINES.items():
            normalized_key = _normalize_medicine(key)

            distance = _edit_distance(
                normalized_word,
                normalized_key,
            )

            # Allow a missing first character:
            # "aracetamo" -> "paracetamol"
            if (
                normalized_word
                and normalized_key.endswith(normalized_word)
            ):
                distance = min(distance, 1)

            allowed = max(
                1,
                int(len(normalized_key) * 0.30),
            )

            if (
                distance <= allowed
                and distance < best_distance
            ):
                best_distance = distance
                best_name = display_name

    return best_name


def _extract_dosage(text):
    match = re.search(
        r"\b\d+(?:\.\d+)?\s*"
        r"(?:mg|mcg|g|gm|ml|iu|%)\b",
        text or "",
        re.I,
    )

    if not match:
        return ""

    return re.sub(
        r"\s+",
        " ",
        match.group(0).strip(),
    )


def _extract_quantity(text):
    patterns = [
        r"\b(\d+)\s*(?:tablets?|tabs?)\b",
        r"\b(\d+)\s*(?:capsules?|caps?)\b",
        r"\b(?:qty|quantity)\s*[:\-]?\s*(\d+)\b",
        r"\b(\d+)\s*strips?\b",
        r"\b(\d+)\s*bottles?\b",
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            text or "",
            re.I,
        )

        if match:
            return match.group(1)

    return ""


def _extract_frequency(text):
    patterns = [
        (r"\b(?:OD)\b", "Once daily"),
        (r"\b(?:BD|BID)\b", "Twice daily"),
        (r"\b(?:TDS|TID)\b", "Three times daily"),
        (r"\bQID\b", "Four times daily"),
        (r"\b(?:HS)\b", "At bedtime"),
        (r"\b(?:SOS|PRN)\b", "When required"),
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
        (r"\bdaily\b", "Daily"),
    ]

    for pattern, value in patterns:
        if re.search(pattern, text or "", re.I):
            return value

    schedule = re.search(
        r"\b[01]\s*[-/]\s*[01]\s*[-/]\s*[01]\b",
        text or "",
    )

    if schedule:
        mapping = {
            "1-0-0": "Morning",
            "0-1-0": "Afternoon",
            "0-0-1": "Night",
            "1-0-1": "Twice daily",
            "1-1-0": "Twice daily",
            "0-1-1": "Twice daily",
            "1-1-1": "Three times daily",
        }

        value = schedule.group(0).replace("/", "-")
        return mapping.get(value, value)

    return ""


def extract_medicine_details(text):
    """
    Return the same public function expected by medicines/views.py.
    """

    text = _normalize_text(text)

    medicine_name = _find_medicine_name(text)
    dosage = _extract_dosage(text)
    quantity_number = _extract_quantity(text)
    frequency = _extract_frequency(text)

    quantity = quantity_number

    # If OCR says "40 Tablets", return the useful display form.
    if quantity_number:
        tablet_match = re.search(
            rf"\b{re.escape(quantity_number)}\s*"
            r"(tablets?|tabs?)\b",
            text,
            re.I,
        )
        capsule_match = re.search(
            rf"\b{re.escape(quantity_number)}\s*"
            r"(capsules?|caps?)\b",
            text,
            re.I,
        )

        if tablet_match:
            quantity = (
                f"{quantity_number} "
                f"{tablet_match.group(1).title()}"
            )
        elif capsule_match:
            quantity = (
                f"{quantity_number} "
                f"{capsule_match.group(1).title()}"
            )

    return {
        "medicine_name": medicine_name,
        "dosage": dosage,
        "quantity": quantity,
        "frequency": frequency,
    }
