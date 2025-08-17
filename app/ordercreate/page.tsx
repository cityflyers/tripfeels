"use client";
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertCircle, Plane, DollarSign, User, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { getMarkupByAirline, getMarkupByAirlineAndRoute } from '@/lib/markup';

// Placeholder for order create data (replace with real API call and data)
const orderCreateData: any = null; // TODO: Replace with real order create response
const loading = false;
const error = null;

export default function OrderCreatePage() {
  const router = useRouter();
  // Add state to hold markup-adjusted order data
  const [orderWithMarkup, setOrderWithMarkup] = useState<any>(null);

  // Recalculate order with markup when orderCreateData changes
  useEffect(() => {
    async function applyMarkup() {
      if (!orderCreateData || !orderCreateData.orderItem) {
        setOrderWithMarkup(orderCreateData);
        return;
      }
      const updatedOrderItems = await Promise.all(orderCreateData.orderItem.map(async (item: any) => {
        const airlineCode = item?.validatingCarrier || item?.paxSegmentList?.[0]?.paxSegment?.marketingCarrierInfo?.carrierDesigCode;
        const fromAirport = item?.paxSegmentList?.[0]?.paxSegment?.departure?.iatA_LocationCode;
        const toAirport = item?.paxSegmentList?.[item?.paxSegmentList.length - 1]?.paxSegment?.arrival?.iatA_LocationCode;
        let role = 'USER';
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user && user.role === 'AGENT') role = 'AGENT';
          } catch {}
        }
        const markup = airlineCode
          ? await getMarkupByAirlineAndRoute(airlineCode, role, fromAirport, toAirport)
          : 0;
        const fareDetailList = (item.fareDetailList || []).map(({ fareDetail }: any) => {
          if (fareDetail._markupApplied) return { fareDetail };
          const originalBaseFare = fareDetail.baseFare;
          const tax = fareDetail.tax;
          const vat = fareDetail.vat;
          const commission = Math.round((Math.abs(markup) / 100) * originalBaseFare);
          const newBaseFare = originalBaseFare + commission * Math.sign(markup);
          const newSubtotal = newBaseFare + tax + vat;
          return {
            fareDetail: {
              ...fareDetail,
              baseFare: newBaseFare,
              discount: commission,
              subTotal: newSubtotal,
              _markupApplied: true,
            },
          };
        });
        const totalPayable = fareDetailList.reduce((sum: number, { fareDetail }: any) => sum + (fareDetail.subTotal || 0), 0);
        return {
          ...item,
          fareDetailList,
          price: {
            ...item.price,
            totalPayable: {
              ...item.price?.totalPayable,
              total: totalPayable,
            },
          },
        };
      }));
      setOrderWithMarkup({ ...orderCreateData, orderItem: updatedOrderItems });
    }
    applyMarkup();
    // eslint-disable-next-line
  }, [orderCreateData]);

  useEffect(() => {
    if (orderCreateData && orderCreateData.orderReference) {
      router.push(`/orderretrieve?orderReference=${encodeURIComponent(orderCreateData.orderReference)}`);
    }
  }, [orderCreateData, router]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-4 text-primary dark:text-primary-400">Booking Confirmation</h1>
      {loading && (
        <Card className="p-8 flex flex-col items-center justify-center bg-background dark:bg-black/80">
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/4" />
        </Card>
      )}
      {error && (
        <Card className="p-8 text-red-500 bg-background dark:bg-black/80">
          <AlertCircle className="w-6 h-6 mb-2 text-destructive" />
          <div className="font-semibold">{error}</div>
          <Button className="mt-4">Retry</Button>
        </Card>
      )}
      {orderWithMarkup && (
        <Card className="p-8 bg-background dark:bg-black/80 shadow-sm">
          <div className="text-green-600 font-bold text-lg mb-2 flex items-center gap-2">
            <CheckCircle className="w-6 h-6" /> Booking Complete!
          </div>
          <div className="mb-2">Order Reference: <b>{orderWithMarkup.orderReference}</b></div>
          <div className="mb-2">Payment Time Limit: <b>{orderWithMarkup.paymentTimeLimit}</b></div>
          {/* TODO: Render itinerary, fare, passengers, etc. */}
          <Skeleton className="h-6 w-full mt-4" />
        </Card>
      )}
      {!loading && !error && !orderWithMarkup && (
        <Card className="p-8 bg-background dark:bg-black/80 shadow-sm">
          <div className="text-muted-foreground">No order data to display.</div>
        </Card>
      )}
    </div>
  );
} 