import { Download, Smartphone, Tv, Monitor, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function DownloadSection() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const downloaderCode = "8489967";

  const copyCode = () => {
    navigator.clipboard.writeText(downloaderCode);
    setCopied(true);
    toast({
      title: "Code copied!",
      description: "Paste this code in the Downloader app",
    });
    setTimeout(() => setCopied(false), 2000);
  };

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
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* APK Download */}
          <div className="rounded-xl bg-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <Download className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
              Android APK
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Download directly to your Android device
            </p>
            <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <a href="https://www.mediafire.com/file/example/RealTV.apk" target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Download APK
              </a>
            </Button>
          </div>

          {/* Downloader App Code */}
          <div className="rounded-xl bg-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <Tv className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
              Downloader App
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              For Firestick, Android TV & Smart TVs
            </p>
            <div className="mb-4 flex items-center justify-center gap-2">
              <span className="rounded-lg bg-secondary px-4 py-2 font-mono text-2xl font-bold text-primary">
                {downloaderCode}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={copyCode}
                className="border-border"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-accent" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter this code in the Downloader app
            </p>
          </div>
        </div>

        {/* Supported devices */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-sm text-muted-foreground">Supported Devices</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Smartphone className="h-5 w-5" />
              <span className="text-sm">Android</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Tv className="h-5 w-5" />
              <span className="text-sm">Firestick</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Monitor className="h-5 w-5" />
              <span className="text-sm">Smart TV</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
