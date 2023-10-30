// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      first_name: string
      last_name: string
      created_at: string
      session_id?: string
    }
    meals: {
      id: string
      name: string
      description: string
      inDiet: boolean
      created_at: string
      user_id: string
      session_id?: string
    }
  }
}
