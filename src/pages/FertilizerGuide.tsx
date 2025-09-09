import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Beaker, 
  Leaf,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Sprout,
  FlaskConical,
  Sun,
  Droplets,
  CloudRain,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


const API_BASE=import.meta.env.VITE_BACKEND_API_BASE;
// --- schema ---
const formSchema = z.object({
  temperature: z.string().min(1),
  humidity: z.string().min(1),
  rainfall: z.string().min(1),
  soilPh: z.string().min(1),
  nitrogen: z.string().min(1),
  phosphorus: z.string().min(1),
  potassium: z.string().min(1),
  soilType: z.string().min(1),
  season: z.string().min(1),
  crop: z.string().min(1),
});

// --- Recommendation type (matches your output schema) ---
interface FertilizerRecommendation {
  fertilizer: string;
  confidence: number;
  short_description: string;
  detailed_description: {
    benefits: string[];
    precautions: string[];
  };
  icon?: React.ReactNode;
}

// --- API function ---
async function fetchCropRecommendation(data: {
  temperature: number;
  humidity: number;
  rainfall: number;
  soilPh: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  soilType: string;
  season: string;
  crop: string;
}) {
  const res = await fetch(`${API_BASE}/api_model/fertilizer_recommendation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to fetch recommendations");
  return res.json(); // expected shape: { recommendations: [ ... ] }
}

const FertilizerGuide = () => {
  const [recommendations, setRecommendations] = useState<FertilizerRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      temperature: "",
      humidity: "",
      rainfall: "",
      soilPh: "",
      nitrogen: "",
      phosphorus: "",
      potassium: "",
      soilType: "",
      season: "",
      crop: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setHasSubmitted(true);

    const payload = {
      temperature: parseInt(values.temperature),
      humidity: parseInt(values.humidity),
      rainfall: parseInt(values.rainfall),
      soilPh: parseFloat(values.soilPh),
      nitrogen: parseInt(values.nitrogen),
      phosphorus: parseInt(values.phosphorus),
      potassium: parseInt(values.potassium),
      soilType: values.soilType,
      season: values.season,
      crop: values.crop,
    };

    try {
      const apiResponse: any = await fetchCropRecommendation(payload);

      // Map API items to our UI type and attach an icon
      const formatted: FertilizerRecommendation[] = (apiResponse?.recommendations || []).map(
        (item: any, idx: number) => ({
          fertilizer: item.fertilizer,
          confidence: typeof item.confidence === "number" ? item.confidence : Number(item.confidence || 0),
          short_description: item.short_description || "",
          detailed_description: {
            benefits: item.detailed_description?.benefits || [],
            precautions: item.detailed_description?.precautions || [],
          },
          icon: <FlaskConical className="w-6 h-6 text-blue-500" />,
        })
      );

      // If API returns nothing, fallback to the mock below by throwing
      if (!formatted.length) throw new Error("No recommendations returned");

      setRecommendations(formatted);
    } catch (err) {
      console.error("API error, using fallback mock data:", err);

      // fallback: mock recommendations (kept as earlier)
      const mockRecommendations: FertilizerRecommendation[] = [
        {
          fertilizer: "DAP",
          confidence: 51.98,
          short_description: "DAP is recommended for rice under the given conditions.",
          detailed_description: {
            benefits: ["Supplies essential nutrients", "Helps improve crop vigor", "Supports expected yield"],
            precautions: ["Follow label/dosage instructions", "Do not exceed recommended rates", "Avoid application in heavy rain"],
          },
          icon: <FlaskConical className="w-6 h-6 text-blue-500" />
        },
        {
          fertilizer: "Gypsum",
          confidence: 16.97,
          short_description: "Gypsum is recommended for rice under the given conditions.",
          detailed_description: {
            benefits: ["Supplies essential nutrients", "Helps improve crop vigor", "Supports expected yield"],
            precautions: ["Follow label/dosage instructions", "Do not exceed recommended rates", "Avoid application in heavy rain"],
          },
          icon: <Leaf className="w-6 h-6 text-green-500" />
        },
        {
          fertilizer: "MOP",
          confidence: 11.61,
          short_description: "MOP is recommended for rice under the given conditions.",
          detailed_description: {
            benefits: ["Supplies essential nutrients", "Helps improve crop vigor", "Supports expected yield"],
            precautions: ["Follow label/dosage instructions", "Do not exceed recommended rates", "Avoid application in heavy rain"],
          },
          icon: <Sprout className="w-6 h-6 text-purple-500" />
        }
      ];

      setRecommendations(mockRecommendations);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">🧪 Fertilizer Guide</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Get personalized fertilizer recommendations based on your soil analysis and crop selection.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Form Section */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="agricultural-card p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
              <FlaskConical className="w-6 h-6 text-primary" />
              Soil Analysis Input
            </h2>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Weather */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="temperature" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Sun className="w-4 h-4 text-yellow-500" />Temperature (°C)</FormLabel>
                      <FormControl><Input {...field} placeholder="28" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="humidity" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-500" />Humidity (%)</FormLabel>
                      <FormControl><Input {...field} placeholder="65" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="rainfall" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><CloudRain className="w-4 h-4 text-indigo-500" />Rainfall (mm)</FormLabel>
                      <FormControl><Input {...field} placeholder="120" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Soil Nutrients */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="nitrogen" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nitrogen (N)</FormLabel>
                      <FormControl><Input {...field} placeholder="40" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phosphorus" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phosphorus (P)</FormLabel>
                      <FormControl><Input {...field} placeholder="50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="potassium" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Potassium (K)</FormLabel>
                      <FormControl><Input {...field} placeholder="60" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Soil Properties */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="soilPh" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Beaker className="w-4 h-4 text-purple-500" />Soil pH</FormLabel>
                      <FormControl><Input {...field} placeholder="6.5" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="soilType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Soil Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="agricultural-input"><SelectValue placeholder="Select soil type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="sandy">Sandy</SelectItem>
                          <SelectItem value="clay">Clay</SelectItem>
                          <SelectItem value="loam">Loam</SelectItem>
                          <SelectItem value="silt">Silt</SelectItem>
                          <SelectItem value="peaty">Peaty</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Season */}
                <FormField control={form.control} name="season" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Calendar className="w-4 h-4 text-teal-500" />Season</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="agricultural-input"><SelectValue placeholder="Select season" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="summer">Summer</SelectItem>
                        <SelectItem value="kharif">Kharif</SelectItem>
                        <SelectItem value="rabi">Rabi</SelectItem>
                        <SelectItem value="winter">Winter</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Crop */}
                <FormField control={form.control} name="crop" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Sprout className="w-4 h-4 text-green-500" />Crop Name</FormLabel>
                    <FormControl><Input {...field} placeholder="Wheat" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" disabled={isLoading} className="agricultural-button w-full text-lg py-6">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin"></div>
                      Analyzing Soil...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Beaker className="w-5 h-5" />
                      Get AI Recommendations
                    </div>
                  )}
                </Button>
              </form>
            </Form>
          </motion.div>

          {/* Recommendations Section (card-based UI restored) */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="agricultural-card p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-primary" />
              AI Recommendations
            </h2>

            <AnimatePresence mode="wait">
              {!hasSubmitted ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-earth rounded-full flex items-center justify-center mx-auto mb-6">
                    <Beaker className="w-12 h-12 text-earth-dark" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Ready for Analysis</h3>
                  <p className="text-muted-foreground">Enter your soil analysis data to get customized fertilizer recommendations.</p>
                </motion.div>
              ) : isLoading ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <div className="w-12 h-12 border-4 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Analyzing Soil Data</h3>
                  <p className="text-muted-foreground">Our AI is creating personalized fertilizer recommendations...</p>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {recommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.12, type: "spring" }}
                      className="bg-card border border-border rounded-lg p-6 hover:shadow-soft transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-muted rounded-lg">
                          {rec.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-foreground">{rec.fertilizer}</h4>
                            <span className="px-2 py-1 text-xs font-medium rounded-md border bg-blue-50 text-blue-500">
                              {rec.confidence.toFixed(2)}%
                            </span>
                          </div>

                          <p className="text-muted-foreground text-sm mb-3">{rec.short_description}</p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h5 className="font-medium text-foreground mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Benefits
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {rec.detailed_description?.benefits.map((b, i) => (
                                  <span key={i} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md">
                                    {b}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h5 className="font-medium text-foreground mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                                Precautions
                              </h5>
                              <ul className="space-y-1">
                                {rec.detailed_description?.precautions.map((p, i) => (
                                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                                    {p}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FertilizerGuide;