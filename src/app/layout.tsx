import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PRABHA WELLNESS | Health and Nutrition Center',
  description: 'Herbalife nutrition products for weight loss & wellness with workout',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet" />
        
        <link rel="stylesheet" href="/static/css/loader.css" />
        <link rel="stylesheet" href="/static/css/theme.css" />
        <link rel="stylesheet" href="/static/css/style.css" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
