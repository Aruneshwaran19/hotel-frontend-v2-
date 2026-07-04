import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { Upload, X, FileText, Camera, RefreshCw, Image, Trash2, AlertTriangle } from "lucide-react";
import { API_BASE_URL } from "../../config";
import axiosInstance from "../../auth/axiosInstance";

const MAX_FILE_SIZE = 1 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = "1MB";

const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(String(phone || ""));
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function Label({ children }) {
  return (
    <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
      {children}
    </label>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 hover:border-gray-300 ${className}`}
      {...props}
    />
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmDeleteModal({ filename, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Red top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-400 to-red-600" />

        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 border-4 border-red-100">
              <Trash2 size={24} className="text-red-500" />
            </div>
          </div>

          {/* Text */}
          <h3 className="text-center text-base font-bold text-gray-900 mb-1">
            Delete Document?
          </h3>
          <p className="text-center text-sm text-gray-500 mb-1">
            You are about to delete
          </p>
          <p className="text-center text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg px-3 py-2 mb-4 truncate">
            {filename}
          </p>
          <p className="text-center text-xs text-red-500 flex items-center justify-center gap-1 mb-6">
            <AlertTriangle size={12} />
            This action cannot be undone.
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={deleting}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {deleting ? "Deleting…" : "Yes, Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoCapture({ photo, onPhotoChange }) {
  const [mode, setMode] = useState("idle");
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      setStream(mediaStream);
      setMode("camera");
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 50);
    } catch {
      toast.error("Could not access camera. Please check permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setMode("idle");
  }, [stream]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
      onPhotoChange(file);
      stopCamera();
      setMode("preview");
    }, "image/jpeg", 0.9);
  }, [onPhotoChange, stopCamera]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Photo must be under ${MAX_FILE_SIZE_LABEL}`);
      return;
    }
    onPhotoChange(file);
    setMode("preview");
    e.target.value = "";
  };

  const clearPhoto = () => {
    onPhotoChange(null);
    setMode("idle");
    stopCamera();
  };

  const previewUrl = useMemo(() => {
    if (photo instanceof File) return URL.createObjectURL(photo);
    if (typeof photo === "string" && photo) return `${API_BASE_URL}/${photo}`;
    return null;
  }, [photo]);

  useEffect(() => {
    if (!(photo instanceof File) || !previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [photo, previewUrl]);

  if (mode === "camera") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-black aspect-video">
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-40 w-32 rounded-full border-2 border-white/40 border-dashed" />
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={capturePhoto}
            className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-gray-700 active:scale-95"
          >
            <Camera size={13} /> Capture
          </button>
          <button
            type="button"
            onClick={stopCamera}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 transition hover:bg-gray-50"
          >
            <X size={13} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  if (photo && (mode === "preview" || photo instanceof File || (typeof photo === "string" && photo))) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <img
            src={previewUrl}
            alt="Customer photo"
            className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-md"
          />
          <button
            type="button"
            onClick={clearPhoto}
            className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 transition"
          >
            <X size={12} />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => { clearPhoto(); setTimeout(startCamera, 100); }}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition"
          >
            <RefreshCw size={12} /> Retake photo
          </button>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600 transition hover:bg-gray-50 hover:border-gray-300">
            <Upload size={12} /> Change photo
            <input type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 border-2 border-dashed border-gray-300">
        <Image size={28} className="text-gray-300" />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={startCamera}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600 transition hover:bg-gray-50 hover:border-gray-300"
        >
          <Camera size={12} /> Take Photo
        </button>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600 transition hover:bg-gray-50 hover:border-gray-300">
          <Upload size={12} /> Upload
          <input type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>
      <p className="text-[11px] text-gray-400">JPG, PNG · Max {MAX_FILE_SIZE_LABEL}</p>
    </div>
  );
}

function DocumentUpload({ documents, onAdd, onRemove }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const validateAndAddFiles = (files) => {
    const toAdd = Array.from(files || []);

    const invalid = toAdd.filter(
      (f) => !["image/jpeg", "image/png", "application/pdf"].includes(f.type),
    );
    if (invalid.length) {
      toast.error("Only JPG, PNG, or PDF files are allowed.");
    }

    const oversized = toAdd.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length) {
      toast.error(`Each file must be under ${MAX_FILE_SIZE_LABEL}.`);
    }

    const valid = toAdd.filter(
      (f) =>
        ["image/jpeg", "image/png", "application/pdf"].includes(f.type) &&
        f.size <= MAX_FILE_SIZE,
    );

    valid.forEach((f) => onAdd(f));
  };

  const handleFiles = (e) => {
    validateAndAddFiles(e.target.files);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Newly added documents list */}
      {documents.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {documents.map((doc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-800 text-white">
                  <FileText size={14} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-gray-900">{doc.name}</p>
                  <p className="text-[11px] text-gray-500">
                    {(doc.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-red-400 transition hover:bg-red-100 hover:text-red-600"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload / camera actions */}
      <div className="flex flex-col gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700 transition hover:border-gray-300 hover:bg-gray-100"
          >
            <Camera size={14} /> Take Photo
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700 transition hover:border-gray-300 hover:bg-gray-100"
          >
            <Upload size={14} /> Choose File
          </button>
        </div>
        <p className="text-center text-[11px] text-gray-400">
          {documents.length === 0
            ? "Upload ID proof — JPG, PNG, PDF"
            : `Add another document (${documents.length} uploaded)`}
          {" · Max "}
          {MAX_FILE_SIZE_LABEL}
          {" each"}
        </p>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFiles}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,image/*,application/pdf"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
      </div>
    </div>
  );
}


export default function CustomerForm({ onSave, onCancel, existing }) {
  const empty = {
    id: null,
    name: "",
    contact: "",
    email: "",
    id_type: "",
    id_number: "",
    id_files: [],
    existingDocs: [],
    address: "",
    vehicle_no: "",
    dob: "",
    photo: null,
  };

  const [c, setC] = useState(() => {
    if (!existing) return empty;
    return {
      ...empty,
      ...existing,
      contact: String(existing.contact || ""),
      email: existing.email || "",
      dob: existing.dob ? String(existing.dob).slice(0, 10) : "",
      photo: existing.photo || null,
      id_files: [],
      existingDocs: existing.document
        ? Array.isArray(existing.document)
          ? existing.document
          : [existing.document]
        : [],
    };
  });

  const [saving, setSaving] = useState(false);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, docPath: null, deleting: false });

  const set = (key) => (e) =>
    setC((prev) => ({ ...prev, [key]: e.target.value }));

  const addDocument = (file) =>
    setC((prev) => ({ ...prev, id_files: [...prev.id_files, file] }));

  const removeDocument = (idx) =>
    setC((prev) => ({
      ...prev,
      id_files: prev.id_files.filter((_, i) => i !== idx),
    }));

  const openDeleteConfirm = (docPath) => {
    setConfirmModal({ open: true, docPath, deleting: false });
  };

  const closeDeleteConfirm = () => {
    setConfirmModal({ open: false, docPath: null, deleting: false });
  };

  const confirmDeleteDocument = async () => {
    const docPath = confirmModal.docPath;
    setConfirmModal((prev) => ({ ...prev, deleting: true }));
    try {
      await axiosInstance.request({
        method: "DELETE",
        url: `/customers/${existing.id}/document`,
        data: { docPath },
      });
      setC((prev) => ({
        ...prev,
        existingDocs: prev.existingDocs.filter((d) => d !== docPath),
      }));
      toast.success("Document deleted");
      closeDeleteConfirm();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to delete document");
      setConfirmModal((prev) => ({ ...prev, deleting: false }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const name = String(c.name || "").trim();
    const contact = String(c.contact || "").trim();
    const email = String(c.email || "").trim();

    if (!name) { toast.error("Full Name is required"); return; }
    if (!contact) { toast.error("Contact Number is required"); return; }
    if (!isValidPhone(contact)) { toast.error("Enter a valid 10-digit mobile number"); return; }
    if (email && !isValidEmail(email)) { toast.error("Enter a valid email address"); return; }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("contact", contact);
    formData.append("email", email);
    formData.append("id_type", c.id_type || "");
    formData.append("id_number", c.id_number || "");
    formData.append("address", c.address || "");
    formData.append("vehicle_no", c.vehicle_no || "");
    formData.append("dob", c.dob ? String(c.dob).slice(0, 10) : "");

    c.id_files.forEach((file) => {
      formData.append("document", file);
    });

    if (c.photo instanceof File) formData.append("photo", c.photo);
    if (!c.photo && existing?.photo) formData.append("remove_photo", "true");

    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Confirm Delete Modal */}
      {confirmModal.open && (
        <ConfirmDeleteModal
          filename={confirmModal.docPath?.split("/").pop()}
          onConfirm={confirmDeleteDocument}
          onCancel={closeDeleteConfirm}
          deleting={confirmModal.deleting}
        />
      )}

      <form onSubmit={submit} noValidate className="flex min-h-0 flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            {existing ? "Edit Customer" : "Add New Customer"}
          </h3>
          <div className="mt-1.5 h-px bg-gradient-to-r from-gray-200 to-transparent" />
        </div>

        <Field label="Customer Photo (optional)">
          <div className="rounded-xl border border-gray-100 bg-gray-50 py-4 flex justify-center">
            <PhotoCapture
              photo={c.photo}
              onPhotoChange={(file) => setC((prev) => ({ ...prev, photo: file }))}
            />
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={<>Full Name <span className="text-red-500 normal-case">*</span></>}>
            <Input placeholder="Enter full name" value={c.name} onChange={set("name")} />
          </Field>
          <Field label={<>Contact <span className="text-red-500 normal-case">*</span></>}>
            <Input
              placeholder="10-digit mobile"
              value={c.contact}
              maxLength={10}
              onChange={(e) =>
                setC((prev) => ({ ...prev, contact: e.target.value.replace(/\D/g, "") }))
              }
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Email (optional)">
            <Input
              type="text"
              inputMode="email"
              placeholder="example@email.com"
              value={c.email || ""}
              onChange={set("email")}
            />
          </Field>
          <Field label="Date of Birth (optional)">
            <Input type="date" value={c.dob} onChange={set("dob")} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="ID Proof Type (optional)">
            <div className="relative">
              <select
                value={c.id_type}
                onChange={set("id_type")}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 hover:border-gray-300 cursor-pointer pr-8"
              >
                <option value="">Select type</option>
                <option value="Aadhar">Aadhaar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </div>
          </Field>
          <Field label="ID Number (optional)">
            <Input placeholder="Enter ID number" value={c.id_number} onChange={set("id_number")} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Address (optional)">
            <Input placeholder="Enter address" value={c.address} onChange={set("address")} />
          </Field>
          <Field label="Vehicle Number (optional)">
            <Input
              placeholder="e.g. TN01AB1234"
              value={c.vehicle_no}
              onChange={(e) =>
                setC((prev) => ({ ...prev, vehicle_no: e.target.value.toUpperCase() }))
              }
              className="uppercase"
            />
          </Field>
        </div>

        {/* ── Document section ── */}
        <Field label="ID Proof Upload (optional)">

          {/* Existing saved documents — shown only in edit mode */}
          {c.existingDocs && c.existingDocs.length > 0 && (
            <div className="flex flex-col gap-1.5 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                Saved Documents
              </p>
              {c.existingDocs.map((docPath, idx) => {
                const filename = docPath.split("/").pop();
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-700 text-white">
                        <FileText size={14} />
                      </div>
                      <div className="min-w-0">
                        <a
                          href={`${API_BASE_URL}/${docPath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-xs font-medium text-blue-700 hover:underline block"
                        >
                          {filename}
                        </a>
                        <p className="text-[11px] text-gray-400">Saved</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openDeleteConfirm(docPath)}
                      className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-red-400 transition hover:bg-red-100 hover:text-red-600"
                      title="Delete document"
                    >
                      <X size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* New document uploads */}
          <DocumentUpload
            documents={c.id_files}
            onAdd={addDocument}
            onRemove={removeDocument}
          />
        </Field>

        <div className="sticky bottom-0 z-10 -mx-4 flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 bg-white px-4 pt-3 pb-2 sm:-mx-6 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-600 transition hover:bg-gray-50 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-gray-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-gray-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? "Saving…" : existing ? "Update Customer" : "Save Customer"}
          </button>
        </div>
      </form>
    </>
  );
}
