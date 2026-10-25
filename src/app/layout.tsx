import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meetly — видеокомнаты",
  description: "Создайте комнату и позовите людей по ссылке. Видео, звук, демонстрация экрана и чат.",
};

export const viewport: Viewport = {
  themeColor: "#07080c",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
