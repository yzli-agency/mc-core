export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Relationships: []
        Row: {
          id: number
          slug: string
          name: string
          status: string | null
          contact_name: string | null
          contact_email: string | null
          stack: string | null
          hosting: string | null
          repo: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          slug: string
          name: string
          status?: string | null
          contact_name?: string | null
          contact_email?: string | null
          stack?: string | null
          hosting?: string | null
          repo?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          slug?: string
          name?: string
          status?: string | null
          contact_name?: string | null
          contact_email?: string | null
          stack?: string | null
          hosting?: string | null
          repo?: string | null
          created_at?: string | null
        }
      }
      projects: {
        Relationships: []
        Row: {
          id: number
          slug: string
          name: string
          client_slug: string
          status: string | null
          type: string | null
          repo_url: string | null
          deploy_url: string | null
          staging_url: string | null
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          slug: string
          name: string
          client_slug: string
          status?: string | null
          type?: string | null
          repo_url?: string | null
          deploy_url?: string | null
          staging_url?: string | null
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          slug?: string
          name?: string
          client_slug?: string
          status?: string | null
          type?: string | null
          repo_url?: string | null
          deploy_url?: string | null
          staging_url?: string | null
          description?: string | null
          created_at?: string | null
        }
      }
      kanban_cards: {
        Relationships: []
        Row: {
          id: number
          title: string
          description: string | null
          project_slug: string | null
          client_slug: string | null
          column_name: string | null
          priority: string | null
          assignee: string | null
          due_date: string | null
          initial_prompt: string | null
          synthesis: string | null
          steps: string | null
          workflow: string | null
          cells: string | null
          tags: string | null
          linked_docs: string | null
          linked_agents: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          title: string
          description?: string | null
          project_slug?: string | null
          client_slug?: string | null
          column_name?: string | null
          priority?: string | null
          assignee?: string | null
          due_date?: string | null
          initial_prompt?: string | null
          synthesis?: string | null
          steps?: string | null
          workflow?: string | null
          cells?: string | null
          tags?: string | null
          linked_docs?: string | null
          linked_agents?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          title?: string
          description?: string | null
          project_slug?: string | null
          client_slug?: string | null
          column_name?: string | null
          priority?: string | null
          assignee?: string | null
          due_date?: string | null
          initial_prompt?: string | null
          synthesis?: string | null
          steps?: string | null
          workflow?: string | null
          cells?: string | null
          tags?: string | null
          linked_docs?: string | null
          linked_agents?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      kanban_history: {
        Relationships: []
        Row: {
          id: number
          card_id: number
          from_column: string | null
          to_column: string | null
          moved_at: string | null
          moved_by: string | null
        }
        Insert: {
          id?: number
          card_id: number
          from_column?: string | null
          to_column?: string | null
          moved_at?: string | null
          moved_by?: string | null
        }
        Update: {
          id?: number
          card_id?: number
          from_column?: string | null
          to_column?: string | null
          moved_at?: string | null
          moved_by?: string | null
        }
      }
      cells: {
        Relationships: []
        Row: {
          id: number
          slug: string
          name: string
          emoji: string | null
          mode: string | null
          description: string | null
          input: string | null
          output: string | null
          status: string | null
          sort_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: number
          slug: string
          name: string
          emoji?: string | null
          mode?: string | null
          description?: string | null
          input?: string | null
          output?: string | null
          status?: string | null
          sort_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: number
          slug?: string
          name?: string
          emoji?: string | null
          mode?: string | null
          description?: string | null
          input?: string | null
          output?: string | null
          status?: string | null
          sort_order?: number | null
          created_at?: string | null
        }
      }
      agent_roles: {
        Relationships: []
        Row: {
          id: number
          slug: string
          name: string
          level: string
          model: string | null
          cells: string | null
          mission: string | null
          has_memory: boolean | null
          soul_md: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          slug: string
          name: string
          level: string
          model?: string | null
          cells?: string | null
          mission?: string | null
          has_memory?: boolean | null
          soul_md?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          slug?: string
          name?: string
          level?: string
          model?: string | null
          cells?: string | null
          mission?: string | null
          has_memory?: boolean | null
          soul_md?: string | null
          created_at?: string | null
        }
      }
      cell_roles: {
        Relationships: []
        Row: {
          cell_slug: string
          role_slug: string
          is_lead: boolean | null
        }
        Insert: {
          cell_slug: string
          role_slug: string
          is_lead?: boolean | null
        }
        Update: {
          cell_slug?: string
          role_slug?: string
          is_lead?: boolean | null
        }
      }
      documents: {
        Relationships: []
        Row: {
          id: number
          slug: string | null
          title: string
          type: string
          status: string | null
          client_slug: string | null
          project_slug: string | null
          producer_role: string | null
          consumer_roles: string | null
          cell_from: string | null
          cell_to: string | null
          file_path: string | null
          content_preview: string | null
          version: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          slug?: string | null
          title: string
          type: string
          status?: string | null
          client_slug?: string | null
          project_slug?: string | null
          producer_role?: string | null
          consumer_roles?: string | null
          cell_from?: string | null
          cell_to?: string | null
          file_path?: string | null
          content_preview?: string | null
          version?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          slug?: string | null
          title?: string
          type?: string
          status?: string | null
          client_slug?: string | null
          project_slug?: string | null
          producer_role?: string | null
          consumer_roles?: string | null
          cell_from?: string | null
          cell_to?: string | null
          file_path?: string | null
          content_preview?: string | null
          version?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      pipeline_map: {
        Relationships: []
        Row: {
          id: number
          doc_type: string
          required_in_cell: string
          produced_in_cell: string | null
          producer_role: string | null
          consumer_roles: string | null
          blocks_handoff: string | null
          template_path: string | null
          sort_order: number | null
        }
        Insert: {
          id?: number
          doc_type: string
          required_in_cell: string
          produced_in_cell?: string | null
          producer_role?: string | null
          consumer_roles?: string | null
          blocks_handoff?: string | null
          template_path?: string | null
          sort_order?: number | null
        }
        Update: {
          id?: number
          doc_type?: string
          required_in_cell?: string
          produced_in_cell?: string | null
          producer_role?: string | null
          consumer_roles?: string | null
          blocks_handoff?: string | null
          template_path?: string | null
          sort_order?: number | null
        }
      }
      agent_logs: {
        Relationships: []
        Row: {
          id: number
          agent: string
          level: string | null
          message: string
          context: string | null
          logged_at: string | null
        }
        Insert: {
          id?: number
          agent: string
          level?: string | null
          message: string
          context?: string | null
          logged_at?: string | null
        }
        Update: {
          id?: number
          agent?: string
          level?: string | null
          message?: string
          context?: string | null
          logged_at?: string | null
        }
      }
      agent_messages: {
        Relationships: []
        Row: {
          id: number
          from_agent: string
          to_agent: string
          channel: string | null
          subject: string | null
          content: string
          status: string
          reply_to_id: number | null
          created_at: string | null
          read_at: string | null
          replied_at: string | null
        }
        Insert: {
          id?: number
          from_agent: string
          to_agent: string
          channel?: string | null
          subject?: string | null
          content: string
          status?: string
          reply_to_id?: number | null
          created_at?: string | null
          read_at?: string | null
          replied_at?: string | null
        }
        Update: {
          id?: number
          from_agent?: string
          to_agent?: string
          channel?: string | null
          subject?: string | null
          content?: string
          status?: string
          reply_to_id?: number | null
          created_at?: string | null
          read_at?: string | null
          replied_at?: string | null
        }
      }
      calendar_tasks: {
        Relationships: []
        Row: {
          id: number
          title: string
          description: string | null
          client_slug: string | null
          project_slug: string | null
          scheduled_at: string | null
          cron_expr: string | null
          status: string | null
          agent: string | null
          type: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          title: string
          description?: string | null
          client_slug?: string | null
          project_slug?: string | null
          scheduled_at?: string | null
          cron_expr?: string | null
          status?: string | null
          agent?: string | null
          type?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          title?: string
          description?: string | null
          client_slug?: string | null
          project_slug?: string | null
          scheduled_at?: string | null
          cron_expr?: string | null
          status?: string | null
          agent?: string | null
          type?: string | null
          created_at?: string | null
        }
      }
      veille_topics: {
        Relationships: []
        Row: {
          id: number
          slug: string
          name: string
          description: string | null
          keywords: string | null
          active: boolean | null
          sort_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: number
          slug: string
          name: string
          description?: string | null
          keywords?: string | null
          active?: boolean | null
          sort_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: number
          slug?: string
          name?: string
          description?: string | null
          keywords?: string | null
          active?: boolean | null
          sort_order?: number | null
          created_at?: string | null
        }
      }
      veille_articles: {
        Relationships: []
        Row: {
          id: number
          topic_slug: string
          digest_date: string
          title: string
          url: string | null
          source: string | null
          summary: string | null
          relevance_score: number | null
          selected: boolean | null
          sent: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: number
          topic_slug: string
          digest_date: string
          title: string
          url?: string | null
          source?: string | null
          summary?: string | null
          relevance_score?: number | null
          selected?: boolean | null
          sent?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: number
          topic_slug?: string
          digest_date?: string
          title?: string
          url?: string | null
          source?: string | null
          summary?: string | null
          relevance_score?: number | null
          selected?: boolean | null
          sent?: boolean | null
          created_at?: string | null
        }
      }
      veille_digests: {
        Relationships: []
        Row: {
          id: number
          digest_date: string
          title: string | null
          content: string | null
          article_count: number | null
          topics_covered: string | null
          sent_to: string | null
          sent_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          digest_date: string
          title?: string | null
          content?: string | null
          article_count?: number | null
          topics_covered?: string | null
          sent_to?: string | null
          sent_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          digest_date?: string
          title?: string | null
          content?: string | null
          article_count?: number | null
          topics_covered?: string | null
          sent_to?: string | null
          sent_at?: string | null
          created_at?: string | null
        }
      }
      registry_modules: {
        Relationships: []
        Row: {
          id: number
          slug: string
          name: string
          description: string | null
          visibility: string | null
          repo_url: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          slug: string
          name: string
          description?: string | null
          visibility?: string | null
          repo_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          slug?: string
          name?: string
          description?: string | null
          visibility?: string | null
          repo_url?: string | null
          created_at?: string | null
        }
      }
      registry_versions: {
        Relationships: []
        Row: {
          id: number
          module_id: number | null
          version: string
          manifest: string
          published_at: string | null
        }
        Insert: {
          id?: number
          module_id?: number | null
          version: string
          manifest: string
          published_at?: string | null
        }
        Update: {
          id?: number
          module_id?: number | null
          version?: string
          manifest?: string
          published_at?: string | null
        }
      }
      installed_modules: {
        Relationships: []
        Row: {
          id: number
          module_slug: string
          version: string
          installed_at: string | null
          config: string | null
        }
        Insert: {
          id?: number
          module_slug: string
          version: string
          installed_at?: string | null
          config?: string | null
        }
        Update: {
          id?: number
          module_slug?: string
          version?: string
          installed_at?: string | null
          config?: string | null
        }
      }
      client_module_grants: {
        Relationships: []
        Row: {
          id: number
          client_slug: string
          module_slug: string
          granted_at: string | null
        }
        Insert: {
          id?: number
          client_slug: string
          module_slug: string
          granted_at?: string | null
        }
        Update: {
          id?: number
          client_slug?: string
          module_slug?: string
          granted_at?: string | null
        }
      }
    }
    Views: Record<string, { Row: Record<string, unknown>; Relationships: [] }>
    Functions: {
      get_dashboard_stats: {
        Args: Record<string, never>
        Returns: {
          active_agents: number
          total_tasks: number
          tasks_today: number
          active_clients: number
          active_projects: number
        }[]
      }
    }
    Enums: Record<string, never>
  }
}

// Convenience row types
export type ClientRow = Database['public']['Tables']['clients']['Row']
export type ProjectRow = Database['public']['Tables']['projects']['Row']
export type KanbanCardRow = Database['public']['Tables']['kanban_cards']['Row']
export type KanbanHistoryRow = Database['public']['Tables']['kanban_history']['Row']
export type CellRow = Database['public']['Tables']['cells']['Row']
export type AgentRoleRow = Database['public']['Tables']['agent_roles']['Row']
export type CellRoleRow = Database['public']['Tables']['cell_roles']['Row']
export type DocumentRow = Database['public']['Tables']['documents']['Row']
export type PipelineMapRow = Database['public']['Tables']['pipeline_map']['Row']
export type AgentLogRow = Database['public']['Tables']['agent_logs']['Row']
export type AgentMessageRow = Database['public']['Tables']['agent_messages']['Row']
export type CalendarTaskRow = Database['public']['Tables']['calendar_tasks']['Row']
export type VeilleTopicRow = Database['public']['Tables']['veille_topics']['Row']
export type VeilleArticleRow = Database['public']['Tables']['veille_articles']['Row']
export type VeilleDigestRow = Database['public']['Tables']['veille_digests']['Row']
export type RegistryModuleRow = Database['public']['Tables']['registry_modules']['Row']
export type RegistryVersionRow = Database['public']['Tables']['registry_versions']['Row']
export type InstalledModuleRow = Database['public']['Tables']['installed_modules']['Row']
export type ClientModuleGrantRow = Database['public']['Tables']['client_module_grants']['Row']
