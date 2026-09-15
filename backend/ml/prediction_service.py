# ============================================================
# PILLSYNC - MEDICATION ADHERENCE PREDICTION SERVICE
# ============================================================

import os
import joblib
import numpy as np
import pandas as pd


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_DIR = os.path.join(BASE_DIR, "ml")

MODEL_PATHS = [
    os.path.join(MODEL_DIR, "pill_adherence_model.pkl"),
    os.path.join(MODEL_DIR, "models", "pill_adherence_model.pkl"),
    os.path.join(BASE_DIR, "pill_adherence_model.pkl"),
]

ENCODER_PATHS = [
    os.path.join(MODEL_DIR, "label_encoders.pkl"),
    os.path.join(MODEL_DIR, "models", "label_encoders.pkl"),
    os.path.join(BASE_DIR, "label_encoders.pkl"),
]

SCALER_PATHS = [
    os.path.join(MODEL_DIR, "scaler.pkl"),
    os.path.join(MODEL_DIR, "models", "scaler.pkl"),
    os.path.join(BASE_DIR, "scaler.pkl"),
]


# ============================================================
# FIND FILE
# ============================================================

def find_existing_file(paths):

    for path in paths:

        if os.path.exists(path):
            return path

    return None


# ============================================================
# LOAD MODEL
# ============================================================

_model = None
_encoders = None
_scaler = None


def load_model():

    global _model

    if _model is not None:
        return _model

    model_path = find_existing_file(MODEL_PATHS)

    if not model_path:
        raise FileNotFoundError(
            "pill_adherence_model.pkl was not found. "
            "Please place the trained model inside backend/ml/."
        )

    print()
    print("=" * 60)
    print("LOADING PILLSYNC ADHERENCE MODEL")
    print("=" * 60)
    print("Model:", model_path)

    _model = joblib.load(model_path)

    print("Model loaded successfully.")
    print("Model type:", type(_model).__name__)
    print("=" * 60)

    return _model


# ============================================================
# LOAD ENCODERS
# ============================================================

def load_encoders():

    global _encoders

    if _encoders is not None:
        return _encoders

    encoder_path = find_existing_file(ENCODER_PATHS)

    if encoder_path:

        try:

            _encoders = joblib.load(encoder_path)

            print("Label encoders loaded:")
            print(encoder_path)

        except Exception as error:

            print(
                "Warning: Could not load label encoders:",
                error
            )

            _encoders = {}

    else:

        print(
            "No label_encoders.pkl found. "
            "Using built-in categorical mappings."
        )

        _encoders = {}

    return _encoders


# ============================================================
# LOAD SCALER
# ============================================================

def load_scaler():

    global _scaler

    if _scaler is not None:
        return _scaler

    scaler_path = find_existing_file(SCALER_PATHS)

    if scaler_path:

        try:

            _scaler = joblib.load(scaler_path)

            print("Scaler loaded:")
            print(scaler_path)

        except Exception as error:

            print(
                "Warning: Could not load scaler:",
                error
            )

            _scaler = None

    else:

        print(
            "No scaler.pkl found. "
            "Model will receive unscaled features."
        )

    return _scaler


# ============================================================
# SAFE NUMBER
# ============================================================

def safe_number(value, default=0):

    try:

        if value is None:
            return default

        if isinstance(value, str) and not value.strip():
            return default

        return float(value)

    except (ValueError, TypeError):

        return default


# ============================================================
# BUILT-IN CATEGORY ENCODING
# ============================================================

def encode_category(value, mapping, default=0):

    if value is None:
        return default

    value = str(value).strip()

    if value in mapping:
        return mapping[value]

    value_lower = value.lower()

    for key, encoded in mapping.items():

        if key.lower() == value_lower:
            return encoded

    return default


# ============================================================
# DEFAULT DATASET MAPPINGS
# ============================================================

GENDER_MAPPING = {
    "Male": 0,
    "Female": 1,
    "Other": 2,
}

MEDICATION_TYPE_MAPPING = {
    "Tablet": 0,
    "Capsule": 1,
    "Syrup": 2,
    "Injection": 3,
    "Other": 4,
}

EDUCATION_MAPPING = {
    "High School": 0,
    "Graduate": 1,
    "Postgraduate": 2,
}

SOCIAL_SUPPORT_MAPPING = {
    "Low": 0,
    "Medium": 1,
    "High": 2,
}

CONDITION_SEVERITY_MAPPING = {
    "Mild": 0,
    "Moderate": 1,
    "Severe": 2,
}

HEALTHCARE_ACCESS_MAPPING = {
    "Poor": 0,
    "Average": 1,
    "Good": 2,
}

MENTAL_HEALTH_MAPPING = {
    "Poor": 0,
    "Moderate": 1,
    "Good": 2,
}


# ============================================================
# ENCODE USING SAVED LABEL ENCODERS WHEN AVAILABLE
# ============================================================

def encode_with_saved_encoder(
    value,
    feature_name,
    fallback_mapping
):

    encoders = load_encoders()

    encoder = None

    if isinstance(encoders, dict):

        encoder = encoders.get(feature_name)

        if encoder is None:

            # Try case-insensitive feature name
            for key, candidate in encoders.items():

                if str(key).lower() == feature_name.lower():

                    encoder = candidate
                    break

    if encoder is not None:

        try:

            encoded = encoder.transform([value])

            return float(encoded[0])

        except Exception as error:

            print(
                f"Encoder warning for {feature_name}:",
                error
            )

    return float(
        encode_category(
            value,
            fallback_mapping
        )
    )


# ============================================================
# BUILD FEATURE DATA
# ============================================================

def build_features(data):

    gender = data.get("Gender", "")
    medication_type = data.get("Medication_Type", "")
    education = data.get("Education_Level", "")
    social_support = data.get("Social_Support_Level", "")
    condition_severity = data.get("Condition_Severity", "")
    healthcare_access = data.get("Healthcare_Access", "")
    mental_health = data.get("Mental_Health_Status", "")

    features = {

        "Age":
            safe_number(
                data.get("Age")
            ),

        "Gender":
            encode_with_saved_encoder(
                gender,
                "Gender",
                GENDER_MAPPING
            ),

        "Medication_Type":
            encode_with_saved_encoder(
                medication_type,
                "Medication_Type",
                MEDICATION_TYPE_MAPPING
            ),

        "Dosage_mg":
            safe_number(
                data.get("Dosage_mg")
            ),

        "Previous_Adherence":
            safe_number(
                data.get("Previous_Adherence")
            ),

        "Education_Level":
            encode_with_saved_encoder(
                education,
                "Education_Level",
                EDUCATION_MAPPING
            ),

        "Income":
            safe_number(
                data.get("Income")
            ),

        "Social_Support_Level":
            encode_with_saved_encoder(
                social_support,
                "Social_Support_Level",
                SOCIAL_SUPPORT_MAPPING
            ),

        "Condition_Severity":
            encode_with_saved_encoder(
                condition_severity,
                "Condition_Severity",
                CONDITION_SEVERITY_MAPPING
            ),

        "Comorbidities_Count":
            safe_number(
                data.get("Comorbidities_Count")
            ),

        "Healthcare_Access":
            encode_with_saved_encoder(
                healthcare_access,
                "Healthcare_Access",
                HEALTHCARE_ACCESS_MAPPING
            ),

        "Mental_Health_Status":
            encode_with_saved_encoder(
                mental_health,
                "Mental_Health_Status",
                MENTAL_HEALTH_MAPPING
            ),

        "Insurance_Coverage":
            safe_number(
                data.get("Insurance_Coverage")
            ),
    }

    return features


# ============================================================
# CREATE MODEL INPUT
# ============================================================

def create_model_input(data):

    features = build_features(data)

    print()
    print("=" * 60)
    print("PILLSYNC MODEL INPUT")
    print("=" * 60)

    for key, value in features.items():

        print(
            f"{key}: {value}"
        )

    print("=" * 60)

    dataframe = pd.DataFrame(
        [features]
    )

    # --------------------------------------------------------
    # Keep the exact feature order expected by the model
    # --------------------------------------------------------

    expected_features = [
        "Age",
        "Gender",
        "Medication_Type",
        "Dosage_mg",
        "Previous_Adherence",
        "Education_Level",
        "Income",
        "Social_Support_Level",
        "Condition_Severity",
        "Comorbidities_Count",
        "Healthcare_Access",
        "Mental_Health_Status",
        "Insurance_Coverage",
    ]

    dataframe = dataframe[
        expected_features
    ]

    # --------------------------------------------------------
    # Apply saved scaler if available
    # --------------------------------------------------------

    scaler = load_scaler()

    if scaler is not None:

        try:

            dataframe = pd.DataFrame(
                scaler.transform(dataframe),
                columns=expected_features
            )

            print(
                "Feature scaling applied."
            )

        except Exception as error:

            print(
                "Scaler warning:",
                error
            )

    return dataframe


# ============================================================
# GET PROBABILITY
# ============================================================

def get_probability(model, model_input):

    # --------------------------------------------------------
    # predict_proba
    # --------------------------------------------------------

    if hasattr(model, "predict_proba"):

        probabilities = model.predict_proba(
            model_input
        )

        probabilities = np.asarray(
            probabilities
        )

        if probabilities.ndim == 2:

            if probabilities.shape[1] >= 2:

                probability = probabilities[0][1]

            else:

                probability = probabilities[0][0]

        else:

            probability = probabilities[0]

        return float(
            probability
        )

    # --------------------------------------------------------
    # Fallback to prediction
    # --------------------------------------------------------

    prediction = model.predict(
        model_input
    )

    prediction = float(
        prediction[0]
    )

    return prediction


# ============================================================
# RISK LEVEL
# ============================================================

def get_risk_level(probability):

    if probability >= 0.70:

        return "Low Risk"

    if probability >= 0.40:

        return "Medium Risk"

    return "High Risk"


# ============================================================
# MAIN PREDICTION FUNCTION
# ============================================================

def predict_adherence(data):

    if not isinstance(data, dict):

        raise ValueError(
            "Prediction input must be a dictionary."
        )

    model = load_model()

    model_input = create_model_input(
        data
    )

    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    probability = get_probability(
        model,
        model_input
    )

    # Make sure probability is 0-1
    probability = max(
        0.0,
        min(
            1.0,
            probability
        )
    )

    probability_percent = round(
        probability * 100,
        2
    )

    predicted_class = (
        1
        if probability >= 0.50
        else 0
    )

    if predicted_class == 1:

        adherence_status = (
            "Likely Adherent"
        )

    else:

        adherence_status = (
            "Likely Non-Adherent"
        )

    risk_level = get_risk_level(
        probability
    )

    result = {

        "probability":
            probability_percent,

        "prediction":
            predicted_class,

        "adherence_status":
            adherence_status,

        "risk_level":
            risk_level,
    }

    print()
    print("=" * 60)
    print("PILLSYNC ADHERENCE PREDICTION")
    print("=" * 60)
    print(
        "Probability:",
        probability_percent,
        "%"
    )
    print(
        "Prediction:",
        predicted_class
    )
    print(
        "Status:",
        adherence_status
    )
    print(
        "Risk:",
        risk_level
    )
    print("=" * 60)

    return result


# ============================================================
# TEST FUNCTION
# ============================================================

if __name__ == "__main__":

    sample_data = {

        "Age": 35,

        "Gender": "Male",

        "Medication_Type": "Tablet",

        "Dosage_mg": 500,

        "Previous_Adherence": 0.80,

        "Education_Level": "Graduate",

        "Income": 30000,

        "Social_Support_Level": "High",

        "Condition_Severity": "Moderate",

        "Comorbidities_Count": 1,

        "Healthcare_Access": "Good",

        "Mental_Health_Status": "Good",

        "Insurance_Coverage": 1,
    }

    result = predict_adherence(
        sample_data
    )

    print()
    print("TEST RESULT:")
    print(result)