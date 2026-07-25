import { useEffect, useState } from "react";
import auth from "../../auth/axiosInstance";
import { toast } from "react-toastify";

// Small pill switch
function Switch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-emerald-500" : "bg-gray-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-4.5" : "translate-x-1"
        }`}
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

/**
 * Shows a toggle for one WhatsApp auto-send flag ("booking" or "billing").
 * Defaults to ON; manual send buttons elsewhere are unaffected by this setting.
 */
export default function WhatsAppAutoSendToggle({ type }) {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  const key =
    type === "booking" ? "auto_booking_confirmation" : "auto_bill_payment";
  const label =
    type === "booking"
      ? "Auto-send WhatsApp on booking confirmation"
      : "Auto-send WhatsApp invoice when bill is paid";

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
    } catch (err) {
      setSettings(prev);
      toast.error("Failed to update WhatsApp setting");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
      <Switch checked={settings[key]} onChange={handleToggle} disabled={saving} />
      <span>{label}</span>
    </div>
  );
}