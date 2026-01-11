'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  // Vitals
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  weight: z.coerce.number().min(0, 'Weight must be positive.').optional(),
  height: z.coerce.number().min(0, 'Height must be positive.').optional(),
  bodyFatPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
  restingHeartRate: z.coerce.number().min(0).optional().nullable(),
  // ACFT Events
  mdl: z.coerce.number().min(0).max(100, 'Score must be 100 or less.'),
  hrp: z.coerce.number().min(0).max(100, 'Score must be 100 or less.'),
  sdc: z.coerce.number().min(0).max(100, 'Score must be 100 or less.'),
  plk: z.coerce.number().min(0).max(100, 'Score must be 100 or less.'),
  twoMileRun: z.coerce.number().min(0).max(100, 'Score must be 100 or less.'),
  healthInfo: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface FitnessDataDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<FormValues>) => Promise<void>;
  initialData?: Partial<FormValues>;
  isEditing?: boolean;
}

export function FitnessDataDialog({
  isOpen,
  onOpenChange,
  onSave,
  initialData,
  isEditing = false,
}: FitnessDataDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      mdl: 0,
      hrp: 0,
      sdc: 0,
      plk: 0,
      twoMileRun: 0,
      weight: 0,
      height: 0,
      healthInfo: '',
      bodyFatPercentage: null,
      restingHeartRate: null,
      gender: 'Male',
    },
  });

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (isOpen && initialData) {
      form.reset(initialData);
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      await onSave(values);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving fitness data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Add'} Fitness Log</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your fitness test results and health data.'
              : 'Record your fitness test results and health data.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold border-b pb-2 mb-4">Vitals</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (lbs)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 180" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (inches)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 70" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bodyFatPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body Fat % (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 18"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="restingHeartRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resting HR (bpm, Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 60"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold border-b pb-2 mb-4">AFT Event Scores (0-100)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="mdl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Deadlift (MDL)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 80" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hrp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hand-Release Pushups (HRP)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 75" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sdc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sprint-Drag-Carry (SDC)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 70" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="plk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plank (PLK)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 65" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="twoMileRun"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>2-Mile Run (2MR)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 85" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="healthInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Health Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any injuries, limitations, or health notes to consider."
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
