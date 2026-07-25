import { useEffect, useState } from "react";
import auth from "../../auth/axiosInstance";
import { toast } from "react-toastify";
import { MessageCircle } from "lucide-react";

function Switch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A1B4D]/40 ${
        checked ? "bg-emerald-500" : "bg-gray-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className="inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{
          height: "18px",
          width: "18px",
          transform: checked ? "translateX(22px)" : "translateX(3px)",
        }}
      />
    </button>
  );
}

export default function WhatsAppAutoSendToggle({ type }) {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  const key =
    type === "booking" ? "auto_booking_confirmation" : "auto_bill_payment";
  const label =
    type === "booking" ? "Auto WhatsApp on booking" : "Auto WhatsApp invoice";
  const hint =
    type === "booking"
      ? "Sends when a booking is confirmed or checked in"
      : "Sends when a bill is marked as paid";

  useEffect(() => {
    auth
      .get("/whatsapp-settings")
      .then((res) => setSettings(res.data))
      .catch(() => setSettings(null));
  }, []);

  const handleToggle = async (nextValue) => {
    if (!settings) return;
    const prev = settings;
    const next = { ...settings, [key]: nextValue };
    setSettings(next);
    setSaving(true);
    try {
      const res = await auth.put("/whatsapp-settings", next);
      setSettings(res.data);
      toast.success(
        nextValue ? "Auto WhatsApp turned on" : "Auto WhatsApp turned off",
      );
    } catch (err) {
      setSettings(prev);
      toast.error("Failed to update WhatsApp setting");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return null;

  const checked = settings[key];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
          checked ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
        }`}
      >
        <MessageCircle size={16} strokeWidth={2.25} />
      </div>

      <div className="flex flex-col leading-tight">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        <span className="text-xs text-gray-500">{hint}</span>
      </div>

      <div className="ml-2">
        <Switch checked={checked} onChange={handleToggle} disabled={saving} />
      </div>
    </div>
  );
}