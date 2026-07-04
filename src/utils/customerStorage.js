const STORAGE_KEY = "hotel_pos_customers";

function toEntry(customer) {
  return {
    id: customer.id,
    name: customer.name,
    contact: customer.contact,
    email: customer.email || null,
    updatedAt: Date.now(),
  };
}

export function getLocalCustomers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalCustomer(customer) {
  if (!customer?.id || !customer?.name) return;
  const list = getLocalCustomers();
  const entry = toEntry(customer);
  const idx = list.findIndex((c) => c.id === entry.id);
  if (idx >= 0) list[idx] = entry;
  else list.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function syncLocalCustomers(customers) {
  const entries = (customers || [])
    .filter((c) => c?.id && c?.name)
    .map(toEntry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function removeLocalCustomer(id) {
  const list = getLocalCustomers().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
