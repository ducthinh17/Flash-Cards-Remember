import { Link, Outlet, useLocation } from "react-router-dom";
import { useMemo, useEffect } from "react";
import { BookOpen, Home, PlusCircle, BrainCircuit, Gamepad2, BarChart2, Sun, Moon } from "lucide-react";
import { cn } from "../../lib/utils";
import { useStore } from "../../store/useStore";

export default function AppLayout() {
  const location = useLocation();
  const { vocabItems, theme, setTheme } = useStore();

  const dueCount = useMemo(() => vocabItems.filter(
    v => !v.nextReviewAt || new Date(v.nextReviewAt) <= new Date()
  ).length, [vocabItems]);

  const navItems = [
    { name: "Dashboard", path: "/", icon: Home },
    { name: "Collections", path: "/collections", icon: BookOpen },
    { name: "Add Vocabulary", path: "/import", icon: PlusCircle },
    { name: "Review", path: "/review", icon: BrainCircuit, badge: dueCount },
    { name: "Games", path: "/games", icon: Gamepad2 },
    { name: "Stats", path: "/stats", icon: BarChart2 },
  ];

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // bg-[#f5f5f5] replaces old bg context
  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#111827] text-gray-900 dark:text-gray-100 flex flex-col md:flex-row font-sans transition-colors duration-300">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed h-full z-10 transition-colors duration-300">
        <div className="p-6">
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2 text-gray-900 dark:text-white">
            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Flash Card Remember
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-100"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500")} />
                {item.name}
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col min-h-[calc(100vh-80px)]">
          <div className="flex-1">
            <Outlet />
          </div>
          
          <footer className="mt-12 py-6 text-center text-sm text-gray-400 border-t border-gray-100 dark:border-gray-800">
            &copy;Copyright 2026 Vicor Pham.
          </footer>
        </div>
      </main>

      {/* Mobile Theme Toggle Floating Button */}
      <button 
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-white dark:bg-gray-800 shadow-sm rounded-full border border-gray-200 dark:border-gray-700"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-gray-500" />}
      </button>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around p-2 z-10 transition-colors duration-300">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg min-w-[56px] relative transition-colors",
                isActive 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              <item.icon className="w-5 h-5 mb-1" />
              {item.badge && item.badge > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white dark:border-gray-800">
                  {item.badge > 99 ? "99" : item.badge}
                </span>
              )}
              <span className="text-[9px] font-medium leading-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
