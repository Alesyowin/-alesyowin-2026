import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    // Headere de securitate HTTP — protecție standard împotriva atacurilor web
    async headers() {
        return [
            {
                // Aplică headerele pe TOATE paginile și rutele API
                source: '/(.*)',
                headers: [
                    // Previne încărcarea site-ului într-un iframe pe alt site (anti-clickjacking)
                    { key: 'X-Frame-Options', value: 'DENY' },
                    // Browserul nu ghicește tipul fișierelor (previne atacuri MIME)
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    // Protecție extra împotriva scripturilor malițioase (XSS)
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    // Controlează ce informații se trimit către alte site-uri
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    // Forțează HTTPS pentru 1 an (include subdomenii)
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
                    // Dezactivează camera, microfonul, geolocalizarea — nu sunt necesare pe acest site
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                ],
            },
        ];
    },
};

export default withNextIntl(nextConfig);
