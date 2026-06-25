import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

interface RenewalEmailProps {
  name: string;
  email: string;
  expirationDate: string;
  daysRemaining: number;
  planType: string;
}

const baseUrl = "https://realtv.co.za";
const whatsappNumber = "27769681973";

export const RenewalEmail = ({
  name = "Customer",
  email = "customer@example.com",
  expirationDate = "2026-07-01",
  daysRemaining = 7,
  planType = "Standard",
}: RenewalEmailProps) => {
  const isExpired = daysRemaining <= 0;
  const subject = isExpired
    ? `⚠️ Your RealTV subscription has expired`
    : `⏰ Your RealTV subscription expires in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`;

  const renewWhatsAppUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi. I'd like to renew my subscription.")}`;

  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with cyan/green gradient */}
          <Section style={headerSection}>
            <Img
              src={`https://real-tv-iota.vercel.app/realtv-logo.png`}
              width="130"
              height="auto"
              alt="RealTV"
              style={logo}
            />
            <Text style={headerSubtext}>Premium IPTV Service</Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={h1}>
              {isExpired ? "Subscription Expired" : "Renewal Reminder"}
            </Heading>

            <Text style={paragraph}>Hi {name},</Text>

            {isExpired ? (
              <Text style={paragraph}>
                Your RealTV subscription has <strong>expired</strong>. You've lost access to
                <strong> 10,000+ live channels</strong>, movies, and series.
              </Text>
            ) : (
              <Text style={paragraph}>
                Your RealTV subscription is expiring <strong>in {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}</strong>.
                Don't miss out on your favorite content!
              </Text>
            )}

            {/* Details Box */}
            <Section style={detailsBox}>
              <Row style={detailRow}>
                <Column style={detailLabel}>Account</Column>
                <Column style={detailValue}>{email}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Plan</Column>
                <Column style={detailValue}>{planType}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Expires</Column>
                <Column style={detailValue}>
                  {new Date(expirationDate).toLocaleDateString("en-ZA", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Column>
              </Row>
            </Section>

            <Section style={buttonSection}>
              <Button
                href={renewWhatsAppUrl}
                style={button}
              >
                {isExpired ? "Renew Now on WhatsApp" : "Renew on WhatsApp"}
              </Button>
            </Section>

            <Text style={paragraph}>
              {isExpired
                ? "Tap the button above to renew via WhatsApp and reactivate your access instantly."
                : "Tap the button above to renew via WhatsApp and keep enjoying uninterrupted access."}
            </Text>

            <Text style={paragraph}>
              Or WhatsApp us directly on <strong>{whatsappNumber}</strong> if the button doesn't work.
            </Text>

            <Text style={paragraph}>
              Best regards,
              <br />
              <strong>The RealTV Team</strong> 📺
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footerSection}>
            <Text style={footerText}>
              RealTV • South Africa
              <br />
              <Link href={`${baseUrl}`} style={footerLink}>
                realtv.co.za
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default RenewalEmail;

// Styles matching RealTV brand (dark theme, cyan/green/blue accents)
const main = {
  backgroundColor: "#0b0e14",
  fontFamily:
    "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  padding: "24px 0",
};

const container = {
  backgroundColor: "#141820",
  margin: "0 auto",
  maxWidth: "600px",
  borderRadius: "12px",
  overflow: "hidden",
  border: "1px solid #1e2330",
};

const headerSection = {
  background: "linear-gradient(135deg, #14b8a6, #22c55e, #3b82f6)",
  padding: "32px 40px",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
  display: "block",
};

const headerSubtext = {
  color: "rgba(255,255,255,0.8)",
  fontSize: "12px",
  margin: "8px 0 0",
  letterSpacing: "2px",
  textTransform: "uppercase" as const,
};

const contentSection = {
  padding: "32px 40px",
};

const h1 = {
  color: "#14b8a6",
  fontSize: "22px",
  fontWeight: "700",
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const paragraph = {
  color: "#a0aec0",
  fontSize: "15px",
  lineHeight: "1.7",
  margin: "0 0 16px",
};

const detailsBox = {
  backgroundColor: "#0b0e14",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "20px 0",
  border: "1px solid #1e2330",
};

const detailRow = {
  marginBottom: "8px",
};

const detailLabel = {
  color: "#718096",
  fontSize: "13px",
  width: "100px",
};

const detailValue = {
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "28px 0",
};

const button = {
  backgroundColor: "#25D366",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const hr = {
  borderColor: "#1e2330",
  margin: "0",
};

const footerSection = {
  padding: "20px 40px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#4a5568",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0",
};

const footerLink = {
  color: "#14b8a6",
  textDecoration: "underline",
};