export interface DemoBlazeProduct {
  id: number;
  title: string;
  price: number;
  img: string;
  desc: string;
  cat: string;
}

export interface DemoBlazeProductsResponse {
  Items: DemoBlazeProduct[];
  Count: number;
  ScannedCount: number;
}

export interface DemoBlazeCartItem {
  id: string;
  prod_id: number;
  flag: boolean;
  title: string;
  price: number;
  img: string;
}

export interface DemoBlazeCartResponse {
  Items: DemoBlazeCartItem[] | null;
  Count: number;
  ScannedCount: number;
}

export interface DemoBlazeProductDetailResponse {
  id: number;
  title: string;
  price: number;
  img: string;
  desc: string;
  cat: string;
}

export type DemoBlazeAuthToken = string;

export interface DemoBlazeSignupResult {
  success: boolean;
  message: string | null;
}

export interface DemoBlazeLoginResult {
  success: boolean;
  token: DemoBlazeAuthToken | null;
  message: string | null;
}

export type DemoBlazeCategory = 'phone' | 'notebook' | 'monitor';

export const DEMOBLAZE_CATEGORIES: Record<string, DemoBlazeCategory> = {
  Phones: 'phone',
  Laptops: 'notebook',
  Monitors: 'monitor',
};
