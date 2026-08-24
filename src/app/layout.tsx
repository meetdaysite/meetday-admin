import type { Metadata, Viewport } from "next"
import { Poppins, Bricolage_Grotesque } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration"

const poppins = Poppins({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-poppins",
	display: "swap",
})

const bricolage = Bricolage_Grotesque({
	subsets: ["latin"],
	variable: "--font-bricolage",
	display: "swap",
})

export const metadata: Metadata = {
	title: "Meetday Admin",
	description: "Internal operations panel for Meetday",
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "Meetday Admin",
	},
}

export const viewport: Viewport = {
	themeColor: "#000000",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" className={`${poppins.variable} ${bricolage.variable} h-full antialiased`}>
			<body className="min-h-full flex flex-col">
				<ServiceWorkerRegistration />
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
