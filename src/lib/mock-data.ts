export type PatientStatus = "normal" | "risk";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female";
  weight: number; // kg
  height: number; // cm
  deviceId: string;
  status: PatientStatus;
  room: string;
  lastUpdate: string;
  avatarSeed: string;
}

export interface AnomalyLog {
  id: string;
  patient_id: string;
  patient_name: string;
  hn: string;
  patient_hn?: string;
  timestamp: string; // ISO
  event_type: "Predicted Fall Risk" | "Message Not Understood";
  impact_g: number;
  gyro: number;
  risk_level: "Risk" | "Normal";
  ai_confidence: string;
}

// Deterministic PRNG so SSR and client produce identical mock data.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const patients: Patient[] = [
  { id: "p1", name: "ยายมะลิ รักสงบ", age: 79, gender: "Female", weight: 52, height: 154, deviceId: "FW-A1042", status: "normal", room: "Ward 3B - เตียง 02", lastUpdate: "3s ago", avatarSeed: "Mali" },
  { id: "p2", name: "ตาประเสริฐ โชคดี", age: 83, gender: "Male", weight: 68, height: 168, deviceId: "FW-A1043", status: "normal", room: "ห้องพิเศษ 504", lastUpdate: "1s ago", avatarSeed: "Prasert" },
  { id: "p3", name: "ยายสมศรี มีชัย", age: 76, gender: "Female", weight: 48, height: 150, deviceId: "FW-A1044", status: "normal", room: "Ward 3B - เตียง 05", lastUpdate: "4s ago", avatarSeed: "Somsri" },
  { id: "p4", name: "นายประหยัด โชคดี", age: 86, gender: "Male", weight: 70, height: 168, deviceId: "FW-A1045", status: "normal", room: "ห้องพิเศษ 201", lastUpdate: "now", avatarSeed: "Prayad" },
  { id: "p5", name: "ยายทองคำ เลิศล้ำ", age: 81, gender: "Female", weight: 55, height: 152, deviceId: "FW-A1046", status: "normal", room: "Ward 4A - เตียง 11", lastUpdate: "2s ago", avatarSeed: "Gold" },
  { id: "p6", name: "ตาบุญส่ง เก่งกล้า", age: 74, gender: "Male", weight: 72, height: 172, deviceId: "FW-A1047", status: "normal", room: "ห้องพิเศษ 102", lastUpdate: "5s ago", avatarSeed: "Boonsong" },
  { id: "p7", name: "ยายจันดี ศรีสุข", age: 85, gender: "Female", weight: 46, height: 148, deviceId: "FW-A1048", status: "normal", room: "Ward 3B - เตียง 01", lastUpdate: "10s ago", avatarSeed: "Jandee" },
  { id: "p8", name: "ตาสมชาย ใจดี", age: 77, gender: "Male", weight: 64, height: 165, deviceId: "FW-A1049", status: "normal", room: "ห้องพิเศษ 304", lastUpdate: "now", avatarSeed: "Somchai" },
];

export const getPatient = (id: string) => patients.find((p) => p.id === id);

export const bmi = (p: Patient) => +(p.weight / (p.height / 100) ** 2).toFixed(1);

const rDaily = mulberry32(101);
export const dailyRiskData = Array.from({ length: 24 }, (_, h) => ({
  label: `${h.toString().padStart(2, "0")}:00`,
  risk: Math.max(0, Math.round(Math.sin(h / 3) * 2 + rDaily() * 3 + (h > 20 || h < 6 ? 3 : 1))),
  normal: Math.round(50 + rDaily() * 15),
}));

const rWeekly = mulberry32(202);
export const weeklyRiskData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => ({
  label: d,
  risk: Math.round(4 + rWeekly() * 8 + (i > 4 ? 2 : 0)),
  normal: Math.round(180 + rWeekly() * 30),
}));

const rMonthly = mulberry32(303);
export const monthlyRiskData = Array.from({ length: 30 }, (_, i) => ({
  label: `${i + 1}`,
  risk: Math.round(3 + rMonthly() * 10),
  normal: Math.round(160 + rMonthly() * 40),
}));

const rYearly = mulberry32(404);
export const yearlyRiskData = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => ({
  label: m,
  risk: Math.round(80 + rYearly() * 50),
  normal: Math.round(4500 + rYearly() * 600),
}));

export const anomalyTypes: AnomalyLog["event_type"][] = [
  "Predicted Fall Risk",
  "Message Not Understood",
];

// Fixed reference date so SSR and client render identical timestamps.
const REF = new Date("2026-06-20T12:00:00.000Z").getTime();

// Heuristic PRNG to generate 320 realistic logs
const rLogs = mulberry32(505);
export const anomalyLogs: AnomalyLog[] = Array.from({ length: 320 }, (_, i) => {
  const p = patients[i % patients.length];
  const d = new Date(REF - i * 25 * 60 * 1000); // 25-minute intervals
  
  const typeIdx = i % anomalyTypes.length;
  const event_type = anomalyTypes[typeIdx];
  
  let impact_g = 1.0;
  let gyro = 50.0;
  let risk_level: "Risk" | "Normal" = "Normal";
  let ai_confidence = "80.0";

  const rand = rLogs();
  if (event_type === "Predicted Fall Risk") {
    impact_g = +(1.8 + rand * 1.5).toFixed(2);
    gyro = +(100 + rand * 100).toFixed(1);
    risk_level = impact_g > 2.2 ? "Risk" : "Normal";
    ai_confidence = +(85 + rand * 14).toFixed(1);
  } else { // Message Not Understood
    impact_g = 1.00;
    gyro = 0.0;
    risk_level = "Normal";
    ai_confidence = "100.0";
  }

  return {
    id: `a${i + 1}`,
    patient_id: p.id,
    patient_name: p.name,
    hn: `HN-${p.deviceId}`,
    patient_hn: `HN-${p.deviceId}`,
    timestamp: d.toISOString(),
    event_type,
    impact_g,
    gyro,
    risk_level,
    ai_confidence: ai_confidence.toString()
  };
});


export const patientAnomalies = (pid: string) =>
  anomalyLogs.filter((a) => a.patient_id === pid);

// Locale-stable date formatting (avoids SSR/client locale mismatch).
const pad = (n: number) => n.toString().padStart(2, "0");
export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};
export const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
};
export const fmtDateTime = (iso: string) => `${fmtDate(iso)} ${fmtTime(iso)}`;
