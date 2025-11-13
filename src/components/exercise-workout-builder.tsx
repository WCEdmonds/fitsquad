"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Loader2, Image as ImageIcon, AlertCircle, Plus, GripVertical, Trash2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getAllExercises,
  type Exercise as ExerciseDBExercise,
} from '@/lib/exercisedb';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  perceivedExertion?: string;
  description?: string;
}

interface ExerciseWorkoutBuilderProps {
  exercises: Exercise[];
  onUpdateExercises: (exercises: Exercise[]) => void;
}

// Common cardio exercise presets
const CARDIO_PRESETS = [
  { name: '4x400m Sprints', sets: '4', reps: '400m', rest: '90-120s', perceivedExertion: '8' },
  { name: 'Long Run', sets: '1', reps: '5-8 miles', rest: 'N/A', perceivedExertion: '6' },
  { name: 'Interval Running', sets: '6', reps: '2 min fast / 1 min jog', rest: 'As noted', perceivedExertion: '8' },
  { name: 'Hill Sprints', sets: '8', reps: '30s uphill', rest: '90s', perceivedExertion: '9' },
  { name: 'Tempo Run', sets: '1', reps: '20-30 min', rest: 'N/A', perceivedExertion: '7' },
  { name: 'Rowing Intervals', sets: '5', reps: '500m', rest: '90s', perceivedExertion: '8' },
  { name: 'Assault Bike', sets: '6', reps: '1 min', rest: '60s', perceivedExertion: '9' },
  { name: 'Jump Rope', sets: '5', reps: '3 min', rest: '60s', perceivedExertion: '7' },
  { name: 'Stationary Bike HIIT', sets: '10', reps: '30s sprint / 30s easy', rest: 'As noted', perceivedExertion: '8' },
  { name: 'Bike Tabata', sets: '8', reps: '20s max / 10s rest', rest: 'As noted', perceivedExertion: '9' },
  { name: 'Stair Climber', sets: '1', reps: '20 min', rest: 'N/A', perceivedExertion: '6' },
  { name: 'Swimming', sets: '1', reps: '30 min', rest: 'N/A', perceivedExertion: '6' },
];

export function ExerciseWorkoutBuilder({ exercises, onUpdateExercises }: ExerciseWorkoutBuilderProps) {
  const [dbExercises, setDbExercises] = useState<ExerciseDBExercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<ExerciseDBExercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('all');
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDBExercise | null>(null);
  const [availableBodyParts, setAvailableBodyParts] = useState<string[]>([]);
  const [availableEquipments, setAvailableEquipments] = useState<string[]>([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCardioDialog, setShowCardioDialog] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [customExercise, setCustomExercise] = useState<Exercise>({
    name: '',
    sets: '3',
    reps: '10',
    rest: '60s',
    perceivedExertion: '7',
  });
  const { toast } = useToast();

  const capitalizeWords = (str: string): string => {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const cleanInstruction = (instruction: string): string => {
    return instruction.replace(/^Step:\d+\s*/i, '').trim();
  };

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    filterExercises();
  }, [dbExercises, searchQuery, selectedBodyPart, selectedEquipments]);

  async function loadExercises() {
    setIsLoading(true);
    setError(null);

    try {
      const allExercises: ExerciseDBExercise[] = [];
      const limit = 100;
      const totalToLoad = 500;

      for (let offset = 0; offset < totalToLoad; offset += limit) {
        const batch = await getAllExercises(limit, offset);
        if (batch && batch.length > 0) {
          allExercises.push(...batch);
        } else {
          break;
        }
      }

      if (allExercises.length === 0) {
        setError('API returned empty data array');
      }

      const bodyPartsSet = new Set<string>();
      const equipmentsSet = new Set<string>();

      allExercises.forEach(exercise => {
        exercise.bodyParts.forEach(bp => bodyPartsSet.add(bp));
        exercise.equipments.forEach(eq => equipmentsSet.add(eq));
      });

      setAvailableBodyParts(Array.from(bodyPartsSet).sort());
      setAvailableEquipments(Array.from(equipmentsSet).sort());
      setDbExercises(allExercises);
      setFilteredExercises(allExercises);
    } catch (error: any) {
      let errorMessage = 'Could not load exercise database. ';
      if (error.message?.includes('Failed to fetch')) {
        errorMessage += 'Network error - check your connection.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }
      setError(errorMessage);
      toast({
        title: "Error Loading Exercises",
        description: errorMessage,
        variant: "destructive",
      });
      setDbExercises([]);
      setFilteredExercises([]);
    } finally {
      setIsLoading(false);
    }
  }

  function filterExercises() {
    let filtered = [...dbExercises];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ex) =>
          ex.name.toLowerCase().includes(query) ||
          ex.targetMuscles.some(m => m.toLowerCase().includes(query)) ||
          ex.bodyParts.some(bp => bp.toLowerCase().includes(query))
      );
    }

    if (selectedBodyPart !== 'all') {
      filtered = filtered.filter((ex) =>
        ex.bodyParts.some(bp => bp.toLowerCase() === selectedBodyPart.toLowerCase())
      );
    }

    if (selectedEquipments.length > 0) {
      filtered = filtered.filter((ex) =>
        ex.equipments.some(eq =>
          selectedEquipments.some(selected => selected.toLowerCase() === eq.toLowerCase())
        )
      );
    }

    setFilteredExercises(filtered);
  }

  function toggleEquipment(equipment: string) {
    setSelectedEquipments(prev =>
      prev.includes(equipment)
        ? prev.filter(e => e !== equipment)
        : [...prev, equipment]
    );
  }

  function clearEquipmentFilters() {
    setSelectedEquipments([]);
  }

  function handleAddToPlan(exercise: ExerciseDBExercise) {
    const newExercise: Exercise = {
      name: exercise.name,
      sets: '3',
      reps: '10',
      rest: '60s',
      perceivedExertion: '7',
      description: exercise.instructions?.join('. ') || exercise.targetMuscles.join(', '),
    };

    onUpdateExercises([...exercises, newExercise]);
    toast({
      title: "Exercise Added",
      description: `${capitalizeWords(exercise.name)} added to workout plan.`,
    });
  }

  function handleViewDetails(exercise: ExerciseDBExercise) {
    setSelectedExercise(exercise);
    setShowDetailsDialog(true);
  }

  function handleRemoveExercise(index: number) {
    onUpdateExercises(exercises.filter((_, i) => i !== index));
  }

  function handleUpdateExercise(index: number, field: keyof Exercise, value: string) {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    onUpdateExercises(updated);
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(targetIndex: number) {
    if (draggedIndex === null) return;

    const newExercises = [...exercises];
    const [movedExercise] = newExercises.splice(draggedIndex, 1);
    newExercises.splice(targetIndex, 0, movedExercise);

    onUpdateExercises(newExercises);
    setDraggedIndex(null);
  }

  const isExerciseInPlan = (exerciseId: string) => {
    return exercises.some((ex) => ex.name.toLowerCase() === exerciseId.toLowerCase());
  };

  function handleAddCustomExercise() {
    if (!customExercise.name.trim()) {
      toast({
        title: "Exercise Name Required",
        description: "Please enter an exercise name.",
        variant: "destructive",
      });
      return;
    }

    onUpdateExercises([...exercises, { ...customExercise }]);

    // Reset form
    setCustomExercise({
      name: '',
      sets: '3',
      reps: '10',
      rest: '60s',
      perceivedExertion: '7',
    });
    setShowCustomDialog(false);

    toast({
      title: "Custom Exercise Added",
      description: `${capitalizeWords(customExercise.name)} added to workout plan.`,
    });
  }

  function handleSelectCardioPreset(preset: typeof CARDIO_PRESETS[0]) {
    onUpdateExercises([...exercises, { ...preset }]);
    setShowCardioDialog(false);

    toast({
      title: "Cardio Exercise Added",
      description: `${preset.name} added to workout plan.`,
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-auto lg:h-[500px]">
        {/* Left sidebar - Filters and Search */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search & Filter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Body Part</label>
                <Select value={selectedBodyPart} onValueChange={setSelectedBodyPart}>
                  <SelectTrigger>
                    <SelectValue placeholder="All body parts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All body parts</SelectItem>
                    {availableBodyParts.map((part) => (
                      <SelectItem key={part} value={part}>
                        {capitalizeWords(part)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Equipment</label>
                  {selectedEquipments.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearEquipmentFilters}
                      className="h-auto p-0 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedEquipments.length > 0
                        ? `${selectedEquipments.length} selected`
                        : "All equipment"}
                      <Filter className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[240px] p-0">
                    <Command>
                      <CommandInput placeholder="Search equipment..." />
                      <CommandEmpty>No equipment found.</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-[200px]">
                          {availableEquipments.map((equipment) => (
                            <CommandItem
                              key={equipment}
                              onSelect={() => toggleEquipment(equipment)}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <Checkbox
                                  checked={selectedEquipments.includes(equipment)}
                                  onCheckedChange={() => toggleEquipment(equipment)}
                                />
                                <span className="text-sm">{capitalizeWords(equipment)}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedEquipments.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedEquipments.map((eq) => (
                      <Badge key={eq} variant="secondary" className="text-xs">
                        {capitalizeWords(eq)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                Showing {filteredExercises.length} of {dbExercises.length} exercises
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle - Exercise List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Exercise Library</CardTitle>
              <CardDescription>Click exercise for details, or add to plan</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {error && (
                <div className="p-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex flex-col gap-2">
                      <span>{error}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadExercises}
                        className="w-fit"
                      >
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              {isLoading ? (
                <div className="flex items-center justify-center h-96">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[300px] lg:h-[430px]">
                  <div className="space-y-2 p-4">
                    {filteredExercises.map((exercise) => (
                      <Card
                        key={exercise.exerciseId}
                        className="transition-all hover:border-primary"
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            {exercise.gifUrl ? (
                              <img
                                src={exercise.gifUrl}
                                alt={exercise.name}
                                className="w-16 h-16 object-cover rounded"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate">{capitalizeWords(exercise.name)}</h4>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                <Badge variant="secondary" className="text-xs">
                                  {capitalizeWords(exercise.bodyParts[0])}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {capitalizeWords(exercise.targetMuscles[0])}
                                </Badge>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewDetails(exercise)}
                                  className="h-7 px-2"
                                >
                                  <Info className="h-3 w-3 mr-1" />
                                  Details
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleAddToPlan(exercise)}
                                  disabled={isExerciseInPlan(exercise.name)}
                                  className="h-7 px-2"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  {isExerciseInPlan(exercise.name) ? 'Added' : 'Add to Plan'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {filteredExercises.length === 0 && !isLoading && (
                      <div className="text-center py-12 text-muted-foreground">
                        No exercises found. Try adjusting your filters.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right - Workout Plan */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base">Workout Plan</CardTitle>
                  <CardDescription className="text-xs mt-1">Drag to reorder</CardDescription>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCardioDialog(true)}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Cardio</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomDialog(true)}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Custom</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px] lg:h-[430px]">
                <div className="space-y-2 p-4">
                  {exercises.map((exercise, index) => (
                    <Card
                      key={index}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index)}
                      className="cursor-move hover:border-primary transition-all"
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-5 w-5 text-muted-foreground mt-2 hidden sm:block" />
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <Input
                                placeholder="Exercise name"
                                value={exercise.name}
                                onChange={(e) => handleUpdateExercise(index, 'name', e.target.value)}
                                className="font-semibold"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveExercise(index)}
                                className="ml-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <Input
                                placeholder="Sets"
                                value={exercise.sets}
                                onChange={(e) => handleUpdateExercise(index, 'sets', e.target.value)}
                              />
                              <Input
                                placeholder="Reps"
                                value={exercise.reps}
                                onChange={(e) => handleUpdateExercise(index, 'reps', e.target.value)}
                              />
                              <Input
                                placeholder="Rest"
                                value={exercise.rest}
                                onChange={(e) => handleUpdateExercise(index, 'rest', e.target.value)}
                              />
                              <Input
                                placeholder="RPE"
                                value={exercise.perceivedExertion || ''}
                                onChange={(e) => handleUpdateExercise(index, 'perceivedExertion', e.target.value)}
                                type="number"
                                min="1"
                                max="10"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {exercises.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      No exercises in your plan yet. Add exercises from the library.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Exercise Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedExercise && capitalizeWords(selectedExercise.name)}</DialogTitle>
          </DialogHeader>
          {selectedExercise && (
            <div className="space-y-4">
              {selectedExercise.gifUrl && (
                <img
                  src={selectedExercise.gifUrl}
                  alt={selectedExercise.name}
                  className="w-full rounded-lg"
                />
              )}

              <div className="flex gap-2 flex-wrap">
                {selectedExercise.bodyParts.map((bp, idx) => (
                  <Badge key={idx}>{capitalizeWords(bp)}</Badge>
                ))}
                {selectedExercise.targetMuscles.map((tm, idx) => (
                  <Badge key={idx} variant="secondary">{capitalizeWords(tm)}</Badge>
                ))}
                {selectedExercise.equipments.map((eq, idx) => (
                  <Badge key={idx} variant="outline">{capitalizeWords(eq)}</Badge>
                ))}
              </div>

              {selectedExercise.instructions && selectedExercise.instructions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {selectedExercise.instructions.map((instruction, index) => (
                      <li key={index}>{cleanInstruction(instruction)}</li>
                    ))}
                  </ol>
                </div>
              )}

              {selectedExercise.secondaryMuscles && selectedExercise.secondaryMuscles.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Secondary Muscles:</h4>
                  <div className="flex gap-1 flex-wrap">
                    {selectedExercise.secondaryMuscles.map((muscle, index) => (
                      <Badge key={index} variant="outline">
                        {capitalizeWords(muscle)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={() => {
                  handleAddToPlan(selectedExercise);
                  setShowDetailsDialog(false);
                }}
                disabled={isExerciseInPlan(selectedExercise.name)}
                className="w-full"
              >
                {isExerciseInPlan(selectedExercise.name) ? 'Already in Plan' : 'Add to Plan'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cardio Exercise Dialog */}
      <Dialog open={showCardioDialog} onOpenChange={setShowCardioDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Cardio Exercise</DialogTitle>
            <DialogDescription>Select a cardio exercise to add to your workout</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px]">
            <div className="grid grid-cols-2 gap-3 p-1">
              {CARDIO_PRESETS.map((preset, idx) => (
                <Card
                  key={idx}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleSelectCardioPreset(preset)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{preset.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {preset.sets}x{preset.reps} • {preset.rest} rest • RPE {preset.perceivedExertion}/10
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Custom Exercise Dialog */}
      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Exercise</DialogTitle>
            <DialogDescription>Create your own exercise with custom details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="custom-name">Exercise Name *</Label>
              <Input
                id="custom-name"
                placeholder="e.g., Burpees, Box Jumps, Turkish Get-ups"
                value={customExercise.name}
                onChange={(e) => setCustomExercise({ ...customExercise, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="custom-sets">Sets</Label>
                <Input
                  id="custom-sets"
                  placeholder="e.g., 3"
                  value={customExercise.sets}
                  onChange={(e) => setCustomExercise({ ...customExercise, sets: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="custom-reps">Reps</Label>
                <Input
                  id="custom-reps"
                  placeholder="e.g., 10"
                  value={customExercise.reps}
                  onChange={(e) => setCustomExercise({ ...customExercise, reps: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="custom-rest">Rest</Label>
                <Input
                  id="custom-rest"
                  placeholder="e.g., 60s"
                  value={customExercise.rest}
                  onChange={(e) => setCustomExercise({ ...customExercise, rest: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="custom-rpe">RPE (1-10)</Label>
                <Input
                  id="custom-rpe"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="7"
                  value={customExercise.perceivedExertion}
                  onChange={(e) => setCustomExercise({ ...customExercise, perceivedExertion: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCustomDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAddCustomExercise} className="flex-1">
                Add Exercise
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
