import { NavLink } from "react-router";
import {
  MessageSquare,
  FileText,
  HelpCircle,
  Code2,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/quiz", label: "Quiz", icon: HelpCircle },
  { to: "/code-review", label: "Code Review", icon: Code2 },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground min-h-screen p-4 flex flex-col border-r border-sidebar-border">
      <div className="text-xl font-bold mb-8 px-2 tracking-tight">
        StudyGenie
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
