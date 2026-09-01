// Structured mock — visible in caregiver when DB empty or for demo to mam
// Fields: Patient Demographics, Diagnosis, Medication, Dosage, Frequency, Doctor, Refills
export const mockPatients = [
  {
    _id: 'mock-neha-maurya',
    Name: 'Neha Maurya',
    Age: 68,
    Gender: 'Female',
    Primary_Diagnosis: 'Hypertension + Type 2 Diabetes',
    Phone: '+91 98765 43210',
    Email: 'neha.maurya@example.com',
    linkedAt: '2026-08-12',
    Caregivers: [
      { Name: 'Rahul Maurya', relation: 'Son', linkedAt: '2026-08-12' },
    ],
    Medications: [
      { Medication_Name: 'Augmentin 1000 Duo Tablet', Dosage: '1000mg', Frequency: 'Twice daily (BD)', Prescribing_Doctor: 'Dr. A. Sharma', Refills_Remaining: 0, Composition: 'Amoxicillin 500mg + Clavulanic Acid 125mg' },
      { Medication_Name: 'Metformin 500mg', Dosage: '500mg', Frequency: 'Once daily (OD) - Morning', Prescribing_Doctor: 'Dr. S. Patel', Refills_Remaining: 4, Composition: 'Metformin Hydrochloride' },
      { Medication_Name: 'Atorvastatin 10mg', Dosage: '10mg', Frequency: 'Once daily - Night', Prescribing_Doctor: 'Dr. A. Sharma', Refills_Remaining: 1, Composition: 'Atorvastatin Calcium' },
    ],
  },
  {
    _id: 'mock-raj-kumar',
    Name: 'Raj Kumar',
    Age: 72,
    Gender: 'Male',
    Primary_Diagnosis: 'Thyroid + Heart',
    Phone: '+91 91234 56780',
    Email: 'raj.kumar@example.com',
    linkedAt: '2026-08-20',
    Caregivers: [
      { Name: 'Priya Kumar', relation: 'Daughter', linkedAt: '2026-08-20' },
    ],
    Medications: [
      { Medication_Name: 'Thyronorm 50mcg', Dosage: '50mcg', Frequency: 'Once daily - Morning empty stomach', Prescribing_Doctor: 'Dr. Mehta', Refills_Remaining: 7, Composition: 'Levothyroxine Sodium' },
      { Medication_Name: 'Clopidogrel 75mg', Dosage: '75mg', Frequency: 'Once daily', Prescribing_Doctor: 'Dr. Singh', Refills_Remaining: 2, Composition: 'Clopidogrel Bisulfate' },
    ],
  },
];

export const mockCurrentPatient = {
  Name: 'Neha Maurya',
  Age: 68,
  Gender: 'Female',
  Primary_Diagnosis: 'Hypertension + Type 2 Diabetes',
  Phone: '+91 98765 43210',
  Email: 'neha.maurya@example.com',
  linkedCaregivers: [
    { _id: 'cg1', Name: 'Rahul Maurya', relation: 'Son', linkedAt: '2026-08-12', phone: '+91 98765 11111' },
    { _id: 'cg2', Name: 'Sunita Maurya', relation: 'Daughter', linkedAt: '2026-08-18', phone: '+91 98765 22222' },
  ],
};

// Helper to convert mock to API shape for fallback when DB empty
export function toApiShape(mock) {
  return {
    _id: mock._id,
    name: mock.Name,
    age: mock.Age,
    gender: mock.Gender,
    diagnosis: mock.Primary_Diagnosis,
    phone: mock.Phone,
    email: mock.Email,
  };
}
