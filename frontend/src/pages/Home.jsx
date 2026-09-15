import { useNavigate } from "react-router-dom";

function Home() {
    const navigate = useNavigate();

    return (
        <div
            style={{
                minHeight: "100vh",

                background:
                    "linear-gradient(rgba(0,40,80,0.60), rgba(0,40,80,0.60)), url('/images/medical-bg.png')",

                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",

                display: "flex",
                justifyContent: "center",
                alignItems: "center",

                textAlign: "center",

                color: "white",

                padding: "20px",

                boxSizing: "border-box",
            }}
        >
            <div>

                <h1
                    style={{
                        fontSize: "60px",
                        marginBottom: "20px",
                        fontWeight: "bold",
                    }}
                >
                    💊 PillSync
                </h1>

                <p
                    style={{
                        fontSize: "24px",
                        maxWidth: "700px",
                        margin: "0 auto 40px",
                        lineHeight: "1.6",
                    }}
                >
                    Intelligent Medicine Reminder and Medication Tracking
                    Platform
                </p>

                <button
                    onClick={() => navigate("/login")}
                    style={{
                        background: "#00BCD4",
                        color: "white",
                        border: "none",
                        padding: "15px 35px",
                        borderRadius: "40px",
                        fontSize: "18px",
                        cursor: "pointer",
                        fontWeight: "bold",
                    }}
                >
                    Get Started
                </button>

            </div>
        </div>
    );
}

export default Home;