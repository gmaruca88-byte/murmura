import "./globals.css";

export const metadata = {
  title: "Murmura — il muro anonimo del tuo evento",
  description: "Bacheca anonima per eventi, con moderazione AI e report per l'organizzatore.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>
        <div className="app">
          <header className="hdr">
            <a className="brand" href="/"><span className="dot" /> murmura</a>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
