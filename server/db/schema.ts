import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Every table carries owner_email + org_id. Reads are scoped to the active org
// when there is one, otherwise to the signed-in owner (see server/lib/scope.ts).

/** A scanned vehicle (make + model + model-year range). */
export const vehicles = pgTable(
  "vehicles",
  {
    id: text("id").primaryKey(),
    label: text("label").notNull(),
    make: text("make").notNull(),
    model: text("model").notNull(),
    yearFrom: integer("year_from").notNull(),
    yearTo: integer("year_to").notNull(),
    totalComplaints: integer("total_complaints").notNull().default(0),
    uncoveredModes: integer("uncovered_modes").notNull().default(0),
    peers: jsonb("peers").notNull().default(sql`'[]'::jsonb`),
    recalls: jsonb("recalls").notNull().default(sql`'[]'::jsonb`),
    investigations: jsonb("investigations")
      .notNull()
      .default(sql`'[]'::jsonb`),
    warnings: jsonb("warnings").notNull().default(sql`'[]'::jsonb`),
    watch: boolean("watch").notNull().default(false),
    lastScannedAt: text("last_scanned_at"),
    createdAt: text("created_at").notNull().default(sql`now()`),
    ownerEmail: text("owner_email").notNull(),
    orgId: text("org_id"),
  },
  (t) => [
    index("vehicles_scope_idx").on(t.ownerEmail, t.orgId),
    index("vehicles_mmy_idx").on(t.make, t.model, t.yearFrom, t.yearTo),
  ],
);

/** Owner complaints cached per scanned vehicle (own complaints + peer baseline). */
export const complaints = pgTable(
  "complaints",
  {
    vehicleId: text("vehicle_id").notNull(),
    odiNumber: text("odi_number").notNull(),
    isPeer: boolean("is_peer").notNull().default(false),
    make: text("make").notNull(),
    model: text("model").notNull(),
    modelYear: integer("model_year").notNull(),
    dateReceived: text("date_received").notNull(),
    dateIncident: text("date_incident"),
    components: text("components").notNull().default(""),
    summary: text("summary").notNull().default(""),
    crash: boolean("crash").notNull().default(false),
    fire: boolean("fire").notNull().default(false),
    injuries: integer("injuries").notNull().default(0),
    deaths: integer("deaths").notNull().default(0),
    ownerEmail: text("owner_email").notNull(),
    orgId: text("org_id"),
  },
  (t) => [
    uniqueIndex("complaints_vehicle_odi_idx").on(
      t.vehicleId,
      t.odiNumber,
      t.isPeer,
    ),
    index("complaints_vehicle_year_idx").on(t.vehicleId, t.isPeer, t.modelYear),
  ],
);

/** Computed failure-mode clusters for a vehicle. `data` is a ClusterResult. */
export const clusters = pgTable(
  "clusters",
  {
    id: text("id").primaryKey(),
    vehicleId: text("vehicle_id").notNull(),
    failureModeId: text("failure_mode_id").notNull(),
    count: integer("count").notNull().default(0),
    uncoveredCount: integer("uncovered_count").notNull().default(0),
    status: text("status").notNull(),
    signalFired: boolean("signal_fired").notNull().default(false),
    data: jsonb("data").notNull(),
    updatedAt: text("updated_at").notNull().default(sql`now()`),
    ownerEmail: text("owner_email").notNull(),
    orgId: text("org_id"),
  },
  (t) => [
    uniqueIndex("clusters_vehicle_mode_idx").on(t.vehicleId, t.failureModeId),
  ],
);

/** Failure-mode rules (seeded per scope, editable; they carry over to every scan). */
export const failureModes = pgTable(
  "failure_modes",
  {
    pk: text("pk").primaryKey(),
    id: text("id").notNull(),
    data: jsonb("data").notNull(),
    isSeed: boolean("is_seed").notNull().default(true),
    updatedAt: text("updated_at").notNull().default(sql`now()`),
    ownerEmail: text("owner_email").notNull(),
    orgId: text("org_id"),
  },
  (t) => [index("failure_modes_scope_idx").on(t.ownerEmail, t.orgId, t.id)],
);

/** Human review labels on complaint ↔ failure-mode membership. */
export const complaintLabels = pgTable(
  "complaint_labels",
  {
    id: text("id").primaryKey(),
    odiNumber: text("odi_number").notNull(),
    failureModeId: text("failure_mode_id").notNull(),
    verdict: text("verdict").notNull(),
    createdAt: text("created_at").notNull().default(sql`now()`),
    ownerEmail: text("owner_email").notNull(),
    orgId: text("org_id"),
  },
  (t) => [
    index("complaint_labels_scope_idx").on(
      t.ownerEmail,
      t.orgId,
      t.failureModeId,
    ),
  ],
);

/** User-added class settlements / warranty extensions (in addition to seeds). */
export const settlements = pgTable("settlements", {
  id: text("id").primaryKey(),
  data: jsonb("data").notNull(),
  createdAt: text("created_at").notNull().default(sql`now()`),
  ownerEmail: text("owner_email").notNull(),
  orgId: text("org_id"),
});

export const petitions = pgTable(
  "petitions",
  {
    id: text("id").primaryKey(),
    vehicleId: text("vehicle_id").notNull(),
    failureModeId: text("failure_mode_id").notNull(),
    title: text("title").notNull(),
    markdown: text("markdown").notNull(),
    checklist: jsonb("checklist").notNull().default(sql`'[]'::jsonb`),
    petitioner: jsonb("petitioner").notNull().default(sql`'{}'::jsonb`),
    status: text("status").notNull().default("draft"),
    createdAt: text("created_at").notNull().default(sql`now()`),
    updatedAt: text("updated_at").notNull().default(sql`now()`),
    ownerEmail: text("owner_email").notNull(),
    orgId: text("org_id"),
  },
  (t) => [index("petitions_scope_idx").on(t.ownerEmail, t.orgId, t.updatedAt)],
);

/** Watchlist alerts: a cluster newly fired its signal or grew while uncovered. */
export const alerts = pgTable(
  "alerts",
  {
    id: text("id").primaryKey(),
    vehicleId: text("vehicle_id").notNull(),
    failureModeId: text("failure_mode_id").notNull(),
    kind: text("kind").notNull(),
    message: text("message").notNull(),
    createdAt: text("created_at").notNull().default(sql`now()`),
    seen: boolean("seen").notNull().default(false),
    ownerEmail: text("owner_email").notNull(),
    orgId: text("org_id"),
  },
  (t) => [index("alerts_scope_idx").on(t.ownerEmail, t.orgId, t.createdAt)],
);
