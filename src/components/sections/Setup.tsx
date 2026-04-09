import { Tv, Download, UserPlus, CreditCard, CheckCircle2, AppWindow } from "lucide-react";
import downloaderLogo from "@/assets/downloader.webp";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const setupSteps = [
  {
    icon: AppWindow,
    title: "Open Downloader App or Chrome",
    description: (
      <>
        <strong className="text-foreground">Option 1:</strong> Download and open the Downloader app from your device's app store
        <br /><br />
        <strong className="text-foreground">Option 2:</strong> Open Chrome browser on your Smart TV / TV Box and go to{" "}
        <a href="http://aftv.news/2521810" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">aftv.news/2521810</a>
      </>
    ),
    showDownloaderLogo: true,
  },
  {
    icon: Download,
    title: "Download RealTV",
    description: (
      <>
        <strong className="text-foreground">Downloader App:</strong> Enter code <span className="text-primary font-bold">2521810</span> and press GO
        <br /><br />
        <strong className="text-foreground">Chrome:</strong> The download will start automatically from the link
      </>
    ),
  },
  {
    icon: UserPlus,
    title: "Create Your Account",
    description: (
      <>
        Open the RealTV app, tap <strong className="text-foreground">Create Account</strong> and fill in your details. You'll get a <strong className="text-primary">free 24-hour trial</strong> to explore all channels instantly — no payment required!
      </>
    ),
    showAccountButton: true,
  },
  {
    icon: CreditCard,
    title: "Choose a Plan to Continue",
    description: (
      <>
        When your trial ends, visit our{" "}
        <strong className="text-foreground">Shop</strong> to pick a plan. Choose between{" "}
        <strong className="text-foreground">Standard</strong> or{" "}
        <strong className="text-foreground">DStv Premium</strong> accounts, pay online, and your subscription activates automatically.
      </>
    ),
    showShopButton: true,
  },
  {
    icon: CheckCircle2,
    title: "Start Watching!",
    description: "Log in and enjoy 1000+ channels instantly. Your account stays active as long as your subscription is valid.",
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

        {/* TV Box notice */}
        <div className="mb-8 rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4 text-center text-sm text-yellow-600 dark:text-yellow-400">
          <p className="font-semibold">📺 If you have a Non-Smart TV or LG, Hisense or Samsung Smart TV?</p>
          <p className="mt-1">You'll need a TV box to use RealTV.</p>
          <Button asChild size="sm" className="mt-3">
            <Link to="/shop">Buy a TV Box</Link>
          </Button>
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
                    {step.showAccountButton && (
                      <div className={`mt-4 flex ${index % 2 === 0 ? "md:justify-end" : "md:justify-start"}`}>
                        <Button asChild size="lg" className="font-semibold px-6">
                          <Link to="/account">
                            <UserPlus className="mr-2 h-5 w-5" />
                            Create Account
                          </Link>
                        </Button>
                      </div>
                    )}
                    {step.showShopButton && (
                      <div className={`mt-4 flex ${index % 2 === 0 ? "md:justify-end" : "md:justify-start"}`}>
                        <Button asChild size="lg" variant="outline" className="font-semibold px-6">
                          <Link to="/shop">
                            <CreditCard className="mr-2 h-5 w-5" />
                            View Plans
                          </Link>
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
              href="https://wa.me/27769681973" 
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
