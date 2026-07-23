import { useAuth } from "../../hooks/useAuth";

const TOPBAR_H = 20;
const BANNER_H = 44;
const GAP = 8;

export default function Container({ children }) {
  const { hasBanner } = useAuth();

  const paddingTop = TOPBAR_H + (hasBanner ? BANNER_H : 0) + GAP;

  return (
    <div
      style={{ paddingTop }}
      className="min-h-screen bg-[#F5F6FA] flex flex-col"
    >
      <div className="p-4 md:p-8 flex-1">
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 border border-gray-100">
          {children}
        </div>
      </div>

      <footer className="px-4 md:px-8 py-4 text-center">
        <p className="text-sm text-gray-600 font-medium">
          © 2026 Hotel Friday Inn | Powered by{" "}
          <span className="text-yellow-600 font-bold">Webaac Solutions</span> |
          v1.0.0
        </p>
      </footer>
    </div>
  );
}
