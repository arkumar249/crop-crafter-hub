import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Sprout } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_BACKEND_API_BASE;

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Login attempt:", formData);
      const res = await axios.post(
        `${API_BASE}/auth/login`,
        formData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      );

      console.log("✅ Login successful:", res.data);
      navigate("/chat");
    } catch (err: any) {
      console.error("❌ Login failed:", err.response?.data || err.message);
      setError(err.response?.data?.detail || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4"
          >
            <Sprout className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Welcome to AgriBot
          </h1>
          <p className="text-muted-foreground">
            Your AI-powered farming assistant
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-sm font-medium text-foreground mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              placeholder="Enter your email"
              required
            />
          </motion.div>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-3 pr-12 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </motion.div>

          {/* Submit */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
              loading
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-gradient-primary text-primary-foreground hover:shadow-md"
            }`}
          >
            {loading ? "Signing in..." : "Sign In"}
          </motion.button>

          {/* Error */}
          {error && (
            <p className="text-red-600 text-sm text-center mt-2">{error}</p>
          )}

          {/* Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center space-y-3"
          >
            <Link
              to="/forgot-password"
              className="text-primary hover:text-primary/80 text-sm transition-colors"
            >
              Forgot your password?
            </Link>
            <div className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Sign up
              </Link>
            </div>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
