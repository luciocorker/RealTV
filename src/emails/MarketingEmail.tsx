import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface MarketingEmailProps {
  name: string;
  email: string;
  title: string;
  message: string;
  ctaText: string;
  ctaUrl: string;
}

const baseUrl = "https://realtv.co.za";
const whatsappNumber = "27769681973";

export const MarketingEmail = ({
  name = "Customer",
  email = "customer@example.com",
  title = "Special Offer from RealTV",
  message = "Check out our latest deals and promotions!",
  ctaText = "Learn More",
  ctaUrl = `${baseUrl}/shop`,
}: MarketingEmailProps) => {
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi! I'm interested in RealTV.")}`;

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with cyan/green/blue gradient */}
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
            <Heading style={h1}>{title}</Heading>

            <Text style={paragraph}>Hi {name},</Text>

            <Text style={paragraph}>{message}</Text>

            <Section style={buttonSection}>
              <Button href={ctaUrl} style={button}>
                {ctaText}
              </Button>
            </Section>

            <Text style={paragraph}>
              Questions? WhatsApp us on <Link href={whatsappUrl} style={inlineLink}>{whatsappNumber}</Link> or reply to this email.
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
            <Text style={unsubscribeText}>
              If you'd prefer not to receive marketing emails, simply reply "unsubscribe".
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default MarketingEmail;

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

const buttonSection = {
  textAlign: "center" as const,
  margin: "28px 0",
};

const button = {
  backgroundColor: "#14b8a6",
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

const unsubscribeText = {
  color: "#3a4460",
  fontSize: "11px",
  marginTop: "12px",
};

const inlineLink = {
  color: "#14b8a6",
  textDecoration: "underline",
};