import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";

import BillingModal from "./BillingModal";
import Pagination from "./Pagination";
import SearchInput from "../common/SearchInput";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Download, MoreVertical, Eye, Trash2, CheckCircle2 } from "lucide-react";
import CustomerAvatar from "../common/CustomerAvatar";

const PAGE_SIZE = 8;

// ─── BILLED BY CELL ────
function BilledByCell({ billedBy }) {
  const name = billedBy && billedBy.trim() !== "" ? billedBy : "Admin User";
  const initial = name[0].toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600 uppercase">
        {initial}
      </span>
      <span className="text-sm text-gray-700 whitespace-nowrap">{name}</span>
    </div>
  );
}

// ─── TABLE ROW ─────────
function BillRow({ bill, onOpen, onDeleteComplete, onTogglePaid, onSendWhatsapp }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const isPaid = bill.payment_status === "paid";

  const formattedDate = bill.created_at
    ? new Date(bill.created_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
      <td className="py-3 pl-4 pr-3 text-sm font-medium text-gray-700 whitespace-nowrap">
        #{bill.id}
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <span className="inline-block rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
          {bill.booking_id}
        </span>
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <CustomerAvatar
            photo={bill.customer_photo}
            name={bill.customer_name}
            size="md"
          />
          <span className="text-sm font-medium text-gray-800">
            {bill.customer_name || "—"}
          </span>
        </div>
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] text-gray-500">
            ⌂
          </span>
          <span className="text-sm text-gray-700">
            {bill.room_number ? bill.room_number : "—"}
          </span>
        </div>
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="text-sm text-gray-700">{formattedDate}</div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          Created
        </div>
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-800">
          ₹{Number(bill.advance_paid || 0).toLocaleString("en-IN")}
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-green-600">
          Paid
        </div>
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <BilledByCell billedBy={bill.billed_by} />
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="text-sm font-bold text-gray-900">
          ₹{Number(bill.total_amount || 0).toLocaleString("en-IN")}
        </div>
        <div
          className={`text-[10px] font-semibold uppercase tracking-wide ${
            isPaid ? "text-green-600" : "text-red-500"
          }`}
        >
          {isPaid ? "Paid" : "Not Paid"}
        </div>
      </td>

      {/* Actions */}
      <td className="py-3 pl-3 pr-4 whitespace-nowrap">
        <div className="relative flex justify-end">
          <button
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setMenuPos({ top: rect.bottom + 4, left: rect.right - 192 });
              setMenuOpen((p) => !p);
              setConfirmDelete(false);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <>
              {/* invisible backdrop to close on outside click */}
              <div
                className="fixed inset-0 z-[998]"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmDelete(false);
                }}
              />
              <div
                style={{
                  position: "fixed",
                  top: menuPos.top,
                  left: menuPos.left,
                  zIndex: 999,
                  width: 192,
                }}
                className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
              >
                {isPaid && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpen(bill);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50"
                  >
                    <Eye size={14} /> Generate Bill
                  </button>
                )}

                {isPaid && (
                  <button
                    disabled={sendingWhatsapp}
                    onClick={async () => {
                      setSendingWhatsapp(true);
                      await onSendWhatsapp(bill);
                      setSendingWhatsapp(false);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12.017 2C6.484 2 2 6.485 2 12.017c0 1.86.502 3.61 1.377 5.11L2 22l4.998-1.351a9.965 9.965 0 0 0 5.02 1.351h.004C17.55 22 22 17.514 22 12.017 22 6.485 17.55 2 12.017 2zm5.885 15.885a8.354 8.354 0 0 1-5.885 2.44H12a8.36 8.36 0 0 1-4.264-1.166l-.306-.183-3.176.86.848-3.096-.2-.318A8.348 8.348 0 0 1 3.67 12.02c0-4.605 3.744-8.35 8.35-8.35 2.23 0 4.326.87 5.902 2.448a8.29 8.29 0 0 1 2.447 5.9c0 2.23-.87 4.326-2.467 5.867z"/></svg>
                    {sendingWhatsapp ? "Sending..." : "Send Bill on WhatsApp"}
                  </button>
                )}

                {!isPaid && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onTogglePaid(bill);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-green-600 hover:bg-green-50"
                  >
                    <CheckCircle2 size={14} /> Mark as Paid
                  </button>
                )}

                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} /> Delete Bill
                  </button>
                ) : (
                  <div className="px-3 py-2 bg-red-50 border-t border-red-100">
                    <p className="text-xs text-red-600 font-medium mb-2">
                      Sure you want to delete?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          axios
                            .delete(`${API_BASE_URL}/api/billings/${bill.id}`, {
                              withCredentials: true,
                            })
                            .then(() => {
                              toast.success("Bill deleted successfully");
                              setMenuOpen(false);
                              setConfirmDelete(false);
                              if (onDeleteComplete) onDeleteComplete(bill.id);
                            })
                            .catch((err) => {
                              console.error(err);
                              toast.error("Failed to delete bill");
                            });
                        }}
                        className="flex-1 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300"
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── BILLING LIST ───────
const BillingList = () => {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const [billings, setBillings] = useState([]);
  const [filteredBillings, setFilteredBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBill, setSelectedBill] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [availableAddOns, setAvailableAddOns] = useState([]);
  const [form, setForm] = useState({
    room_price: 0,
    add_ons: [],
    kitchen_orders: [],
    discount: 0,
  });

  const removeBillFromUi = (billId) => {
    setBillings((prev) => prev.filter((b) => b.id !== billId));
    setFilteredBillings((prev) => prev.filter((b) => b.id !== billId));
  };

  const handleTogglePaid = async (bill) => {
    const nextStatus = bill.payment_status === "paid" ? "unpaid" : "paid";
    try {
      await axios.patch(
        `${API_BASE_URL}/api/billings/${bill.id}/payment-status`,
        { status: nextStatus },
      );
      const applyStatus = (list) =>
        list.map((b) =>
          b.id === bill.id ? { ...b, payment_status: nextStatus } : b,
        );
      setBillings(applyStatus);
      setFilteredBillings(applyStatus);
      toast.success(
        nextStatus === "paid" ? "Bill marked as paid" : "Bill marked as not paid",
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update payment status");
    }
  };

  const handleSendWhatsapp = async (bill) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/billings/${bill.id}/send-whatsapp`,
      );
      if (res.data?.skipped) {
        toast.error(res.data?.message || "WhatsApp is not configured");
        return;
      }
      toast.success("Bill sent on WhatsApp");
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.error || "Failed to send bill on WhatsApp",
      );
    }
  };

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/billings`);
      const billsArray = res.data?.billings || res.data || [];
      if (!Array.isArray(billsArray)) {
        toast.error("Invalid response format");
        setBillings([]);
        setFilteredBillings([]);
        return;
      }
      setBillings(billsArray);
      setFilteredBillings(billsArray);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch bills");
    } finally {
      setLoading(false);
    }
  };

  const fetchAddOns = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/addons`);
      setAvailableAddOns(res.data || []);
    } catch (err) {
      console.error("Failed to fetch add-ons", err);
    }
  };

  useEffect(() => {
    fetchBills();
    fetchAddOns();
  }, []);

  useEffect(() => {
    setSearchLoading(true);
    const timer = setTimeout(() => {
      if (!search.trim()) {
        setFilteredBillings(billings);
      } else {
        const text = search.toLowerCase();
        setFilteredBillings(
          billings.filter(
            (b) =>
              b.booking_id?.toLowerCase().includes(text) ||
              b.customer_name?.toLowerCase().includes(text),
          ),
        );
      }
      setCurrentPage(1);
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, billings]);

  const parseBillAddOns = (addOns) => {
    if (!Array.isArray(addOns)) return [];
    return addOns.map((a) => ({
      name: a.name,
      qty: Number(a.qty) || 1,
      price: Number(a.price) || 0,
    }));
  };

  const openModal = async (bill) => {
    if (!bill?.id) {
      toast.error("Invalid bill");
      return;
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/api/billings/${bill.id}`);
      setSelectedBill(res.data);
      const roomCharges = (res.data.lines?.room ?? []).reduce(
        (sum, item) => sum + Number(item?.total || 0),
        0,
      );
      setForm({
        room_price: roomCharges,
        add_ons: parseBillAddOns(res.data.add_ons),
        kitchen_orders: res.data.kitchen_orders || [],
        discount: Number(res.data.discount || 0),
      });
      setModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch bill details");
    }
  };

  const handleModalDeleteComplete = (billId) => {
    removeBillFromUi(billId);
    setSelectedBill(null);
    setModalOpen(false);
  };

  const handleExportCSV = async () => {
    if (!isAdmin) return;
    try {
      if (
        exportStartDate &&
        exportEndDate &&
        new Date(exportStartDate) > new Date(exportEndDate)
      ) {
        toast.error("Start date cannot be after end date");
        return;
      }
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (exportStartDate) params.set("startDate", exportStartDate);
      if (exportEndDate) params.set("endDate", exportEndDate);

      const exportUrl = params.toString()
        ? `${API_BASE_URL}/api/billings/export/csv?${params.toString()}`
        : `${API_BASE_URL}/api/billings/export/csv`;

      const response = await fetch(exportUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "billing-statements.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      toast.error("Failed to export CSV");
    }
  };

  const totalPages = Math.ceil(filteredBillings.length / PAGE_SIZE);
  const paginatedBills = filteredBillings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Billing
        </h1>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm sm:flex-none sm:w-auto"
              />
              <input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm sm:flex-none sm:w-auto"
              />
              <button
                onClick={handleExportCSV}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#020617] active:scale-95"
              >
                <Download size={15} />
                Export CSV
              </button>
            </div>
          )}

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search bookings or customers..."
            className="w-full sm:w-64 md:w-80"
          />
        </div>
      </div>

      {/* ── Content ── */}
      {loading || searchLoading ? (
        <LoadingSpinner />
      ) : paginatedBills.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-gray-400 text-sm">No billing records found.</p>
        </div>
      ) : (
        <>
          {/* ── Scrollable Table (all screen sizes) ── */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[780px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    {[
                      "Bill ID",
                      "Booking ID",
                      "Customer",
                      "Room",
                      "Date",
                      "Advance",
                      "Billed By",
                      "Total",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 first:pl-4 last:pr-4 last:text-right whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedBills.map((bill) => (
                    <BillRow
                      key={bill.id}
                      bill={bill}
                      onOpen={openModal}
                      onDeleteComplete={removeBillFromUi}
                      onTogglePaid={handleTogglePaid}
                      onSendWhatsapp={handleSendWhatsapp}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">
              Showing{" "}
              <span className="font-semibold text-gray-600">
                {filteredBillings.length}
              </span>{" "}
              records
            </div>
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* ── Modal ── */}
      <BillingModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedBill(null);
        }}
        selectedBill={selectedBill}
        form={form}
        setForm={setForm}
        availableAddOns={availableAddOns}
        onDeleteComplete={handleModalDeleteComplete}
      />
    </div>
  );
};

export default BillingList;