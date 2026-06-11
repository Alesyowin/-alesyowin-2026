export interface AdminBonusEmailProps {
    orderId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    ticketNumber: string | number;
    prizeValue: string;
    giveawayTitle: string;
    threshold?: string;
    baseUrl: string;
}

export function getAdminBonusWinnerTemplate(props: AdminBonusEmailProps): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
        .header { background: #000; color: #fff; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .section { margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px; }
        .label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
        .value { font-size: 16px; margin-top: 5px; color: #000; }
        .winner-badge { display: inline-block; background: #00A5FF; color: #000; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; margin-bottom: 10px; }
        .footer { font-size: 12px; color: #999; text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin:0;">[BONUS DRAW WIN]</h2>
            <p style="margin:5px 0 0 0; font-size: 14px; opacity: 0.8;">Câștigător Nou Extras Automat</p>
        </div>
        
        <div class="content">
            <div class="winner-badge">EXTRAGERE AUTOMATĂ REUȘITĂ</div>
            <p>Un nou câștigător a fost desemnat automat pentru o tragere <strong>Bonus Draw</strong>.</p>
            
            <div class="section">
                <div class="label">Competiție</div>
                <div class="value">${props.giveawayTitle} (ID: ${props.orderId})</div>
                
                ${props.threshold ? `
                <div class="label" style="margin-top:10px;">Prag Atins</div>
                <div class="value">${props.threshold}%</div>
                ` : ''}
            </div>

            <div class="section" style="border-left: 4px solid #00A5FF;">
                <div class="label">Bilet Câștigător</div>
                <div class="value" style="font-size: 24px; font-weight: bold;">#${props.ticketNumber}</div>
                
                <div class="label" style="margin-top:10px;">Premiu</div>
                <div class="value" style="color: #b8860b; font-weight: bold;">${props.prizeValue}</div>
            </div>

            <div class="section">
                <div style="font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Date Contact Câștigător</div>
                
                <div class="label">Nume Client</div>
                <div class="value">${props.customerName}</div>
                
                <div class="label" style="margin-top:10px;">Email</div>
                <div class="value">${props.customerEmail}</div>
                
                <div class="label" style="margin-top:10px;">Telefon</div>
                <div class="value">${props.customerPhone}</div>
            </div>

            <p style="font-size: 14px; color: #666;">Te rugăm să contactezi clientul pentru a stabili detaliile livrării premiului.</p>
        </div>
        
        <div class="footer">
            Sistem Automat ALESYOWIN<br>
            ${props.baseUrl}
        </div>
    </div>
</body>
</html>
    `;
}
