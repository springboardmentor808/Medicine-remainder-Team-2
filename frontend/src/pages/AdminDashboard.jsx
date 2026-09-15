import { useNavigate } from "react-router-dom";


function AdminDashboard() {

    const navigate = useNavigate();

    const username =
        localStorage.getItem("username");

    const role =
        localStorage.getItem("role");


    const handleLogout = () => {

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("username");
        localStorage.removeItem("user_id");
        localStorage.removeItem("role");

        navigate("/login");

    };


    return (

        <div
            style={{
                minHeight: "100vh",
                background: "#f4f6f9",
                padding: "40px"
            }}
        >

            <div
                style={{
                    maxWidth: "1000px",
                    margin: "auto"
                }}
            >

                <h1>
                    💊 PillSync Admin Dashboard
                </h1>


                <div
                    style={{
                        background: "white",
                        padding: "25px",
                        borderRadius: "10px",
                        boxShadow:
                            "0 3px 10px rgba(0,0,0,.15)"
                    }}
                >

                    <h2>
                        Welcome, {username}
                    </h2>

                    <p>
                        Role: <strong>{role}</strong>
                    </p>

                </div>


                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(2, 1fr)",
                        gap: "20px",
                        marginTop: "25px"
                    }}
                >

                    <div style={cardStyle}>
                        <h3>👥 User Management</h3>
                        <p>
                            Manage registered users.
                        </p>
                    </div>


                    <div style={cardStyle}>
                        <h3>💊 Medicine Management</h3>
                        <p>
                            Manage medicines.
                        </p>
                    </div>


                    <div style={cardStyle}>
                        <h3>⏰ Reminder Management</h3>
                        <p>
                            Manage medication reminders.
                        </p>
                    </div>


                    <div style={cardStyle}>
                        <h3>📊 Patient Management</h3>
                        <p>
                            View patient information.
                        </p>
                    </div>

                </div>


                <button
                    onClick={handleLogout}
                    style={logoutStyle}
                >
                    Logout
                </button>

            </div>

        </div>

    );

}


const cardStyle = {

    background: "white",

    padding: "25px",

    borderRadius: "10px",

    boxShadow:
        "0 3px 10px rgba(0,0,0,.15)"

};


const logoutStyle = {

    marginTop: "30px",

    padding: "12px 30px",

    background: "#d32f2f",

    color: "white",

    border: "none",

    borderRadius: "7px",

    cursor: "pointer",

    fontSize: "16px"

};


export default AdminDashboard;