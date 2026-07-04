import auth from "../auth/axiosInstance";

export async function sendBillViaWhatsApp(billingId) {
  if (!billingId) return { skipped: true };

  const response = await auth.post(`/billings/${billingId}/send-whatsapp`);
  return response.data;
}

export async function downloadBillingPdf(billingId, customerName) {
  if (!billingId) {
    throw new Error("Billing ID is required");
  }

  const response = await auth.get(`/billings/${billingId}/pdf`, {
    responseType: "blob",
  });

  const filename = `Hotel_Invoice_${billingId}_${Date.now()}.pdf`;
  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
