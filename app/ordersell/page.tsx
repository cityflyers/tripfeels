"use client";
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plane, DollarSign, Briefcase, AlertCircle, User, Mail, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { getMarkupByAirline, getMarkupByAirlineAndRoute } from '@/lib/markup';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { format as formatDate } from "date-fns";
import { airports } from "@/components/dashboard/flight/airport/airportUtils";
import { calculateTotalWithMarkup } from '@/lib/calculateTotalWithMarkup';
import { useSearchParams } from "next/navigation";

// Accept props: mainOffer, contact, passengers, etc.
// Fallback to placeholder if not provided
export default function OrderSellPage({ mainOffer, offers, contact, passengers, onBack, onConfirm, loading, error }: any) {
  // Defensive: fallback to empty if not provided
  const allOffers = Array.isArray(offers) && offers.length > 0 ? offers : (mainOffer ? [mainOffer] : []);
  
  // Add state for contact and passengers data
  const [contactData, setContactData] = useState(contact || {});
  const [passengersData, setPassengersData] = useState(passengers || []);

  // Add state for form submission
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderSellResponse, setOrderSellResponse] = useState<any>(null);

  // Add state to hold markup-adjusted offers
  const [offersWithMarkup, setOffersWithMarkup] = useState<any[]>([]);

  // Add this state to store the original API offers
  const [originalOffers, setOriginalOffers] = useState<any[]>([]);

  // Add state to store markup percentages for each offer
  const [markupPercents, setMarkupPercents] = useState<{ [offerId: string]: number }>({});

  // Add state to store the latest offers fetched from API
  const [apiOffers, setApiOffers] = useState<any[]>([]);

  const searchParams = useSearchParams();
  const traceId = searchParams.get("traceId");
  const offerId = searchParams.getAll("offerId");

  // Load contact and passengers data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedContact = localStorage.getItem("offerprice_contact");
        const savedPassengers = localStorage.getItem("offerprice_passengers");
        if (savedContact) {
          setContactData(JSON.parse(savedContact));
        }
        if (savedPassengers) {
          const parsed = JSON.parse(savedPassengers);
          if (Array.isArray(parsed)) {
            setPassengersData(parsed);
          }
        }
      } catch (error) {
        console.error("Error loading data from localStorage:", error);
      }
    }
  }, []);

  // Fetch offers from API on mount
  useEffect(() => {
    async function fetchOffers() {
      if (!traceId || !offerId.length) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/OfferPrice`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ traceId, offerId }),
        });
        if (!res.ok) {
          console.error('Failed to fetch offers:', res.status, res.statusText);
          setApiOffers([]);
          return;
        }
        const data = await res.json();
        const offers = (data?.response?.offersGroup || []).map((g: any) => g.offer);
        setApiOffers(offers);
      } catch (err) {
        console.error('Error fetching offers:', err);
        setApiOffers([]);
      }
    }
    fetchOffers();
  }, [traceId, offerId]);

  // Fetch markup percent for each offer when apiOffers change
  useEffect(() => {
    async function fetchMarkups() {
      const percents: { [offerId: string]: number } = {};
      for (const offer of apiOffers) {
        const airlineCode = offer?.validatingCarrier || offer?.paxSegmentList?.[0]?.paxSegment?.marketingCarrierInfo?.carrierDesigCode;
        const fromAirport = offer?.paxSegmentList?.[0]?.paxSegment?.departure?.iatA_LocationCode;
        const toAirport = offer?.paxSegmentList?.[offer?.paxSegmentList.length - 1]?.paxSegment?.arrival?.iatA_LocationCode;
        let role = 'USER';
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user && user.role === 'AGENT') role = 'AGENT';
          } catch {}
        }
        percents[offer.offerId] = airlineCode ? await getMarkupByAirlineAndRoute(airlineCode, role, fromAirport, toAirport) : 0;
      }
      setMarkupPercents(percents);
    }
    if (apiOffers.length > 0) {
      fetchMarkups();
    }
  }, [apiOffers]);

  // Use offersWithMarkup for rendering instead of allOffers
  const offersToRender = offersWithMarkup.length ? offersWithMarkup : allOffers;

  // Helper to build the request object
  function buildOrderSellRequest(traceId: string, offerId: string | string[], contact: any, passengers: any[]) {
    // Find all adults and infants for proper mapping
    const adultIndexes = passengers.map((p, i) => ({...p, idx: i})).filter(p => p.ptc === "Adult").map(p => p.idx);
    const infantIndexes = passengers.map((p, i) => ({...p, idx: i})).filter(p => p.ptc === "Infant").map(p => p.idx);
    
    // Map each infant to a unique adult
    const infantToAdultMap: Record<number, number> = {};
    infantIndexes.forEach((infantIdx, i) => {
      infantToAdultMap[infantIdx] = adultIndexes[i];
    });

    return {
      traceId,
      offerId: Array.isArray(offerId) ? offerId : [offerId],
      request: {
        contactInfo: {
          phone: {
            phoneNumber: contact.phone,
            countryDialingCode: contact.countryDialingCode,
          },
          emailAddress: contact.email,
        },
        paxList: passengers.map((p: any, idx: number) => {
          const individual: any = {
            givenName: p.givenName,
            surname: p.surname,
            gender: p.gender,
            birthdate: p.birthdate,
            nationality: p.nationality,
            identityDoc: {
              identityDocType: p.identityDocType,
              identityDocID: p.identityDocID,
              expiryDate: p.expiryDate,
            },
          };
          
          // Add associatePax for infants
          if (p.ptc === "Infant" && infantToAdultMap[idx] !== undefined) {
            individual.associatePax = {
              givenName: passengers[infantToAdultMap[idx]].givenName,
              surname: passengers[infantToAdultMap[idx]].surname,
            };
          }

          // Add sellSSR if any SSR fields are filled
          let sellSSR;
          if ((p.ssrCode && p.ssrCode.trim()) || (p.ssrRemark && p.ssrRemark.trim()) || (p.loyaltyAirline && p.loyaltyAirline.trim()) || (p.loyaltyAccount && p.loyaltyAccount.trim())) {
            sellSSR = [
              {
                ...(p.ssrCode ? { ssrCode: p.ssrCode } : {}),
                ...(p.ssrRemark ? { ssrRemark: p.ssrRemark } : {}),
                ...((p.loyaltyAirline || p.loyaltyAccount)
                  ? {
                      loyaltyProgramAccount: {
                        ...(p.loyaltyAirline ? { airlineDesigCode: p.loyaltyAirline } : {}),
                        ...(p.loyaltyAccount ? { accountNumber: p.loyaltyAccount } : {}),
                      },
                    }
                  : {}),
              },
            ];
          }

          return {
            ptc: p.ptc,
            individual,
            ...(sellSSR ? { sellSSR } : {}),
          };
        }),
      },
    };
  }

  // Handler for OrderSell submission
  async function handleOrderSell(traceId: string, offerId: string | string[], contact: any, passengers: any[]) {
    setSubmitLoading(true);
    setSubmitError(null);
    setOrderSellResponse(null);
    try {
      const payload = buildOrderSellRequest(traceId, offerId, contact, passengers);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/OrderSell`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data?.error || data?.message || "Failed to sell order");
        return;
      }
      setOrderSellResponse(data);
      
      // Check for offer changes as per API documentation
      const offerChangeInfo = data?.response?.offerChangeInfo;
      if (offerChangeInfo) {
        const changeType = offerChangeInfo.typeOfChange;
        let changeMessage = "";
        switch (changeType) {
          case "Both":
            changeMessage = "Both price and booking class have changed. Do you want to continue?";
            break;
          case "Price":
            changeMessage = "The price has changed. Do you want to continue?";
            break;
          case "BookingClass":
            changeMessage = "The booking class has changed. Do you want to continue?";
            break;
          default:
            changeMessage = "There have been changes to your selected flight. Do you want to continue?";
        }
        
        if (!window.confirm(changeMessage)) {
          setSubmitError("Booking cancelled due to changes in flight details.");
          return;
        }
      }
      
      // If no changes or user confirmed changes, proceed to OrderCreate
      if (onConfirm) {
        onConfirm();
      }
    } catch (err: any) {
      setSubmitError(err.message || "Failed to process booking. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  }

  // After fetching and parsing the API response:
  const offer = apiOffers[0];
  const fareDetail = offer?.fareDetailList?.[0]?.fareDetail;

  if (!offer || !fareDetail) {
    return <div>Loading fare summary...</div>;
  }

  const gross = offer?.price?.gross?.total || 0;
  const payable = offer?.price?.totalPayable?.total || 0;
  const markupPercent = markupPercents?.[offer?.offerId] || 0; // fetched as in offerprice
  const markup = Math.round(payable * (markupPercent / 100));
  const total = payable + markup;
  const discount = gross - total;
  const currency = fareDetail?.currency || offer?.price?.gross?.curreny || '';

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <Accordion type="multiple" defaultValue={["itinerary", "passenger", "contact", "fare", "baggage", "penalties"]} className="mb-8">
        {/* Itinerary */}
        <AccordionItem value="itinerary">
          <AccordionTrigger
            className="bg-primary/10 text-primary font-semibold px-4 py-3 rounded-md hover:bg-primary/20 transition-colors no-underline border-none hover:no-underline focus:no-underline text-heading-16"
            style={{ textDecoration: "none" }}
          >Itinerary</AccordionTrigger>
          <AccordionContent className="text-heading-14">
            {offersToRender.map((offer, idx) => (
              <div key={offer.offerId} className="space-y-8">
                <Card className="p-6 bg-background dark:bg-black/80 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-heading-16">
                    <Plane className="w-5 h-5 text-primary" />
                    <span className="text-lg font-semibold">{offer.offerId?.endsWith('_OB') ? 'Outbound' : offer.offerId?.endsWith('_IB') ? 'Inbound' : 'Flight'}</span>
                  </div>
                  <div className="space-y-6">
                    {(offer?.paxSegmentList ?? []).map(({ paxSegment }: any, i: number) => (
                      <div key={i} className="flex flex-col md:flex-row md:items-center gap-4 border-b last:border-b-0 pb-4 last:pb-0 text-heading-14">
                        <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                          <div className="flex flex-col items-start">
                            <span className="text-xl font-bold">{paxSegment.departure.iatA_LocationCode}</span>
                            {(() => {
                              const info = airports.find(a => a.code === paxSegment.departure.iatA_LocationCode);
                              return info ? (
                                <span className="text-xs text-muted-foreground">{info.city}</span>
                              ) : null;
                            })()}
                            <span>
                              <span className="text-xs text-muted-foreground">{formatDate(new Date(paxSegment.departure.aircraftScheduledDateTime), "yyyy-MM-dd")}</span>
                              <span className="text-base md:text-lg font-bold text-orange-400 ml-1">{formatDate(new Date(paxSegment.departure.aircraftScheduledDateTime), "HH:mm")}</span>
                            </span>
                            {(() => {
                              const info = airports.find(a => a.code === paxSegment.departure.iatA_LocationCode);
                              return info ? (
                                <span className="text-xs text-muted-foreground">{info.airportName}</span>
                              ) : null;
                            })()}
                          </div>
                          <div className="flex flex-col items-center mx-2">
                            <ChevronRight className="w-5 h-5 text-primary" />
                            <span className="text-xs text-muted-foreground">Flight</span>
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="text-xl font-bold">{paxSegment.arrival.iatA_LocationCode}</span>
                            {(() => {
                              const info = airports.find(a => a.code === paxSegment.arrival.iatA_LocationCode);
                              return info ? (
                                <span className="text-xs text-muted-foreground">{info.city}</span>
                              ) : null;
                            })()}
                            <span>
                              <span className="text-xs text-muted-foreground">{formatDate(new Date(paxSegment.arrival.aircraftScheduledDateTime), "yyyy-MM-dd")}</span>
                              <span className="text-base md:text-lg font-bold text-orange-400 ml-1">{formatDate(new Date(paxSegment.arrival.aircraftScheduledDateTime), "HH:mm")}</span>
                            </span>
                            {(() => {
                              const info = airports.find(a => a.code === paxSegment.arrival.iatA_LocationCode);
                              return info ? (
                                <span className="text-xs text-muted-foreground">{info.airportName}</span>
                              ) : null;
                            })()}
                          </div>
                        </div>
                        <div className="flex flex-col md:items-end text-xs text-muted-foreground min-w-[180px]">
                          <span>{paxSegment.marketingCarrierInfo.carrierName} {paxSegment.marketingCarrierInfo.carrierDesigCode}-{paxSegment.flightNumber}</span>
                          <span>Aircraft: {paxSegment.iatA_AircraftType.iatA_AircraftTypeCode} | Cabin: {paxSegment.cabinType}</span>
                          <span>Duration: {paxSegment.duration} min</span>
                          {paxSegment.technicalStopOver?.length > 0 && (
                            <span className="text-orange-500">Stop: {paxSegment.technicalStopOver.map((stop: any) => stop.iatA_LocationCode).join(", ")}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
        {/* Passenger Info */}
        <AccordionItem value="passenger">
          <AccordionTrigger
            className="bg-primary/10 text-primary font-semibold px-4 py-3 rounded-md hover:bg-primary/20 transition-colors no-underline border-none hover:no-underline focus:no-underline text-heading-16"
            style={{ textDecoration: "none" }}
          >Passenger Information</AccordionTrigger>
          <AccordionContent className="text-heading-14">
            <Card className="p-6 bg-background dark:bg-black/80 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-heading-16">
                <User className="w-5 h-5 text-primary" />
                {passengersData.length > 0 && (
                  <span className="font-semibold">{(() => {
                    const p = passengersData[0];
                    const type = p.ptc || 'Passenger';
                    const typeCount = passengersData.filter((x: any) => x.ptc === p.ptc).indexOf(p) + 1;
                    return `${type} ${typeCount}`;
                  })()}</span>
                )}
              </div>
              {passengersData.length > 0 && (
                <div className="space-y-4">
                  {passengersData.map((p: any, idx: number) => {
                    const type = p.ptc || 'Passenger';
                    const typeCount = passengersData.filter((x: any) => x.ptc === p.ptc).indexOf(p) + 1;
                    return (
                      <div key={idx} className="border-b pb-2 last:border-b-0 mb-2 text-heading-14">
                        {/* Remove the type/count label here, since it's now next to the icon */}
                        <div>Name: {p.givenName} {p.surname}</div>
                        <div>Gender: {p.gender}</div>
                        <div>Birthdate: {p.birthdate}</div>
                        <div>Nationality: {p.nationality}</div>
                        <div>Passport: {p.identityDocID} (exp: {p.expiryDate})</div>
                        {(p.ssrCode || p.ssrRemark) && (
                          <div>SSR: {p.ssrCode} {p.ssrRemark && `(${p.ssrRemark})`}</div>
                        )}
                        {(p.loyaltyAirline || p.loyaltyAccount) && (
                          <div>Loyalty: {p.loyaltyAirline} {p.loyaltyAccount}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </AccordionContent>
        </AccordionItem>
        {/* Contact Info */}
        <AccordionItem value="contact">
          <AccordionTrigger
            className="bg-primary/10 text-primary font-semibold px-4 py-3 rounded-md hover:bg-primary/20 transition-colors no-underline border-none hover:no-underline focus:no-underline text-heading-16"
            style={{ textDecoration: "none" }}
          >Contact Information</AccordionTrigger>
          <AccordionContent className="text-heading-14">
            <Card className="p-6 bg-background dark:bg-black/80 shadow-sm">
              {contactData.email ? (
                <div>
                  <div>Email: {contactData.email}</div>
                  <div>Phone: {contactData.countryDialingCode}-{contactData.phone}</div>
                </div>
              ) : <Skeleton className="h-6 w-full" />}
            </Card>
          </AccordionContent>
        </AccordionItem>
        {/* Fare Summary */}
        <AccordionItem value="fare">
          <AccordionTrigger
            className="bg-primary/10 text-primary font-semibold px-4 py-3 rounded-md hover:bg-primary/20 transition-colors no-underline border-none hover:no-underline focus:no-underline text-heading-16"
            style={{ textDecoration: "none" }}
          >Fare Summary</AccordionTrigger>
          <AccordionContent className="text-heading-14">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-md overflow-hidden">
                <thead>
                  <tr className="border-b bg-muted dark:bg-muted/20">
                    <th className="text-left py-2 px-4">Pax Type</th>
                    <th>Count</th>
                    <th>Base Fare</th>
                    <th>Tax</th>
                    <th>Other</th>
                    <th>VAT</th>
                    <th>GROSS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-4">{fareDetail?.paxType}</td>
                    <td>{fareDetail?.paxCount}</td>
                    <td>{fareDetail?.baseFare}</td>
                    <td>{fareDetail?.tax}</td>
                    <td>{fareDetail?.otherFee}</td>
                    <td>{fareDetail?.vat}</td>
                    <td className="font-semibold">{gross}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-right font-bold mt-2 text-md">
              Discount: {discount} {currency}
            </div>
            <div className="text-right font-bold mt-4 text-lg">
              Total: {total} {currency}
            </div>
          </AccordionContent>
        </AccordionItem>
        {/* Baggage Allowance */}
        <AccordionItem value="baggage">
          <AccordionTrigger
            className="bg-primary/10 text-primary font-semibold px-4 py-3 rounded-md hover:bg-primary/20 transition-colors no-underline border-none hover:no-underline focus:no-underline text-heading-16"
            style={{ textDecoration: "none" }}
          >Baggage Allowance</AccordionTrigger>
          <AccordionContent className="text-heading-14">
            {offersToRender.map((offer, idx) => {
              const baggageList = offer?.baggageAllowanceList || [];
              return (
                <Card key={offer.offerId + "-baggage"} className="p-6 bg-background dark:bg-black/80 shadow-sm mb-4">
                  {baggageList.length === 0 ? <Skeleton className="h-6 w-full" /> : (
                    <div className="space-y-2">
                      {baggageList.map((b: any, i: number) => (
                        <div key={i} className="border-b last:border-b-0 py-2 text-heading-14">
                          <div className="font-semibold">{b.baggageAllowance.departure} → {b.baggageAllowance.arrival}</div>
                          <div className="flex flex-wrap gap-4 text-xs">
                            <div>Check-in: {b.baggageAllowance.checkIn.map((c: any) => `${c.paxType}: ${c.allowance}`).join(", ")}</div>
                            <div>Cabin: {b.baggageAllowance.cabin.map((c: any) => `${c.paxType}: ${c.allowance}`).join(", ")}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </AccordionContent>
        </AccordionItem>
        {/* Penalties */}
        <AccordionItem value="penalties">
          <AccordionTrigger
            className="bg-primary/10 text-primary font-semibold px-4 py-3 rounded-md hover:bg-primary/20 transition-colors no-underline border-none hover:no-underline focus:no-underline text-heading-16"
            style={{ textDecoration: "none" }}
          >Penalties</AccordionTrigger>
          <AccordionContent className="text-heading-14">
            {offersToRender.map((offer, idx) => {
              const penalty = offer?.penalty || {};
              return (
                <Card key={offer.offerId + "-penalties"} className="p-6 bg-background dark:bg-black/80 shadow-sm mb-4">
                  {/* Remove the icon and heading from Penalties */}
                  {!penalty?.refundPenaltyList && !penalty?.exchangePenaltyList ? <Skeleton className="h-6 w-full" /> : (
                    <div className="space-y-4">
                      {penalty?.refundPenaltyList && (
                        <div>
                          <div className="font-semibold mb-1">Refund Penalties</div>
                          {penalty.refundPenaltyList.map((r: any, i: number) => (
                            <div key={i} className="mb-2 text-heading-14">
                              <div className="text-xs font-medium">{r.refundPenalty.departure} → {r.refundPenalty.arrival}</div>
                              {r.refundPenalty.penaltyInfoList.map((p: any, j: number) => (
                                <div key={j} className="ml-2 text-heading-14">
                                  <div className="font-semibold text-xs">{p.penaltyInfo.type}</div>
                                  {p.penaltyInfo.textInfoList.map((t: any, k: number) => (
                                    <div key={k} className="ml-4 text-xs">{t.textInfo.paxType}: {t.textInfo.info.join(", ")}</div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                      {penalty?.exchangePenaltyList && (
                        <div>
                          <div className="font-semibold mb-1">Exchange Penalties</div>
                          {penalty.exchangePenaltyList.map((r: any, i: number) => (
                            <div key={i} className="mb-2 text-heading-14">
                              <div className="text-xs font-medium">{r.exchangePenalty.departure} → {r.exchangePenalty.arrival}</div>
                              {r.exchangePenalty.penaltyInfoList.map((p: any, j: number) => (
                                <div key={j} className="ml-2 text-heading-14">
                                  <div className="font-semibold text-xs">{p.penaltyInfo.type}</div>
                                  {p.penaltyInfo.textInfoList.map((t: any, k: number) => (
                                    <div key={k} className="ml-4 text-xs">{t.textInfo.paxType}: {t.textInfo.info.join(", ")}</div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {/* Actions */}
      <div className="flex gap-4 justify-between mt-8">
        <Button variant="outline" className="flex items-center gap-2" onClick={onBack}>
          <ChevronLeft className="w-5 h-5" /> Back to Edit
        </Button>
        <Button 
          className="flex items-center gap-2" 
          onClick={() => handleOrderSell(traceId || '', offerId, contactData, passengersData)} 
          disabled={submitLoading || loading}
        >
          {submitLoading ? "Processing..." : "Proceed to Book"} <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
      {(submitError || error) && (
        <div className="mt-4 text-destructive font-semibold">{submitError || error}</div>
      )}
    </div>
  );
} 