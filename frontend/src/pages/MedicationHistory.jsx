import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";


function MedicationHistory() {

  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // ============================================================
  // LOAD HISTORY
  // ============================================================

  useEffect(() => {

    const username = localStorage.getItem("username");

    if (!username) {

      navigate("/login");

      return;
    }

    fetchHistory();

  }, [navigate]);


  // ============================================================
  // FETCH HISTORY
  // ============================================================

  const fetchHistory = async () => {

    try {

      setLoading(true);

      setError("");

      const response = await api.get(
        "reminders/history/"
      );

      setHistory(response.data);

    } catch (error) {

      console.log(
        error.response?.data || error.message
      );

      setError(
        "Unable to load medication history."
      );

    } finally {

      setLoading(false);

    }
  };


  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (dateString) => {

    if (!dateString) {
      return "-";
    }

    return new Date(dateString).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };


  return (

    <>

      <Navbar />

      <Sidebar />


      <div
        style={{
          marginLeft: "220px",
          marginTop: "70px",
          minHeight: "100vh",
          padding: "30px",

          background:
            "linear-gradient(rgba(0,40,80,.60), rgba(0,40,80,.60)), url('/images/medical-bg.jpg')",

          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >


        {/* ====================================================
            TITLE
        ==================================================== */}

        <h1
          style={{
            color: "white",
            marginBottom: "30px",
          }}
        >
          💊 Medication History
        </h1>


        {/* ====================================================
            HISTORY CARD
        ==================================================== */}

        <div
          style={{
            background: "rgba(255,255,255,.96)",
            borderRadius: "15px",
            padding: "25px",
            boxShadow:
              "0 10px 25px rgba(0,0,0,.25)",
          }}
        >


          <h2
            style={{
              color: "#1976D2",
              marginBottom: "20px",
            }}
          >
            Medicine Records
          </h2>


          {/* LOADING */}

          {loading && (

            <p
              style={{
                textAlign: "center",
                padding: "30px",
              }}
            >
              Loading history...
            </p>

          )}


          {/* ERROR */}

          {!loading && error && (

            <p
              style={{
                textAlign: "center",
                color: "red",
                padding: "30px",
              }}
            >
              {error}
            </p>

          )}


          {/* EMPTY */}

          {!loading &&
            !error &&
            history.length === 0 && (

              <p
                style={{
                  textAlign: "center",
                  padding: "30px",
                  color: "#666",
                }}
              >
                No medication history available.
              </p>

          )}


          {/* TABLE */}

          {!loading &&
            !error &&
            history.length > 0 && (

              <div
                style={{
                  overflowX: "auto",
                }}
              >

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >

                  <thead>

                    <tr
                      style={{
                        background: "#1976D2",
                        color: "white",
                      }}
                    >

                      <th
                        style={{
                          padding: "12px",
                        }}
                      >
                        Medicine
                      </th>

                      <th
                        style={{
                          padding: "12px",
                        }}
                      >
                        Status
                      </th>

                      <th
                        style={{
                          padding: "12px",
                        }}
                      >
                        Date & Time
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {history.map((item) => (

                      <tr key={item.id}>

                        <td
                          style={{
                            padding: "12px",
                            border:
                              "1px solid #ddd",
                            fontWeight: "bold",
                          }}
                        >
                          {item.medicine_name}
                        </td>


                        <td
                          style={{
                            padding: "12px",
                            border:
                              "1px solid #ddd",
                            color:
                              item.status === "Taken"
                                ? "green"
                                : "red",
                            fontWeight: "bold",
                          }}
                        >

                          {item.status === "Taken"
                            ? "✅ Taken"
                            : `❌ ${item.status}`}

                        </td>


                        <td
                          style={{
                            padding: "12px",
                            border:
                              "1px solid #ddd",
                          }}
                        >
                          {formatDate(
                            item.taken_at
                          )}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

          )}


          {/* REFRESH BUTTON */}

          {!loading && (

            <button
              onClick={fetchHistory}
              style={{
                marginTop: "20px",
                padding: "11px 20px",
                background: "#1976D2",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              🔄 Refresh History
            </button>

          )}

        </div>

      </div>

    </>

  );

}


export default MedicationHistory;