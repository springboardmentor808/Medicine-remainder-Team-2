import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report


# ==========================================
# 1. Load Dataset
# ==========================================

DATASET_PATH = "ml/dataset/patient_adherence.csv"

df = pd.read_csv(DATASET_PATH)

print("Dataset loaded successfully!")
print("Dataset shape:", df.shape)
print("\nColumns:")
print(df.columns.tolist())


# ==========================================
# 2. Separate Features and Target
# ==========================================

X = df.drop("Adherence", axis=1)
y = df["Adherence"]


# ==========================================
# 3. Encode Categorical Columns
# ==========================================

categorical_columns = X.select_dtypes(
    include=["object"]
).columns

encoders = {}

for column in categorical_columns:
    encoder = LabelEncoder()
    X[column] = encoder.fit_transform(X[column].astype(str))
    encoders[column] = encoder


# ==========================================
# 4. Train/Test Split
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


# ==========================================
# 5. Create ML Model
# ==========================================

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42
)


# ==========================================
# 6. Train Model
# ==========================================

model.fit(X_train, y_train)

print("\nModel training completed!")


# ==========================================
# 7. Test Model
# ==========================================

y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

print("\nModel Accuracy:")
print(f"{accuracy * 100:.2f}%")

print("\nClassification Report:")
print(classification_report(y_test, y_pred))


# ==========================================
# 8. Save Model
# ==========================================

MODEL_PATH = "ml/pill_adherence_model.pkl"
ENCODER_PATH = "ml/label_encoders.pkl"

joblib.dump(model, MODEL_PATH)
joblib.dump(encoders, ENCODER_PATH)

print("\nModel saved successfully!")
print("Model:", MODEL_PATH)
print("Encoders:", ENCODER_PATH)