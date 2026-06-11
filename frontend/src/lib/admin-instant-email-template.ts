export interface AdminInstantOrderEmailProps {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    ticketNumber: string | number;
    prizeValue: string;
    giveawayTitle: string;
    orderId: string;
    logoUrl?: string;
    directusAdminUrl: string;
}

export function getAdminInstantEmailTemplate(props: AdminInstantOrderEmailProps): string {
    return `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Instant Win Alert</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f6f9fc;
            color: #333333;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            border: 1px solid #e6ebf1;
        }
        .header {
            background-color: #00A5FF; /* Un orange/gold pt admin */
            padding: 20px;
            text-align: center;
            color: white;
            font-size: 20px;
            font-weight: bold;
        }
        .content {
            padding: 30px;
        }
        .row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #edf2f7;
            font-size: 15px;
        }
        .row:last-child {
            border-bottom: none;
        }
        .label {
            color: #718096;
            font-weight: 500;
        }
        .val {
            color: #1a202c;
            font-weight: 600;
            text-align: right;
        }
        .winner-box {
            background-color: #fffaf0;
            border: 1px solid #fbd38d;
            border-left: 4px solid #00A5FF;
            padding: 15px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .winner-box p {
            margin: 5px 0;
            font-size: 15px;
        }
        .link-btn {
            display: inline-block;
            background-color: #2b6cb0;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 4px;
            font-weight: bold;
            margin-top: 20px;
            text-align: center;
            width: calc(100% - 48px);
        }
        .footer {
            background-color: #f8fafc;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #a0aec0;
            border-top: 1px solid #edf2f7;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            [INSTANT WIN] Câștigător Nou 🎉
        </div>
        
        <div class="content">
            <p style="font-size: 16px; margin-top: 0;">Un client tocmai a câștigat un premiu instant la comanda <strong>#${props.orderId}</strong>!</p>
            
            <div class="winner-box">
                <p><span class="label">Premiu:</span> <span class="val" style="color: #00A5FF; font-size: 18px;">${props.prizeValue}</span></p>
                <p><span class="label">Bilet câștigător:</span> <span class="val">#${props.ticketNumber}</span></p>
                <p><span class="label">Concurs:</span> <span class="val">${props.giveawayTitle}</span></p>
            </div>

            <h3 style="margin-bottom: 10px; font-size: 16px; color: #4a5568; text-transform: uppercase;">Detalii Contact Câștigător</h3>
            <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div class="row">
                    <span class="label">Nume:</span>
                    <span class="val">${props.customerName}</span>
                </div>
                <div class="row">
                    <span class="label">Telefon:</span>
                    <span class="val">${props.customerPhone || 'Nespecificat'}</span>
                </div>
                <div class="row">
                    <span class="label">Email:</span>
                    <span class="val"><a href="mailto:${props.customerEmail}">${props.customerEmail}</a></span>
                </div>
            </div>

            <a href="${props.directusAdminUrl}" class="link-btn">Afișează Comanda în Directus</a>
        </div>
        
        <div class="footer">
            Sistem Automat Notificări ALESYOWIN
        </div>
    </div>
</body>
</html>
    `;
}
