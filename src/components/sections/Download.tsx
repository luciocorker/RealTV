import { Download, Smartphone, Tv, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import downloaderLogo from "@/assets/downloader.webp";
import tvApkFile from "@/assets/realtv-tv-v5.apk";
import mobileApkFile from "@/assets/real-mobile-v2.apk";
const mobileApkUrl = mobileApkFile;
const tvApkUrl = tvApkFile;
import PhoneMockup from "@/components/PhoneMockup";
import TVMockup from "@/components/TVMockup";

export function DownloadSection() {
  return (
    <section id="download" className="relative py-20 px-4 bg-secondary/30">
      <div className="mx-auto max-w-4xl">
        {/* Section header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            Get Started in{" "}
            <span className="gradient-text">Minutes</span>
          </h2>
          <p className="text-muted-foreground md:text-lg">
            Download our app and start streaming instantly
          </p>
          <p className="mt-2 text-sm text-muted-foreground/80">
            <Tv className="inline h-4 w-4 mr-1" />
            Available for TVs, TV boxes, and mobile phones
          </p>
        </div>

        {/* Device Tabs */}
        <div className="mb-16 rounded-2xl bg-card border border-border overflow-hidden">
          <Tabs defaultValue="phone" className="w-full">
            <div className="flex justify-center pt-8 px-10">
              <TabsList className="gap-1">
                <TabsTrigger value="phone" className="flex items-center gap-2 px-6 py-2">
                  <Smartphone className="h-4 w-4" />
                  Mobile
                </TabsTrigger>
                <TabsTrigger value="tv" className="flex items-center gap-2 px-6 py-2">
                  <Tv className="h-4 w-4" />
                  TV
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Mobile tab */}
            <TabsContent value="phone">
              <div className="flex flex-col items-center gap-8 p-10 pt-6">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 mb-4">
                    <Smartphone className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-primary">Mobile App</span>
                  </div>
                  <h3 className="mb-4 font-display text-2xl font-bold text-foreground md:text-3xl">
                    Watch on Your Phone
                  </h3>
                  <p className="mb-2 text-muted-foreground">
                    Take your favourite channels everywhere. The RealTV mobile app gives you:
                  </p>
                </div>
                <PhoneMockup />
                <p className="text-sm text-muted-foreground italic">Coming soon</p>
              </div>
            </TabsContent>

            {/* TV tab */}
            <TabsContent value="tv">
              <div className="flex flex-col items-center gap-8 px-4 py-6 sm:p-10 sm:pt-6">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 mb-4">
                    <Tv className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-primary">TV App</span>
                  </div>
                  <h3 className="mb-4 font-display text-2xl font-bold text-foreground md:text-3xl">
                    Watch on Your TV
                  </h3>
                  <p className="mb-2 text-muted-foreground">
                    Stream RealTV on your big screen. Compatible with Android TV, Firestick, and Smart TVs.
                  </p>
                </div>
                <TVMockup />
                <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <a href={tvApkUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-5 w-5" />
                    Download TV App
                  </a>
                </Button>
                <div className="flex flex-col items-center gap-2 mt-2">
                  <p className="text-sm text-muted-foreground">Or use the Downloader app:</p>
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card/60 px-5 py-3">
                    <img src={downloaderLogo} alt="Downloader App" className="h-16 w-auto rounded-md" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Enter code</span>
                      <span className="text-lg font-bold tracking-widest text-primary">8920047</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>



        {/* Supported devices */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-sm text-muted-foreground">Supported Devices</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Tv className="h-5 w-5" />
              <span className="text-sm">Android TV</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Tv className="h-5 w-5" />
              <span className="text-sm">Firestick</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Monitor className="h-5 w-5" />
              <span className="text-sm">Smart TV</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Smartphone className="h-5 w-5" />
              <span className="text-sm">Mobile Phone</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
