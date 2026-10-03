/**
 * Polish & Glow — modelo de dados (Drizzle ORM / PostgreSQL)
 * Todas as datas/horas são guardadas em UTC; o salão funciona em Europe/Lisbon.
 * Dias da semana: 0 = segunda … 6 = domingo. Horas do dia em minutos (540 = 09:00).
 */
import {
  pgTable, pgEnum, text, integer, boolean, timestamp, primaryKey, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const stamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
};

export const appointmentStatus = pgEnum("appointment_status", ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]);
export const bookingSource = pgEnum("booking_source", ["ONLINE", "ADMIN"]);

export const adminUsers = pgTable("admin_users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  /** true = tem de escolher uma password nova no próximo login (ex.: password inicial) */
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  ...stamps,
});

export const staff = pgTable("staff", {
  id: id(),
  name: text("name").notNull(),
  role: text("role").notNull().default("Técnica"),
  photoUrl: text("photo_url"),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  workDays: integer("work_days").array().notNull().default(sql`'{0,1,2,3,4,5}'::int[]`),
  startMin: integer("start_min").notNull().default(540),
  endMin: integer("end_min").notNull().default(1140),
  absenceNote: text("absence_note"),
  ...stamps,
});

export const services = pgTable("services", {
  id: id(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("Manicure"),
  priceCents: integer("price_cents").notNull(),
  durationMin: integer("duration_min").notNull(),
  isAddOn: boolean("is_add_on").notNull().default(false),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  photoUrl: text("photo_url"),
  ...stamps,
});

export const serviceStaff = pgTable("service_staff", {
  serviceId: text("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  staffId: text("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.serviceId, t.staffId] })]);

export const customers = pgTable("customers", {
  id: id(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(), // E.164: +3519…
  email: text("email"),
  notes: text("notes"),
  consentAt: timestamp("consent_at", { withTimezone: true }),
  ...stamps,
});

export const appointments = pgTable("appointments", {
  id: id(),
  customerId: text("customer_id").notNull().references(() => customers.id),
  staffId: text("staff_id").notNull().references(() => staff.id),
  serviceId: text("service_id").notNull().references(() => services.id),
  addOnId: text("add_on_id").references(() => services.id),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  priceCents: integer("price_cents").notNull(),
  status: appointmentStatus("status").notNull().default("CONFIRMED"),
  source: bookingSource("source").notNull().default("ONLINE"),
  notes: text("notes"),
  /** SHA-256 do código do link privado enviado à cliente */
  manageTokenHash: text("manage_token_hash").notNull().unique(),
  reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
  ...stamps,
}, (t) => [index("appointments_staff_start_idx").on(t.staffId, t.startAt), index("appointments_start_idx").on(t.startAt)]);

export const businessHours = pgTable("business_hours", {
  weekday: integer("weekday").primaryKey(),
  open: boolean("open").notNull().default(true),
  startMin: integer("start_min").notNull().default(540),
  endMin: integer("end_min").notNull().default(1140),
  start2Min: integer("start2_min"),
  end2Min: integer("end2_min"),
});

/** Vagas publicadas pela Matilde: cada linha é uma hora exata em que pode receber 1 cliente. */
export const vagas = pgTable("vagas", {
  id: id(),
  date: text("date").notNull(), // AAAA-MM-DD (Lisboa)
  startMin: integer("start_min").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("vagas_date_start_uq").on(t.date, t.startMin)]);

export const closedDays = pgTable("closed_days", {
  id: id(),
  date: text("date").notNull().unique(), // AAAA-MM-DD (Lisboa)
  label: text("label").notNull().default("Fechado"),
});

export const blockedTimes = pgTable("blocked_times", {
  id: id(),
  staffId: text("staff_id").references(() => staff.id, { onDelete: "cascade" }),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  reason: text("reason").notNull().default("Bloqueado"),
});

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  salonName: text("salon_name").notNull().default("Luxe Nails by MVN"),
  address: text("address").notNull().default(""),
  postalCode: text("postal_code").notNull().default(""),
  city: text("city").notNull().default("Agualva-Cacém"),
  phone: text("phone").notNull().default("937 142 531"),
  whatsapp: text("whatsapp").notNull().default("925 428 441"),
  email: text("email").notNull().default(""),
  instagram: text("instagram").notNull().default("@luxenailsbymvn"),
  tiktok: text("tiktok").notNull().default(""),
  heroTitle: text("hero_title").notNull().default("Detalhe"),
  heroTitleAccent: text("hero_title_accent").notNull().default("é tudo."),
  heroSubtitle: text("hero_subtitle").notNull().default("Francesinha, leitosos, dourados e flores 3D — feitos por mim, um par de mãos de cada vez."),
  aboutText: text("about_text").notNull().default(""),
  promoActive: boolean("promo_active").notNull().default(false),
  promoTitle: text("promo_title").notNull().default("Oferta Primeira Visita"),
  promoValue: text("promo_value").notNull().default("−20%"),
  promoText: text("promo_text").notNull().default("NA SUA PRIMEIRA VISITA!"),
  logoUrl: text("logo_url"),
  heroPhotoUrl: text("hero_photo_url"),
  aboutPhotoUrl: text("about_photo_url"),
  promoPhotoUrl: text("promo_photo_url"),
  alertEmail: text("alert_email").notNull().default(""),
  emailConfirmations: boolean("email_confirmations").notNull().default(true),
  whatsappButton: boolean("whatsapp_button").notNull().default(true),
  alertByEmail: boolean("alert_by_email").notNull().default(true),
  alertByPush: boolean("alert_by_push").notNull().default(true),
  smsEnabled: boolean("sms_enabled").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const galleryPhotos = pgTable("gallery_photos", {
  id: id(),
  url: text("url").notNull(),
  label: text("label").notNull().default(""),
  alt: text("alt").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: id(),
  name: text("name").notNull(),
  city: text("city").notNull().default(""),
  text: text("text").notNull(),
  rating: integer("rating").notNull().default(5), // estrelas, 1 a 5
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  visible: boolean("visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: id(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  adminId: text("admin_id").references(() => adminUsers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationLogs = pgTable("notification_logs", {
  id: id(),
  appointmentId: text("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
  channel: text("channel").notNull(), // EMAIL | PUSH | SMS
  type: text("type").notNull(),
  recipient: text("recipient").notNull(),
  status: text("status").notNull(), // SENT | FAILED | SKIPPED
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Tentativas de marcação por IP/telemóvel (limite simples contra abusos). */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Relações ───
export const staffRelations = relations(staff, ({ many }) => ({ services: many(serviceStaff), appointments: many(appointments) }));
export const servicesRelations = relations(services, ({ many }) => ({ staff: many(serviceStaff) }));
export const serviceStaffRelations = relations(serviceStaff, ({ one }) => ({
  service: one(services, { fields: [serviceStaff.serviceId], references: [services.id] }),
  staff: one(staff, { fields: [serviceStaff.staffId], references: [staff.id] }),
}));
export const customersRelations = relations(customers, ({ many }) => ({ appointments: many(appointments) }));
export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  logs: many(notificationLogs),
  customer: one(customers, { fields: [appointments.customerId], references: [customers.id] }),
  staff: one(staff, { fields: [appointments.staffId], references: [staff.id] }),
  service: one(services, { fields: [appointments.serviceId], references: [services.id], relationName: "main" }),
  addOn: one(services, { fields: [appointments.addOnId], references: [services.id], relationName: "addon" }),
}));

export const notificationLogsRelations = relations(notificationLogs, ({ one }) => ({
  appointment: one(appointments, { fields: [notificationLogs.appointmentId], references: [appointments.id] }),
}));

export type Staff = typeof staff.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type BusinessHours = typeof businessHours.$inferSelect;

