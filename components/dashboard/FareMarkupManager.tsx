import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

interface MarkupEntry {
  id: string;
  airlineCode: string;
  role: string;
  fromAirport?: string;
  toAirport?: string;
  markup: number;
}

const ROLES = ["USER", "AGENT"];

export default function FareMarkupManager() {
  const [entries, setEntries] = useState<MarkupEntry[]>([]);
  const [form, setForm] = useState({
    airlineCode: '',
    role: ROLES[0],
    fromAirport: '',
    toAirport: '',
    markup: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [airlineFilter, setAirlineFilter] = useState<string | null>(null);
  const [showAirlineDropdown, setShowAirlineDropdown] = useState(false);
  const airlineDropdownRef = useRef<HTMLDivElement>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const [fromFilter, setFromFilter] = useState<string | null>(null);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const fromDropdownRef = useRef<HTMLDivElement>(null);
  const [toFilter, setToFilter] = useState<string | null>(null);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const toDropdownRef = useRef<HTMLDivElement>(null);
  const [markupFilter, setMarkupFilter] = useState<number | null>(null);
  const [showMarkupDropdown, setShowMarkupDropdown] = useState(false);
  const markupDropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique airline codes
  const uniqueAirlines = Array.from(new Set(entries.map(e => e.airlineCode)));

  // Get unique roles
  const uniqueRoles = Array.from(new Set(entries.map(e => e.role)));

  // Get unique fromAirport values (non-empty)
  const uniqueFromAirports = Array.from(new Set(entries.map(e => e.fromAirport).filter((v): v is string => !!v)));

  // Get unique toAirport values (non-empty)
  const uniqueToAirports = Array.from(new Set(entries.map(e => e.toAirport).filter((v): v is string => !!v)));

  // Get unique markup values
  const uniqueMarkups = Array.from(new Set(entries.map(e => e.markup))).sort((a, b) => a - b);

  // Filter entries by all active filters and search
  const filteredEntries = entries.filter(e =>
    (airlineFilter ? e.airlineCode === airlineFilter : true) &&
    (roleFilter ? e.role === roleFilter : true) &&
    (fromFilter ? (e.fromAirport || '') === fromFilter : true) &&
    (toFilter ? (e.toAirport || '') === toFilter : true) &&
    (markupFilter !== null ? e.markup === markupFilter : true) &&
    (
      searchQuery.trim() === '' ||
      [e.airlineCode, e.role, e.fromAirport, e.toAirport, String(e.markup)]
        .some(field => (field || '').toLowerCase().includes(searchQuery.trim().toLowerCase()))
    )
  );

  // Close dropdown on click outside
  useEffect(() => {
    if (!showAirlineDropdown) return;
    function handleClick(e: MouseEvent) {
      if (
        airlineDropdownRef.current &&
        !airlineDropdownRef.current.contains(e.target as Node)
      ) {
        setShowAirlineDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showAirlineDropdown]);

  // Close Role dropdown on click outside
  useEffect(() => {
    if (!showRoleDropdown) return;
    function handleClick(e: MouseEvent) {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(e.target as Node)
      ) {
        setShowRoleDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showRoleDropdown]);

  // Close From dropdown on click outside
  useEffect(() => {
    if (!showFromDropdown) return;
    function handleClick(e: MouseEvent) {
      if (
        fromDropdownRef.current &&
        !fromDropdownRef.current.contains(e.target as Node)
      ) {
        setShowFromDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showFromDropdown]);

  // Close To dropdown on click outside
  useEffect(() => {
    if (!showToDropdown) return;
    function handleClick(e: MouseEvent) {
      if (
        toDropdownRef.current &&
        !toDropdownRef.current.contains(e.target as Node)
      ) {
        setShowToDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showToDropdown]);

  // Close Markup dropdown on click outside
  useEffect(() => {
    if (!showMarkupDropdown) return;
    function handleClick(e: MouseEvent) {
      if (
        markupDropdownRef.current &&
        !markupDropdownRef.current.contains(e.target as Node)
      ) {
        setShowMarkupDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMarkupDropdown]);

  // Placeholder sort handler
  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
    // Sorting logic to be implemented
  };

  // Fetch markups from Firestore on mount
  useEffect(() => {
    const fetchMarkups = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'markups'));
        const data: MarkupEntry[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as MarkupEntry[];
        setEntries(data);
      } catch (err) {
        alert('Failed to load markups from Firestore.');
      } finally {
        setLoading(false);
      }
    };
    fetchMarkups();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === 'airlineCode' || name === 'fromAirport' || name === 'toAirport' ? value.toUpperCase() : value,
    });
  };

  const handleAddOrUpdate = async () => {
    if (!/^\w{2}$/.test(form.airlineCode)) {
      alert('Airline code must be 2 letters');
      return;
    }
    if (form.fromAirport && !/^\w{3}$/.test(form.fromAirport)) {
      alert('From Airport must be 3 letters or blank');
      return;
    }
    if (form.toAirport && !/^\w{3}$/.test(form.toAirport)) {
      alert('To Airport must be 3 letters or blank');
      return;
    }
    const markupNum = parseFloat(form.markup);
    if (isNaN(markupNum)) {
      alert('Markup must be a number');
      return;
    }

    // Log the form data
    console.log('Adding markup with data:', {
      airlineCode: form.airlineCode,
      role: form.role,
      fromAirport: form.fromAirport || '',
      toAirport: form.toAirport || '',
      markup: markupNum,
    });

    try {
      if (editingId) {
        // Update in Firestore
        await updateDoc(doc(db, 'markups', editingId), {
          airlineCode: form.airlineCode,
          role: form.role,
          fromAirport: form.fromAirport || '',
          toAirport: form.toAirport || '',
          markup: markupNum,
        });
        setEntries(entries.map(entry => entry.id === editingId ? {
          ...entry,
          airlineCode: form.airlineCode,
          role: form.role,
          fromAirport: form.fromAirport || '',
          toAirport: form.toAirport || '',
          markup: markupNum,
        } : entry));
        setEditingId(null);
      } else {
        // Check if entry exists for this airlineCode + role + fromAirport + toAirport
        const existing = entries.find(e =>
          e.airlineCode === form.airlineCode &&
          e.role === form.role &&
          (e.fromAirport || '') === (form.fromAirport || '') &&
          (e.toAirport || '') === (form.toAirport || '')
        );
        if (existing) {
          alert('Markup for this airline, role, and route already exists. Please edit it instead.');
          return;
        }
        // Add to Firestore
        const docRef = await addDoc(collection(db, 'markups'), {
          airlineCode: form.airlineCode,
          role: form.role,
          fromAirport: form.fromAirport || '',
          toAirport: form.toAirport || '',
          markup: markupNum,
        });
        console.log('Successfully added markup, docRef:', docRef);
        setEntries([
          ...entries,
          {
            id: docRef.id,
            airlineCode: form.airlineCode,
            role: form.role,
            fromAirport: form.fromAirport || '',
            toAirport: form.toAirport || '',
            markup: markupNum,
          },
        ]);
      }
      setForm({ airlineCode: '', role: ROLES[0], fromAirport: '', toAirport: '', markup: '' });
    } catch (err) {
      console.error('Failed to save markup to Firestore:', err);
      alert('Failed to save markup to Firestore. Error: ' + ((err as any)?.message || err));
    }
  };

  const handleEdit = (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (entry) {
      setForm({
        airlineCode: entry.airlineCode,
        role: entry.role,
        fromAirport: entry.fromAirport || '',
        toAirport: entry.toAirport || '',
        markup: entry.markup.toString(),
      });
      setEditingId(id);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'markups', id));
      setEntries(entries.filter(e => e.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setForm({ airlineCode: '', role: ROLES[0], fromAirport: '', toAirport: '', markup: '' });
      }
    } catch (err) {
      alert('Failed to delete markup from Firestore.');
    }
  };

  return (
    <div className="w-full py-8 px-2 sm:px-4 space-y-8">
      {/* Form Card */}
      <div className="bg-background rounded-lg shadow p-4 sm:p-6 border border-border">
        <form
          className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end"
          onSubmit={e => { e.preventDefault(); handleAddOrUpdate(); }}
        >
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="airlineCode">Airline Code</label>
            <Input
              id="airlineCode"
              name="airlineCode"
              placeholder="e.g. EK"
              value={form.airlineCode}
              maxLength={2}
              onChange={handleChange}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border border-input bg-background px-3 py-2 text-sm rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="fromAirport">From Airport</label>
            <Input
              id="fromAirport"
              name="fromAirport"
              placeholder="e.g. DAC"
              value={form.fromAirport}
              maxLength={3}
              onChange={handleChange}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="toAirport">To Airport</label>
            <Input
              id="toAirport"
              name="toAirport"
              placeholder="e.g. DXB"
              value={form.toAirport}
              maxLength={3}
              onChange={handleChange}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="markup">Markup (%)</label>
            <Input
              id="markup"
              name="markup"
              placeholder="e.g. 5"
              value={form.markup}
              type="number"
              step="0.01"
              onChange={handleChange}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="w-full">
              {editingId ? 'Update' : 'Add New Markup'}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={() => {
                setEditingId(null);
                setForm({ airlineCode: '', role: ROLES[0], fromAirport: '', toAirport: '', markup: '' });
              }} className="w-full">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
      {/* Sort bar and table wrapped in a single card */}
      <div className="bg-background rounded-lg shadow border border-border overflow-x-auto">
        <div className="flex flex-col">
          <div className="flex w-full flex-row flex-wrap items-center">
          {/* Airline sort with dropdown */}
          <div className="flex-1 min-w-[120px] relative" ref={airlineDropdownRef}>
            <button
              type="button"
              className={`w-full px-2 py-2 ${'rounded-l-md'} text-sm font-medium border border-input border-r-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center gap-2 ${sortColumn === 'airlineCode' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}
              onClick={() => setShowAirlineDropdown(v => !v)}
            >
              <span>Airline</span>
              <span className="ml-1">
                {showAirlineDropdown ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 15l-7-7-7 7" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                )}
              </span>
            </button>
            {showAirlineDropdown && (
              <div className="absolute left-0 mt-2 w-full z-20 bg-background border rounded shadow">
                <div
                  className={`px-4 py-2 cursor-pointer hover:bg-accent ${airlineFilter === null ? 'font-bold' : ''}`}
                  onClick={() => { setAirlineFilter(null); setShowAirlineDropdown(false); }}
                >
                  All
                </div>
                {uniqueAirlines.map(code => (
                  <div
                    key={code}
                    className={`px-4 py-2 cursor-pointer hover:bg-accent ${airlineFilter === code ? 'font-bold' : ''}`}
                    onClick={() => { setAirlineFilter(code); setShowAirlineDropdown(false); }}
                  >
                    {code}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Role sort with dropdown */}
          <div className="flex-1 min-w-[120px] relative" ref={roleDropdownRef}>
            <button
              type="button"
              className={`w-full px-2 py-2 text-sm font-medium border border-input border-r-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center gap-2 ${sortColumn === 'role' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}
              onClick={() => setShowRoleDropdown(v => !v)}
            >
              <span>Role</span>
              <span className="ml-1">
                {showRoleDropdown ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 15l-7-7-7 7" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                )}
              </span>
            </button>
            {showRoleDropdown && (
              <div className="absolute left-0 mt-2 w-full z-20 bg-background border rounded shadow">
                <div
                  className={`px-4 py-2 cursor-pointer hover:bg-accent ${roleFilter === null ? 'font-bold' : ''}`}
                  onClick={() => { setRoleFilter(null); setShowRoleDropdown(false); }}
                >
                  All
                </div>
                {uniqueRoles.map(role => (
                  <div
                    key={role}
                    className={`px-4 py-2 cursor-pointer hover:bg-accent ${roleFilter === role ? 'font-bold' : ''}`}
                    onClick={() => { setRoleFilter(role); setShowRoleDropdown(false); }}
                  >
                    {role}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* From sort with dropdown */}
          <div className="flex-1 min-w-[120px] relative" ref={fromDropdownRef}>
            <button
              type="button"
              className={`w-full px-2 py-2 text-sm font-medium border border-input border-r-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center gap-2 ${sortColumn === 'fromAirport' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}
              onClick={() => setShowFromDropdown(v => !v)}
            >
              <span>From</span>
              <span className="ml-1">
                {showFromDropdown ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 15l-7-7-7 7" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                )}
              </span>
            </button>
            {showFromDropdown && (
              <div className="absolute left-0 mt-2 w-full z-20 bg-background border rounded shadow max-h-60 overflow-y-auto">
                <div
                  className={`px-4 py-2 cursor-pointer hover:bg-accent ${fromFilter === null ? 'font-bold' : ''}`}
                  onClick={() => { setFromFilter(null); setShowFromDropdown(false); }}
                >
                  All
                </div>
                {uniqueFromAirports.map(from => (
                  <div
                    key={from}
                    className={`px-4 py-2 cursor-pointer hover:bg-accent ${fromFilter === from ? 'font-bold' : ''}`}
                    onClick={() => { setFromFilter(from || ''); setShowFromDropdown(false); }}
                  >
                    {from}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* To sort with dropdown */}
          <div className="flex-1 min-w-[120px] relative" ref={toDropdownRef}>
            <button
              type="button"
              className={`w-full px-2 py-2 text-sm font-medium border border-input border-r-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center gap-2 ${sortColumn === 'toAirport' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}
              onClick={() => setShowToDropdown(v => !v)}
            >
              <span>To</span>
              <span className="ml-1">
                {showToDropdown ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 15l-7-7-7 7" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                )}
              </span>
            </button>
            {showToDropdown && (
              <div className="absolute left-0 mt-2 w-full z-20 bg-background border rounded shadow max-h-60 overflow-y-auto">
                <div
                  className={`px-4 py-2 cursor-pointer hover:bg-accent ${toFilter === null ? 'font-bold' : ''}`}
                  onClick={() => { setToFilter(null); setShowToDropdown(false); }}
                >
                  All
                </div>
                {uniqueToAirports.map(to => (
                  <div
                    key={to}
                    className={`px-4 py-2 cursor-pointer hover:bg-accent ${toFilter === to ? 'font-bold' : ''}`}
                    onClick={() => { setToFilter(to || ''); setShowToDropdown(false); }}
                  >
                    {to}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Markup sort with dropdown */}
          <div className="flex-1 min-w-[120px] relative" ref={markupDropdownRef}>
            <button
              type="button"
              className={`w-full px-2 py-2 text-sm font-medium border border-input ${'rounded-r-md'} transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center gap-2 ${sortColumn === 'markup' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}
              onClick={() => setShowMarkupDropdown(v => !v)}
            >
              <span>Markup (%)</span>
              <span className="ml-1">
                {showMarkupDropdown ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 15l-7-7-7 7" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                )}
              </span>
            </button>
            {showMarkupDropdown && (
              <div className="absolute left-0 mt-2 w-full z-20 bg-background border rounded shadow max-h-60 overflow-y-auto">
                <div
                  className={`px-4 py-2 cursor-pointer hover:bg-accent ${markupFilter === null ? 'font-bold' : ''}`}
                  onClick={() => { setMarkupFilter(null); setShowMarkupDropdown(false); }}
                >
                  All
                </div>
                {uniqueMarkups.map(markup => (
                  <div
                    key={markup}
                    className={`px-4 py-2 cursor-pointer hover:bg-accent ${markupFilter === markup ? 'font-bold' : ''}`}
                    onClick={() => { setMarkupFilter(markup); setShowMarkupDropdown(false); }}
                  >
                    {markup}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Search input */}
          <div className="flex-1 min-w-[140px] relative">
            <label htmlFor="search" className="sr-only">Search</label>
            <input
              id="search"
              name="search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-8 py-2 border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-none rounded-r-md"
            />
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4-4m0 0A7 7 0 104 4a7 7 0 0013 13z" /></svg>
            </span>
          </div>
        </div>
        </div>
        {/* Table */}
        <div className="pb-2 sm:pb-4">
          <Table className="min-w-[600px] w-full">
          <TableHeader>
              <TableRow className="bg-muted sticky top-0 z-10">
              <TableHead>Airline</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Markup (%)</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
              </TableRow>
              ) : filteredEntries.length === 0 ? (
              <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No markups added yet.</TableCell>
              </TableRow>
              ) : filteredEntries.map(entry => (
                <TableRow key={entry.id} className="hover:bg-accent/40 transition">
                <TableCell>{entry.airlineCode}</TableCell>
                <TableCell>{entry.role}</TableCell>
                <TableCell>{entry.fromAirport || '-'}</TableCell>
                <TableCell>{entry.toAirport || '-'}</TableCell>
                <TableCell>{entry.markup}</TableCell>
                <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(entry.id)} title="Edit">
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(entry.id)} title="Delete">
                        Delete
                      </Button>
                    </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
} 