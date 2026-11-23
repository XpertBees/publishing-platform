/**
 * AdSense placeholder slot.
 * Renders nothing unless NEXT_PUBLIC_ADSENSE_CLIENT_ID is set — never
 * hardcode a publisher ID. When configured, renders the standard
 * AdSense <ins> unit; the AdSense script itself is loaded by the
 * integration layer, not here.
 */
export default function AdSlot({
  slot,
  format = "auto",
  className = "",
}: {
  slot: string;
  format?: string;
  className?: string;
}) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (!clientId) return null;
  return (
    <div
      className={`my-6 flex justify-center overflow-hidden ${className}`}
      aria-label="Advertisement"
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
