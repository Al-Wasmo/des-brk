export type RunGenerateDesignPayload = {
  image_asset_ids: number[]
  design_doc: string
}

export type RunGenerateDesignResponse = {
  job_id: string
  status: string
}

export type GenerateDesignSocketMessage =
  | {
      type: 'job.accepted'
      job_id: string
      status: 'pending'
      updated_at?: string
    }
  | {
      type: 'job.completed'
      job_id: string
      status: 'completed'
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
      updated_at?: string
      error?: string
      result?: {
        stage_dir?: string | null
        output_file?: string | null
        output_text?: string | null
        stderr?: string | null
      }
    }
  | {
      type: 'job.not_found'
      job_id: string
      status: 'not_found'
    }
