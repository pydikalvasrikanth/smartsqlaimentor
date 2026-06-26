export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attempts: {
        Row: {
          concept: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["skill_level"]
          id: string
          is_correct: boolean
          mistake_tag: string | null
          question_text: string | null
          subject: string
          topic_slug: string
          user_answer: string | null
          user_id: string
          user_sql: string | null
        }
        Insert: {
          concept?: string | null
          created_at?: string
          difficulty: Database["public"]["Enums"]["skill_level"]
          id?: string
          is_correct: boolean
          mistake_tag?: string | null
          question_text?: string | null
          subject?: string
          topic_slug: string
          user_answer?: string | null
          user_id: string
          user_sql?: string | null
        }
        Update: {
          concept?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["skill_level"]
          id?: string
          is_correct?: boolean
          mistake_tag?: string | null
          question_text?: string | null
          subject?: string
          topic_slug?: string
          user_answer?: string | null
          user_id?: string
          user_sql?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          ai_quality_rating: number | null
          bug_report: string | null
          code_correctness: string | null
          contact_email: string | null
          created_at: string
          id: string
          improvement_suggestion: string | null
          nps_score: number | null
          overall_rating: number | null
          page_context: string | null
          subject_area: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_quality_rating?: number | null
          bug_report?: string | null
          code_correctness?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          improvement_suggestion?: string | null
          nps_score?: number | null
          overall_rating?: number | null
          page_context?: string | null
          subject_area?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_quality_rating?: number | null
          bug_report?: string | null
          code_correctness?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          improvement_suggestion?: string | null
          nps_score?: number | null
          overall_rating?: number | null
          page_context?: string | null
          subject_area?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_days: {
        Row: {
          completed: boolean
          completed_at: string | null
          day_index: number
          difficulty: Database["public"]["Enums"]["skill_level"]
          id: string
          plan_id: string
          subject: string
          target_concept: string
          topic_slug: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          day_index: number
          difficulty: Database["public"]["Enums"]["skill_level"]
          id?: string
          plan_id: string
          subject?: string
          target_concept: string
          topic_slug: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          day_index?: number
          difficulty?: Database["public"]["Enums"]["skill_level"]
          id?: string
          plan_id?: string
          subject?: string
          target_concept?: string
          topic_slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "practice_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_plans: {
        Row: {
          active: boolean
          created_at: string
          days: number
          id: string
          started_at: string
          subject: string
          target_level: Database["public"]["Enums"]["skill_level"]
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          days: number
          id?: string
          started_at?: string
          subject?: string
          target_level: Database["public"]["Enums"]["skill_level"]
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          days?: number
          id?: string
          started_at?: string
          subject?: string
          target_level?: Database["public"]["Enums"]["skill_level"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      question_sessions: {
        Row: {
          concept: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["skill_level"]
          expected_sql: string | null
          id: string
          payload: Json | null
          question_id_external: number | null
          schema_sql: string | null
          seed_data_sql: string | null
          subject: string
          task: string
          topic_slug: string
          user_id: string
        }
        Insert: {
          concept?: string | null
          created_at?: string
          difficulty: Database["public"]["Enums"]["skill_level"]
          expected_sql?: string | null
          id?: string
          payload?: Json | null
          question_id_external?: number | null
          schema_sql?: string | null
          seed_data_sql?: string | null
          subject?: string
          task: string
          topic_slug: string
          user_id: string
        }
        Update: {
          concept?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["skill_level"]
          expected_sql?: string | null
          id?: string
          payload?: Json | null
          question_id_external?: number | null
          schema_sql?: string | null
          seed_data_sql?: string | null
          subject?: string
          task?: string
          topic_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      topic_mastery: {
        Row: {
          current_tier: Database["public"]["Enums"]["skill_level"]
          id: string
          questions_attempted: number
          questions_correct: number
          subject: string
          topic_slug: string
          unlocked_advanced: boolean
          unlocked_intermediate: boolean
          unlocked_professional: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          current_tier?: Database["public"]["Enums"]["skill_level"]
          id?: string
          questions_attempted?: number
          questions_correct?: number
          subject?: string
          topic_slug: string
          unlocked_advanced?: boolean
          unlocked_intermediate?: boolean
          unlocked_professional?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          current_tier?: Database["public"]["Enums"]["skill_level"]
          id?: string
          questions_attempted?: number
          questions_correct?: number
          subject?: string
          topic_slug?: string
          unlocked_advanced?: boolean
          unlocked_intermediate?: boolean
          unlocked_professional?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      skill_level: "beginner" | "intermediate" | "advanced" | "professional"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      skill_level: ["beginner", "intermediate", "advanced", "professional"],
    },
  },
} as const
