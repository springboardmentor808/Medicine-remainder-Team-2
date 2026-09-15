import re


# ============================================================
# COMMON MEDICINE / PRESCRIPTION ABBREVIATIONS
# ============================================================

FREQUENCY_PATTERNS = {
    "OD": "Once daily",
    "BD": "Twice daily",
    "BID": "Twice daily",
    "TDS": "Three times daily",
    "TID": "Three times daily",
    "QID": "Four times daily",
    "HS": "At bedtime",
    "SOS": "When required",
    "PRN": "When required",
    "QW": "Once weekly",
    "QOD": "Every other day",
}


# ============================================================
# COMMON OCR NORMALIZATION
# ============================================================

def normalize_ocr_text(text):
    """Normalize common OCR mistakes without destroying useful text."""

    if not text:
        return ""

    text = str(text)

    text = text.replace("\x0c", "")
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # Normalize common Unicode punctuation.
    replacements = {
        "\u2013": "-",
        "\u2014": "-",
        "\u2212": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u00a0": " ",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    # Common OCR variants around dosage units.
    text = re.sub(r"(?i)(\d)\s*[oO]\s*(mg|mcg|ml|g)\b", r"\1 \2", text)
    text = re.sub(r"(?i)\b(mg|mcg|ml|gm|iu)\s*\.?\b", lambda m: m.group(1), text)

    # Normalize whitespace but preserve lines.
    text = re.sub(r"[ \t]+", " ", text)

    cleaned_lines = []

    for line in text.splitlines():
        line = line.strip()

        if not line:
            continue

        line = re.sub(
            r"\s+([,.;:)])",
            r"\1",
            line,
        )

        line = re.sub(
            r"([,.;:])\1{2,}",
            r"\1",
            line,
        )

        cleaned_lines.append(line)

    return "\n".join(cleaned_lines)


# ============================================================
# CLEAN OCR TEXT
# ============================================================

def clean_ocr_text(text):
    """
    Clean OCR text while preserving prescription lines.
    """

    text = normalize_ocr_text(text)

    if not text:
        return ""

    cleaned_lines = []

    for line in text.splitlines():

        line = line.strip()

        if not line:
            continue

        # Ignore pure punctuation / number garbage.
        if not re.search(r"[A-Za-z]", line):
            continue

        if len(re.sub(r"[^A-Za-z0-9]", "", line)) < 2:
            continue

        cleaned_lines.append(line)

    return "\n".join(cleaned_lines).strip()


# ============================================================
# EXTRACT DOSAGE
# ============================================================

def extract_dosage(text):

    if not text:
        return ""

    patterns = [
        # 500 mg, 10 mg, 2.5 ml
        r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|gm|ml|IU|%|mg/ml|mcg/ml)\b",

        # 500mg/5ml, 10 mg / 5 ml
        r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|gm)\s*/\s*"
        r"\d+(?:\.\d+)?\s*(?:ml|mL)\b",

        # 500 mg per 5 ml
        r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|gm)\s+per\s+"
        r"\d+(?:\.\d+)?\s*(?:ml|mL)\b",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE,
        )

        if match:
            return re.sub(
                r"\s+",
                " ",
                match.group(0).strip(),
            )

    return ""


# ============================================================
# EXTRACT FREQUENCY
# ============================================================

def extract_frequency(text):

    if not text:
        return ""

    upper_text = text.upper()

    # --------------------------------------------------------
    # Standard prescription abbreviations
    # --------------------------------------------------------

    for abbreviation, meaning in FREQUENCY_PATTERNS.items():

        pattern = (
            r"(?<![A-Z])"
            + re.escape(abbreviation)
            + r"(?![A-Z])"
        )

        if re.search(pattern, upper_text):
            return meaning

    # --------------------------------------------------------
    # Numeric schedule: 1-0-1 / 1-1-1 / 0-0-1
    # --------------------------------------------------------

    schedule_match = re.search(
        r"\b([01])\s*[-/]\s*([01])\s*[-/]\s*([01])\b",
        text,
    )

    if schedule_match:
        schedule = "-".join(
            schedule_match.groups()
        )

        mapping = {
            "1-0-0": "Morning",
            "0-1-0": "Afternoon",
            "0-0-1": "Night",
            "1-0-1": "Twice daily",
            "1-1-0": "Twice daily",
            "0-1-1": "Twice daily",
            "1-1-1": "Three times daily",
        }

        return mapping.get(
            schedule,
            schedule,
        )

    # --------------------------------------------------------
    # Written frequency
    # --------------------------------------------------------

    patterns = [
        (
            r"\bthree\s+times\s+(?:daily|a\s+day|per\s+day)\b",
            "Three times daily",
        ),
        (
            r"\bfour\s+times\s+(?:daily|a\s+day|per\s+day)\b",
            "Four times daily",
        ),
        (
            r"\btwice\s+(?:daily|a\s+day|per\s+day)\b",
            "Twice daily",
        ),
        (
            r"\bonce\s+(?:daily|a\s+day|per\s+day)\b",
            "Once daily",
        ),
        (
            r"\b(\d+)\s*(?:times|x)\s*(?:a\s+day|per\s+day|daily)\b",
            lambda m: f"{m.group(1)} times daily",
        ),
        (
            r"\bevery\s+other\s+day\b",
            "Every other day",
        ),
        (
            r"\bonce\s+a\s+week\b",
            "Once weekly",
        ),
        (
            r"\bdaily\b",
            "Daily",
        ),
        (
            r"\bmorning\b",
            "Morning",
        ),
        (
            r"\bafternoon\b",
            "Afternoon",
        ),
        (
            r"\bevening\b",
            "Evening",
        ),
        (
            r"\bnight\b",
            "Night",
        ),
    ]

    for pattern, result in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE,
        )

        if match:
            if callable(result):
                return result(match)
            return result

    return ""


# ============================================================
# EXTRACT DURATION
# ============================================================

def extract_duration(text):

    if not text:
        return ""

    patterns = [
        r"\b\d+\s*(?:days?|d)\b",
        r"\b\d+\s*(?:weeks?|wks?|wk)\b",
        r"\b\d+\s*(?:months?|mths?|mo)\b",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE,
        )

        if match:
            return match.group(0).strip()

    return ""


# ============================================================
# EXTRACT QUANTITY
# ============================================================

def extract_quantity(text):

    if not text:
        return ""

    patterns = [
        r"\b(?:qty|quantity)\s*[:\-]?\s*(\d+)\b",
        r"\b(\d+)\s*(?:tabs?|tablets?)\b",
        r"\b(\d+)\s*(?:caps?|capsules?)\b",
        r"\b(\d+)\s*(?:strips?)\b",
        r"\b(\d+)\s*(?:bottles?)\b",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE,
        )

        if match:
            return match.group(1)

    return ""


# ============================================================
# EXTRACT INSTRUCTIONS
# ============================================================

def extract_instructions(text):

    if not text:
        return ""

    instructions = []

    instruction_patterns = [
        (
            r"\bafter\s+(?:food|meal)\b",
            "After food",
        ),
        (
            r"\bbefore\s+(?:food|meal)\b",
            "Before food",
        ),
        (
            r"\bwith\s+(?:food|meal)\b",
            "With food",
        ),
        (
            r"\bon\s+empty\s+stomach\b",
            "On empty stomach",
        ),
        (
            r"\bat\s+bedtime\b",
            "At bedtime",
        ),
        (
            r"\bbefore\s+sleep\b",
            "Before sleep",
        ),
        (
            r"\bafter\s+breakfast\b",
            "After breakfast",
        ),
        (
            r"\bbefore\s+breakfast\b",
            "Before breakfast",
        ),
        (
            r"\bafter\s+lunch\b",
            "After lunch",
        ),
        (
            r"\bbefore\s+lunch\b",
            "Before lunch",
        ),
        (
            r"\bafter\s+dinner\b",
            "After dinner",
        ),
        (
            r"\bbefore\s+dinner\b",
            "Before dinner",
        ),
        (
            r"\bdrink\s+plenty\s+of\s+water\b",
            "Drink plenty of water",
        ),
    ]

    for pattern, result in instruction_patterns:

        if re.search(
            pattern,
            text,
            re.IGNORECASE,
        ):
            if result not in instructions:
                instructions.append(result)

    return ", ".join(instructions)


# ============================================================
# FIND POSSIBLE MEDICINE LINES
# ============================================================

def extract_medicine_candidates(text):
    """Return medicine-bearing prescription lines in original order.

    A line can be a medicine line because it has a dosage/form/frequency,
    or because it contains a known medicine name.  Known names are useful
    for short handwritten OCR results such as ``Pantocid daily before food``.
    """
    if not text:
        return []

    lines = str(text).replace("\r\n", "\n").replace("\r", "\n").split("\n")
    candidates = []

    ignore_prefix = re.compile(
        r"^(?:patient|patient name|age|date|doctor|doctor name|diagnosis|"
        r"advice|follow.?up|review|prescription|prescription details|"
        r"address|phone|mobile|signature)\b",
        re.IGNORECASE,
    )

    medicine_form_pattern = re.compile(
        r"\b(?:tab(?:let)?s?|cap(?:sule)?s?|syr(?:up)?|syp|inj(?:ection)?s?|"
        r"drop(?:s)?|cream|gel|ointment|solution|suspension|powder)\b",
        re.IGNORECASE,
    )

    # Keep this list synchronized with the OCR service's focused dictionary.
    known_names = [
        "pantocid", "ascoril", "paracetamol", "acetaminophen", "ibuprofen",
        "diclofenac", "amoxicillin", "azithromycin", "azithral", "cetirizine",
        "levocetirizine", "omeprazole", "pantoprazole", "metformin", "amlodipine",
        "losartan", "atorvastatin", "thyroxine", "levothyroxine", "aspirin",
        "insulin", "dolo", "rebanta", "cartilex", "ultrafen", "ultrafen-plus",
    ]

    for line in lines:
        original_line = line.strip()
        if not original_line:
            continue

        cleaned = re.sub(r"^\s*\d+\s*[\.\)\-:]\s*", "", original_line)
        cleaned = re.sub(r"^\s*Rx\s*[:\-]?\s*", "", cleaned, flags=re.IGNORECASE).strip()
        if len(cleaned) < 3 or ignore_prefix.search(cleaned):
            continue

        low = cleaned.lower()
        has_known = any(name in re.sub(r"[^a-z0-9-]", "", low) for name in known_names)
        has_dosage = bool(extract_dosage(cleaned))
        has_frequency = bool(extract_frequency(cleaned))
        has_quantity = bool(extract_quantity(cleaned))
        has_form = bool(medicine_form_pattern.search(cleaned))

        words = re.findall(r"\b[A-Za-z][A-Za-z0-9-]*\b", cleaned)
        if has_known or has_form or ((has_dosage or has_frequency or has_quantity) and 1 <= len(words) <= 12):
            candidates.append(cleaned)

    unique = []
    seen = set()
    for candidate in candidates:
        key = re.sub(r"\s+", " ", candidate.lower()).strip()
        if key not in seen:
            seen.add(key)
            unique.append(candidate)
    return unique


# ============================================================
# EXTRACT MEDICINE NAME FROM A LINE
# ============================================================

def extract_medicine_name(line):

    if not line:
        return ""

    line = line.strip()

    # Prefer a known medicine name when OCR contains extra instructions
    # on the same line. This prevents returning the entire sentence as
    # the medicine name.
    known_aliases = {
        "pantocid": "Pantocid",
        "ascoril": "Ascoril",
        "azithral": "Azithral",
        "azithromycin": "Azithromycin",
        "paracetamol": "Paracetamol",
        "cetirizine": "Cetirizine",
        "levocetirizine": "Levocetirizine",
        "omeprazole": "Omeprazole",
        "pantoprazole": "Pantoprazole",
        "dolo": "Dolo",
        "diclofenac": "Diclofenac",
    }
    compact = re.sub(r"[^a-z0-9]", "", line.lower())
    for key, display in known_aliases.items():
        if key in compact:
            return display

    # --------------------------------------------------------
    # Remove numbering
    # --------------------------------------------------------

    line = re.sub(
        r"^\s*\d+\s*[\.\)\-:]\s*",
        "",
        line,
    )

    # --------------------------------------------------------
    # Remove common prescription prefixes
    # --------------------------------------------------------

    line = re.sub(
        r"^\s*(?:rx|medicine)\s*[:\.\-]?\s*",
        "",
        line,
        flags=re.IGNORECASE,
    )

    # --------------------------------------------------------
    # Remove medicine form from beginning/end
    # --------------------------------------------------------

    line = re.sub(
        r"^\s*(?:tab(?:let)?s?|cap(?:sule)?s?|"
        r"syr(?:up)?|inj(?:ection)?s?|"
        r"drop(?:s)?|cream|gel|ointment|"
        r"solution|suspension|powder)\s*[:.\-]?\s*",
        "",
        line,
        flags=re.IGNORECASE,
    )

    # --------------------------------------------------------
    # Remove dosage
    # --------------------------------------------------------

    line = re.sub(
        r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|gm|ml|IU|%)\b",
        " ",
        line,
        flags=re.IGNORECASE,
    )

    # --------------------------------------------------------
    # Remove frequency
    # --------------------------------------------------------

    line = re.sub(
        r"\b(?:OD|BD|BID|TDS|TID|QID|HS|SOS|PRN|QW|QOD)\b",
        " ",
        line,
        flags=re.IGNORECASE,
    )

    # --------------------------------------------------------
    # Remove numeric schedule
    # --------------------------------------------------------

    line = re.sub(
        r"\b[01]\s*[-/]\s*[01]\s*[-/]\s*[01]\b",
        " ",
        line,
    )

    # --------------------------------------------------------
    # Remove quantity
    # --------------------------------------------------------

    line = re.sub(
        r"\b\d+\s*(?:tabs?|tablets?|caps?|capsules?|"
        r"strips?|bottles?)\b",
        " ",
        line,
        flags=re.IGNORECASE,
    )

    line = re.sub(
        r"\b(?:qty|quantity)\s*[:\-]?\s*\d+\b",
        " ",
        line,
        flags=re.IGNORECASE,
    )

    # --------------------------------------------------------
    # Remove duration
    # --------------------------------------------------------

    line = re.sub(
        r"\b\d+\s*(?:days?|weeks?|wks?|wk|months?|mths?|mo)\b",
        " ",
        line,
        flags=re.IGNORECASE,
    )

    # --------------------------------------------------------
    # Remove instructions
    # --------------------------------------------------------

    line = re.sub(
        r"\b(?:take|drink|use|apply|consume)\b.*$",
        "",
        line,
        flags=re.IGNORECASE,
    )

    # --------------------------------------------------------
    # Remove common instruction phrases anywhere
    # --------------------------------------------------------

    line = re.sub(
        r"\b(?:after|before|with|without)\s+"
        r"(?:food|meal|breakfast|lunch|dinner)\b",
        " ",
        line,
        flags=re.IGNORECASE,
    )

    # --------------------------------------------------------
    # Remove separators / excess punctuation
    # --------------------------------------------------------

    line = re.sub(
        r"[\-_:|]+",
        " ",
        line,
    )

    line = re.sub(
        r"\s+",
        " ",
        line,
    )

    line = line.strip(
        " :-.,;()[]{}"
    )

    if not line:
        return ""

    # Must contain letters.
    if not re.search(
        r"[A-Za-z]",
        line,
    ):
        return ""

    # Don't return obvious headings.
    ignored = {
        "patient",
        "patient name",
        "name",
        "age",
        "date",
        "doctor",
        "doctor name",
        "diagnosis",
        "advice",
        "prescription",
        "rx",
        "medicine",
        "dosage",
        "quantity",
        "qty",
    }

    if line.lower() in ignored:
        return ""

    return line


# ============================================================
# MAIN EXTRACTION FUNCTION
# ============================================================

def extract_prescription_details(text):

    text = clean_ocr_text(text)

    if not text:

        return {
            "raw_text": "",
            "medicines": [],
            "overall_dosage": "",
            "overall_frequency": "",
            "overall_duration": "",
            "overall_quantity": "",
            "instructions": "",
        }

    # --------------------------------------------------------
    # General prescription information
    # --------------------------------------------------------

    overall_dosage = extract_dosage(text)

    overall_frequency = extract_frequency(text)

    overall_duration = extract_duration(text)

    overall_quantity = extract_quantity(text)

    instructions = extract_instructions(text)

    # --------------------------------------------------------
    # Medicine candidates
    # --------------------------------------------------------

    medicine_lines = extract_medicine_candidates(
        text
    )

    medicines = []

    for line in medicine_lines:

        medicine_name = extract_medicine_name(
            line
        )

        dosage = extract_dosage(
            line
        )

        frequency = extract_frequency(
            line
        )

        duration = extract_duration(
            line
        )

        quantity = extract_quantity(
            line
        )

        medicine_instructions = extract_instructions(
            line
        )

        if medicine_name:

            medicines.append(
                {
                    "medicine_name": medicine_name,
                    "dosage": dosage,
                    "frequency": frequency,
                    "duration": duration,
                    "quantity": quantity,
                    "instructions": medicine_instructions,
                    "source_line": line,
                }
            )

    # --------------------------------------------------------
    # If no structured medicine line was found, don't invent
    # a medicine name from arbitrary prescription text.
    # --------------------------------------------------------

    return {
        "raw_text": text,
        "medicines": medicines,
        "overall_dosage": overall_dosage,
        "overall_frequency": overall_frequency,
        "overall_duration": overall_duration,
        "overall_quantity": overall_quantity,
        "instructions": instructions,
    }
