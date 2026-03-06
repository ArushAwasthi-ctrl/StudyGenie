import { useAuth } from "../../hooks/useAuth.js";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="text-gray-600 text-sm">
        Welcome back, <span className="font-semibold text-gray-900">{user?.name}</span>
      </div>
      <button
        onClick={logout}
        className="text-sm text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
      >
        Logout
      </button>
    </header>
  );
}
