import { useState } from "react";
import { AlertTriangle, Send, FileText } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { toast } from "sonner";

export const Report = () => {
  const [formData, setFormData] = useState({
    type: "",
    subject: "",
    description: "",
    rideId: "",
    email: "",
  });

  const reportTypes = [
    "Driver Misconduct",
    "Passenger Misconduct",
    "Safety Concern",
    "Payment Issue",
    "Vehicle Condition",
    "Route Deviation",
    "Cancellation Issue",
    "Other",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Report submitted successfully. Our team will review it shortly.");
    setFormData({
      type: "",
      subject: "",
      description: "",
      rideId: "",
      email: "",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12 animate-fade-in">
            <AlertTriangle className="h-16 w-16 text-warning mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Report an Issue</h1>
            <p className="text-lg text-muted-foreground">
              Help us maintain a safe and reliable community. Your report will be reviewed promptly.
            </p>
          </div>

          <div className="bg-card border-2 border-border rounded-2xl shadow-2xl p-8 animate-slide-up">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Report Type <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {reportTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.type === type
                          ? "border-primary bg-primary text-primary-foreground shadow-md"
                          : "border-border hover:border-primary hover:bg-accent"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ride ID */}
              <Input
                label="Ride ID (Optional)"
                placeholder="Enter ride ID if applicable"
                value={formData.rideId}
                onChange={(e) => setFormData({ ...formData, rideId: e.target.value })}
              />

              {/* Subject */}
              <Input
                label="Subject"
                placeholder="Brief description of the issue"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Detailed Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  className="flex w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all min-h-[150px]"
                  placeholder="Please provide as much detail as possible..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              {/* Email */}
              <Input
                type="email"
                label="Your Email"
                placeholder="For follow-up communication"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Attachments (Optional)
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <Input type="file" accept="image/*,.pdf" multiple />
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload screenshots or documents (Max 5MB)
                  </p>
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-warning/10 border-2 border-warning/20 rounded-xl p-4">
                <h3 className="font-semibold text-warning mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Important Notice
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• False reports may result in account suspension</li>
                  <li>• All reports are reviewed within 24-48 hours</li>
                  <li>• You'll receive an email confirmation once reviewed</li>
                  <li>• For emergencies, call 100 (Police) or 108 (Ambulance)</li>
                </ul>
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full">
                <Send className="h-5 w-5 mr-2" />
                Submit Report
              </Button>
            </form>
          </div>

          {/* Support Info */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Need immediate assistance?{" "}
              <a href="mailto:support@savemyseat.com" className="text-primary hover:underline font-medium">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Report;
