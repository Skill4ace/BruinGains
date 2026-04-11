export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      dining_halls: {
        Row: {
          breakfast_hours: string | null
          created_at: string
          dinner_hours: string | null
          fit_percent: number | null
          id: string
          image_key: string | null
          is_active: boolean
          is_main_hall: boolean
          late_night_hours: string | null
          lunch_hours: string | null
          name: string
          short_name: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          breakfast_hours?: string | null
          created_at?: string
          dinner_hours?: string | null
          fit_percent?: number | null
          id: string
          image_key?: string | null
          is_active?: boolean
          is_main_hall?: boolean
          late_night_hours?: string | null
          lunch_hours?: string | null
          name: string
          short_name?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          breakfast_hours?: string | null
          created_at?: string
          dinner_hours?: string | null
          fit_percent?: number | null
          id?: string
          image_key?: string | null
          is_active?: boolean
          is_main_hall?: boolean
          late_night_hours?: string | null
          lunch_hours?: string | null
          name?: string
          short_name?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      gym_capacity_snapshots: {
        Row: {
          captured_at: string
          id: number
          is_closed: boolean
          load: number
          location_id: string
          percent_full: number | null
          source: string | null
          zone_breakdown: Json | null
          zone_name: string | null
        }
        Insert: {
          captured_at?: string
          id?: never
          is_closed?: boolean
          load: number
          location_id: string
          percent_full?: number | null
          source?: string | null
          zone_breakdown?: Json | null
          zone_name?: string | null
        }
        Update: {
          captured_at?: string
          id?: never
          is_closed?: boolean
          load?: number
          location_id?: string
          percent_full?: number | null
          source?: string | null
          zone_breakdown?: Json | null
          zone_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'gym_capacity_snapshots_location_id_fkey'
            columns: ['location_id']
            isOneToOne: false
            referencedRelation: 'gym_locations'
            referencedColumns: ['id']
          },
        ]
      }
      gym_locations: {
        Row: {
          created_at: string
          hours: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          hours: string
          id: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          hours?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          allergen_labels: Json
          badge_labels: Json
          calories: number | null
          carbs_g: number | null
          customization_options: Json
          fats_g: number | null
          id: number
          ingredients: Json
          item_name: string
          item_order: number
          protein_g: number | null
          recipe_id: number | null
          nutrition_facts: Json
          serving_size: string | null
          snapshot_id: number
          station_name: string | null
        }
        Insert: {
          allergen_labels?: Json
          badge_labels?: Json
          calories?: number | null
          carbs_g?: number | null
          customization_options?: Json
          fats_g?: number | null
          id?: never
          ingredients?: Json
          item_name: string
          item_order?: number
          protein_g?: number | null
          recipe_id?: number | null
          nutrition_facts?: Json
          serving_size?: string | null
          snapshot_id: number
          station_name?: string | null
        }
        Update: {
          allergen_labels?: Json
          badge_labels?: Json
          calories?: number | null
          carbs_g?: number | null
          customization_options?: Json
          fats_g?: number | null
          id?: never
          ingredients?: Json
          item_name?: string
          item_order?: number
          protein_g?: number | null
          recipe_id?: number | null
          nutrition_facts?: Json
          serving_size?: string | null
          snapshot_id?: number
          station_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'menu_items_snapshot_id_fkey'
            columns: ['snapshot_id']
            isOneToOne: false
            referencedRelation: 'menu_snapshots'
            referencedColumns: ['id']
          },
        ]
      }
      menu_snapshots: {
        Row: {
          fetched_at: string
          hall_id: string
          id: number
          meal_period: string
          service_date: string
          source_url: string | null
          status: string
        }
        Insert: {
          fetched_at?: string
          hall_id: string
          id?: never
          meal_period: string
          service_date: string
          source_url?: string | null
          status?: string
        }
        Update: {
          fetched_at?: string
          hall_id?: string
          id?: never
          meal_period?: string
          service_date?: string
          source_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'menu_snapshots_hall_id_fkey'
            columns: ['hall_id']
            isOneToOne: false
            referencedRelation: 'dining_halls'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      latest_menu_items: {
        Row: {
          allergen_labels: Json | null
          badge_labels: Json | null
          calories: number | null
          carbs_g: number | null
          customization_options: Json | null
          fats_g: number | null
          fetched_at: string | null
          hall_id: string | null
          hall_name: string | null
          hall_sort_order: number | null
          ingredients: Json | null
          item_name: string | null
          item_order: number | null
          meal_period: string | null
          nutrition_facts: Json | null
          protein_g: number | null
          recipe_id: number | null
          serving_size: string | null
          snapshot_id: number | null
          snapshot_status: string | null
          service_date: string | null
          station_name: string | null
        }
        Relationships: []
      }
      menu_items_expanded: {
        Row: {
          allergen_labels: Json | null
          badge_labels: Json | null
          calories: number | null
          carbs_g: number | null
          customization_options: Json | null
          fats_g: number | null
          fetched_at: string | null
          hall_id: string | null
          hall_name: string | null
          hall_sort_order: number | null
          ingredients: Json | null
          item_name: string | null
          item_order: number | null
          meal_period: string | null
          nutrition_facts: Json | null
          protein_g: number | null
          recipe_id: number | null
          serving_size: string | null
          snapshot_id: number | null
          snapshot_status: string | null
          service_date: string | null
          station_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
