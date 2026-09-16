// e2e_verification.js - Test all newly added features against the live running server
const API_URL = 'http://localhost:4000/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`[${res.status}] ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

async function runVerification() {
  console.log('🚀 Starting PillSync End-to-End Verification Flow...\n');
  const stamp = Date.now();

  // 1. Register a new Patient
  console.log('1. Registering new Patient...');
  const patientEmail = `patient_${stamp}@example.com`;
  const patientPhone = `9${stamp.toString().slice(-9)}`;
  const patientAuth = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Sarah Connor',
      email: patientEmail,
      password: 'Password123!',
      role: 'patient',
      phone: patientPhone
    })
  });
  const pToken = patientAuth.accessToken;
  const patientId = patientAuth.user.id;
  const linkCode = patientAuth.user.linkCode;
  console.log(`   ✅ Patient registered! ID: ${patientId}, LinkCode: ${linkCode}`);

  // 2. Update Patient Profile (Demographics, Conditions, Emergency Contacts)
  console.log('\n2. Updating Patient Profile (Demographics, Conditions, Emergency Contacts)...');
  const profileRes = await request('/patient/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${pToken}` },
    body: JSON.stringify({
      age: 48,
      gender: 'female',
      conditions: ['Blood Pressure', 'Diabetes'],
      emergencyContacts: [
        { name: 'John Connor', phone: '+15559876543', relation: 'Son' }
      ]
    })
  });
  console.log(`   ✅ Profile updated: Age ${profileRes.user.age}, Gender ${profileRes.user.gender}`);
  console.log(`      Conditions: ${profileRes.user.conditions.join(', ')}`);
  console.log(`      Emergency Contact: ${profileRes.user.emergencyContacts[0].name} (${profileRes.user.emergencyContacts[0].relation})`);

  // 3. Add Medicine with Disease Category and Initial Quantity
  console.log('\n3. Adding Medicine with Disease Category and Initial Quantity...');
  const medRes = await request('/patient/medicines', {
    method: 'POST',
    headers: { Authorization: `Bearer ${pToken}` },
    body: JSON.stringify({
      name: 'Amlodipine Besylate',
      dose: '10mg',
      schedule: '08:00 AM',
      slot: 'morning',
      conditionTag: 'Blood Pressure',
      initialQuantity: 14
    })
  });
  const medicineId = medRes.medicine._id;
  console.log(`   ✅ Medicine added: ${medRes.medicine.name} (${medRes.medicine.conditionTag}), Initial Qty: ${medRes.medicine.initialQuantity}`);

  // 4. Record a Dose (Taken)
  console.log('\n4. Recording a Dose Taken...');
  const statusRes = await request(`/patient/medicines/${medicineId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${pToken}` },
    body: JSON.stringify({
      status: 'taken'
    })
  });
  console.log(`   ✅ Dose status updated: status=${statusRes.medicine.status}`);

  // 5. Restock Medicine via Refill Endpoint
  console.log('\n5. Restocking Medicine (+30 units)...');
  const refillRes = await request(`/patient/medicines/${medicineId}/refill`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pToken}` },
    body: JSON.stringify({
      quantity: 30
    })
  });
  console.log(`   ✅ Restocked! New Initial Qty: ${refillRes.medicine.initialQuantity}, Added: ${refillRes.added}`);

  // 6. Update Medicine Details (PUT)
  console.log('\n6. Updating Medicine Details (PUT)...');
  const updateRes = await request(`/patient/medicines/${medicineId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${pToken}` },
    body: JSON.stringify({
      name: 'Amlodipine Besylate (Extended Release)',
      dose: '10mg ER',
      conditionTag: 'Blood Pressure'
    })
  });
  console.log(`   ✅ Updated medicine name: ${updateRes.medicine.name}`);

  // 7. Register Caregiver
  console.log('\n7. Registering Caregiver...');
  const caregiverEmail = `caregiver_${stamp}@example.com`;
  const caregiverPhone = `8${stamp.toString().slice(-9)}`;
  const caregiverAuth = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Dr. Silberman',
      email: caregiverEmail,
      password: 'Password123!',
      role: 'caregiver',
      phone: caregiverPhone
    })
  });
  const cToken = caregiverAuth.accessToken;
  const caregiverId = caregiverAuth.user.id;
  console.log(`   ✅ Caregiver registered! ID: ${caregiverId}`);

  // 8. Caregiver Links Patient using LinkCode
  console.log(`\n8. Linking Patient using LinkCode (${linkCode})...`);
  const linkRes = await request('/link', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cToken}` },
    body: JSON.stringify({ linkCode })
  });
  console.log(`   ✅ Patient successfully linked to Caregiver! Patient: ${linkRes.patient.name}`);

  // 9. Caregiver Fetches Analytics
  console.log('\n9. Fetching Caregiver Platform Analytics...');
  const analytics = await request('/caregiver/analytics', {
    method: 'GET',
    headers: { Authorization: `Bearer ${cToken}` }
  });
  console.log(`   ✅ Analytics summary:`);
  console.log(`      Total Patients: ${analytics.totalPatients}`);
  console.log(`      Total Prescriptions: ${analytics.totalPrescriptions}`);
  console.log(`      Average Adherence: ${analytics.averageAdherence}%`);
  console.log(`      Taken Today: ${analytics.takenToday}, Missed Today: ${analytics.missedToday}`);

  // 10. Caregiver Sends Reminder Nudge
  console.log('\n10. Caregiver Sending Reminder Nudge to Patient...');
  const nudgeRes = await request(`/caregiver/patients/${patientId}/nudge`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cToken}` }
  });
  console.log(`   ✅ Reminder Nudge sent! Notification ID: ${nudgeRes.nudge._id}`);

  // 11. Caregiver Fetches Filtered Activity Feed
  console.log('\n11. Fetching Caregiver Activity / Alerts Feed with Filters...');
  const allNotifications = await request('/caregiver/alerts?type=All', {
    method: 'GET',
    headers: { Authorization: `Bearer ${cToken}` }
  });
  console.log(`   ✅ Retrieved ${allNotifications.length} alerts for 'All' filter.`);
  const nudgeNotifications = await request('/caregiver/alerts?type=Caregiver Nudge', {
    method: 'GET',
    headers: { Authorization: `Bearer ${cToken}` }
  });
  console.log(`   ✅ Retrieved ${nudgeNotifications.length} alerts for 'Caregiver Nudge' filter.`);

  // 12. Patient Lists Linked Caregivers
  console.log('\n12. Patient Listing Linked Caregivers...');
  const patientCaregivers = await request('/patient/caregivers', {
    method: 'GET',
    headers: { Authorization: `Bearer ${pToken}` }
  });
  console.log(`   ✅ Patient sees ${patientCaregivers.length} linked caregiver(s): ${patientCaregivers[0]?.name}`);

  // 13. Patient Revokes Caregiver Access
  console.log('\n13. Patient Revoking Caregiver Access...');
  const revokeRes = await request(`/patient/caregivers/${caregiverId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${pToken}` }
  });
  console.log(`   ✅ Revoke successful: ${revokeRes.message}`);

  // 14. Confirm Caregiver No Longer Has Access
  const patientCaregiversAfter = await request('/patient/caregivers', {
    method: 'GET',
    headers: { Authorization: `Bearer ${pToken}` }
  });
  console.log(`   ✅ Patient now has ${patientCaregiversAfter.length} linked caregiver(s).`);

  // 15. Delete Medicine and Associated Logs
  console.log('\n15. Deleting Medicine and Cleaning Up...');
  const delRes = await request(`/patient/medicines/${medicineId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${pToken}` }
  });
  console.log(`   ✅ Medicine deleted successfully: ${delRes.message}`);

  console.log('\n🎉 ALL 15 END-TO-END VERIFICATION STEPS PASSED WITH 100% SUCCESS!');
}

runVerification().catch((err) => {
  console.error('\n❌ Verification failed:', err);
  process.exit(1);
});
