export type TradeFlow = "import" | "export";

export type ShipmentStatus =
  | "docs_pending"
  | "arrived"
  | "under_assessment"
  | "out_of_charge"
  | "gated_out"
  | "delivered"
  | "on_hold";

export type DocStatus = "available" | "pending" | "requested";
export type ChargeStatus = "paid" | "invoiced" | "pending" | "estimated";
export type AlertLevel = "info" | "warning" | "success" | "danger";

export type Client = {
  id: string;
  company: string;
  email: string;
  password: string;
  contactName: string;
  phone: string;
  ports: string[];
};

export type Staff = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "ops" | "admin";
  port: string;
};

export type Container = {
  number: string;
  type: string;
  seal: string | null;
  packages: number;
  grossWeightKg: number;
  status: string;
};

export type Milestone = {
  id: string;
  label: string;
  at: string | null;
  done: boolean;
  note?: string;
};

export type DocumentItem = {
  id: string;
  name: string;
  type: string;
  status: DocStatus;
  updatedAt: string | null;
};

export type ChargeLine = {
  label: string;
  amount: number;
  currency: string;
  status: ChargeStatus;
};

export type DispatchInfo = {
  mode: string;
  transporter: string;
  vehicle: string | null;
  driverPhone: string | null;
  scheduledAt: string | null;
  deliveredAt: string | null;
  notes: string;
};

export type AlertItem = {
  id: string;
  level: AlertLevel;
  message: string;
  at: string;
};

export type AuditEntry = {
  id: string;
  at: string;
  actorType: "staff" | "client" | "system";
  actorId: string;
  actorName: string;
  shipmentId: string;
  action: string;
  detail: string;
};

export type Shipment = {
  id: string;
  clientId: string;
  ref: string;
  tradeFlow: TradeFlow;
  status: ShipmentStatus;
  statusLabel: string;
  priority: "normal" | "high";
  port: string;
  destination: string;
  origin: string;
  goods: string;
  cth: string;
  cthDotted: string;
  blNumber: string | null;
  bookingRef: string | null;
  vessel: string;
  voyage: string;
  eta: string | null;
  etd: string | null;
  lastUpdate: string;
  containers: Container[];
  milestones: Milestone[];
  documents: DocumentItem[];
  charges: ChargeLine[];
  dispatch: DispatchInfo | null;
  alerts: AlertItem[];
  deskNotes: string;
};

export type DeskRequest = {
  id: string;
  clientId: string | null;
  name: string;
  email: string;
  company?: string;
  shipmentRef?: string;
  message: string;
  createdAt: string;
  status?: "open" | "done";
  resolvedAt?: string | null;
  resolvedBy?: string | null;
};
