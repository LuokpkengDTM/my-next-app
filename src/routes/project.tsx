import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Shield,
  Cpu,
  Layers,
  Video,
  FileText,
  Users,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Activity,
  Phone,
  Mail,
  ExternalLink,
  Info,
  Maximize2
} from "lucide-react";
import { useSettings, useT } from "@/lib/settings-context";
import { PixelHeart } from "@/components/ui/pixel-heart";

export const Route = createFileRoute("/project")({
  head: () => ({
    meta: [
      { title: "Project Info — Fall Guard" },
      { name: "description", content: "AI-Powered Real-Time Fall Risk Prediction System for Elderly Using Gyroscope Sensor Analytics." },
    ],
  }),
  component: ProjectPage,
});

export function ProjectPage({ onTryDemo, onSignInClick }: { onTryDemo?: () => void; onSignInClick?: () => void }) {
  const t = useT();
  const { lang, setLang } = useSettings();
  const isTh = lang === "th";

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Static Data
  const teamMembers = [
    { name: isTh ? "นางสาว พรไพริน สุกสัย" : "Miss Pornpairin Suksai", phone: "0981378851", email: "Preemsuksai@gmail.com" },
    { name: isTh ? "นาย ศิวกร รักษ์วงศ์" : "Mr. Siwakorn Rakwong", phone: "0980400260", email: "siwakornrakwong@gmail.com" },
    { name: isTh ? "นาย อนุสรณ์ สมาน" : "Mr. Anusorn Saman", phone: "0966841329", email: "anusorn28009@gmail.com" },
    { name: isTh ? "นางสาว แวอัซมะห์ แวมูดอ" : "Miss Waeasmah Waemudor", phone: "0936130043", email: "waeasmah575@gmail.com" },
    { name: isTh ? "นางสาว พรพรหม ขวัญเมือง" : "Miss Pronprom Kwanmuang", phone: "0842863245", email: "pronprom7675@gmail.com" },
  ];

  const metrics = [
    {
      value: "77%",
      label: isTh ? "ความแม่นยำเฉลี่ย" : "Average Accuracy",
      desc: isTh ? "ผ่านการประเมินผลด้วยโมเดลแบบทดสอบจำลองจริง" : "Validated using realistic simulation model"
    },
    {
      value: "Hybrid AI",
      label: isTh ? "สถาปัตยกรรมแบบผสม" : "Hybrid Architecture",
      desc: isTh ? "การควบรวมขีดความสามารถของ XGBoost และ LSTM" : "Combines structural power of XGBoost and LSTM"
    },
    {
      value: "Pre-fall",
      label: isTh ? "พยากรณ์เชิงรุกก่อนเกิดเหตุ" : "Pre-fall Prediction",
      desc: isTh ? "ตรวจจับสัญญาณล่วงหน้าขณะเดินเซหรือชะงักตัว" : "Detects early signals during gait instability"
    },
    {
      value: "24 Folds",
      label: isTh ? "กลุ่มทดสอบอิสระ" : "LOSO Validation",
      desc: isTh ? "ทดสอบแบบ Leave-One-Subject-Out ทนทานต่อสรีระ" : "Leave-One-Subject-Out robust to anatomy differences"
    }
  ];

  const faqs = [
    {
      q: isTh ? "ทำไมจึงเลือกติดตั้งเซนเซอร์ที่ข้อมือ แทนที่จะเป็นเอวหรือข้อเท้า?" : "Why choose to place the sensor on the wrist instead of the waist or ankle?",
      a: isTh 
        ? "ข้อมือเป็นตำแหน่งที่ผู้ใช้งานยอมรับได้สูงสุดในชีวิตประจำวัน (คล้ายกับการสวมนาฬิกาข้อมือทั่วไป) ซึ่งลดอุปสรรคในการใช้งานจริง อีกทั้งตำแหน่งข้อมือยังมีสัญญาณการเคลื่อนไหวที่ชัดเจนเพียงพอสำหรับการวิเคราะห์ท่าทาง ซึ่งผลการวิจัยก่อนหน้านี้ยืนยันว่ามีความแม่นยำใกล้เคียงกับบริเวณเอวในบริบทนี้" 
        : "The wrist is the most user-acceptable location for daily wear (similar to a standard wristwatch), minimizing barriers to adoption. Additionally, wrist movement provides clear signals for gait analysis, with prior research confirming accuracy comparable to waist sensors in this setup."
    },
    {
      q: isTh ? "กลุ่มตัวอย่าง 24 คน เพียงพอสำหรับการเทรนโมเดลหรือไม่?" : "Is a sample size of 24 subjects sufficient for model training?",
      a: isTh 
        ? "หากมองในบริบท Deep Learning ทั่วไป ตัวเลข 24 คนอาจจะดูจำกัด แต่ในโครงการนี้เราประเมินผลด้วยวิธี Leave-One-Subject-Out (LOSO) cross-validation ซึ่งเป็นการเทรนโมเดลโดยแยกข้อมูลของหนึ่งบุคคลออกมาเพื่อทดสอบเสมอ (ทำทั้งหมด 24 รอบ) ทำให้มั่นใจว่าโมเดลสามารถทำงานกับบุคคลใหม่นอกเหนือกลุ่มทดสอบได้ดี และเรามีแผนขยายตัวอย่างเพิ่มเติมในกลุ่มผู้สูงอายุจริงในอนาคต" 
        : "While 24 subjects is relatively small for general deep learning, we evaluated the system using Leave-One-Subject-Out (LOSO) cross-validation (training on 23, testing on 1, repeated 24 times). This ensures the model generalizes well to unseen individuals. Future work includes expanding the sample size with elderly participants."
    },
    {
      q: isTh ? "ระบบนี้สามารถนำไปใช้งานจริงในบ้านพักหรือสถานดูแลผู้สูงอายุได้ทันทีเลยหรือไม่?" : "Can this system be deployed immediately in home care or nursing facilities?",
      a: isTh 
        ? "ปัจจุบันระบบยังอยู่ในขั้นตอนพัฒนาตัวต้นแบบ (Prototype) จำเป็นต้องทดสอบเพิ่มเติมร่วมกับผู้สูงอายุในสภาพแวดล้อมการใช้งานจริง รวมถึงการขอรับรองมาตรฐานอุปกรณ์ทางการแพทย์ และการออกแบบหน้าจอผู้ใช้งาน (UX) ให้เหมาะสมกับผู้ดูแลที่อาจจะไม่คุ้นเคยกับเทคโนโลยี" 
        : "The system is currently in the prototype stage. Further testing with elderly users in home environments is required, along with medical device certifications and UX optimization for caregivers who may be less tech-savvy."
    },
    {
      q: isTh ? "หากสัญญาณอินเทอร์เน็ตหรือ Wi-Fi ไม่เสถียร ระบบจะยังคงทำงานได้หรือไม่?" : "Will the system function if the Wi-Fi connection is unstable or disconnected?",
      a: isTh 
        ? "ปัจจุบันระบบตัวต้นแบบจำเป็นต้องเชื่อมต่อ Wi-Fi เพื่อส่งข้อมูลสัญญาณแบบเรียลไทม์ ซึ่งถือเป็นข้อจำกัดหลักที่เราตระหนัก สำหรับทิศทางการพัฒนาต่อไปในอนาคตคือการแปลงระบบเป็น Edge AI โดยให้การประเมินผลความเสี่ยงหกล้มเกิดขึ้นบนตัวชิปอุปกรณ์ข้อมือโดยตรง จากนั้นจึงซิงค์ข้อมูลแจ้งเตือนเมื่อระบบกลับมาออนไลน์" 
        : "The current prototype relies on a continuous Wi-Fi connection for real-time telemetry streaming. To address this limitation, our roadmap includes implementing Edge AI directly on the wristband processor to perform local risk inference, syncing logs when connection is restored."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-orange-500/30 selection:text-orange-200">
      {/* 1. Global Navigation Bar (Startup Tech Style) */}
      <div className="sticky top-0 z-50 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 flex-nowrap">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-105">
              <PixelHeart size={22} className="animate-pulse" style={{ animationDuration: "2.5s" }} pixelColor="#FFF56D" />
            </div>
            <div className="flex flex-col leading-tight select-none shrink-0">
              <span className="text-base font-extrabold tracking-wider text-white">
                Fall Guard
              </span>
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase hidden min-[380px]:block">
                {isTh ? "AI ความเสี่ยงหกล้ม" : "Fall Risk AI"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden lg:inline-flex rounded-full border border-orange-500/20 bg-orange-500/5 px-3 py-1 text-xs font-semibold text-orange-400 items-center gap-1.5 shadow-sm shadow-orange-500/5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500"></span>
              </span>
              {isTh ? "สถานะการวิจัย: ตัวต้นแบบ" : "Research Status: Prototype"}
            </span>
            <button
              onClick={() => setLang(lang === "en" ? "th" : "en")}
              className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs font-bold text-slate-350 hover:bg-slate-800 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 select-none active:scale-95 shadow-sm"
              aria-label="Toggle language"
            >
              <span className="text-[10px] text-slate-400">🌐</span>
              <span className="font-mono tracking-wider">{lang === "en" ? "TH" : "EN"}</span>
            </button>
            {onTryDemo && (
              <button 
                onClick={onTryDemo}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-orange-500 px-4 py-2 text-xs font-bold text-white hover:from-blue-500 hover:to-orange-400 transition-all cursor-pointer shadow-md shadow-blue-600/10 active:scale-95"
              >
                {isTh ? "ทดลองใช้งานระบบจำลอง" : "Try Guest Demo"}
              </button>
            )}
            {onSignInClick && (
              <button 
                onClick={onSignInClick}
                className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-350 hover:bg-slate-800 hover:text-white transition-all cursor-pointer active:scale-95"
              >
                {isTh ? "เข้าสู่ระบบเจ้าหน้าที่" : "Caregiver Sign In"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Hero Section (Blue & Orange Startup Tech Look) */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center border-b border-slate-900 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-6 py-20 text-center overflow-hidden">
        {/* Neon Backdrop Glows */}
        <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-orange-500/5 blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/5 px-3 py-1 text-xs font-medium text-blue-400">
            <Activity size={12} className="animate-pulse" />
            <span>{isTh ? "เทคโนโลยีปัญญาประดิษฐ์ทางการแพทย์" : "Next-Gen Medical AI Platform"}</span>
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-white leading-tight">
            {isTh ? "ทำนายความเสี่ยงการหกล้มล่วงหน้า" : "Predict Elderly Fall Risks"}{" "}
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-orange-400 bg-clip-text text-transparent">
              {isTh ? "ก่อนเกิดเหตุจริง" : "Before They Happen"}
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg text-slate-400 font-light leading-relaxed">
            {isTh 
              ? "ยกระดับการดูแลผู้สูงอายุแบบก้าวกระโดด ด้วยระบบตรวจจับสัญญาณความเสี่ยงการหกล้มเชิงรุก (Pre-fall) ผ่านการวิเคราะห์โครงสร้างพฤติกรรมและการเดินด้วยปัญญาประดิษฐ์แบบเรียลไทม์จากข้อมือ" 
              : "Next-generation proactive care telemetry. Forecasting dynamic fall risks before they happen by analyzing time-series wrist gyroscope telemetry with Hybrid AI models."}
          </p>

          {onTryDemo && (
            <div className="pt-4">
              <button 
                onClick={onTryDemo}
                className="rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 px-8 py-4 text-base font-bold text-white hover:from-blue-500 hover:to-orange-400 transition-all cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2 mx-auto"
              >
                <Activity size={18} className="animate-pulse" />
                {isTh ? "ทดลองใช้งานระบบจำลอง (Try Guest Demo)" : "Enter Guest Demo Dashboard"}
              </button>
            </div>
          )}

          {/* Startup Visual Board */}
          <div className="relative mx-auto mt-12 max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-1">
            <div className="rounded-xl bg-slate-950 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900 pb-4 text-left">
                <div>
                  <span className="text-xs font-semibold text-slate-300">
                    {isTh ? "ฮาร์ดแวร์สวมใส่ตัวต้นแบบ" : "Telemetry Wearable Hardware"}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {isTh ? "ตัวส่งข้อมูลสัญญาณแบบเรียลไทม์" : "Time-series gyroscope transmitter"}
                  </p>
                </div>
                <div className="h-2 w-2 rounded-full bg-orange-500 animate-ping"></div>
              </div>

              {/* Startup Telemetry Graphic Representation */}
              <div className="flex items-center justify-around gap-4 text-slate-400 py-2">
                <div className="flex flex-col items-center gap-2.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/5 text-blue-400 border border-blue-500/10">
                    <Activity size={22} className="animate-pulse" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isTh ? "ส่งข้อมูลสด" : "Telemetry"}</span>
                </div>
                <div className="h-8 w-[1px] bg-slate-900"></div>
                <div className="flex flex-col items-center gap-2.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/5 text-orange-400 border border-orange-500/10">
                    <Cpu size={22} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isTh ? "ประมวล AI" : "XGBoost-LSTM"}</span>
                </div>
                <div className="h-8 w-[1px] bg-slate-900"></div>
                <div className="flex flex-col items-center gap-2.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/5 text-blue-400 border border-blue-500/10">
                    <Shield size={22} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isTh ? "ความปลอดภัย" : "Proactive"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Key Metrics (Startup Cards with Blue & Orange Glow) */}
      <section className="bg-slate-950 px-6 py-20 relative">
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, idx) => (
              <div 
                key={idx} 
                className="rounded-2xl border border-slate-900 bg-slate-900/30 p-8 transition-all hover:scale-[1.03] hover:border-slate-800 hover:bg-slate-900/50 hover:shadow-lg hover:shadow-blue-500/5"
              >
                <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent block">
                  {metric.value}
                </span>
                <span className="mt-2 text-sm font-semibold text-slate-300 block">
                  {metric.label}
                </span>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed font-light">
                  {metric.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Core Innovation (Alternating Grid with Blue & Orange details) */}
      <section className="border-t border-b border-slate-900 bg-slate-900/10 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {isTh ? "การทำงานของเทคโนโลยีแบบไฮบริด" : "How Our Hybrid AI Works"}
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-slate-400 font-light">
              {isTh 
                ? "สถาปัตยกรรมอัจฉริยะที่ผสมผสานความแม่นยำและการประมวลผลเชิงเวลาเพื่อพยากรณ์ก่อนเกิดการล้ม" 
                : "Advanced AI pipelines bridging spatial statistical classification and sequential deep learning."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="rounded-xl border border-slate-900 bg-slate-950 p-6 space-y-4 shadow-sm hover:border-slate-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 font-bold text-sm">
                01
              </div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity size={18} className="text-orange-500" />
                {isTh ? "การเก็บข้อมูลสด" : "Sensor Telemetry"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                {isTh 
                  ? "เก็บสัญญาณการเคลื่อนไหวไจโรสโคปความหน่วงต่ำจากอุปกรณ์สายรัดข้อมือ และสตรีมมิ่งเข้าระบบคลาวด์วิเคราะห์ทุกวินาที" 
                  : "Streams dynamic gyroscope measurements from the wearable wristband under high-frequency transmission."}
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl border border-slate-900 bg-slate-950 p-6 space-y-4 shadow-sm hover:border-slate-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 font-bold text-sm">
                02
              </div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu size={18} className="text-blue-500" />
                {isTh ? "XGBoost ตัวจำแนกเด่น" : "XGBoost Processing"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                {isTh 
                  ? "สกัดคุณลักษณะเชิงสถิติ (Mean, Std, RMS) จากสัญญาณดิบในช่วงต่างเวลาเพื่อจัดกลุ่มลักษณะเด่นเชิงกายภาพอย่างแม่นยำ" 
                  : "Extracts physical gait descriptors and windowed statistical traits using tree-based XGBoost models."}
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl border border-slate-900 bg-slate-950 p-6 space-y-4 shadow-sm hover:border-slate-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 font-bold text-sm">
                03
              </div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers size={18} className="text-orange-500" />
                {isTh ? "LSTM วิเคราะห์ช่วงเวลา" : "LSTM Forecasting"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                {isTh 
                  ? "ประเมินผลแนวโน้มการเคลี่อนไหวเชิงอนุกรมเวลาเพื่อจับสัญญาณการเดินชะงักตัวหรือเสียการทรงตัวก่อนเกิดการล้มล่วงหน้า" 
                  : "Performs recurrent deep learning prediction to capture temporal instability and trigger alerts."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Embedded Media (Google Drive Video and Poster integration) */}
      <section className="bg-slate-950 px-6 py-24 relative">
        <div className="mx-auto max-w-5xl relative z-10">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              {isTh ? "การสาธิตการทำงานและผลงานวิจัย" : "Research Showcase & Video Demo"}
            </h2>
            <p className="mx-auto max-w-xl text-sm text-slate-400 font-light">
              {isTh 
                ? "วิดีโอแสดงการแจ้งเตือนจริงของระบบ และโปสเตอร์แสดงข้อมูลโครงร่างทางวิชาการของทีมวิจัย" 
                : "Live telemetry video warning demonstration and academic research poster details."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Video Player Embed (Actual Google Drive Video) */}
            <div className="lg:col-span-7 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Video size={16} className="text-orange-500" />
                  {isTh ? "วิดีโอแสดงการเชื่อมต่อและการแจ้งเตือนจริง" : "Video: Prototype Alert System Demonstration"}
                </div>
                {/* Responsive container for YouTube video iframe */}
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-900 bg-slate-950 shadow-xl shadow-blue-500/5">
                  <iframe 
                    src="https://www.youtube.com/embed/PkHE1GWseB0" 
                    className="absolute inset-0 w-full h-full border-0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    title="Fall Guard System Demo Video"
                  ></iframe>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 leading-relaxed block mt-2">
                * {isTh ? "วิดีโอประกอบ: แสดงพฤติกรรมการเคลื่อนไหว ข้อมูลสัญญาณไจโรสโคป และการตอบสนองของระบบแจ้งเตือนแบบวินาทีต่อวินาที" : "Telemetry details: Displays second-by-second sensor response and alarm panel triggers."}
              </span>
            </div>

            {/* Poster Embed (Actual Google Drive PDF Poster) */}
            <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-3 h-full flex flex-col">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <FileText size={16} className="text-blue-500" />
                  {isTh ? "โปสเตอร์โครงงานวิจัย (Academic Poster)" : "Poster: Project Summary & Design"}
                </div>
                {/* Responsive container for google drive poster iframe */}
                <div className="relative border border-slate-900 rounded-xl bg-slate-950 overflow-hidden h-[450px] lg:h-full lg:flex-1 shadow-xl shadow-orange-500/5">
                  <iframe 
                    src="https://drive.google.com/file/d/1mG3aoZyW9U2ttq1kGs4wsqaZNstmk1vi/preview" 
                    className="absolute inset-0 w-full h-full border-0"
                    title="Fall Guard Research Poster"
                  ></iframe>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 leading-relaxed block mt-2">
                * {isTh ? "เอกสารแนบ: แสดงสเปกโมเดล AI ลิขสิทธิ์ความคุ้มครองจริยธรรม และสถาปัตยกรรมทางโครงสร้างระบบ" : "Academic: Review details of XGBoost/LSTM thresholds and ethics approval."}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Research Team & Advisor (Startup Cards Layout) */}
      <section className="border-t border-slate-900 bg-slate-900/10 px-6 py-24">
        <div className="mx-auto max-w-5xl space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              {isTh ? "ทีมผู้พัฒนานวัตกรรม" : "Research & Development Team"}
            </h2>
            <p className="mx-auto max-w-xl text-sm text-slate-400 font-light">
              {isTh 
                ? "สาขาเทคโนโลยีดิจิทัลทางการแพทย์ และสาขาเทคโนโลยีสารสนเทศอัจฉริยะ สำนักวิชาสารสนเทศศาสตร์ มหาวิทยาลัยวลัยลักษณ์" 
                : "Medical Digital Technology & Intelligent Information Technology, School of Informatics, Walailak University"}
            </p>
          </div>

          {/* Advisor Card */}
          <div className="mx-auto max-w-md rounded-2xl border border-slate-800/80 bg-slate-950 p-6 flex items-center gap-5 shadow-xl shadow-blue-500/5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <GraduationCap size={24} />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {isTh ? "อาจารย์ที่ปรึกษาโครงการ" : "Project Advisor"}
              </span>
              <h3 className="text-base font-extrabold text-white">
                {isTh ? "รองศาสตราจารย์ ดร.บูคอรี ซาเหาะ" : "Assoc. Prof. Dr. Bukoree Sahoh"}
              </h3>
            </div>
          </div>

          {/* Students Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member, index) => (
              <div 
                key={index} 
                className="rounded-xl border border-slate-900 bg-slate-950 p-6 space-y-4 shadow-sm hover:border-slate-800 transition-all hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs text-blue-400 font-extrabold border border-slate-800">
                    {index + 1}
                  </div>
                  <h4 className="text-sm font-bold text-white">{member.name}</h4>
                </div>
                <div className="space-y-2 text-xs text-slate-400 font-light">
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-orange-500" />
                    <span>{member.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-blue-400" />
                    <span>{member.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Q&A / FAQs Accordion */}
      <section className="bg-slate-950 px-6 py-24">
        <div className="mx-auto max-w-3xl space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              {isTh ? "แนวถาม-ตอบ เจาะลึกนวัตกรรม" : "Technical & Analytical Q&A"}
            </h2>
            <p className="mx-auto max-w-xl text-sm text-slate-400 font-light">
              {isTh 
                ? "คำถามเชิงปฏิบัติและการประเมินผลประสิทธิภาพการคาดคะเนของโมเดลสำหรับการใช้งานจริง" 
                : "Detailed analysis regarding features, parameters, and training metrics."}
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index} 
                  className="overflow-hidden rounded-xl border border-slate-900 bg-slate-900/30 transition-all hover:border-slate-800"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="flex w-full items-center justify-between p-6 text-left font-bold text-sm sm:text-base text-white hover:bg-slate-900/50"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp size={18} className="text-orange-500 shrink-0 ml-4" />
                    ) : (
                      <ChevronDown size={18} className="text-blue-500 shrink-0 ml-4" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-900 bg-slate-950/50 p-6 text-xs sm:text-sm text-slate-400 leading-relaxed font-light">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7.5. Bottom CTA section */}
      {onTryDemo && (
        <section className="bg-slate-900/10 border-t border-slate-900/40 px-6 py-16 text-center">
          <div className="mx-auto max-w-xl space-y-4">
            <h3 className="text-xl font-bold text-white">
              {isTh ? "พร้อมสำหรับสาธิตการใช้งานระบบจริงแล้วใช่ไหม?" : "Ready to explore the live telemetry?"}
            </h3>
            <button 
              onClick={onTryDemo}
              className="rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 px-8 py-4 text-base font-bold text-white hover:from-blue-500 hover:to-orange-400 transition-all cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2 mx-auto"
            >
              <Activity size={18} className="animate-pulse" />
              {isTh ? "ลองใช้งานระบบจำลองเดโม" : "Launch Guest Demo"}
            </button>
          </div>
        </section>
      )}

      {/* 8. Fine Print / Footer (Startup Tech Style) */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-12 text-center text-xs text-slate-500 font-light">
        <div className="mx-auto max-w-7xl space-y-4">
          <p>
            {isTh 
              ? "© 2026 ระบบพยากรณ์ความเสี่ยงการหกล้มแบบเรียลไทม์ด้วยปัญญาประดิษฐ์. มหาวิทยาลัยวลัยลักษณ์. สงวนลิขสิทธิ์." 
              : "© 2026 Fall Guard AI Fall Risk Telemetry System. Walailak University. All rights reserved."}
          </p>
          <div className="flex justify-center gap-6 text-[10px] text-slate-600">
            <span>{isTh ? "สาขาเทคโนโลยีดิจิทัลทางการแพทย์" : "Medical Digital Technology"}</span>
            <span>·</span>
            <span>{isTh ? "สำนักวิชาสารสนเทศศาสตร์" : "School of Informatics"}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
