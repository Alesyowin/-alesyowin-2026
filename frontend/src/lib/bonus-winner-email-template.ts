export interface BonusOrderEmailProps {
    customerName: string;
    ticketNumber: string | number;
    prizeValue: string;
    giveawayTitle: string;
    title: string;
    greeting: string;
    congrats: string;
    ticketLabel: string;
    prizeLabel: string;
    instructions: string;
    thanks: string;
    footer: string;
    logoUrl?: string;
}

export function getBonusWinnerEmailTemplate(props: BonusOrderEmailProps): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${props.title}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background-color: #0d0d0d;
            color: #ffffff;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #141414;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(255, 165, 0, 0.15);
            border: 1px solid #1f1f1f;
        }
        .email-header {
            background-color: #080808;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 2px solid #002244;
        }
        .email-header img {
            max-width: 200px;
            height: auto;
        }
        .email-body {
            padding: 40px 30px;
            text-align: center;
        }
        .greeting {
            color: #66ccff;
            font-size: 24px;
            margin-top: 0;
            margin-bottom: 20px;
        }
        .congrats-text {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 35px;
            color: #d1d1d1;
        }
        
        .gold-ticket {
            background: linear-gradient(135deg, #002244 0%, #0055aa 50%, #008ecc 100%);
            border: 2px solid #00A5FF;
            border-radius: 12px;
            padding: 30px 20px;
            margin: 0 auto 35px auto;
            max-width: 440px;
            box-shadow: 0 0 25px rgba(255, 204, 0, 0.25);
            position: relative;
        }
        
        /* Decorative dots mimicking ticket holes */
        .gold-ticket::before, .gold-ticket::after {
            content: '';
            position: absolute;
            top: 50%;
            width: 24px;
            height: 24px;
            background-color: #141414;
            border-radius: 50%;
            transform: translateY(-50%);
        }
        .gold-ticket::before {
            left: -12px;
            border-right: 2px solid #00A5FF;
        }
        .gold-ticket::after {
            right: -12px;
            border-left: 2px solid #00A5FF;
        }

        .ticket-title {
            color: #ffffff;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 20px;
            font-weight: 800;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .highlight-box {
            background-color: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 204, 0, 0.4);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
        }
        
        .prize-value {
            color: #00A5FF;
            font-size: 32px;
            font-weight: bold;
            margin: 5px 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.6);
        }
        
        .ticket-number {
            color: #ffffff;
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 4px;
            margin: 5px 0 0 0;
            font-family: 'Courier New', Courier, monospace;
        }

        .ticket-label {
            color: #e6e6e6;
            font-size: 13px;
            text-transform: uppercase;
            margin-bottom: 4px;
            letter-spacing: 1px;
        }

        .instructions {
            background-color: rgba(255, 204, 0, 0.08);
            border-left: 4px solid #00A5FF;
            padding: 20px;
            margin-bottom: 35px;
            text-align: left;
            font-size: 15px;
            line-height: 1.6;
            color: #eeeeee;
        }
        
        .thanks {
            font-weight: bold;
            color: #ffffff;
            font-size: 18px;
            margin-bottom: 10px;
        }
        .email-footer {
            background-color: #080808;
            padding: 25px;
            text-align: center;
            font-size: 12px;
            color: #888888;
            border-top: 1px solid #1f1f1f;
        }
        
        /* Mobile Adjustments */
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 20px 10px;
            }
            .email-body {
                padding: 30px 15px;
            }
            .gold-ticket {
                padding: 20px 10px;
            }
            .prize-value {
                font-size: 26px;
            }
            .ticket-number {
                font-size: 22px;
            }
            .greeting {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            ${props.logoUrl 
                ? `<img src="${props.logoUrl}" alt="ALESYOWIN Logo">` 
                : `<h1 style="color: #00A5FF; margin: 0; font-size: 28px; letter-spacing: 1px;">ALESYOWIN</h1>`
            }
        </div>

        <div class="email-body">
            <h2 class="greeting">${props.greeting}</h2>
            <p class="congrats-text">${props.congrats}</p>

            <div class="gold-ticket">
                <div class="ticket-title">★ BONUS DRAW WINNER ★</div>
                
                <div class="highlight-box">
                    <div class="ticket-label">${props.prizeLabel}</div>
                    <h3 class="prize-value">${props.prizeValue}</h3>
                </div>
                
                <div class="highlight-box" style="margin-bottom: 0;">
                    <div class="ticket-label">${props.ticketLabel}</div>
                    <div class="ticket-number">#${props.ticketNumber}</div>
                </div>
            </div>

            <div class="instructions">
                ${props.instructions}
            </div>

            <p class="thanks">${props.thanks}</p>
        </div>

        <div class="email-footer">
            ${props.footer}
        </div>
    </div>
</body>
</html>
    `;
}
