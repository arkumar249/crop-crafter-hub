import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Bot, User, Mic, Plus } from "lucide-react";
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat_bot_state, set_chat_bot_state] = useState("main");
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

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

        {/* ✅ New Chat Button */}
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
