import * as Tabs from '@radix-ui/react-tabs';
import PlaneIcon from '@geist-ui/icons/send';
import BuildingIcon from '@geist-ui/icons/grid';
import CalendarIcon from '@geist-ui/icons/calendar';
import FileIcon from '@geist-ui/icons/file';
import CarIcon from '@geist-ui/icons/truck';
import ActivityIcon from '@geist-ui/icons/activity';
import ShieldIcon from '@geist-ui/icons/shield';
import FlightSearchForm from '@/components/dashboard/flight/FlightSearchForm';

export default function ServiceTabs() {
  return (
    <Tabs.Root defaultValue="flight" className="w-full">
      <Tabs.List className="flex border-b bg-background h-14">
        <Tabs.Trigger
          value="flight"
          className="flex-1 flex flex-col items-center justify-center h-14 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-foreground transition-colors focus:outline-none"
        >
          <PlaneIcon size={20} className="mb-1" />
          <span className="hidden sm:inline text-sm">Flight</span>
        </Tabs.Trigger>
        <Tabs.Trigger
          value="hotel"
          className="flex-1 flex flex-col items-center justify-center h-14 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-foreground transition-colors focus:outline-none"
        >
          <BuildingIcon size={20} className="mb-1" />
          <span className="hidden sm:inline text-sm">Hotel</span>
        </Tabs.Trigger>
        <Tabs.Trigger
          value="holidays"
          className="flex-1 flex flex-col items-center justify-center h-14 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-foreground transition-colors focus:outline-none"
        >
          <CalendarIcon size={20} className="mb-1" />
          <span className="hidden sm:inline text-sm">Holidays</span>
        </Tabs.Trigger>
        <Tabs.Trigger
          value="visa"
          className="flex-1 flex flex-col items-center justify-center h-14 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-foreground transition-colors focus:outline-none"
        >
          <FileIcon size={20} className="mb-1" />
          <span className="hidden sm:inline text-sm">Visa</span>
        </Tabs.Trigger>
        <Tabs.Trigger
          value="cars"
          className="flex-1 flex flex-col items-center justify-center h-14 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-foreground transition-colors focus:outline-none"
        >
          <CarIcon size={20} className="mb-1" />
          <span className="hidden sm:inline text-sm">Cars</span>
        </Tabs.Trigger>
        <Tabs.Trigger
          value="events"
          className="flex-1 flex flex-col items-center justify-center h-14 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-foreground transition-colors focus:outline-none"
        >
          <ActivityIcon size={20} className="mb-1" />
          <span className="hidden sm:inline text-sm">Events</span>
        </Tabs.Trigger>
        <Tabs.Trigger
          value="insurance"
          className="flex-1 flex flex-col items-center justify-center h-14 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-foreground transition-colors focus:outline-none"
        >
          <ShieldIcon size={20} className="mb-1" />
          <span className="hidden sm:inline text-sm">Insurance</span>
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="flight" className="text-foreground">{/* FlightSearchForm removed to prevent duplicate */}</Tabs.Content>
      <Tabs.Content value="hotel" className="p-4 text-foreground">Coming soon</Tabs.Content>
      <Tabs.Content value="holidays" className="p-4 text-foreground">Coming soon</Tabs.Content>
      <Tabs.Content value="visa" className="p-4 text-foreground">Coming soon</Tabs.Content>
      <Tabs.Content value="cars" className="p-4 text-foreground">Coming soon</Tabs.Content>
      <Tabs.Content value="events" className="p-4 text-foreground">Coming soon</Tabs.Content>
      <Tabs.Content value="insurance" className="p-4 text-foreground">Coming soon</Tabs.Content>
    </Tabs.Root>
  );
} 