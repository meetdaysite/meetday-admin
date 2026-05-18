import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { Providers } from "@/components/providers"

const hagrid = localFont({
	src: [
		{ path: "./fonts/Hagrid-Regular-trial.ttf", weight: "400", style: "normal" },
		{ path: "./fonts/Hagrid-Text-Extrabold-trial.ttf", weight: "800", style: "normal" },
	],
	variable: "--font-hagrid",
	display: "swap",
})

const garet = localFont({
	src: [
		{ path: "./fonts/Garet-Regular.woff2", weight: "400", style: "normal" },
		{ path: "./fonts/Garet-Medium.woff2", weight: "500", style: "normal" },
		{ path: "./fonts/Garet-Bold.woff2", weight: "700", style: "normal" },
		{ path: "./fonts/Garet-Extra-Bold.woff2", weight: "800", style: "normal" },
	],
	variable: "--font-garet",
	display: "swap",
})

export const metadata: Metadata = {
	title: "Meetday Admin",
	description: "Internal operations panel for Meetday",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" className={`${hagrid.variable} ${garet.variable} h-full antialiased`}>
			<body className="min-h-full flex flex-col">
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
