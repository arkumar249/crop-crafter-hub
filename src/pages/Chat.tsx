//git
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Bot, User, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import TTSPlayer from "@/components/Speak_";
import axios from "axios";

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content:
        "मेहनत करने वालों की कभी हार नहीं होती। मैं आपकी कृषि संबंधी सभी प्रश्नों में आपकी सहायता के लिए यहाँ हूँ। आज आप क्या जानना चाहेंगे?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    console.log("Image upload successful", res.data);
    return res.data.uploaded_url;
  }

  // ✅ Send query to backend
  async function sendQueryToBackend(query: string, imageUrl?: string): Promise<any> {
    const payload = {
      session_id: "57c180f5-78c2-4268-8b18-7c9ef3a0e147", // 👈 replace dynamically if needed
      user_query: query,
      role: "user",
      imageUrls: imageUrl ? [imageUrl] : [],
    };

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

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: "bot",
        content:
          "Oops! Something went wrong while processing your query. Please try again.",
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

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Chat Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 border-b border-border bg-card/50 backdrop-blur-sm"
      >
        <div className="flex items-center gap-4">
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
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence>
          {messages.map((message) => (
            <div key={message.id} className="flex flex-col">
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
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
                      ? "bg-gradient-to-r from-green-100 to-green-200 text-green-900 rounded-2xl rounded-br-md px-4 py-3 max-w-xs shadow-sm"
                      : "chat-bubble-bot"
                  }
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>

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
                  <TTSPlayer text={message.content} />
                </div>
              )}
            </div>
          ))}
        </AnimatePresence>

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
                className={`p-2 ${
                  micActive
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
