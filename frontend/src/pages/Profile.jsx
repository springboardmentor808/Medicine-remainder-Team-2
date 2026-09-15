import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";


function Profile() {

  const navigate = useNavigate();


  const [profile, setProfile] = useState({

    username: "",
    email: "",
    role: "",
    phone: "",
    date_of_birth: "",
    address: "",

  });


  const [loading, setLoading] = useState(true);

  const [updating, setUpdating] = useState(false);


  // ============================================================
  // FETCH PROFILE
  // ============================================================

  useEffect(() => {

    fetchProfile();

  }, []);


  const fetchProfile = async () => {

    try {

      const response = await api.get(
        "accounts/profile/"
      );

      setProfile({

        username: response.data?.username || "",

        email: response.data?.email || "",

        role: response.data?.role || "",

        phone: response.data?.phone || "",

        date_of_birth:
          response.data?.date_of_birth || "",

        address:
          response.data?.address || "",

      });

    }
    catch (error) {

      console.log(
        "Profile fetch error:",
        error.response?.data ||
        error.message
      );


      if (
        error.response?.status === 401
      ) {

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        navigate("/login");

      }

    }
    finally {

      setLoading(false);

    }

  };


  // ============================================================
  // HANDLE INPUT CHANGE
  // ============================================================

  const handleChange = (e) => {

    const {
      name,
      value
    } = e.target;


    setProfile({

      ...profile,

      [name]: value,

    });

  };


  // ============================================================
  // UPDATE PROFILE
  // ============================================================

  const updateProfile = async () => {

    try {

      setUpdating(true);


      const updateData = {

        email:
          profile.email.trim(),

        phone:
          profile.phone.trim(),

        date_of_birth:
          profile.date_of_birth || "",

        address:
          profile.address.trim(),

      };


      const response = await api.put(

        "accounts/profile/",

        updateData

      );


      setProfile({

        username:
          response.data?.username ||
          profile.username,

        email:
          response.data?.email ||
          "",

        role:
          response.data?.role ||
          profile.role,

        phone:
          response.data?.phone ||
          "",

        date_of_birth:
          response.data?.date_of_birth ||
          "",

        address:
          response.data?.address ||
          "",

      });


      alert(
        "Profile Updated Successfully"
      );

    }
    catch (error) {

      console.log(
        "Profile Update Error:",
        error.response?.data ||
        error.message
      );


      if (
        error.response?.status === 400
      ) {

        alert(

          error.response?.data?.error ||

          error.response?.data?.message ||

          "Invalid profile information."

        );

      }


      else if (
        error.response?.status === 401
      ) {

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        alert(
          "Your session has expired. Please login again."
        );

        navigate("/login");

      }


      else {

        alert(
          "Profile update failed. Please try again."
        );

      }

    }
    finally {

      setUpdating(false);

    }

  };


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (

      <>

        <Navbar />

        <Sidebar />

        <div
          style={{
            marginLeft: "220px",
            marginTop: "70px",
            padding: "30px",
          }}
        >

          <h2>
            Loading Profile...
          </h2>

        </div>

      </>

    );

  }


  // ============================================================
  // PAGE
  // ============================================================

  return (

    <>

      <Navbar />

      <Sidebar />


      <div
        style={{
          marginLeft: "220px",
          marginTop: "70px",
          padding: "30px",
          minHeight: "100vh",
          background: "#f4f6f9",
        }}
      >


        <div
          style={{
            width: "450px",
            maxWidth: "100%",
            margin: "auto",
            background: "white",
            padding: "30px",
            borderRadius: "10px",
            boxShadow:
              "0 3px 10px rgba(0,0,0,.2)",
          }}
        >


          <h2>
            User Profile
          </h2>


          {/* USERNAME */}

          <label>
            Username
          </label>

          <input
            value={profile.username}
            disabled
            style={inputStyle}
          />


          {/* EMAIL */}

          <label>
            Email
          </label>

          <input
            type="email"
            name="email"
            value={profile.email}
            onChange={handleChange}
            style={inputStyle}
          />


          {/* ROLE */}

          <label>
            Role
          </label>

          <input
            value={profile.role}
            disabled
            style={inputStyle}
          />


          {/* PHONE */}

          <label>
            Phone
          </label>

          <input
            type="tel"
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Enter phone number"
          />


          {/* DATE OF BIRTH */}

          <label>
            Date of Birth
          </label>

          <input
            type="date"
            name="date_of_birth"
            value={
              profile.date_of_birth || ""
            }
            onChange={handleChange}
            style={inputStyle}
          />


          {/* ADDRESS */}

          <label>
            Address
          </label>

          <textarea
            name="address"
            value={profile.address}
            onChange={handleChange}
            style={{
              ...inputStyle,
              minHeight: "100px",
              resize: "vertical",
            }}
            placeholder="Enter your address"
          />


          {/* UPDATE */}

          <button
            onClick={updateProfile}
            disabled={updating}
            style={{
              ...buttonStyle,

              opacity:
                updating ? 0.7 : 1,

              cursor:
                updating
                  ? "not-allowed"
                  : "pointer",
            }}
          >

            {updating
              ? "Updating..."
              : "Update Profile"}

          </button>


        </div>

      </div>

    </>

  );

}


// ============================================================
// INPUT STYLE
// ============================================================

const inputStyle = {

  width: "100%",

  padding: "10px",

  marginBottom: "15px",

  border: "1px solid #ccc",

  borderRadius: "5px",

  boxSizing: "border-box",

};


// ============================================================
// BUTTON STYLE
// ============================================================

const buttonStyle = {

  width: "100%",

  padding: "12px",

  background: "#1976D2",

  color: "white",

  border: "none",

  borderRadius: "5px",

  cursor: "pointer",

};


export default Profile;