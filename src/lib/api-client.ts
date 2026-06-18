// API Client for SentinelCare - connects frontend to FastAPI backend

const API_URL = import.meta.env.VITE_PUBLIC_API_URL || "http://localhost:8000";

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
    const res = await authFetch("/api/patients");
    if (!res.ok) throw new Error("Failed to fetch patients");
    return res.json();
  },

  createPatient: async (patient: any) => {
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
    const res = await authFetch(`/api/patients/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete patient");
    return res.json();
  },

  getSensorData: async () => {
    const res = await authFetch("/api/data");
    if (!res.ok) throw new Error("Failed to fetch sensor data");
    return res.json();
  },

  getAnomalies: async () => {
    const res = await authFetch("/api/anomalies");
    if (!res.ok) throw new Error("Failed to fetch anomalies");
    return res.json();
  },

  getRiskTrends: async () => {
    const res = await authFetch("/api/risk_trends");
    if (!res.ok) throw new Error("Failed to fetch risk trends");
    return res.json();
  },

  getProfile: async () => {
    const res = await authFetch("/api/admin/profile");
    if (!res.ok) throw new Error("Failed to fetch admin profile");
    return res.json();
  },

  updateProfile: async (profile: { email: string; phone: string }) => {
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
    // Convert http:// or https:// to ws:// or wss://
    let wsBase = API_URL.replace(/^http/, "ws");
    
    // If API_URL is relative or doesn't have protocol, fallback to window.location
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
