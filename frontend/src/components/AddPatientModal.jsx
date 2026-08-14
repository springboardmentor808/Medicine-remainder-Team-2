import React, { useState } from 'react';
import { X, User, Phone, MapPin, Stethoscope, HeartPulse, ShieldAlert, Check } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

const AddPatientModal = ({ isOpen, onClose, onPatientAdded }) => {
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'O+',
    mobile: '',
    address: '',
    doctorName: '',
    chronicDisease: '',
    allergies: '',
    height: '',
    weight: '',
    emergencyContact: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const chronicDiseasesList = [
    'None', 'Asthma', 'Migraine', 'Diabetes Type 2', 
    'Hypertension', 'Thyroid Disorder', 'GERD', 'Anemia', 
    'Osteoarthritis', 'Anxiety', 'Chronic Bronchitis', 'Vitamin Deficiency'
  ];

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full Name is required';
    if (!formData.age || Number(formData.age) <= 0) errs.age = 'Valid Age is required';
    if (!formData.gender) errs.gender = 'Gender is required';
    if (!formData.bloodGroup) errs.bloodGroup = 'Blood Group is required';
    if (!formData.mobile.trim()) errs.mobile = 'Mobile Number is required';
    if (!formData.address.trim()) errs.address = 'Address is required';
    if (!formData.doctorName.trim()) errs.doctorName = 'Assigned Doctor is required';
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fix all validation errors before saving.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        age: Number(formData.age),
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        mobile: formData.mobile.trim(),
        address: formData.address.trim(),
        doctorName: formData.doctorName.trim(),
        chronicDisease: formData.chronicDisease.trim() || 'None',
        allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()).filter(Boolean) : [],
        height: formData.height ? Number(formData.height) : 170,
        weight: formData.weight ? Number(formData.weight) : 65,
        emergencyContact: formData.emergencyContact.trim() || formData.mobile.trim()
      };

      const res = await api.createPatient(payload);
      
      if (res && res.success) {
        showToast('Patient added successfully.', 'success');
        onPatientAdded(res.data);
        onClose();
        // Reset form
        setFormData({
          name: '',
          age: '',
          gender: 'Male',
          bloodGroup: 'O+',
          mobile: '',
          address: '',
          doctorName: '',
          chronicDisease: '',
          allergies: '',
          height: '',
          weight: '',
          emergencyContact: ''
        });
      }
    } catch (err) {
      showToast(err.message || 'Failed to add patient', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-darkbg-850/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-500 text-white rounded-xl shadow-glow-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-base">
                Register New Patient
              </h3>
              <p className="text-xs text-slate-400">
                Enter medical and personal details to add patient profile to PillSync directory.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar space-y-5 flex-1">
          
          {/* Patient Personal Details Row */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-500 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Personal Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Aarav Sharma"
                  className={`w-full px-3.5 py-2.5 text-xs border rounded-xl dark:bg-darkbg-850 dark:text-slate-100 focus:outline-none focus:ring-1 ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-250 dark:border-slate-800 focus:ring-primary-500'}`}
                />
                {errors.name && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.name}</p>}
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="e.g. 32"
                  min="1"
                  max="120"
                  className={`w-full px-3.5 py-2.5 text-xs border rounded-xl dark:bg-darkbg-850 dark:text-slate-100 focus:outline-none focus:ring-1 ${errors.age ? 'border-red-500 focus:ring-red-500' : 'border-slate-250 dark:border-slate-800 focus:ring-primary-500'}`}
                />
                {errors.age && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.age}</p>}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-250 dark:border-slate-800 rounded-xl dark:bg-darkbg-850 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Blood Group <span className="text-red-500">*</span>
                </label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-250 dark:border-slate-800 rounded-xl dark:bg-darkbg-850 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {bloodGroups.map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="e.g. +91 9876543210"
                  className={`w-full px-3.5 py-2.5 text-xs border rounded-xl dark:bg-darkbg-850 dark:text-slate-100 focus:outline-none focus:ring-1 ${errors.mobile ? 'border-red-500 focus:ring-red-500' : 'border-slate-250 dark:border-slate-800 focus:ring-primary-500'}`}
                />
                {errors.mobile && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.mobile}</p>}
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Residential Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. Connaught Place, New Delhi"
                  className={`w-full px-3.5 py-2.5 text-xs border rounded-xl dark:bg-darkbg-850 dark:text-slate-100 focus:outline-none focus:ring-1 ${errors.address ? 'border-red-500 focus:ring-red-500' : 'border-slate-250 dark:border-slate-800 focus:ring-primary-500'}`}
                />
                {errors.address && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.address}</p>}
              </div>
            </div>
          </div>

          {/* Medical Details Section */}
          <div className="border-t border-slate-150 dark:border-slate-800 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-500 mb-3 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5" /> Medical Profile & Doctor
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Doctor Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Doctor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="doctorName"
                  value={formData.doctorName}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Alok Sen"
                  className={`w-full px-3.5 py-2.5 text-xs border rounded-xl dark:bg-darkbg-850 dark:text-slate-100 focus:outline-none focus:ring-1 ${errors.doctorName ? 'border-red-500 focus:ring-red-500' : 'border-slate-250 dark:border-slate-800 focus:ring-primary-500'}`}
                />
                {errors.doctorName && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.doctorName}</p>}
              </div>

              {/* Chronic Disease */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chronic Disease <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="chronicDisease"
                  value={formData.chronicDisease}
                  onChange={handleChange}
                  placeholder="e.g. Asthma, Hypertension, or None"
                  list="chronic-diseases-suggestions"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-250 dark:border-slate-800 rounded-xl dark:bg-darkbg-850 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <datalist id="chronic-diseases-suggestions">
                  {chronicDiseasesList.map(d => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>

              {/* Allergies */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Known Allergies <span className="text-slate-400 font-normal">(Optional, comma-separated)</span>
                </label>
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="e.g. Dust, Penicillin, Peanuts"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-250 dark:border-slate-800 rounded-xl dark:bg-darkbg-850 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Emergency Contact <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  placeholder="e.g. +91 9876543211 (Brother)"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-250 dark:border-slate-800 rounded-xl dark:bg-darkbg-850 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* Height & Weight */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Height <span className="text-slate-400 font-normal">(cm)</span>
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="170"
                    className="w-full px-3 py-2.5 text-xs border border-slate-250 dark:border-slate-800 rounded-xl dark:bg-darkbg-850 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Weight <span className="text-slate-400 font-normal">(kg)</span>
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="65"
                    className="w-full px-3 py-2.5 text-xs border border-slate-250 dark:border-slate-800 rounded-xl dark:bg-darkbg-850 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-150 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-250 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-xl shadow-glow-primary transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? 'Saving...' : (
                <>
                  <Check className="w-4 h-4" /> Save Patient
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddPatientModal;
