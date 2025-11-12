"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Loader2, Image as ImageIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getAllExercises,
  searchExercises,
  getExercisesByBodyPart,
  getExercisesByEquipment,
  BODY_PARTS,
  EQUIPMENT_TYPES,
  type Exercise,
} from '@/lib/exercisedb';

interface ExerciseBrowserProps {
  onSelectExercise: (exercise: Exercise) => void;
  selectedExercises?: Exercise[];
}

export function ExerciseBrowser({ onSelectExercise, selectedExercises = [] }: ExerciseBrowserProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Load initial exercises
  useEffect(() => {
    loadExercises();
  }, []);

  // Filter exercises based on search and filters
  useEffect(() => {
    filterExercises();
  }, [exercises, searchQuery, selectedBodyPart, selectedEquipment]);

  async function loadExercises() {
    setIsLoading(true);
    try {
      const data = await getAllExercises(500); // Load first 500 exercises
      setExercises(data);
      setFilteredExercises(data);
    } catch (error) {
      console.error('Failed to load exercises:', error);
      // Fallback to empty array if API fails
      setExercises([]);
      setFilteredExercises([]);
    } finally {
      setIsLoading(false);
    }
  }

  function filterExercises() {
    let filtered = [...exercises];

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ex) =>
          ex.name.toLowerCase().includes(query) ||
          ex.targetMuscles.some(m => m.toLowerCase().includes(query)) ||
          ex.bodyParts.some(bp => bp.toLowerCase().includes(query))
      );
    }

    // Apply body part filter
    if (selectedBodyPart !== 'all') {
      filtered = filtered.filter((ex) =>
        ex.bodyParts.some(bp => bp.toLowerCase() === selectedBodyPart.toLowerCase())
      );
    }

    // Apply equipment filter
    if (selectedEquipment !== 'all') {
      filtered = filtered.filter((ex) =>
        ex.equipments.some(eq => eq.toLowerCase() === selectedEquipment.toLowerCase())
      );
    }

    setFilteredExercises(filtered);
  }

  function handleSelectExercise(exercise: Exercise) {
    setSelectedExercise(exercise);
  }

  function handleAddExercise() {
    if (selectedExercise) {
      onSelectExercise(selectedExercise);
      setSelectedExercise(null);
    }
  }

  const isExerciseSelected = (exerciseId: string) => {
    return selectedExercises.some((ex) => ex.exerciseId === exerciseId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      {/* Left sidebar - Filters and Search */}
      <div className="md:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Body Part Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Body Part</label>
              <Select value={selectedBodyPart} onValueChange={setSelectedBodyPart}>
                <SelectTrigger>
                  <SelectValue placeholder="All body parts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All body parts</SelectItem>
                  {BODY_PARTS.map((part) => (
                    <SelectItem key={part} value={part}>
                      {part.charAt(0).toUpperCase() + part.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Equipment Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Equipment</label>
              <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                <SelectTrigger>
                  <SelectValue placeholder="All equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All equipment</SelectItem>
                  {EQUIPMENT_TYPES.map((equipment) => (
                    <SelectItem key={equipment} value={equipment}>
                      {equipment.charAt(0).toUpperCase() + equipment.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {filteredExercises.length} of {exercises.length} exercises
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle - Exercise List */}
      <div className="md:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-base">Exercise Library</CardTitle>
            <CardDescription>Click an exercise to view details</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 p-4">
                  {filteredExercises.map((exercise) => (
                    <Card
                      key={exercise.exerciseId}
                      className={`cursor-pointer transition-all hover:border-primary ${
                        selectedExercise?.exerciseId === exercise.exerciseId ? 'border-primary bg-accent' : ''
                      } ${isExerciseSelected(exercise.exerciseId) ? 'opacity-50' : ''}`}
                      onClick={() => handleSelectExercise(exercise)}
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
                            <h4 className="font-semibold text-sm truncate">{exercise.name}</h4>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              <Badge variant="secondary" className="text-xs">
                                {exercise.bodyParts[0]}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {exercise.targetMuscles[0]}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {isExerciseSelected(exercise.exerciseId) && (
                          <Badge className="mt-2" variant="default">
                            Already added
                          </Badge>
                        )}
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

      {/* Right - Exercise Details */}
      <div className="md:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-base">Exercise Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedExercise ? (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {/* Exercise Image/GIF */}
                  {selectedExercise.gifUrl ? (
                    <img
                      src={selectedExercise.gifUrl}
                      alt={selectedExercise.name}
                      className="w-full rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* Exercise Info */}
                  <div>
                    <h3 className="font-bold text-lg">{selectedExercise.name}</h3>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {selectedExercise.bodyParts.map((bp, idx) => (
                        <Badge key={idx}>{bp}</Badge>
                      ))}
                      {selectedExercise.targetMuscles.map((tm, idx) => (
                        <Badge key={idx} variant="secondary">{tm}</Badge>
                      ))}
                      {selectedExercise.equipments.map((eq, idx) => (
                        <Badge key={idx} variant="outline">{eq}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  {selectedExercise.instructions && selectedExercise.instructions.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Instructions:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        {selectedExercise.instructions.map((instruction, index) => (
                          <li key={index}>{instruction}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Secondary Muscles */}
                  {selectedExercise.secondaryMuscles && selectedExercise.secondaryMuscles.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Secondary Muscles:</h4>
                      <div className="flex gap-1 flex-wrap">
                        {selectedExercise.secondaryMuscles.map((muscle, index) => (
                          <Badge key={index} variant="outline">
                            {muscle}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Button */}
                  <Button
                    onClick={handleAddExercise}
                    className="w-full"
                    disabled={isExerciseSelected(selectedExercise.exerciseId)}
                  >
                    {isExerciseSelected(selectedExercise.exerciseId) ? 'Already Added' : 'Add to Workout'}
                  </Button>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-96 text-muted-foreground text-sm">
                Select an exercise to view details
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
