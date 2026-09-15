import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000/api";

function Conditions() {
  const navigate = useNavigate();

  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    condition_name: "",
    description: "",
    diagnosed_date: "",
    is_active: true,
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ============================================================
  // GET CONDITIONS
  // ============================================================

  const fetchConditions = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/medicines/conditions/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.clear();
        navigate("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load conditions."
        );
      }

      setConditions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConditions();
  }, []);

  // ============================================================
  // HANDLE INPUT
  // ============================================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // ============================================================
  // ADD CONDITION
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!form.condition_name.trim()) {
      setError("Please enter a condition name.");
      return;
    }

    try {
      const token = localStorage.getItem("access");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/medicines/conditions/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      if (response.status === 401) {
        localStorage.clear();
        navigate("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            "Failed to add condition."
        );
      }

      setMessage("Condition added successfully.");

      setForm({
        condition_name: "",
        description: "",
        diagnosed_date: "",
        is_active: true,
      });

      fetchConditions();
    } catch (err) {
      setError(err.message);
    }
  };

  // ============================================================
  // DELETE CONDITION
  // ============================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this condition?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const token = localStorage.getItem("access");

      const response = await fetch(
        `${API_URL}/medicines/conditions/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.clear();
        navigate("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete condition."
        );
      }

      setMessage("Condition deleted successfully.");

      fetchConditions();
    } catch (err) {
      setError(err.message);
    }
  };

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div
      style={{
        marginLeft: "270px",
        padding: "30px",
        minHeight: "100vh",
        background: "#f5f7fb",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "30px",
              }}
            >
              Health Conditions
            </h1>

            <p
              style={{
                color: "#666",
                marginTop: "8px",
              }}
            >
              Manage your medical conditions and health history.
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "10px 18px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            ← Dashboard
          </button>
        </div>

        {/* SUCCESS MESSAGE */}

        {message && (
          <div
            style={{
              background: "#e8f7ed",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            {message}
          </div>
        )}

        {/* ERROR MESSAGE */}

        {error && (
          <div
            style={{
              background: "#fdecec",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              color: "#b00020",
            }}
          >
            {error}
          </div>
        )}

        {/* ADD CONDITION */}

        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            marginBottom: "25px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          <h2>Add Health Condition</h2>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
              }}
            >
              {/* CONDITION NAME */}

              <div>
                <label>Condition Name</label>

                <input
                  type="text"
                  name="condition_name"
                  value={form.condition_name}
                  onChange={handleChange}
                  placeholder="e.g. Diabetes"
                  style={{
                    width: "100%",
                    padding: "11px",
                    marginTop: "6px",
                    border: "1px solid #ddd",
                    borderRadius: "7px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* DIAGNOSED DATE */}

              <div>
                <label>Diagnosed Date</label>

                <input
                  type="date"
                  name="diagnosed_date"
                  value={form.diagnosed_date}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "11px",
                    marginTop: "6px",
                    border: "1px solid #ddd",
                    borderRadius: "7px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* DESCRIPTION */}

            <div style={{ marginTop: "18px" }}>
              <label>Description</label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter additional information..."
                rows="4"
                style={{
                  width: "100%",
                  padding: "11px",
                  marginTop: "6px",
                  border: "1px solid #ddd",
                  borderRadius: "7px",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            {/* ACTIVE */}

            <div
              style={{
                marginTop: "18px",
              }}
            >
              <label>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />

                {" "}Active Condition
              </label>
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              style={{
                marginTop: "20px",
                padding: "12px 22px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Add Condition
            </button>
          </form>
        </div>

        {/* CONDITIONS LIST */}

        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          <h2>Your Health Conditions</h2>

          {loading ? (
            <p>Loading conditions...</p>
          ) : conditions.length === 0 ? (
            <p
              style={{
                color: "#777",
              }}
            >
              No health conditions added yet.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "15px",
              }}
            >
              {conditions.map((condition) => (
                <div
                  key={condition.id}
                  style={{
                    border: "1px solid #e2e2e2",
                    borderRadius: "10px",
                    padding: "18px",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "20px",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: "0 0 8px",
                      }}
                    >
                      {condition.condition_name}
                    </h3>

                    {condition.description && (
                      <p
                        style={{
                          margin: "5px 0",
                          color: "#666",
                        }}
                      >
                        {condition.description}
                      </p>
                    )}

                    {condition.diagnosed_date && (
                      <p
                        style={{
                          margin: "5px 0",
                          color: "#666",
                        }}
                      >
                        Diagnosed:{" "}
                        {condition.diagnosed_date}
                      </p>
                    )}

                    <span>
                      Status:{" "}
                      {condition.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      handleDelete(condition.id)
                    }
                    style={{
                      padding: "9px 14px",
                      border: "none",
                      borderRadius: "7px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Conditions;