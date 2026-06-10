import { NextIntlClientProvider } from 'next-intl';
import Script from 'next/script';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import Navbar from '../../components/layout/Navbar';
import CartDrawer from '../../components/layout/CartDrawer';
import Footer from '../../components/layout/Footer';
import MetaPixelTracker from '../../components/layout/MetaPixelTracker';
import '../globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  icons: {
    icon: '/logo-principal-favicon.png',
  },
};

import { AuthProvider } from '../../contexts/AuthContext';

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as 'en' | 'ro' | 'de' | 'fr' | 'it' | 'es')) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <meta name="facebook-domain-verification" content="0lkq9x4wej8ilxaoedxoy167867s2g" />
        <Script id="tiktok-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{
          __html: `
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};

  ttq.load('D7HB3NJC77U9I9C34RGG');
  ttq.page();
}(window, document, 'ttq');
          `
        }} />
        <Script id="fb-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{
          __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1859172781666149');
fbq('track', 'PageView');
          `
        }} />
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1859172781666149&ev=PageView&noscript=1"
          />
        </noscript>
      </head>
      <body className="bg-(--color-background) text-(--color-foreground) min-h-screen flex flex-col antialiased">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <MetaPixelTracker />
            <Navbar />
            <CartDrawer />
            <main className="flex-grow pt-20">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
