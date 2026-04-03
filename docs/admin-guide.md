# Medtech Solutions — Admin User Guide

## Getting Started

### Logging In

1. Go to `https://medtech-solutions-mauve.vercel.app/admin/login`
2. Enter your email and password
3. Click **Sign In**

If this is your first time, click **Sign up** to create your account. The first person to sign up is automatically made Super Admin.

---

## Dashboard

The dashboard is your home base. It shows:

- **Total Products** — how many products are in the catalog
- **Out of Stock** — products with zero stock (highlighted in red)
- **Per-category counts** — how many products in each category

### Navigation buttons

| Button | Goes to |
|---|---|
| Repair Services | Manage repair service listings |
| Orders | View and manage customer orders |
| Reviews | Approve or delete customer reviews |
| Manage Admins | Add or remove admin users (Super Admin only) |
| + New Product | Add a new product |
| Sign Out | Log out |

---

## Managing Products

### Adding a Product

1. Click **+ New Product** from the dashboard
2. Fill in all required fields:
   - **Name** — product name
   - **Category** — Phones, Laptops, Desktops, Accessories, Medical Equipment, or Others
   - **Description** — detailed product description
   - **Original Price** — the full price in KES
   - **Discounted Price** *(optional)* — sale price, must be less than original
   - **Max Price** *(optional)* — for price ranges e.g. KSh 30,000 – 45,000
   - **Offer Price** *(optional)* — limited-time flash sale price
   - **Offer Expires At** *(optional)* — when the offer ends (countdown shows on the product)
   - **Stock Quantity** — how many units are available
   - **Low Stock Warning** — show "Only X left" badge when stock drops to this number (default: 5)
   - **Feature on homepage** — tick this to show the product in the Featured section
3. Upload at least one image using **+ Add files**
4. Click **Create Product**

### Editing a Product

1. Find the product in the dashboard table
2. Click **Edit**
3. Make your changes
4. Click **Save Changes**

### Deleting a Product

1. Find the product in the dashboard table
2. Click **Delete**
3. Confirm the deletion

> ⚠️ Deletion is permanent and cannot be undone.

---

## Managing Orders

Go to **Orders** from the dashboard.

### Order statuses

| Status | Meaning |
|---|---|
| Pending | Order placed, awaiting your confirmation |
| Confirmed | You've confirmed the order |
| Dispatched | Order has been shipped |
| Delivered | Customer has received the order |
| Cancelled | Order was cancelled |

### Payment statuses

| Status | Meaning |
|---|---|
| Unpaid | No payment received (pay on delivery) |
| Partial | Deposit paid |
| Paid | Fully paid |
| Refunded | Money returned to customer |

### Updating an order

1. Click the **▼** arrow to expand an order
2. Use the **Order Status** dropdown to update the status
3. Use the **Payment Status** dropdown to mark payment

### Searching orders

Use the search box to find orders by:
- Reference number (e.g. `ORD-260401-4823`)
- Customer name
- Customer phone number

---

## Managing Repair Services

Go to **Repair Services** from the dashboard.

### Adding a service

1. Fill in the form:
   - **Service Name** — e.g. "Screen Replacement"
   - **Description** — what the service involves
   - **Estimated Turnaround** — e.g. "1–2 hours"
2. Optionally upload photos or videos of the service
3. Click **Add Service**

### Editing a service

Click **Edit** next to the service, make changes, click **Save Changes**.

### Deleting a service

Click **Delete** next to the service and confirm.

---

## Managing Reviews

Go to **Reviews** from the dashboard.

Reviews submitted by customers are **not shown publicly** until you approve them.

### Approving a review

Click **Approve** — the review will appear on the product page immediately.

### Deleting a review

Click **Delete** to permanently remove a review.

Use the tabs to filter: **Pending** (needs approval), **Approved** (live), **All**.

---

## Managing Admins

*(Super Admin only)*

Go to **Manage Admins** from the dashboard.

### Adding an admin

1. The new admin must first create an account at `/admin/login` → Sign up
2. Once they have an account, enter their email in the **Add Admin** form
3. Click **Add Admin**

They can now log in and access the admin panel.

### Removing an admin

Click **Remove** next to their name. You cannot remove yourself or other Super Admins.

---

## Tips

- **Featured products** appear in a dedicated section at the top of the homepage. Use this for your best-selling or promoted items.
- **Low stock threshold** — set this per product. When stock drops to or below this number, customers see "Only X left" on the product card.
- **Offer countdown** — if you set an offer price and expiry time, a live countdown timer appears on the product card and detail page.
- **Order references** — every WhatsApp order gets a reference like `ORD-260401-4823`. Use this to match WhatsApp messages to orders in the dashboard.
