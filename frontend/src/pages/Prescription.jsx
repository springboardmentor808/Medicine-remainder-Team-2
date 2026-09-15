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

            const data = response.data || {};

            // Prefer structured prescription data from the backend.
            // This prevents the UI from showing only the advice line when
            // the API has correctly detected multiple medicines.
            const prescription =
                data.prescription || {};

            const medicines =
                Array.isArray(data.medicines)
                    ? data.medicines
                    : Array.isArray(prescription.medicines)
                        ? prescription.medicines
                        : [];

            const formatMedicine = (medicine, index) => {
                const name =
                    medicine?.medicine_name ||
                    medicine?.name ||
                    medicine?.medicine ||
                    "";

                if (!name.trim()) {
                    return "";
                }

                const lines = [
                    `${index + 1}. Medicine: ${name.trim()}`
                ];

                const dosage =
                    medicine?.dosage ||
                    medicine?.dose ||
                    "";

                const frequency =
                    medicine?.frequency ||
                    "";

                const instruction =
                    medicine?.instructions ||
                    medicine?.instruction ||
                    "";

                const duration =
                    medicine?.duration ||
                    "";

                const quantity =
                    medicine?.quantity ||
                    "";

                if (String(dosage).trim()) {
                    lines.push(`   Dosage: ${String(dosage).trim()}`);
                }

                if (String(frequency).trim()) {
                    lines.push(`   Frequency: ${String(frequency).trim()}`);
                }

                if (String(instruction).trim()) {
                    lines.push(`   Instruction: ${String(instruction).trim()}`);
                }

                if (String(duration).trim()) {
                    lines.push(`   Duration: ${String(duration).trim()}`);
                }

                if (String(quantity).trim()) {
                    lines.push(`   Quantity: ${String(quantity).trim()}`);
                }

                return lines.join("\n");
            };

            let displayText = medicines
                .map(formatMedicine)
                .filter(Boolean)
                .join("\n\n");

            // Advice/instructions can be returned either at the top level
            // or inside the nested prescription object.
            const advice =
                data.instructions ||
                prescription.instructions ||
                data.advice ||
                prescription.advice ||
                "";

            if (String(advice).trim()) {
                if (displayText) {
                    displayText += "\n\n";
                }

                displayText += `Advice: ${String(advice).trim()}`;
            }

            // If structured data is unavailable, use the backend's final
            // formatted text, then raw OCR text as a last fallback.
            const text =
                displayText.trim() ||
                String(data.text || "").trim() ||
                String(data.raw_text || data.handwritten_text || "").trim();

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

            formData.append(
                "image",
                image
            );

            // Handwritten OCR can take much longer than normal API calls
            // because the backend may load/use the TrOCR model. Override any
            // short Axios timeout for this request.
            const response = await api.post(
                "medicines/prescription-ai/",
                formData,
                {
                    timeout: 180000,
                    // Do NOT set Content-Type manually. Axios/browser will
                    // add multipart/form-data with the correct boundary.
                }
            );

            // --------------------------------------------------------
            // READ COMPLETE HANDWRITTEN PRESCRIPTION RESPONSE
            // --------------------------------------------------------
            const data = response.data || {};

            console.log("HANDWRITTEN OCR HTTP STATUS:", response.status);
            console.log("HANDWRITTEN OCR RESPONSE DATA:", data);

            // Some Django error handlers may return HTTP 200 with success=false.
            if (data.success === false && !data.text && !data.raw_text &&
                !data.handwritten_text &&
                !Array.isArray(data.medicines) &&
                !Array.isArray(data.prescription?.medicines)) {
                throw new Error(
                    data.error ||
                    data.message ||
                    "The backend completed the OCR request but returned no prescription data."
                );
            }

            const prescription = data.prescription || {};

            // Backend may return structured medicine data.
            const medicines = Array.isArray(data.medicines)
                ? data.medicines
                : Array.isArray(prescription.medicines)
                    ? prescription.medicines
                    : [];

            // Format one medicine safely.
            const formatMedicine = (medicine, index) => {
                if (!medicine || typeof medicine !== "object") {
                    return "";
                }

                let name =
                    medicine.medicine_name ||
                    medicine.name ||
                    medicine.medicine ||
                    "";

                name = String(name).trim();

                if (!name) {
                    return "";
                }

                // Keep Syp./Tab./Cap. prefixes when the backend provides them.
                const lines = [
                    `${index + 1}. Medicine: ${name}`
                ];

                const dosage =
                    medicine.dosage ||
                    medicine.dose ||
                    "";

                const frequency =
                    medicine.frequency ||
                    "";

                const instruction =
                    medicine.instructions ||
                    medicine.instruction ||
                    "";

                const duration =
                    medicine.duration ||
                    "";

                const quantity =
                    medicine.quantity ||
                    "";

                if (String(dosage).trim()) {
                    lines.push(
                        `   Dosage: ${String(dosage).trim()}`
                    );
                }

                if (String(frequency).trim()) {
                    lines.push(
                        `   Frequency: ${String(frequency).trim()}`
                    );
                }

                if (String(instruction).trim()) {
                    lines.push(
                        `   Instruction: ${String(instruction).trim()}`
                    );
                }

                if (String(duration).trim()) {
                    lines.push(
                        `   Duration: ${String(duration).trim()}`
                    );
                }

                if (String(quantity).trim()) {
                    lines.push(
                        `   Quantity: ${String(quantity).trim()}`
                    );
                }

                return lines.join("\n");
            };

            let displayText = "";

            // --------------------------------------------------------
            // STRUCTURED MEDICINES
            // --------------------------------------------------------
            if (medicines.length > 0) {
                const formattedMedicines = medicines
                    .map(formatMedicine)
                    .filter(Boolean);

                if (formattedMedicines.length > 0) {
                    displayText =
                        "Prescription Details\n\n" +
                        formattedMedicines.join("\n\n");
                }
            }

            // --------------------------------------------------------
            // FIND ADVICE
            // --------------------------------------------------------
            let advice =
                data.advice ||
                prescription.advice ||
                data.instructions ||
                prescription.instructions ||
                "";

            advice = String(advice || "").trim();

            // If advice is not provided separately, find it in OCR text.
            const rawOCRText =
                data.text ||
                data.raw_text ||
                data.handwritten_text ||
                prescription.text ||
                prescription.raw_text ||
                "";

            const rawText = String(rawOCRText || "").trim();

            if (!advice && rawText) {
                const adviceMatch = rawText.match(
                    /(?:^|\n)\s*Adv(?:ice)?\s*:\s*(.+)$/im
                );

                if (adviceMatch) {
                    advice = adviceMatch[1].trim();
                } else if (
                    /plenty\s+(?:of\s+)?fluids?/i.test(rawText)
                ) {
                    advice = "Plenty of fluids";
                }
            }

            // --------------------------------------------------------
            // ADD ADVICE
            // --------------------------------------------------------
            if (advice) {
                if (displayText) {
                    displayText += "\n\n";
                } else {
                    displayText = "Prescription Details\n\n";
                }

                // Avoid "Advice: Advice: ..."
                advice = advice.replace(
                    /^Adv(?:ice)?\s*:\s*/i,
                    ""
                ).trim();

                displayText += `Advice: ${advice}`;
            }

            // --------------------------------------------------------
            // RAW OCR FALLBACK
            // --------------------------------------------------------
            if (!displayText.trim() && rawText) {
                displayText =
                    "Prescription Details\n\n" +
                    rawText;
            }

            const text = displayText.trim();

            console.log(
                "HANDWRITTEN OCR API RESPONSE:",
                data
            );

            console.log(
                "FINAL PRESCRIPTION DISPLAY:",
                text
            );

            setExtractedText(text);

            if (text.trim()) {
                setSuccess(
                    "Handwritten prescription text extracted successfully."
                );
            } else {
                setError(
                    "Could not recognize handwritten text from this image."
                );
            }
        } catch (error) {
            console.error(
                "Handwritten AI OCR error:",
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

            // Show the real backend/network error instead of hiding it
            // behind the generic "Handwritten prescription OCR failed."
            const status = error.response?.status;
            const backendData = error.response?.data;

            let backendMessage =
                backendData?.error ||
                backendData?.message ||
                backendData?.detail ||
                "";

            if (typeof backendMessage !== "string") {
                backendMessage = JSON.stringify(backendMessage);
            }

            if (!backendMessage && error.code === "ECONNABORTED") {
                backendMessage =
                    "Handwritten OCR took too long. Please try again with a clear image.";
            }

            if (!backendMessage && error.message) {
                backendMessage = error.message;
            }

            if (status) {
                backendMessage = `OCR request failed (${status}): ${backendMessage}`;
            }

            setError(
                backendMessage ||
                "Handwritten prescription OCR failed. Check the Django terminal for the backend error."
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
                                rows={14}
                                spellCheck={false}
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