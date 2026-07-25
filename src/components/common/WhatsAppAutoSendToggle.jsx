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
      className={`relative inline-flex h-4.5 w-8 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? "bg-emerald-500" : "bg-gray-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      style={{ height: "18px", width: "32px" }}
    >
      <span
        className="inline-block rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{
          height: "14px",
          width: "14px",
          transform: checked ? "translateX(16px)" : "translateX(2px)",
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
  const title =
    type === "booking"
      ? "Auto-send WhatsApp booking confirmation"
      : "Auto-send WhatsApp invoice on payment";

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
    <div
      title={title}
      className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1"
    >
      <MessageCircle
        size={13}
        strokeWidth={2.25}
        className={checked ? "text-emerald-500" : "text-gray-400"}
      />
      <span className="text-[11px] font-medium text-gray-500">Auto</span>
      <Switch checked={checked} onChange={handleToggle} disabled={saving} />
    </div>
  );
}