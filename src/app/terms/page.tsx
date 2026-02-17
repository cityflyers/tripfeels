'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { AuthSessionProvider } from '@/components/providers/session-provider'
import { Skeleton } from '@/components/ui/skeleton-loading'
import { useTheme } from '@/context/theme-context'

type FooterSettingsLS = {
  termsContent?: string | null
  termsContentBn?: string | null
}

const defaultEnglish = `Terms & Conditions

Please carefully read the terms and conditions before availing any of the services provided by Tripfeels. By using any materials, information or services of Tripfeels, the user agrees to these terms and conditions. Tripfeels reserves the right to change or modify these terms and conditions at any time for any reason, without prior notice. By continuing to use the platform, Users agree to the modified terms and conditions from time to time. The User is requested to review the terms periodically to ensure that they remain updated regarding the terms and conditions.

For clarity, “User” refers to any individual, organization, or representative acting on behalf of a group or organization who accesses, purchases, or avails of services offered through Tripfeels’ platform. This includes, but is not limited to, individuals booking for personal use and organizations arranging travel for their employees.

General Disclaimer
Tripfeels does not own any travel products. It is simply the bridge which connects the Users with the travel service providers like airlines, hotels, tour operators etc. (travel provider). The accuracy, completeness, and correctness of the inventory-related information displayed on the platform remain the sole responsibility of each provider (i.e. third-party travel provider). Changes in market conditions or circumstances may occur on short notice which may make information displayed on the platform inaccurate or outdated.

If something should go wrong during booking or travel period, Tripfeels will act as a point of contact and will use its commercially reasonable efforts to facilitate resolution for the User. However, if such efforts fail to resolve the issue, Tripfeels will not assume any further responsibility or obligation. Tripfeels will always follow the standard policies of travel providers (Airlines, Hotel, Tour Operator etc.). Tripfeels shall not be responsible for any third-party inaccuracies.

Platform (Website/App)
The platform is intended to be used for authorized purposes by genuine Users. Anything originating from the platform, including text, photos, sound, and video, may not be distributed, exchanged, modified, sold, or transmitted by the User for any commercial or public purpose. The User Agreement offers the User a restricted, non-exclusive, and non-transferable license to use the platform in accordance with its terms. The User undertakes not to interfere with or attempt to interfere with the platform’s operations in any way.

Access to certain features of the platform may only be available to registered User(s). The process of registration may require the User to answer certain questions or provide certain information that may or may not be personal in nature. Some such fields may be mandatory or optional. The User represents and warrants that all information provided to Tripfeels is true and accurate.

Tripfeels reserves the right, in its absolute discretion, to discontinue permission to access the platform and the services provided on it, or any section thereof, at any time and without warning, for any purpose, including routine maintenance.

Tripfeels shall make every effort to guarantee that the information on its platform and other sales channels is free of viruses and other infections. Nevertheless, any information or materials acquired via the platform, or any other Sales Channel is done completely at the User's own risk and good judgment, and the User will be exclusively liable for any damage to their computers or data loss that may result from certain downloads.

Tripfeels holds the right to make modifications to its platform at any time and without previous notice to the User due unavoidable circumstances or pursuant to the instruction from the travel provider.

Any content on the platform that is considered to be illegal, unethical, defamatory, vulgar, abusive, invasive of privacy, deceptive, against any religious views, spam, or violates any applicable legislation should be reported to this email: tripfeelsbd@gmail.com . Tripfeels maintains the right to inspect and/or take necessary steps it considers fit in response to such a complaint.

User’s Agreement
Before making a reservation, Users should carefully read the description of the services and goods. The User(s) agreement is to be bound by all of the terms and conditions stated in the booking confirmation or the verified booking receipt. These terms should be read in conjunction with the User Agreement. If a User wishes to make a reservation on behalf of another individual, the User is responsible for informing that person of the conditions of this Agreement, including all regulations and limitations that apply.

The User agrees to follow all procedures and instructions in relation with the use of Tripfeels' services, as they may be updated from time to time. In addition, the User agrees to follow all relevant laws, rules, orders, instructions, and other directives issued by the central Government, District Authorities, or any other regulatory authority having the authority to do so in relation to the use of services or each transaction. The User also authorizes Tripfeels to contact such over phone, message and email. This consent shall supersede any preferences set by such User through national User preference register (NCPR) or any other similar preferences.

Account Security and Data Privacy
Tripfeels prioritizes User account security and data privacy. When registering on the platform, Users must create a secure password and are solely responsible for maintaining the confidentiality of their account credentials. While Tripfeels employs industry-standard encryption and data security measures to protect User information, it cannot guarantee immunity from security breaches that may arise due to unforeseen circumstances or lapses at the User’s end.

For purposes such as fraud detection or offering bookings on credit, Tripfeels may verify User information, including credit scores, as required by applicable laws. Additionally, anonymized or aggregated User data may be shared with third-party service providers for tasks like payment processing or data hosting. In cases of legal investigations, Tripfeels may share User data with law enforcement agencies without prior consent, as mandated by law. Tripfeels is committed to continuously updating its security practices to align with evolving standards and regulations.

Booking Terms
When users make a booking through Tripfeels’ platform, the transaction is directly with the travel provider (such as airlines, hotels, or tour operators) listed on the booking page. Tripfeels acts solely as a User interface to facilitate these bookings with travel providers. Users are required to thoroughly review and agree to the terms and conditions of the respective travel providers before finalizing their purchase. The travel provider’s limitation in sharing product-related information in advance shall not hold Tripfeels responsible for any liability arising in the process. Tripfeels is exempted from any liabilities arising out of User errors during bookings.

If Users encounter any issues or disputes with their bookings, Tripfeels will act as a point of contact and will facilitate resolution for the User. However, resolution will be subject to the travel provider’s policies and discretion. Tripfeels reserves the right to cancel any bookings under exceptional circumstances beyond its control, including natural disasters, government restrictions, acts of God or other unforeseen events.

Special Requests
In the event of any special requests (e.g., wheelchair assistance, frequent flyer points, event tickets, etc.), Tripfeels will forward these requests to the travel providers based on availability. Tripfeels is not responsible for fulfillment or availability of these requests.

Suppliers Conduct and Platform Limitations
Tripfeels facilitates users with various travel providers but is not responsible or liable for their actions or omissions. Users are solely responsible for any obligations or liabilities arising from their transactions with them.

Resale of Tripfeels Products and Services
Reselling any booking, service, or product purchased through Tripfeels is strictly prohibited. All bookings are intended for personal use and are non-transferable.

Content Usage and Copyright Policy
All content on Tripfeels’ platform is protected by intellectual property laws. Any unauthorized use is punishable under law. Copyright violation complaints may be sent to tripfeelsbd@gmail.com .

Usage of User Information
Tripfeels will send booking confirmation, itinerary, cancellation, and other relevant information via email, SMS, or call as provided by the User.

Right of Refusal
Tripfeels reserves the right to refuse any booking without reason, cancel suspicious bookings, or terminate accounts for inappropriate behavior or fraudulent activities.

Fraudulent Activities
Tripfeels representatives will never ask for your credit card details, OTP, passwords, or banking information. If you receive such a request, report it immediately to tripfeelsbd@gmail.com .

Force Majeure
In cases such as natural disasters, pandemics, technical failures, or any other uncontrollable events, Tripfeels and its travel providers may not be able to fulfill bookings. In such cases, Tripfeels will make reasonable efforts to assist Users or refund payments as applicable.

✅ Contact Information
For any concerns or queries, please contact: 📧 tripfeelsbd@gmail.com`

const defaultBangla = `টার্মস এবং কন্ডিশনস (Terms & Conditions)
অনুগ্রহ করে Tripfeels কর্তৃক প্রদত্ত যেকোনো সেবা ব্যবহারের আগে এই টার্মস ও কন্ডিশনস মনোযোগ সহকারে পড়ুন।
Tripfeels-এর যেকোনো উপকরণ, তথ্য বা সেবা ব্যবহারের মাধ্যমে আপনি এই শর্তাবলীর সাথে সম্মত হচ্ছেন।
Tripfeels যেকোনো সময়, যেকোনো কারণে, পূর্ব ঘোষণা ছাড়াই এই শর্তাবলী পরিবর্তন বা সংশোধন করার অধিকার সংরক্ষণ করে।
আপনি যদি প্ল্যাটফর্ম ব্যবহার অব্যাহত রাখেন, তবে সেই সংশোধিত শর্তাবলীর সাথে সম্মত বলে গণ্য হবেন।
সর্বশেষ শর্তাবলী সম্পর্কে আপডেট থাকতে অনুগ্রহ করে নিয়মিতভাবে এই শর্তাবলী পর্যালোচনা করুন।
“ইউজার (User)” বলতে বোঝানো হয়েছে এমন কোনো ব্যক্তি, প্রতিষ্ঠান, বা প্রতিনিধি যিনি Tripfeels প্ল্যাটফর্মের মাধ্যমে সেবা গ্রহণ করেন, বুকিং করেন, বা তৃতীয় পক্ষের সেবা ব্যবহার করেন।

সাধারণ ঘোষণা (General Disclaimer)
Tripfeels নিজে কোনো ভ্রমণ পণ্য বা সেবা মালিক নয়। এটি কেবলমাত্র ইউজার এবং ভ্রমণ সেবা প্রদানকারী (যেমন এয়ারলাইনস, হোটেল, ট্যুর অপারেটর ইত্যাদি) এর মধ্যে সংযোগ স্থাপন করে।
প্ল্যাটফর্মে প্রদর্শিত তথ্যের যথার্থতা, সম্পূর্ণতা এবং সঠিকতা সম্পূর্ণভাবে তৃতীয় পক্ষের সেবা প্রদানকারীর দায়িত্ব।
বাজার পরিস্থিতি বা অনাকাঙ্ক্ষিত পরিবর্তনের কারণে তথ্য হালনাগাদ নাও থাকতে পারে।
বুকিং বা ভ্রমণকালে কোনো সমস্যা হলে Tripfeels যুক্তিসঙ্গত প্রচেষ্টা চালাবে সমস্যার সমাধানে সহায়তা করতে। তবে সমস্যার সমাধান না হলে Tripfeels এর অতিরিক্ত কোনো দায়িত্ব থাকবে না।
Tripfeels সর্বদা সংশ্লিষ্ট সেবা প্রদানকারীর নীতিমালা অনুসরণ করবে।

প্ল্যাটফর্ম ব্যবহারের শর্তাবলী (Platform Use)
Tripfeels প্ল্যাটফর্ম শুধুমাত্র বৈধ ও অনুমোদিত ইউজারদের ব্যবহারের জন্য নির্ধারিত।
প্ল্যাটফর্মের যেকোনো তথ্য, ছবি, শব্দ বা ভিডিও বাণিজ্যিক উদ্দেশ্যে পরিবর্তন, বিক্রয় বা প্রচার করা যাবে না।
Tripfeels ইউজারদের প্ল্যাটফর্ম ব্যবহারের জন্য সীমিত, অ-এক্সক্লুসিভ, অ-হস্তান্তরযোগ্য লাইসেন্স প্রদান করে।
ইউজার কোনোভাবেই প্ল্যাটফর্মের কার্যক্রমে হস্তক্ষেপ করতে পারবেন না।
প্ল্যাটফর্মের কিছু সেবা শুধুমাত্র রেজিস্টার্ড ইউজারদের জন্য সংরক্ষিত থাকতে পারে। রেজিস্ট্রেশনের সময় ইউজারকে কিছু ব্যক্তিগত বা সাধারণ তথ্য প্রদান করতে হতে পারে।
ইউজার নিশ্চয়তা দেন যে প্রদত্ত সকল তথ্য সত্য ও সঠিক।
Tripfeels যেকোনো সময় পূর্ব ঘোষণা ছাড়াই রক্ষণাবেক্ষণ বা অন্য যেকোনো কারণে প্ল্যাটফর্মে প্রবেশাধিকার স্থগিত করতে পারে।
Tripfeels সর্বোচ্চ চেষ্টা করে তার প্ল্যাটফর্ম ভাইরাস ও ক্ষতিকর উপাদান মুক্ত রাখতে, তবে ইউজারের ডাউনলোড করা তথ্যের কারণে কোনো ক্ষতি হলে Tripfeels দায়ী নয়।
যদি কোনো ইউজার বেআইনি, অশ্লীল, মানহানিকর, ধর্মবিরোধী, বা আইন লঙ্ঘনকারী কনটেন্ট আপলোড করেন, অনুগ্রহ করে ইমেইল করুন: tripfeelsbd@gmail.com
Tripfeels এমন অভিযোগ পর্যালোচনা করে প্রয়োজনীয় ব্যবস্থা নিতে পারে।

ইউজারের দায়িত্ব (User Agreement)
সেবা বুক করার আগে ইউজারকে সেবার বিবরণ মনোযোগ সহকারে পড়তে হবে।
বুকিং সম্পন্ন করার মাধ্যমে ইউজার বুকিং কনফার্মেশনে উল্লিখিত শর্তাবলীর সাথে বাধ্য থাকবেন।
যদি কোনো ইউজার অন্যের পক্ষে বুকিং করেন, তবে তিনি সেই ব্যক্তিকে সকল প্রযোজ্য শর্ত ও নীতিমালা সম্পর্কে অবহিত করার দায়িত্বে থাকবেন।
ইউজার Tripfeels এর আপডেটেড নির্দেশিকা, আইন এবং সরকারি নিয়ম মেনে চলতে বাধ্য থাকবেন।
Tripfeels ইউজারদের ফোন, মেসেজ বা ইমেইলের মাধ্যমে যোগাযোগ করতে পারে, এমনকি ইউজার DND বা NCPR তালিকায় থাকলেও।

অ্যাকাউন্ট সিকিউরিটি ও ডেটা প্রাইভেসি (Account Security & Data Privacy)
Tripfeels ইউজারদের তথ্যের নিরাপত্তা ও গোপনীয়তা সর্বোচ্চ গুরুত্ব দেয়।
রেজিস্ট্রেশনের সময় ইউজারকে একটি নিরাপদ পাসওয়ার্ড তৈরি করতে হবে এবং নিজের অ্যাকাউন্ট সুরক্ষার দায়িত্ব নিতে হবে।
Tripfeels উন্নত এনক্রিপশন ও নিরাপত্তা ব্যবস্থা ব্যবহার করে, তবে কোনো অনাকাঙ্ক্ষিত নিরাপত্তা ভঙ্গের জন্য Tripfeels দায়ী নয়।
আইনি প্রয়োজনে বা প্রতারণা প্রতিরোধে Tripfeels ইউজারের কিছু তথ্য যাচাই করতে পারে এবং প্রয়োজনে আইন প্রয়োগকারী সংস্থার সাথে শেয়ার করতে পারে।

বুকিং শর্তাবলী (Booking Terms)
Tripfeels প্ল্যাটফর্মের মাধ্যমে করা যেকোনো বুকিং সরাসরি সংশ্লিষ্ট ভ্রমণ সেবা প্রদানকারীর সাথে সম্পন্ন হয়।
Tripfeels কেবলমাত্র মধ্যস্থতাকারী হিসেবে কাজ করে।
ইউজারদের বুকিংয়ের আগে সংশ্লিষ্ট সেবা প্রদানকারীর শর্তাবলী পর্যালোচনা করা প্রয়োজন।
যদি কোনো সমস্যা দেখা দেয়, Tripfeels সেটি সমাধানে সহায়তা করবে, তবে চূড়ান্ত সিদ্ধান্ত সেবা প্রদানকারীর নীতিমালার ওপর নির্ভর করবে।
প্রাকৃতিক দুর্যোগ, সরকারী নিষেধাজ্ঞা বা অন্যান্য অপ্রত্যাশিত কারণে Tripfeels বুকিং বাতিল করার অধিকার সংরক্ষণ করে।

বিশেষ অনুরোধ (Special Requests)
ইউজারের বিশেষ অনুরোধ (যেমন হুইলচেয়ার, ফ্রিকোয়েন্ট ফ্লায়ার পয়েন্ট ইত্যাদি) Tripfeels সংশ্লিষ্ট সেবা প্রদানকারীর কাছে পৌঁছে দেবে, তবে পূরণের নিশ্চয়তা দিতে পারে না।

সাপ্লায়ারদের আচরণ ও সীমাবদ্ধতা (Suppliers Conduct & Limitations)
Tripfeels কেবল সেবা প্রদানকারীদের সাথে ইউজারদের সংযুক্ত করে।
তৃতীয় পক্ষের কোনো ভুল বা অবহেলার জন্য Tripfeels দায়ী নয়।

Tripfeels সেবা পুনঃবিক্রয় (Resale of Services)
Tripfeels থেকে ক্রয়কৃত কোনো সেবা বা বুকিং পুনঃবিক্রয় বা স্থানান্তর করা নিষিদ্ধ।

বৌদ্ধিক সম্পত্তি ও কপিরাইট (Content & Copyright)
Tripfeels প্ল্যাটফর্মে থাকা সকল কনটেন্ট কপিরাইট আইনের আওতায় সুরক্ষিত।
অননুমোদিত ব্যবহার বা কপি করা আইনত দণ্ডনীয়।
কপিরাইট লঙ্ঘনের অভিযোগ পাঠাতে পারেন: tripfeelsbd@gmail.com

ইউজার তথ্যের ব্যবহার (Use of User Information)
Tripfeels ইউজারদের ইমেইল, এসএমএস বা কলের মাধ্যমে বুকিং কনফার্মেশন, ইটিনারারি বা বাতিল সংক্রান্ত তথ্য পাঠাবে।

বুকিং প্রত্যাখ্যানের অধিকার (Right of Refusal)
Tripfeels যেকোনো বুকিং বাতিল করতে পারে যদি তা সন্দেহজনক বা প্রতারণামূলক হয়।
এছাড়াও, অনুপযুক্ত আচরণের জন্য অ্যাকাউন্ট বন্ধ করার অধিকার সংরক্ষণ করে।

প্রতারণা ও নিরাপত্তা সতর্কতা (Fraudulent Activities)
Tripfeels কখনও ইউজারের কাছ থেকে OTP, পাসওয়ার্ড বা ব্যাংক তথ্য চাইবে না।
এ ধরনের অনুরোধ পেলে অবিলম্বে রিপোর্ট করুন: tripfeelsbd@gmail.com

ফোর্স মেজর (Force Majeure)
প্রাকৃতিক দুর্যোগ, মহামারি, প্রযুক্তিগত ত্রুটি, বা অন্য কোনো অনিয়ন্ত্রিত কারণে বুকিং সম্পন্ন করা না গেলে, Tripfeels যুক্তিসঙ্গত প্রচেষ্টা চালাবে সমস্যা সমাধান বা রিফান্ড প্রদানের জন্য।

যোগাযোগের ঠিকানা (Contact Information)
যেকোনো প্রশ্ন বা অভিযোগের জন্য যোগাযোগ করুন:
📧 tripfeelsbd@gmail.com`

export default function TermsPage() {
  const [tab, setTab] = useState<'en' | 'bn'>('en')
  const [ls, setLs] = useState<FooterSettingsLS | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  const { gradientFrom, gradientVia, gradientTo } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('tripfeels-footer-settings')
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          const obj = parsed as Record<string, unknown>
          const tcRaw = obj.termsContent
          const tcbnRaw = obj.termsContentBn
          const next: FooterSettingsLS = {}
          if (typeof tcRaw === 'string' || tcRaw === null) next.termsContent = tcRaw
          if (typeof tcbnRaw === 'string' || tcbnRaw === null) next.termsContentBn = tcbnRaw
          setLs(next)
        }
      }
    } catch (e) {
      void e
    }
    setMounted(true)
  }, [])

  const english = useMemo(() => ls?.termsContent ?? defaultEnglish, [ls])
  const bangla = useMemo(() => ls?.termsContentBn ?? defaultBangla, [ls])

  const wrapper = useMemo(() => {
    return {
      className: 'min-h-screen bg-[var(--tf-page-bg)] text-[var(--tf-text-primary)]',
      style: {} as React.CSSProperties,
    }
  }, [])

  const toRgba = (hex: string, alpha: number) => {
    if (!hex) return `rgba(0,0,0,${alpha})`
    if (hex.startsWith('rgb'))
      return hex.replace(
        /rgba?\(([^)]+)\)/,
        (_m: string, inner: string) => `rgba(${inner.split(',').slice(0, 3).join(',')}, ${alpha})`,
      )
    const h = hex.replace('#', '')
    const bigint = parseInt(h, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return (
    <AuthSessionProvider>
      <div className={wrapper.className} style={wrapper.style}>
        {mounted && (
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute -top-40 -right-32 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob"
              style={{ backgroundColor: toRgba(gradientFrom, 0.3) }}
            />
            <div
              className="absolute -bottom-40 -left-32 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-2000"
              style={{ backgroundColor: toRgba(gradientTo, 0.3) }}
            />
            <div
              className="absolute top-40 left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-4000"
              style={{ backgroundColor: toRgba(gradientVia, 0.3) }}
            />
          </div>
        )}

        <Header
          showNavigation={false}
          showUserActions={true}
          onMobileMenuToggle={() => undefined}
        />

        <div className="flex relative z-10 h-screen">
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <div className="fixed top-14 bottom-0 left-0 z-30">
              <Sidebar onCollapseChange={setIsSidebarCollapsed} className="h-full" />
            </div>
          </div>
          {/* Sidebar spacer */}
          <div className={`hidden md:block ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}></div>

          {/* Content */}
          <main className="flex-1 overflow-auto p-6 pt-24 pb-20">
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Hero banner */}
              <div className="relative overflow-hidden rounded-2xl border border-[var(--tf-border)]/60 bg-[var(--tf-surface)]/65 p-8 md:p-12">
                <h1 className="text-4xl md:text-5xl font-bold text-[var(--tf-text-primary)]">
                  Terms & Conditions
                </h1>
                <p className="mt-3 text-sm text-[var(--tf-text-secondary)]">
                  <Link href="/" className="hover:underline">
                    Home
                  </Link>{' '}
                  • Terms & Conditions
                </p>
                {/* Decorative shapes */}
                {mounted && (
                  <div className="pointer-events-none absolute inset-0 -z-0">
                    <div
                      className="absolute -top-10 -left-10 w-40 h-40 rotate-45 rounded-lg"
                      style={{ backgroundColor: toRgba(gradientFrom, 0.2) }}
                    />
                    <div
                      className="absolute -bottom-10 right-10 w-44 h-44 -rotate-45 rounded-lg"
                      style={{ backgroundColor: toRgba(gradientTo, 0.2) }}
                    />
                  </div>
                )}
              </div>

              {/* Content grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left side nav */}
                <aside className="md:col-span-3">
                  <div className="rounded-xl border border-[var(--tf-border)]/60 bg-[var(--tf-surface)]/65 p-4">
                    <nav className="space-y-1 text-sm">
                      <div className="font-semibold text-[var(--tf-text-primary)] mb-2">
                        Policies
                      </div>
                      <a
                        href="/privacy"
                        className="block rounded-lg px-3 py-2 text-[var(--tf-text-secondary)] hover:bg-[var(--tf-nav-hover)]/35"
                      >
                        Privacy Policy
                      </a>
                      <a
                        href="#"
                        className="block rounded-lg px-3 py-2 text-[var(--tf-text-secondary)] hover:bg-[var(--tf-nav-hover)]/35"
                      >
                        Cookies Policy
                      </a>
                      <a className="flex items-center justify-between rounded-lg px-3 py-2 bg-[var(--tf-surface-alt)]/45 text-[var(--tf-text-primary)]">
                        <span>Terms & Conditions</span>
                      </a>
                    </nav>
                    <div className="mt-4 inline-flex rounded-lg border border-[var(--tf-border)]/60 bg-[var(--tf-surface-alt)]/25 overflow-hidden">
                      <button
                        className={`px-3 py-1.5 text-xs ${tab === 'en' ? 'bg-[var(--tf-surface-alt)]/45 text-[var(--tf-text-primary)]' : 'text-[var(--tf-text-secondary)]'}`}
                        onClick={() => setTab('en')}
                      >
                        English
                      </button>
                      <button
                        className={`px-3 py-1.5 text-xs ${tab === 'bn' ? 'bg-[var(--tf-surface-alt)]/45 text-[var(--tf-text-primary)]' : 'text-[var(--tf-text-secondary)]'}`}
                        onClick={() => setTab('bn')}
                      >
                        বাংলা
                      </button>
                    </div>
                  </div>
                </aside>

                {/* Right content */}
                <section className="md:col-span-9">
                  <div className="bg-[var(--tf-surface)]/65 backdrop-blur-md border border-[var(--tf-border)]/60 rounded-xl p-6 md:p-8 shadow-lg">
                    {!mounted ? (
                      <>
                        <Skeleton className="h-6 w-56 mb-4" />
                        <div className="space-y-3">
                          {Array.from({ length: 10 }, (_, i) => i).map((i) => (
                            <Skeleton
                              key={i}
                              className={`h-4 ${i % 3 === 0 ? 'w-5/6' : i % 3 === 1 ? 'w-4/6' : 'w-full'}`}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      (() => {
                        const content = tab === 'en' ? english : bangla
                        const parts = String(content).split('\n')
                        const first = String(parts[0] ?? '').trim()
                        const isTitle =
                          first.length > 0 &&
                          (tab === 'en'
                            ? /terms\s*&?\s*conditions/i.test(first)
                            : /টার্মস|কন্ডিশনস/.test(first))
                        const body = isTitle ? parts.slice(1).join('\n') : String(content)
                        const title = isTitle
                          ? first
                          : tab === 'en'
                            ? 'Terms & Conditions'
                            : 'টার্মস এবং কন্ডিশনস (Terms & Conditions)'
                        return (
                          <>
                            <h2 className="text-xl md:text-2xl font-extrabold text-[var(--tf-text-primary)] mb-3">
                              {title}
                            </h2>
                            <article className="whitespace-pre-wrap leading-7 text-[13.5px] md:text-[14px] text-[var(--tf-text-secondary)]">
                              {body}
                            </article>
                          </>
                        )
                      })()
                    )}
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>

        <div
          className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${isSidebarCollapsed ? 'md:left-20' : 'md:left-64'}`}
        >
          <Footer />
        </div>
      </div>
    </AuthSessionProvider>
  )
}

