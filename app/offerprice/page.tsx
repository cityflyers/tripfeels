"use client"

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format as formatDate, parseISO, addMonths, subYears, subMonths, subDays } from "date-fns";
import { Plane, DollarSign, Briefcase, AlertCircle, User, Mail, Phone, Users, Calendar, ChevronRight, CheckCircle } from 'lucide-react';
import { useAuth } from "@/context/auth-context";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { fetchOfferPrice } from "@/lib/api";
import { getMarkupByAirline, getMarkupByAirlineAndRoute } from '@/lib/markup';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import Select from 'react-select';

// TODO: Import your UI components for itinerary, fare summary, etc.

const fetchOrderSell = async (traceId: any, offerId: any, request: any, token: any) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/OrderSell`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ traceId, offerId, request }),
  });
  if (!res.ok) throw new Error("Failed to sell order");
  return res.json();
};

const fetchOrderCreate = async (traceId: any, offerId: any, request: any, token: any) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/OrderCreate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ traceId, offerId, request }),
  });
  if (!res.ok) throw new Error("Failed to create order");
  return res.json();
};

function getFareSummary(offer: any) {
  if (!offer?.fareDetailList) return [];
  return offer.fareDetailList.map(({ fareDetail }: { fareDetail: any }) => ({
    paxType: fareDetail.paxType,
    paxCount: fareDetail.paxCount,
    baseFare: fareDetail.baseFare,
    tax: fareDetail.tax,
    otherFee: fareDetail.otherFee,
    discount: fareDetail.discount,
    vat: fareDetail.vat,
    subTotal: fareDetail.subTotal,
    currency: fareDetail.currency,
  }));
}

function getSegments(offer: any) {
  if (!offer?.paxSegmentList) return [];
  return offer.paxSegmentList.map(({ paxSegment }: { paxSegment: any }) => paxSegment);
}

function getPassengerList(offer: any) {
  if (!offer?.fareDetailList) return [];
  const paxList: any[] = [];
  offer.fareDetailList.forEach(({ fareDetail }: { fareDetail: any }) => {
    for (let i = 0; i < fareDetail.paxCount; i++) {
      paxList.push({
        ptc: fareDetail.paxType,
        index: i,
      });
    }
  });
  return paxList;
}

// Helper to determine if flight is domestic
const DOMESTIC_IATA_CODES = ["DAC", "CGP", "CXB", "BZL", "JSR", "RJH", "ZYL", "SPD"];
function isDomesticFlight(segments: any[]): boolean {
  if (!segments || !segments.length) return false;
  return segments.every((seg: any) =>
    DOMESTIC_IATA_CODES.includes(seg.departure?.iatA_LocationCode) &&
    DOMESTIC_IATA_CODES.includes(seg.arrival?.iatA_LocationCode)
  );
}

function getDobConstraints(ptc: string, lastArrivalDate: Date | null) {
  if (!lastArrivalDate || !ptc) {
    return { min: undefined, max: undefined };
  }

  let min: string | undefined;
  let max: string | undefined;

  if (ptc === "Adult") {
    const maxDob = subDays(subYears(lastArrivalDate, 12), 1);
    max = formatDate(maxDob, "yyyy-MM-dd");
  } else if (ptc === "Child") {
    const maxDob = subDays(subYears(lastArrivalDate, 2), 1);
    const minDob = subDays(subYears(lastArrivalDate, 12), 0);
    min = formatDate(minDob, "yyyy-MM-dd");
    max = formatDate(maxDob, "yyyy-MM-dd");
  } else if (ptc === "Infant") {
    const minDob = subDays(subYears(lastArrivalDate, 2), 0);
    min = formatDate(minDob, "yyyy-MM-dd");
    max = formatDate(new Date(), "yyyy-MM-dd");
  }

  return { min, max };
}

export default function OfferPricePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const db = getFirestore(app);
  const [step, setStep] = useState<'loading' | 'form' | 'confirm' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [offerData, setOfferData] = useState(null);
  const [orderSellData, setOrderSellData] = useState(null);
  const [orderCreateData, setOrderCreateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [dobErrors, setDobErrors] = useState<Record<number, string | null>>({});

  // Get initial params from URL
  const initialTraceId = searchParams.get("traceId");
  const initialOfferId = useMemo(() => searchParams.getAll("offerId"), [searchParams]);
  
  // Store the latest traceId and offerId from OfferPrice response
  const [latestTraceId, setLatestTraceId] = useState<string | null>(initialTraceId);
  const offerIdRef = useRef<string[] | string>([]);
  
  // TODO: Get token from auth context if needed
  const token = null;

  // Add state to hold markup-adjusted offers
  const [offersWithMarkup, setOffersWithMarkup] = useState<any[]>([]);
  const [markupPercents, setMarkupPercents] = useState<{ [offerId: string]: number }>({});

  // Step 1: Fetch OfferPrice
  useEffect(() => {
    if (!initialTraceId || !initialOfferId.length) return;
    setStep("loading");
    setError(null);
    fetchOfferPrice(initialTraceId, initialOfferId, token)
      .then((data) => {
        // Handle API-level errors (e.g., fare unavailable)
        if (data.success === false || data.info?.error) {
          const errorMessage = data.info?.error?.errorMessage || data.message || "The selected fare is no longer available. Please go back and try another option.";
          setError(errorMessage);
          setStep("error");
          return;
        }

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
            setError("Booking cancelled due to changes in flight details.");
            setStep("error");
            return;
          }
        }

        setOfferData(data);
        // Store the latest traceId and offerId(s) from the response
        const responseTraceId = data?.response?.traceId;
        const offersGroup = Array.isArray(data?.response?.offersGroup) ? data.response.offersGroup : [];
        let responseOfferIds: string[] = [];
        
        console.log("=== OfferPrice Response Processing ===");
        console.log("Response data:", data);
        console.log("Response traceId:", responseTraceId);
        console.log("Offers group:", offersGroup);
        
        if (offersGroup.length === 1 && offersGroup[0]?.offer?.offerId) {
          // Only one offer, use it
          responseOfferIds = [offersGroup[0].offer.offerId];
          console.log("Single offer found:", responseOfferIds);
        } else if (offersGroup.length > 1) {
          // Check if all validatingCarrier are the same
          const allSameCarrier = offersGroup.every(
            (g: any) => g.offer?.validatingCarrier === offersGroup[0].offer?.validatingCarrier
          );
          if (allSameCarrier) {
            // Look for a combined offerId (no _OB/_IB suffix)
            const combined = offersGroup.find(
              (g: any) => g.offer?.offerId && !g.offer.offerId.endsWith('_OB') && !g.offer.offerId.endsWith('_IB')
            );
            if (combined) {
              responseOfferIds = [combined.offer.offerId];
              console.log("Combined offer found:", responseOfferIds);
            } else {
              // fallback: use all offerIds (should not happen for same airline)
              responseOfferIds = offersGroup.map((g: any) => g.offer?.offerId).filter(Boolean);
              console.log("Fallback to all offerIds:", responseOfferIds);
            }
          } else {
            // Multi-airline: use all offerIds
            responseOfferIds = offersGroup.map((g: any) => g.offer?.offerId).filter(Boolean);
            console.log("Multi-airline offerIds:", responseOfferIds);
          }
        }
        
        if (responseTraceId) {
          setLatestTraceId(responseTraceId);
          console.log("Latest traceId set to:", responseTraceId);
        } else {
          console.warn("No traceId found in response");
        }
        
        offerIdRef.current = responseOfferIds;
        console.log("OfferId ref set to:", responseOfferIds);
        setStep("form");
      })
      .catch((err) => {
        setError(err.message);
        setStep("error");
      });
  }, [initialTraceId, initialOfferId.join(",")]);

  // Helper: get all offer objects from offerData
  const allOffers: any[] = ((offerData as any)?.response as any)?.offersGroup?.map((g: any) => g.offer) || [];
  // Use the first offer for single-offer logic (form, passengers, etc.)
  const mainOffer: any = allOffers[0];
  const fareSummary = mainOffer ? getFareSummary(mainOffer) : [];
  const segments = mainOffer ? getSegments(mainOffer) : [];
  const passengerList = mainOffer ? getPassengerList(mainOffer) : [];

  // Get API response flags
  const passportRequired = (offerData as any)?.response?.passportRequired || false;
  const availableSSR = (offerData as any)?.response?.availableSSR || [];
  const partialPaymentInfo = (offerData as any)?.response?.partialPaymentInfo;

  // Get last arrival date for validation
  const lastArrivalDate = useMemo(() => {
    if (!segments || segments.length === 0) return null;
    try {
      const arrivalDates = segments.map((seg: any) => new Date(seg.arrival.aircraftScheduledDateTime));
      return new Date(Math.max.apply(null, arrivalDates as any));
    } catch (e) {
      console.error("Error parsing arrival dates", e);
      return null;
    }
  }, [segments]);

  // Dynamic form state
  // Set default value for Nationality to 'BD' and for Country Code to '880'
  const [contact, setContact] = useState({ email: "", phone: "", countryDialingCode: "880" });
  const [passengers, setPassengers] = useState(() =>
    passengerList.map(() => ({
      givenName: "",
      surname: "",
      gender: "",
      birthdate: "",
      nationality: "BD",
      identityDocType: "Passport",
      identityDocID: "",
      expiryDate: "",
      ssrCode: "",
      ssrRemark: "",
      loyaltyAirline: "",
      loyaltyAccount: "",
    }))
  );

  // Update form state on offerData load
  useEffect(() => {
    if (passengerList.length && passengers.length !== passengerList.length) {
      setPassengers(
        passengerList.map(() => ({
          givenName: "",
          surname: "",
          gender: "",
          birthdate: "",
          nationality: "",
          identityDocType: "Passport",
          identityDocID: "",
          expiryDate: "",
          ssrCode: "",
          ssrRemark: "",
          loyaltyAirline: "",
          loyaltyAccount: "",
        }))
      );
    }
  }, [offerData]);

  // Add after useState for contact and passengers
  useEffect(() => {
    // Only prefill if offerData is loaded and passengerList is available
    if (mainOffer && passengerList.length) {
      const savedContact = localStorage.getItem("offerprice_contact");
      const savedPassengers = localStorage.getItem("offerprice_passengers");
      if (savedContact) setContact(JSON.parse(savedContact));
      if (savedPassengers) {
        const parsed = JSON.parse(savedPassengers);
        if (Array.isArray(parsed) && parsed.length === passengerList.length) {
          setPassengers(parsed);
        }
      }
    }
    // eslint-disable-next-line
  }, [offerData]);

  const isDomestic = useMemo(() => isDomesticFlight(segments), [segments]);

  // Prefill nationality and passport number for domestic flights
  useEffect(() => {
    if (isDomestic && passengerList.length && passengers.every(p => !p.nationality)) { // only run once
      const sixMonthsLater = formatDate(addMonths(new Date(), 6), "yyyy-MM-dd");
      setPassengers(ps => ps.map((p, i) => {
        const ptc = passengerList[i]?.ptc;
        let birthdate = p.birthdate;
        if (!birthdate) {
          if (ptc === "Adult") {
            birthdate = formatDate(subYears(new Date(), 18), "yyyy-MM-dd");
          } else if (ptc === "Child") {
            birthdate = formatDate(subDays(subYears(new Date(), 5), 1), "yyyy-MM-dd");
          } else if (ptc === "Infant") {
            birthdate = formatDate(subDays(subMonths(new Date(), 12), 1), "yyyy-MM-dd");
          }
        }
        return {
          ...p,
          nationality: p.nationality || "BD",
          identityDocID: p.identityDocID || `DOCSBD${27 + i}`,
          expiryDate: p.expiryDate || sixMonthsLater,
          birthdate,
        };
      }));
    }
    // Do not prefill for international
  }, [isDomestic, passengerList.length]);

  // Helper to build the form object on demand
  function buildForm(): any {
    // Find all adults and infants
    const adultIndexes = passengerList.map((p, i) => ({...p, idx: i})).filter(p => p.ptc === "Adult").map(p => p.idx);
    const infantIndexes = passengerList.map((p, i) => ({...p, idx: i})).filter(p => p.ptc === "Infant").map(p => p.idx);
    // Map each infant to a unique adult
    const infantToAdultMap: Record<number, number> = {};
    infantIndexes.forEach((infantIdx, i) => {
      infantToAdultMap[infantIdx] = adultIndexes[i];
    });
    // Helper to ensure date is in YYYY-MM-DD
    function toISODate(dateStr: string): string {
      if (!dateStr) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      const parts = dateStr.split("-").length === 3 ? dateStr.split("-") : dateStr.split("/");
      if (parts.length === 3) {
        if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
        if (parseInt(parts[0], 10) > 12) {
          return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        } else {
          return `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
        }
      }
      try {
        return formatDate(new Date(dateStr), "yyyy-MM-dd");
      } catch {
        return dateStr;
      }
    }
    return {
      contactInfo: {
        phone: {
          phoneNumber: contact.phone,
          countryDialingCode: contact.countryDialingCode,
        },
        emailAddress: contact.email,
      },
      paxList: passengers.map((p, idx) => {
        const ptc = passengerList[idx]?.ptc;
        // Only include sellSSR if at least one SSR/loyalty field is filled
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
        // Add associatePax for infants
        const individual = {
          givenName: p.givenName,
          surname: p.surname,
          gender: p.gender,
          birthdate: toISODate(p.birthdate),
          nationality: p.nationality,
          identityDoc: {
            identityDocType: p.identityDocType,
            identityDocID: p.identityDocID,
            expiryDate: toISODate(p.expiryDate),
          },
          ...(ptc === "Infant" && infantToAdultMap[idx] !== undefined
            ? {
                associatePax: {
                  givenName: passengers[infantToAdultMap[idx]].givenName,
                  surname: passengers[infantToAdultMap[idx]].surname,
                },
              }
            : {}),
        };
        // Only include sellSSR if it exists
        return {
          ptc,
          individual,
          ...(sellSSR ? { sellSSR } : {}),
        };
      }),
    };
  }

  // Validation helper
  function validateForm() {
    if (!contact.email || !contact.phone || !contact.countryDialingCode) {
      return "Please fill in all contact information.";
    }
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.givenName || !p.surname || !p.gender || !p.birthdate) {
        return `Please fill in all required fields for passenger #${i + 1}.`;
      }
      if (passportRequired) {
        if (!p.nationality || !p.identityDocID || !p.expiryDate) {
          return `Please fill in all required fields for passenger #${i + 1}.`;
        }
      }
    }
    return null;
  }

  // DOB validation based on PAX type and last arrival date
  const validateDob = (dob: string, ptc: string, index: number): string | null => {
    if (!dob || !ptc || !lastArrivalDate) {
      return null;
    }

    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) return null; // Invalid date string

    let errorMessage: string | null = null;

    if (ptc === "Adult") {
      const maxDob = subDays(subYears(lastArrivalDate, 12), 1);
      if (dobDate > maxDob) {
        errorMessage = `Adult must be at least 12 years old. DOB must be on or before ${formatDate(maxDob, "PP")}.`;
      }
    } else if (ptc === "Child") {
      const maxDob = subDays(subYears(lastArrivalDate, 2), 1);
      const minDob = subDays(subYears(lastArrivalDate, 12), 0);
      if (dobDate > maxDob || dobDate < minDob) {
        errorMessage = `Child must be between 2 and 12 years. DOB must be between ${formatDate(minDob, "PP")} and ${formatDate(maxDob, "PP")}.`;
      }
    } else if (ptc === "Infant") {
      const maxDob = new Date();
      const minDob = subDays(subYears(lastArrivalDate, 2), 0);
      if (dobDate < minDob) {
        errorMessage = `Infant must be under 2 years old. DOB must be on or after ${formatDate(minDob, "PP")}.`;
      } else if (dobDate > maxDob) {
        errorMessage = `Date of birth cannot be in the future.`;
      }
    }
    setDobErrors(e => ({ ...e, [index]: errorMessage }));
    return errorMessage;
  };

  // Extra validation for OrderSell request
  function validateOrderSellRequest(traceId: any, offerId: any, request: any) {
    if (!traceId) return "Missing traceId";
    if (!Array.isArray(offerId) || offerId.length === 0) return "Missing offerId";
    if (!request?.contactInfo?.phone?.phoneNumber || !request?.contactInfo?.phone?.countryDialingCode || !request?.contactInfo?.emailAddress) {
      return "Missing contact info";
    }
    if (!Array.isArray(request.paxList) || request.paxList.length === 0) return "Missing passenger list";
    for (const [i, pax] of request.paxList.entries()) {
      if (!pax.ptc || !pax.individual?.givenName || !pax.individual?.surname || !pax.individual?.gender || !pax.individual?.birthdate) {
        return `Missing required field for passenger #${i + 1}`;
      }
      if (passportRequired){
        if(!pax.individual?.nationality || !pax.individual?.identityDoc?.identityDocType || !pax.individual?.identityDoc?.identityDocID || !pax.individual?.identityDoc?.expiryDate){
          return `Missing required field for passenger #${i + 1}`;
        }
      }
    }
    return null;
  }

  // Step 2: Handle form submit (OrderSell)
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setFormError(null);
    
    console.log("=== Form Submit Started ===");
    console.log("Current state:", { step, latestTraceId, offerIdRef: offerIdRef.current });
    
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      console.log("Validation error:", validationError);
      return;
    }
    
    // Check for any existing DOB errors
    if (Object.values(dobErrors).some(e => e !== null)) {
      setFormError("Please correct the date of birth errors before continuing.");
      console.log("DOB error:", dobErrors);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Save form data to localStorage for OrderSell page
      localStorage.setItem("offerprice_contact", JSON.stringify(contact));
      localStorage.setItem("offerprice_passengers", JSON.stringify(passengers));
      
      console.log("Form data saved to localStorage");
      console.log("Contact:", contact);
      console.log("Passengers:", passengers);
      
      // Call OrderSell API as required by documentation
      const request = buildForm();
      let offerIdToSend = offerIdRef.current;
      if (!Array.isArray(offerIdToSend)) {
        offerIdToSend = [offerIdToSend];
      }
      
      console.log("=== Calling OrderSell API ===");
      console.log("TraceId:", latestTraceId);
      console.log("OfferId:", offerIdToSend);
      console.log("Request payload:", request);
      
      if (!latestTraceId) {
        throw new Error("No traceId available. Please refresh the page and try again.");
      }
      
      if (!offerIdToSend || offerIdToSend.length === 0) {
        throw new Error("No offerId available. Please refresh the page and try again.");
      }
      
      const orderSellResponse = await fetchOrderSell(latestTraceId, offerIdToSend, request, token);
      
      console.log("OrderSell API response:", orderSellResponse);
      
      if (orderSellResponse?.success === false) {
        throw new Error(orderSellResponse?.error?.message || "OrderSell API failed");
      }
      
      // Check for offer changes as per API documentation
      const offerChangeInfo = orderSellResponse?.response?.offerChangeInfo;
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
          setFormError("Booking cancelled due to changes in flight details.");
          return;
        }
      }
      
      // Store OrderSell response for review step
      setOrderSellData(orderSellResponse);
      console.log("OrderSell API successful, moving to confirm step");
      setStep("confirm");
    } catch (err: any) {
      console.error("OrderSell API error:", err);
      setError(err.message || "Failed to process booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Handle confirm (OrderCreate)
  const handleConfirm = async () => {
    setFormError(null);
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const request = buildForm();
      // Always send offerId as an array for /OrderCreate
      let offerIdToSend = offerIdRef.current;
      if (!Array.isArray(offerIdToSend)) {
        offerIdToSend = [offerIdToSend];
      }
      const data = await fetchOrderCreate(latestTraceId, offerIdToSend, request, token);
      // Redirect to orderretrieve with the orderReference
      const orderReference = (data?.response)?.orderReference;
      if (orderReference) {
        try {
          const orderDataFromApi = data?.response;
          const firstOrderItem = orderDataFromApi?.orderItem?.[0];
          const firstPaxSegment = firstOrderItem?.paxSegmentList?.[0]?.paxSegment;
          const adults = passengerList.filter(p => p.ptc === 'Adult').length;
          const children = passengerList.filter(p => p.ptc === 'Child').length;
          const infants = passengerList.filter(p => p.ptc === 'Infant').length;

          const newOrderData = {
            created: new Date(),
            issued: new Date(),
            reference: orderDataFromApi?.orderReference || "N/A",
            airlinePNR: firstPaxSegment?.airlinePNR || "N/A",
            name: {
              givenName: passengers[0]?.givenName || "",
              surname: passengers[0]?.surname || "",
            },
            paxDetails: {
              adult: adults,
              child: children,
              infant: infants,
            },
            route: {
              from: segments[0]?.departure?.iatA_LocationCode || "N/A",
              to: segments[segments.length - 1]?.arrival?.iatA_LocationCode || "N/A",
            },
            airline: firstOrderItem?.validatingCarrier || mainOffer?.validatingCarrier || "N/A",
            amount: firstOrderItem?.price?.gross?.total ?? mainOffer?.price?.totalPayable?.total ?? 0,
            createdBy: user?.email || "anonymous",
            status: orderDataFromApi?.orderStatus || "OnHold",
            flyDate: segments?.[0]?.departure?.aircraftScheduledDateTime ? new Date(segments[0].departure.aircraftScheduledDateTime) : null,
          };

          const orderDocRef = doc(db, "Orders", newOrderData.reference);
          await setDoc(orderDocRef, newOrderData);
          console.log("Order saved to Firestore with reference:", newOrderData.reference);
        } catch (firestoreError) {
          console.error("Error saving order to Firestore:", firestoreError);
          // Not showing error to user, just logging
        }
        router.push(`/orderretrieve?orderReference=${encodeURIComponent(orderReference)}`);
        return;
      }
      // fallback: show error if no orderReference
      setError("Order created but no order reference returned.");
    } catch (err: any) {
      setError(err.message || "Failed to complete booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Recalculate offers with markup when offerData changes
  useEffect(() => {
    async function applyMarkup() {
      if (!allOffers.length) {
        setOffersWithMarkup([]);
        setMarkupPercents({});
        return;
      }
      
      const updatedOffers = await Promise.all(allOffers.map(async (offer) => {
        // Extract airline, from, to, and role
        const airlineCode = offer?.validatingCarrier || offer?.paxSegmentList?.[0]?.paxSegment?.marketingCarrierInfo?.carrierDesigCode;
        const fromAirport = offer?.paxSegmentList?.[0]?.paxSegment?.departure?.iatA_LocationCode;
        const toAirport = offer?.paxSegmentList?.[offer?.paxSegmentList.length - 1]?.paxSegment?.arrival?.iatA_LocationCode;
        let role = 'USER';
        if (user && user.role === 'AGENT') role = 'AGENT';
        
        // Use the correct markup function
        const markup = airlineCode
          ? await getMarkupByAirlineAndRoute(airlineCode, role, fromAirport, toAirport)
          : 0;
          
        const fareDetailList = (offer.fareDetailList || []).map(({ fareDetail }: any) => {
          // Only apply markup if not already applied
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
              originalBaseFare, // preserve original
              baseFare: newBaseFare,
              discount: commission,
              subTotal: newSubtotal,
              _markupApplied: true,
            },
          };
        });
        const totalPayable = fareDetailList.reduce((sum: number, { fareDetail }: any) => sum + (fareDetail.subTotal || 0), 0);
        return {
          ...offer,
          fareDetailList,
          price: {
            ...offer.price,
            totalPayable: {
              ...offer.price?.totalPayable,
              total: totalPayable,
            },
          },
        };
      }));
      
      setOffersWithMarkup(updatedOffers);
      
      // Also update markup percentages
      const percents: { [offerId: string]: number } = {};
      for (const offer of allOffers) {
        const airlineCode = offer?.validatingCarrier || offer?.paxSegmentList?.[0]?.paxSegment?.marketingCarrierInfo?.carrierDesigCode;
        const fromAirport = offer?.paxSegmentList?.[0]?.paxSegment?.departure?.iatA_LocationCode;
        const toAirport = offer?.paxSegmentList?.[offer?.paxSegmentList.length - 1]?.paxSegment?.arrival?.iatA_LocationCode;
        let role = 'USER';
        if (user && user.role === 'AGENT') role = 'AGENT';
        percents[offer.offerId] = airlineCode ? await getMarkupByAirlineAndRoute(airlineCode, role, fromAirport, toAirport) : 0;
      }
      setMarkupPercents(percents);
    }
    applyMarkup();
    // eslint-disable-next-line
  }, [offerData, user]);

  // Use offersWithMarkup for rendering instead of allOffers
  const offersToRender = offersWithMarkup.length ? offersWithMarkup : allOffers;

  // TODO: Render itinerary, fare summary, dynamic form, etc.

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <AlertCircle className="w-5 h-5 text-orange-500" />
        <span className="text-sm font-normal text-orange-500">
          Passenger name must exactly match the name on your Government ID or Passport to avoid issues during travel
        </span>
      </div>
      {step === "loading" && (
        <Card className="p-8 flex flex-col items-center justify-center bg-background dark:bg-black/80">
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/4" />
        </Card>
      )}
      {step === "error" && (
        <Card className="p-8 text-red-500 bg-background dark:bg-black/80">
          <AlertCircle className="w-6 h-6 mb-2 text-destructive" />
          <div className="font-semibold">{error || "An error occurred. Please try again."}</div>
        </Card>
      )}
      {step === "form" && offerData && offersToRender.length > 0 && (
        <form onSubmit={handleFormSubmit}>
          <Accordion type="multiple" defaultValue={["itinerary", "passenger", "contact", "fare", "baggage", "penalties"]} className="mb-8">
            {/* Itinerary */}
            <AccordionItem value="itinerary">
              <AccordionTrigger
                className="bg-primary/10 text-primary font-semibold px-4 py-3 rounded-md hover:bg-primary/20 transition-colors no-underline border-none hover:no-underline focus:no-underline"
                style={{ textDecoration: "none" }}
              >Itinerary</AccordionTrigger>
              <AccordionContent>
                {offersToRender.map((offer, idx) => (
                  <div key={offer.offerId} className="space-y-8">
                    <Card className="p-6 bg-background dark:bg-black/80 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Plane className="w-5 h-5 text-primary" />
                        <span className="text-lg font-semibold">{offer.offerId?.endsWith('_OB') ? 'Outbound' : offer.offerId?.endsWith('_IB') ? 'Inbound' : 'Flight'}</span>
                      </div>
                      <div className="space-y-6">
                        {(offer?.paxSegmentList ?? []).map(({ paxSegment }: any, i: number) => (
                          <div key={i} className="flex flex-col md:flex-row md:items-center gap-4 border-b last:border-b-0 pb-4 last:pb-0">
                            <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                              <div className="flex flex-col items-start">
                                <span className="text-xl font-bold">{paxSegment.departure.iatA_LocationCode}</span>
                                <span>
                                  <span className="text-xs text-muted-foreground">{formatDate(new Date(paxSegment.departure.aircraftScheduledDateTime), "yyyy-MM-dd")}</span>
                                  <span className="text-base md:text-lg font-bold text-orange-400 ml-1">{formatDate(new Date(paxSegment.departure.aircraftScheduledDateTime), "HH:mm")}</span>
                                </span>
                              </div>
                              <div className="flex flex-col items-center mx-2">
                                <ChevronRight className="w-5 h-5 text-primary" />
                                <span className="text-xs text-muted-foreground">Flight</span>
                              </div>
                              <div className="flex flex-col items-start">
                                <span className="text-xl font-bold">{paxSegment.arrival.iatA_LocationCode}</span>
                                <span>
                                  <span className="text-xs text-muted-foreground">{formatDate(new Date(paxSegment.arrival.aircraftScheduledDateTime), "yyyy-MM-dd")}</span>
                                  <span className="text-base md:text-lg font-bold text-orange-400 ml-1">{formatDate(new Date(paxSegment.arrival.aircraftScheduledDateTime), "HH:mm")}</span>
                                </span>
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
                className="bg-primary/10 text-primary font-semibold px-4 py-3 rounded-md hover:bg-primary/20 transition-colors no-underline border-none hover:no-underline focus:no-underline"
                style={{ textDecoration: "none" }}
              >Passenger Information</AccordionTrigger>
              <AccordionContent>
                <Card className="p-6 bg-background dark:bg-black/80 shadow-sm">
                  <div className="space-y-8">
                    {passengerList.map((pax, idx) => {
                      const dobConstraints = getDobConstraints(pax.ptc, lastArrivalDate);
                      return (
                        <div key={idx} className="border-b pb-6 last:border-b-0">
                          <div className="font-medium mb-2 text-base">{pax.ptc} {passengerList.filter(p => p.ptc === pax.ptc).length > 1 ? `#${pax.index + 1}` : ""}</div>
                          {/* Section 1: Always required */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <Label>First Name/Given Name</Label>
                              <Input
                                value={passengers[idx]?.givenName || ""}
                                style={{ textTransform: 'uppercase' }}
                                onChange={e => setPassengers(ps => ps.map((p, i) => i === idx ? { ...p, givenName: e.target.value.toUpperCase() } : p))}
                                required
                              />
                            </div>
                            <div>
                              <Label>Last Name/Surname</Label>
                              <Input
                                value={passengers[idx]?.surname || ""}
                                style={{ textTransform: 'uppercase' }}
                                onChange={e => setPassengers(ps => ps.map((p, i) => i === idx ? { ...p, surname: e.target.value.toUpperCase() } : p))}
                                required
                              />
                            </div>
                            <div>
                              <Label>Gender</Label>
                              <select
                                className="w-full border rounded px-3 py-2 bg-background dark:bg-black/60 h-10"
                                value={passengers[idx]?.gender || ""}
                                onChange={e => setPassengers(ps => ps.map((p, i) => i === idx ? { ...p, gender: e.target.value } : p))}
                                required
                              >
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div>
                              <Label>Birthdate</Label>
                              <Input
                                type="date"
                                min={dobConstraints.min}
                                max={dobConstraints.max}
                                value={passengers[idx]?.birthdate || ""}
                                onChange={e => {
                                  const newDob = e.target.value;
                                  const dobError = validateDob(newDob, pax.ptc, idx);
                                  if(dobError) {
                                    setPassengers(ps => ps.map((p, i) => i === idx ? { ...p, birthdate: "" } : p));
                                  } else {
                                    setPassengers(ps => ps.map((p, i) => i === idx ? { ...p, birthdate: newDob } : p));
                                  }
                                }}
                                required
                              />
                              {dobErrors[idx] && <p className="text-destructive text-xs mt-1">{dobErrors[idx]}</p>}
                            </div>
                          </div>
                          {/* Section 2: Required for all, but hide visually for domestic */}
                          {passportRequired && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <Label>Nationality</Label>
                                <Select
                                  classNamePrefix="react-select"
                                  options={COUNTRY_OPTIONS.map(c => ({ value: c.code, label: c.name }))}
                                  value={COUNTRY_OPTIONS.map(c => ({ value: c.code, label: c.name })).find(opt => opt.value === passengers[idx]?.nationality)}
                                  onChange={opt => setPassengers(ps => ps.map((p, i) => i === idx ? { ...p, nationality: opt?.value || '' } : p))}
                                  isSearchable
                                  placeholder="Select Nationality"
                                  menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                                  menuPosition="fixed"
                                  styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                />
                              </div>
                              <div>
                                <Label>Passport Number</Label>
                                <Input
                                  value={passengers[idx]?.identityDocID || ""}
                                  style={{ textTransform: 'uppercase' }}
                                  onChange={e => setPassengers(ps => ps.map((p, i) => i === idx ? { ...p, identityDocID: e.target.value.toUpperCase() } : p))}
                                  required
                                />
                              </div>
                              <div>
                                <Label>Passport Expiry</Label>
                                <Input type="date" value={passengers[idx]?.expiryDate || ""} onChange={e => setPassengers(ps => ps.map((p, i) => i === idx ? { ...p, expiryDate: e.target.value } : p))} required />
                              </div>
                            </div>
                          )}
                          {/* SSR/loyalty fields (common, optional) */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                            {availableSSR.length > 0 && (
                              <div className="col-span-full mb-2">
                                <Label className="text-sm text-muted-foreground">Available Special Services: {availableSSR.join(', ')}</Label>
                              </div>
                            )}
                            <div>
                              <Label>SSR Code</Label>
                              <Input
                                value={passengers[idx]?.ssrCode || ""}
                                style={{ textTransform: 'uppercase' }}
                                onChange={e => setPassengers(ps => ps.map((p, i) => i === idx ? { ...p, ssrCode: e.target.value.toUpperCase() } : p))}
                                placeholder="e.g. WCHR"
                              />
                            </div>
                            <div>
                              <Label>SSR Remark</Label>
                              <Input
                                value={passengers[idx]?.ssrRemark || ""}
                                style={{ textTransform: 'uppercase' }}
                                onChange={e => setPassengers(ps => ps.map((p, i) => i === idx ? { ...p, ssrRemark: e.target.value.toUpperCase() } : p))}
                                placeholder="Optional remark"
                              />
                            </div>
                            <div>
                              <Label>Loyalty Airline Code</Label>
                              <Input
                                value={passengers[idx]?.loyaltyAirline || ""}
                                style={{ textTransform: 'uppercase' }}
                                onChange={e => setPassengers(ps => ps.map((p, i) => i === idx ? { ...p, loyaltyAirline: e.target.value.toUpperCase() } : p))}
                                placeholder="e.g. BS"
                              />
                            </div>
                            <div>
                              <Label>Loyalty Account Number</Label>
                              <Input
                                value={passengers[idx]?.loyaltyAccount || ""}
                                style={{ textTransform: 'uppercase' }}
                                onChange={e => setPassengers(ps => ps.map((p, i) => i === idx ? { ...p, loyaltyAccount: e.target.value.toUpperCase() } : p))}
                                placeholder="e.g. 3523626235"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </AccordionContent>
            </AccordionItem>
            {/* Contact Info */}
            <AccordionItem value="contact">
              <AccordionTrigger
                className="bg-primary/10 text-primary font-semibold px-4 py-3 rounded-md hover:bg-primary/20 transition-colors no-underline border-none hover:no-underline focus:no-underline"
                style={{ textDecoration: "none" }}
              >Contact Information</AccordionTrigger>
              <AccordionContent>
                <Card className="p-6 bg-background dark:bg-black/80 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Country Code</Label>
                      <Select
                        classNamePrefix="react-select"
                        options={COUNTRY_OPTIONS.map(c => ({ value: c.dialCode, label: `+${c.dialCode} (${c.name})` }))}
                        value={COUNTRY_OPTIONS.map(c => ({ value: c.dialCode, label: `+${c.dialCode} (${c.name})` })).find(opt => opt.value === contact.countryDialingCode)}
                        onChange={opt => setContact(c => ({ ...c, countryDialingCode: opt?.value || '' }))}
                        isSearchable
                        placeholder="Select Code"
                        menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                        menuPosition="fixed"
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input type="tel" value={contact.phone || ""} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} required />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input type="email" value={contact.email || ""} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} required />
                    </div>
                  </div>
                </Card>
              </AccordionContent>
            </AccordionItem>
            {/* Fare Summary */}
            <AccordionItem value="fare">
              <AccordionTrigger
                className="bg-primary/10 text-primary font-semibold px-4 py-3 rounded-md hover:bg-primary/20 transition-colors no-underline border-none hover:no-underline focus:no-underline"
                style={{ textDecoration: "none" }}
              >Fare Summary</AccordionTrigger>
              <AccordionContent>
                {allOffers.map((offer, idx) => (
                  <Card key={offer.offerId + "-fare"} className="p-6 bg-background dark:bg-black/80 shadow-sm mb-4">
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
                          {(offer?.fareDetailList ?? []).map(({ fareDetail }: any, i: number) => {
                            const grossValue = (((fareDetail.originalBaseFare ?? fareDetail.baseFare) || 0) + (fareDetail.tax || 0) + (fareDetail.otherFee || 0) + (fareDetail.vat || 0)) * (fareDetail.paxCount || 1);
                            return (
                              <tr key={i} className="border-b last:border-b-0">
                                <td className="py-2 px-4">{fareDetail.paxType}</td>
                                <td>{fareDetail.paxCount}</td>
                                <td>{fareDetail.originalBaseFare ?? fareDetail.baseFare}</td>
                                <td>{fareDetail.tax}</td>
                                <td>{fareDetail.otherFee}</td>
                                <td>{fareDetail.vat}</td>
                                <td className="font-semibold">{grossValue}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {(() => {
                      const gross = offer?.price?.gross?.total || 0;
                      const payable = offer?.price?.totalPayable?.total || 0; // Use API value
                      const markupPercent = markupPercents[offer.offerId];
                      if (markupPercent === undefined) {
                        return <div className="text-right font-bold mt-2 text-md">Loading markup...</div>;
                      }
                      const markup = Math.round(payable * (markupPercent / 100));
                      const discount = gross - (payable + markup);
                      const currency = offer?.fareDetailList?.[0]?.fareDetail?.currency || '';
                      return (
                        <>
                          <div className="text-xs text-right text-muted-foreground mb-2">
                            {/* Removed log: gross/payable/markupPercent/markup/discount */}
                          </div>
                          <div className="text-right font-bold mt-2 text-md">
                            Discount: {discount} {currency}
                          </div>
                          <div className="text-right font-bold mt-4 text-lg">
                            Total: {payable + markup} {currency}
                          </div>
                        </>
                      );
                    })()}
                  </Card>
                ))}
                
                {/* Partial Payment Information */}
                {partialPaymentInfo && (
                  <Card className="p-6 bg-background dark:bg-black/80 shadow-sm mb-4">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      <span className="text-lg font-semibold text-green-600">Partial Payment Available</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Total Payable:</span>
                        <span className="ml-2">{partialPaymentInfo.totalPayableAmount} {partialPaymentInfo.currency}</span>
                      </div>
                      <div>
                        <span className="font-medium">Minimum Payment:</span>
                        <span className="ml-2">{partialPaymentInfo.minimumPayableAmount} {partialPaymentInfo.currency}</span>
                      </div>
                      <div>
                        <span className="font-medium">Due Amount:</span>
                        <span className="ml-2">{partialPaymentInfo.dueAmount} {partialPaymentInfo.currency}</span>
                      </div>
                      <div>
                        <span className="font-medium">Due Date:</span>
                        <span className="ml-2">{formatDate(new Date(partialPaymentInfo.dueDate), "PPp")}</span>
                      </div>
                    </div>
                  </Card>
                )}
              </AccordionContent>
            </AccordionItem>
            {/* Baggage Allowance */}
            <AccordionItem value="baggage">
              <AccordionTrigger
                className="bg-primary/10 text-primary font-semibold px-4 py-3 rounded-md hover:bg-primary/20 transition-colors no-underline border-none hover:no-underline focus:no-underline"
                style={{ textDecoration: "none" }}
              >Baggage Allowance</AccordionTrigger>
              <AccordionContent>
                {offersToRender.map((offer, idx) => (
                  <Card key={offer.offerId + "-baggage"} className="p-6 bg-background dark:bg-black/80 shadow-sm mb-4">
                    {(offer?.baggageAllowanceList ?? []).map(({ baggageAllowance }: any, i: number) => (
                      <div key={i} className="mb-2">
                        <div className="font-semibold mb-1">{baggageAllowance.departure} → {baggageAllowance.arrival}</div>
                        <div className="text-sm"><b>Check-in:</b> {(baggageAllowance.checkIn ?? []).map((b: any, idx: number) => `${b.paxType}: ${b.allowance}`).join(", ")}</div>
                        <div className="text-sm"><b>Cabin:</b> {(baggageAllowance.cabin ?? []).map((b: any, idx: number) => `${b.paxType}: ${b.allowance}`).join(", ")}</div>
                      </div>
                    ))}
                  </Card>
                ))}
              </AccordionContent>
            </AccordionItem>
            {/* Penalties */}
            <AccordionItem value="penalties">
              <AccordionTrigger
                className="bg-primary/10 text-primary font-semibold px-4 py-3 rounded-md hover:bg-primary/20 transition-colors no-underline border-none hover:no-underline focus:no-underline"
                style={{ textDecoration: "none" }}
              >Penalties</AccordionTrigger>
              <AccordionContent>
                {offersToRender.map((offer, idx) => (
                  <Card key={offer.offerId + "-penalties"} className="p-6 bg-background dark:bg-black/80 shadow-sm mb-4">
                    <div className="space-y-4">
                      {/* Refund Penalties */}
                      <div>
                        <div className="font-semibold mb-2">Refund Penalties</div>
                        {(offer?.penalty?.refundPenaltyList ?? []).map(({ refundPenalty }: any, i: number) => (
                          <div key={i} className="mb-2">
                            <div className="font-medium">{refundPenalty.departure} → {refundPenalty.arrival}</div>
                            {(refundPenalty.penaltyInfoList ?? []).map(({ penaltyInfo }: any, j: number) => (
                              <div key={j} className="ml-4 mb-1">
                                <div className="font-semibold text-xs">{penaltyInfo.type}</div>
                                <ul className="ml-4 list-disc text-xs">
                                  {(penaltyInfo.textInfoList ?? []).map(({ textInfo }: any, k: number) => (
                                    <li key={k}>{textInfo.paxType}: <span className="font-medium">{textInfo.info.join(', ')}</span></li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                      {/* Exchange Penalties */}
                      <div>
                        <div className="font-semibold mb-2">Exchange Penalties</div>
                        {(offer?.penalty?.exchangePenaltyList ?? []).map(({ exchangePenalty }: any, i: number) => (
                          <div key={i} className="mb-2">
                            <div className="font-medium">{exchangePenalty.departure} → {exchangePenalty.arrival}</div>
                            {(exchangePenalty.penaltyInfoList ?? []).map(({ penaltyInfo }: any, j: number) => (
                              <div key={j} className="ml-4 mb-1">
                                <div className="font-semibold text-xs">{penaltyInfo.type}</div>
                                <ul className="ml-4 list-disc text-xs">
                                  {(penaltyInfo.textInfoList ?? []).map(({ textInfo }: any, k: number) => (
                                    <li key={k}>{textInfo.paxType}: <span className="font-medium">{textInfo.info.join(', ')}</span></li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          {/* Form error and submit button outside accordion for clarity */}
          {formError && (
            <div className="mb-4">
              <Card className="p-4 bg-destructive/10 border-destructive text-destructive flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{formError}</span>
              </Card>
            </div>
          )}
          <Button
            variant="outline"
            className="mb-4"
            onClick={() => {
              localStorage.removeItem("offerprice_contact");
              localStorage.removeItem("offerprice_passengers");
              setContact({ email: "", phone: "", countryDialingCode: "880" });
              setPassengers(passengerList.map(() => ({
                givenName: "",
                surname: "",
                gender: "",
                birthdate: "",
                nationality: "BD",
                identityDocType: "Passport",
                identityDocID: "",
                expiryDate: "",
                ssrCode: "",
                ssrRemark: "",
                loyaltyAirline: "",
                loyaltyAccount: "",
              })));
            }}
          >
            Clear Previous Entry
          </Button>
          <Button type="submit" disabled={loading} className="w-full mt-4 text-lg font-semibold">
            {loading ? "Processing..." : <><ChevronRight className="w-5 h-5 mr-2" />Continue to Review</>}
          </Button>
        </form>
      )}
      {step === "confirm" && orderSellData && (
        <div className="space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-lg font-semibold text-green-600">Review Your Booking</span>
          </div>
          
          {formError && (
            <div className="mb-4">
              <Card className="p-4 bg-destructive/10 border-destructive text-destructive flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{formError}</span>
              </Card>
            </div>
          )}

          {/* OrderSell Review Section */}
          <Card className="p-6 bg-background dark:bg-black/80 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Plane className="w-5 h-5 text-primary" />
              <span className="text-lg font-semibold">Flight Details</span>
            </div>
            
            {/* Flight Itinerary */}
            {offersToRender.map((offer: any, idx: number) => (
              <div key={offer.offerId} className="mb-6">
                <div className="flex items-center gap-4 border-b pb-4 mb-4">
                  <div className="flex flex-col items-start">
                    <span className="text-xl font-bold">{offer.paxSegmentList?.[0]?.paxSegment?.departure?.iatA_LocationCode}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(offer.paxSegmentList?.[0]?.paxSegment?.departure?.aircraftScheduledDateTime).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <ChevronRight className="w-5 h-5 text-primary" />
                    <span className="text-xs text-muted-foreground">Flight</span>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xl font-bold">{offer.paxSegmentList?.[0]?.paxSegment?.arrival?.iatA_LocationCode}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(offer.paxSegmentList?.[0]?.paxSegment?.arrival?.aircraftScheduledDateTime).toLocaleString()}
                    </span>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="font-medium">{offer.marketingCarrierInfo?.carrierName} {offer.marketingCarrierInfo?.carrierDesigCode}-{offer.flightNumber}</div>
                    <div className="text-sm text-muted-foreground">Duration: {offer.paxSegmentList?.[0]?.paxSegment?.duration} min</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Passenger Information */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold">Passenger Information</span>
              </div>
              <div className="space-y-3">
                {passengers.map((passenger: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-3 bg-muted/30">
                    <div className="font-medium">{passenger.givenName} {passenger.surname}</div>
                    <div className="text-sm text-muted-foreground">
                      {passenger.gender} • {passenger.birthdate} • {passenger.nationality}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Passport: {passenger.identityDocID} (exp: {passenger.expiryDate})
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold">Contact Information</span>
              </div>
              <div className="border rounded-lg p-3 bg-muted/30">
                <div>Email: {contact.email}</div>
                <div>Phone: {contact.countryDialingCode}-{contact.phone}</div>
              </div>
            </div>

            {/* Fare Summary */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold">Fare Summary</span>
              </div>
              <div className="border rounded-lg p-3 bg-muted/30">
                <div className="flex justify-between">
                  <span>Base Fare:</span>
                  <span>{offersToRender[0]?.fareDetailList?.[0]?.fareDetail?.baseFare} {offersToRender[0]?.fareDetailList?.[0]?.fareDetail?.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{offersToRender[0]?.fareDetailList?.[0]?.fareDetail?.tax} {offersToRender[0]?.fareDetailList?.[0]?.fareDetail?.currency}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                  <span>Total:</span>
                  <span>{offersToRender[0]?.price?.totalPayable?.total} {offersToRender[0]?.price?.totalPayable?.curreny}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-between">
              <Button variant="outline" onClick={() => setStep("form")}>
                Back to Edit
              </Button>
              <Button 
                onClick={handleConfirm} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? "Processing..." : "Proceed to Book"}
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 