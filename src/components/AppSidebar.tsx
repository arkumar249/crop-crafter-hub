import { useState } from "react";
import { 
  MessageCircle, 
  Sprout, 
  Beaker, 
  Calendar,
  Home,
  History,
  Newspaper,
  ChevronDown,
  Bot
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarHeader,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "AI Chat", url: "/chat", icon: MessageCircle },
  { title: "Crop Recommender", url: "/crop-recommender", icon: Sprout },
  { title: "Fertilizer Guide", url: "/fertilizer-guide", icon: Beaker },
  { title: "Irrigation Planner", url: "/irrigation-planner", icon: Calendar },
];

const chatHistoryItems = [
  "Tomato Pest Control",
  "Soil pH Analysis",
  "Seasonal Crop Planning",
  "Weather Impact Discussion",
];

const newsItems = [
  "Sustainable Farming Trends 2024",
  "Climate-Smart Agriculture",
  "New Irrigation Technologies",
  "Organic Fertilizer Benefits",
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  
  const isCollapsed = state === "collapsed";
  const currentPath = location.pathname;

  const getNavClassName = (path: string) => {
    const isActive = currentPath === path;
    return `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`;
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <motion.div 
          className="flex items-center gap-3"
          animate={{ 
            justifyContent: isCollapsed ? "center" : "flex-start" 
          }}
        >
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-lg font-semibold text-sidebar-foreground whitespace-nowrap"
              >
                AgriBot
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClassName(item.url)}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <item.icon className="w-4 h-4" />
                      </motion.div>
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="whitespace-nowrap"
                          >
                            {item.title}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isCollapsed && (
          <>
            {/* Chat History */}
            <SidebarGroup>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <SidebarGroupLabel 
                  className="flex items-center justify-between cursor-pointer text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                  onClick={() => setChatHistoryOpen(!chatHistoryOpen)}
                >
                  <span className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Chat History
                  </span>
                  <motion.div
                    animate={{ rotate: chatHistoryOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </SidebarGroupLabel>
                
                <AnimatePresence>
                  {chatHistoryOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {chatHistoryItems.map((item, index) => (
                            <motion.div
                              key={item}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <SidebarMenuItem>
                                <SidebarMenuButton className="text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground pl-6">
                                  {item}
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            </motion.div>
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </SidebarGroup>

            {/* Agricultural News */}
            <SidebarGroup>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SidebarGroupLabel 
                  className="flex items-center justify-between cursor-pointer text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                  onClick={() => setNewsOpen(!newsOpen)}
                >
                  <span className="flex items-center gap-2">
                    <Newspaper className="w-4 h-4" />
                    Agricultural News
                  </span>
                  <motion.div
                    animate={{ rotate: newsOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </SidebarGroupLabel>
                
                <AnimatePresence>
                  {newsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {newsItems.map((item, index) => (
                            <motion.div
                              key={item}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <SidebarMenuItem>
                                <SidebarMenuButton className="text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground pl-6">
                                  {item}
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            </motion.div>
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}