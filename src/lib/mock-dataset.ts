// Deterministic 1000-row dataset across CUSTOMERS / ORDERS / ORDER_ITEMS.
// Intentionally messy: NULL emails, duplicate customer_ids, out-of-range dates.

export interface Customer {
  customer_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  country: string;
}
export interface Order {
  order_id: number;
  customer_id: number;
  order_date: string;
  total_amount: number;
  status: string;
}
export interface OrderItem {
  item_id: number;
  order_id: number;
  product_name: string;
  price: number;
  quantity: number;
}

const FIRST = ["Aarav", "Priya", "John", "Maria", "Yuki", "Liam", "Sofia", "Arjun", "Emma", "Noah", "Mia", "Wei", "Hana", "Omar", "Zara"];
const LAST = ["Patel", "Kumar", "Smith", "Garcia", "Tanaka", "Brown", "Khan", "Singh", "Lee", "Müller", "Rossi", "Wang", "Silva", "Cohen"];
const COUNTRIES = ["IN", "US", "UK", "DE", "JP", "BR", "FR", "CA", "AU", "SG"];
const PRODUCTS = ["USB-C Cable", "Mechanical Keyboard", "27\" Monitor", "Webcam HD", "Noise-Cancel Headphones", "Standing Desk", "Office Chair", "SSD 1TB", "Laptop Stand", "Mouse Pad XL", "Wireless Mouse", "HDMI Switch"];
const STATUS = ["pending", "shipped", "delivered", "cancelled", "returned"];

// Tiny seedable PRNG for determinism
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
const r = rng(42);
const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];

function buildCustomers(): Customer[] {
  const rows: Customer[] = [];
  for (let i = 1; i <= 250; i++) {
    rows.push({
      customer_id: i,
      first_name: pick(FIRST),
      last_name: pick(LAST),
      email: r() < 0.12 ? null : `user${i}@mail.com`,
      country: pick(COUNTRIES),
    });
  }
  // Inject ~15 duplicate customer_ids (messy data)
  for (let k = 0; k < 15; k++) {
    const dupId = 1 + Math.floor(r() * 250);
    rows.push({
      customer_id: dupId,
      first_name: pick(FIRST),
      last_name: pick(LAST),
      email: r() < 0.4 ? null : `dup${dupId}_${k}@mail.com`,
      country: pick(COUNTRIES),
    });
  }
  return rows;
}

function buildOrders(custCount: number): Order[] {
  const rows: Order[] = [];
  for (let i = 1; i <= 400; i++) {
    const yr = r() < 0.05 ? 1899 + Math.floor(r() * 50) : 2023 + Math.floor(r() * 3); // 5% out-of-range
    const mo = 1 + Math.floor(r() * 12);
    const da = 1 + Math.floor(r() * 28);
    rows.push({
      order_id: i,
      customer_id: 1 + Math.floor(r() * custCount),
      order_date: `${yr}-${String(mo).padStart(2, "0")}-${String(da).padStart(2, "0")}`,
      total_amount: Math.round(r() * 50000) / 100,
      status: pick(STATUS),
    });
  }
  return rows;
}

function buildItems(orderCount: number): OrderItem[] {
  const rows: OrderItem[] = [];
  let id = 1;
  for (let oid = 1; oid <= orderCount; oid++) {
    const n = 1 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      rows.push({
        item_id: id++,
        order_id: oid,
        product_name: pick(PRODUCTS),
        price: Math.round(r() * 30000) / 100,
        quantity: 1 + Math.floor(r() * 5),
      });
    }
  }
  return rows;
}

export const customers = buildCustomers();
export const orders = buildOrders(250);
export const orderItems = buildItems(400).slice(0, 1000 - customers.length - orders.length);

export const TOTAL_ROWS = customers.length + orders.length + orderItems.length;

export const SCHEMA_SQL = `CREATE TABLE CUSTOMERS (
  customer_id   INT PRIMARY KEY,
  first_name    VARCHAR(50),
  last_name     VARCHAR(50),
  email         VARCHAR(120),
  country       CHAR(2)
);
CREATE TABLE ORDERS (
  order_id      INT PRIMARY KEY,
  customer_id   INT,
  order_date    DATE,
  total_amount  DECIMAL(10,2),
  status        VARCHAR(20),
  FOREIGN KEY (customer_id) REFERENCES CUSTOMERS(customer_id)
);
CREATE TABLE ORDER_ITEMS (
  item_id       INT PRIMARY KEY,
  order_id      INT,
  product_name  VARCHAR(100),
  price         DECIMAL(10,2),
  quantity      INT,
  FOREIGN KEY (order_id) REFERENCES ORDERS(order_id)
);`;

export const ERD_MERMAID = `erDiagram
    CUSTOMERS ||--o{ ORDERS : places
    ORDERS ||--o{ ORDER_ITEMS : contains
    CUSTOMERS {
        int customer_id PK
        string first_name
        string last_name
        string email
        string country
    }
    ORDERS {
        int order_id PK
        int customer_id FK
        date order_date
        decimal total_amount
        string status
    }
    ORDER_ITEMS {
        int item_id PK
        int order_id FK
        string product_name
        decimal price
        int quantity
    }`;

// Data-quality metrics
export function dataQuality() {
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const dateOk = (d: string) => {
    const y = +d.slice(0, 4);
    return y >= 2000 && y <= 2030;
  };
  const emailNonNull = customers.filter((c) => c.email !== null).length;
  const emailValid = customers.filter((c) => c.email && emailRe.test(c.email)).length;
  const ids = customers.map((c) => c.customer_id);
  const dupCount = ids.length - new Set(ids).size;
  const validDates = orders.filter((o) => dateOk(o.order_date)).length;

  return {
    customers: customers.length,
    orders: orders.length,
    items: orderItems.length,
    emailCompleteness: (emailNonNull / customers.length) * 100,
    emailValidity: (emailValid / customers.length) * 100,
    dateValidity: (validDates / orders.length) * 100,
    duplicateCustomerIds: dupCount,
  };
}
