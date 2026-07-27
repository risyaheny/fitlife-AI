export interface UserProfile {
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  targetWeight: number;
  dailyActivity: string;
  goal: string;
  preferences: string;
  restrictions: string;
  allergies: string;
  medicalHistory: string;
  budget: string;
  calorieTarget: number;
  photo?: string;
  streak?: number;
  claimedStreakDates?: string[];
  isNewUser?: boolean;
  isProfileComplete?: boolean;
}

export interface WaterTracker {
  current: number;
  target: number;
  history: Array<{ date: string; amount: number }>;
}

export interface WeightLog {
  date: string;
  weight: number;
}

export interface FoodScan {
  id: string;
  date: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fitStatus: string;
  explanation: string;
}

export interface Workout {
  id: string;
  name: string;
  duration: number;
  calories: number;
  date: string;
  status: "Pending" | "Completed";
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  type: string; // Sarapan, Makan Siang, Makan Malam, Cemilan
  date: string;
}

export interface Reminder {
  id: string;
  title: string;
  time: string;
  active: boolean;
  type: "water" | "workout";
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  profile: UserProfile;
  waterTracker: WaterTracker;
  weightHistory: WeightLog[];
  scans: FoodScan[];
  workouts: Workout[];
  meals: Meal[];
  reminders: Reminder[];
}
