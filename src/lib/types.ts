export type Role = "admin" | "manager" | "viewer";

export interface User {
  id: number;
  email: string;
  full_name: string;
  locale: "ru" | "en";
}

export interface Organization {
  id: number;
  name: string;
  currency: string;
}

export interface Me {
  user: User;
  organization: Organization;
  role: Role;
}

export interface Stage {
  id: number;
  name: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
  color: string;
}

export interface Pipeline {
  id: number;
  name: string;
  is_default: boolean;
  stages: Stage[];
}

export interface Deal {
  id: number;
  title: string;
  amount: string | number;
  currency: string;
  stage_id: number;
  pipeline_id: number;
  contact_id: number | null;
  company_id: number | null;
  responsible_user_id: number | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: number;
  full_name: string;
  phone: string | null;
  email: string | null;
  position: string | null;
  notes: string | null;
  company_id: number | null;
  created_at: string;
}

export interface Company {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  notes: string | null;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: "open" | "done";
  deal_id: number | null;
  contact_id: number | null;
  assignee_id: number | null;
  due_at: string | null;
  created_at: string;
}

export interface Activity {
  id: number;
  type: string;
  body: string;
  deal_id: number | null;
  contact_id: number | null;
  user_id: number;
  created_at: string;
}

export interface Analytics {
  total_deals: number;
  total_amount: string | number;
  open_tasks: number;
  by_stage: { stage_id: number; stage_name: string; deals_count: number; amount_sum: string | number }[];
}

export interface CustomField {
  id: number;
  entity_type: string;
  name: string;
  field_type: string;
}