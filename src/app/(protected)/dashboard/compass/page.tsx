'use client';
import React, { useState, useEffect } from 'react';
import { 
  Pencil, 
  Plus, 
  Target as GoalIcon, 
  TrendingUp,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { 
  getUserValues, 
  saveUserValues, 
  getCompassEntries, 
  saveCompassEntry,
  type UserValues,
  type CompassEntry
} from '@/lib/dbHelpers';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Import actual shadcn/ui components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { HabitsLogDrawer } from '@/components/HabitLogDrawer';
import { GoalLogDrawer } from '@/components/GoalLogDrawer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { Checkbox } from '@/components/ui/checkbox';

// Database integrated types and data structures
interface CoreValue {
  id: string;
  name: string;
  description: string;
  importance: number;
  alignment: number;
}

interface Habit {
  id: string;
  name: string;
  description: string;
  type: 'build' | 'break';
  recurrence: string;
  streak: number;
  lastLogged: string;
  progressStatus: string;
  weeklyProgress: number[];
  notes?: string;
}

interface Goal {
  id: string;
  type: 'long-term' | 'short-term';
  name: string;
  description: string;
  progress: number;
  priority: 'High' | 'Medium' | 'Low';
  targetDeadline: string;
  lastUpdated: string;
  motivation?: string;
  blockers?: string;
  milestones: { id: string; text: string; completed: boolean; }[];
  category: string;
}

interface CompassData {
  lifePurpose: string;
  coreValues: CoreValue[];
  habits: Habit[];
  goals: Goal[];
}

// Type definitions for component props
type HabitType = Habit;
type GoalType = Goal;
type CoreValueType = CoreValue;

// --- DIALOGS & DRAWERS ---

const EditHabitDialog: React.FC<{ habit: HabitType | null; isOpen: boolean; onClose: () => void; onSave: (habit: HabitType) => void; }> = ({ habit, isOpen, onClose, onSave }) => {
  if (!habit) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Habit: {habit.name}</DialogTitle><DialogDescription>{habit.description}</DialogDescription></DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2"><Label htmlFor="habit-name">Name</Label><Input id="habit-name" defaultValue={habit.name} /></div>
          <div className="space-y-2"><Label htmlFor="habit-desc">Description</Label><Textarea id="habit-desc" defaultValue={habit.description} /></div>
        </div>
        <DialogFooter><Button onClick={onClose}>Save Changes</Button><Button variant="outline" onClick={onClose}>Cancel</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const EditGoalDialog: React.FC<{ goal: GoalType | null; isOpen: boolean; onClose: () => void; onSave: (goal: GoalType) => void; }> = ({ goal, isOpen, onClose, onSave }) => {
  if (!goal) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Edit Goal: {goal.name}</DialogTitle><DialogDescription>{goal.description}</DialogDescription></DialogHeader>
        <div className="py-4 grid grid-cols-2 gap-6">
            <div className="space-y-4">
                <div className="space-y-2"><Label htmlFor="goal-name">Name</Label><Input id="goal-name" defaultValue={goal.name} /></div>
                <div className="space-y-2"><Label htmlFor="goal-desc">Description</Label><Textarea id="goal-desc" defaultValue={goal.description} /></div>
            </div>
            <div className="space-y-4">
                <Label>Milestones</Label>
                <div className="space-y-2">
                    {goal.milestones.map(m => (
                        <div key={m.id} className="flex items-center gap-2">
                            <Checkbox id={m.id} checked={m.completed} />
                            <Label htmlFor={m.id} className={m.completed ? 'line-through text-muted-foreground' : ''}>{m.text}</Label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <DialogFooter><Button onClick={onClose}>Save Changes</Button><Button variant="outline" onClick={onClose}>Cancel</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const EditCoreValueDialog: React.FC<{ value: CoreValueType | null; isOpen: boolean; onClose: () => void; onSave: (value: CoreValueType) => void; }> = ({ value, isOpen, onClose, onSave }) => {
  if (!value) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Core Value</DialogTitle></DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2"><Label htmlFor="cv-name">Value</Label><Input id="cv-name" defaultValue={value.name} /></div>
          <div className="space-y-2"><Label htmlFor="cv-desc">Description</Label><Textarea id="cv-desc" defaultValue={value.description} /></div>
        </div>
        <DialogFooter><Button onClick={onClose}>Save Changes</Button><Button variant="outline" onClick={onClose}>Cancel</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};



// --- UI CARD COMPONENTS ---
const HabitCard: React.FC<{ habit: HabitType; onClick: (habit: HabitType) => void; onDelete: (habitId: string) => void; }> = ({ habit, onClick, onDelete }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent': case 'Consistent': return 'secondary';
      case 'Progressing': return 'outline';
      case 'Struggling': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="bg-card border border-border rounded-lg p-2 shadow-sm hover:shadow-md transition-all duration-200 group hover:border-primary/20 flex items-center justify-between h-14">
          <div onClick={() => onClick(habit)} className="flex items-center flex-1 cursor-pointer">
            <h3 className="font-semibold text-sm text-primary truncate flex-1 group-hover:text-primary/80">{habit.name}</h3>
            <Badge variant={getStatusColor(habit.progressStatus)} className="text-xs ml-2">{habit.progressStatus}</Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onClick(habit)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(habit.id);
                }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-3">
          <div><h4 className="font-semibold text-base">{habit.name}</h4><p className="text-sm text-muted-foreground mt-1">{habit.description}</p></div>
          <Separator />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Last Logged:</span><span className="font-medium">{habit.lastLogged}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Current Streak:</span><span className="font-medium">{habit.streak} days</span></div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

const GoalCard: React.FC<{ goal: GoalType; onClick: (goal: GoalType) => void; onDelete: (goalId: string) => void; }> = ({ goal, onClick, onDelete }) => {
  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      default: return 'outline';
    }
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="bg-card border border-border rounded-lg p-2 shadow-sm hover:shadow-md transition-all duration-200 group hover:border-primary/20 flex items-center justify-between h-14">
          <div onClick={() => onClick(goal)} className="flex items-center flex-1 cursor-pointer">
            <h3 className="font-semibold text-sm text-primary truncate flex-1 group-hover:text-primary/80">{goal.name}</h3>
            <Badge variant={getPriorityVariant(goal.priority)} className="text-xs ml-2">{goal.priority}</Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onClick(goal)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(goal.id);
                }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-3">
          <div><h4 className="font-semibold text-base">{goal.name}</h4><p className="text-sm text-muted-foreground mt-1">{goal.description}</p></div>
          <Separator />
          <div className="flex items-center gap-2"><Progress value={goal.progress} className="h-2 flex-1" /><span className="text-xs font-medium text-muted-foreground">{goal.progress}%</span></div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Target Date:</span><span className="font-medium">{new Date(goal.targetDeadline).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Milestones:</span><span className="font-medium">{goal.milestones?.filter(m => m.completed).length || 0}/{goal.milestones?.length || 0}</span></div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};


// --- Main App Component ---
export default function Page() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [lifePurpose, setLifePurpose] = useState('');
  const [coreValues, setCoreValues] = useState<CoreValue[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  
  const [selectedHabit, setSelectedHabit] = useState<HabitType | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<GoalType | null>(null);
  const [selectedCoreValue, setSelectedCoreValue] = useState<CoreValueType | null>(null);

  const [isHabitDialogOpen, setIsHabitDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isCoreValueDialogOpen, setIsCoreValueDialogOpen] = useState(false);
  
  const [isAddHabitsLogDrawerOpen, setIsAddHabitsLogDrawerOpen] = useState(false);
  const [isAddGoalDrawerOpen, setIsAddGoalDrawerOpen] = useState(false);
  const [isPurposeDialogOpen, setIsPurposeDialogOpen] = useState(false);
  const [isAddCoreValueDialogOpen, setIsAddCoreValueDialogOpen] = useState(false);

  // New state for core value creation
  const [newCoreValueName, setNewCoreValueName] = useState('');
  const [newCoreValueDescription, setNewCoreValueDescription] = useState('');

  // Load data from database
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load user values (contains life purpose and core values)
        const userValues = await getUserValues(user.uid);
        if (userValues) {
          // Extract life purpose from the first value (we'll use a special structure)
          const purposeValue = userValues.values.find(v => v.name === '_lifePurpose');
          if (purposeValue) {
            setLifePurpose(purposeValue.description || '');
          }
          
          // Set core values (exclude the special purpose entry)
          const realValues = userValues.values
            .filter(v => v.name !== '_lifePurpose')
            .map(v => ({
              id: v.name,
              name: v.name,
              description: v.description || '',
              importance: v.importance,
              alignment: v.alignment
            }));
          setCoreValues(realValues);
        }
        
        // Load compass entries (for habits and goals - we'll repurpose compass for this)
        const compassEntries = await getCompassEntries(user.uid);
        
        // Extract habits and goals from compass entries
        const habitsEntry = compassEntries.find(entry => entry.direction === 'north');
        const goalsEntry = compassEntries.find(entry => entry.direction === 'south');
        
        if (habitsEntry && habitsEntry.notes) {
          try {
            const parsedHabits = JSON.parse(habitsEntry.notes);
            setHabits(parsedHabits);
          } catch (e) {
            console.warn('Could not parse habits data');
          }
        }
        
        if (goalsEntry && goalsEntry.notes) {
          try {
            const parsedGoals = JSON.parse(goalsEntry.notes);
            setGoals(parsedGoals);
          } catch (e) {
            console.warn('Could not parse goals data');
          }
        }
        
      } catch (error) {
        console.error('Error loading compass data:', error);
        toast.error('Failed to load compass data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Save functions
  const savePurpose = async (newPurpose: string) => {
    if (!user) return;
    
    try {
      const currentValues = [...coreValues.map(cv => ({
        name: cv.name,
        description: cv.description,
        importance: cv.importance,
        alignment: cv.alignment
      }))];;
      
      // Add or update the special purpose entry
      const purposeIndex = currentValues.findIndex(v => v.name === '_lifePurpose');
      const purposeValue = {
        name: '_lifePurpose',
        description: newPurpose,
        importance: 10,
        alignment: 10
      };
      
      if (purposeIndex >= 0) {
        currentValues[purposeIndex] = purposeValue;
      } else {
        currentValues.push(purposeValue);
      }
      
      await saveUserValues(user.uid, currentValues);
      setLifePurpose(newPurpose);
      toast.success('Life purpose saved successfully');
    } catch (error) {
      console.error('Error saving purpose:', error);
      toast.error('Failed to save life purpose');
    }
  };
  
  const saveCoreValues = async (newValues: CoreValue[]) => {
    if (!user) return;
    
    try {
      const valuesForDb = newValues.map(cv => ({
        name: cv.name,
        description: cv.description,
        importance: cv.importance,
        alignment: cv.alignment
      }));
      
      // Preserve life purpose
      if (lifePurpose) {
        valuesForDb.push({
          name: '_lifePurpose',
          description: lifePurpose,
          importance: 10,
          alignment: 10
        });
      }
      
      await saveUserValues(user.uid, valuesForDb);
      setCoreValues(newValues);
      toast.success('Core values saved successfully');
    } catch (error) {
      console.error('Error saving core values:', error);
      toast.error('Failed to save core values');
    }
  };
  
  const saveHabits = async (newHabits: Habit[]) => {
    if (!user) return;
    
    try {
      await saveCompassEntry(user.uid, 'north', {
        goals: [],
        progress: 0,
        notes: JSON.stringify(newHabits)
      });
      setHabits(newHabits);
      toast.success('Habits saved successfully');
    } catch (error) {
      console.error('Error saving habits:', error);
      toast.error('Failed to save habits');
    }
  };
  
  const saveGoals = async (newGoals: Goal[]) => {
    if (!user) return;
    
    try {
      await saveCompassEntry(user.uid, 'south', {
        goals: [],
        progress: 0,
        notes: JSON.stringify(newGoals)
      });
      setGoals(newGoals);
      toast.success('Goals saved successfully');
    } catch (error) {
      console.error('Error saving goals:', error);
      toast.error('Failed to save goals');
    }
  };

  const handleHabitClick = (habit: HabitType) => {
    setSelectedHabit(habit);
    setIsHabitDialogOpen(true);
  };

  const handleGoalClick = (goal: GoalType) => {
    setSelectedGoal(goal);
    setIsGoalDialogOpen(true);
  };
  
  const handleCoreValueClick = (value: CoreValueType) => {
    setSelectedCoreValue(value);
    setIsCoreValueDialogOpen(true);
  };
  
  const handleSaveHabit = (updatedHabit: HabitType) => {
    const newHabits = habits.map(h => h.id === updatedHabit.id ? updatedHabit : h);
    saveHabits(newHabits);
  };
  
  const handleSaveGoal = (updatedGoal: GoalType) => {
    const newGoals = goals.map(g => g.id === updatedGoal.id ? updatedGoal : g);
    saveGoals(newGoals);
  };
  
  const handleSaveCoreValue = (updatedValue: CoreValueType) => {
    const newValues = coreValues.map(cv => cv.id === updatedValue.id ? updatedValue : cv);
    saveCoreValues(newValues);
  };
  
  const handleAddHabit = (habitData: any) => {
    const habit: Habit = {
      id: Date.now().toString(),
      name: habitData.name || 'New Habit',
      description: habitData.description || '',
      type: habitData.type === 'break' ? 'break' : 'build',
      recurrence: 'Daily',
      streak: 0,
      lastLogged: 'Never',
      progressStatus: 'New',
      weeklyProgress: [0, 0, 0, 0, 0, 0, 0]
    };
    saveHabits([...habits, habit]);
    setIsAddHabitsLogDrawerOpen(false);
  };
  
  // This will be called after GoalLogDrawer saves to database
  const handleGoalSaved = async () => {
    // Refresh the goals from database
    if (user) {
      try {
        const compassEntries = await getCompassEntries(user.uid);
        const goalsEntry = compassEntries.find(entry => entry.direction === 'south');
        
        if (goalsEntry && goalsEntry.notes) {
          try {
            const parsedGoals = JSON.parse(goalsEntry.notes);
            setGoals(parsedGoals);
          } catch (e) {
            console.warn('Could not parse goals data');
          }
        }
      } catch (error) {
        console.error('Error refreshing goals:', error);
      }
    }
  };

  const handleAddCoreValue = async () => {
    if (!newCoreValueName.trim()) {
      toast.error('Please enter a core value name', { position: 'top-center' });
      return;
    }

    const newValue: CoreValue = {
      id: Date.now().toString(),
      name: newCoreValueName.trim(),
      description: newCoreValueDescription.trim(),
      importance: 5,
      alignment: 5
    };

    const updatedValues = [...coreValues, newValue];
    await saveCoreValues(updatedValues);
    
    setNewCoreValueName('');
    setNewCoreValueDescription('');
    setIsAddCoreValueDialogOpen(false);
  };

  const handleDeleteCoreValue = async (valueId: string) => {
    const updatedValues = coreValues.filter(cv => cv.id !== valueId);
    await saveCoreValues(updatedValues);
  };

  const handleDeleteHabit = async (habitId: string) => {
    const updatedHabits = habits.filter(h => h.id !== habitId);
    await saveHabits(updatedHabits);
  };

  const handleDeleteGoal = async (goalId: string) => {
    const updatedGoals = goals.filter(g => g.id !== goalId);
    await saveGoals(updatedGoals);
  };
  
  const handleSavePurpose = (newPurpose: string) => {
    savePurpose(newPurpose);
    setIsPurposeDialogOpen(false);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Please log in to access your Purpose Compass.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
       
      <ResizablePanelGroup direction="vertical" className="flex-1">
        <ResizablePanel defaultSize={25} minSize={20}>
          <div className="p-6 h-full flex flex-col gap-6">
        <div className="relative group bg-muted/40 p-4 rounded-lg flex items-center gap-4">
          <h2 className="text-lg font-semibold text-primary whitespace-nowrap">Purpose</h2>
          <Separator orientation="vertical" className="h-6" />
          <p className="text-muted-foreground italic truncate flex-1">{lifePurpose}</p>
          <div className="absolute top-1/2 -translate-y-1/2 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={() => setIsPurposeDialogOpen(true)}><Pencil className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="relative group bg-muted/40 p-4 rounded-lg flex items-center gap-4">
          <h2 className="text-lg font-semibold text-primary whitespace-nowrap">Core Values</h2>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex flex-1 flex-wrap gap-2">
            {coreValues.map((cv) => (
          <HoverCard key={cv.id}>
            <HoverCardTrigger asChild>
              <div className="group relative">
                <Badge
              variant="outline"
              onClick={() => handleCoreValueClick(cv)}
              className="px-2 py-1 text-xs cursor-pointer hover:bg-accent transition-colors pr-8"
                >
              {cv.name}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 h-full w-6 opacity-0 group-hover:opacity-100 transition-opacity p-0"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleCoreValueClick(cv)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCoreValue(cv.id);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-60">
              <h4 className="font-semibold">{cv.name}</h4>
              <p className="text-sm text-muted-foreground">{cv.description}</p>
            </HoverCardContent>
          </HoverCard>
            ))}
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsAddCoreValueDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={75} minSize={40}>
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary" /><h2 className="text-xl font-semibold">Habit Tracker</h2></div>
                  <Button variant="outline" size="sm" onClick={() => setIsAddHabitsLogDrawerOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Habit</Button>
                </div>
                <Tabs defaultValue="build" className="flex-1 flex flex-col">
                  <TabsList className="w-full grid grid-cols-2"><TabsTrigger value="build">Build Habits</TabsTrigger><TabsTrigger value="break">Break Habits</TabsTrigger></TabsList>
                  <TabsContent value="build" className="flex-1 overflow-y-auto mt-4 pr-2"><div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">{habits.filter(h => h.type === 'build').map(habit => (<HabitCard key={habit.id} habit={habit} onClick={handleHabitClick} onDelete={handleDeleteHabit} />))}</div></TabsContent>
                  <TabsContent value="break" className="flex-1 overflow-y-auto mt-4 pr-2"><div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">{habits.filter(h => h.type === 'break').map(habit => (<HabitCard key={habit.id} habit={habit} onClick={handleHabitClick} onDelete={handleDeleteHabit} />))}</div></TabsContent>
                </Tabs>
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><GoalIcon className="h-6 w-6 text-primary" /><h2 className="text-xl font-semibold">Goal Tracker</h2></div>
                  <Button variant="outline" size="sm" onClick={() => setIsAddGoalDrawerOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Goal</Button>
                </div>
                <Tabs defaultValue="long-term" className="flex-1 flex flex-col">
                  <TabsList className="w-full grid grid-cols-2"><TabsTrigger value="long-term">Long-Term</TabsTrigger><TabsTrigger value="short-term">Short-Term</TabsTrigger></TabsList>
                  <TabsContent value="long-term" className="flex-1 overflow-y-auto mt-4 pr-2"><div className="space-y-3">{goals.filter(g => g.type === 'long-term').map(goal => (<GoalCard key={goal.id} goal={goal} onClick={handleGoalClick} onDelete={handleDeleteGoal} />))}</div></TabsContent>
                  <TabsContent value="short-term" className="flex-1 overflow-y-auto mt-4 pr-2"><div className="space-y-3">{goals.filter(g => g.type === 'short-term').map(goal => (<GoalCard key={goal.id} goal={goal} onClick={handleGoalClick} onDelete={handleDeleteGoal} />))}</div></TabsContent>
                </Tabs>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Dialogs for Editing */}
      <EditHabitDialog 
        habit={selectedHabit} 
        isOpen={isHabitDialogOpen} 
        onClose={() => setIsHabitDialogOpen(false)}
        onSave={handleSaveHabit}
      />
      <EditGoalDialog 
        goal={selectedGoal} 
        isOpen={isGoalDialogOpen} 
        onClose={() => setIsGoalDialogOpen(false)}
        onSave={handleSaveGoal}
      />
      <EditCoreValueDialog 
        value={selectedCoreValue} 
        isOpen={isCoreValueDialogOpen} 
        onClose={() => setIsCoreValueDialogOpen(false)}
        onSave={handleSaveCoreValue}
      />

      {/* New Drawers for Adding */}
      <HabitsLogDrawer
        open={isAddHabitsLogDrawerOpen}
        onOpenChange={setIsAddHabitsLogDrawerOpen}
        mode="create"
        onHabitSaved={handleAddHabit}
      />
      <GoalLogDrawer
        open={isAddGoalDrawerOpen}
        onOpenChange={(open) => {
          setIsAddGoalDrawerOpen(open);
          if (!open) {
            // Refresh goals when drawer closes
            handleGoalSaved();
          }
        }}
      />

      <Dialog open={isPurposeDialogOpen} onOpenChange={setIsPurposeDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Life Purpose</DialogTitle><DialogDescription>Define your core purpose and what drives you in life.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="purpose-text">Life Purpose Statement</Label><Textarea id="purpose-text" value={lifePurpose} onChange={(e) => setLifePurpose(e.target.value)} placeholder="What is your fundamental reason for being?" className="min-h-[100px]" /></div></div>
          <DialogFooter><Button onClick={() => handleSavePurpose(lifePurpose)}>Save Purpose</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Core Value Add Dialog */}
      <Dialog open={isAddCoreValueDialogOpen} onOpenChange={setIsAddCoreValueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Core Value</DialogTitle>
            <DialogDescription>Define a new core value that guides your life decisions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="value-name">Core Value Name</Label>
              <Input 
                id="value-name" 
                value={newCoreValueName} 
                onChange={(e) => setNewCoreValueName(e.target.value)} 
                placeholder="e.g., Integrity, Growth, Family"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value-description">Description</Label>
              <Textarea 
                id="value-description" 
                value={newCoreValueDescription} 
                onChange={(e) => setNewCoreValueDescription(e.target.value)} 
                placeholder="What does this value mean to you and how does it guide your decisions?"
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddCoreValueDialogOpen(false);
              setNewCoreValueName('');
              setNewCoreValueDescription('');
            }}>Cancel</Button>
            <Button onClick={handleAddCoreValue}>Add Core Value</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
