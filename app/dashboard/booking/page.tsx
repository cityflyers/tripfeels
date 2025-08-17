"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getFirestore, collection, getDocs, query, doc, updateDoc } from "firebase/firestore"
import { app } from "@/lib/firebase"
import { Ticket, Accessibility, RefreshCw } from 'lucide-react';

const db = getFirestore(app)

interface OrderListItem {
  referenceNo: string
  pnr: string
  source: string
  route: string
  paxDetails: string
  customerPay: string
  agentPay: string
  createdBy: string
  flyDate?: string
  confirmedOn: string
  status: string
  docId: string
  fullName: string
}

// Helper function to format date to 'D Mon YY HH:MM:SS' format
function formatCreatedDate(date: Date): string {
  const days = date.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const year = date.getFullYear().toString().slice(-2);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${days} ${month} ${year} ${hours}:${minutes}:${seconds}`;
}

function mapOrderStatusToTabStatus(orderStatus: string): string {
  switch (orderStatus.toLowerCase()) {
    case "onhold":
      return "on-hold"
    case "unconfirmed":
      return "unresolved"
    case "inprogress":
      return "ongoing"
    case "pending":
      return "queue"
    case "expired":
      return "expired"
    case "cancelled":
      return "cancelled"
    case "confirmed":
      return "confirmed"
    default:
      return "unknown"
  }
}

function mapTabStatusToOrderStatus(tabStatus: string): string | null {
  switch (tabStatus.replace(/-/g, " ").toLowerCase()) {
    case "on hold":
      return "OnHold"
    case "unresolved":
      return "UnConfirmed"
    case "ongoing":
      return "inProgress"
    case "queue":
      return "pending"
    case "expired":
      return "expired"
    case "cancelled":
      return "cancelled"
    case "confirmed":
      return "confirmed"
    default:
      return null
  }
}

function StatusTabs({
  currentStatus,
  onSelectStatus,
}: { currentStatus: string; onSelectStatus: (status: string) => void }) {
  const statuses = [
    "all",
    "on-hold",
    "confirmed",
    "ongoing",
    "queue",
    "expired",
    "cancelled",
    "refund",
    "ancillary",
    "unresolved",
  ]
  return (
    <div className="flex space-x-2 overflow-x-auto pb-2">
      {statuses.map((status) => (
        <Button
          key={status}
          variant={currentStatus === status ? "secondary" : "ghost"}
          size="sm"
          className="capitalize shrink-0"
          onClick={() => onSelectStatus(status)}
        >
          {status.replace(/-/g, " ")}
        </Button>
      ))}
    </div>
  )
}

export default function BookingPage() {
  console.log("BookingPage component rendered")
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ordersList, setOrdersList] = useState<OrderListItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeParentTab, setActiveParentTab] = useState("ticket")

  const currentStatus = searchParams.get("status") || "all"

  useEffect(() => {
    const fetchOrders = async () => {
      console.log("fetchOrders called, currentStatus:", currentStatus, "user:", user)
      setLoading(true)
      setError(null)
      setOrdersList([])

      if (!user?.token) {
        setLoading(false)
        return
      }

      try {
        const ordersCollectionRef = collection(db, "Orders")
        const q = query(ordersCollectionRef)
        const querySnapshot = await getDocs(q)
        const fetchedOrders: OrderListItem[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          console.log("Document data:", data);
          fetchedOrders.push({
            referenceNo: data.reference || "N/A",
            pnr: data.airlinePNR || "N/A",
            source: data.airline || "N/A",
            route: `${data.route?.from || "N/A"}-${data.route?.to || "N/A"}`,
            paxDetails: `${data.paxDetails?.adult || 0} Adult(s), ${data.paxDetails?.child || 0} Child(ren), ${data.paxDetails?.infant || 0} Infant(s)`,
            customerPay: data.amount?.toString() || "N/A",
            agentPay: data.agentPay?.toString() || "N/A",
            createdBy: data.createdBy || "N/A",
            flyDate: data.flyDate ? new Date(data.flyDate.toDate()).toLocaleDateString() : "N/A",
            confirmedOn: data.issued ? formatCreatedDate(new Date(data.issued.toDate())) : "N/A",
            status: data.status || "Unknown",
            docId: doc.id,
            fullName: `${data.name?.givenName || ""} ${data.name?.surname || ""}`.trim() || "N/A",
          })
        })

        // Filter by user role: Support & Super Admin see all, others see only their bookings
        const isSupportOrSuperAdmin = user?.role === "SUPPORT_ADMIN" || user?.role === "SUPER_ADMIN";
        const filteredByRole = isSupportOrSuperAdmin
          ? fetchedOrders
          : fetchedOrders.filter(order => order.createdBy === user?.email);

        const filteredBySearch = filteredByRole.filter((order) => {
          const lowerCaseSearchTerm = searchTerm.toLowerCase()
          const tabStatus = mapOrderStatusToTabStatus(order.status)
          const matchesTab = currentStatus === "all" || tabStatus === currentStatus
          const matchesSearch =
            searchTerm === "" ||
            order.referenceNo.toLowerCase().includes(lowerCaseSearchTerm) ||
            order.pnr.toLowerCase().includes(lowerCaseSearchTerm) ||
            order.paxDetails.toLowerCase().includes(lowerCaseSearchTerm) ||
            order.route.toLowerCase().includes(lowerCaseSearchTerm) ||
            order.source.toLowerCase().includes(lowerCaseSearchTerm) ||
            order.createdBy.toLowerCase().includes(lowerCaseSearchTerm)
          return matchesTab && matchesSearch
        })

        // Sort by confirmedOn date/time descending (most recent first)
        filteredBySearch.sort((a, b) => {
          // Parse date strings to Date objects
          const dateA = new Date(a.confirmedOn.replace(/(\d{1,2}) (\w{3}) (\d{2}) (\d{2}):(\d{2}):(\d{2})/, (match, d, m, y, h, min, s) => `${m} ${d}, 20${y} ${h}:${min}:${s}`));
          const dateB = new Date(b.confirmedOn.replace(/(\d{1,2}) (\w{3}) (\d{2}) (\d{2}):(\d{2}):(\d{2})/, (match, d, m, y, h, min, s) => `${m} ${d}, 20${y} ${h}:${min}:${s}`));
          return dateB.getTime() - dateA.getTime();
        });

        console.log("Filtered orders for tab", currentStatus, ":", filteredBySearch)

        setOrdersList(filteredBySearch)
      } catch (err: any) {
        console.error("Error fetching orders:", err)
        setError(err.message || "Failed to fetch orders from Firestore")
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [currentStatus, searchTerm]) // Removed user?.token from dependency array

  const filteredOrders = ordersList

  const handleSelectStatus = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status === "all") {
      params.delete("status")
    } else {
      params.set("status", status)
    }
    router.push(`/dashboard/booking?${params.toString()}`)
  }

  const handleRowClick = (orderReference: string) => {
    router.push(`/orderretrieve?orderReference=${orderReference}`)
  }

  const orderReferenceFromUrl = searchParams.get("orderReference")
  const [singleOrderData, setSingleOrderData] = useState<OrderListItem | null>(null)
  const [singleOrderLoading, setSingleOrderLoading] = useState(false)
  const [singleOrderError, setSingleOrderError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSingleOrderDetails() {
      if (!orderReferenceFromUrl || !user?.token) {
        setSingleOrderLoading(false)
        setSingleOrderData(null)
        if (!orderReferenceFromUrl && singleOrderData) {
          setSingleOrderData(null)
        }
        return
      }
      setSingleOrderLoading(true)
      setSingleOrderError(null)
      setSingleOrderData(null)
      try {
        const docRef = collection(db, "Orders")
        const querySnapshot = await getDocs(docRef)
        let found: OrderListItem | null = null
        for (const docSnap of querySnapshot.docs) {
          if (docSnap.id === orderReferenceFromUrl) {
            const data = docSnap.data()
            found = {
              referenceNo: data.reference || "N/A",
              pnr: data.airlinePNR || "N/A",
              source: data.airline || "N/A",
              route: `${data.route?.from || "N/A"}-${data.route?.to || "N/A"}`,
              paxDetails: `${data.paxDetails?.adult || 0} Adult(s), ${data.paxDetails?.child || 0} Child(ren), ${data.paxDetails?.infant || 0} Infant(s)`,
              customerPay: data.amount?.toString() || "N/A",
              agentPay: data.agentPay?.toString() || "N/A",
              createdBy: data.createdBy || "N/A",
              flyDate: data.flyDate ? new Date(data.flyDate.toDate()).toLocaleDateString() : "N/A",
              confirmedOn: data.issued ? formatCreatedDate(new Date(data.issued.toDate())) : "N/A",
              status: data.status || "Unknown",
              docId: docSnap.id,
              fullName: `${data.name?.givenName || ""} ${data.name?.surname || ""}`.trim() || "N/A",
            }
            break;
          }
        }
        if (found) {
          setSingleOrderData(found)
          // Check and update Firestore if status has changed
          const orderDocRef = doc(db, "Orders", found.docId)
          const querySnapshot2 = await getDocs(collection(db, "Orders"))
          let firestoreStatus: string | null = null
          for (const docSnap of querySnapshot2.docs) {
            if (docSnap.id === found.docId) {
              firestoreStatus = docSnap.data().status
              break;
            }
          }
          if (firestoreStatus !== found.status) {
            await updateDoc(orderDocRef, { status: found.status })
          }
        } else {
          setSingleOrderError("No order found with this reference.")
        }
      } catch (err: any) {
        console.error("Error retrieving single order details:", err)
        setSingleOrderError(err.message || "Failed to retrieve single order details from Firestore")
      } finally {
        setSingleOrderLoading(false)
      }
    }
    fetchSingleOrderDetails()
  }, [orderReferenceFromUrl]) // Removed user?.token from dependency array

  if (orderReferenceFromUrl) {
    if (singleOrderLoading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      )
    }
    if (singleOrderError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-6 max-w-md text-center">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{singleOrderError}</p>
            <Button onClick={() => router.push("/dashboard/booking")}>Back to List</Button>
          </Card>
        </div>
      )
    }
    if (!singleOrderData) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-6 max-w-md text-center">
            <h2 className="text-xl font-semibold mb-2">No Order Found</h2>
            <p className="text-muted-foreground mb-4">Could not retrieve order details for the provided reference.</p>
            <Button onClick={() => router.push("/dashboard/booking")}>Back to List</Button>
          </Card>
        </div>
      )
    }
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Order Details: {singleOrderData.pnr}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b">
              <div>
                <strong>Order Reference:</strong> {singleOrderData.referenceNo || "N/A"}
              </div>
              <div>
                <strong>PNR:</strong> {singleOrderData.pnr || "N/A"}
              </div>
              <div>
                <strong>Passenger Name:</strong> {singleOrderData.fullName || "N/A"}
              </div>
              <div>
                <strong>Created On:</strong> {singleOrderData.confirmedOn}
              </div>
              <div>
                <strong>Fly Date:</strong> {singleOrderData.flyDate}
              </div>
              <div>
                <strong>Status:</strong> {mapOrderStatusToTabStatus(singleOrderData.status) || "N/A"}
              </div>
            </div>
            <div className="mb-6 pb-6 border-b">
              <h3 className="text-xl font-semibold mb-4">Flight Itinerary</h3>
              <div className="flex items-center gap-4">
                <div className="font-bold text-lg">{(singleOrderData.route || "N/A").split("-")[0] || "N/A"}</div>
                <span className="text-gray-500">&#8594;</span>
                <div className="font-bold text-lg">{(singleOrderData.route || "N/A").split("-")[1] || "N/A"}</div>
                <span className="ml-2 text-sm text-gray-600">{singleOrderData.source || "N/A"}</span>
              </div>
            </div>
            <div className="mb-6 pb-6 border-b">
              <h3 className="text-xl font-semibold mb-4">Passenger Details</h3>
              <div className="text-sm text-gray-700">
                <div>
                  <strong>Passenger Count & Details:</strong> {singleOrderData.paxDetails || "N/A"}
                </div>
              </div>
            </div>
            <div className="mb-6 pb-6 border-b">
              <h3 className="text-xl font-semibold mb-4">Fare Summary</h3>
              <div className="text-lg font-bold">Total Amount: BDT {singleOrderData.customerPay}</div>
            </div>
            <div className="mb-6 pb-6 border-b">
              <h3 className="text-xl font-semibold mb-4">Other Details</h3>
              <div className="text-sm text-gray-700">
                <div>
                  <strong>Created By:</strong> {singleOrderData.createdBy || "N/A"}
                </div>
              </div>
            </div>
            <div className="mt-8">
              <Button onClick={() => router.push("/dashboard/booking")}>Back to List</Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Main Tabs - Ticket, Refund, Ancillary */}
      <div className="border-b border-border h-14 bg-background/95">
        <div className="flex">
          <button
            onClick={() => setActiveParentTab("ticket")}
            className={`flex-grow py-4 text-xs font-semibold border-b-2 transition-colors ${activeParentTab === "ticket" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <span className="flex items-center justify-center gap-2"><Ticket className="h-5 w-5" /> Ticket</span>
          </button>
          <button
            onClick={() => setActiveParentTab("refund")}
            className={`flex-grow py-4 text-xs font-semibold border-b-2 transition-colors ${activeParentTab === "refund" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <span className="flex items-center justify-center gap-2"><RefreshCw className="h-5 w-5" /> Refund</span>
          </button>
          <button
            onClick={() => setActiveParentTab("ancillary")}
            className={`flex-grow py-4 text-xs font-semibold border-b-2 transition-colors ${activeParentTab === "ancillary" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <span className="flex items-center justify-center gap-2"><Accessibility className="h-5 w-5" /> Ancillary</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col">
        {activeParentTab === "ticket" && (
          <>
            {/* Status Tabs */}
            <div className="border-b border-border h-14 bg-background/95">
              <div className="flex gap-x-2">
                {["all", "on-hold", "confirmed", "ongoing", "queue", "expired", "cancelled", "unresolved"].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => handleSelectStatus(status)}
                      className={`flex-grow py-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                        currentStatus === status
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="flex items-center justify-center">
                        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
                      </span>
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="border-b border-border bg-background/95">
            <div className="flex items-center justify-end gap-2 px-6 py-2">
              <Input
                placeholder="Search by reference or passenger"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-basis-0 flex-grow"
              />
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" /> Advanced Filter
              </Button>
            </div>
          </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto px-6 bg-background/95">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading orders...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center text-destructive">
                    <p>Error loading orders: {error}</p>
                  </div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">No orders found with the selected criteria.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted dark:bg-secondary/80">
                      <TableHead className="font-semibold">Created</TableHead>
                      <TableHead className="font-semibold">Reference</TableHead>
                      <TableHead className="font-semibold">PNR</TableHead>
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Pax Details</TableHead>
                      <TableHead className="font-semibold">Route</TableHead>
                      <TableHead className="font-semibold">Airline</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold">Created by</TableHead>
                      <TableHead className="font-semibold">Issued</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-background/95">
                    {filteredOrders.map((order) => (
                      <TableRow
                        key={order.docId}
                        onClick={() => handleRowClick(order.referenceNo)}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell>{order.confirmedOn}</TableCell>
                        <TableCell className="font-medium">{order.referenceNo}</TableCell>
                        <TableCell>{order.pnr}</TableCell>
                        <TableCell>{order.fullName}</TableCell>
                        <TableCell>{order.paxDetails}</TableCell>
                        <TableCell>{order.route}</TableCell>
                        <TableCell>{order.source}</TableCell>
                        <TableCell>{order.customerPay}</TableCell>
                        <TableCell>{order.createdBy}</TableCell>
                        <TableCell>{order.flyDate || ""}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {mapOrderStatusToTabStatus(order.status)
                              .replace(/-/g, " ")
                              .replace(/\b[a-z]/g, (letter) => letter.toUpperCase())}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </>
        )}

        {activeParentTab === "refund" && (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Refund content coming soon...</p>
          </div>
        )}

        {activeParentTab === "ancillary" && (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Ancillary content coming soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}
