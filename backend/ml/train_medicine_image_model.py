from pathlib import Path
import json

import pandas as pd
from PIL import Image, UnidentifiedImageError

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

from torchvision import transforms
from torchvision.models import resnet18, ResNet18_Weights


# ============================================================
# PATHS
# ============================================================

IMAGE_ROOT = Path(
    r"D:\image\images\gallery"
)

TABLE_FILE = Path(
    r"D:\table.csv"
)

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

BATCH_SIZE = 32

EPOCHS = 5

LEARNING_RATE = 0.0001

VALIDATION_SIZE = 0.20

RANDOM_STATE = 42

NUM_WORKERS = 0


# ============================================================
# DEVICE
# ============================================================

DEVICE = torch.device(
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)


print("=" * 70)
print("PillSync Medicine Image Recognition")
print("=" * 70)

print(f"Device: {DEVICE}")
print(f"Image folder: {IMAGE_ROOT}")
print(f"CSV file: {TABLE_FILE}")

print("=" * 70)


# ============================================================
# CHECK FILES
# ============================================================

if not IMAGE_ROOT.exists():

    raise FileNotFoundError(
        f"\nImage folder not found:\n{IMAGE_ROOT}"
    )


if not TABLE_FILE.exists():

    raise FileNotFoundError(
        f"\nCSV file not found:\n{TABLE_FILE}"
    )


# ============================================================
# LOAD CSV
# ============================================================

print("\nLoading medicine metadata...")

df = pd.read_csv(
    TABLE_FILE
)

print(
    f"CSV records: {len(df):,}"
)


# ============================================================
# REQUIRED COLUMNS
# ============================================================

required_columns = [
    "name",
    "nlmImageFileName"
]

for column in required_columns:

    if column not in df.columns:

        raise ValueError(
            f"\nRequired column missing: {column}\n"
            f"Available columns:\n{list(df.columns)}"
        )


# ============================================================
# CLEAN CSV
# ============================================================

df = df[
    df["name"].notna()
    &
    df["nlmImageFileName"].notna()
].copy()


df["name"] = (
    df["name"]
    .astype(str)
    .str.strip()
)


df["nlmImageFileName"] = (
    df["nlmImageFileName"]
    .astype(str)
    .str.strip()
)


df = df[
    (df["name"] != "")
    &
    (df["nlmImageFileName"] != "")
].copy()


print(
    f"Usable CSV records: {len(df):,}"
)


# ============================================================
# IMAGE LOOKUP
# ============================================================

print(
    "\nIndexing actual image files..."
)

image_lookup = {}


for path in IMAGE_ROOT.rglob("*"):

    if not path.is_file():
        continue

    if path.suffix.lower() not in [
        ".jpg",
        ".jpeg",
        ".png"
    ]:
        continue

    filename = path.name.lower()

    # Keep first occurrence of a filename.
    # This prevents duplicate filename mapping.

    if filename not in image_lookup:

        image_lookup[filename] = path


print(
    f"Unique image filenames indexed: "
    f"{len(image_lookup):,}"
)


# ============================================================
# MATCH CSV TO IMAGES
# ============================================================

records = []

missing = 0


for _, row in df.iterrows():

    filename = (
        Path(
            row["nlmImageFileName"]
        ).name.lower()
    )

    image_path = image_lookup.get(
        filename
    )

    if image_path is None:

        missing += 1

        continue


    records.append(
        {
            "image_path": str(
                image_path.resolve()
            ),

            "medicine_name": row["name"]
        }
    )


print(
    f"\nMatched records: {len(records):,}"
)

print(
    f"Missing records: {missing:,}"
)


if len(records) == 0:

    raise RuntimeError(
        "\nNo images matched the CSV."
    )


# ============================================================
# DATAFRAME
# ============================================================

image_df = pd.DataFrame(
    records
)


# ============================================================
# REMOVE DUPLICATE IMAGE PATHS
# ============================================================

before_dedup = len(image_df)


image_df = image_df.drop_duplicates(
    subset=["image_path"],
    keep="first"
).reset_index(drop=True)


duplicates_removed = (
    before_dedup - len(image_df)
)


print(
    f"\nDuplicate physical images removed: "
    f"{duplicates_removed:,}"
)

print(
    f"Unique image records: "
    f"{len(image_df):,}"
)


# ============================================================
# CHECK FOR SAME IMAGE WITH DIFFERENT MEDICINE NAMES
# ============================================================

image_name_counts = (
    image_df.groupby(
        "image_path"
    )["medicine_name"]
    .nunique()
)


conflicting_images = (
    image_name_counts[
        image_name_counts > 1
    ]
)


if len(conflicting_images) > 0:

    print(
        "\nWARNING:"
    )

    print(
        f"{len(conflicting_images)} "
        "images have multiple medicine labels."
    )

    # Remove conflicting images because their
    # labels cannot be trusted for supervised training.

    bad_paths = set(
        conflicting_images.index
    )

    image_df = image_df[
        ~image_df["image_path"].isin(
            bad_paths
        )
    ].copy()

    image_df.reset_index(
        drop=True,
        inplace=True
    )

    print(
        f"Removed conflicting images: "
        f"{len(bad_paths):,}"
    )


# ============================================================
# REMOVE MEDICINE CLASSES WITH ONLY ONE IMAGE
# ============================================================

class_counts = (
    image_df[
        "medicine_name"
    ].value_counts()
)


valid_classes = class_counts[
    class_counts >= 2
].index


image_df = image_df[
    image_df[
        "medicine_name"
    ].isin(valid_classes)
].copy()


image_df.reset_index(
    drop=True,
    inplace=True
)


print(
    f"\nClasses with >=2 images: "
    f"{image_df['medicine_name'].nunique():,}"
)

print(
    f"Final training candidates: "
    f"{len(image_df):,}"
)


if len(image_df) == 0:

    raise RuntimeError(
        "\nNo medicine classes have at least "
        "2 images."
    )


# ============================================================
# LABEL ENCODING
# ============================================================

medicine_names = sorted(
    image_df[
        "medicine_name"
    ].unique()
)


label_to_index = {
    name: index
    for index, name in enumerate(
        medicine_names
    )
}


index_to_label = {
    str(index): name
    for name, index in
    label_to_index.items()
}


image_df["label"] = (
    image_df[
        "medicine_name"
    ].map(
        label_to_index
    )
)


NUM_CLASSES = len(
    medicine_names
)


print(
    f"Number of medicine classes: "
    f"{NUM_CLASSES:,}"
)


# ============================================================
# SAVE LABELS
# ============================================================

with open(
    LABEL_FILE,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        {
            "index_to_label":
                index_to_label,

            "label_to_index":
                label_to_index
        },
        file,
        indent=4,
        ensure_ascii=False
    )


print(
    f"\nLabels saved to:\n{LABEL_FILE}"
)


# ============================================================
# MANUAL TRAIN / VALIDATION SPLIT
# ============================================================

print(
    "\nPreparing train/validation split..."
)


train_parts = []

validation_parts = []


for medicine_name, group in image_df.groupby(
    "medicine_name"
):

    group = group.sample(
        frac=1,
        random_state=RANDOM_STATE
    ).reset_index(drop=True)


    number_of_images = len(group)


    # --------------------------------------------------------
    # Exactly 2 images
    # --------------------------------------------------------

    if number_of_images == 2:

        train_part = group.iloc[
            :1
        ].copy()

        validation_part = group.iloc[
            1:2
        ].copy()


    # --------------------------------------------------------
    # 3 or more images
    # --------------------------------------------------------

    else:

        validation_count = max(
            1,
            int(
                round(
                    number_of_images
                    *
                    VALIDATION_SIZE
                )
            )
        )


        validation_count = min(
            validation_count,
            number_of_images - 1
        )


        validation_part = group.iloc[
            :validation_count
        ].copy()

        train_part = group.iloc[
            validation_count:
        ].copy()


    train_parts.append(
        train_part
    )

    validation_parts.append(
        validation_part
    )


# ============================================================
# COMBINE
# ============================================================

train_df = pd.concat(
    train_parts,
    ignore_index=True
)


validation_df = pd.concat(
    validation_parts,
    ignore_index=True
)


# ============================================================
# SHUFFLE
# ============================================================

train_df = train_df.sample(
    frac=1,
    random_state=RANDOM_STATE
).reset_index(drop=True)


validation_df = validation_df.sample(
    frac=1,
    random_state=RANDOM_STATE
).reset_index(drop=True)


# ============================================================
# VERIFY CLASS COVERAGE
# ============================================================

expected_classes = (
    image_df["label"].nunique()
)


train_classes = (
    train_df["label"].nunique()
)


validation_classes = (
    validation_df["label"].nunique()
)


print(
    f"\nTotal images: "
    f"{len(image_df):,}"
)

print(
    f"Medicine classes: "
    f"{expected_classes:,}"
)

print(
    f"Training images: "
    f"{len(train_df):,}"
)

print(
    f"Validation images: "
    f"{len(validation_df):,}"
)

print(
    f"Training classes: "
    f"{train_classes:,}"
)

print(
    f"Validation classes: "
    f"{validation_classes:,}"
)


# ============================================================
# VERIFY EVERY CLASS EXISTS IN BOTH
# ============================================================

if train_classes != expected_classes:

    raise RuntimeError(
        "\nSome medicine classes are missing "
        "from the training set."
    )


if validation_classes != expected_classes:

    raise RuntimeError(
        "\nSome medicine classes are missing "
        "from the validation set."
    )


# ============================================================
# DATA LEAKAGE CHECK
# ============================================================

train_paths = set(
    train_df["image_path"]
)

validation_paths = set(
    validation_df["image_path"]
)


overlap = (
    train_paths &
    validation_paths
)


if len(overlap) > 0:

    print(
        "\nLeaking image paths:"
    )

    for path in list(overlap)[:10]:

        print(
            path
        )


    raise RuntimeError(
        "\nData leakage detected!\n"
        f"{len(overlap)} images appear in "
        "both training and validation."
    )


print(
    "\n✅ Train/validation split successful."
)

print(
    "✅ All medicine classes are present "
    "in both datasets."
)

print(
    "✅ No image leakage detected."
)


# ============================================================
# IMAGE TRANSFORMS
# ============================================================

train_transform = transforms.Compose(
    [

        transforms.Resize(
            (IMAGE_SIZE, IMAGE_SIZE)
        ),

        transforms.RandomHorizontalFlip(
            p=0.5
        ),

        transforms.RandomRotation(
            10
        ),

        transforms.ColorJitter(
            brightness=0.2,
            contrast=0.2
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


validation_transform = transforms.Compose(
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
# DATASET
# ============================================================

class MedicineImageDataset(Dataset):

    def __init__(
        self,
        dataframe,
        transform=None
    ):

        self.dataframe = (
            dataframe.reset_index(
                drop=True
            )
        )

        self.transform = transform


    def __len__(self):

        return len(
            self.dataframe
        )


    def __getitem__(
        self,
        index
    ):

        row = self.dataframe.iloc[
            index
        ]


        image_path = Path(
            row["image_path"]
        )


        label = int(
            row["label"]
        )


        try:

            image = Image.open(
                image_path
            ).convert(
                "RGB"
            )


        except (
            UnidentifiedImageError,
            OSError
        ):

            # Find another readable image

            for offset in range(
                1,
                len(self.dataframe)
            ):

                new_index = (
                    index + offset
                ) % len(self.dataframe)


                try:

                    new_row = (
                        self.dataframe.iloc[
                            new_index
                        ]
                    )


                    image = Image.open(
                        new_row[
                            "image_path"
                        ]
                    ).convert(
                        "RGB"
                    )


                    label = int(
                        new_row[
                            "label"
                        ]
                    )


                    break


                except (
                    UnidentifiedImageError,
                    OSError
                ):

                    continue


            else:

                raise RuntimeError(
                    "No readable image found "
                    "in dataset."
                )


        if self.transform:

            image = self.transform(
                image
            )


        return image, label


# ============================================================
# DATASETS
# ============================================================

train_dataset = MedicineImageDataset(
    train_df,
    train_transform
)


validation_dataset = MedicineImageDataset(
    validation_df,
    validation_transform
)


# ============================================================
# DATALOADERS
# ============================================================

train_loader = DataLoader(

    train_dataset,

    batch_size=BATCH_SIZE,

    shuffle=True,

    num_workers=NUM_WORKERS,

    pin_memory=torch.cuda.is_available()

)


validation_loader = DataLoader(

    validation_dataset,

    batch_size=BATCH_SIZE,

    shuffle=False,

    num_workers=NUM_WORKERS,

    pin_memory=torch.cuda.is_available()

)


print(
    f"\nBatch size: {BATCH_SIZE}"
)

print(
    f"Training batches: "
    f"{len(train_loader):,}"
)

print(
    f"Validation batches: "
    f"{len(validation_loader):,}"
)


# ============================================================
# MODEL
# ============================================================

print(
    "\nLoading ResNet18..."
)


weights = (
    ResNet18_Weights.DEFAULT
)


model = resnet18(
    weights=weights
)


model.fc = nn.Linear(
    model.fc.in_features,
    NUM_CLASSES
)


model = model.to(
    DEVICE
)


print(
    f"Model classes: {NUM_CLASSES:,}"
)


# ============================================================
# LOSS
# ============================================================

criterion = nn.CrossEntropyLoss()


# ============================================================
# OPTIMIZER
# ============================================================

optimizer = torch.optim.AdamW(

    model.parameters(),

    lr=LEARNING_RATE

)


# ============================================================
# TRAIN FUNCTION
# ============================================================

def train_one_epoch():

    model.train()

    running_loss = 0.0

    correct = 0

    total = 0


    for batch_number, (
        images,
        labels
    ) in enumerate(
        train_loader
    ):

        images = images.to(
            DEVICE
        )

        labels = labels.to(
            DEVICE
        )


        optimizer.zero_grad()


        outputs = model(
            images
        )


        loss = criterion(
            outputs,
            labels
        )


        loss.backward()

        optimizer.step()


        running_loss += (
            loss.item()
            *
            images.size(0)
        )


        predictions = (
            outputs.argmax(
                dim=1
            )
        )


        correct += (
            predictions == labels
        ).sum().item()


        total += (
            labels.size(0)
        )


        if (
            batch_number + 1
        ) % 50 == 0:

            print(
                f"  Batch "
                f"{batch_number + 1}/"
                f"{len(train_loader)}"
            )


    if total == 0:

        raise RuntimeError(
            "Training loader returned no images."
        )


    loss_value = (
        running_loss /
        total
    )


    accuracy = (
        correct /
        total
    ) * 100


    return (
        loss_value,
        accuracy
    )


# ============================================================
# VALIDATION FUNCTION
# ============================================================

def validate():

    model.eval()

    running_loss = 0.0

    correct = 0

    total = 0


    with torch.no_grad():

        for images, labels in validation_loader:

            images = images.to(
                DEVICE
            )

            labels = labels.to(
                DEVICE
            )


            outputs = model(
                images
            )


            loss = criterion(
                outputs,
                labels
            )


            running_loss += (
                loss.item()
                *
                images.size(0)
            )


            predictions = (
                outputs.argmax(
                    dim=1
                )
            )


            correct += (
                predictions == labels
            ).sum().item()


            total += (
                labels.size(0)
            )


    if total == 0:

        raise RuntimeError(
            "Validation loader returned no images."
        )


    loss_value = (
        running_loss /
        total
    )


    accuracy = (
        correct /
        total
    ) * 100


    return (
        loss_value,
        accuracy
    )


# ============================================================
# TRAINING
# ============================================================

best_accuracy = 0.0


print(
    "\nStarting training..."
)

print("=" * 70)


for epoch in range(
    EPOCHS
):

    print(
        f"\nEpoch "
        f"{epoch + 1}/{EPOCHS}"
    )

    print(
        "-" * 50
    )


    train_loss, train_accuracy = (
        train_one_epoch()
    )


    validation_loss, validation_accuracy = (
        validate()
    )


    print(
        f"\nTrain Loss: "
        f"{train_loss:.4f}"
    )

    print(
        f"Train Accuracy: "
        f"{train_accuracy:.2f}%"
    )

    print(
        f"Validation Loss: "
        f"{validation_loss:.4f}"
    )

    print(
        f"Validation Accuracy: "
        f"{validation_accuracy:.2f}%"
    )


    # --------------------------------------------------------
    # SAVE BEST MODEL
    # --------------------------------------------------------

    if (
        validation_accuracy
        >
        best_accuracy
    ):

        best_accuracy = (
            validation_accuracy
        )


        torch.save(
            {
                "model_state_dict":
                    model.state_dict(),

                "num_classes":
                    NUM_CLASSES,

                "class_names":
                    medicine_names,

                "image_size":
                    IMAGE_SIZE
            },
            MODEL_FILE
        )


        print(
            "\n✅ Best model saved!"
        )


# ============================================================
# FINISHED
# ============================================================

print(
    "\n" + "=" * 70
)

print(
    "MEDICINE IMAGE MODEL TRAINING COMPLETE"
)

print("=" * 70)

print(
    f"Best validation accuracy: "
    f"{best_accuracy:.2f}%"
)

print(
    "\nModel:"
)

print(
    MODEL_FILE
)

print(
    "\nLabels:"
)

print(
    LABEL_FILE
)

print("=" * 70)