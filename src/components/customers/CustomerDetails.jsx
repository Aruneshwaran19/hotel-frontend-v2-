import React, { useEffect, useState } from "react";
import { FileText, CalendarCheck } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import CustomerAvatar from "../common/CustomerAvatar";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const pad = (n) => String(n).padStart(2, "0");

const formatBookingDate = (dbString) => {
  if (!dbString) return "—";
  const datePart = String(dbString).split(" ")[0];
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return datePart;
  return `${pad(d)} ${MONTHS[m - 1]} ${y}`;
};

const calcBookingTotal = (booking) => {
  const price = Number(booking.price) || 0;
  const discount = Number(booking.discount) || 0;
  return Math.max(price - discount, 0);
};

function parseDocuments(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return [value];
  }
}

function DocumentCard({ docPath }) {
  const url = `${API_BASE_URL}/${docPath}`;
  const ext = docPath.split(".").pop().toLowerCase();
  const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
  const filename = docPath.split("/").pop();

  if (isImage) {
    return (
      <div className="group relative overflow-hidden rounded-xl border border-gray-200 hover:border-blue-300 transition shadow-sm">
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img
            src={url}
            alt={filename}
            className="h-36 w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
        </a>
        <div className="px-2 py-1.5 bg-gray-50 border-t border-gray-100">
          <p className="text-[11px] text-gray-500 truncate">{filename}</p>
        </div>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-300 transition shadow-sm hover:opacity-80"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-800 text-white">
        <FileText size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{filename}</p>
        <p className="text-[11px] text-blue-500 font-medium">Click to view / download</p>
      </div>
    </a>
  );
}

export default function CustomerDetails({ customer, onClose }) {
  const documents = parseDocuments(customer.document);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    if (!customer?.id) return;

    const fetchBookings = async () => {
      setLoadingBookings(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${API_BASE_URL}/api/customers/${customer.id}/bookings`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setBookings(Array.isArray(res.data) ? res.data : []);
      } catch {
        setBookings([]);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookings();
  }, [customer?.id]);

  const totalSpent = bookings.reduce((sum, b) => sum + calcBookingTotal(b), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-3 sm:items-center sm:p-4">
      <div className="relative w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:max-h-[90vh] sm:p-6">

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <CustomerAvatar photo={customer.photo} name={customer.name} size="xl" />
            <div>
              <h3 className="text-2xl font-semibold text-gray-900">{customer.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {customer.contact}
                {customer.email ? ` • ${customer.email}` : ""}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
          <div>
            <div className="text-sm text-gray-500">ID Proof Type</div>
            <div className="font-medium">{customer.id_type || "—"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">ID Number</div>
            <div className="font-medium">{customer.id_number || "—"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Date of Birth</div>
            <div className="font-medium">{customer.dob || "—"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Vehicle Number</div>
            <div className="font-medium">{customer.vehicle_no || "—"}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-sm text-gray-500">Address</div>
            <div className="font-medium">{customer.address || "—"}</div>
          </div>

          <div className="sm:col-span-2">
            <div className="text-sm text-gray-500 mb-2">
              ID Proof Documents{" "}
              {documents.length > 0 && (
                <span className="ml-1 text-xs font-semibold text-gray-400">
                  ({documents.length} file{documents.length !== 1 ? "s" : ""})
                </span>
              )}
            </div>
            {documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documents.map((doc, idx) => (
                  <DocumentCard key={idx} docPath={doc} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No documents uploaded</p>
            )}
          </div>
        </div>

        {/* Booking history */}
        <div className="mt-6 border-t border-gray-100 pt-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck size={18} className="text-[#0A1B4D]" />
              <h4 className="text-sm font-semibold uppercase tracking-wide text-[#0A1B4D]">
                Booking History
              </h4>
            </div>
            {bookings.length > 0 && (
              <span className="text-xs text-gray-500">
                Total spent: ₹{totalSpent.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {loadingBookings ? (
            <p className="text-sm text-gray-500">Loading bookings…</p>
          ) : bookings.length === 0 ? (
            <p className="text-sm text-gray-400">No bookings found for this customer.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Check-in</th>
                    <th className="px-3 py-2 font-semibold">Check-out</th>
                    <th className="px-3 py-2 font-semibold">Room</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-t border-gray-100">
                      <td className="px-3 py-2.5 text-gray-700">
                        {formatBookingDate(booking.check_in)}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">
                        {formatBookingDate(booking.check_out)}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">
                        {booking.room_number ? `Room ${booking.room_number}` : "—"}
                        {booking.category ? (
                          <span className="block text-[11px] text-gray-400">{booking.category}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                          {booking.status || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-gray-800">
                        ₹{calcBookingTotal(booking).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
