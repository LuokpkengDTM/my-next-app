import test from 'node:test';
import assert from 'node:assert';

const BASE_URL = 'http://localhost:8000';

test('SentinelCare Backend API Integration Tests', async (t) => {
  let token = null;

  // a. Authenticate
  await t.test('POST /token - Authentication', async () => {
    try {
      const response = await fetch(`${BASE_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: 'admin',
          password: '1234',
        }),
      });

      assert.strictEqual(response.status, 200, 'Authentication status should be 200');
      const data = await response.json();
      assert.ok(data.access_token, 'Response should contain access_token');
      token = data.access_token;
    } catch (err) {
      assert.fail(`Authentication failed: ${err.message}`);
    }
  });

  // b. Create a test patient with ID "TEST_PATIENT_99"
  await t.test('POST /api/patients - Create Test Patient', async () => {
    assert.ok(token, 'Must be authenticated');
    try {
      const response = await fetch(`${BASE_URL}/api/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: "TEST_PATIENT_99",
          name: "Test Patient 99",
          age: 45,
          gender: "Male",
          weight: 70.5,
          height: 175.0,
          hn: "HN9999",
          treatment_history: "None",
          risk_level: "Low",
          image: "",
          device_id: "OSC_DEVICE",
          room: "Room 101",
          status: "normal",
          live_message: "",
          impact_g: 0.0,
          ai_confidence: "0",
          fall_timestamp: ""
        })
      });

      assert.strictEqual(response.status, 200, 'Creation status should be 200');
      const data = await response.json();
      assert.strictEqual(data.msg, 'created in Firebase', 'Response msg should match');
    } catch (err) {
      assert.fail(`Creating patient failed: ${err.message}`);
    }
  });

  // c. Test GET /api/public/patients/TEST_PATIENT_99
  await t.test('GET /api/public/patients/TEST_PATIENT_99 - Get Patient Details', async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/public/patients/TEST_PATIENT_99`);
      assert.strictEqual(response.status, 200, 'GET status should be 200');
      const data = await response.json();
      assert.strictEqual(data.id, 'TEST_PATIENT_99');
      assert.ok('device_status' in data, 'Should contain device_status');
      assert.ok('device_svm' in data, 'Should contain device_svm');
      assert.ok('device_skin_contact' in data, 'Should contain device_skin_contact');
    } catch (err) {
      assert.fail(`Getting public patient failed: ${err.message}`);
    }
  });

  // d. Test PUT /api/public/patients/TEST_PATIENT_99/status to 'risk'
  await t.test('PUT /api/public/patients/TEST_PATIENT_99/status - Update Status to Risk', async () => {
    try {
      const updateResponse = await fetch(`${BASE_URL}/api/public/patients/TEST_PATIENT_99/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'risk',
          impact_g: 1.5,
          ai_confidence: '95.5'
        })
      });

      assert.strictEqual(updateResponse.status, 200, 'Update status should return 200');
      const updateData = await updateResponse.json();
      assert.strictEqual(updateData.msg, 'status updated');

      // Verify status is updated
      const getResponse = await fetch(`${BASE_URL}/api/public/patients/TEST_PATIENT_99`);
      assert.strictEqual(getResponse.status, 200);
      const getData = await getResponse.json();
      assert.strictEqual(getData.status, 'risk', 'Patient status should be risk');
    } catch (err) {
      assert.fail(`Updating status to risk failed: ${err.message}`);
    }
  });

  // e. Test PUT /api/public/patients/TEST_PATIENT_99/message
  await t.test('PUT /api/public/patients/TEST_PATIENT_99/message - Update Message', async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/public/patients/TEST_PATIENT_99/message`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Help is on the way'
        })
      });

      assert.strictEqual(response.status, 200, 'Update message should return 200');
      const data = await response.json();
      assert.strictEqual(data.msg, 'message updated');

      // Verify message is updated
      const getResponse = await fetch(`${BASE_URL}/api/public/patients/TEST_PATIENT_99`);
      const getData = await getResponse.json();
      assert.strictEqual(getData.live_message, 'Help is on the way', 'Patient live message should match');
    } catch (err) {
      assert.fail(`Updating message failed: ${err.message}`);
    }
  });

  // f. Test POST /api/public/patients/TEST_PATIENT_99/sos
  await t.test('POST /api/public/patients/TEST_PATIENT_99/sos - Trigger SOS', async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/public/patients/TEST_PATIENT_99/sos`, {
        method: 'POST'
      });

      assert.strictEqual(response.status, 200, 'SOS should return 200');
      const data = await response.json();
      assert.strictEqual(data.msg, 'SOS triggered');
    } catch (err) {
      assert.fail(`Triggering SOS failed: ${err.message}`);
    }
  });

  // g. Test POST /api/public/devices/OSC_DEVICE/skin-contact
  await t.test('POST /api/public/devices/OSC_DEVICE/skin-contact - Toggle/Update Skin Contact', async () => {
    try {
      // First update to false explicitly
      const response1 = await fetch(`${BASE_URL}/api/public/devices/OSC_DEVICE/skin-contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skin_contact: false
        })
      });
      assert.strictEqual(response1.status, 200);
      const data1 = await response1.json();
      assert.strictEqual(data1.skin_contact, false, 'Skin contact should be set to false');
    } catch (err) {
      assert.fail(`Skin contact update failed: ${err.message}`);
    }
  });

  // h. Delete the test patient using DELETE /api/patients/TEST_PATIENT_99
  await t.test('DELETE /api/patients/TEST_PATIENT_99 - Cleanup Patient', async () => {
    assert.ok(token, 'Must be authenticated');
    try {
      const response = await fetch(`${BASE_URL}/api/patients/TEST_PATIENT_99`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      assert.strictEqual(response.status, 200, 'DELETE status should be 200');
      const data = await response.json();
      assert.strictEqual(data.msg, 'deleted from Firebase');
    } catch (err) {
      assert.fail(`Cleanup patient failed: ${err.message}`);
    }
  });
});
