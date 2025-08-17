"use client";
import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { UserRole } from '@/lib/types';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import 'react-phone-number-input/style.css';
import React from 'react';


const SPECIAL_ROLES: UserRole[] = [
  'AGENT',
  'TOUR_ORGANIZER_ADMIN',
  'VISA_ORGANIZER_ADMIN',
  'INSURRANCE_ORGANIZER_ADMIN',
  'CAR_ADMIN',
];

function DocumentUpload({
  userId,
  docType,
  value,
  onChange,
  label
}: {
  userId: string;
  docType: string;
  value: string;
  onChange: (url: string) => void;
  label: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const storage = getStorage(app);
      const storageRef = ref(storage, `users/${userId}/${docType}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on('state_changed',
        (snapshot) => {
          setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        },
        (err) => {
          setError(err.message);
          setUploading(false);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          onChange(url);
          setUploading(false);
        }
      );
    } catch (err: any) {
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <Input type="file" onChange={handleFile} />
      {uploading && <div className="text-xs text-muted-foreground mt-1">Uploading: {progress}%</div>}
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
      {value && (
        <div className="mt-2">
          {value.match(/\.(jpg|jpeg|png|gif)$/i) ? (
            <img src={value} alt={label} className="h-20 rounded border" />
          ) : (
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Document</a>
          )}
        </div>
      )}
    </div>
  );
}

const PhoneInputField = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => (
    <input
      ref={ref}
      {...props}
      className="w-full rounded border bg-background px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
    />
  )
);

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast ? useToast() : { toast: () => {} };
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    mobile: '',
    dob: '',
    address: '',
    post: '',
    city: '',
    country: 'Bangladesh',
    govtId: '',
    passport: '',
    drivingLicense: '',
    organizationName: '',
    civilAviationLicense: '',
    propitorOrPartner: 'PROPITOR',
    propitorName: '',
    partners: [{ name: '', position: '' }],
    tradeLicense: '',
    visitingCard: '',
  });
  const [selectedDocType, setSelectedDocType] = useState<'govtId' | 'passport' | 'drivingLicense'>('govtId');
  const [countryOptions, setCountryOptions] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    import('@/lib/countries').then(mod => {
      setCountryOptions(mod.COUNTRY_OPTIONS);
    });
  }, []);

  if (!user) return null;
  const isSpecial = SPECIAL_ROLES.includes(user.role);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handlePartnerChange = (idx: number, field: string, value: string) => {
    setForm(f => ({
      ...f,
      partners: f.partners.map((p, i) => i === idx ? { ...p, [field]: value } : p)
    }));
  };

  const addPartner = () => setForm(f => ({ ...f, partners: [...f.partners, { name: '', position: '' }] }));
  const removePartner = (idx: number) => setForm(f => ({ ...f, partners: f.partners.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...form
      });
      toast && toast({ title: 'Profile updated', description: 'Your profile has been updated successfully.' });
    } catch (err: any) {
      toast && toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-1">First Name</label>
              <Input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} placeholder="First Name" />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-1">Last Name</label>
              <Input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last Name" />
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium mb-1">Gender</label>
              <select
                id="gender"
                name="gender"
                className="w-full rounded border bg-background px-3 py-2"
                value={form.gender}
                onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium mb-1">Country</label>
              <select
                id="country"
                name="country"
                className="w-full rounded border bg-background px-3 py-2"
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
              >
                {countryOptions.length === 0 ? (
                  <option>Loading countries...</option>
                ) : (
                  countryOptions.map(opt => (
                    <option key={opt.code} value={opt.name}>{opt.name}</option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium mb-1">Mobile</label>
              <PhoneInput
                international
                defaultCountry="BD"
                value={form.mobile}
                onChange={value => setForm(f => ({ ...f, mobile: value || "" }))}
                className="w-full"
                inputComponent={PhoneInputField}
              />
            </div>
            <div>
              <label htmlFor="dob" className="block text-sm font-medium mb-1">Date of Birth</label>
              <Input id="dob" name="dob" value={form.dob} onChange={handleChange} placeholder="YYYY-MM-DD" type="date" />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium mb-1">Address</label>
              <Input id="address" name="address" value={form.address} onChange={handleChange} placeholder="Address" />
            </div>
            <div>
              <label htmlFor="post" className="block text-sm font-medium mb-1">Post</label>
              <Input id="post" name="post" value={form.post} onChange={handleChange} placeholder="Post" />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium mb-1">City</label>
              <Input id="city" name="city" value={form.city} onChange={handleChange} placeholder="City" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Documents</h3>
            <div className="mb-2">
              <label htmlFor="docType" className="block text-sm font-medium mb-1">Select Document Type</label>
              <select
                id="docType"
                className="w-full rounded border bg-background px-3 py-2"
                value={selectedDocType}
                onChange={e => setSelectedDocType(e.target.value as any)}
              >
                <option value="govtId">Govt ID</option>
                <option value="passport">Passport</option>
                <option value="drivingLicense">Driving License</option>
              </select>
            </div>
            {selectedDocType === 'govtId' && (
              <DocumentUpload
                userId={user.uid}
                docType="govtId"
                value={form.govtId}
                onChange={url => setForm(f => ({ ...f, govtId: url }))}
                label="Govt ID"
              />
            )}
            {selectedDocType === 'passport' && (
              <DocumentUpload
                userId={user.uid}
                docType="passport"
                value={form.passport}
                onChange={url => setForm(f => ({ ...f, passport: url }))}
                label="Passport"
              />
            )}
            {selectedDocType === 'drivingLicense' && (
              <DocumentUpload
                userId={user.uid}
                docType="drivingLicense"
                value={form.drivingLicense}
                onChange={url => setForm(f => ({ ...f, drivingLicense: url }))}
                label="Driving License"
              />
            )}
          </div>
          {isSpecial && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="organizationName" className="block text-sm font-medium mb-1">Organization Name</label>
                  <Input id="organizationName" name="organizationName" value={form.organizationName} onChange={handleChange} placeholder="Organization Name" />
                </div>
                <div>
                  <label htmlFor="civilAviationLicense" className="block text-sm font-medium mb-1">Civil Aviation Licence Number</label>
                  <Input id="civilAviationLicense" name="civilAviationLicense" value={form.civilAviationLicense} onChange={handleChange} placeholder="Civil Aviation Licence Number" />
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <label htmlFor="propitorOrPartner" className="font-medium">Owner Type</label>
                <select
                  id="propitorOrPartner"
                  name="propitorOrPartner"
                  value={form.propitorOrPartner}
                  onChange={e => setForm(f => ({ ...f, propitorOrPartner: e.target.value }))}
                  className="w-full rounded border bg-background px-3 py-2"
                >
                  <option value="PROPITOR">Propitor</option>
                  <option value="PARTNER">Partner</option>
                </select>
              </div>
              {form.propitorOrPartner === 'PROPITOR' ? (
                <div>
                  <label htmlFor="propitorName" className="block text-sm font-medium mb-1">Propitor Name</label>
                  <Input id="propitorName" name="propitorName" value={form.propitorName} onChange={handleChange} placeholder="Propitor Name" />
                </div>
              ) : (
                <div className="space-y-2">
                  {form.partners.map((p, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        name={`partnerName${idx}`}
                        value={p.name}
                        onChange={e => handlePartnerChange(idx, 'name', e.target.value)}
                        placeholder="Partner Name"
                      />
                      <Input
                        name={`partnerPosition${idx}`}
                        value={p.position}
                        onChange={e => handlePartnerChange(idx, 'position', e.target.value)}
                        placeholder="Position"
                      />
                      <Button type="button" variant="destructive" size="icon" onClick={() => removePartner(idx)}>-</Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addPartner}>Add Partner</Button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DocumentUpload
                  userId={user.uid}
                  docType="tradeLicense"
                  value={form.tradeLicense}
                  onChange={url => setForm(f => ({ ...f, tradeLicense: url }))}
                  label="Trade License"
                />
                <DocumentUpload
                  userId={user.uid}
                  docType="visitingCard"
                  value={form.visitingCard}
                  onChange={url => setForm(f => ({ ...f, visitingCard: url }))}
                  label="Visiting Card"
                />
              </div>
            </>
          )}
          <div className="flex justify-end">
            <Button type="submit" variant="default">Save Changes</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 