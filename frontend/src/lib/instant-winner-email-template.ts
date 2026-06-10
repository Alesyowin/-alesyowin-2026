export interface InstantOrderEmailProps {
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

export function getInstantWinnerEmailTemplate(props: InstantOrderEmailProps): string {
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
            box-shadow: 0 4px 15px rgba(255, 215, 0, 0.1);
            border: 1px solid #1f1f1f;
        }
        .email-header {
            background-color: #080808;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 2px solid #332a00;
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
            color: #ffda6b;
            font-size: 22px;
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
            background: linear-gradient(135deg, #2a2200 0%, #4d3f00 50%, #806b00 100%);
            border: 2px solid #ffd700;
            border-radius: 10px;
            padding: 30px 20px;
            margin: 0 auto 35px auto;
            max-width: 400px;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
            position: relative;
        }
        
        /* Decorative dots mimicking ticket holes */
        .gold-ticket::before, .gold-ticket::after {
            content: '';
            position: absolute;
            top: 50%;
            width: 20px;
            height: 20px;
            background-color: #141414;
            border-radius: 50%;
            transform: translateY(-50%);
        }
        .gold-ticket::before {
            left: -10px;
            border-right: 2px solid #ffd700;
        }
        .gold-ticket::after {
            right: -10px;
            border-left: 2px solid #ffd700;
        }

        .ticket-title {
            color: #ffebb3;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        .highlight-box {
            background-color: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 215, 0, 0.3);
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
        }
        
        .prize-value {
            color: #ffd700;
            font-size: 28px;
            font-weight: bold;
            margin: 5px 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        
        .ticket-number {
            color: #ffffff;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 3px;
            margin: 5px 0 0 0;
            font-family: monospace;
        }

        .ticket-label {
            color: #cccccc;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 2px;
        }

        .instructions {
            background-color: rgba(255, 215, 0, 0.05);
            border-left: 4px solid #ffd700;
            padding: 15px 20px;
            margin-bottom: 30px;
            text-align: left;
            font-size: 14px;
            line-height: 1.5;
            color: #e6e6e6;
        }
        
        .thanks {
            font-weight: bold;
            color: #ffffff;
            font-size: 18px;
        }
        .email-footer {
            background-color: #080808;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666666;
            border-top: 1px solid #1f1f1f;
        }
        
        /* Mobile Adjustments */
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 20px 10px;
                border-radius: 8px;
            }
            .email-body {
                padding: 30px 20px;
            }
            .gold-ticket {
                padding: 20px 15px;
            }
            .prize-value {
                font-size: 24px;
            }
            .ticket-number {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header with conditional logo -->
        <div class="email-header">
            ${props.logoUrl 
                ? `<img src="${props.logoUrl}" alt="GP Competition Logo">` 
                : `<h1 style="color: #ffd700; margin: 0;">GP Competition</h1>`
            }
        </div>

        <div class="email-body">
            <!-- Greeting & Congrats -->
            <h2 class="greeting">${props.greeting}</h2>
            <p class="congrats-text">${props.congrats}</p>

            <!-- The Golden Ticket -->
            <div class="gold-ticket">
                <div class="ticket-title">★ INSTANT WIN ★</div>
                
                <div class="highlight-box">
                    <div class="ticket-label">${props.prizeLabel}</div>
                    <h3 class="prize-value">${props.prizeValue}</h3>
                </div>
                
                <div class="highlight-box" style="margin-bottom: 0;">
                    <div class="ticket-label">${props.ticketLabel}</div>
                    <div class="ticket-number">#${props.ticketNumber}</div>
                </div>
            </div>

            <!-- Instructions & Thanks -->
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
