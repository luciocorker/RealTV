import { SEOHead } from "@/components/SEOHead";
import paxiLogo from "@/assets/paxi.png";

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <SEOHead
        title="Shipping Policy - RealTV"
        description="Learn about RealTV's shipping policy, delivery times, and pickup information for South Africa."
      />
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-3xl font-bold">Shipping Policy</h1>
        <p className="mb-10 text-muted-foreground">Real TV – South Africa</p>

        <section className="mb-8">
          <p className="text-muted-foreground">
            Welcome to Real TV. We are committed to delivering your order safely and efficiently across
            South Africa.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Delivery Method</h2>
          <div className="mb-4 flex items-center gap-4">
            <img src={paxiLogo} alt="PAXI logo" className="h-12 w-auto" />
          </div>
          <p className="text-muted-foreground">
            All orders are shipped using <strong className="text-foreground">PEP PAXI</strong> to your
            nearest PAXI pickup point.
          </p>
          <p className="mt-2 text-muted-foreground">
            Once your order has been shipped, you will receive a tracking number and collection details.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Delivery Time</h2>
          <p className="text-muted-foreground">
            Estimated delivery time is <strong className="text-foreground">3–5 working/business days</strong>{" "}
            depending on your location and courier processing times.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Orders are processed during business days only.</li>
            <li>Weekends and public holidays are not counted as business days.</li>
            <li>Delivery times may vary during busy periods or due to unforeseen courier delays.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Shipping Areas</h2>
          <p className="text-muted-foreground">
            We currently ship within <strong className="text-foreground">South Africa only</strong>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Pickup Information</h2>
          <p className="text-muted-foreground">
            Customers are responsible for collecting their parcel from the selected PAXI pickup point once
            notified that it has arrived.
          </p>
          <p className="mt-2 text-muted-foreground">Please bring:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Your tracking/reference number</li>
            <li>A valid South African ID or collection SMS</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Incorrect Information</h2>
          <p className="text-muted-foreground">
            Please ensure that your contact details and selected pickup location are correct when placing
            your order. Real TV will not be responsible for delays caused by incorrect information provided
            by the customer.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Lost or Delayed Parcels</h2>
          <p className="text-muted-foreground">
            If your parcel has not arrived within the estimated delivery timeframe, please contact our
            support team with your order number and tracking details so we can assist you.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Contact Us</h2>
          <p className="text-muted-foreground">
            For shipping support or order inquiries, please contact Real TV customer support through our
            official WhatsApp or support channels.
          </p>
          <a
            href="mailto:apprealtv@gmail.com"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            Contact Support
          </a>
        </section>
      </div>
    </div>
  );
};

export default ShippingPolicy;
