OH MY CAKE BY ABI — SUPABASE INTEGRATED PROJECT

Active application: ./frontend
Supabase backend source: ./supabase
Original demo preserved: ./original-demo

WHAT WAS FIXED
- Live Products, ProductStock, Reviews, SiteContent and Settings reads.
- Cake stock is loaded per baked weight and revalidated in the cart.
- Dashboard session is restored from Supabase Auth and role is read from AdminUsers.
- Shared Admin/Client login uses the admin-login Edge Function.
- Product/stock/order/custom-request/admin CRUD is wired through protected admin-api operations.
- Custom cake requests now submit to Supabase and can upload a reference image to Google Drive when Drive secrets are configured.
- Catalog pickup/pay-at-store orders use the create-order Edge Function and atomic PostgreSQL function.
- Booking-window validation is server-side (9 AM–10 PM, 2-hour minimum, 10-day maximum).
- Offer validation is server-side.
- Delivery radius validation is server-side when Google Maps server key + store coordinates are configured.
- Admin Offers, Reviews, Site Content, Settings and Admin Accounts screens are functional.
- Product image upload is prepared for Google Drive; the dashboard no longer asks admins to paste image URLs.
- Online payment remains intentionally disabled until the client selects Razorpay, PayU or Instamojo, as required by the project specification.
- WhatsApp/email provider integration remains provider-configurable and secret-only; no credentials are included.

FRONTEND
cd frontend
npm install
npm run dev

Create frontend/.env from .env.example:
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
VITE_GOOGLE_MAPS_API_KEY=
VITE_SHOP_PHONE=
VITE_SHOP_WHATSAPP=
VITE_SHOP_EMAIL=

SUPABASE SQL
1. Open Supabase SQL Editor.
2. Confirm the ten application tables and RLS policies already exist.
3. Run: supabase/migrations/20260911_backend_functions.sql

EDGE FUNCTIONS
Deploy these functions:
- admin-login
- public-api
- create-order
- custom-cake-request
- admin-api
- upload-image

Recommended Supabase CLI flow:
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy admin-login --no-verify-jwt
supabase functions deploy public-api --no-verify-jwt
supabase functions deploy create-order --no-verify-jwt
supabase functions deploy custom-cake-request --no-verify-jwt
supabase functions deploy admin-api
supabase functions deploy upload-image

EDGE FUNCTION SECRETS
Required by the functions themselves:
SUPABASE_SERVICE_ROLE_KEY (Supabase normally provides this to Edge Functions)

For delivery verification:
GOOGLE_MAPS_SERVER_KEY=...
SHOP_LATITUDE=...
SHOP_LONGITUDE=...

For Google Drive uploads:
GOOGLE_SERVICE_ACCOUNT_JSON={...service account JSON...}
GOOGLE_DRIVE_FOLDER_ID=...

Never put SUPABASE_SERVICE_ROLE_KEY, payment keys, WhatsApp credentials or Google service-account credentials in the frontend .env.

AUTH SETUP
Create two Supabase Auth users, then insert matching AdminUsers rows:
- one Role = admin
- one Role = client
AdminUsers stores Username, AuthUserID, AuthEmail and Role only. It never stores passwords or password hashes.

CURRENT PAYMENT LIMIT
The frontend intentionally supports Pickup + Pay at Store now. Delivery and pickup-pay-online require the real payment gateway before they can be enabled, because the specification requires Orders to be written only after successful online payment.

PRODUCTION BUILD
cd frontend
npm run build

The resulting frontend is in frontend/dist.

NOTIFICATIONS
The send-notifications Edge Function is included with a swappable provider interface.
Email: set RESEND_API_KEY and EMAIL_FROM.
WhatsApp: choose a provider by setting WHATSAPP_PROVIDER. The included adapter supports Meta Cloud API with WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.
Internal function calls use INTERNAL_FUNCTION_SECRET.
The actual WhatsApp vendor remains a project decision, so do not treat notification setup as live until the provider credentials and templates/policies are configured and tested.
