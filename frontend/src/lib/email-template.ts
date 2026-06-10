/**
 * Generează șablonul HTML pentru e-mailul OTP (Black & Gold)
 */
export function getOtpEmailTemplate({
    code,
    title,
    greeting,
    message,
    expiry,
    securityNote,
    footer,
    logoUrl
}: {
    code: string;
    title: string;
    greeting: string;
    message: string;
    expiry: string;
    securityNote: string;
    footer: string;
    logoUrl: string;
}) {
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

        /* Dark Mode fixes pentru Gmail/Apple Mail */
        @media (prefers-color-scheme: dark) {
            .body-bg { background-color: #000000 !important; }
            .content-card { border-color: #333333 !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%;">

    <!-- Wrapper cu background deschis -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;" class="body-bg">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                
                <!-- Main Card (Design-ul site-ului) -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0b0b0b; border-radius: 16px; margin: 0 auto; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);" class="container">
                    
                    <!-- Header: Titlu stânga, Logo dreapta -->
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
                    
                    <!-- Conținut (caseta gri închis) -->
                    <tr>
                        <td style="padding: 0 35px 35px 35px;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #141414; border: 1px solid #1f1f1f; border-radius: 12px;" class="content-card">
                                <tr>
                                    <td align="center" style="padding: 40px 30px;">
                                        
                                        <!-- Salut -->
                                        <div style="font-size: 18px; color: #ffffff; font-weight: bold; margin-bottom: 20px;">
                                            ${greeting}
                                        </div>
                                        
                                        <!-- Mesaj -->
                                        <div style="font-size: 16px; color: #a0a0a0; margin-bottom: 30px; line-height: 1.6;">
                                            ${message}
                                        </div>
                                        
                                        <!-- Cod OTP -->
                                        <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                                            <tr>
                                                <td align="center" style="background-color: #000000; border: 1px solid #d4af37; border-radius: 8px; padding: 15px 30px;">
                                                    <div style="font-size: 40px; font-weight: 800; letter-spacing: 8px; color: #d4af37; margin: 0; text-shadow: 0 0 15px rgba(212, 175, 55, 0.3);">
                                                        ${code}
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Expirare -->
                                        <div style="font-size: 14px; color: #666666; margin-top: 25px;">
                                            ${expiry}
                                        </div>
                                        
                                        <!-- Notă de Securitate -->
                                        <div style="font-size: 12px; color: #555555; margin-top: 35px; padding-top: 25px; border-top: 1px solid #1f1f1f; font-style: italic; line-height: 1.5;">
                                            ${securityNote}
                                        </div>
                                        
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                
                <!-- Footer -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto;" class="container">
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
