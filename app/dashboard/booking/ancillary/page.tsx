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

interface AncillaryBooking {
  orderReference: string;
  paxDetails: string;
  serviceType: string;
  amount: string;
  bookingDate: string;
  status: string;
}

const statusColors: Record<string, { color: string, bg: string }> = {
  'Pending': { color: 'text-yellow-700', bg: 'bg-yellow-100' },
  'Confirmed': { color: 'text-green-700', bg: 'bg-green-100' },
  'Cancelled': { color: 'text-red-700', bg: 'bg-red-100' },
};

export default function AncillaryPage() {
  const { user } = useAuth();
  const [ancillaries, setAncillaries] = useState<AncillaryBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAncillaries = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ancillary/list`, {
          headers: {
            'Authorization': `Bearer ${user?.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch ancillary services');
        }

        const data = await response.json();
        setAncillaries(data.ancillaries || []);
      } catch (err) {
        console.error('Error fetching ancillary services:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchAncillaries();
    }
  }, [user]);

  const filteredAncillaries = ancillaries.filter(ancillary => {
    return searchTerm === '' || 
      ancillary.orderReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ancillary.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ancillary.paxDetails.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <BookingTabs />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading ancillary services...</p>
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
          <h1 className="text-2xl font-semibold">Ancillary Services</h1>
          <div className="flex gap-2">
            <Input
              placeholder="Search by reference, service or passenger"
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
                <TableHead>Service Type</TableHead>
                <TableHead>Passenger Details</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Booking Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAncillaries.map((ancillary) => (
                <TableRow key={ancillary.orderReference}>
                  <TableCell className="font-medium">{ancillary.orderReference}</TableCell>
                  <TableCell>{ancillary.serviceType}</TableCell>
                  <TableCell>{ancillary.paxDetails}</TableCell>
                  <TableCell>{ancillary.amount}</TableCell>
                  <TableCell>
                    {format(new Date(ancillary.bookingDate), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`${statusColors[ancillary.status]?.bg} ${statusColors[ancillary.status]?.color}`}
                    >
                      {ancillary.status}
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