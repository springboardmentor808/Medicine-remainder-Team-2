import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api/api";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import "./MedicineOCR.css";

function MedicineOCR() {
    const navigate = useNavigate();

    // ============================================================
    // STATE
    // ============================================================

    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState("");

    const [result, setResult] = useState(null);

    const [loading, setLoading] = useState(false);
    const [cameraLoading, setCameraLoading] = useState(false);
    const [cameraOpen, setCameraOpen] = useState(false);

    const [error, setError] = useState("");

    const [medicineDetails, setMedicineDetails] = useState({
        medicine_name: "",
        dosage: "",
        quantity: "",
        frequency: "",
    });

    // ============================================================
    // REFERENCES
    // ============================================================

    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    // ============================================================
    // ATTACH STREAM WHEN CAMERA UI IS READY
    // ============================================================

    useEffect(() => {
        const attachCamera = async () => {
            if (
                cameraOpen &&
                streamRef.current &&
                videoRef.current
            ) {
                try {
                    const video = videoRef.current;

                    video.srcObject = streamRef.current;
                    video.muted = true;
                    video.autoplay = true;
                    video.playsInline = true;

                    await video.play();

                } catch (error) {
                    console.error(
                        "VIDEO PLAY ERROR:",
                        error
                    );

                    setError(
                        "Camera opened, but the video preview could not start."
                    );
                }
            }
        };

        attachCamera();

    }, [cameraOpen]);

    // ============================================================
    // STOP CAMERA
    // ============================================================

    const stopCamera = () => {

        if (streamRef.current) {

            streamRef.current
                .getTracks()
                .forEach((track) => {
                    track.stop();
                });

            streamRef.current = null;
        }

        if (videoRef.current) {

            videoRef.current.pause();

            videoRef.current.srcObject = null;
        }

        setCameraOpen(false);
        setCameraLoading(false);
    };

    // ============================================================
    // CLEANUP WHEN PAGE IS CLOSED
    // ============================================================

    useEffect(() => {

        return () => {

            if (streamRef.current) {

                streamRef.current
                    .getTracks()
                    .forEach((track) => {
                        track.stop();
                    });

                streamRef.current = null;
            }

            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };

    }, [preview]);

    // ============================================================
    // SELECT IMAGE
    // ============================================================

    const handleImageChange = (event) => {

        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {

            setError(
                "Please select a valid image file."
            );

            return;
        }

        if (file.size > 5 * 1024 * 1024) {

            setError(
                "Image must be smaller than 5 MB."
            );

            return;
        }

        stopCamera();

        if (preview) {
            URL.revokeObjectURL(preview);
        }

        const imageURL =
            URL.createObjectURL(file);

        setImage(file);
        setPreview(imageURL);

        setResult(null);
        setError("");

        setMedicineDetails({
            medicine_name: "",
            dosage: "",
            quantity: "",
            frequency: "",
        });
    };

    // ============================================================
    // OPEN CAMERA
    // ============================================================

    const openCamera = async () => {

        setError("");
        setResult(null);
        setCameraLoading(true);

        try {

            // ----------------------------------------------------
            // CHECK BROWSER SUPPORT
            // ----------------------------------------------------

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {

                throw new Error(
                    "Camera access is not supported by this browser."
                );
            }

            // ----------------------------------------------------
            // STOP OLD CAMERA
            // ----------------------------------------------------

            if (streamRef.current) {

                streamRef.current
                    .getTracks()
                    .forEach((track) => {
                        track.stop();
                    });

                streamRef.current = null;
            }

            // ----------------------------------------------------
            // REQUEST CAMERA
            // ----------------------------------------------------

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: {
                            ideal: "environment",
                        },

                        width: {
                            ideal: 1280,
                        },

                        height: {
                            ideal: 720,
                        },
                    },

                    audio: false,
                });

            // ----------------------------------------------------
            // SAVE STREAM
            // ----------------------------------------------------

            streamRef.current = stream;

            // ----------------------------------------------------
            // OPEN CAMERA UI
            // ----------------------------------------------------

            setCameraOpen(true);

        } catch (cameraError) {

            console.error(
                "CAMERA ERROR:",
                cameraError
            );

            // ----------------------------------------------------
            // STOP STREAM IF ERROR
            // ----------------------------------------------------

            if (streamRef.current) {

                streamRef.current
                    .getTracks()
                    .forEach((track) => {
                        track.stop();
                    });

                streamRef.current = null;
            }

            setCameraOpen(false);

            // ----------------------------------------------------
            // CAMERA ERROR TYPES
            // ----------------------------------------------------

            if (
                cameraError.name ===
                "NotAllowedError"
            ) {

                setError(
                    "Camera permission was denied. Please allow camera access in Chrome and try again."
                );

            } else if (
                cameraError.name ===
                "NotFoundError"
            ) {

                setError(
                    "No camera was found on this device."
                );

            } else if (
                cameraError.name ===
                "NotReadableError"
            ) {

                setError(
                    "Camera is already being used by another application. Close other camera apps and try again."
                );

            } else if (
                cameraError.name ===
                "OverconstrainedError"
            ) {

                setError(
                    "The requested camera settings are not available. Please try again."
                );

            } else if (
                cameraError.name ===
                "SecurityError"
            ) {

                setError(
                    "Camera access was blocked by the browser. Check browser permissions."
                );

            } else {

                setError(
                    cameraError.message ||
                    "Could not start the camera."
                );
            }

        } finally {

            setCameraLoading(false);
        }
    };

    // ============================================================
    // CAPTURE PHOTO
    // ============================================================

    const capturePhoto = () => {

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) {

            setError(
                "Camera is not ready."
            );

            return;
        }

        if (
            video.readyState <
            HTMLMediaElement.HAVE_CURRENT_DATA
        ) {

            setError(
                "Camera preview is still loading. Please wait a moment."
            );

            return;
        }

        if (
            video.videoWidth === 0 ||
            video.videoHeight === 0
        ) {

            setError(
                "Camera image is not ready. Please wait."
            );

            return;
        }

        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;

        const context =
            canvas.getContext("2d");

        if (!context) {

            setError(
                "Could not capture camera image."
            );

            return;
        }

        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );

        canvas.toBlob(
            (blob) => {

                if (!blob) {

                    setError(
                        "Could not create the captured image."
                    );

                    return;
                }

                const file = new File(
                    [blob],
                    "medicine-camera.jpg",
                    {
                        type: "image/jpeg",
                    }
                );

                if (preview) {
                    URL.revokeObjectURL(preview);
                }

                const imageURL =
                    URL.createObjectURL(blob);

                setImage(file);
                setPreview(imageURL);

                setResult(null);
                setError("");

                setMedicineDetails({
                    medicine_name: "",
                    dosage: "",
                    quantity: "",
                    frequency: "",
                });

                stopCamera();
            },

            "image/jpeg",

            0.92
        );
    };

    // ============================================================
    // SCAN MEDICINE
    // ============================================================

    const handleOCR = async () => {

        if (!image) {

            setError(
                "Please choose or capture a medicine image first."
            );

            return;
        }

        const formData =
            new FormData();

        formData.append(
            "image",
            image
        );

        try {

            setLoading(true);
            setError("");
            setResult(null);

            const response =
                await api.post(
                    "medicines/ocr/",
                    formData,
                    {
                        headers: {
                            "Content-Type":
                                "multipart/form-data",
                        },
                    }
                );

            console.log(
                "OCR RESPONSE:",
                response.data
            );

            const data =
                response.data || {};

            const medicine =
                data.medicine ||
                data.medicine_details ||
                data.details ||
                {};

            const extractedMedicine = {

                medicine_name:
                    medicine.medicine_name ||
                    medicine.name ||
                    "",

                dosage:
                    medicine.dosage ||
                    "",

                quantity:
                    medicine.quantity ||
                    "",

                frequency:
                    medicine.frequency ||
                    "",
            };

            setMedicineDetails(
                extractedMedicine
            );

            setResult({
                ...data,
                medicine:
                    extractedMedicine,
            });

        } catch (ocrError) {

            console.error(
                "OCR ERROR:",
                ocrError
            );

            console.error(
                "SERVER RESPONSE:",
                ocrError.response?.data
            );

            if (
                ocrError.response?.status ===
                401
            ) {

                localStorage.removeItem(
                    "access"
                );

                localStorage.removeItem(
                    "refresh"
                );

                setError(
                    "Your login session has expired. Please login again."
                );

                setTimeout(() => {
                    navigate("/login");
                }, 1000);

                return;
            }

            setError(
                ocrError.response?.data?.error ||
                ocrError.response?.data?.detail ||
                "Medicine scanning failed. Please try again."
            );

        } finally {

            setLoading(false);
        }
    };

    // ============================================================
    // CHANGE MEDICINE FIELD
    // ============================================================

    const handleMedicineChange = (
        field,
        value
    ) => {

        setMedicineDetails(
            (previous) => ({
                ...previous,
                [field]: value,
            })
        );
    };

    // ============================================================
    // USE MEDICINE RESULT
    // ============================================================

    const useMedicineResult = () => {

        navigate(
            "/add-medicine",
            {
                state: {
                    medicine_name:
                        medicineDetails.medicine_name,

                    dosage:
                        medicineDetails.dosage,

                    quantity:
                        medicineDetails.quantity,

                    frequency:
                        medicineDetails.frequency,
                },
            }
        );
    };

    // ============================================================
    // RESET SCANNER
    // ============================================================

    const resetScanner = () => {

        stopCamera();

        if (preview) {
            URL.revokeObjectURL(preview);
        }

        setImage(null);
        setPreview("");
        setResult(null);
        setError("");

        setMedicineDetails({
            medicine_name: "",
            dosage: "",
            quantity: "",
            frequency: "",
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // ============================================================
    // PAGE
    // ============================================================

    return (
        <>
            <Navbar />

            <Sidebar />

            <main className="ocr-main">

                <div className="ocr-container">

                    {/* HEADER */}

                    <section className="ocr-header">

                        <div>

                            <div className="ocr-eyebrow">
                                PILLSYNC • MEDICATION MANAGEMENT
                            </div>

                            <h1>
                                Medicine OCR Scanner
                            </h1>

                            <p>
                                Upload or capture a medicine
                                image and let PillSync extract
                                medication information automatically.
                            </p>

                        </div>

                        <Link
                            to="/dashboard"
                            className="ocr-back-button"
                        >
                            ← Dashboard
                        </Link>

                    </section>


                    {/* SCANNER CARD */}

                    <section className="ocr-card">

                        <div className="ocr-card-header">

                            <div className="ocr-title-icon">
                                📷
                            </div>

                            <div>

                                <h2>
                                    Scan Medicine
                                </h2>

                                <p>
                                    Choose an image or use your camera.
                                </p>

                            </div>

                        </div>


                        {/* FILE INPUT */}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            onChange={handleImageChange}
                            hidden
                        />


                        {/* ACTION BUTTONS */}

                        {!cameraOpen && !image && (

                            <div className="ocr-action-grid">

                                <button
                                    type="button"
                                    className="ocr-action-card"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                >

                                    <span className="ocr-action-icon">
                                        📁
                                    </span>

                                    <strong>
                                        Upload Image
                                    </strong>

                                    <span>
                                        JPG, PNG or WebP
                                    </span>

                                </button>


                                <button
                                    type="button"
                                    className="ocr-action-card"
                                    onClick={openCamera}
                                    disabled={cameraLoading}
                                >

                                    <span className="ocr-action-icon">
                                        📷
                                    </span>

                                    <strong>
                                        {cameraLoading
                                            ? "Opening Camera..."
                                            : "Use Camera"}
                                    </strong>

                                    <span>
                                        Capture medicine photo
                                    </span>

                                </button>

                            </div>
                        )}


                        {/* =================================================
                            CAMERA
                        ================================================= */}

                        {cameraOpen && (

                            <div className="camera-area">

                                <div className="camera-header">

                                    <div>

                                        <h3>
                                            Camera Preview
                                        </h3>

                                        <p>
                                            Position the medicine label
                                            clearly inside the frame.
                                        </p>

                                    </div>

                                    <span className="camera-live">
                                        ● LIVE
                                    </span>

                                </div>


                                <div className="camera-preview">

                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                    />

                                    <div className="camera-frame">
                                        <span />
                                    </div>

                                </div>


                                <div className="camera-controls">

                                    <button
                                        type="button"
                                        className="capture-button"
                                        onClick={capturePhoto}
                                    >
                                        📸 Capture Photo
                                    </button>


                                    <button
                                        type="button"
                                        className="close-camera-button"
                                        onClick={stopCamera}
                                    >
                                        ✕ Close Camera
                                    </button>

                                </div>

                            </div>
                        )}


                        {/* IMAGE PREVIEW */}

                        {preview && !cameraOpen && (

                            <div className="preview-area">

                                <div className="preview-header">

                                    <div>

                                        <h3>
                                            Image Preview
                                        </h3>

                                        <p>
                                            Make sure the medicine
                                            text is clearly visible.
                                        </p>

                                    </div>

                                    <span>
                                        ✓ Ready
                                    </span>

                                </div>


                                <div className="image-preview-box">

                                    <img
                                        src={preview}
                                        alt="Medicine preview"
                                    />

                                </div>

                            </div>
                        )}


                        {/* ERROR */}

                        {error && (

                            <div className="ocr-error">

                                <span>
                                    ⚠
                                </span>

                                <div>

                                    <strong>
                                        Something went wrong
                                    </strong>

                                    <p>
                                        {error}
                                    </p>

                                </div>

                            </div>
                        )}


                        {/* SCAN BUTTON */}

                        {image &&
                            !cameraOpen &&
                            !result && (

                                <div className="scan-actions">

                                    <button
                                        type="button"
                                        className="scan-button"
                                        onClick={handleOCR}
                                        disabled={loading}
                                    >

                                        {loading
                                            ? "🔍 Scanning Medicine..."
                                            : "🔍 Scan Medicine"
                                        }

                                    </button>


                                    <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={resetScanner}
                                        disabled={loading}
                                    >
                                        Choose Another
                                    </button>

                                </div>
                            )}

                    </section>


                    {/* =================================================
                        OCR RESULT
                    ================================================= */}

                    {result && (

                        <section className="result-card">

                            <div className="result-header">

                                <div>

                                    <div className="result-eyebrow">
                                        SCAN COMPLETE
                                    </div>

                                    <h2>
                                        OCR Results
                                    </h2>

                                    <p>
                                        Review and correct the extracted
                                        information before adding it.
                                    </p>

                                </div>

                                <div className="result-success">
                                    ✓ Completed
                                </div>

                            </div>


                            {/* MEDICINE DETAILS */}

                            <div className="medicine-result">

                                <div className="medicine-result-title">

                                    <div className="medicine-result-icon">
                                        💊
                                    </div>

                                    <div>

                                        <h3>
                                            Medicine Details
                                        </h3>

                                        <span>
                                            Editable OCR result
                                        </span>

                                    </div>

                                </div>


                                <div className="medicine-fields">

                                    <EditableResultField
                                        label="Medicine Name"
                                        value={
                                            medicineDetails.medicine_name
                                        }
                                        onChange={(value) =>
                                            handleMedicineChange(
                                                "medicine_name",
                                                value
                                            )
                                        }
                                    />


                                    <EditableResultField
                                        label="Dosage"
                                        value={
                                            medicineDetails.dosage
                                        }
                                        onChange={(value) =>
                                            handleMedicineChange(
                                                "dosage",
                                                value
                                            )
                                        }
                                    />


                                    <EditableResultField
                                        label="Quantity"
                                        value={
                                            medicineDetails.quantity
                                        }
                                        onChange={(value) =>
                                            handleMedicineChange(
                                                "quantity",
                                                value
                                            )
                                        }
                                    />


                                    <EditableResultField
                                        label="Frequency"
                                        value={
                                            medicineDetails.frequency
                                        }
                                        onChange={(value) =>
                                            handleMedicineChange(
                                                "frequency",
                                                value
                                            )
                                        }
                                    />

                                </div>


                                {/* VERIFICATION WARNING */}

                                <div className="verification-warning">

                                    <span>
                                        ⚠️
                                    </span>

                                    <div>

                                        <strong>
                                            Verify before saving
                                        </strong>

                                        <p>
                                            OCR is an assistive tool and may
                                            make mistakes, especially with
                                            handwritten text. Compare the
                                            medicine name, dosage, quantity
                                            and frequency with the original
                                            medicine label or prescription.
                                        </p>

                                    </div>

                                </div>


                                <button
                                    type="button"
                                    className="use-medicine-button"
                                    onClick={useMedicineResult}
                                >
                                    ➕ Use This Medicine
                                </button>

                            </div>


                            {/* RAW OCR TEXT */}

                            <div className="raw-text-section">

                                <div className="raw-text-header">

                                    <div>

                                        <h3>
                                            Extracted Text
                                        </h3>

                                        <p>
                                            Raw text returned by OCR.
                                        </p>

                                    </div>

                                </div>


                                <pre>
                                    {result.text ||
                                        result.ocr_text ||
                                        result.extracted_text ||
                                        "No text detected."
                                    }
                                </pre>

                            </div>


                            {/* NEW SCAN */}

                            <button
                                type="button"
                                className="new-scan-button"
                                onClick={resetScanner}
                            >
                                🔄 Scan Another Medicine
                            </button>

                        </section>
                    )}

                </div>

            </main>


            {/* CAMERA CANVAS */}

            <canvas
                ref={canvasRef}
                style={{
                    display: "none"
                }}
            />

        </>
    );
}


// ============================================================
// EDITABLE RESULT FIELD
// ============================================================

function EditableResultField({
    label,
    value,
    onChange,
}) {

    return (

        <div className="result-field">

            <label>
                {label}
            </label>

            <input
                type="text"
                value={value || ""}
                placeholder={
                    `Enter ${label.toLowerCase()}`
                }
                onChange={(event) =>
                    onChange(
                        event.target.value
                    )
                }
            />

        </div>
    );
}


export default MedicineOCR