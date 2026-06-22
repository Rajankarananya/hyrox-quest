export type UserRole = 'athlete' | 'questmaster'

export interface Profile {
  id: string
  name: string
  role: UserRole
}

export interface AthleteProfile {
  id: string
  event_date: string
  target_time: string
  current_weight: number
  goal_weight: number
  water_goal: number
  protein_goal: number
  sleep_goal: number
  biggest_motivation: string
  dday_reward: string
}

export interface DailyTask {
  id: string
  task_name: string
  date: string
  completed: boolean
  xp: number
}