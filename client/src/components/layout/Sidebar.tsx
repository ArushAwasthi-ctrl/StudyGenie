import { NavLink } from "react-router";

const navItems = [
  { to: "/chat", label: "Chat", icon: "💬" },
  { to: "/documents", label: "Documents", icon: "📄" },
  { to: "/quiz", label: "Quiz", icon: "❓" },
  { to: "/code-review", label: "Code Review", icon: "🔍" },
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
      <div className="text-xl font-bold mb-8 px-2">StudyGenie</div>
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
