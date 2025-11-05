'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from './ui/button';
import { FileText, Eye } from 'lucide-react';
import Link from 'next/link';

interface SavedPlanListProps {
  plans: any[];
  teamId: string;
}

export function SavedPlanList({ plans, teamId }: SavedPlanListProps) {
  
  const sortedPlans = plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Plan Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Date Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedPlans.map((plan) => (
          <TableRow key={plan.id}>
            <TableCell className="font-medium">{plan.name}</TableCell>
            <TableCell>{plan.description}</TableCell>
            <TableCell>{new Date(plan.createdAt).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
                <Link href={`/dashboard/saved-plans/${plan.id}`} passHref>
                    <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View Plan
                    </Button>
                </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
