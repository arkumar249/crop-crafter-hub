import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, FileImage, Bug, Shield, AlertTriangle } from "lucide-react";
import axios from "axios";
import { set } from "date-fns";
const API_BASE = import.meta.env.VITE_BACKEND_API_BASE


const PestExpert = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [crop, setCrop] = useState("");
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState("");


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    try {
      console.log("in handleiamge");

      console.log("selected image", selectedImage)
      const formData = new FormData();
      formData.append("file", selectedImage);
      setIsUploading(true);
      const res = await axios.post(`${API_BASE}/upload/single`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data) {
        console.log("Image upload successfull", res.data);
      }
      else {
        console.log("Image upload failed");
        return;
      }
      setImageUrl(res.data.uploaded_url)
      setIsUploading(false);

      setIsAnalyzing(true);
      const analyzeRes = await axios.post(`${API_BASE}/api_model/pest_detection_and_analyze`, {
        image_url: res.data.uploaded_url,
        crop,
        description,
      });
      setResults(analyzeRes.data);
    } catch (err) {

    }
    finally {
      setIsAnalyzing(false);

    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResults(null);
    setCrop("");
    setDescription("");
    setImageUrl("");
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-full bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            🐛 Pest & Disease Expert
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Upload images of pests or diseased plants for instant AI-powered identification and treatment recommendations.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="agricultural-card p-6"
          >
            <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
              <Camera className="w-6 h-6 text-primary" />
              Image Analysis
            </h2>

            {/* Image Upload Area */}
            <div className="space-y-6">
              <div
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
                  ${imagePreview ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary hover:bg-primary/5'}
                `}
              >
                {imagePreview ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-4"
                  >
                    <img
                      src={imagePreview}
                      alt="Uploaded pest/disease"
                      className="max-w-full max-h-64 mx-auto rounded-lg shadow-soft"
                    />
                    <button
                      onClick={resetAnalysis}
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      Upload different image
                    </button>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 bg-primary/10 rounded-full">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        Upload Pest/Disease Image
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Drag and drop or click to select an image
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                      >
                        <FileImage className="w-4 h-4" />
                        Choose Image
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Crop Type (Optional)
                  </label>
                  <select
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select crop type</option>
                    <option value="tomato">Tomato</option>
                    <option value="corn">Corn</option>
                    <option value="wheat">Wheat</option>
                    <option value="rice">Rice</option>
                    <option value="potato">Potato</option>
                    <option value="soybean">Soybean</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe any symptoms or observations..."
                    rows={3}
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>

              {/* Analyze Button */}
              <motion.button
                onClick={handleAnalyze}
                disabled={!selectedImage || isAnalyzing || isUploading  || results}
                whileHover={{ scale: selectedImage && !isAnalyzing ? 1.02 : 1 }}
                whileTap={{ scale: selectedImage && !isAnalyzing ? 0.98 : 1 }}
                className={`
                  w-full py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2
                  ${selectedImage && !isAnalyzing && !isUploading
                    ? 'bg-gradient-primary text-primary-foreground hover:shadow-md'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }
                `}
              >
                {isAnalyzing || isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {isUploading ? (
                      <>Uploading...</>) :
                      (<>Analyzing...</>)}

                  </>
                ) :

                  (
                    <>
                      <Bug className="w-5 h-5" />
                      Analyze Image
                    </>
                  )}


              </motion.button>
              {results && (
                <motion.button
                  onClick={resetAnalysis}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-3 w-full py-2 rounded-lg font-medium transition-all duration-200 bg-red-100 text-red-600 hover:bg-red-200"
                >
                  Reset Analysis
                </motion.button>
              )}
            </div>
          </motion.div>


          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <AnimatePresence>
              {results ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Detected Disease Card */}
                  <div className="agricultural-card p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      Identification Result
                    </h3>

                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4"
                    >
                      <h4 className="text-lg font-semibold text-red-800">
                        {results.detected_disease}
                      </h4>
                    </motion.div>
                  </div>

                  {/* Cure & Treatment */}
                  <div className="agricultural-card p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                      <Shield className="w-5 h-5 text-primary" />
                      Cure & Treatment
                    </h3>

                    <div className="space-y-4">
                      {results.cure_and_treatment_methods?.map(
                        (treatment: string, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <p className="text-sm text-purple-900">{treatment}</p>
                          </motion.div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Preventive Measures */}
                  <div className="agricultural-card p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                      <Shield className="w-5 h-5 text-green-600" />
                      Preventive Measures
                    </h3>

                    <div className="space-y-4">
                      {results.preventive_measures?.map(
                        (measure: string, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <p className="text-sm text-green-900">{measure}</p>
                          </motion.div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Other Useful Agricultural Advice */}
                  <div className="agricultural-card p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                      <Shield className="w-5 h-5 text-blue-600" />
                      Other Useful Agricultural Advice
                    </h3>

                    <div className="space-y-4">
                      {results.other_useful_agricultural_advice?.map(
                        (advice: string, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <p className="text-sm text-blue-900">{advice}</p>
                          </motion.div>
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="agricultural-card p-6 text-center"
                >
                  <div className="p-8">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bug className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Ready for Analysis
                    </h3>
                    <p className="text-muted-foreground">
                      Upload an image to get instant pest and disease identification with treatment recommendations.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default PestExpert;