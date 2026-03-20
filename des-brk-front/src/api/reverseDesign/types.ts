export type RunReverseDesignPayload = {
  image_asset_ids: number[]
  prompt: string
  auto_mode?: boolean
}

export type RunReverseDesignResponse = {
  job_id: string
  status: string
}

export type ReverseDesignSocketMessage =
  | {
      type: 'job.accepted'
      job_id: string
      status: 'pending'
      auto_mode?: boolean
      updated_at?: string
    }
  | {
      type: 'job.completed'
      job_id: string
      status: 'completed'
      auto_mode?: boolean
      updated_at?: string
      result?: {
        ok?: boolean
        stage_dir?: string | null
        output_file?: string | null
        output_text?: string | null
        stdout?: string | null
        stderr?: string | null
        returncode?: number | null
      }
    }
  | {
      type: 'job.failed'
      job_id: string
      status: 'failed'
      auto_mode?: boolean
      updated_at?: string
      error?: string
      result?: {
        output_text?: string | null
        stderr?: string | null
      }
    }
  | {
      type: 'job.auto_generate_started'
      job_id: string
      status: 'completed'
      auto_mode: true
      generate_job_id?: string | null
      updated_at?: string
      result?: {
        output_text?: string | null
        stderr?: string | null
      }
    }
  | {
      type: 'job.auto_generate_completed'
      job_id: string
      status: 'completed'
      auto_mode: true
      generate_job_id?: string | null
      updated_at?: string
      result?: {
        output_text?: string | null
      }
      generate_result?: {
        output_file?: string | null
        stage_dir?: string | null
        output_text?: string | null
        stderr?: string | null
      }
    }
  | {
      type: 'job.auto_generate_failed'
      job_id: string
      status: 'completed'
      auto_mode: true
      generate_job_id?: string | null
      updated_at?: string
      error?: string
      result?: {
        output_text?: string | null
      }
    }
  | {
      type: 'job.not_found'
      job_id: string
      status: 'not_found'
    }
