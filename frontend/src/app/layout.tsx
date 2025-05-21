import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StyledComponentsRegistry from "@/components/AntdRegistry";
import { ConfigProvider } from "antd";
import ptBR from "antd/locale/pt_BR";
import Providers from "@/provider/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Plano de Aula",
  description: "Gerenciador de Planos de Aula",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>
          <StyledComponentsRegistry>
            <ConfigProvider locale={ptBR}>{children}</ConfigProvider>
          </StyledComponentsRegistry>
        </Providers>
      </body>
    </html>
  );
}
