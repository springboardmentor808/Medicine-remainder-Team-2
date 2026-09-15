from pathlib import Path
import json

import torch
from PIL import Image, UnidentifiedImageError

from torchvision import transforms
from torchvision.models import resnet18


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_FILE = (
    BASE_DIR / "medicine_image_model.pth"
)

LABEL_FILE = (
    BASE_DIR / "medicine_image_labels.json"
)


# ============================================================
# SETTINGS
# ============================================================

IMAGE_SIZE = 224

TOP_K = 5

DEVICE = torch.device(
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)


# ============================================================
# IMAGE TRANSFORM
# ============================================================

image_transform = transforms.Compose(
    [
        transforms.Resize(
            (IMAGE_SIZE, IMAGE_SIZE)
        ),

        transforms.ToTensor(),

        transforms.Normalize(
            mean=[
                0.485,
                0.456,
                0.406
            ],

            std=[
                0.229,
                0.224,
                0.225
            ]
        )
    ]
)


# ============================================================
# MODEL VARIABLES
# ============================================================

_model = None

_class_names = None


# ============================================================
# LOAD LABELS
# ============================================================

def load_labels():

    global _class_names

    if _class_names is not None:

        return _class_names


    if not LABEL_FILE.exists():

        raise FileNotFoundError(
            f"Medicine label file not found:\n"
            f"{LABEL_FILE}"
        )


    with open(
        LABEL_FILE,
        "r",
        encoding="utf-8"
    ) as file:

        label_data = json.load(file)


    index_to_label = (
        label_data.get(
            "index_to_label",
            {}
        )
    )


    if not index_to_label:

        raise ValueError(
            "index_to_label is empty in "
            "medicine_image_labels.json"
        )


    _class_names = [
        index_to_label[str(index)]
        for index in range(
            len(index_to_label)
        )
    ]


    return _class_names


# ============================================================
# LOAD MODEL
# ============================================================

def load_model():

    global _model


    if _model is not None:

        return _model


    if not MODEL_FILE.exists():

        raise FileNotFoundError(
            f"Medicine image model not found:\n"
            f"{MODEL_FILE}"
        )


    # Load checkpoint
    checkpoint = torch.load(
        MODEL_FILE,
        map_location=DEVICE
    )


    num_classes = checkpoint.get(
        "num_classes"
    )


    class_names = checkpoint.get(
        "class_names"
    )


    if num_classes is None:

        raise ValueError(
            "num_classes is missing from "
            "medicine_image_model.pth"
        )


    if not class_names:

        class_names = load_labels()


    # Create ResNet18 without downloading
    # pretrained weights during prediction.

    model = resnet18(
        weights=None
    )


    # Replace classifier with the same
    # number of classes used during training.

    model.fc = torch.nn.Linear(
        model.fc.in_features,
        num_classes
    )


    # Load trained weights.

    model.load_state_dict(
        checkpoint[
            "model_state_dict"
        ]
    )


    model = model.to(
        DEVICE
    )


    model.eval()


    _model = model

    _class_names = class_names


    print(
        "Medicine image AI model loaded successfully."
    )

    print(
        f"Medicine classes: {num_classes}"
    )

    print(
        f"Device: {DEVICE}"
    )


    return _model


# ============================================================
# PREDICT MEDICINE
# ============================================================

def predict_medicine(
    image_file,
    top_k=TOP_K
):

    try:

        # Make sure model is loaded.

        model = load_model()

        class_names = load_labels()


        # ----------------------------------------------------
        # Open uploaded image
        # ----------------------------------------------------

        image = Image.open(
            image_file
        ).convert(
            "RGB"
        )


        # ----------------------------------------------------
        # Preprocess
        # ----------------------------------------------------

        image_tensor = image_transform(
            image
        )


        image_tensor = (
            image_tensor
            .unsqueeze(0)
            .to(DEVICE)
        )


        # ----------------------------------------------------
        # Prediction
        # ----------------------------------------------------

        with torch.no_grad():

            outputs = model(
                image_tensor
            )


            probabilities = torch.softmax(
                outputs,
                dim=1
            )


            top_probabilities, top_indices = (
                torch.topk(
                    probabilities,
                    k=min(
                        top_k,
                        len(class_names)
                    ),
                    dim=1
                )
            )


        # ----------------------------------------------------
        # Build results
        # ----------------------------------------------------

        predictions = []


        for probability, index in zip(
            top_probabilities[0],
            top_indices[0]
        ):

            class_index = int(
                index.item()
            )


            confidence = float(
                probability.item()
                *
                100
            )


            medicine_name = (
                class_names[
                    class_index
                ]
            )


            predictions.append(
                {
                    "medicine_name":
                        medicine_name,

                    "confidence":
                        round(
                            confidence,
                            2
                        )
                }
            )


        if not predictions:

            return {
                "success": False,
                "message":
                    "No medicine prediction available.",
                "predictions": []
            }


        # ----------------------------------------------------
        # Best prediction
        # ----------------------------------------------------

        best_prediction = (
            predictions[0]
        )


        return {
            "success": True,

            "medicine_name":
                best_prediction[
                    "medicine_name"
                ],

            "confidence":
                best_prediction[
                    "confidence"
                ],

            "predictions":
                predictions
        }


    except (
        UnidentifiedImageError,
        OSError
    ):

        return {
            "success": False,

            "message":
                "The uploaded file is not "
                "a valid image.",

            "predictions": []
        }


    except Exception as error:

        return {
            "success": False,

            "message":
                str(error),

            "predictions": []
        }


# ============================================================
# TEST MODEL
# ============================================================

if __name__ == "__main__":

    print("=" * 70)

    print(
        "PillSync Medicine Prediction Service"
    )

    print("=" * 70)


    try:

        model = load_model()

        labels = load_labels()


        print(
            "\n✅ Model loaded successfully."
        )

        print(
            f"Number of medicine classes: "
            f"{len(labels)}"
        )

        print(
            f"Model file:\n{MODEL_FILE}"
        )

        print(
            f"\nLabel file:\n{LABEL_FILE}"
        )


    except Exception as error:

        print(
            "\n❌ Model loading failed:"
        )

        print(error)