'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BookingTabs } from '@/components/dashboard/BookingTabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';

interface RefundBooking {
  orderReference: string;
  paxDetails: string;
  ticketNumber: string;
  refundAmount: string;
  requestDate: string;
  status: string;
}

const statusColors: Record<string, { color: string, bg: string }> = {
  'Pending': { color: 'text-yellow-700', bg: 'bg-yellow-100' },
  'Processing': { color: 'text-blue-700', bg: 'bg-blue-100' },
  'Completed': { color: 'text-green-700', bg: 'bg-green-100' },
  'Rejected': { color: 'text-red-700', bg: 'bg-red-100' },
};

export default function RefundPage() {
  const { user } = useAuth();
  const [refunds, setRefunds] = useState<RefundBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/refunds/list`, {
          headers: {
            'Authorization': `Bearer ${user?.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch refunds');
        }

        const data = await response.json();
        setRefunds(data.refunds || []);
      } catch (err) {
        console.error('Error fetching refunds:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchRefunds();
    }
  }, [user]);

  const filteredRefunds = refunds.filter(refund => {
    return searchTerm === '' || 
      refund.orderReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.paxDetails.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <BookingTabs />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading refunds...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <BookingTabs />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BookingTabs />
      <div className="container mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Refund Requests</h1>
          <div className="flex gap-2">
            <Input
              placeholder="Search by reference, ticket or passenger"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference No</TableHead>
                <TableHead>Ticket Number</TableHead>
                <TableHead>Passenger Details</TableHead>
                <TableHead>Refund Amount</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRefunds.map((refund) => (
                <TableRow key={refund.orderReference}>
                  <TableCell className="font-medium">{refund.orderReference}</TableCell>
                  <TableCell>{refund.ticketNumber}</TableCell>
                  <TableCell>{refund.paxDetails}</TableCell>
                  <TableCell>{refund.refundAmount}</TableCell>
                  <TableCell>
                    {format(new Date(refund.requestDate), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`${statusColors[refund.status]?.bg} ${statusColors[refund.status]?.color}`}
                    >
                      {refund.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
} 