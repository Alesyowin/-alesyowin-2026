/**
 * Generează șablonul HTML pentru e-mailul de confirmare a comenzii (Black & Gold)
 * Biletele sunt afișate sub formă de cartonașe (cards).
 */
export function getOrderEmailTemplate({
    orderId,
    customerName,
    totalAmount,
    products,
    title,
    greeting,
    orderNumberLabel,
    eventLabel,
    totalLabel,
    yourTicketsLabel,
    thanksMessage,
    footer,
    logoUrl
}: {
    orderId: string;
    customerName: string;
    totalAmount: string;
    products: {
        giveawayTitle: string;
        productImageUrl?: string;
        tickets: string[];
    }[];
    title: string;
    greeting: string;
    orderNumberLabel: string;
    eventLabel: string;
    totalLabel: string;
    yourTicketsLabel: string;
    thanksMessage: string;
    footer: string;
    logoUrl: string;
}) {
    // Generăm secțiunea(s) pentru fiecare produs
    const productsHtml = products.map(product => {
        // Generăm HTML-ul biletelor organizate strict câte 5 pe rând, folosind un tabel adaptat pentru mobil
        const rows = [];
        for (let i = 0; i < product.tickets.length; i += 5) {
            const rowTickets = product.tickets.slice(i, i + 5);
            const tds = rowTickets.map(num => `
                <td width="20%" align="center" valign="middle" style="padding: 3px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="table-layout: fixed;">
                        <tr>
                            <td align="center" style="background-color: #000000; border: 1px solid #d4af37; border-radius: 6px; padding: 6px 1px;">
                                <div style="color: #d4af37; font-weight: 800; font-size: 11px; letter-spacing: 0px; line-height: 1; word-break: break-all;">${num}</div>
                            </td>
                        </tr>
                    </table>
                </td>
            `);
            // Completăm cu rânduri goale dacă rândul are sub 5 elemente
            while (tds.length < 5) {
                tds.push(`<td width="20%" style="padding: 3px;"></td>`);
            }
            rows.push(`<tr>${tds.join('')}</tr>`);
        }

        const ticketsTableHtml = `
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="table-layout: fixed; width: 100%;">
                ${rows.join('')}
            </table>
        `;

        return `
            <div style="margin-bottom: 40px; border-top: 1px solid #222222; padding-top: 30px;">
                <!-- Event info & Image -->
                <div style="margin-bottom: 20px;">
                    <div style="color: #888888; text-transform: uppercase; letter-spacing: 1px; font-size: 11px; margin-bottom: 8px;">${eventLabel}</div>
                    <div style="color: #ffffff; font-weight: 800; font-size: 18px; letter-spacing: 1px; margin-bottom: 20px;">${product.giveawayTitle}</div>
                    
                    ${product.productImageUrl ? `
                        <div style="margin-bottom: 25px; border-radius: 12px; overflow: hidden; border: 1px solid #222222; background-color: #000000;">
                            <img src="${product.productImageUrl}" alt="${product.giveawayTitle}" style="display: block; width: 100%; max-width: 100%; height: auto; object-fit: cover;" />
                        </div>
                    ` : ''}
                </div>

                <!-- Tickets grid -->
                <div style="background-color: #0a0a0a; border-radius: 12px; padding: 25px 10px; border: 1px solid #1a1a1a;">
                    <div style="font-size: 13px; font-weight: bold; color: #a0a0a0; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; text-align: center;">${yourTicketsLabel}</div>
                    <div style="width: 100%; margin: 0 auto;">
                        ${ticketsTableHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="ro" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>${title}</title>
    <!--[if mso]>
    <noscript>
    <xml>
    <o:OfficeDocumentSettings>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
    </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100% !important; background-color: #f4f4f5; }
        
        @media screen and (max-width: 600px) {
            .container { width: 100% !important; max-width: 100% !important; }
            .header-left { display: block !important; width: 100% !important; text-align: center !important; margin-bottom: 20px !important; }
            .header-right { display: block !important; width: 100% !important; text-align: center !important; }
            .logo-img { margin: 0 auto !important; }
        }

        /* Dark Mode fixes for iOS/Gmail */
        @media (prefers-color-scheme: dark) {
            .body-bg { background-color: #000000 !important; }
            .content-card { border-color: #333333 !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%;">

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;" class="body-bg">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; background-color: #0b0b0b; border-radius: 16px; margin: 0 auto; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);" class="container">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 35px 35px 20px 35px;" align="center">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="left" valign="middle" class="header-left" style="font-size: 22px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 2px;">
                                        GP COMPETITION
                                    </td>
                                    <td align="right" valign="middle" width="150" class="header-right">
                                        <img src="${logoUrl}" alt="GP Competition" width="140" style="display: block; width: 100%; max-width: 140px; height: auto;" class="logo-img" />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 35px 35px 35px;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #141414; border: 1px solid #1f1f1f; border-radius: 12px;" class="content-card">
                                <tr>
                                    <td align="left" style="padding: 40px 30px;">
                                        
                                        <!-- Salut -->
                                        <div style="font-size: 19px; color: #ffffff; font-weight: bold; margin-bottom: 25px; text-align: center;">
                                            ${greeting}
                                        </div>
                                        
                                        <!-- Factură Info -->
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 10px;">
                                            <tr>
                                                <td align="left" style="padding: 15px; background-color: #0b0b0b; border-radius: 8px;">
                                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">${orderNumberLabel}</td>
                                                            <td align="right" style="color: #d4af37; font-weight: bold; font-size: 16px;">#${orderId}</td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="2" style="padding-top: 10px;">
                                                                <div style="border-top: 1px solid #1a1a1a;"></div>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; padding-top: 10px;">${totalLabel}</td>
                                                            <td align="right" style="color: #ffffff; font-weight: bold; font-size: 18px; padding-top: 10px;">£${Number(totalAmount).toFixed(2)}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Buclă Produse & Bilete -->
                                        ${productsHtml}
                                        
                                        <!-- Mesaj Mulțumire -->
                                        <div style="font-size: 14px; color: #888888; margin-top: 30px; text-align: center; line-height: 1.6;">
                                            ${thanksMessage}
                                        </div>
                                        
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                
                <!-- Footer -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto;" class="container">
                    <tr>
                        <td align="center" style="padding-top: 25px; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 1px; line-height: 1.6;">
                            ${footer}
                        </td>
                    </tr>
                </table>
                
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}
