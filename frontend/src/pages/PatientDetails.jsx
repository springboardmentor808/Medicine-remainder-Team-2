import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

function Prescription() {
    const navigate = useNavigate();

    // ============================================================
    // STATE
    // ============================================================

    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState("");

    const [loading, setLoading] = useState(false);
    const [cameraLoading, setCameraLoading] = useState(false);

    const [cameraOpen, setCameraOpen] = useState(false);

    const [scanType, setScanType] = useState("");

    const [extractedText, setExtractedText] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // ============================================================
    // REFERENCES
    // ============================================================

    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    // ============================================================
    // ATTACH CAMERA STREAM
    // ============================================================

    useEffect(() => {
        if (!cameraOpen) {
            return;
        }

        const video = videoRef.current;
        const stream = streamRef.current;

        if (!video || !stream) {
            return;
        }

        video.srcObject = stream;
        video.muted = true;
        video.autoplay = true;
        video.playsInline = true;

        const startVideo = async () => {
            try {
                await video.play();
                setCameraLoading(false);
            } catch (err) {
                console.error("VIDEO PLAY ERROR:", err);

                setCameraLoading(false);
                setError(
                    "Camera opened, but the video preview could not start. Please try again."
                );
            }
        };

        const handleLoadedMetadata = () => {
            startVideo();
        };

        video.addEventListener(
            "loadedmetadata",
            handleLoadedMetadata
        );

        // Sometimes metadata is already available.
        if (video.readyState >= 1) {
            startVideo();
        }

        return () => {
            video.removeEventListener(
                "loadedmetadata",
                handleLoadedMetadata
            );
        };
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
    // CLEANUP
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
        };
    }, []);

    // ============================================================
    // SELECT IMAGE
    // ============================================================

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
            setError(
                "Only JPG, JPEG, PNG and WEBP images are allowed."
            );
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Image size must be less than 5 MB.");
            return;
        }

        stopCamera();

        setError("");
        setSuccess("");
        setExtractedText("");
        setScanType("");

        setImage(file);

        const reader = new FileReader();

        reader.onload = () => {
            setPreview(reader.result);
        };

        reader.onerror = () => {
            setPreview("");
            setError("Could not preview this image.");
        };

        reader.readAsDataURL(file);
    };

    // ============================================================
    // OPEN FILE SELECTOR
    // ============================================================

    const openImageSelector = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // ============================================================
    // OPEN CAMERA
    // ============================================================

    const openCamera = async () => {
        setError("");
        setSuccess("");
        setCameraLoading(true);

        try {
            // ----------------------------------------------------
            // CHECK SUPPORT
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

            let stream;

            try {
                stream =
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
            } catch (firstError) {
                console.warn(
                    "Preferred camera settings failed. Trying basic camera...",
                    firstError
                );

                // Fallback for laptops/browsers that don't accept
                // the preferred camera constraints.
                stream =
                    await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false,
                    });
            }

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
            // ERROR MESSAGES
            // ----------------------------------------------------

            if (
                cameraError.name ===
                "NotAllowedError"
            ) {
                setError(
                    "Camera permission was denied. Allow camera access in Chrome and try again."
                );
            } else if (
                cameraError.name ===
                "NotFoundError"
            ) {
                setError(
                    "No camera was found on this computer."
                );
            } else if (
                cameraError.name ===
                "NotReadableError"
            ) {
                setError(
                    "The camera is being used by another application. Close Camera, Teams, Zoom, WhatsApp, Meet or other camera apps."
                );
            } else if (
                cameraError.name ===
                "SecurityError"
            ) {
                setError(
                    "Camera access was blocked by the browser."
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
            setError("Camera is not ready.");
            return;
        }

        if (
            video.videoWidth === 0 ||
            video.videoHeight === 0
        ) {
            setError(
                "Camera image is not ready. Please wait a moment."
            );
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext("2d");

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

                const capturedFile = new File(
                    [blob],
                    "prescription-camera.jpg",
                    {
                        type: "image/jpeg",
                    }
                );

                const imageURL =
                    URL.createObjectURL(blob);

                setImage(capturedFile);
                setPreview(imageURL);

                setExtractedText("");
                setError("");
                setSuccess("");
                setScanType("");

                stopCamera();
            },
            "image/jpeg",
            0.92
        );
    };

    // ============================================================
    // PRINTED OCR
    // ============================================================

    const handlePrintedOCR = async () => {
        if (!image) {
            setError(
                "Please select or capture a prescription image first."
            );
            return;
        }

        setLoading(true);
        setScanType("printed");

        setError("");
        setSuccess("");
        setExtractedText("");

        try {
            const formData = new FormData();

            formData.append(
                "image",
                image
            );

            const response = await api.post(
                "medicines/ocr/",
                formData
            );

            const text =
                response.data?.text || "";

            setExtractedText(text);

            if (text.trim()) {
                setSuccess(
                    "Printed prescription text extracted successfully."
                );
            } else {
                setError(
                    "No printed text was detected. For handwritten prescriptions, try Handwritten AI OCR."
                );
            }
        } catch (error) {
            console.error(
                "Printed OCR error:",
                error
            );

            if (
                error.response?.status === 401
            ) {
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");

                setError(
                    "Your login session has expired. Please login again."
                );

                return;
            }

            setError(
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Printed prescription OCR failed."
            );
        } finally {
            setLoading(false);
            setScanType("");
        }
    };

    // ============================================================
    // HANDWRITTEN AI OCR
    // ============================================================

    const handleHandwrittenOCR = async () => {
        if (!image) {
            setError(
                "Please select or capture a prescription image first."
            );
            return;
        }

        setLoading(true);
        setScanType("handwritten");
        setError("");
        setSuccess("");
        setExtractedText("");

        try {
            const formData = new FormData();
            formData.append("image", image);

            const response = await api.post(
                "medicines/prescription-ai/",
                formData
            );

            const data = response.data || {};

            /*
             * The backend now returns:
             *   text       -> clean formatted prescription
             *   medicines -> ALL detected medicines
             *   raw_text   -> original OCR text
             *   prescription.advice -> general advice
             *
             * Always prefer the structured medicine list. This prevents
             * the UI from showing only "Advice: Plenty of fluids".
             */
            const medicines = Array.isArray(data.medicines)
                ? data.medicines
                : Array.isArray(data.prescription?.medicines)
                    ? data.prescription.medicines
                    : [];

            const advice =
                data.prescription?.advice ||
                data.advice ||
                "";

            const rawText =
                data.raw_text ||
                data.handwritten_text ||
                "";

            const cleanName = (value) =>
                String(value || "")
                    .replace(/\s+/g, " ")
                    .trim();

            const getFormPrefix = (medicine) => {
                const source = cleanName(medicine?.source_line);
                const name = cleanName(medicine?.medicine_name);

                if (!source) return "";

                const match = source.match(
                    /^\s*(Tab(?:let)?s?|Cap(?:sule)?s?|Syp(?:up)?|Syr(?:up)?|Inj(?:ection)?|Drops?|Cream|Gel|Ointment)\s*[.:]?\s*/i
                );

                if (!match) return "";

                const form = match[1].toLowerCase();

                const map = {
                    tab: "Tab.",
                    tabs: "Tab.",
                    tablet: "Tab.",
                    tablets: "Tab.",
                    cap: "Cap.",
                    caps: "Cap.",
                    capsule: "Cap.",
                    capsules: "Cap.",
                    syp: "Syp.",
                    sypup: "Syp.",
                    syr: "Syp.",
                    syrup: "Syp.",
                    inj: "Inj.",
                    injection: "Inj.",
                    drop: "Drops",
                    drops: "Drops",
                    cream: "Cream",
                    gel: "Gel",
                    ointment: "Ointment",
                };

                const displayForm = map[form] || form;

                if (
                    name &&
                    !name.toLowerCase().startsWith(
                        displayForm.toLowerCase()
                    )
                ) {
                    return displayForm;
                }

                return "";
            };

            const formatMedicineName = (medicine) => {
                let name = cleanName(
                    medicine?.medicine_name || medicine?.name
                );

                if (!name) return "";

                const prefix = getFormPrefix(medicine);

                if (
                    prefix &&
                    !name.toLowerCase().startsWith(
                        prefix.toLowerCase()
                    )
                ) {
                    name = `${prefix} ${name}`;
                }

                return name;
            };

            /*
             * Build the display text ourselves when medicines[] exists.
             * This guarantees every medicine is visible even if the
             * backend's legacy `text` field contains only the advice.
             */
            if (medicines.length > 0) {
                const output = [
                    "Prescription Details",
                    "",
                ];

                let visibleCount = 0;

                medicines.forEach((medicine) => {
                    if (!medicine || typeof medicine !== "object") {
                        return;
                    }

                    const name = formatMedicineName(medicine);

                    if (!name) return;

                    visibleCount += 1;

                    output.push(
                        `${visibleCount}. Medicine: ${name}`
                    );

                    const dosage = cleanName(medicine.dosage);
                    const frequency = cleanName(medicine.frequency);
                    const instruction = cleanName(
                        medicine.instructions ||
                        medicine.instruction
                    );
                    const duration = cleanName(medicine.duration);
                    const quantity = cleanName(medicine.quantity);

                    if (dosage) {
                        output.push(`   Dosage: ${dosage}`);
                    }

                    if (frequency) {
                        output.push(`   Frequency: ${frequency}`);
                    }

                    if (instruction) {
                        output.push(`   Instruction: ${instruction}`);
                    }

                    if (duration) {
                        output.push(`   Duration: ${duration}`);
                    }

                    if (quantity) {
                        output.push(`   Quantity: ${quantity}`);
                    }

                    output.push("");
                });

                const finalAdvice = cleanName(advice);

                if (finalAdvice) {
                    output.push(`Advice: ${finalAdvice}`);
                }

                if (visibleCount > 0) {
                    setExtractedText(output.join("\n").trim());

                    setSuccess(
                        `Prescription recognized successfully. ${visibleCount} medicine${visibleCount > 1 ? "s" : ""} detected.`
                    );

                    return;
                }
            }

            /*
             * If the structured list is empty, use the backend's clean
             * formatted text instead of displaying only the advice.
             */
            const backendText = cleanName(data.text);

            if (
                backendText &&
                backendText.toLowerCase() !== "prescription details"
            ) {
                setExtractedText(data.text.trim());

                setSuccess(
                    "Handwritten prescription text extracted successfully."
                );

                return;
            }

            /*
             * Last fallback: show raw OCR so the user can verify it.
             * Never silently pretend that a medicine was recognized.
             */
            if (rawText.trim()) {
                const fallback = [
                    "Prescription Details",
                    "",
                    rawText.trim(),
                ];

                if (advice) {
                    fallback.push("");
                    fallback.push(`Advice: ${cleanName(advice)}`);
                }

                setExtractedText(fallback.join("\n"));

                setSuccess(
                    "OCR text extracted. Please verify the medicine names against the original prescription."
                );

                return;
            }

            setError(
                "Could not recognize handwritten medicines from this image. Please upload a clearer prescription image."
            );
        } catch (error) {
            console.error(
                "Handwritten AI OCR error:",
                error
            );

            if (error.response?.status === 401) {
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");

                setError(
                    "Your login session has expired. Please login again."
                );

                return;
            }

            setError(
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Handwritten prescription OCR failed."
            );
        } finally {
            setLoading(false);
            setScanType("");
        }
    };

    // ============================================================
    // CLEAR PRESCRIPTION
    // ============================================================

    const clearPrescription = () => {
        stopCamera();

        if (preview && preview.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }

        setImage(null);
        setPreview("");
        setExtractedText("");

        setError("");
        setSuccess("");
        setScanType("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // ============================================================
    // CONTINUE TO ADD MEDICINE
    // ============================================================

    const continueToMedicine = () => {
        if (!extractedText.trim()) {
            setError(
                "Please extract prescription text first."
            );
            return;
        }

        navigate(
            "/add-medicine",
            {
                state: {
                    prescriptionText:
                        extractedText,
                },
            }
        );
    };

    // ============================================================
    // PAGE
    // ============================================================

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#F5F7FA",
                padding: "40px 20px",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    maxWidth: "900px",
                    margin: "0 auto",
                }}
            >
                {/* HEADER */}

                <div
                    style={{
                        marginBottom: "30px",
                    }}
                >
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "32px",
                            color: "#1F2937",
                        }}
                    >
                        📄 Prescription Scanner
                    </h1>

                    <p
                        style={{
                            color: "#6B7280",
                            marginTop: "8px",
                        }}
                    >
                        Capture or upload a prescription and
                        extract its text using OCR.
                    </p>
                </div>

                {/* MAIN CARD */}

                <div
                    style={{
                        background: "white",
                        borderRadius: "16px",
                        padding: "30px",
                        boxShadow:
                            "0 4px 15px rgba(0,0,0,0.08)",
                    }}
                >
                    {/* HIDDEN FILE INPUT */}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageChange}
                        style={{
                            display: "none",
                        }}
                    />

                    {/* CAMERA VIEW */}

                    {cameraOpen ? (
                        <div
                            style={{
                                textAlign: "center",
                            }}
                        >
                            <h2
                                style={{
                                    color: "#1F2937",
                                }}
                            >
                                📷 Camera Preview
                            </h2>

                            <p
                                style={{
                                    color: "#6B7280",
                                }}
                            >
                                Position the prescription clearly
                                inside the camera.
                            </p>

                            <div
                                style={{
                                    background: "#111827",
                                    borderRadius: "14px",
                                    padding: "10px",
                                    marginTop: "20px",
                                    overflow: "hidden",
                                }}
                            >
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        maxHeight: "550px",
                                        minHeight: "300px",
                                        objectFit: "contain",
                                        background: "#000",
                                        borderRadius: "10px",
                                    }}
                                />
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    gap: "12px",
                                    flexWrap: "wrap",
                                    marginTop: "20px",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={capturePhoto}
                                    disabled={cameraLoading}
                                    style={{
                                        padding: "13px 22px",
                                        border: "none",
                                        borderRadius: "9px",
                                        background: "#2563EB",
                                        color: "white",
                                        fontSize: "15px",
                                        fontWeight: "600",
                                        cursor: cameraLoading
                                            ? "not-allowed"
                                            : "pointer",
                                        opacity: cameraLoading
                                            ? 0.7
                                            : 1,
                                    }}
                                >
                                    📸 Capture Prescription
                                </button>

                                <button
                                    type="button"
                                    onClick={stopCamera}
                                    style={{
                                        padding: "13px 22px",
                                        border:
                                            "1px solid #CBD5E1",
                                        borderRadius: "9px",
                                        background: "white",
                                        color: "#374151",
                                        fontSize: "15px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                    }}
                                >
                                    ✕ Close Camera
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* UPLOAD / CAMERA AREA */

                        <div
                            style={{
                                border:
                                    "2px dashed #CBD5E1",
                                borderRadius: "14px",
                                padding: "60px 25px",
                                textAlign: "center",
                                background: "#FBFCFE",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "52px",
                                    marginBottom: "12px",
                                }}
                            >
                                📷
                            </div>

                            <h2
                                style={{
                                    margin: "0 0 8px",
                                    color: "#1F2937",
                                }}
                            >
                                Capture Prescription
                            </h2>

                            <p
                                style={{
                                    color: "#64748B",
                                    marginBottom: "25px",
                                }}
                            >
                                Take a clear photo of your prescription
                                or select an image from your device.
                            </p>

                            {/* OPEN CAMERA */}

                            <button
                                type="button"
                                onClick={openCamera}
                                disabled={cameraLoading}
                                style={{
                                    padding: "14px 28px",
                                    border: "none",
                                    borderRadius: "10px",
                                    background: "#2563EB",
                                    color: "white",
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    cursor: cameraLoading
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity: cameraLoading
                                        ? 0.7
                                        : 1,
                                    marginBottom: "18px",
                                }}
                            >
                                {cameraLoading
                                    ? "📷 Opening Camera..."
                                    : "📷 Open Camera"}
                            </button>

                            <div
                                style={{
                                    color: "#64748B",
                                    fontWeight: "600",
                                    marginBottom: "18px",
                                }}
                            >
                                OR
                            </div>

                            {/* CHOOSE IMAGE */}

                            <button
                                type="button"
                                onClick={openImageSelector}
                                style={{
                                    padding: "14px 28px",
                                    border: "none",
                                    borderRadius: "10px",
                                    background: "#F1F5F9",
                                    color: "#334155",
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                }}
                            >
                                📁 Choose Image
                            </button>
                        </div>
                    )}

                    {/* IMAGE PREVIEW */}

                    {preview && !cameraOpen && (
                        <div
                            style={{
                                marginTop: "30px",
                            }}
                        >
                            <h3>Image Preview</h3>

                            <img
                                src={preview}
                                alt="Prescription preview"
                                style={{
                                    width: "100%",
                                    maxHeight: "550px",
                                    objectFit: "contain",
                                    borderRadius: "12px",
                                    border:
                                        "1px solid #E5E7EB",
                                    background: "#F8FAFC",
                                }}
                            />
                        </div>
                    )}

                    {/* ERROR */}

                    {error && (
                        <div
                            style={{
                                marginTop: "20px",
                                padding: "12px 15px",
                                background: "#FEF2F2",
                                border:
                                    "1px solid #FECACA",
                                borderRadius: "8px",
                                color: "#B91C1C",
                            }}
                        >
                            ⚠️ {error}
                        </div>
                    )}

                    {/* SUCCESS */}

                    {success && (
                        <div
                            style={{
                                marginTop: "20px",
                                padding: "12px 15px",
                                background: "#F0FDF4",
                                border:
                                    "1px solid #BBF7D0",
                                borderRadius: "8px",
                                color: "#166534",
                            }}
                        >
                            ✓ {success}
                        </div>
                    )}

                    {/* OCR BUTTONS */}

                    {image && !cameraOpen && (
                        <div
                            style={{
                                marginTop: "30px",
                                textAlign: "center",
                            }}
                        >
                            <h3>
                                Choose Prescription Type
                            </h3>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    gap: "12px",
                                    flexWrap: "wrap",
                                }}
                            >
                                {/* PRINTED OCR */}

                                <button
                                    type="button"
                                    onClick={
                                        handlePrintedOCR
                                    }
                                    disabled={loading}
                                    style={{
                                        padding: "13px 20px",
                                        border: "none",
                                        borderRadius: "8px",
                                        background: "#16A34A",
                                        color: "white",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        opacity: loading
                                            ? 0.7
                                            : 1,
                                    }}
                                >
                                    {loading &&
                                    scanType === "printed"
                                        ? "⏳ Reading..."
                                        : "🖨️ Printed OCR"}
                                </button>

                                {/* HANDWRITTEN OCR */}

                                <button
                                    type="button"
                                    onClick={
                                        handleHandwrittenOCR
                                    }
                                    disabled={loading}
                                    style={{
                                        padding: "13px 20px",
                                        border: "none",
                                        borderRadius: "8px",
                                        background: "#7C3AED",
                                        color: "white",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        opacity: loading
                                            ? 0.7
                                            : 1,
                                    }}
                                >
                                    {loading &&
                                    scanType === "handwritten"
                                        ? "⏳ AI Reading..."
                                        : "✍️ Handwritten AI OCR"}
                                </button>

                                {/* CLEAR */}

                                <button
                                    type="button"
                                    onClick={
                                        clearPrescription
                                    }
                                    disabled={loading}
                                    style={{
                                        padding: "13px 20px",
                                        border:
                                            "1px solid #CBD5E1",
                                        borderRadius: "8px",
                                        background: "white",
                                        color: "#374151",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                    }}
                                >
                                    🔄 Clear
                                </button>
                            </div>
                        </div>
                    )}

                    {/* OCR RESULT */}

                    {extractedText && (
                        <div
                            style={{
                                marginTop: "30px",
                            }}
                        >
                            <h3>
                                Extracted Prescription Text
                            </h3>

                            <textarea
                                value={extractedText}
                                onChange={(event) =>
                                    setExtractedText(
                                        event.target.value
                                    )
                                }
                                rows={12}
                                style={{
                                    width: "100%",
                                    padding: "14px",
                                    border:
                                        "1px solid #CBD5E1",
                                    borderRadius: "10px",
                                    fontSize: "15px",
                                    lineHeight: "1.6",
                                    resize: "vertical",
                                    boxSizing: "border-box",
                                    outline: "none",
                                }}
                            />

                            <div
                                style={{
                                    marginTop: "15px",
                                    padding: "14px",
                                    background: "#FFFBEB",
                                    border:
                                        "1px solid #FDE68A",
                                    borderRadius: "8px",
                                    color: "#92400E",
                                    lineHeight: "1.5",
                                    fontSize: "13px",
                                }}
                            >
                                ⚠️ <strong>Important:</strong>{" "}
                                OCR/AI can make mistakes. Always
                                verify the medicine name, dosage,
                                frequency and duration against the
                                original prescription before saving
                                or taking medicine.
                            </div>

                            {/* CONTINUE */}

                            <button
                                type="button"
                                onClick={
                                    continueToMedicine
                                }
                                style={{
                                    marginTop: "20px",
                                    width: "100%",
                                    padding: "14px",
                                    border: "none",
                                    borderRadius: "8px",
                                    background: "#2563EB",
                                    color: "white",
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                }}
                            >
                                Continue to Add Medicine →
                            </button>
                        </div>
                    )}
                </div>

                {/* DASHBOARD */}

                <button
                    type="button"
                    onClick={() =>
                        navigate("/dashboard")
                    }
                    style={{
                        marginTop: "20px",
                        padding: "11px 20px",
                        border:
                            "1px solid #CBD5E1",
                        borderRadius: "8px",
                        background: "white",
                        color: "#374151",
                        fontSize: "15px",
                        cursor: "pointer",
                    }}
                >
                    ← Back to Dashboard
                </button>

                {/* HIDDEN CANVAS */}

                <canvas
                    ref={canvasRef}
                    style={{
                        display: "none",
                    }}
                />
            </div>
        </div>
    );
}

export default Prescription;