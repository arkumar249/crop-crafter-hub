import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Bot, User, Mic, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import TTSPlayer from "@/components/Speak_";
import axios from "axios";
import remarkGfm from "remark-gfm";
import removeMarkdown from "remove-markdown"


const API_BASE = import.meta.env.VITE_BACKEND_API_BASE;

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  avatar?: string;
  images?: string[];
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat_bot_state, set_chat_bot_state] = useState("main");
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);



  
function formatMarkdown(content: string) {
  return content
    // Convert escaped "\n" to real line breaks
    .replace(/\\n/g, "\n")

    // Normalize "Key Features:" to bold heading
    .replace(/\*Key Features:/g, "\n\n**Key Features:**\n")

    // Ensure list items use valid markdown (- instead of stray *)
    .replace(/^\s*\*\s+/gm, "- ");
}

function stripMarkdown(content: string) {
  return content
    .replace(/[#_*`>-]/g, "")          // remove markdown symbols
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // convert [text](url) → text
    .replace(/\n+/g, " ")              // collapse newlines into spaces
    .trim();
}

// Final cleaner for speech
function formatSpeech(content: string) {
  // First apply your custom regex cleaning
  const cleaned = stripMarkdown(content);
  // Then let remove-markdown handle anything missed
  return removeMarkdown(cleaned, { stripListLeaders: true, useImgAltText: false }).trim();
}

  // Mic State

  const [micActive, setMicActive] = useState(false);
  const [previousTranscript, setPreviousTranscript] = useState("");

  // Speech Recognition Hook
  const { transcript, browserSupportsSpeechRecognition, resetTranscript } =
    useSpeechRecognition();

  useEffect(() => {
    if (micActive) {
      setInputValue(previousTranscript + transcript);
    }
  }, [transcript, micActive, previousTranscript]);

  const startListening = () => {
    SpeechRecognition.startListening({
      continuous: true,
      language: "en-IN",
    });
  };

  const handleMicToggle = () => {
    if (micActive) {
      SpeechRecognition.stopListening();
      setPreviousTranscript((prev) => prev + transcript);
    } else {
      startListening();
    }
    setMicActive(!micActive);
  };

  if (!browserSupportsSpeechRecognition) {
    console.warn("Speech Recognition not supported in this browser.");
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const loadChat = async () => {
      try {
        let session_Id = localStorage.getItem("chat_session_id");
        const req_payload = {
          userid: "33d125b8-c2b0-44be-9797-fe02959f363b",
          chat_type: chat_bot_state,
        };

        if (!session_Id) {
          const res = await axios.post(`${API_BASE}/chats/createSession`, req_payload, {
            headers: { "Content-Type": "application/json" },
          });
          session_Id = res.data.id;
          setSessionId(session_Id);
          localStorage.setItem("chat_session_id", session_Id);
        } else {
          setSessionId(session_Id);
        }

        const res = await axios.get(`${API_BASE}/chats/messages/${session_Id}`);
        const res_data = res.data;

        const formatted = res_data.flatMap((msg: any) => {
          const items: Message[] = [];
          if (msg.user_query) {
            items.push({
              id: msg.id + "-user",
              type: "user",
              content: msg.user_query,
              timestamp: new Date(msg.created_at),
              images: msg.imageUrls || [],
            });
          }
          if (msg.ai_answer) {
            items.push({
              id: msg.id + "-bot",
              type: "bot",
              content: msg.ai_answer,
              timestamp: new Date(msg.created_at),
              images: [],
            });
          }
          return items;
        });

        setMessages(formatted);
      } catch (error) {
        console.error("Failed to load chat history", error);
      }
    };

    loadChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ Upload single image
  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post(`${API_BASE}/upload/single`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (!res.data || !res.data.uploaded_url) {
      throw new Error("Image upload failed");
    }

    return res.data.uploaded_url;
  }

  // ✅ Send query to backend
  async function sendQueryToBackend(query: string, imageUrl?: string): Promise<any> {
    const payload = {
      session_id: sessionId,
      user_query: query,
      role: "user",
      imageUrls: imageUrl ? [imageUrl] : [],
      domain: chat_bot_state,
    };


    // backend query
    // No need to change anything here

    const res = await axios.post(`${API_BASE}/chats/addMessage`, payload, {
      headers: { "Content-Type": "application/json" },
    });

    return res.data;
  }

  // ✅ Handle sending message
  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue || "[Sent image]",
      timestamp: new Date(),
      images: selectedImage ? [URL.createObjectURL(selectedImage)] : [],
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    //const test_mess="Here's a summary of the information based on your query:\n\n### Web Information (Crops for Loamy Soil)\n\n*   Unfortunately, I encountered an error when trying to retrieve information about the best crops for loamy soil. The search tool was blocked from accessing the necessary data. Therefore, I cannot provide a list of crops at this moment.\n\n### Image Analysis\n\nThe provided image displays a John Deere 7R 350 tractor, a large and modern agricultural machine, presented against a clean white background.\n\n   *Key Features:\n    *   **Iconic John Deere Colors: Dominant deep green body with bright yellow accents on wheel rims and a side stripe, and black for tires, grille, and other components.\n    *   Powerful Model: Clearly labeled \"7R 350,\" indicating a high-horsepower row-crop tractor.\n    *   Modern Design: Features include a large black front grille with the John Deere emblem, multiple integrated headlights, and a robust front linkage system.\n    *   Spacious Cab: An expansive operator's cabin with panoramic, tinted glass windows, offering excellent visibility. The interior shows a comfortable seat and controls.\n    *   Heavy-Duty Wheels: Large, heavily lugged black radial tires on bright yellow rims, with the rear wheels significantly larger for maximum traction.\n    *   Safety & Visibility: Equipped with numerous work lights on the cab roof, large side mirrors, and an amber turn signal/marker light at the rear.\n    *   Ergonomics: Sturdy black steps and a green handrail provide safe access to the cab.\n    *   Exhaust: A tall, black exhaust stack is visible on the right side of the cab.\n\n*   Overall Impression: The tractor appears highly modern, powerful, and robust, designed for efficiency and comfort in demanding agricultural operations. The clean white background is typical for promotional imagery, highlighting the machine itself.";

//    const test_mess1 = `# 🌱 Comprehensive Guide: Growing Tomatoes Successfully  
// Tomatoes are one of the most popular crops for both **home gardeners** and **commercial farmers**. Let’s break down everything step by step:  

// ---

// ## 1. Climate & Soil Requirements  

// - **Temperature:** Ideal range is *20°C – 30°C*.  
// - **Soil:** Well-drained loamy soil with **pH 6.0 – 6.8**.  
// - **Sunlight:** Needs at least **6–8 hours** of direct sunlight daily.  

// 👉 **Pro Tip:** Avoid waterlogging – tomatoes *hate* wet feet.  

// ---

// ## 2. Land Preparation  

// 1. Plow the land 2–3 times until fine tilth is obtained.  
// 2. Incorporate **well-rotted farmyard manure (FYM) at 20 tons/ha**.  
// 3. Create **raised beds** or **ridge & furrow system** for better drainage.  

// ---

// ## 3. Sowing & Transplanting  

// - **Nursery Raising:** Sow seeds in trays/seedbeds. Use fungicide-treated seeds.  
// - **Transplanting:** After 25–30 days, when seedlings are 15 cm tall.  
// - **Spacing:**  
//   - **Row-to-row:** 60 cm  
//   - **Plant-to-plant:** 45 cm  

// ---

// ## 4. Fertilizer Management  

// | Stage | Fertilizer | Quantity (per acre) | Remarks |
// |-------|------------|---------------------|---------|
// | Basal | DAP (Diammonium Phosphate) | 50 kg | At transplanting |
// | Vegetative | Urea | 25 kg | Split in 2 doses |
// | Flowering | MOP (Muriate of Potash) | 20 kg | Boosts fruit quality |

// ⚠️ Excess nitrogen = more leaves, fewer fruits!  

// ---

// ## 5. Irrigation Schedule 💧  

// - **Critical stages:** Flowering & fruit set.  
// - Avoid overhead irrigation → use **drip irrigation** for best results.  
// - Watering frequency: Every 6–7 days in cool season, every 3–4 days in hot season.  

// ---

// ## 6. Pest & Disease Management 🐛  

// ### Major Pests  
// - **Fruit borer** (*Helicoverpa armigera*)  
// - **Whiteflies** → transmit **Tomato Leaf Curl Virus**  

// ### Control  
// - Install **Pheromone traps** (5 per acre).  
// - Spray **Neem oil (2%)** every 10–12 days.  

// ---

// ## 7. Harvesting & Yield  

// - First harvest: **60–70 days** after transplanting.  
// - Pick fruits at **breaker stage** (when they turn pinkish).  
// - **Average yield:** 25–30 tons/ha under good management.  

// ---

// ## ✅ Summary  

// - 🌞 Needs full sun, warm climate  
// - 🌱 Loamy soil with good drainage  
// - 💧 Drip irrigation is best  
// - 🐛 Protect against fruit borer & viruses  
// - 🍅 Yield potential: **25–30 tons/ha**  

// ---

// ## 📌 Example Q&A  

// **Q:** Can tomatoes be grown in sandy soil?  
// **A:** Yes, but you must add plenty of **organic matter** to retain moisture.  

// **Q:** What’s the best fertilizer for fruiting?  
// **A:** Apply **Potassium-rich fertilizers** (MOP or SOP) at flowering & fruiting stage.  

// ---

// ✨ *With proper care, tomato farming can be both profitable and rewarding!*`;

// const test_mess="Here's a summary of the information based on your query:\n\n### Web Information (Crops for Loamy Soil)\n\n*   Unfortunately, I encountered an error when trying to retrieve information about the best crops for loamy soil. The search tool was blocked from accessing the necessary data. Therefore, I cannot provide a list of crops at this moment.\n\n### Image Analysis\n\nThe provided image displays a John Deere 7R 350 tractor, a large and modern agricultural machine, presented against a clean white background.\n\n   *Key Features:\n    *   **Iconic John Deere Colors: Dominant deep green body with bright yellow accents on wheel rims and a side stripe, and black for tires, grille, and other components.\n    *   Powerful Model: Clearly labeled \"7R 350,\" indicating a high-horsepower row-crop tractor.\n    *   Modern Design: Features include a large black front grille with the John Deere emblem, multiple integrated headlights, and a robust front linkage system.\n    *   Spacious Cab: An expansive operator's cabin with panoramic, tinted glass windows, offering excellent visibility. The interior shows a comfortable seat and controls.\n    *   Heavy-Duty Wheels: Large, heavily lugged black radial tires on bright yellow rims, with the rear wheels significantly larger for maximum traction.\n    *   Safety & Visibility: Equipped with numerous work lights on the cab roof, large side mirrors, and an amber turn signal/marker light at the rear.\n    *   Ergonomics: Sturdy black steps and a green handrail provide safe access to the cab.\n    *   Exhaust: A tall, black exhaust stack is visible on the right side of the cab.\n\n*   Overall Impression: The tractor appears highly modern, powerful, and robust, designed for efficiency and comfort in demanding agricultural operations. The clean white background is typical for promotional imagery, highlighting the machine itself.";

    try {
      let uploadedImageUrl = "";
      if (selectedImage) {
        uploadedImageUrl = await uploadImage(selectedImage);
      }

      const botResponse = await sendQueryToBackend(inputValue, uploadedImageUrl);

      const botMessage: Message = {
        id: botResponse.id,
        type: "bot",
        content: botResponse.ai_answer,
        timestamp: new Date(),
      };
      // const botMessage: Message = {
      //   id: botResponse.id,
      //   type: "bot",
      //   content: 
      //   timestamp: new Date(),
      // };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: "bot",
       // content: test_mess,
         content: "Oops! Something went wrong while processing your query. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      if (selectedImage) {
        URL.revokeObjectURL(userMessage.images?.[0] || "");
      }
      setSelectedImage(null);
      resetTranscript();
      setPreviousTranscript("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedImage(e.target.files[0]);
    }
  };

  // ✅ New Chat button handler
  const handleNewChat = async () => {
    localStorage.removeItem("chat_session_id");
    setSessionId(null);
    setMessages([]);
  };

  // ✅ Empty state messages based on chat_bot_state
  const emptyMessages: Record<string, string> = {
    main: "Welcome to AI Farm Assistant 🌱. Ask me anything about farming!",
    weather: "🌦 No weather chats yet. Ask about today's forecast!",
    pest: "🐛 No pest diagnosis yet. Upload an image to start.",
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Chat Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 border-b border-border bg-card/50 backdrop-blur-sm flex items-center"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              AI Farm Assistant
            </h1>
            <p className="text-muted-foreground">
              Ask me anything about farming, crops, or agriculture
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Online
          </div>
        </div>


        <Button
          onClick={handleNewChat}
          variant="outline"
          className="ml-4 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Chat
        </Button>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-lg text-center">
            {emptyMessages[chat_bot_state] || "Start a conversation with AgriBot 🌿"}
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col">
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"
                    } gap-3`}
                >
                  {message.type === "bot" && (
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}

                  <div
                    className={
                      message.type === "user"
                        ? "bg-gradient-to-r from-green-100 to-green-200 text-green-900 rounded-2xl rounded-br-md px-4 py-3 shadow-sm max-w-[80%] ml-auto"
                        : "bg-white border border-gray-200 shadow-sm rounded-2xl p-4 max-w-[90%] w-full"
                    }
                  >
                    {message.type === "bot" ? (
                      <div className="prose prose-sm sm:prose-base max-w-none text-gray-900 leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{formatMarkdown(message.content)}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    )}

                    {message.images && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {message.images.map((src, idx) => (
                          <img
                            key={idx}
                            src={src}
                            alt="uploaded"
                            className="w-20 h-20 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}

                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>



                  {message.type === "user" && (
                    <div className="w-8 h-8 bg-gradient-earth rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-earth-dark" />
                    </div>
                  )}
                </motion.div>

                {message.type === "bot" && (
                  <div className="ml-11 mt-1">
                    <TTSPlayer text={formatSpeech(message.content)} />
                  </div>
                )}
              </div>
            ))}
          </AnimatePresence>
        )}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex justify-start gap-3"
          >
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="bg-card text-card-foreground rounded-2xl rounded-bl-md px-4 py-3 border border-border shadow-soft">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 border-t border-border bg-card/50 backdrop-blur-sm"
      >
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setPreviousTranscript(e.target.value);
              }}
              onKeyDown={handleKeyPress}
              placeholder="Ask me about farming, crops, soil, weather, or anything agriculture-related..."
              className="agricultural-input pr-32 py-4 text-base resize-none min-h-[50px]"
              disabled={isTyping}
            />
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Paperclip className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleMicToggle}
                className={`p-2 ${micActive
                  ? "text-red-500"
                  : "text-muted-foreground hover:text-foreground"
                  } transition-colors`}
                title={micActive ? "Stop Listening" : "Start Listening"}
              >
                <Mic className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={(!inputValue.trim() && !selectedImage) || isTyping}
            className="agricultural-button px-6 py-4 h-auto"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {selectedImage && (
          <div className="flex flex-wrap gap-2 mt-3">
            <div className="w-16 h-16 relative border rounded overflow-hidden">
              <img
                src={URL.createObjectURL(selectedImage)}
                alt={selectedImage.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-3 max-w-4xl mx-auto">
          AgriBot is powered by AI and provides farming guidance. Always consult
          with local agricultural experts for critical decisions.
        </p>
      </motion.div>
    </div>
  );
};

export default Chat;
