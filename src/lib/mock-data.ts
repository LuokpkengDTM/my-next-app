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
  patientId: string;
  patientName: string;
  date: string; // ISO
  type: "Predicted Fall Risk" | "Sudden Motion" | "Inactivity Alert" | "Gait Anomaly";
  accel: number;
  gyro: number;
  severity: "high" | "medium" | "low";
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
  { id: "p1", name: "มาร์กาเร็ต เฉิน", age: 78, gender: "Female", weight: 62, height: 160, deviceId: "FW-A1042", status: "risk", room: "Room 12B", lastUpdate: "2s ago", avatarSeed: "Margaret" },
  { id: "p2", name: "โรเบิร์ต เฮย์ส", age: 82, gender: "Male", weight: 75, height: 172, deviceId: "FW-A1043", status: "normal", room: "Room 09A", lastUpdate: "1s ago", avatarSeed: "Robert" },
  { id: "p3", name: "เอเลนอร์ พาร์ค", age: 74, gender: "Female", weight: 58, height: 158, deviceId: "FW-A1044", status: "normal", room: "Room 14C", lastUpdate: "4s ago", avatarSeed: "Eleanor" },
  { id: "p4", name: "เจมส์ วิทแมน", age: 86, gender: "Male", weight: 70, height: 168, deviceId: "FW-A1045", status: "risk", room: "Room 03A", lastUpdate: "now", avatarSeed: "James" },
  { id: "p5", name: "โดโรธี ลิน", age: 79, gender: "Female", weight: 55, height: 155, deviceId: "FW-A1046", status: "normal", room: "Room 22B", lastUpdate: "3s ago", avatarSeed: "Dorothy" },
  { id: "p6", name: "เฮนรี่ อัลวาเรซ", age: 71, gender: "Male", weight: 80, height: 175, deviceId: "FW-A1047", status: "normal", room: "Room 18A", lastUpdate: "2s ago", avatarSeed: "Henry" },
  { id: "p7", name: "บีทริซ โอเคงโคว", age: 83, gender: "Female", weight: 60, height: 162, deviceId: "FW-A1048", status: "normal", room: "Room 07B", lastUpdate: "5s ago", avatarSeed: "Beatrice" },
  { id: "p8", name: "วอลเตอร์ ชมิดท์", age: 88, gender: "Male", weight: 68, height: 170, deviceId: "FW-A1049", status: "normal", room: "Room 11C", lastUpdate: "1s ago", avatarSeed: "Walter" },
  { id: "p9", name: "สมศักดิ์ รักสงบ", age: 72, gender: "Male", weight: 70, height: 168, deviceId: "", status: "normal", room: "Room 15D", lastUpdate: "never", avatarSeed: "William" },
  { id: "p10", name: "วิภาดา ยิ้มแย้ม", age: 80, gender: "Female", weight: 55, height: 155, deviceId: "", status: "normal", room: "Room 02C", lastUpdate: "never", avatarSeed: "Patricia" },
  { id: "p11", name: "อนันต์ ทรงเดช", age: 76, gender: "Male", weight: 78, height: 172, deviceId: "", status: "normal", room: "Room 19B", lastUpdate: "never", avatarSeed: "Thomas" },
  { id: "p12", name: "พัชรา แก้วดี", age: 84, gender: "Female", weight: 50, height: 150, deviceId: "", status: "normal", room: "Room 05E", lastUpdate: "never", avatarSeed: "Nancy" },
  { id: "p13", name: "ธานินทร์ รุ่งเรือง", age: 81, gender: "Male", weight: 73, height: 170, deviceId: "", status: "normal", room: "Room 21A", lastUpdate: "never", avatarSeed: "Donald" },
  { id: "p14", name: "กมลวรรณ ชัยชนะ", age: 75, gender: "Female", weight: 63, height: 161, deviceId: "", status: "normal", room: "Room 08D", lastUpdate: "never", avatarSeed: "Sarah" },
];

export const getPatient = (id: string) => patients.find((p) => p.id === id);

export const bmi = (p: Patient) => +(p.weight / (p.height / 100) ** 2).toFixed(1);

const rDaily = mulberry32(101);
export const dailyRiskData = Array.from({ length: 24 }, (_, h) => ({
  label: `${h.toString().padStart(2, "0")}:00`,
  risk: Math.max(0, Math.round(Math.sin(h / 3) * 4 + rDaily() * 5 + (h > 20 || h < 6 ? 5 : 2))),
  normal: Math.round(40 + rDaily() * 20),
}));

const rWeekly = mulberry32(202);
export const weeklyRiskData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => ({
  label: d,
  risk: Math.round(8 + rWeekly() * 12 + (i > 4 ? 4 : 0)),
  normal: Math.round(160 + rWeekly() * 40),
}));

const rMonthly = mulberry32(303);
export const monthlyRiskData = Array.from({ length: 30 }, (_, i) => ({
  label: `${i + 1}`,
  risk: Math.round(5 + rMonthly() * 15),
  normal: Math.round(150 + rMonthly() * 50),
}));

const rYearly = mulberry32(404);
export const yearlyRiskData = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => ({
  label: m,
  risk: Math.round(120 + rYearly() * 80),
  normal: Math.round(4000 + rYearly() * 800),
}));

export const anomalyTypes: AnomalyLog["type"][] = [
  "Predicted Fall Risk",
  "Sudden Motion",
  "Inactivity Alert",
  "Gait Anomaly",
];

// Fixed reference date so SSR and client render identical timestamps.
const REF = new Date("2026-06-09T14:00:00.000Z").getTime();
const rLogs = mulberry32(505);
export const anomalyLogs: AnomalyLog[] = Array.from({ length: 42 }, (_, i) => {
  const p = patients[i % patients.length];
  const d = new Date(REF - i * 3 * 3600 * 1000);
  return {
    id: `a${i + 1}`,
    patientId: p.id,
    patientName: p.name,
    date: d.toISOString(),
    type: anomalyTypes[i % anomalyTypes.length],
    accel: +(0.8 + rLogs() * 2.4).toFixed(2),
    gyro: +(20 + rLogs() * 180).toFixed(1),
    severity: i % 5 === 0 ? "high" : i % 3 === 0 ? "medium" : "low",
  };
});

export const patientAnomalies = (pid: string) =>
  anomalyLogs.filter((a) => a.patientId === pid);

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
