import { Tv, Download, UserPlus, CreditCard, CheckCircle2, AppWindow } from "lucide-react";
import downloaderLogo from "@/assets/downloader.webp";
import { Button } from "@/components/ui/button";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const setupSteps = [
  {
    icon: AppWindow,
    title: "Open Downloader App or Chrome",
    description: (
      <>
        <strong className="text-foreground">Option 1:</strong> Download and open the Downloader app from your device's app store
        <br /><br />
        <strong className="text-foreground">Option 2:</strong> Open Chrome browser on your Smart TV / TV Box and go to{" "}
        <a href="http://aftv.news/6211329" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">aftv.news/6211329</a>
      </>
    ),
    showDownloaderLogo: true,
  },
  {
    icon: Download,
    title: "Download RealTV",
    description: (
      <>
        <strong className="text-foreground">Downloader App:</strong> Enter code <span className="text-primary font-bold">6211329</span> and press GO
        <br /><br />
        <strong className="text-foreground">Chrome:</strong> The download will start automatically from the link
      </>
    ),
  },
  {
    icon: CreditCard,
    title: "Choose Your Plan",
    description: (
      <>
        Choose between <strong className="text-foreground">Standard Accounts</strong> or <strong className="text-foreground">DStv Premium Accounts</strong>, select a plan and complete payment. Take a screenshot for Proof of Payment
      </>
    ),
  },
  {
    icon: UserPlus,
    title: "Activate Account",
    description: (
      <>
        Send us your <strong className="text-foreground">Proof of Payment, Name, Email and WhatsApp number</strong> via WhatsApp to activate your account
      </>
    ),
    showWhatsAppButton: true,
  },
  {
    icon: CheckCircle2,
    title: "Start Watching!",
    description: "Log in and enjoy 1000+ channels instantly",
  },
];

export function Setup() {
  return (
    <section id="setup" className="relative py-20 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Section header */}
        <div className="mb-10 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            Easy{" "}
            <span className="gradient-text">Setup Guide</span>
          </h2>
          <p className="text-muted-foreground md:text-lg">
            Get started in just a few minutes with our simple setup process
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
            <Tv className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Android TV Setup</span>
          </div>
        </div>

        {/* Setup Steps */}
        <div className="relative">
          {/* Vertical line connector */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border md:left-1/2 md:-translate-x-1/2 hidden md:block" />
          
          <div className="space-y-6">
            {setupSteps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div
                  key={index}
                  className={`relative flex items-start gap-4 md:gap-8 ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  {/* Step content */}
                  <div className={`flex-1 rounded-xl bg-card p-5 card-hover ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                    <div className={`flex items-center gap-3 mb-2 ${index % 2 === 0 ? "md:flex-row-reverse" : "md:flex-row"}`}>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </span>
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                    {step.showDownloaderLogo && (
                      <div className={`mt-4 flex ${index % 2 === 0 ? "md:justify-end" : "md:justify-start"}`}>
                        <img 
                          src={downloaderLogo} 
                          alt="Downloader App Logo" 
                          className="h-12 w-auto rounded-lg shadow-lg"
                        />
                      </div>
                    )}
                    {step.showWhatsAppButton && (
                      <div className={`mt-4 flex ${index % 2 === 0 ? "md:justify-end" : "md:justify-start"}`}>
                        <Button asChild size="lg" className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 hover:scale-105 font-semibold px-6">
                          <a 
                            href="https://wa.me/27123456789?text=Hi!%20I%20just%20paid%20for%20RealTV.%0A%0AProof%20of%20Payment%3A%20%5BAttach%20Screenshot%5D%0AName%3A%20%0AEmail%3A%20%0AWhatsApp%20Number%3A%20"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <WhatsAppIcon className="mr-2 h-5 w-5" />
                            Activate Now
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Center icon (hidden on mobile) */}
                  <div className="hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary border-4 border-background z-10">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>

                  {/* Empty space for alternating layout */}
                  <div className="hidden md:block flex-1" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Help text */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Contact us on{" "}
            <a 
              href="https://wa.me/27123456789" 
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
            {" "}for assistance
          </p>
        </div>
      </div>
    </section>
  );
}
