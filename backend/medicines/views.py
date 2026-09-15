# ============================================================
# IMPORTS
# ============================================================

import io
import re
import traceback
from datetime import date

from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Medicine,
    Condition,
    Prescription,
)

from .serializers import (
    MedicineSerializer,
    ConditionSerializer,
    PrescriptionSerializer,
)

from .ocr_service import (
    extract_text_from_image,
    extract_medicine_details,
)

from .ai_ocr_service import (
    ai_ocr_from_uploaded_file,
    extract_prescription_text,
)

from ml.medicine_prediction_service import (
    predict_medicine,
)

from notifications.models import Notification


# ============================================================
# COMMON IMAGE VALIDATION
# ============================================================

ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
]


def validate_image_upload(image, max_size_mb=5):
    """
    Validate uploaded image.
    Returns None if valid, Response if invalid.
    """

    if not image:
        return Response(
            {
                "success": False,
                "error": "Please upload an image.",
                "message": "Please upload an image.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if image.content_type not in ALLOWED_IMAGE_TYPES:
        return Response(
            {
                "success": False,
                "error": "Only JPG, JPEG, PNG and WEBP images are allowed.",
                "message": "Only JPG, JPEG, PNG and WEBP images are allowed.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    max_size = max_size_mb * 1024 * 1024

    if image.size > max_size:
        return Response(
            {
                "success": False,
                "error": f"Image size must be less than {max_size_mb} MB.",
                "message": f"Image size must be less than {max_size_mb} MB.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return None


def read_image_bytes(image):
    """
    Read an UploadedFile once and return raw bytes.
    Rewinds the stream so repeated access is safe.
    """
    image.seek(0)
    data = image.read()
    image.seek(0)
    return data


# ============================================================
# REMINDER SYNCHRONIZATION
# ============================================================

def create_medicine_reminders(medicine, user):
    from reminders.models import Reminder

    if not medicine.reminder_enabled:
        return []

    reminder_times = medicine.reminder_times or []
    created_reminders = []

    if reminder_times:
        for time_value in reminder_times:
            if not time_value:
                continue
            reminder = Reminder.objects.create(
                user=user,
                medicine=medicine,
                reminder_time=time_value,
                is_taken=False,
                status="Pending",
            )
            created_reminders.append(reminder)
    else:
        reminder = Reminder.objects.create(
            user=user,
            medicine=medicine,
            reminder_time=medicine.reminder_time,
            is_taken=False,
            status="Pending",
        )
        created_reminders.append(reminder)

    return created_reminders


# ============================================================
# MEDICINE LIST + CREATE
# ============================================================

class MedicineListCreateView(generics.ListCreateAPIView):

    serializer_class = MedicineSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Medicine.objects
            .filter(user=self.request.user)
            .select_related("condition")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        medicine = serializer.save(user=self.request.user)
        create_medicine_reminders(medicine, self.request.user)


# ============================================================
# MEDICINE DETAIL
# ============================================================

class MedicineDetailView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = MedicineSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Medicine.objects
            .filter(user=self.request.user)
            .select_related("condition")
        )

    def perform_update(self, serializer):
        medicine = serializer.save()
        from reminders.models import Reminder
        Reminder.objects.filter(
            medicine=medicine,
            user=self.request.user,
        ).delete()
        create_medicine_reminders(medicine, self.request.user)

    def perform_destroy(self, instance):
        from reminders.models import Reminder
        Reminder.objects.filter(
            medicine=instance,
            user=self.request.user,
        ).delete()
        instance.delete()


# ============================================================
# PRINTED MEDICINE / PRESCRIPTION OCR
# ============================================================

class MedicineOCRView(APIView):

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):

        image = request.FILES.get("image")

        validation_error = validate_image_upload(
            image,
            max_size_mb=5,
        )

        if validation_error:
            return validation_error

        try:
            image_bytes = read_image_bytes(image)

            # Printed medicine/package OCR.
            extracted_text = extract_text_from_image(
                io.BytesIO(image_bytes)
            )

            medicine_details = (
                extract_medicine_details(
                    extracted_text
                )
                if extracted_text
                else {
                    "medicine_name": "",
                    "dosage": "",
                    "quantity": "",
                    "frequency": "",
                }
            )

            medicine_name = (
                medicine_details.get(
                    "medicine_name",
                    "",
                )
                or ""
            )

            dosage = (
                medicine_details.get(
                    "dosage",
                    "",
                )
                or ""
            )

            quantity = (
                medicine_details.get(
                    "quantity",
                    "",
                )
                or ""
            )

            frequency = (
                medicine_details.get(
                    "frequency",
                    "",
                )
                or ""
            )

            return Response(
                {
                    "success": bool(
                        extracted_text
                        or medicine_name
                    ),
                    "message": (
                        "OCR completed successfully."
                        if extracted_text or medicine_name
                        else
                        "No reliable printed text detected."
                    ),
                    "text": extracted_text,
                    "raw_text": extracted_text,
                    "printed_text": extracted_text,
                    "handwritten_text": "",
                    "medicine_name": medicine_name,
                    "dosage": dosage,
                    "quantity": quantity,
                    "frequency": frequency,
                    "medicine": {
                        "medicine_name": medicine_name,
                        "dosage": dosage,
                        "quantity": quantity,
                        "frequency": frequency,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            print(
                "MEDICINE OCR ERROR:",
                repr(error),
            )
            traceback.print_exc()

            return Response(
                {
                    "success": False,
                    "error": "OCR processing failed.",
                    "message": "OCR processing failed.",
                    "details": str(error),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ============================================================
# AI MEDICINE IMAGE RECOGNITION
# ============================================================

class MedicineImagePredictionView(APIView):

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):

        image = request.FILES.get("image")

        validation_error = validate_image_upload(image, max_size_mb=5)
        if validation_error:
            return validation_error

        try:
            image_bytes = read_image_bytes(image)

            result = predict_medicine(io.BytesIO(image_bytes))

            if not result.get("success", False):
                return Response(
                    result,
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                {
                    "success": True,
                    "message": "Medicine image recognized successfully.",
                    "medicine_name": result.get("medicine_name"),
                    "confidence": result.get("confidence"),
                    "predictions": result.get("predictions", []),
                },
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            print("MEDICINE AI ERROR:", repr(error))
            traceback.print_exc()
            return Response(
                {
                    "success": False,
                    "error": "Medicine image recognition failed.",
                    "message": "Medicine image recognition failed.",
                    "details": str(error),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ============================================================
# HANDWRITTEN PRESCRIPTION AI OCR
# ============================================================

def _direct_parse_prescription_lines(text):
    """
    Robust handwritten prescription parser.

    IMPORTANT:
    A line is a NEW MEDICINE only when it contains a recognizable
    medicine name.  Lines such as:
        1 tab once daily...
        once daily before breakfast...
        twice daily after food...
        at night...
    are instructions and MUST be attached to the previous medicine.

    This prevents OCR noise like:
        Tab. nce daily before breakfast...
    from becoming a fake medicine.
    """

    medicines = []
    advice_lines = []

    # Known medicines used by the PillSync prescription OCR.
    # Add more names here as your medicine database grows.
    known_medicines = {
        "augmentin": "Augmentin",
        "pantop": "Pantop",
        "pantocid": "Pantocid",
        "pantoprazole": "Pantoprazole",
        "azithral": "Azithral",
        "azithromycin": "Azithromycin",
        "dolo": "Dolo",
        "levocet": "Levocet",
        "levocetirizine": "Levocetirizine",
        "ascoril": "Ascoril",
        "ascoril ls": "Ascoril LS",
        "paracetamol": "Paracetamol",
        "amoxicillin": "Amoxicillin",
        "cetirizine": "Cetirizine",
        "ibuprofen": "Ibuprofen",
        "omeprazole": "Omeprazole",
        "rabeprazole": "Rabeprazole",
    }

    # Common OCR spellings.
    aliases = {
        "augmentin": "Augmentin",
        "augmentin 625": "Augmentin 625",
        "augmentn": "Augmentin",
        "augmentim": "Augmentin",
        "pantop": "Pantop",
        "pantop 40": "Pantop 40",
        "pantop40": "Pantop 40",
        "pantoprazole": "Pantoprazole",
        "pantocid": "Pantocid",
        "pantocid 40": "Pantocid 40",
        "pantoprazole": "Pantoprazole",
        "azithral": "Azithral",
        "azithromycin": "Azithromycin",
        "dolo": "Dolo",
        "levocet": "Levocet",
        "ascoril": "Ascoril",
        "ascoril ls": "Ascoril LS",
    }

    form_map = {
        "tab": "Tab.",
        "tabs": "Tab.",
        "tablet": "Tab.",
        "tablets": "Tab.",
        "cap": "Cap.",
        "caps": "Cap.",
        "capsule": "Cap.",
        "capsules": "Cap.",
        "syp": "Syp.",
        "sypup": "Syp.",
        "syr": "Syp.",
        "syrup": "Syp.",
        "inj": "Inj.",
        "injection": "Inj.",
    }

    form_pattern = re.compile(
        r"^\s*[\(\[\]{}0OoQqIl1#*.,;:|\-]*\s*"
        r"(Tab(?:let)?s?|Cap(?:sule)?s?|Syp(?:up)?|Syr(?:up)?|"
        r"Inj(?:ection)?)\s*[\.:/\-]*\s*",
        re.I,
    )

    metadata_pattern = re.compile(
        r"\b(patient|patient name|age|sex|agency|date|doctor|"
        r"mbbs|consultant|clinic|regd|registration|timing|phone|ph)\b",
        re.I,
    )

    instruction_only_pattern = re.compile(
        r"^\s*(?:"
        r"\d+\s*)?(?:tab(?:let)?s?|caps?|capsule|"
        r"once|nce|twice|thrice|daily|"
        r"at\s+night|night|"
        r"sos|po|od|bd|bid|tds|tid|qid|"
        r"before\s+(?:food|breakfast|meal)|"
        r"after\s+(?:food|breakfast|meal)|"
        r"for\s+fever"
        r")\b",
        re.I,
    )

    def normalize_text(value):
        value = str(value or "")
        value = value.replace("0", "o")
        value = value.replace("1", "l")
        value = value.replace("!", "l")
        value = value.replace("|", "l")
        return re.sub(r"\s+", " ", value).strip()

    def clean_strength(value):
        """
        Fix OCR garbage after strengths:
          625.000 -> 625
          40.000.000.000 -> 40
        """
        value = str(value or "")
        m = re.search(r"\b(\d{2,5})(?:\.0+)+\b", value)
        if m:
            value = value[:m.start()] + m.group(1) + value[m.end():]

        # Also remove repeated decimal-zero fragments.
        value = re.sub(
            r"(\b\d{2,5})(?:\.0+){1,}\b",
            r"\1",
            value,
        )
        return value

    def find_known_medicine(name_part):
        """
        Return a canonical medicine name while preserving strength.
        """
        cleaned = clean_strength(name_part)
        cleaned = re.sub(r"\.{2,}", " ", cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned).strip(" .:-")

        normalized = re.sub(
            r"[^a-z0-9 ]",
            "",
            cleaned.lower(),
        ).strip()

        # Exact / normalized alias first.
        if normalized in aliases:
            return aliases[normalized]

        # Normalize common medicine strengths when they are explicitly
        # present in the OCR text.
        explicit_strengths = {
            "augmentin625": "Augmentin 625",
            "augmentin625mg": "Augmentin 625",
            "dolo650": "Dolo 650",
            "dolo650mg": "Dolo 650",
            "pantop40": "Pantop 40",
            "pantop40mg": "Pantop 40",
            "pantocid40": "Pantocid 40",
            "pantocid40mg": "Pantocid 40",
        }

        compact_normalized = re.sub(r"[^a-z0-9]", "", normalized)
        if compact_normalized in explicit_strengths:
            return explicit_strengths[compact_normalized]

        # Known medicine at the beginning of the OCR text.
        for key, display in sorted(
            known_medicines.items(),
            key=lambda x: len(x[0]),
            reverse=True,
        ):
            if normalized == key:
                return display

            if normalized.startswith(key + " "):
                suffix = normalized[len(key):].strip()
                strength = re.search(
                    r"\b\d+(?:\.\d+)?\b",
                    suffix,
                )
                if strength:
                    return f"{display} {strength.group(0)}"
                return display

        # Fuzzy-ish OCR corrections for the specific medicines.
        compact = re.sub(r"[^a-z]", "", normalized)
        fuzzy = {
            "augmentn": "Augmentin",
            "augmentim": "Augmentin",
            "augmentin": "Augmentin",
            "pantop": "Pantop",
            "pantopc": "Pantop",
            "pantocid": "Pantocid",
            "azithral": "Azithral",
            "azithromycin": "Azithromycin",
            "dolo": "Dolo",
            "levocet": "Levocet",
            "ascoril": "Ascoril",
        }

        if compact in fuzzy:
            return fuzzy[compact]

        # If a known medicine is embedded in noisy OCR.
        for key, display in sorted(
            known_medicines.items(),
            key=lambda x: len(x[0]),
            reverse=True,
        ):
            key_compact = re.sub(r"[^a-z]", "", key)
            if key_compact in compact:
                strength = re.search(
                    r"\b\d+(?:\.\d+)?\b",
                    cleaned,
                )
                if strength:
                    return f"{display} {strength.group(0)}"
                return display

        return ""

    def remove_prescription_number_noise(name):
        """
        OCR often turns the item number into part of the medicine name:
            Pantop 2
            Ascoril LS 3
            Cetirizine 4

        A trailing single digit 1-9 is removed ONLY when:
        - the medicine is already a known medicine, and
        - the digit is not attached as a legitimate strength such as 40/500/625.
        """
        value = re.sub(r"\s+", " ", str(name or "")).strip()

        # Never remove multi-digit strengths.
        if re.search(r"\b(?:10|20|25|40|50|60|75|100|125|250|500|625|650|1000)\b", value):
            return value

        # Trailing item-number noise.
        value = re.sub(r"\s+[1-9]\s*$", "", value).strip(" .:-")

        return value

    def add_current(current):
        if not current:
            return None

        name_part = current["name"].strip(" .:-")
        name_part = clean_strength(name_part)
        # Remove OCR item-number noise BEFORE medicine matching.
        # Examples: Pantop 2 -> Pantop, Ascoril LS 3 -> Ascoril LS,
        # Cetirizine 4 -> Cetirizine. Real strengths such as 40/500/625
        # are preserved by remove_prescription_number_noise().
        name_part = remove_prescription_number_noise(name_part)

        canonical = find_known_medicine(name_part)

        # If OCR produced an instruction after "Tab.", do NOT create
        # a medicine from it.
        if not canonical:
            return None

        display_name = (
            f"{current['form']} {canonical}"
            if current["form"]
            else canonical
        )

        detail_text = " ".join(current["details"])
        detail_text = clean_strength(detail_text)
        detail_text = re.sub(r"\s+", " ", detail_text).strip()

        frequency = ""
        if re.search(
            r"\bonce\s+(?:a|per)\s+day\b|"
            r"\bonce\s+daily\b|"
            r"\bdaily\b|\bod\b",
            detail_text,
            re.I,
        ):
            frequency = "Daily"
        elif re.search(
            r"\btwice\s+(?:a|per)\s+day\b|"
            r"\btwice\s+daily\b|\bbd\b|\bbid\b",
            detail_text,
            re.I,
        ):
            frequency = "Twice daily"
        elif re.search(
            r"\bthrice\b|"
            r"\bthree\s+times\s+(?:a|per)\s+day\b|"
            r"\btds\b|\btid\b",
            detail_text,
            re.I,
        ):
            frequency = "Three times daily"
        elif re.search(
            r"\bqid\b|\bfour\s+times",
            detail_text,
            re.I,
        ):
            frequency = "Four times daily"
        elif re.search(r"\bsos\b", detail_text, re.I):
            frequency = "SOS"
        elif re.search(
            r"\bat\s+night\b|\bnight\b",
            detail_text,
            re.I,
        ):
            frequency = "At night"

        instruction = ""
        if re.search(
            r"\bbefore\s+(?:food|breakfast|meal)\b",
            detail_text,
            re.I,
        ):
            instruction = "Before food"
        elif re.search(
            r"\bafter\s+(?:food|breakfast|meal)\b",
            detail_text,
            re.I,
        ):
            instruction = "After food"
        elif re.search(r"\bfor\s+fever\b", detail_text, re.I):
            instruction = "For fever"

        duration = ""
        dm = re.search(
            r"\b(\d+)\s*(days?|weeks?|months?)\b",
            detail_text,
            re.I,
        )
        if dm:
            duration = (
                f"{dm.group(1)} "
                f"{dm.group(2).lower()}"
            )

        dosage = ""
        dose_match = re.search(
            r"\b(\d+(?:\.\d+)?)\s*"
            r"(mg|mcg|g|gm|ml|iu|%)\b",
            name_part + " " + detail_text,
            re.I,
        )
        if dose_match:
            dosage = (
                f"{dose_match.group(1)} "
                f"{dose_match.group(2)}"
            )

        # 1 tab / 1 cap / 10 ml
        if not dosage:
            dose_match = re.search(
                r"\b(\d+(?:\.\d+)?)\s*"
                r"(tab(?:let)?s?|cap(?:sule)?s?|ml)\b",
                detail_text,
                re.I,
            )
            if dose_match:
                amount = dose_match.group(1)
                unit = dose_match.group(2).lower()

                if unit.startswith("tab"):
                    unit = "tablet"
                elif unit.startswith("cap"):
                    unit = "capsule"

                dosage = f"{amount} {unit}"

        return {
            "medicine_name": display_name,
            "dosage": dosage,
            "quantity": "",
            "frequency": frequency,
            "duration": duration,
            "instructions": instruction,
            "source_line": current["source_line"],
        }

    current = None

    for raw in str(text or "").replace("\r", "\n").split("\n"):
        line = normalize_text(raw).strip(" \"'`")

        if not line:
            continue

        # Ignore patient/header/footer.
        if metadata_pattern.search(line):
            continue

        # Advice.
        if re.search(r"\badv(?:ice)?\b", line, re.I):
            advice_text = re.sub(
                r"^\s*adv(?:ice)?\s*[:.\-]*\s*",
                "",
                line,
                flags=re.I,
            ).strip()

            if advice_text:
                if re.search(
                    r"plenty.*(?:fluid|water|penes|fluids)",
                    advice_text,
                    re.I,
                ):
                    advice_lines.append("Plenty of fluids")
                else:
                    advice_lines.append(advice_text)
            continue

        if re.search(
            r"\bplenty\s+(?:of\s+)?(?:fluids?|water|penes)\b",
            line,
            re.I,
        ):
            advice_lines.append("Plenty of fluids")
            continue

        if re.fullmatch(r"\s*take\s+rest\.?\s*", line, re.I):
            advice_lines.append("Take rest")
            continue

        # --------------------------------------------------------
        # Try to identify a medicine START.
        # --------------------------------------------------------
        match = form_pattern.match(line)

        if match:
            form = form_map.get(
                match.group(1).lower(),
                match.group(1),
            )

            name_part = line[match.end():].strip(" .:-")
            name_part = remove_prescription_number_noise(name_part)

            # IMPORTANT:
            # "Tab. nce daily..." / "Tab. twice daily..." /
            # "Tab. at night..." are instruction lines, not medicines.
            if instruction_only_pattern.match(name_part):
                if current:
                    current["details"].append(name_part)
                continue

            candidate = find_known_medicine(name_part)

            # If this is a real medicine, close the previous block.
            if candidate:
                med = add_current(current)
                if med:
                    medicines.append(med)

                current = {
                    "form": form,
                    "name": name_part,
                    "details": [],
                    "source_line": raw.strip(),
                }
                continue

            # Form marker but unknown/non-medicine text:
            # attach it to current medicine instead of creating a fake one.
            if current:
                current["details"].append(line)
            continue

        # --------------------------------------------------------
        # No dosage-form marker.
        #
        # If it is a known medicine without "Tab.", accept it.
        # Otherwise attach it to the current medicine.
        # --------------------------------------------------------
        candidate = find_known_medicine(line)

        if candidate and not instruction_only_pattern.match(line):
            med = add_current(current)
            if med:
                medicines.append(med)

            current = {
                "form": "",
                "name": line,
                "details": [],
                "source_line": raw.strip(),
            }
            continue

        if current:
            current["details"].append(line)

    # Flush final medicine.
    med = add_current(current)
    if med:
        medicines.append(med)

    # ------------------------------------------------------------
    # FINAL MEDICINE-NAME NORMALIZATION + MERGE
    # ------------------------------------------------------------
    # OCR can still return item numbers after a medicine name, e.g.:
    #   Pantop 2
    #   Ascoril LS 3
    #   Cetirizine 4
    # Never allow those prescription row numbers into the API output.
    # Also merge duplicate entries such as Pantop + Pantop 2.
    merged = {}

    def final_clean_medicine_name(name):
        value = re.sub(r"\s+", " ", str(name or "")).strip(" .:-")

        # Remove a trailing single prescription row number.
        value = re.sub(r"\s+[1-9]\s*$", "", value).strip(" .:-")

        # Canonicalize the known medicines again after removing the number.
        m = re.match(r"^(Tab\.|Cap\.|Syp\.|Inj\.)\s*(.*)$", value, re.I)
        if m:
            form = m.group(1)
            body = m.group(2).strip()
            canonical = find_known_medicine(body)
            if canonical:
                return f"{form_map.get(form.rstrip('.').lower(), form)} {canonical}"
        else:
            canonical = find_known_medicine(value)
            if canonical:
                return canonical

        return value

    for med in medicines:
        if not isinstance(med, dict):
            continue

        cleaned_name = final_clean_medicine_name(
            med.get("medicine_name") or med.get("name") or ""
        )
        if not cleaned_name:
            continue

        med["medicine_name"] = cleaned_name
        key = re.sub(r"[^a-z]", "", cleaned_name.lower())

        if key not in merged:
            merged[key] = med
            continue

        # Merge fields from duplicate OCR blocks instead of dropping them.
        existing = merged[key]
        for field in ("dosage", "quantity", "frequency", "duration", "instructions"):
            if not existing.get(field) and med.get(field):
                existing[field] = med[field]

    unique = list(merged.values())

    # ------------------------------------------------------------
    # Clean advice.
    # ------------------------------------------------------------
    final_advice = []
    advice_seen = set()

    for item in advice_lines:
        item = re.sub(
            r"^\s*adv(?:ice)?\s*[:.\-]*\s*",
            "",
            item,
            flags=re.I,
        ).strip()

        if not item:
            continue

        key = item.lower()
        if key not in advice_seen:
            advice_seen.add(key)
            final_advice.append(item)

    return unique, "\n".join(final_advice)



# ============================================================
# FINAL STRICT MEDICINE FILTER
# ============================================================

_PILLSYNC_REAL_MEDICINES = {
    "augmentin": "Augmentin",
    "augmentin 625": "Augmentin 625",
    "pantop": "Pantop",
    "pantop 40": "Pantop 40",
    "pantocid": "Pantocid",
    "pantocid 40": "Pantocid 40",
    "pantoprazole": "Pantoprazole",
    "azithral": "Azithral",
    "azithromycin": "Azithromycin",
    "dolo": "Dolo",
    "dolo 650": "Dolo 650",
    "levocet": "Levocet",
    "levocetirizine": "Levocetirizine",
    "ascoril": "Ascoril",
    "ascoril ls": "Ascoril LS",
    "cetirizine": "Cetirizine",
    "paracetamol": "Paracetamol",
    "amoxicillin": "Amoxicillin",
    "ibuprofen": "Ibuprofen",
    "diclofenac": "Diclofenac",
    "omeprazole": "Omeprazole",
    "rabeprazole": "Rabeprazole",
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
}

_PILLSYNC_FALSE_MEDICINE_WORDS = {
    "twice", "once", "thrice", "daily", "night", "morning", "evening",
    "breakfast", "lunch", "dinner", "food", "after", "before", "meal",
    "take", "taken", "tablet", "tablets", "tab", "capsule", "capsules",
    "cap", "syrup", "syp", "injection", "inj", "days", "day", "week",
    "weeks", "month", "months", "fever", "fluids", "water", "po", "od",
    "bd", "bid", "tds", "tid", "qid", "sos", "prn", "patient", "name",
    "age", "sex", "female", "male", "date", "agency", "doctor", "physician",
    "consultant", "compliance", "from", "away", "breakfas", "ete", "la",
    "gee",
}

def _pillsync_canonical_medicine(name):
    """Return a medicine ONLY if it is in the real medicine catalog."""
    value = re.sub(r"\s+", " ", str(name or "")).strip(" .:-")
    if not value:
        return ""

    # Remove prescription item numbers, but preserve real strengths.
    value = re.sub(r"\s+[1-9]\s*$", "", value)
    value = re.sub(r"\b(\d{2,5})(?:\.0+)+\b", r"\1", value)

    # Strip dosage-form prefix.
    value = re.sub(
        r"^(?:Tab\.?|Cap\.?|Syp\.?|Syr\.?|Inj\.?)\s*",
        "",
        value,
        flags=re.I,
    ).strip()

    low = re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()
    compact = re.sub(r"[^a-z0-9]", "", low)

    # Never accept generic instruction/prose as a medicine.
    words = set(low.split())
    if words & _PILLSYNC_FALSE_MEDICINE_WORDS:
        # It is still valid if a real medicine is explicitly present.
        pass

    # Long generic prose is never a medicine.
    if len(low.split()) > 5:
        return ""

    # Exact catalog match.
    for key, display in sorted(
        _PILLSYNC_REAL_MEDICINES.items(),
        key=lambda x: len(re.sub(r"[^a-z0-9]", "", x[0])),
        reverse=True,
    ):
        key_low = re.sub(r"[^a-z0-9]+", " ", key.lower()).strip()
        key_compact = re.sub(r"[^a-z0-9]", "", key_low)
        if low == key_low or compact == key_compact:
            return display

    # Recognize a real medicine embedded in OCR noise, but only when
    # the medicine token itself is clearly present.
    for key, display in sorted(
        _PILLSYNC_REAL_MEDICINES.items(),
        key=lambda x: len(re.sub(r"[^a-z0-9]", "", x[0])),
        reverse=True,
    ):
        key_compact = re.sub(r"[^a-z0-9]", "", key.lower())
        if len(key_compact) >= 5 and key_compact in compact:
            # Do not let an instruction line such as "twice daily..."
            # pass unless it contains an actual medicine token.
            return display

    return ""


def _pillsync_sanitize_medicine_list(items):
    """Remove every fake medicine and merge duplicate real medicines."""
    result = []
    by_key = {}

    for med in items or []:
        if not isinstance(med, dict):
            continue

        raw_name = med.get("medicine_name") or med.get("name") or ""
        canonical = _pillsync_canonical_medicine(raw_name)
        if not canonical:
            continue

        # Keep the original form only when it is a valid form.
        form = ""
        raw_name_str = str(raw_name).strip()
        form_match = re.match(
            r"^(Tab\.?|Cap\.?|Syp\.?|Syr\.?|Inj\.?)\s+",
            raw_name_str,
            re.I,
        )
        if form_match:
            form = form_match.group(1)
            if not form.endswith("."):
                form += "."

        display_name = f"{form} {canonical}".strip()

        cleaned = dict(med)
        cleaned["medicine_name"] = display_name

        key = re.sub(r"[^a-z0-9]", "", canonical.lower())
        if key not in by_key:
            by_key[key] = cleaned
            result.append(cleaned)
        else:
            existing = by_key[key]
            for field in (
                "dosage", "quantity", "frequency", "duration",
                "instructions", "instruction",
            ):
                if not existing.get(field) and cleaned.get(field):
                    existing[field] = cleaned[field]

    return result


# Wrap the existing parser so even legacy structured/direct parser output
# cannot leak hallucinated medicine names into the API.
_pillsync_original_direct_parser = _direct_parse_prescription_lines

def _direct_parse_prescription_lines(text):
    medicines, advice = _pillsync_original_direct_parser(text)
    return _pillsync_sanitize_medicine_list(medicines), advice


def _format_prescription_details(details, handwritten_text=""):
    details = details if isinstance(details, dict) else {}
    medicines = details.get("medicines", [])
    if not isinstance(medicines, list):
        medicines = []

    advice = str(details.get("advice") or "").strip()
    # Remove instruction-only values accidentally promoted to global advice.
    if re.fullmatch(
        r"(?:before|after)\s+(?:food|breakfast|meal)|daily|once\s+daily|twice\s+daily|at\s+night|sos|po",
        advice,
        re.I,
    ):
        advice = ""

    direct_medicines, direct_advice = _direct_parse_prescription_lines(handwritten_text)

    # Merge BOTH structured extraction and direct OCR parsing.
    # Never throw away medicines found by the other parser.
    combined = []
    seen_keys = set()

    def medicine_key(med):
        name = str(med.get("medicine_name") or med.get("name") or "")
        name = re.sub(r"[^a-z]", "", name.lower())
        return name

    for med in medicines + direct_medicines:
        if not isinstance(med, dict):
            continue
        name = str(med.get("medicine_name") or med.get("name") or "").strip()
        if not name:
            continue
        key = medicine_key(med)
        if not key:
            continue
        if key not in seen_keys:
            combined.append(dict(med))
            seen_keys.add(key)
        else:
            # Fill missing fields from the second parser.
            existing = next(x for x in combined if medicine_key(x) == key)
            for field in ("dosage", "quantity", "frequency", "duration", "instructions", "instruction"):
                if not existing.get(field) and med.get(field):
                    existing[field] = med[field]

    medicines = _pillsync_sanitize_medicine_list(combined)

    # Direct advice is accepted only when it is genuine global advice.
    # Medicine instructions such as "Before food" / "After food" /
    # "Daily" must NEVER become global Advice.
    if direct_advice:
        candidates = []
        for item in str(direct_advice).splitlines():
            item = item.strip()
            if not item:
                continue
            if re.fullmatch(
                r"(?:before|after)\s+(?:food|breakfast|meal)|daily|once\s+daily|twice\s+daily|at\s+night|sos|po",
                item,
                re.I,
            ):
                continue
            candidates.append(item)
        if candidates:
            advice = "\n".join(candidates)

    lines = ["Prescription Details", ""]
    for i, med in enumerate(medicines, 1):
        if not isinstance(med, dict):
            continue
        name = str(med.get("medicine_name") or med.get("name") or "").strip()
        if not name:
            continue
        lines.append(f"{i}. Medicine: {name}")
        if med.get("dosage"):
            lines.append(f"   Dosage: {med['dosage']}")
        if med.get("quantity"):
            lines.append(f"   Quantity: {med['quantity']}")
        if med.get("frequency"):
            lines.append(f"   Frequency: {med['frequency']}")
        instruction = med.get("instructions") or med.get("instruction") or ""
        if instruction:
            lines.append(f"   Instruction: {instruction}")
        if med.get("duration"):
            lines.append(f"   Duration: {med['duration']}")
        lines.append("")

    if not advice and re.search(r"plenty\s+(?:of\s+)?(?:fluids?|water)", handwritten_text, re.I):
        advice = "Plenty of fluids"

    if advice:
        advice = re.sub(r"^\s*adv(?:ice)?\s*[:.\-]*\s*", "", advice, flags=re.I).strip()
        lines.append(f"Advice: {advice}")

    if not medicines and not advice:
        lines.append(handwritten_text.strip() if handwritten_text.strip() else "No reliable prescription detected.")

    return "\n".join(lines).strip()


class PrescriptionAIOCRView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image = request.FILES.get("image")
        validation_error = validate_image_upload(image, max_size_mb=10)
        if validation_error:
            return validation_error

        try:
            print("Starting handwritten prescription OCR...")
            image_bytes = read_image_bytes(image)

            ocr_result = ai_ocr_from_uploaded_file(io.BytesIO(image_bytes))
            if not isinstance(ocr_result, dict):
                ocr_result = {}

            handwritten_text = str(ocr_result.get("handwritten_text") or "").strip()

            if not handwritten_text:
                handwritten_text = str(
                    extract_prescription_text(io.BytesIO(image_bytes)) or ""
                ).strip()

            print("\nOCR TEXT RECEIVED BY VIEWS:")
            print(handwritten_text)

            details = {
                "raw_text": handwritten_text,
                "medicines": [],
                "overall_dosage": ocr_result.get("dosage", "") or "",
                "overall_frequency": ocr_result.get("frequency", "") or "",
                "overall_duration": "",
                "overall_quantity": ocr_result.get("quantity", "") or "",
                "instructions": "",
                "advice": "",
            }

            try:
                from .prescription_extraction_service import extract_prescription_details
                extracted = extract_prescription_details(handwritten_text)
                if isinstance(extracted, dict):
                    details.update(extracted)
            except Exception as e:
                print("STRUCTURED EXTRACTION ERROR:", repr(e))
                traceback.print_exc()

            # CRITICAL: parse the actual OCR lines directly.
            direct_medicines, direct_advice = _direct_parse_prescription_lines(handwritten_text)

            if direct_medicines:
                details["medicines"] = direct_medicines
            if direct_advice:
                details["advice"] = direct_advice

            # FINAL SAFETY FILTER:
            # Never allow hallucinated instruction/prose to appear as a medicine.
            details["medicines"] = _pillsync_sanitize_medicine_list(
                details.get("medicines", [])
            )
            medicines = details["medicines"]

            medicine_name = str(ocr_result.get("medicine_name") or "").strip()
            dosage = str(ocr_result.get("dosage") or "").strip()
            quantity = str(ocr_result.get("quantity") or "").strip()
            frequency = str(ocr_result.get("frequency") or "").strip()

            if medicines:
                first = medicines[0]
                medicine_name = first.get("medicine_name", "") or medicine_name
                dosage = first.get("dosage", "") or dosage
                quantity = first.get("quantity", "") or quantity
                frequency = first.get("frequency", "") or frequency

            formatted_text = _format_prescription_details(
                details, handwritten_text
            )

            print("\n" + "=" * 60)
            print("FINAL API TEXT")
            print("=" * 60)
            print(formatted_text)
            print("=" * 60)

            return Response({
                "success": bool(handwritten_text or medicines),
                "message": "Prescription OCR completed successfully.",
                "text": formatted_text,
                "raw_text": handwritten_text,
                "handwritten_text": handwritten_text,
                "printed_text": "",
                "medicine_name": medicine_name,
                "dosage": dosage,
                "quantity": quantity,
                "frequency": frequency,
                "medication_category": ocr_result.get("medication_category", "other") or "other",
                "medicines": medicines,
                "prescription": {
                    "medicines": medicines,
                    "advice": details.get("advice", "") or "",
                    "overall_dosage": details.get("overall_dosage", dosage) or dosage,
                    "overall_frequency": details.get("overall_frequency", frequency) or frequency,
                    "overall_duration": details.get("overall_duration", "") or "",
                    "overall_quantity": details.get("overall_quantity", quantity) or quantity,
                    "instructions": details.get("instructions", "") or "",
                },
            }, status=status.HTTP_200_OK)

        except Exception as error:
            print("HANDWRITTEN/PRESCRIPTION OCR ERROR:", repr(error))
            traceback.print_exc()
            return Response({
                "success": False,
                "error": "Prescription OCR failed.",
                "message": "Prescription OCR failed.",
                "details": str(error),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================
# HEALTH CONDITION MASTER LIST
# ============================================================

class ConditionOptionsView(APIView):

    permission_classes = [IsAuthenticated]

    DEFAULT_CONDITIONS = [
        # GENERAL
        "Fever", "Cold", "Cough", "Headache", "Migraine", "Body Pain",
        "Back Pain", "Neck Pain", "Joint Pain", "Muscle Pain", "Fatigue",
        "Weakness", "Allergy", "Pain", "Inflammation",

        # HEART / BP
        "Hypertension", "High Blood Pressure", "Low Blood Pressure",
        "High Cholesterol", "Heart Disease", "Coronary Artery Disease",
        "Heart Failure", "Heart Attack", "Angina", "Arrhythmia",
        "Atrial Fibrillation", "Cardiomyopathy", "Peripheral Artery Disease",
        "Deep Vein Thrombosis",

        # DIABETES / HORMONAL
        "Diabetes", "Type 1 Diabetes", "Type 2 Diabetes", "Prediabetes",
        "Gestational Diabetes", "Thyroid Disorder", "Hypothyroidism",
        "Hyperthyroidism", "Goiter", "PCOS", "Polycystic Ovary Syndrome",
        "Cushing Syndrome", "Adrenal Disorder",

        # RESPIRATORY
        "Asthma", "COPD", "Bronchitis", "Pneumonia", "Respiratory Infection",
        "Upper Respiratory Infection", "Lower Respiratory Infection",
        "Sinusitis", "Allergic Rhinitis", "Rhinitis", "Tuberculosis",
        "Sleep Apnea", "Pulmonary Fibrosis",

        # DIGESTIVE
        "Acidity", "Gastritis", "GERD", "Heartburn", "Peptic Ulcer",
        "Stomach Ulcer", "Constipation", "Diarrhea", "Irritable Bowel Syndrome",
        "Inflammatory Bowel Disease", "Crohn's Disease", "Ulcerative Colitis",
        "Hemorrhoids", "Nausea", "Vomiting", "Indigestion", "Gallstones",
        "Pancreatitis",

        # LIVER
        "Liver Disease", "Fatty Liver", "Hepatitis", "Hepatitis A",
        "Hepatitis B", "Hepatitis C", "Cirrhosis", "Liver Infection",

        # KIDNEY / URINARY
        "Kidney Disease", "Chronic Kidney Disease", "Kidney Stones",
        "Urinary Tract Infection", "UTI", "Bladder Infection",
        "Kidney Infection", "Urinary Incontinence", "Prostate Disorder",
        "Benign Prostatic Hyperplasia",

        # BONE / MUSCLE
        "Arthritis", "Osteoarthritis", "Rheumatoid Arthritis", "Osteoporosis",
        "Osteopenia", "Gout", "Fibromyalgia", "Muscle Spasm",
        "Muscle Weakness", "Tendonitis", "Bursitis", "Bone Disorder",

        # NEUROLOGICAL
        "Epilepsy", "Seizure Disorder", "Parkinson's Disease",
        "Alzheimer's Disease", "Dementia", "Multiple Sclerosis", "Neuropathy",
        "Diabetic Neuropathy", "Neuralgia", "Vertigo", "Stroke",
        "Transient Ischemic Attack", "Peripheral Neuropathy",

        # MENTAL HEALTH
        "Anxiety", "Depression", "Stress", "Insomnia", "Panic Disorder",
        "Bipolar Disorder", "Post-Traumatic Stress Disorder",
        "Obsessive Compulsive Disorder",
        "Attention Deficit Hyperactivity Disorder",

        # SKIN
        "Acne", "Eczema", "Dermatitis", "Psoriasis", "Skin Allergy",
        "Fungal Skin Infection", "Bacterial Skin Infection", "Scabies",
        "Urticaria", "Vitiligo",

        # INFECTION
        "Bacterial Infection", "Viral Infection", "Fungal Infection",
        "Parasitic Infection", "COVID-19", "Influenza", "Dengue", "Malaria",
        "Typhoid", "Chikungunya", "Measles", "Chickenpox",

        # EYE
        "Eye Infection", "Conjunctivitis", "Dry Eye", "Glaucoma",
        "Cataract", "Eye Allergy", "Macular Degeneration",

        # EAR / THROAT
        "Ear Infection", "Otitis Media", "Tonsillitis", "Pharyngitis",
        "Sore Throat", "Laryngitis", "Sinus Infection", "Hearing Disorder",

        # WOMEN'S HEALTH
        "Menstrual Disorder", "Irregular Periods", "Endometriosis",
        "Menopause", "Premenstrual Syndrome", "Pregnancy Related Condition",
        "Ovarian Cyst",

        # MEN'S HEALTH
        "Erectile Dysfunction", "Male Hormonal Disorder",

        # DEFICIENCY / NUTRITION
        "Anemia", "Iron Deficiency", "Iron Deficiency Anemia",
        "Vitamin D Deficiency", "Vitamin B12 Deficiency",
        "Vitamin Deficiency", "Folate Deficiency", "Malnutrition",

        # AUTOIMMUNE
        "Autoimmune Disorder", "Lupus", "Celiac Disease",
        "Immune System Disorder",

        # CANCER
        "Cancer", "Breast Cancer", "Lung Cancer", "Prostate Cancer",
        "Colon Cancer", "Skin Cancer", "Blood Cancer",

        # OTHER
        "Chronic Pain", "Chronic Fatigue", "Sleep Disorder", "Obesity",
        "Weight Management", "Post Surgery Care", "Wound Care", "Other",
    ]

    def ensure_conditions_exist(self, user):
        for condition_name in self.DEFAULT_CONDITIONS:
            clean_name = condition_name.strip()
            existing = (
                Condition.objects
                .filter(user=user, condition_name__iexact=clean_name)
                .first()
            )
            if not existing:
                Condition.objects.create(
                    user=user,
                    condition_name=clean_name,
                    description="",
                    diagnosed_date=None,
                    is_active=False,
                )

    def get(self, request):
        self.ensure_conditions_exist(request.user)

        conditions = (
            Condition.objects
            .filter(user=request.user)
            .order_by("condition_name")
        )

        unique_conditions = []
        seen_names = set()

        for condition in conditions:
            normalized_name = condition.condition_name.strip().lower()
            if normalized_name in seen_names:
                continue
            seen_names.add(normalized_name)
            unique_conditions.append(condition)

        serializer = ConditionSerializer(unique_conditions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ============================================================
# CONDITION LIST + CREATE
# ============================================================

class ConditionListCreateView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        ConditionOptionsView().ensure_conditions_exist(request.user)

        conditions = (
            Condition.objects
            .filter(user=request.user)
            .order_by("condition_name")
        )

        unique_conditions = []
        seen_names = set()
        for condition in conditions:
            normalized_name = condition.condition_name.strip().lower()
            if normalized_name in seen_names:
                continue
            seen_names.add(normalized_name)
            unique_conditions.append(condition)

        serializer = ConditionSerializer(unique_conditions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ConditionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        condition_name = (
            serializer.validated_data.get("condition_name", "").strip()
        )
        if not condition_name:
            return Response(
                {"error": "Condition name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_condition = (
            Condition.objects
            .filter(user=request.user, condition_name__iexact=condition_name)
            .first()
        )

        if existing_condition:
            existing_condition.is_active = True
            if "description" in serializer.validated_data:
                existing_condition.description = (
                    serializer.validated_data["description"]
                )
            if "diagnosed_date" in serializer.validated_data:
                existing_condition.diagnosed_date = (
                    serializer.validated_data["diagnosed_date"]
                )
            existing_condition.save()
            return Response(
                ConditionSerializer(existing_condition).data,
                status=status.HTTP_200_OK,
            )

        condition = serializer.save(
            user=request.user,
            condition_name=condition_name,
            is_active=True,
        )
        return Response(
            ConditionSerializer(condition).data,
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# CONDITION DETAIL
# ============================================================

class ConditionDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def get_object(self, request, condition_id):
        return (
            Condition.objects
            .filter(id=condition_id, user=request.user)
            .first()
        )

    def get(self, request, condition_id):
        condition = self.get_object(request, condition_id)
        if not condition:
            return Response(
                {"error": "Condition not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            ConditionSerializer(condition).data,
            status=status.HTTP_200_OK,
        )

    def put(self, request, condition_id):
        condition = self.get_object(request, condition_id)
        if not condition:
            return Response(
                {"error": "Condition not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = ConditionSerializer(condition, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, condition_id):
        condition = self.get_object(request, condition_id)
        if not condition:
            return Response(
                {"error": "Condition not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = ConditionSerializer(
            condition, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, condition_id):
        condition = self.get_object(request, condition_id)
        if not condition:
            return Response(
                {"error": "Condition not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        condition.delete()
        return Response(
            {"success": True, "message": "Condition deleted successfully."},
            status=status.HTTP_200_OK,
        )


# ============================================================
# PRESCRIPTION LIST + CREATE
# ============================================================

class PrescriptionListCreateView(generics.ListCreateAPIView):

    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return (
            Prescription.objects
            .filter(user=self.request.user)
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ============================================================
# PRESCRIPTION DETAIL
# ============================================================

class PrescriptionDetailView(generics.RetrieveDestroyAPIView):

    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Prescription.objects.filter(user=self.request.user)


# ============================================================
# PRESCRIPTION EXPIRY NOTIFICATION
# ============================================================

class PrescriptionExpiryNotificationView(APIView):

    permission_classes = [IsAuthenticated]

    EXPIRY_WARNING_DAYS = 7

    def get(self, request):
        today = date.today()

        prescriptions = (
            Prescription.objects
            .filter(user=request.user)
            .order_by("expiry_date")
        )

        results = []
        notifications_created = []

        for prescription in prescriptions:
            if not prescription.expiry_date:
                continue

            expiry_date = prescription.expiry_date
            days_remaining = (expiry_date - today).days

            if days_remaining < 0:
                status_value = "Expired"
                title = "Prescription Expired"
                message = (
                    f"Your prescription #{prescription.id} expired on "
                    f"{expiry_date}. Please consult your healthcare "
                    f"provider if a new prescription is required."
                )
            elif days_remaining == 0:
                status_value = "Expires Today"
                title = "Prescription Expires Today"
                message = (
                    f"Your prescription #{prescription.id} expires today "
                    f"({expiry_date}). Please check whether a new "
                    f"prescription is required."
                )
            elif days_remaining <= self.EXPIRY_WARNING_DAYS:
                status_value = "Expiring Soon"
                title = "Prescription Expiring Soon"
                message = (
                    f"Your prescription #{prescription.id} expires in "
                    f"{days_remaining} day(s) on {expiry_date}. Please "
                    f"check whether a new prescription is required."
                )
            else:
                results.append(
                    {
                        "id": prescription.id,
                        "expiry_date": expiry_date.isoformat(),
                        "days_remaining": days_remaining,
                        "status": "Valid",
                    }
                )
                continue

            results.append(
                {
                    "id": prescription.id,
                    "expiry_date": expiry_date.isoformat(),
                    "days_remaining": days_remaining,
                    "status": status_value,
                }
            )

            existing_notification = (
                Notification.objects
                .filter(
                    user=request.user,
                    notification_type="prescription",
                    is_read=False,
                    message__icontains=f"prescription #{prescription.id}",
                )
                .first()
            )

            if not existing_notification:
                notification = Notification.objects.create(
                    user=request.user,
                    notification_type="prescription",
                    title=title,
                    message=message,
                )
                notifications_created.append(
                    {
                        "id": notification.id,
                        "prescription_id": prescription.id,
                        "title": notification.title,
                        "message": notification.message,
                    }
                )

        return Response(
            {
                "success": True,
                "today": today.isoformat(),
                "warning_period_days": self.EXPIRY_WARNING_DAYS,
                "prescriptions": results,
                "notifications_created": notifications_created,
                "notification_count": len(notifications_created),
            },
            status=status.HTTP_200_OK,
        )