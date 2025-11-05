"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bot, Loader2 } from 'lucide-react';

const formSchema = z.object({
  unitType: z.string().min(1, 'Unit type is required.'),
  trainingGoals: z.string().min(10, 'Please provide detailed training goals.'),
  additionalContext: z.string().optional(),
});

export type PlannerFormValues = z.infer<typeof formSchema>;

interface PlannerFormProps {
    onSubmit: (values: PlannerFormValues) => void;
    isLoading: boolean;
}

export function PlannerForm({ onSubmit, isLoading }: PlannerFormProps) {
  const form = useForm<PlannerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unitType: 'squad',
      trainingGoals: 'Improve average AFT score by 15 points and reduce average 2-mile run time by 30 seconds.',
      additionalContext: 'Preparing for a field training exercise in 2 months.',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="unitType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a unit type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="squad">Squad</SelectItem>
                  <SelectItem value="platoon">Platoon</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Bot className="mr-2 h-4 w-4" />
              Generate Plan
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
