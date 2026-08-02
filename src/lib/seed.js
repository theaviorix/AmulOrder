import { suppliers, customers, links, products, orders, bills } from "./api";

const FLAG = "amul_seeded_v1";

export function maybeSeed() {
  if (localStorage.getItem(FLAG)) return;
  localStorage.setItem(FLAG, "1");

  const sup = suppliers.create({
    name: "Sharma Dairy Suppliers",
    owner_name: "Rakesh Sharma",
    phone: "98250 11224",
    address: "Plot 14, Dairy Lane, Anand, Gujarat",
    gstin: "24ABCDE1234F1Z5",
    invite_code: "SHARMA-482",
  });

  const seedProducts = [
    { name: "Amul Gold Milk", unit: "litre", price: 62 },
    { name: "Amul Taaza", unit: "litre", price: 54 },
    { name: "Amul Butter", unit: "pc", price: 56 },
    { name: "Amul Cheese", unit: "pc", price: 120 },
    { name: "Amul Ghee", unit: "pc", price: 620 },
    { name: "Amul Curd", unit: "kg", price: 70 },
    { name: "Amul Buttermilk", unit: "pc", price: 18 },
  ];
  const createdProducts = seedProducts.map((p) =>
    products.create({ supplier_id: sup.id, ...p, active: true, in_stock: true })
  );
  // one out of stock
  products.update(createdProducts[3].id, { in_stock: false });

  // customers
  const c1 = customers.create({ name: "Krushna Provision", owner_name: "Anna", phone: "98700 22113", address: "Main Bazar, Anand", supplier_id: sup.id });
  const c2 = customers.create({ name: "Sai General Store", owner_name: "Mohan", phone: "98700 55412", address: "College Rd, Anand", supplier_id: sup.id });
  const c3 = customers.create({ name: "Anand Mart", owner_name: "Priya", phone: "98700 77881", address: "Town Hall, Anand", supplier_id: sup.id });
  links.create({ supplier_id: sup.id, customer_id: c1.id, customer_name: c1.name, status: "active", invite_code: sup.invite_code });
  links.create({ supplier_id: sup.id, customer_id: c2.id, customer_name: c2.name, status: "active", invite_code: sup.invite_code });
  links.create({ supplier_id: sup.id, customer_id: c3.id, customer_name: c3.name, status: "pending", invite_code: sup.invite_code });

  // orders + bills
  const mkItems = (idxs, qties) =>
    idxs.map((i, k) => ({ product_name: createdProducts[i].name, unit: createdProducts[i].unit, price: createdProducts[i].price, quantity: qties[k] }));

  const o1 = orders.create({ supplier_id: sup.id, customer_id: c1.id, customer_name: c1.name, slot: "AM", status: "accepted", items: mkItems([0, 1, 4], [10, 5, 1]), total: 0, adjusted: false });
  orders.update(o1.id, { total: o1.items.reduce((s, it) => s + it.quantity * it.price, 0) });
  const o2 = orders.create({ supplier_id: sup.id, customer_id: c2.id, customer_name: c2.name, slot: "AM", status: "placed", items: mkItems([0, 5, 6], [8, 3, 6]), total: 0 });
  orders.update(o2.id, { total: o2.items.reduce((s, it) => s + it.quantity * it.price, 0) });
  const o3 = orders.create({ supplier_id: sup.id, customer_id: c1.id, customer_name: c1.name, slot: "PM", status: "dispatched", items: mkItems([2, 3], [4, 2]), total: 0 });
  orders.update(o3.id, { total: o3.items.reduce((s, it) => s + it.quantity * it.price, 0) });
  const o4 = orders.create({ supplier_id: sup.id, customer_id: c1.id, customer_name: c1.name, slot: "PM", status: "billed", items: mkItems([0, 1, 2, 5], [12, 6, 3, 2]), total: 0 });
  orders.update(o4.id, { total: o4.items.reduce((s, it) => s + it.quantity * it.price, 0) });
  const bill4 = bills.createForOrder(o4);
  bills.recordPayment(bill4.id, 1500, sup.id);
}

// helper for quickly entering as the demo supplier
export function enterDemoSupplier() {
  const sup = suppliers.getByInviteCode("SHARMA-482");
  if (sup) localStorage.setItem("amul_connect_session", JSON.stringify({ role: "supplier", id: sup.id, name: sup.name, inviteCode: sup.invite_code }));
}