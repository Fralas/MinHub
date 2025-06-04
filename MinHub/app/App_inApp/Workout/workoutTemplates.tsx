import { Exercise } from "./exerciseData";

export type WorkoutTemplate = {
  id: number;
  name: string;
  description: string;
  goal: "strength" | "cardio" | "weight_loss" | "muscle_building";
  difficulty: "beginner" | "intermediate" | "advanced";
  durationMinutes: number;
  exerciseNames: string[];
  icon: string; 
};

export const workoutTemplates: WorkoutTemplate[] = [
  // STRENGTH TEMPLATES
  {
    id: 1,
    name: "Upper Body Strength",
    description: "Build upper body muscle and strength with compound movements",
    goal: "strength",
    difficulty: "intermediate",
    durationMinutes: 45,
    exerciseNames: ["Push-ups", "Pull-ups", "Bench Press", "Overhead Press", "Tricep Dips"],
    icon: "barbell-outline"
  },
  {
    id: 2,
    name: "Lower Body Power",
    description: "Strengthen legs and glutes with powerful compound exercises",
    goal: "strength",
    difficulty: "intermediate",
    durationMinutes: 40,
    exerciseNames: ["Squats", "Deadlift", "Lunges", "Box Jumps", "Wall Sit"],
    icon: "fitness-outline"
  },
  {
    id: 3,
    name: "Full Body Strength",
    description: "Complete strength workout targeting all major muscle groups",
    goal: "strength",
    difficulty: "advanced",
    durationMinutes: 60,
    exerciseNames: ["Deadlift", "Squats", "Bench Press", "Pull-ups", "Overhead Press", "Farmer's Walk"],
    icon: "trophy-outline"
  },

  // CARDIO TEMPLATES
  {
    id: 4,
    name: "HIIT Cardio Blast",
    description: "High-intensity interval training for maximum calorie burn",
    goal: "cardio",
    difficulty: "intermediate",
    durationMinutes: 25,
    exerciseNames: ["Burpees", "Jump Rope", "Mountain Climbers", "High Knees", "Jumping Jacks"],
    icon: "flash-outline"
  },
  {
    id: 5,
    name: "Cardio Endurance",
    description: "Build cardiovascular endurance with steady-state exercises",
    goal: "cardio",
    difficulty: "beginner",
    durationMinutes: 35,
    exerciseNames: ["Running", "Cycling (moderate)", "Elliptical Trainer", "Stair Climbing"],
    icon: "heart-outline"
  },
  {
    id: 6,
    name: "Intense Cardio Challenge",
    description: "Advanced cardio workout for experienced athletes",
    goal: "cardio",
    difficulty: "advanced",
    durationMinutes: 30,
    exerciseNames: ["Sprints", "Battle Ropes", "Box Jumps", "Kettlebell Swings", "Burpees"],
    icon: "thunderstorm-outline"
  },

  // WEIGHT LOSS TEMPLATES
  {
    id: 7,
    name: "Fat Burning Circuit",
    description: "Circuit training designed to maximize calorie burn",
    goal: "weight_loss",
    difficulty: "beginner",
    durationMinutes: 30,
    exerciseNames: ["Jumping Jacks", "Squats", "Push-ups", "Mountain Climbers", "Step-Ups"],
    icon: "flame-outline"
  },
  {
    id: 8,
    name: "Metabolic Booster",
    description: "Boost your metabolism with this fat-burning workout",
    goal: "weight_loss",
    difficulty: "intermediate",
    durationMinutes: 35,
    exerciseNames: ["Burpees", "Jump Rope", "Kettlebell Swings", "Battle Ropes", "High Knees", "Russian Twists"],
    icon: "speedometer-outline"
  },
  {
    id: 9,
    name: "Ultimate Fat Burner",
    description: "Intense full-body workout for serious weight loss goals",
    goal: "weight_loss",
    difficulty: "advanced",
    durationMinutes: 40,
    exerciseNames: ["Sprints", "Burpees", "Mountain Climbers", "Jump Rope", "Box Jumps", "Battle Ropes", "Kettlebell Swings"],
    icon: "rocket-outline"
  },

  // MUSCLE BUILDING TEMPLATES
  {
    id: 10,
    name: "Beginner Muscle Builder",
    description: "Perfect introduction to muscle building with bodyweight exercises",
    goal: "muscle_building",
    difficulty: "beginner",
    durationMinutes: 35,
    exerciseNames: ["Push-ups", "Squats", "Lunges", "Plank", "Tricep Dips", "Calf Raises"],
    icon: "body-outline"
  },
  {
    id: 11,
    name: "Hypertrophy Focus",
    description: "Muscle building workout with emphasis on hypertrophy",
    goal: "muscle_building",
    difficulty: "intermediate",
    durationMinutes: 50,
    exerciseNames: ["Bench Press", "Squats", "Deadlift", "Dumbbell Curls", "Overhead Press", "Lunges"],
    icon: "medal-outline"
  },
  {
    id: 12,
    name: "Mass Building Protocol",
    description: "Advanced muscle building routine for serious gains",
    goal: "muscle_building",
    difficulty: "advanced",
    durationMinutes: 65,
    exerciseNames: ["Deadlift", "Squats", "Bench Press", "Pull-ups", "Overhead Press", "Dumbbell Curls", "Tricep Dips", "Farmer's Walk"],
    icon: "diamond-outline"
  },

  // SPECIALIZED TEMPLATES
  {
    id: 13,
    name: "Core Crusher",
    description: "Targeted core workout for a strong midsection",
    goal: "strength",
    difficulty: "intermediate",
    durationMinutes: 25,
    exerciseNames: ["Plank", "Bicycle Crunches", "Russian Twists", "Leg Raises", "Side Plank", "Mountain Climbers"],
    icon: "disc-outline"
  },
  {
    id: 14,
    name: "Quick Morning Boost",
    description: "Energizing 15-minute workout to start your day",
    goal: "cardio",
    difficulty: "beginner",
    durationMinutes: 15,
    exerciseNames: ["Jumping Jacks", "Push-ups", "High Knees", "Squats"],
    icon: "sunny-outline"
  },
  {
    id: 15,
    name: "Flexibility & Flow",
    description: "Low-impact workout focusing on flexibility and balance",
    goal: "weight_loss",
    difficulty: "beginner",
    durationMinutes: 30,
    exerciseNames: ["Yoga", "Pilates", "Leg Raises", "Side Plank"],
    icon: "leaf-outline"
  }
];

export const getTemplatesByGoal = (goal: WorkoutTemplate["goal"]) => {
  return workoutTemplates.filter(template => template.goal === goal);
};

export const getTemplatesByDifficulty = (difficulty: WorkoutTemplate["difficulty"]) => {
  return workoutTemplates.filter(template => template.difficulty === difficulty);
};