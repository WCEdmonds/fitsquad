"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2 } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

const formSchema = z.object({
  trainingGoals: z.string().min(10, 'Please provide detailed training goals.'),
  additionalContext: z.string().optional(),
  days: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one day.",
  }),
  equipmentAccess: z.enum(["gym", "bodyweight"]).optional().nullable(),
});

export type PlannerFormValues = z.infer<typeof formSchema>;

interface PlannerFormProps {
    onSubmit: (values: PlannerFormValues) => void;
    isLoading: boolean;
    accountType?: 'Soldier' | 'Supervisor' | 'Commander';
}

export function PlannerForm({ onSubmit, isLoading, accountType }: PlannerFormProps) {
  const form = useForm<PlannerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trainingGoals: 'Improve average AFT score by 15 points and reduce average 2-mile run time by 30 seconds.',
      additionalContext: 'Preparing for a field training exercise in 2 months.',
      days: ["Monday", "Tuesday", "Thursday", "Friday"],
      equipmentAccess: "gym",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {accountType === 'Soldier' && (
             <FormField
                control={form.control}
                name="equipmentAccess"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Equipment Access</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value ?? undefined} 
                        className="flex flex-col space-y-1"
                        >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="gym" />
                            </FormControl>
                            <FormLabel className="font-normal">
                            Gym Access
                            </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="bodyweight" />
                            </FormControl>
                            <FormLabel className="font-normal">
                            Bodyweight Only
                            </FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        )}
        <FormField
          control={form.control}
          name="trainingGoals"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Training Goals</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Improve average AFT score by 15 points..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="additionalContext"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Context (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Upcoming deployment, focus on ruck marching." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="days"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Workout Days</FormLabel>
                <FormDescription>
                  Select the days you want to generate a plan for.
                </FormDescription>
              </div>
              <div className="grid grid-cols-3 gap-2">
              {daysOfWeek.map((item) => (
                <FormField
                  key={item}
                  control={form.control}
                  name="days"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== item
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {item}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Calendar className="mr-2 h-4 w-4" />
              Generate Plan
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
