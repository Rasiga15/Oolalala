// services/walletApi.ts
import { BASE_URL } from '@/config/api';

export interface WalletResponse {
  wallet_balance: string;
}

export interface Account {
  id: number;
  user_id: number;
  method_type: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string | null;
  account_holder_name: string;
  vpa_address: string | null;
  verification_status: string;
  razorpay_fund_account_id: string;
  is_primary: boolean;
  record_status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  type: 'trip' | 'credit' | 'refund' | 'withdrawal' | 'debit';
  title: string;
  date: string;
  amount: number;
  icon: 'car' | 'wallet' | 'refund' | 'withdrawal';
  bookingId?: string;
  time?: string;
  isCredit?: boolean;
}

export interface PaymentMethod {
  id: number;
  type: string;
  details: string;
  icon: string;
}

export interface WithdrawRequest {
  amount: number;
  payout_method_id: number;
}

export interface WithdrawResponse {
  message: string;
  request: {
    id: number;
    user_id: number;
    payout_method_id: number;
    amount: number;
    status: string;
    updated_at: string;
    created_at: string;
    transaction_reference: string;
  };
}

export interface TransactionsResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  transactions: any[];
}

class WalletApi {
  private static instance: WalletApi;

  static getInstance(): WalletApi {
    if (!WalletApi.instance) {
      WalletApi.instance = new WalletApi();
    }
    return WalletApi.instance;
  }

  async getWalletBalance(token: string): Promise<WalletResponse> {
    try {
      console.log('📱 Fetching wallet balance...');
      
      const response = await fetch(`${BASE_URL}/api/wallet/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Wallet balance fetched:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching wallet balance:', error);
      throw error;
    }
  }

  async getAccounts(token: string): Promise<Account[]> {
    try {
      console.log('📱 Fetching bank accounts...');
      
      const response = await fetch(`${BASE_URL}/api/wallet/accounts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Bank accounts fetched:', data);
      
      return Array.isArray(data) ? data : data.accounts || [];
    } catch (error) {
      console.error('❌ Error fetching bank accounts:', error);
      throw error;
    }
  }

  async withdrawFunds(token: string, withdrawData: WithdrawRequest): Promise<WithdrawResponse> {
    try {
      console.log('📱 Processing withdrawal request...', withdrawData);
      
      const response = await fetch(`${BASE_URL}/api/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(withdrawData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Withdrawal request successful:', data);
      return data;
    } catch (error) {
      console.error('❌ Error processing withdrawal:', error);
      throw error;
    }
  }


  

  async getTransactions(token: string, page: number = 1, limit: number = 50, type?: string): Promise<TransactionsResponse> {
    try {
      console.log('📱 Fetching transactions...');
      
      let url = `${BASE_URL}/api/wallet/transactions?page=${page}&limit=${limit}`;
      if (type) {
        url += `&type=${type}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Transactions fetched:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
      throw error;
    }
  }

  async getPaymentMethods(token: string): Promise<PaymentMethod[]> {
    return [];
  }
}

export default WalletApi.getInstance();

