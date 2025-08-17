import { Airport } from '@/components/dashboard/flight/airport/airportUtils';

// API Endpoints
const ENDPOINTS = {
  AIR_SHOPPING: '/AirShopping',
  AIR_SHOPPING_GET_MORE_OFFERS: '/AirShopping/GetMoreOffers',
  FARE_RULES: '/FareRules',
  GET_BALANCE: '/GetBalance',
  MINI_RULE: '/MiniRule',
  OFFER_PRICE: '/OfferPrice',
  ORDER_CANCEL: '/OrderCancel',
  ORDER_CHANGE: '/OrderChange',
  ORDER_CREATE: '/OrderCreate',
  ORDER_RESHOP_PRICE: '/OrderReshopPrice',
  ORDER_RETRIEVE: '/OrderRetrieve',
  ORDER_SELL: '/OrderSell'
} as const;

// Common Types
interface Price {
  total: number;
  curreny: string;  // Note: API has a typo in 'currency'
}

interface PricingInfo {
  totalPayable: Price;
  gross: Price;
  discount?: Price;
  totalVAT?: Price;
}

interface LocationInfo {
  iatA_LocationCode: string;
  terminalName: string;
  aircraftScheduledDateTime: string;
}

interface CarrierInfo {
  carrierDesigCode: string;
  carrierName: string;
  marketingCarrierFlightNumber?: string;
}

interface AircraftInfo {
  iatA_AircraftTypeCode: string;
}

interface PaxSegment {
  departure: LocationInfo;
  arrival: LocationInfo;
  marketingCarrierInfo: CarrierInfo;
  operatingCarrierInfo: CarrierInfo;
  iatA_AircraftType: AircraftInfo;
  rbd: string;
  flightNumber: string;
  duration: string;
  cabinType: string;
  segmentGroup: number;
  returnJourney: boolean;
}

interface FareDetail {
  baseFare: number;
  tax: number;
  otherFee: number;
  discount: number;
  vat: number;
  currency: string;
  paxType: string;
  paxCount: number;
  subTotal: number;
}

interface BaggageInfo {
  paxType: string;
  allowance: string;
}

interface BaggageAllowance {
  departure: string;
  arrival: string;
  checkIn: BaggageInfo[];
  cabin: BaggageInfo[];
}

interface UpSellBrand {
  offerId: string;
  brandName: string;
  refundable: boolean;
  fareDetailList: { fareDetail: FareDetail }[];
  price: PricingInfo;
  baggageAllowanceList: { baggageAllowance: BaggageAllowance }[];
  rbd: string;
  meal: boolean;
  refundAllowed: boolean;
  exchangeAllowed: boolean;
}

interface PaxInfo {
  paxID: string;
  ptc: string;  // ADT, C05, etc.
}

interface OriginDestRequest {
  originDepRequest: {
    iatA_LocationCode: string;
    date: string;
  };
  destArrivalRequest: {
    iatA_LocationCode: string;
  };
}

interface TravelPreferences {
  vendorPref: string[];
  cabinCode: 'Economy' | 'Business' | 'First';
}

// Air Shopping Types
export interface FlightSearchRequest {
  pointOfSale: string;
  request: {
    originDest: OriginDestRequest[];
    pax: PaxInfo[];
    shoppingCriteria: {
      tripType: 'Oneway' | 'Return' | 'Circle';
      travelPreferences: TravelPreferences;
      returnUPSellInfo: boolean;
      preferCombine?: boolean;
    };
  };
}

export interface FlightSearchResponse {
  message: string;
  requestedOn: string;
  respondedOn: string;
  response: {
    offersGroup: {
      offer: {
        offerId: string;
        validatingCarrier: string;
        refundable: boolean;
        fareType: string;
        paxSegmentList: { paxSegment: PaxSegment }[];
        fareDetailList: { fareDetail: FareDetail }[];
        price: PricingInfo;
        baggageAllowanceList: { baggageAllowance: BaggageAllowance }[];
        upSellBrandList: { upSellBrand: UpSellBrand }[];
        seatsRemaining: string;
        source?: string;
        traceId?: string;
      };
    }[];
  };
  status?: string;
}

export interface GetMoreOffersRequest {
  pointOfSale: string;
  source: string;
  request: {
    traceId: string;
    airline: string;
  };
}

export interface GetMoreOffersResponse {
  message: string;
  requestedOn: string;
  respondedOn: string;
  response: {
    traceId: string;
    offersGroup: {
      offer: {
        offerId: string;
        validatingCarrier: string;
        refundable: boolean;
        fareType: string;
        paxSegmentList: { paxSegment: PaxSegment }[];
        fareDetailList: { fareDetail: FareDetail }[];
        price: PricingInfo;
        baggageAllowanceList: { baggageAllowance: BaggageAllowance }[];
        upSellBrandList: { upSellBrand: UpSellBrand }[];
        seatsRemaining: string;
      };
    }[];
  };
}

// Fare Rules Types
export interface FareRulesRequest {
  pointOfSale: string;
  source: string;
  request: {
    offerID: string;
    offerItemID: string[];
  };
}

// Balance Types
export interface BalanceResponse {
  response: {
    balance: number;
    currency: string;
  };
  message?: string;
}

export interface OrderReshopPriceResponse {
  response: {
    orderItem: {
      price: {
        totalPayable: {
          total: number;
        };
      };
    }[];
  };
}

// Mini Rule Types
export interface MiniRuleRequest {
  pointOfSale: string;
  source: string;
  request: {
    offerID: string;
    offerItemID: string[];
  };
}

// Offer Price Types
export interface OfferPriceRequest {
  pointOfSale: string;
  source: string;
  request: {
    offerID: string;
    offerItemID: string[];
    pax: PaxInfo[];
  };
}

// Order Types
interface OrderRequest {
  pointOfSale: string;
  source: string;
  request: {
    orderID: string;
  };
}

export interface OrderCreateRequest {
  pointOfSale: string;
  source: string;
  request: {
    offerID: string;
    offerItemID: string[];
    pax: Array<PaxInfo & {
      nameTitle: string;
      given: string;
      surname: string;
      birthDate?: string;
      contactInfo?: {
        email?: string;
        phone?: string;
      };
    }>;
  };
}

export interface OrderReshopPriceRequest extends OrderRequest {
  request: OrderRequest['request'] & {
    offerID: string;
    offerItemID: string[];
  };
}

export type OrderCancelRequest = OrderRequest;
export type OrderChangeRequest = OrderRequest;
export type OrderRetrieveRequest = OrderRequest;

export interface OrderSellRequest extends OrderRequest {
  request: OrderRequest['request'] & {
    paymentInfo: {
      amount: number;
      currency: string;
      method: string;
      reference?: string;
    };
  };
}

// Get the base URL based on environment
const getBaseUrl = () => {
  // If NEXT_PUBLIC_API_URL is set, use it directly
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Otherwise, use environment-specific defaults
  if (process.env.NODE_ENV === 'development') {
    // In development, use the proxy endpoint
    return '/api/proxy';
  }
  
  // In production, use the proxy endpoint
  return '/api/proxy';
};

const API_BASE_URL = getBaseUrl();

// Generic API call function
async function apiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST',
  data?: any,
  token?: string
): Promise<T> {
  try {
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      // Only include credentials when using the proxy
      credentials: API_BASE_URL.startsWith('/api') ? 'same-origin' : 'omit',
    };

    if (token && config.headers) {
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      config.body = JSON.stringify(data);
    }

    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`${method} Request to ${url}:`, { data, token: !!token });
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error Response:`, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API Call Error:`, error);
    throw error;
  }
}

// API Functions
export const searchFlights = (params: FlightSearchRequest) => 
  apiCall<FlightSearchResponse>(ENDPOINTS.AIR_SHOPPING, 'POST', params);

export const getMoreOffers = (params: GetMoreOffersRequest) => 
  apiCall<GetMoreOffersResponse>(ENDPOINTS.AIR_SHOPPING_GET_MORE_OFFERS, 'POST', params);

export const getFareRules = (params: FareRulesRequest) => 
  apiCall(ENDPOINTS.FARE_RULES, 'POST', params);

export const getBalance = (token: string) => 
  apiCall<BalanceResponse>(ENDPOINTS.GET_BALANCE, 'GET', undefined, token);

export const getMiniRule = (params: MiniRuleRequest) => 
  apiCall(ENDPOINTS.MINI_RULE, 'POST', params);

export const getOfferPrice = (params: OfferPriceRequest) => 
  apiCall(ENDPOINTS.OFFER_PRICE, 'POST', params);

export const cancelOrder = (params: OrderCancelRequest) => 
  apiCall(ENDPOINTS.ORDER_CANCEL, 'POST', params);

export const changeOrder = (params: OrderChangeRequest) => 
  apiCall(ENDPOINTS.ORDER_CHANGE, 'POST', params);

export const createOrder = (params: OrderCreateRequest) => 
  apiCall(ENDPOINTS.ORDER_CREATE, 'POST', params);

export const getReshopPrice = (params: OrderReshopPriceRequest) => 
  apiCall(ENDPOINTS.ORDER_RESHOP_PRICE, 'POST', params);

export const retrieveOrder = (params: OrderRetrieveRequest) => 
  apiCall(ENDPOINTS.ORDER_RETRIEVE, 'POST', params);

export const sellOrder = (params: OrderSellRequest) => 
  apiCall(ENDPOINTS.ORDER_SELL, 'POST', params);

export const reshopPrice = (orderReference: string) =>
  apiCall<OrderReshopPriceResponse>(ENDPOINTS.ORDER_RESHOP_PRICE, 'POST', { orderReference });

export const confirmOrderChange = (
  orderReference: string,
  issueTicketViaPartialPayment?: boolean
) => {
  const payload = {
    orderReference,
    issueTicketViaPartialPayment: typeof issueTicketViaPartialPayment === 'boolean' ? issueTicketViaPartialPayment : false,
  };
  return apiCall(ENDPOINTS.ORDER_CHANGE, 'POST', payload);
};

// Helper functions
export function generatePassengerIds(adults: number, children: number, infants: number): PaxInfo[] {
  const passengers = [];
  let paxId = 1;

  // Add adults
  for (let i = 0; i < adults; i++) {
    passengers.push({ paxID: `PAX${paxId++}`, ptc: 'ADT' });
  }

  // Add children
  for (let i = 0; i < children; i++) {
    passengers.push({ paxID: `PAX${paxId++}`, ptc: 'CHD' });
  }

  // Add infants
  for (let i = 0; i < infants; i++) {
    passengers.push({ paxID: `PAX${paxId++}`, ptc: 'INF' });
  }

  return passengers;
}

export function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function getAirports(query: string): Promise<Airport[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/airports/?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching airports:', error);
    throw error;
  }
}

export async function fetchOfferPrice(traceId: any, offerId: any, token: any) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/OfferPrice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ traceId, offerId }),
  });
  if (!res.ok) throw new Error("Failed to fetch offer price");
  return res.json();
}