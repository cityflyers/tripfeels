"use client";
import React, { useState, useEffect } from "react";
import { getFirestore, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertCircle, Plane, DollarSign, Briefcase, Mail, Package, Receipt, RefreshCw, ChevronDown, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { reshopPrice, confirmOrderChange } from "@/lib/api";
import { getMarkupByAirline, getMarkupByAirlineAndRoute } from '@/lib/markup';

const db = getFirestore(app);

// DiscountSummary component
function DiscountSummary({ item }: { item: any }) {
  const [markupPercent, setMarkupPercent] = useState<number>(0);
  const [markupAmount, setMarkupAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);

  useEffect(() => {
    async function fetchMarkup() {
      const airlineCode = item?.validatingCarrier || item?.paxSegmentList?.[0]?.paxSegment?.marketingCarrierInfo?.carrierDesigCode;
      const fromAirport = item?.paxSegmentList?.[0]?.paxSegment?.departure?.iatA_LocationCode;
      const toAirport = item?.paxSegmentList?.[item?.paxSegmentList.length - 1]?.paxSegment?.arrival?.iatA_LocationCode;
      const percent = await getMarkupByAirlineAndRoute(airlineCode, 'USER', fromAirport, toAirport);
      setMarkupPercent(percent);
      const totalPayable = item?.price?.totalPayable?.total || 0;
      const markupAmt = Math.round(totalPayable * (percent / 100));
      setMarkupAmount(markupAmt);
      const gross = item?.price?.gross?.total || 0;
      setDiscount(gross - (totalPayable + markupAmt));
    }
    fetchMarkup();
  }, [item]);

  if (discount === 0) return null;
  return (
    <div className="text-right font-semibold mt-4 text-base">
      Discount: {discount.toLocaleString()} {item.price?.gross?.curreny || ''}
    </div>
  );
}

// TotalWithMarkup component
function TotalWithMarkup({ item }: { item: any }) {
  const [markupPercent, setMarkupPercent] = useState<number>(0);
  const [markupAmount, setMarkupAmount] = useState<number>(0);
  const [totalWithMarkup, setTotalWithMarkup] = useState<number>(0);

  useEffect(() => {
    async function fetchMarkup() {
      const airlineCode = item?.validatingCarrier || item?.paxSegmentList?.[0]?.paxSegment?.marketingCarrierInfo?.carrierDesigCode;
      const fromAirport = item?.paxSegmentList?.[0]?.paxSegment?.departure?.iatA_LocationCode;
      const toAirport = item?.paxSegmentList?.[item?.paxSegmentList.length - 1]?.paxSegment?.arrival?.iatA_LocationCode;
      const percent = await getMarkupByAirlineAndRoute(airlineCode, 'USER', fromAirport, toAirport);
      setMarkupPercent(percent);
      const totalPayable = item?.price?.totalPayable?.total || 0;
      const markupAmt = Math.round(totalPayable * (percent / 100));
      setMarkupAmount(markupAmt);
      setTotalWithMarkup(totalPayable + markupAmt);
    }
    fetchMarkup();
  }, [item]);

  return (
    <div className="text-right font-bold mt-2 text-lg">
      Total: {totalWithMarkup.toLocaleString()} {item.price?.totalPayable?.curreny || ''}
    </div>
  );
}

export default function OrderRetrievePage() {
  const searchParams = useSearchParams();
  const orderReferenceFromQuery = searchParams.get("orderReference") || "";
  const [orderReference, setOrderReference] = useState(orderReferenceFromQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const { toast } = useToast();
  const [toastShown, setToastShown] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [showPartialPayInfo, setShowPartialPayInfo] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [showSettleDue, setShowSettleDue] = useState(false);
  const [orderWithMarkup, setOrderWithMarkup] = useState<any>(null);

  // Always sync state with query param
  useEffect(() => {
    setOrderReference(orderReferenceFromQuery);
  }, [orderReferenceFromQuery]);

  // Auto-fetch when query param is present
  useEffect(() => {
    if (orderReferenceFromQuery) {
      handleRetrieve(orderReferenceFromQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderReferenceFromQuery]);

  useEffect(() => {
    if (orderData && !toastShown) {
      toast({
        title: "Success!",
        description: "Booking retrieved successfully!",
        style: { backgroundColor: '#22c55e', color: '#fff' },
        duration: 5000,
      });
      setToastShown(true);
    }
  }, [orderData, toastShown, toast]);

  // Recalculate order with markup when orderData changes
  useEffect(() => {
    async function applyMarkup() {
      if (!orderData || !orderData.orderItem) {
        setOrderWithMarkup(orderData);
        return;
      }
      const updatedOrderItems = await Promise.all(orderData.orderItem.map(async (item: any) => {
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
      setOrderWithMarkup({ ...orderData, orderItem: updatedOrderItems });
    }
    applyMarkup();
    // eslint-disable-next-line
  }, [orderData]);

  // Update handleRetrieve to accept a parameter
  const handleRetrieve = async (ref?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/OrderRetrieve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderReference: ref || orderReference }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to retrieve order");
      
      const newOrderData = data.response;
      setOrderData(newOrderData);

      // Update Firestore status if it has changed
      if (newOrderData?.orderReference && newOrderData?.orderStatus) {
        try {
          const ordersRef = collection(db, "Orders");
          const q = query(ordersRef, where("reference", "==", newOrderData.orderReference));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const orderDoc = querySnapshot.docs[0]; // Assuming reference is unique
            if (orderDoc.data().status !== newOrderData.orderStatus) {
              await updateDoc(orderDoc.ref, { status: newOrderData.orderStatus });
            }
          }
        } catch (firestoreError) {
          console.error("Failed to update order status in Firestore:", firestoreError);
          // This update is a background task, so we can fail silently.
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to retrieve order.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) {
      return;
    }
    setCancelLoading(true);
    setCancelError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/OrderCancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderReference: orderData?.orderReference }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel order.");
      }
      toast({
        title: "Order Cancelled",
        description: "The order has been successfully cancelled.",
        style: { backgroundColor: '#22c55e', color: '#fff' },
      });
      // Refresh order data
      handleRetrieve(orderData.orderReference);
    } catch (err: any) {
      setCancelError(err.message);
      toast({
        title: "Cancellation Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleVerifyPricing = async () => {
    setVerifyLoading(true);
    setVerifyError(null);
    try {
      const reshopData = await reshopPrice(orderReference);
      const oldPrice = orderData?.orderItem?.[0]?.price?.totalPayable?.total;
      const newPrice = reshopData?.response?.orderItem?.[0]?.price?.totalPayable?.total;

      if (oldPrice !== newPrice) {
        const userConfirmed = window.confirm(
          `The price has changed from ${oldPrice} to ${newPrice}. Do you want to proceed?`
        );
        if (userConfirmed) {
          await handleConfirmOrder();
        }
      } else {
        await handleConfirmOrder();
      }
    } catch (err: any) {
      setVerifyError(err.message || "Failed to verify pricing.");
      toast({
        title: "Price Verification Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    setVerifyLoading(true);
    setVerifyError(null);
    try {
      const res: any = await confirmOrderChange(
        orderData.orderReference,
        Boolean(orderData.partialPaymentInfo?.isPartialPaymentEligible)
      );
      if (res.success && res.response) {
        setOrderData(res.response);
        toast({
          title: "Success!",
          description: "Order confirmed successfully!",
          style: { backgroundColor: '#22c55e', color: '#fff' },
        });
      } else {
        const errorMessage = res?.error?.message || res?.errors?.[0]?.message || "Failed to confirm order.";
        setVerifyError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setVerifyError(error.message || "An unexpected error occurred.");
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  const callOrderReshopPrice = async (orderReference: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/OrderReshopPrice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderReference }),
    });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error?.errorMessage || "Reshop price failed");
    return data;
  };

  const handlePartialPay = async () => {
    setPayLoading(true);
    setVerifyError(null);
    try {
      // Optional: You might still want to call reshop price before confirming
      // await callOrderReshopPrice(orderData.orderReference);

      const res: any = await confirmOrderChange(orderData.orderReference, true);
      if (res.success && res.response) {
        setOrderData(res.response);
        setShowPartialPayInfo(false);
        toast({
          title: "Success!",
          description: "Partial payment successful!",
          style: { backgroundColor: '#22c55e', color: '#fff' },
        });
      } else {
        throw new Error(res?.errors?.[0]?.message || "Partial payment failed.");
      }
    } catch (err: any) {
      setVerifyError(err.message || "Partial payment failed.");
      toast({
        title: "Partial Payment Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setPayLoading(false);
    }
  };

  const handleFullAmountPay = async () => {
    setPayLoading(true);
    setVerifyError(null);
    try {
      // Optional: You might still want to call reshop price before confirming
      // await callOrderReshopPrice(orderData.orderReference);

      const res: any = await confirmOrderChange(orderData.orderReference, false);

      if (res.success && res.response) {
        setOrderData(res.response);
        toast({
          title: "Success!",
          description: "Full amount payment successful!",
          style: { backgroundColor: '#22c55e', color: '#fff' },
        });
      } else {
        throw new Error(res?.errors?.[0]?.message || "Full payment failed.");
      }
    } catch (err: any) {
      setVerifyError(err.message || "Full payment failed.");
      toast({
        title: "Full Payment Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
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
          <Button className="mt-4" onClick={() => handleRetrieve()}>Retry</Button>
        </Card>
      )}
      {orderData && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <Accordion type="multiple" defaultValue={["booking-info", "contact-info", "order-items", "passengers", "partial-payment", "order-change", "exchange-details"]} className="w-full space-y-4">
              {/* Booking Info */}
              <AccordionItem value="booking-info" className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <AccordionTrigger className="hover:bg-muted/50 data-[state=open]:bg-muted/50 px-6 py-4 rounded-t-lg w-full transition-all">
                  <div className="flex items-center gap-3">
                    <Receipt className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl font-semibold">Booking Info</CardTitle>
                  </div>
                  <ChevronDown className="w-5 h-5 transition-transform duration-200" />
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2 data-[state=open]:animate-accordion-down">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Order Reference</div>
                      <div className="font-medium">{orderData.orderReference}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Payment Time Limit</div>
                      <div className="font-medium">{orderData.paymentTimeLimit ? format(new Date(orderData.paymentTimeLimit), "PPpp") : "-"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Order Status</div>
                      <div className="font-medium">{orderData.orderStatus || "-"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Trace ID</div>
                      <div className="font-medium">{orderData.traceId || "-"}</div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Contact Info */}
              {orderData.contactDetail && (
                <AccordionItem value="contact-info" className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <AccordionTrigger className="hover:bg-muted/50 data-[state=open]:bg-muted/50 px-6 py-4 rounded-t-lg w-full transition-all">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-primary" />
                      <CardTitle className="text-xl font-semibold">Contact Information</CardTitle>
                    </div>
                    <ChevronDown className="w-5 h-5 transition-transform duration-200" />
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-2 data-[state=open]:animate-accordion-down">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Email</div>
                        <div className="font-medium">{orderData.contactDetail.emailAddress}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Phone</div>
                        <div className="font-medium">{orderData.contactDetail.phoneNumber}</div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Order Items */}
              {orderData.orderItem && (
                <AccordionItem value="order-items" className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <AccordionTrigger className="hover:bg-muted/50 data-[state=open]:bg-muted/50 px-6 py-4 rounded-t-lg w-full transition-all">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-primary" />
                      <CardTitle className="text-xl font-semibold">Order Items</CardTitle>
                    </div>
                    <ChevronDown className="w-5 h-5 transition-transform duration-200" />
                  </AccordionTrigger>
                  <AccordionContent className="px-0 pb-6 pt-2 data-[state=open]:animate-accordion-down">
                    <div className="space-y-6">
                      {orderData.orderItem.map((item: any, idx: number) => (
                        <Card key={idx} className="mx-6 p-6 bg-muted/30 dark:bg-muted/10 rounded-lg shadow-sm space-y-6">
                          <CardHeader className="pb-2 px-0">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">{idx + 1}</span>
                              Order Item #{idx + 1}
                            </CardTitle>
                            <CardDescription className="text-base space-x-4">
                              <span><span className="text-muted-foreground">Carrier:</span> <b>{item.validatingCarrier}</b></span>
                              <span><span className="text-muted-foreground">Refundable:</span> <b>{item.refundable ? "Yes" : "No"}</b></span>
                              <span><span className="text-muted-foreground">Type:</span> <b>{item.fareType}</b></span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-8 px-0">
                            {/* Itinerary */}
                            {item.paxSegmentList && (
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <Plane className="w-5 h-5 text-primary" />
                                  <h3 className="font-semibold text-lg">Itinerary</h3>
                                </div>
                                <div className="space-y-4">
                                  {item.paxSegmentList.map(({ paxSegment }: any, i: number) => (
                                    <div key={i} className="flex flex-col md:flex-row md:items-center gap-4 border-b last:border-b-0 py-4 md:py-3">
                                      <div className="flex flex-col items-start min-w-[120px]">
                                        <span className="font-bold text-lg">{paxSegment.departure.iatA_LocationCode}</span>
                                        <span className="text-sm text-muted-foreground">{paxSegment.departure.terminalName ? `Terminal ${paxSegment.departure.terminalName}` : "Terminal: -"}</span>
                                        <span className="text-sm text-muted-foreground">{format(new Date(paxSegment.departure.aircraftScheduledDateTime), "PPpp")}</span>
                                      </div>
                                      <div className="flex flex-col items-center">
                                        <div className="w-16 h-[2px] bg-border" />
                                        <span className="text-xs text-muted-foreground my-1">
                                          {Math.floor(paxSegment.duration / 60)}h {paxSegment.duration % 60}m
                                        </span>
                                        <div className="w-16 h-[2px] bg-border" />
                                      </div>
                                      <div className="flex flex-col items-start min-w-[120px]">
                                        <span className="font-bold text-lg">{paxSegment.arrival.iatA_LocationCode}</span>
                                        <span className="text-sm text-muted-foreground">{paxSegment.arrival.terminalName ? `Terminal ${paxSegment.arrival.terminalName}` : "Terminal: -"}</span>
                                        <span className="text-sm text-muted-foreground">{format(new Date(paxSegment.arrival.aircraftScheduledDateTime), "PPpp")}</span>
                                      </div>
                                      <div className="flex flex-col md:ml-auto gap-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium">{paxSegment.marketingCarrierInfo.carrierName} {paxSegment.marketingCarrierInfo.carrierDesigCode}-{paxSegment.flightNumber}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">PNR: {paxSegment.airlinePNR || "-"}</div>
                                        <div className="text-sm text-muted-foreground">
                                          {paxSegment.iatA_AircraftType?.iatA_AircraftTypeCode && `Aircraft: ${paxSegment.iatA_AircraftType.iatA_AircraftTypeCode}`}
                                          {paxSegment.cabinType && ` • ${paxSegment.cabinType}`}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Fare Summary */}
                            {item.fareDetailList && (
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <DollarSign className="w-5 h-5 text-primary" />
                                  <h3 className="font-semibold text-lg">Fare Summary</h3>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="min-w-[600px] w-full text-sm border rounded-lg overflow-hidden bg-background dark:bg-black/60">
                                    <thead>
                                      <tr className="border-b bg-muted/50 dark:bg-muted/20">
                                        <th className="text-left py-3 px-4 font-medium">Pax Type</th>
                                        <th className="text-center py-3 px-4 font-medium">Count</th>
                                        <th className="text-right py-3 px-4 font-medium">Base Fare</th>
                                        <th className="text-right py-3 px-4 font-medium">Tax</th>
                                        <th className="text-right py-3 px-4 font-medium">Other</th>
                                        <th className="text-right py-3 px-4 font-medium">VAT</th>
                                        <th className="text-right py-3 px-4 font-medium">Subtotal</th>
                                        <th className="text-center py-3 px-4 font-medium">Currency</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {item.fareDetailList.map(({ fareDetail }: any, i: number) => (
                                        <tr key={i} className="border-b last:border-b-0 hover:bg-muted/30">
                                          <td className="py-3 px-4 font-medium">{fareDetail.paxType}</td>
                                          <td className="py-3 px-4 text-center">{fareDetail.paxCount}</td>
                                          <td className="py-3 px-4 text-right">{fareDetail.baseFare}</td>
                                          <td className="py-3 px-4 text-right">{fareDetail.tax}</td>
                                          <td className="py-3 px-4 text-right">{fareDetail.otherFee}</td>
                                          <td className="py-3 px-4 text-right">{fareDetail.vat}</td>
                                          <td className="py-3 px-4 text-right font-medium">{fareDetail.subTotal}</td>
                                          <td className="py-3 px-4 text-center">{fareDetail.currency}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                {/* Discount summary row above Total */}
                                <DiscountSummary item={item} />
                                <TotalWithMarkup item={item} />
                              </div>
                            )}

                            {/* Baggage Allowance */}
                            {item.baggageAllowanceList && (
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <Briefcase className="w-5 h-5 text-primary" />
                                  <h3 className="font-semibold text-lg">Baggage Allowance</h3>
                                </div>
                                <div className="grid gap-4">
                                  {item.baggageAllowanceList.map(({ baggageAllowance }: any, i: number) => (
                                    <div key={i} className="rounded-lg border bg-background dark:bg-black/60 p-4">
                                      <div className="font-medium mb-2">{baggageAllowance.departure} → {baggageAllowance.arrival}</div>
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium min-w-[80px]">Check-in:</span>
                                          <span className="text-sm">{(baggageAllowance.checkIn ?? []).map((b: any) => `${b.paxType}: ${b.allowance}`).join(", ")}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium min-w-[80px]">Cabin:</span>
                                          <span className="text-sm">{(baggageAllowance.cabin ?? []).map((b: any) => `${b.paxType}: ${b.allowance}`).join(", ")}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Penalties */}
                            {item.penalty && (
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <AlertCircle className="w-5 h-5 text-primary" />
                                  <h3 className="font-semibold text-lg">Penalties</h3>
                                </div>
                                <div className="grid gap-6">
                                  {/* Refund Penalties */}
                                  <div>
                                    <div className="font-medium mb-3">Refund Penalties</div>
                                    <div className="space-y-4">
                                      {(item.penalty.refundPenaltyList ?? []).map(({ refundPenalty }: any, i: number) => (
                                        <div key={i} className="rounded-lg border bg-background dark:bg-black/60 p-4">
                                          <div className="font-medium mb-2">{refundPenalty.departure} → {refundPenalty.arrival}</div>
                                          <div className="space-y-3">
                                            {(refundPenalty.penaltyInfoList ?? []).map(({ penaltyInfo }: any, j: number) => (
                                              <div key={j}>
                                                <div className="text-sm font-medium mb-1">{penaltyInfo.type}</div>
                                                <ul className="list-disc pl-5 space-y-1">
                                                  {(penaltyInfo.textInfoList ?? []).map(({ textInfo }: any, k: number) => (
                                                    <li key={k} className="text-sm">
                                                      <span className="font-medium">{textInfo.paxType}:</span> {textInfo.info.join(", ")}
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Exchange Penalties */}
                                  <div>
                                    <div className="font-medium mb-3">Exchange Penalties</div>
                                    <div className="space-y-4">
                                      {(item.penalty.exchangePenaltyList ?? []).map(({ exchangePenalty }: any, i: number) => (
                                        <div key={i} className="rounded-lg border bg-background dark:bg-black/60 p-4">
                                          <div className="font-medium mb-2">{exchangePenalty.departure} → {exchangePenalty.arrival}</div>
                                          <div className="space-y-3">
                                            {(exchangePenalty.penaltyInfoList ?? []).map(({ penaltyInfo }: any, j: number) => (
                                              <div key={j}>
                                                <div className="text-sm font-medium mb-1">{penaltyInfo.type}</div>
                                                <ul className="list-disc pl-5 space-y-1">
                                                  {(penaltyInfo.textInfoList ?? []).map(({ textInfo }: any, k: number) => (
                                                    <li key={k} className="text-sm">
                                                      <span className="font-medium">{textInfo.paxType}:</span> {textInfo.info.join(", ")}
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              {/* Passengers */}
              {orderData.paxList && (
                <AccordionItem value="passengers">
                  <AccordionTrigger className="hover:bg-muted/40 focus:bg-muted/40 px-4">
                    <CardTitle className="text-xl font-bold">Passengers</CardTitle>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-6">
                    <div className="space-y-6">
                      {orderData.paxList.map((pax: any, idx: number) => (
                        <Card key={idx} className="bg-muted/50 dark:bg-muted/20 rounded-lg shadow">
                          <CardHeader>
                            <CardTitle className="text-base font-bold">{pax.ptc}</CardTitle>
                            <CardDescription className="text-base">{pax.individual?.title} {pax.individual?.givenName} {pax.individual?.surname}</CardDescription>
                          </CardHeader>
                          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                            <div><span className="font-semibold">Gender:</span> {pax.individual?.gender}</div>
                            <div><span className="font-semibold">Birthdate:</span> {pax.individual?.birthdate ? format(new Date(pax.individual.birthdate), "PP") : "-"}</div>
                            <div><span className="font-semibold">Nationality:</span> {pax.individual?.nationality}</div>
                            <div><span className="font-semibold">Passport:</span> {pax.individual?.identityDoc?.identityDocID} (exp: {pax.individual?.identityDoc?.expiryDate ? format(new Date(pax.individual.identityDoc.expiryDate), "PP") : "-"})</div>
                            <div><span className="font-semibold">Issuing Country:</span> {pax.individual?.identityDoc?.issuingCountryCode}</div>
                            <div><span className="font-semibold">Ticket Document:</span> {pax.individual?.ticketDocument?.[0]?.ticketDocNbr || "-"}</div>
                            {pax.individual?.associatePax && (
                              <div className="col-span-2"><span className="font-semibold">Associated Adult:</span> {pax.individual.associatePax.givenName} {pax.individual.associatePax.surname}</div>
                            )}
                            {pax.orderSSR && Array.isArray(pax.orderSSR) && pax.orderSSR.length > 0 && (
                              <div className="col-span-2"><span className="font-semibold">SSR:</span> {pax.orderSSR.map((ssr: any) => ssr.ssrCode).join(", ")}</div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              {/* Partial Payment Info */}
              {orderData.partialPaymentInfo && (
                <AccordionItem value="partial-payment">
                  <AccordionTrigger className="hover:bg-muted/40 focus:bg-muted/40 px-4">
                    <CardTitle className="text-xl font-bold">Partial Payment Info</CardTitle>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                      <div><span className="font-semibold">Total Payable:</span> {orderData.partialPaymentInfo.totalPayableAmount} {orderData.partialPaymentInfo.currency}</div>
                      <div><span className="font-semibold">Minimum Payable:</span> {orderData.partialPaymentInfo.minimumPayableAmount} {orderData.partialPaymentInfo.currency}</div>
                      <div><span className="font-semibold">Due Amount:</span> {orderData.partialPaymentInfo.dueAmount} {orderData.partialPaymentInfo.currency}</div>
                      <div><span className="font-semibold">Due Date:</span> {orderData.partialPaymentInfo.dueDate ? format(new Date(orderData.partialPaymentInfo.dueDate), "PPpp") : "-"}</div>
                    </div>
                    <div className="mt-4">
                      <span className="font-semibold">Fare Details:</span>
                      <ul className="list-disc ml-6">
                        {(orderData.partialPaymentInfo.fareDetailList ?? []).map(({ fareDetail }: any, i: number) => (
                          <li key={i}>{fareDetail.paxType}: {fareDetail.subTotal} {fareDetail.currency}</li>
                        ))}
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              {/* Order Change Info */}
              {orderData.orderChangeInfo && (
                <AccordionItem value="order-change">
                  <AccordionTrigger className="hover:bg-muted/40 focus:bg-muted/40 px-4">
                    <CardTitle className="text-xl font-bold">Order Change Info</CardTitle>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-6">
                    <pre className="bg-gray-100 dark:bg-gray-900 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(orderData.orderChangeInfo, null, 2)}</pre>
                  </AccordionContent>
                </AccordionItem>
              )}
              {/* Exchange Details */}
              {orderData.exchangeDetails && (
                <AccordionItem value="exchange-details">
                  <AccordionTrigger className="hover:bg-muted/40 focus:bg-muted/40 px-4">
                    <CardTitle className="text-xl font-bold">Exchange Details</CardTitle>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-6">
                    <pre className="bg-gray-100 dark:bg-gray-900 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(orderData.exchangeDetails, null, 2)}</pre>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {cancelError && <p className="text-sm text-destructive">{cancelError}</p>}
              {orderData.orderStatus === 'OnHold' && (
                <>
                  <Button variant="destructive" onClick={handleCancel} disabled={cancelLoading} className="w-full">
                    {cancelLoading ? "Cancelling..." : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Booking
                      </>
                    )}
                  </Button>
                </>
              )}
              {verifyError && <p className="text-sm text-destructive">{verifyError}</p>}
              {/* Partial Payment Buttons */}
              {orderData.orderStatus === 'OnHold' && orderData.partialPaymentInfo ? (
                orderData.partialPaymentInfo.dueAmount > 0 && orderData.partialPaymentInfo.paidAmount !== null ? (
                  <>
                    <Button onClick={() => setShowSettleDue(true)} className="w-full mt-2" disabled={payLoading}>
                      Settle Due
                    </Button>
                    {showSettleDue && (
                      <Card className="p-4 mt-4 bg-yellow-50 border-yellow-400">
                        <div className="font-bold mb-2">Settle Due Payment</div>
                        <div>
                          <span>Due Amount: </span>
                          <span className="font-semibold">{orderData.partialPaymentInfo.dueAmount} {orderData.partialPaymentInfo.currency}</span>
                        </div>
                        <div>
                          <span>Due Date: </span>
                          <span className="font-semibold">{orderData.partialPaymentInfo.dueDate ? format(new Date(orderData.partialPaymentInfo.dueDate), "PPpp") : "-"}</span>
                        </div>
                        <div className="text-warning mt-2 flex items-center gap-2">
                          <span role="img" aria-label="warning">⚠️</span>
                          <span>Unpaid bookings will be cancelled automatically. No claims will be accepted.</span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button onClick={handleFullAmountPay} disabled={payLoading}>
                            {payLoading ? "Processing..." : "Proceed to Settle Due"}
                          </Button>
                          <Button variant="outline" onClick={() => setShowSettleDue(false)} disabled={payLoading}>
                            Close
                          </Button>
                        </div>
                      </Card>
                    )}
                  </>
                ) : (
                  <>
                    <Button onClick={() => setShowPartialPayInfo(true)} className="w-full mt-2" disabled={payLoading}>
                      Partial Pay
                    </Button>
                    <Button onClick={handleFullAmountPay} disabled={verifyLoading || payLoading} className="w-full mt-2">
                      {payLoading ? "Processing..." : verifyLoading ? "Confirming..." : "Full Amount Pay"}
                    </Button>
                  </>
                )
              ) : orderData.orderStatus === 'OnHold' && (
                <Button onClick={handleVerifyPricing} disabled={verifyLoading} className="w-full mt-2">
                  {verifyLoading ? "Confirming..." : "Order Confirm"}
                </Button>
              )}
              {/* Partial Pay Info Card */}
              {showPartialPayInfo && orderData.partialPaymentInfo && (
                <Card className="p-4 mt-4 bg-yellow-50 border-yellow-400">
                  <div className="font-bold mb-2">Partial Payment Details</div>
                  <div>
                    <span>Minimum Payable: </span>
                    <span className="font-semibold">{orderData.partialPaymentInfo.minimumPayableAmount} {orderData.partialPaymentInfo.currency}</span>
                  </div>
                  <div>
                    <span>Due Date: </span>
                    <span className="font-semibold">{orderData.partialPaymentInfo.dueDate ? format(new Date(orderData.partialPaymentInfo.dueDate), "PPpp") : "-"}</span>
                  </div>
                  <div>
                    <span>Due Amount: </span>
                    <span className="font-semibold">{orderData.partialPaymentInfo.dueAmount} {orderData.partialPaymentInfo.currency}</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handlePartialPay} disabled={payLoading}>
                      {payLoading ? "Processing..." : "Proceed Partial Pay"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowPartialPayInfo(false)} disabled={payLoading}>
                      Close
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 