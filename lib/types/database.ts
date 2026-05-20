export type UserRole = "renta" | "socio" | "admin" | "chef";
export type TripStatus = "draft" | "submitted" | "active" | "completed" | "settled";
export type PaymentModel = "prepaid" | "postpaid";
export type PriceTier = "tier_1" | "tier_2" | "tier_3";
export type MenuSelectionType = "predefined" | "surprise" | "custom";
export type ParticipantType = "adult" | "child";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  locale: string;
  avatar_url: string | null;
}

export interface Trip {
  id: string;
  created_by: string;
  status: TripStatus;
  start_date: string | null;
  end_date: string | null;
  adult_count: number;
  child_count: number;
  crew_count: number;
  payment_model: PaymentModel;
  prepaid_amount_cents: number;
  estimated_total_cents: number;
  locale: string;
  wizard_step: number;
  notes: string | null;
}

export interface Menu {
  id: string;
  slug: string;
  name_en: string;
  name_es: string;
  description_en: string | null;
  description_es: string | null;
  price_tier: PriceTier;
  price_adult_cents: number;
  price_child_cents: number;
  season: string | null;
  is_seasonal: boolean;
  is_active: boolean;
}

export interface TripParticipant {
  id: string;
  trip_id: string;
  display_name: string;
  participant_type: ParticipantType;
  sort_order: number;
  portion_override: string;
}

export interface GuestPreferences {
  id: string;
  participant_id: string;
  allergies: string[];
  dietary_restrictions: string[];
  protein_preferences: string[];
  dairy_preferences: string[];
  general_food_notes: string[];
  meal_schedule: Record<string, unknown>;
  bar_preferences: Record<string, unknown>;
}

export interface TripStockLine {
  id: string;
  trip_id: string;
  stock_item_id: string;
  initial_qty: number;
  consumed_qty: number | null;
  chargeable_qty: number;
  line_total_cents: number;
  unit_price_cents: number;
  stock_items?: {
    name_en: string;
    name_es: string;
    sku: string;
    category: string;
  };
}
