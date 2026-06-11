/**
 * Generează șablonul HTML pentru notificarea de admin la comandă nouă.
 * Design dark cu accente aurii, inspirat din Shopify și aliniat cu designul de client.
 */

// Interfață pentru un produs din comanda de admin
export interface AdminOrderProduct {
    title: string;
    imageUrl?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}

export function getAdminOrderEmailTemplate({
    orderId,
    customerName,
    customerEmail,
    orderDate,
    products,
    subtotal,
    total,
    directusAdminUrl,
    logoUrl,
}: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    orderDate: string;
    products: AdminOrderProduct[];
    subtotal: string;
    total: string;
    directusAdminUrl: string;
    logoUrl: string;
}) {
    // Generăm rândurile pentru fiecare produs (Stil Shopify)
    const productRowsHtml = products.map(product => {
        const imageHtml = product.imageUrl
            ? `<img src="${product.imageUrl}" alt="${product.title}" width="50" height="50" style="display: block; width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #333;" />`
            : `<div style="width: 50px; height: 50px; background-color: #222; border-radius: 4px; border: 1px solid #333; display: flex; align-items: center; justify-content: center; color: #555; font-size: 9px;">No img</div>`;

        return `
            <tr>
                <td style="padding: 15px 0; border-bottom: 1px dotted #222;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <!-- Thumbnail -->
                            <td width="60" valign="middle">
                                ${imageHtml}
                            </td>
                            <!-- Info -->
                            <td valign="middle" style="padding-left: 10px;">
                                <div style="color: #ffffff; font-size: 14px; font-weight: 600; margin-bottom: 2px;">${product.title}</div>
                                <div style="color: #888888; font-size: 12px;">£${Number(product.unitPrice).toFixed(2)} × ${product.quantity}</div>
                            </td>
                            <!-- Line Total -->
                            <td width="80" valign="middle" align="right">
                                <div style="color: #d4af37; font-weight: 700; font-size: 14px;">£${Number(product.lineTotal).toFixed(2)}</div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="ro" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>New Order #${orderId}</title>
    <style type="text/css">
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100% !important; background-color: #ffffff; }
        
        @media screen and (max-width: 600px) {
            .container { width: 100% !important; max-width: 100% !important; }
            .header-left { display: block !important; width: 100% !important; text-align: center !important; margin-bottom: 20px !important; }
            .header-right { display: block !important; width: 100% !important; text-align: center !important; }
            .logo-img { margin: 0 auto !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; background-color: #0b0b0b; border-radius: 16px; margin: 0 auto; overflow: hidden;" class="container">
                    
                    <!-- Header (Identic cu client email) -->
                    <tr>
                        <td style="padding: 35px 35px 20px 35px;" align="center">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="left" valign="middle" class="header-left" style="font-size: 20px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 2px;">
                                        ALESYOWIN
                                    </td>
                                    <td align="right" valign="middle" width="140" class="header-right">
                                        <img src="${logoUrl}" alt="ALESYOWIN" width="130" style="display: block; width: 100%; max-width: 130px; height: auto;" class="logo-img" />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Main Card -->
                    <tr>
                        <td style="padding: 0 30px 30px 30px;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #111111; border: 1px solid #d4af37; border-radius: 12px;">
                                <tr>
                                    <td style="padding: 35px 25px;">
                                        
                                        <!-- Header Text -->
                                        <div style="color: #ffffff; font-size: 16px; text-align: center; margin-bottom: 25px; line-height: 1.5;">
                                            <span style="font-weight: bold;">${customerName}</span> a plasat comanda <span style="color: #d4af37; font-weight: bold;">#${orderId}</span> pe ${orderDate}
                                        </div>
                                        
                                        <!-- View Order Button -->
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 35px;">
                                            <tr>
                                                <td align="center">
                                                    <a href="${directusAdminUrl}" target="_blank" style="background-color: #d4af37; color: #000000; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">
                                                        View Order
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Order Summary Label -->
                                        <div style="color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #222; padding-bottom: 8px; margin-bottom: 5px; font-weight: bold;">
                                            Order Summary
                                        </div>
                                        
                                        <!-- Products List -->
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                            ${productRowsHtml}
                                        </table>
                                        
                                        <!-- Order Totals -->
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 15px;">
                                            <tr>
                                                <td align="right" style="padding: 5px 0; color: #888; font-size: 13px;">
                                                    Subtotal: <span style="color: #ccc; margin-left: 10px;">£${Number(subtotal).toFixed(2)}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="right" style="padding: 10px 0; color: #ffffff; font-size: 18px; font-weight: bold;">
                                                    Total: <span style="color: #d4af37; margin-left: 10px;">£${Number(total).toFixed(2)}</span>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                
                <!-- Footer Text -->
                <div style="color: #444; font-size: 10px; text-align: center; margin-top: 20px; text-transform: uppercase; letter-spacing: 1px;">
                    ALESYOWIN ADMIN NOTIFICATION &copy; ${new Date().getFullYear()}
                </div>
                
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}
