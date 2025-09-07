import { useState, useEffect  } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Droplets,
  Sun,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from "lucide-react";

/** ---------------- Backend Handlers ---------------- **/
const formatDate = (year: number, month: number, day: number) => {
  const mm = String(month + 1).padStart(2, "0"); // month is 0-indexed
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`; // YYYY-MM-DD
};
const API_BASE=import.meta.env.VITE_BACKEND_API_BASE
// 1️⃣ Fetch irrigation days for a specific month
const fetchIrrigationByMonth = async (month: number, year: number) => {
  
  try {
    console.log(API_BASE);
     const res = await axios.get(`${API_BASE}/api/irrigation`, {
      params: { month, year},
    });
    if (!res) throw new Error("Failed to fetch irrigation days");
    console.log(res.data);
    const data = "";
    console.log(data);
    return res.data; // [{date, time, duration, amount, method, notes, status}]
  } catch (err) {
    console.error(err);
    return [];
  }
};

// 2️⃣ Fetch all scheduled irrigation plans (for sidebar)
const fetchAllIrrigationPlans = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/irrigation/list`);
    if (!res.ok) throw new Error("Failed to fetch irrigation plans");
    const data = await res.json();
    return data; // full list of plans
  } catch (err) {
    console.error(err);
    return [];
  }
};

// 3️⃣ Add new irrigation schedule
const addIrrigationPlan = async (plan: any) => {
  try {
    const res = await axios.post(`${API_BASE}/api/irrigation/`, plan, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data; // Returns the inserted plan with id, created_at, etc.
  } catch (err) {
    console.error("Failed to add irrigation plan:", err);
    return null;
  }
};
/** ---------------- Component ---------------- **/

const IrrigationPlanner = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [irrigationDetails, setIrrigationDetails] = useState<{ [day: number]: any }>({});
  const [plansList, setPlansList] = useState<any[]>([]);

  const today = new Date();

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === "prev" ? -1 : 1));
      return newDate;
    });
    setSelectedDay(null);
  };

  const getDayStatus = (day: number) => {
  const details = irrigationDetails[day];

  if (
    today.getDate() === day &&
    today.getMonth() === currentDate.getMonth() &&
    today.getFullYear() === currentDate.getFullYear()
  ) {
    return "today";
  }

  if (Array.isArray(details)) {
    if (details.some((d) => d.status === "completed")) return "done";
    if (details.some((d) => d.status === "scheduled")) return "scheduled";
  }

  return "normal";
};


  const getIrrigationDetailsForDay = (day: number) => irrigationDetails[day] || null;

  /** ---------------- Effects ---------------- **/

  // Fetch irrigation for current month
 // ✅ Fetch irrigation for current month
useEffect(() => {
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  fetchIrrigationByMonth(month, year).then((data) => {
    const details: { [day: number]: any[] } = {};

    data.forEach((item: any) => {
      // Parse date safely (force UTC if needed)
      const day = new Date(item.date + "T00:00:00").getDate();

      if (!details[day]) {
        details[day] = [];
      }

      details[day].push({
        ...item,
        status: item.status || "scheduled",
      });
    });

    setIrrigationDetails(details);
  });
}, [currentDate]);


  // Fetch sidebar list
  useEffect(() => {
    console.log("for the sidebar");
    fetchAllIrrigationPlans().then(data => setPlansList(data));
  }, []);

  // Handle double click on empty day
  const handleDayDoubleClick = (day: number) => {
    const details = irrigationDetails[day];
    if (!details) {
      console.log("day" , day);
      setSelectedDay(day);
      setShowAddForm(true);
    }
  };

  const recommendations = [
    {
      icon: <Droplets className="w-5 h-5 text-blue-500" />,
      title: "Optimal Irrigation Schedule",
      description: "Water every 3-4 days based on soil moisture and weather conditions"
    },
    {
      icon: <Sun className="w-5 h-5 text-orange-500" />,
      title: "Best Timing",
      description: "Early morning (6-8 AM) to minimize evaporation and fungal diseases"
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-green-500" />,
      title: "Water Efficiency",
      description: "Drip irrigation reduces water usage by 30-50% compared to sprinklers"
    }
  ];

  /** ---------------- Render ---------------- **/
  return (
    <div className="min-h-full bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">💧 Irrigation Planner</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Smart irrigation scheduling based on weather patterns, soil moisture, and crop requirements.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Calendar */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="xl:col-span-2 agricultural-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3">
                <CalendarIcon className="w-6 h-6 text-primary" /> Irrigation Calendar
              </h2>
              <div className="flex items-center gap-4">
                <button onClick={() => navigateMonth("prev")} className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-medium min-w-[200px] text-center">
                  {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h3>
                <button onClick={() => navigateMonth("next")} className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: getFirstDayOfMonth(currentDate) }).map((_, i) => <div key={`empty-${i}`} className="p-2"></div>)}
              {Array.from({ length: getDaysInMonth(currentDate) }).map((_, i) => {
                const day = i + 1;
                const status = getDayStatus(day);
                return (
                  <motion.button
                    key={day}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                    onDoubleClick={() => handleDayDoubleClick(day)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 relative
                      ${status === "today" ? "ring-2 ring-primary ring-offset-2 bg-primary/10 text-primary" : ""}
                      ${status === "scheduled" ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : ""}
                      ${status === "done" ? "bg-green-100 text-green-700 hover:bg-green-200" : ""}
                      ${status === "normal" ? "hover:bg-muted text-foreground" : ""}
                      ${selectedDay === day ? "scale-105 shadow-soft" : ""}`}
                  >
                    {day}
                  </motion.button>
                );
              })}
            </div>

            {/* Selected Day Details */}
            <AnimatePresence>
              {selectedDay && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-6 p-4 bg-card border border-border rounded-lg">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" /> {currentDate.toLocaleDateString("en-US", { month: "long" })} {selectedDay}
                  </h4>

                  {getIrrigationDetailsForDay(selectedDay) ? (
  <div className="space-y-4">
    {getIrrigationDetailsForDay(selectedDay).map((plan: any) => (
      <div key={plan.id} className="grid grid-cols-2 md:grid-cols-4 gap-4 p-2 border rounded">
        <div>
          <p className="text-sm text-muted-foreground">Crop</p>
          <p className="font-medium">{plan.crop || "-"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Time</p>
          <p className="font-medium">{plan.time_slot}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Duration</p>
          <p className="font-medium">{plan.duration_minutes} min</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="font-medium">{plan.status}</p>
        </div>
      </div>
    ))}
  </div>
) : 
 showAddForm ? (
                    <form
  className="space-y-2"
  onSubmit={async (e) => {
    e.preventDefault();
    if (!selectedDay) return;

    const formData = new FormData(e.currentTarget);

    const newPlan = {
      userid: "645b3486-8ce1-4473-9540-b79db15414a1",
      date: formatDate(currentDate.getFullYear(), currentDate.getMonth(), selectedDay),
      time_slot: String(formData.get("time")),               // Correct backend field
      duration_minutes: Number(formData.get("duration")),    // Correct backend field
      amount_mm: formData.get("amount") ? Number(formData.get("amount")) : null,
      method: String(formData.get("method")),
      notes: String(formData.get("notes")) || null,
      crop: String(formData.get("crop")) || null,
      status: "scheduled",
    };
    console.log("newPlan" , newPlan["date" ]);

    const added = await addIrrigationPlan(newPlan);

    if (added) {
      // Update frontend state
      setIrrigationDetails(prev => {
        const updated = { ...prev };
        const day = selectedDay;
        if (!updated[day]) updated[day] = [];
        updated[day].push(added);
        return updated;
      });

      setPlansList(prev => [...prev, added]);
      setShowAddForm(false);
    }
  }}
>
  <input name="crop" placeholder="Crop Name (optional)" className="w-full p-1 border rounded" />
  <input name="time" placeholder="Time (6:00-8:00)" required className="w-full p-1 border rounded" />
  <input name="duration" placeholder="Duration (minutes)" required className="w-full p-1 border rounded" />
  <input name="amount" placeholder="Amount (mm)" className="w-full p-1 border rounded" />
  <input name="method" placeholder="Method" required className="w-full p-1 border rounded" />
  <textarea name="notes" placeholder="Notes" className="w-full p-1 border rounded" />
  <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Add</button>
</form>

                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Sun className="w-4 h-4" />
                      <span className="text-sm">No irrigation scheduled for this day</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            

            {/* Scheduled Plans */}
            <div className="agricultural-card p-6">
              <h3 className="text-xl font-semibold mb-4">Irrigation Plans</h3>
              <ul className="space-y-2 max-h-[400px] overflow-y-auto">
                {plansList.map(plan => (
                  <li key={plan.date} className={`p-2 rounded ${plan.status === "done" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                    <p className="text-sm font-medium">{new Date(plan.date).toLocaleDateString()}</p>
                    <p className="text-xs">Method: {plan.method}</p>
                    {plan.crop && <p className="text-xs">Crop: {plan.crop}</p>}
                    <p className="text-xs font-semibold">Status: {plan.status}</p>
                  </li>
                ))}
              </ul>
            </div>
            {/* AI Suggestions */}
            <div className="agricultural-card p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary" /> AI Suggestions
              </h3>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="flex gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <div className="p-2 bg-background rounded">{rec.icon}</div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">{rec.title}</h4>
                      <p className="text-muted-foreground text-xs leading-relaxed">{rec.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default IrrigationPlanner;
