import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

function EditMedicine() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    medicine_name: "",
    dosage: "",
    quantity: "",
    frequency: "",
    start_date: "",
    end_date: "",
    user: 2,
  });

  useEffect(() => {
    fetchMedicine();
  }, []);

  const fetchMedicine = async () => {
    try {
      const response = await api.get(`medicines/${id}/`);
      setFormData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.put(`medicines/${id}/`, formData);
      alert("Medicine Updated Successfully!");
      navigate("/medicines");
    } catch (error) {
      console.error(error);
      alert("Error updating medicine");
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>Edit Medicine</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="medicine_name"
          value={formData.medicine_name}
          onChange={handleChange}
        /><br /><br />

        <input
          type="text"
          name="dosage"
          value={formData.dosage}
          onChange={handleChange}
        /><br /><br />

        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
        /><br /><br />

        <input
          type="text"
          name="frequency"
          value={formData.frequency}
          onChange={handleChange}
        /><br /><br />

        <input
          type="date"
          name="start_date"
          value={formData.start_date}
          onChange={handleChange}
        /><br /><br />

        <input
          type="date"
          name="end_date"
          value={formData.end_date}
          onChange={handleChange}
        /><br /><br />

        <button type="submit">Update Medicine</button>
      </form>
    </div>
  );
}

export default EditMedicine;