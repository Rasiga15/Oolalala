interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  handler: (response: any) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: {
    [key: string]: string;
  };
  theme?: {
    color: string;
  };
  modal?: {
    ondismiss: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

class RazorpayUtils {
  private static razorpayLoaded = false;
  private static loadingPromise: Promise<void> | null = null;

  static loadRazorpayScript(): Promise<void> {
    if (window.Razorpay) {
      this.razorpayLoaded = true;
      return Promise.resolve();
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        this.razorpayLoaded = true;
        resolve();
      };
      script.onerror = () => {
        this.loadingPromise = null;
        reject(new Error('Failed to load Razorpay script'));
      };
      document.body.appendChild(script);
    });

    return this.loadingPromise;
  }

  static async initializePayment(options: Omit<RazorpayOptions, 'key'>): Promise<void> {
    // Load the script if not already loaded
    if (!this.razorpayLoaded) {
      await this.loadRazorpayScript();
    }

    const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
    
    if (!key) {
      throw new Error('Razorpay key not found in environment variables');
    }

    const razorpayOptions: RazorpayOptions = {
      key,
      ...options,
      theme: options.theme || { color: '#21409A' },
      modal: options.modal || {
        ondismiss: () => {
          console.log('Payment modal dismissed');
        }
      }
    };

    return new Promise((resolve, reject) => {
      const razorpayInstance = new window.Razorpay(razorpayOptions);
      
      razorpayInstance.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response.error);
        reject(new Error(`Payment failed: ${response.error.description}`));
      });

      razorpayInstance.open();
      
      // Resolve when modal opens
      setTimeout(() => resolve(), 100);
    });
  }

  static formatAmount(amount: number): number {
    // Razorpay expects amount in paise (1 INR = 100 paise)
    return amount * 100;
  }
}

export default RazorpayUtils;