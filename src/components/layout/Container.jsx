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
      className="min-h-screen bg-[#F5F6FA]"
    >
      <div className="p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 border border-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
}
