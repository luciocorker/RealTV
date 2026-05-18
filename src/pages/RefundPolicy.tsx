import { SEOHead } from "@/components/SEOHead";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <SEOHead
        title="Refund Policy - RealTV"
        description="Read RealTV's refund policy for TV boxes and accessories sold in South Africa."
      />
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-3xl font-bold">Refund Policy</h1>
        <p className="mb-10 text-muted-foreground">Real TV – South Africa</p>

        <section className="mb-8">
          <p className="text-muted-foreground">
            At Real TV, we want you to be satisfied with your purchase. Please read our refund policy
            carefully before placing an order.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">TV Boxes &amp; Accessories</h2>
          <p className="text-muted-foreground">
            We accept returns on TV boxes and accessories under the following conditions:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>The item must be returned within <strong className="text-foreground">7 days</strong> of receipt.</li>
            <li>The item must be unused, in its original packaging, and in the same condition it was received.</li>
            <li>Proof of purchase is required for all returns.</li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            Items that have been opened, used, or damaged by the customer are not eligible for a refund.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Defective or Damaged Items</h2>
          <p className="text-muted-foreground">
            If you receive a defective or damaged product, please contact us within{" "}
            <strong className="text-foreground">48 hours</strong> of delivery with photos of the damage
            and your order details. We will arrange a replacement or refund at our discretion.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Return Shipping</h2>
          <p className="text-muted-foreground">
            Customers are responsible for the cost of return shipping unless the item is defective or
            an error was made on our part. We recommend using a trackable shipping method, as Real TV
            is not responsible for items lost in transit.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Refund Processing</h2>
          <p className="text-muted-foreground">
            Once your return is received and inspected, we will notify you of the approval or rejection
            of your refund. Approved refunds will be processed within{" "}
            <strong className="text-foreground">5–10 business days</strong> to your original payment method.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Contact Us</h2>
          <p className="text-muted-foreground">
            For refund requests or product support, please reach out to our team through our official
            WhatsApp or support channels.
          </p>
          <a
            href="mailto:apprealtv@gmail.com"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
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

export default RefundPolicy;
