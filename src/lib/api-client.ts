// API Client for SentinelCare - connects frontend to FastAPI backend
import { 
  patients as mockPatients, 
  anomalyLogs as mockAnomalyLogs,
  dailyRiskData,
  weeklyRiskData,
  monthlyRiskData,
  yearlyRiskData
} from "./mock-data";

const API_URL = import.meta.env.VITE_PUBLIC_API_URL || "http://localhost:8000";

// Helper for local state in Guest Mode
const getGuestData = () => {
  if (typeof window === "undefined") return { patients: mockPatients, anomalies: mockAnomalyLogs };
  
  let localP = localStorage.getItem("guest-patients");
  let localA = localStorage.getItem("guest-anomalies");
  
  if (!localP) {
    localStorage.setItem("guest-patients", JSON.stringify(mockPatients));
    localP = JSON.stringify(mockPatients);
  }
  if (!localA) {
    localStorage.setItem("guest-anomalies", JSON.stringify(mockAnomalyLogs));
    localA = JSON.stringify(mockAnomalyLogs);
  }
  
  return {
    patients: JSON.parse(localP),
    anomalies: JSON.parse(localA)
  };
};

const saveGuestPatients = (pList: any[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("guest-patients", JSON.stringify(pList));
  }
};

const saveGuestAnomalies = (aList: any[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("guest-anomalies", JSON.stringify(aList));
  }
};

let fallTimerStarted = false;
const startFallTimer = () => {
  if (fallTimerStarted || typeof window === "undefined") return;
  fallTimerStarted = true;
  
  setTimeout(() => {
    const { patients: curP, anomalies: curA } = getGuestData();
    const targetIdx = curP.findIndex((p: any) => p.id === "p4");
    if (targetIdx !== -1 && curP[targetIdx].status !== "risk") {
      // Set status to risk
      curP[targetIdx].status = "risk";
      curP[targetIdx].lastUpdate = "now";
      saveGuestPatients(curP);
      
      // Create anomaly log
      const newAnomaly = {
        id: `a_simulated_${Date.now()}`,
        patientId: "p4",
        patientName: "นายประหยัด โชคดี",
        date: new Date().toISOString(),
        type: "Predicted Fall Risk" as const,
        accel: 2.85,
        gyro: 145.2,
        severity: "high" as const
      };
      
      curA.unshift(newAnomaly);
      saveGuestAnomalies(curA);
      
      // Dispatch custom event for telemetry status updates
      console.log("⚠️ SIMULATED FALL EVENT TRIGGERED FOR P4!");
      window.dispatchEvent(new Event("guest-fall-triggered"));
    }
  }, 10000); // 10 seconds
};


export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export const getUsername = (): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("username") || "Caregiver";
  }
  return "Caregiver";
};

export const setToken = (token: string, username: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
  }
};

export const clearToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
  }
};

export const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("ngrok-skip-browser-warning", "true");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }

  return response;
};

// API Functions
export const api = {
  login: async (username: string, password: string) => {
    if (username === "demo" || username === "Guest Caregiver") {
      setToken("guest-demo-token", "Guest Caregiver");
      return { access_token: "guest-demo-token" };
    }
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const res = await fetch(`${API_URL}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (!res.ok) {
      let errMsg = "Invalid username or password";
      try {
        const errData = await res.json();
        if (errData && errData.detail) {
          errMsg = errData.detail;
        }
      } catch (e) {}
      throw new Error(errMsg);
    }

    const data = await res.json();
    setToken(data.access_token, username);
    return data;
  },

  getPatients: async () => {
    if (getToken() === "guest-demo-token") {
      startFallTimer();
      const { patients } = getGuestData();
      return patients;
    }
    const res = await authFetch("/api/patients");
    if (!res.ok) throw new Error("Failed to fetch patients");
    return res.json();
  },

  createPatient: async (patient: any) => {
    if (getToken() === "guest-demo-token") {
      const { patients } = getGuestData();
      const newP = {
        id: `p_${Date.now()}`,
        name: patient.name,
        age: Number(patient.age) || 75,
        gender: patient.gender || "Male",
        weight: Number(patient.weight) || 60,
        height: Number(patient.height) || 165,
        deviceId: patient.device_id || "",
        status: "normal" as const,
        room: patient.room || "Room 01A",
        lastUpdate: "now",
        avatarSeed: patient.name
      };
      patients.push(newP);
      saveGuestPatients(patients);
      return newP;
    }
    const res = await authFetch("/api/patients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patient),
    });
    if (!res.ok) throw new Error("Failed to create patient");
    return res.json();
  },

  updatePatient: async (id: string, patient: any) => {
    if (getToken() === "guest-demo-token") {
      const { patients } = getGuestData();
      const idx = patients.findIndex((p: any) => p.id === id);
      if (idx !== -1) {
        patients[idx] = { ...patients[idx], ...patient, deviceId: patient.device_id || patients[idx].deviceId };
        saveGuestPatients(patients);
        return patients[idx];
      }
      throw new Error("Patient not found");
    }
    const res = await authFetch(`/api/patients/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patient),
    });
    if (!res.ok) throw new Error("Failed to update patient");
    return res.json();
  },

  deletePatient: async (id: string) => {
    if (getToken() === "guest-demo-token") {
      const { patients } = getGuestData();
      const filtered = patients.filter((p: any) => p.id !== id);
      saveGuestPatients(filtered);
      return { status: "success" };
    }
    const res = await authFetch(`/api/patients/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete patient");
    return res.json();
  },

  getSensorData: async () => {
    if (getToken() === "guest-demo-token") {
      const { patients } = getGuestData();
      const data: Record<string, any> = {};
      patients.forEach((p: any) => {
        if (p.deviceId) {
          const hr = Math.round(72 + Math.sin(Date.now() / 5000) * 8 + (p.status === "risk" ? 25 : 0));
          data[p.deviceId] = {
            device_id: p.deviceId,
            status: "Connected",
            risk_label: p.status === "risk" ? "Risk" : "Normal",
            heart_rate: hr,
            skin_contact: true,
            accel_x: +(Math.sin(Date.now() / 1000) * 0.2 + (p.status === "risk" ? 2.5 : 0)).toFixed(2),
            accel_y: +(Math.cos(Date.now() / 1200) * 0.15 + (p.status === "risk" ? -1.8 : 0.9)).toFixed(2),
            accel_z: +(Math.sin(Date.now() / 1500) * 0.1 + (p.status === "risk" ? 1.2 : -0.2)).toFixed(2),
            timestamp: new Date().toISOString()
          };
        }
      });
      return data;
    }
    const res = await authFetch("/api/data");
    if (!res.ok) throw new Error("Failed to fetch sensor data");
    return res.json();
  },

  getAnomalies: async () => {
    if (getToken() === "guest-demo-token") {
      const { anomalies } = getGuestData();
      return anomalies;
    }
    const res = await authFetch("/api/anomalies");
    if (!res.ok) throw new Error("Failed to fetch anomalies");
    return res.json();
  },

  getRiskTrends: async () => {
    if (getToken() === "guest-demo-token") {
      return {
        daily: dailyRiskData,
        weekly: weeklyRiskData,
        monthly: monthlyRiskData,
        yearly: yearlyRiskData
      };
    }
    const res = await authFetch("/api/risk_trends");
    if (!res.ok) throw new Error("Failed to fetch risk trends");
    return res.json();
  },

  getProfile: async () => {
    if (getToken() === "guest-demo-token") {
      return {
        email: "demo-caregiver@fallguard.ai",
        phone: "081-234-5678"
      };
    }
    const res = await authFetch("/api/admin/profile");
    if (!res.ok) throw new Error("Failed to fetch admin profile");
    return res.json();
  },

  updateProfile: async (profile: { email: string; phone: string }) => {
    if (getToken() === "guest-demo-token") {
      return profile;
    }
    const res = await authFetch("/api/admin/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error("Failed to update profile");
    return res.json();
  },

  sendPatientMessage: async (id: string, message: string) => {
    if (getToken() === "guest-demo-token") {
      return { status: "success" };
    }
    const res = await authFetch(`/api/patients/${id}/message`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error("Failed to send patient message");
    return res.json();
  },

  updatePatientStatus: async (id: string, status: string, impact: number = 0.0, confidence: string = "0") => {
    if (getToken() === "guest-demo-token") {
      const { patients } = getGuestData();
      const idx = patients.findIndex((p: any) => p.id === id);
      if (idx !== -1) {
        patients[idx].status = status;
        patients[idx].lastUpdate = "now";
        saveGuestPatients(patients);
        return patients[idx];
      }
      throw new Error("Patient not found");
    }
    const res = await authFetch(`/api/patients/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status, impact_g: impact, ai_confidence: confidence }),
    });
    if (!res.ok) throw new Error("Failed to update patient status");
    return res.json();
  },

  triggerSOS: async (id: string) => {
    if (getToken() === "guest-demo-token") {
      const { patients, anomalies } = getGuestData();
      const idx = patients.findIndex((p: any) => p.id === id);
      if (idx !== -1) {
        patients[idx].status = "risk";
        patients[idx].lastUpdate = "now";
        saveGuestPatients(patients);

        const log = {
          id: `a_sos_${Date.now()}`,
          patientId: id,
          patientName: patients[idx].name,
          date: new Date().toISOString(),
          type: "Predicted Fall Risk" as const,
          accel: 3.12,
          gyro: 189.5,
          severity: "high" as const
        };
        anomalies.unshift(log);
        saveGuestAnomalies(anomalies);
        return patients[idx];
      }
      throw new Error("Patient not found");
    }
    const res = await authFetch(`/api/patients/${id}/sos`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to trigger SOS");
    return res.json();
  },

  getPublicPatient: async (id: string) => {
    const res = await fetch(`${API_URL}/api/public/patients/${id}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      }
    });
    if (!res.ok) throw new Error("Failed to fetch public patient info");
    return res.json();
  },

  updatePublicPatientStatus: async (id: string, status: string, impact: number = 0.0, confidence: string = "0") => {
    const res = await fetch(`${API_URL}/api/public/patients/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ status, impact_g: impact, ai_confidence: confidence }),
    });
    if (!res.ok) throw new Error("Failed to update status");
    return res.json();
  },

  sendPublicPatientMessage: async (id: string, message: string) => {
    const res = await fetch(`${API_URL}/api/public/patients/${id}/message`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error("Failed to clear message");
    return res.json();
  },

  triggerPublicSOS: async (id: string) => {
    const res = await fetch(`${API_URL}/api/public/patients/${id}/sos`, {
      method: "POST",
      headers: {
        "ngrok-skip-browser-warning": "true",
      }
    });
    if (!res.ok) throw new Error("Failed to trigger SOS");
    return res.json();
  },

  getServerIP: async () => {
    const res = await fetch(`${API_URL}/api/public/server-ip`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      }
    });
    if (!res.ok) throw new Error("Failed to fetch server IP");
    return res.json();
  },

  getPublicPatientLogs: async (id: string) => {
    const res = await fetch(`${API_URL}/api/public/patients/${id}/logs`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      }
    });
    if (!res.ok) throw new Error("Failed to fetch patient logs");
    return res.json();
  },

  toggleSkinContact: async (deviceId: string, contact?: boolean) => {
    const res = await fetch(`${API_URL}/api/public/devices/${deviceId}/skin-contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ skin_contact: contact }),
    });
    if (!res.ok) throw new Error("Failed to toggle skin contact");
    return res.json();
  },

  connectPatientWS: (id: string, onMessage: (data: any) => void) => {
    if (getToken() === "guest-demo-token") {
      console.log("🔌 Connecting MOCK WebSocket for patient:", id);
      let active = true;
      const interval = setInterval(() => {
        if (!active) return;
        const { patients } = getGuestData();
        const p = patients.find((p: any) => p.id === id);
        const isRisk = p?.status === "risk";
        
        const time = Date.now();
        const heart_rate = Math.round(72 + Math.sin(time / 4000) * 5 + (isRisk ? 28 : 0));
        const accel_x = +(Math.sin(time / 800) * 0.15 + (isRisk ? 2.4 * Math.sin(time / 100) : 0)).toFixed(2);
        const accel_y = +(Math.cos(time / 900) * 0.1 + (isRisk ? -1.5 * Math.cos(time / 100) : 0.8)).toFixed(2);
        const accel_z = +(Math.sin(time / 1100) * 0.08 + (isRisk ? 1.1 * Math.sin(time / 100) : -0.25)).toFixed(2);
        
        onMessage({
          device_id: p?.deviceId || "MOCK-DEV",
          status: "Connected",
          heart_rate,
          skin_contact: true,
          accel_x,
          accel_y,
          accel_z,
          timestamp: new Date().toISOString(),
          risk_label: isRisk ? "Risk" : "Normal"
        });
      }, 100);

      return {
        close: () => {
          console.log("🔌 Closing MOCK WebSocket for patient:", id);
          active = false;
          clearInterval(interval);
        }
      } as any;
    }

    let wsBase = API_URL.replace(/^http/, "ws");
    if (!API_URL.startsWith("http")) {
      if (typeof window !== "undefined") {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host;
        wsBase = `${protocol}//${host}`;
      } else {
        wsBase = "ws://localhost:8000";
      }
    }
    
    const wsUrl = `${wsBase}/api/public/patients/${id}/ws`;
    console.log("🔌 Connecting WebSocket to:", wsUrl);
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error("Failed to parse WS message", err);
      }
    };
    
    ws.onerror = (err) => {
      console.error("WebSocket connection error:", err);
    };
    
    return ws;
  },
};
