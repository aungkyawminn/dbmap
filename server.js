import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { initializeApp } from 'firebase/app';
import crypto from 'crypto';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore/lite';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to check if Upgrade & AI Credits feature is enabled
function getEnableUpgradeCreditsFromEnv() {
  const flag = process.env.VITE_ENABLE_UPGRADE_CREDITS ??
               process.env.ENABLE_UPGRADE_CREDITS ??
               process.env.VITE_ENABLE_UPDATE_CREDITS ??
               process.env.ENABLE_UPDATE_CREDITS ??
               process.env.VITE_ENABLE_AI_CREDITS ??
               process.env.ENABLE_AI_CREDITS;
  if (flag !== undefined && flag !== '') {
    const s = String(flag).toLowerCase().trim();
    return s === 'true' || s === '1' || s === 'yes' || s === 'on';
  }
  return true;
}

// Initialize Firebase App for server-side persistence & token accounting
let db = null;
let serverFirebaseConfig = null;
try {
  const firebaseConfigPath = path.join(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(firebaseConfigPath)) {
    serverFirebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    const fbApp = initializeApp(serverFirebaseConfig, 'server-app');
    db = getFirestore(fbApp, serverFirebaseConfig.firestoreDatabaseId);
    console.log('Server Firebase Firestore initialized successfully.');
  }
} catch (e) {
  console.warn('Server Firebase initialization warning:', e.message);
}

// Default System Tier Configurations
const DEFAULT_SYSTEM_CONFIG = {
  aiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  freeTierMonthlyCredits: 50000,
  proTierMonthlyCredits: 1000000,
  freeMaxPromptLength: 3000,
  proMaxPromptLength: 20000,
  tallySaleInvoiceUrl: process.env.TALLYSALE_PAYMENT_URL || process.env.TALLYSALE_API_URL || 'https://api.tallysale.com',
  enableUpgradeCredits: getEnableUpgradeCreditsFromEnv(),
  updatedAt: new Date().toISOString()
};

// Model Pricing & Credit Multiplier Matrix (Rates per 1,000,000 tokens USD)
const MODEL_RATES = {
  'gemini-3.8-flash': {
    inputPerMillion: 0.075,
    outputPerMillion: 0.30,
    creditMultiplier: 1.0,
    displayName: 'Gemini 3.8 Flash',
    tier: 'standard'
  },
  'gemini-2.5-flash': {
    inputPerMillion: 0.075,
    outputPerMillion: 0.30,
    creditMultiplier: 1.0,
    displayName: 'Gemini 2.5 Flash',
    tier: 'standard'
  },
  'gemini-3.1-pro-preview': {
    inputPerMillion: 1.25,
    outputPerMillion: 5.00,
    creditMultiplier: 5.0,
    displayName: 'Gemini 3.1 Pro Preview',
    tier: 'pro'
  },
  'gemini-2.5-pro': {
    inputPerMillion: 1.25,
    outputPerMillion: 5.00,
    creditMultiplier: 5.0,
    displayName: 'Gemini 2.5 Pro',
    tier: 'pro'
  },
  'gemini-3.1-flash-lite': {
    inputPerMillion: 0.0375,
    outputPerMillion: 0.15,
    creditMultiplier: 0.5,
    displayName: 'Gemini 3.1 Flash Lite',
    tier: 'lite'
  }
};

function getModelMetrics(modelName) {
  const normalized = (modelName || '').toLowerCase().trim();
  if (MODEL_RATES[normalized]) {
    return MODEL_RATES[normalized];
  }
  // Substring matching
  if (normalized.includes('pro')) {
    return {
      inputPerMillion: 1.25,
      outputPerMillion: 5.00,
      creditMultiplier: 5.0,
      displayName: modelName,
      tier: 'pro'
    };
  }
  if (normalized.includes('lite')) {
    return {
      inputPerMillion: 0.0375,
      outputPerMillion: 0.15,
      creditMultiplier: 0.5,
      displayName: modelName,
      tier: 'lite'
    };
  }
  return {
    inputPerMillion: 0.075,
    outputPerMillion: 0.30,
    creditMultiplier: 1.0,
    displayName: modelName || 'gemini-3.8-flash',
    tier: 'standard'
  };
}

function calculateEstimatedCostUsd(modelName, promptTokens, completionTokens) {
  const rates = getModelMetrics(modelName);
  const pTokens = Number(promptTokens) || 0;
  const cTokens = Number(completionTokens) || 0;
  const inputCost = (pTokens * rates.inputPerMillion) / 1000000;
  const outputCost = (cTokens * rates.outputPerMillion) / 1000000;
  return Number((inputCost + outputCost).toFixed(6));
}

function calculateCreditsDeducted(modelName, rawTokens) {
  const rates = getModelMetrics(modelName);
  const tokens = Number(rawTokens) || 0;
  return Math.max(1, Math.round(tokens * rates.creditMultiplier));
}

// Helper: Get System Config from Firestore or default
async function getSystemConfig() {
  const envTallyUrl = process.env.TALLYSALE_PAYMENT_URL || process.env.TALLYSALE_API_URL || 'https://api.tallysale.com';
  const enableUpgrade = getEnableUpgradeCreditsFromEnv();
  const envModel = process.env.GEMINI_MODEL;
  if (!db) return { ...DEFAULT_SYSTEM_CONFIG, tallySaleInvoiceUrl: envTallyUrl, enableUpgradeCredits: enableUpgrade };
  try {
    const configSnap = await getDoc(doc(db, 'system', 'config'));
    if (configSnap.exists()) {
      const data = configSnap.data();
      if (process.env.TALLYSALE_PAYMENT_URL || process.env.TALLYSALE_API_URL) {
        data.tallySaleInvoiceUrl = envTallyUrl;
      } else if (!data.tallySaleInvoiceUrl || data.tallySaleInvoiceUrl.includes('guide.tallysale.com')) {
        data.tallySaleInvoiceUrl = 'https://api.tallysale.com';
      }
      return {
        ...DEFAULT_SYSTEM_CONFIG,
        ...data,
        aiModel: data.aiModel || envModel || DEFAULT_SYSTEM_CONFIG.aiModel,
        enableUpgradeCredits: enableUpgrade
      };
    }
  } catch (e) {
    const isOffline = e.message?.includes('offline') || e.message?.includes('Cloud Firestore API') || e.message?.includes('is disabled');
    if (!isOffline) {
      console.warn('Error reading system config from Firestore:', e.message);
    }
  }
  return { ...DEFAULT_SYSTEM_CONFIG, tallySaleInvoiceUrl: envTallyUrl, enableUpgradeCredits: enableUpgrade };
}

// Helper: Get or Initialize User Profile with Tier & Credit Balance
async function getUserProfile(userId, email = '', displayName = '') {
  const sysConfig = await getSystemConfig();
  const isAdminUser = (email && email.toLowerCase() === 'aungkyawminn.aya@gmail.com');
  const defaultTier = isAdminUser ? 'pro' : 'free';
  const defaultRole = isAdminUser ? 'admin' : 'user';
  const defaultAllowance = defaultTier === 'pro' ? sysConfig.proTierMonthlyCredits : sysConfig.freeTierMonthlyCredits;
  const defaultPromptLimit = defaultTier === 'pro' ? sysConfig.proMaxPromptLength : sysConfig.freeMaxPromptLength;

  if (!db || !userId || userId === 'guest') {
    return {
      uid: userId || 'guest',
      email: email || 'guest@dbmap.io',
      displayName: displayName || 'Guest Developer',
      tier: 'free',
      role: 'user',
      creditsRemaining: sysConfig.freeTierMonthlyCredits,
      monthlyCreditAllowance: sysConfig.freeTierMonthlyCredits,
      creditsUsedTotal: 0,
      maxPromptLength: sysConfig.freeMaxPromptLength,
      lastResetDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const currentTier = data.tier || defaultTier;
      const currentRole = (email && email.toLowerCase() === 'aungkyawminn.aya@gmail.com') ? 'admin' : (data.role || 'user');
      const allowance = currentTier === 'pro' ? sysConfig.proTierMonthlyCredits : sysConfig.freeTierMonthlyCredits;
      const promptLimit = currentTier === 'pro' ? sysConfig.proMaxPromptLength : sysConfig.freeMaxPromptLength;

      // Auto monthly credit reset check (if lastResetDate is over 30 days old)
      let creditsRemaining = typeof data.creditsRemaining === 'number' ? data.creditsRemaining : allowance;
      let lastResetDate = data.lastResetDate || new Date().toISOString();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      if (new Date() - new Date(lastResetDate) > thirtyDaysMs) {
        creditsRemaining = allowance;
        lastResetDate = new Date().toISOString();
        await updateDoc(userRef, {
          creditsRemaining,
          monthlyCreditAllowance: allowance,
          lastResetDate,
          updatedAt: new Date().toISOString()
        });
      }

      return {
        uid: userId,
        email: email || data.email || '',
        displayName: displayName || data.displayName || 'Developer',
        tier: currentTier,
        role: currentRole,
        creditsRemaining,
        monthlyCreditAllowance: allowance,
        creditsUsedTotal: data.creditsUsedTotal || 0,
        maxPromptLength: promptLimit,
        hasCompletedTour: Boolean(data.hasCompletedTour),
        lastResetDate,
        updatedAt: data.updatedAt || new Date().toISOString()
      };
    } else {
      // Create new user profile in Firestore
      const newUser = {
        uid: userId,
        email: email || 'user@dbmap.io',
        displayName: displayName || 'Developer',
        tier: defaultTier,
        role: defaultRole,
        creditsRemaining: defaultAllowance,
        monthlyCreditAllowance: defaultAllowance,
        creditsUsedTotal: 0,
        maxPromptLength: defaultPromptLimit,
        hasCompletedTour: false,
        lastResetDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(userRef, newUser);
      return newUser;
    }
  } catch (e) {
    const isOffline = e.message?.includes('offline') || e.message?.includes('Cloud Firestore API') || e.message?.includes('is disabled');
    if (!isOffline) {
      console.error('getUserProfile Firestore Error:', e.message);
    }
    return {
      uid: userId,
      email: email || '',
      displayName: displayName || 'Developer',
      tier: 'free',
      role: 'user',
      creditsRemaining: sysConfig.freeTierMonthlyCredits,
      monthlyCreditAllowance: sysConfig.freeTierMonthlyCredits,
      creditsUsedTotal: 0,
      maxPromptLength: sysConfig.freeMaxPromptLength,
      hasCompletedTour: false,
      lastResetDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  // Health Endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasTallySaleKey: !!process.env.TALLYSALE_API_KEY,
      hasTallySaleSecret: !!process.env.TALLYSALE_API_SECRET,
      firestoreConnected: !!db
    });
  });

  // Token cache to avoid repetitive network roundtrips (5 min TTL)
  const tokenCache = new Map();

  // Helper to verify Firebase ID Token using Google Identity Toolkit
  async function verifyFirebaseToken(idToken) {
    if (!idToken || typeof idToken !== 'string') return null;
    const cleanToken = idToken.trim();
    if (!cleanToken) return null;

    const cached = tokenCache.get(cleanToken);
    if (cached && cached.exp > Date.now()) {
      return cached.user;
    }

    const apiKey = serverFirebaseConfig?.apiKey || process.env.FIREBASE_API_KEY;
    if (!apiKey) {
      console.warn('[Auth] No Firebase API Key available for token verification');
      return null;
    }

    try {
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: cleanToken })
      });
      const data = await response.json();
      if (response.ok && data.users && data.users.length > 0) {
        const u = data.users[0];
        const verifiedUser = {
          uid: u.localId,
          email: (u.email || '').toLowerCase().trim(),
          emailVerified: Boolean(u.emailVerified),
          displayName: u.displayName || ''
        };
        tokenCache.set(cleanToken, { user: verifiedUser, exp: Date.now() + 5 * 60 * 1000 });
        if (tokenCache.size > 1000) {
          const now = Date.now();
          for (const [k, v] of tokenCache.entries()) {
            if (v.exp <= now) tokenCache.delete(k);
          }
        }
        return verifiedUser;
      }
      return null;
    } catch (err) {
      console.error('[Auth] Token verification network error:', err.message);
      return null;
    }
  }

  // Check if user is an authorized administrator
  const ROOT_ADMIN_EMAILS = [
    'aungkyawminn.aya@gmail.com',
    (process.env.ADMIN_EMAIL || '').toLowerCase().trim()
  ].filter(Boolean);

  async function checkIsAdmin(user) {
    if (!user || !user.email) return false;
    const email = user.email.toLowerCase().trim();
    if (ROOT_ADMIN_EMAILS.includes(email)) return true;

    if (db && user.uid) {
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists() && userSnap.data().role === 'admin') {
          return true;
        }
      } catch (e) {
        console.warn('[Auth] Admin role lookup warning:', e.message);
      }
    }
    return false;
  }

  // Middleware: Optional Auth (binds verified user to req.user if Authorization header is provided)
  async function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      req.user = await verifyFirebaseToken(token);
    }
    next();
  }

  // Middleware: Require Auth
  async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    const token = authHeader.substring(7);
    const user = await verifyFirebaseToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
    }
    req.user = user;
    next();
  }

  // Middleware: Require Admin
  async function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Admin authentication required. Please sign in with an administrator account.' });
    }
    const token = authHeader.substring(7);
    const user = await verifyFirebaseToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired authentication credentials.' });
    }
    const isAdmin = await checkIsAdmin(user);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Administrator privileges required.' });
    }
    req.user = user;
    next();
  }

  // Webhook Logs in-memory store for admin audit/debugging
  const webhookLogsList = [];

  function getTallyConfig(overrides = {}) {
    const appKey = overrides.app_key || process.env.TALLYSALE_APP_KEY || process.env.TALLYSALE_API_KEY || '';
    const appSecret = overrides.app_secret || process.env.TALLYSALE_APP_SECRET || process.env.TALLYSALE_API_SECRET || '';
    let apiBaseUrl = overrides.api_base_url || process.env.TALLYSALE_API_BASE_URL || process.env.TALLYSALE_API_URL || process.env.TALLYSALE_PAYMENT_URL || 'https://api.tallysale.com';
    apiBaseUrl = apiBaseUrl.replace(/\/+$/, '');
    const portalBaseUrl = (overrides.portal_base_url || process.env.TALLYSALE_PORTAL_URL || 'https://tallysale.com').replace(/\/+$/, '');
    return { appKey, appSecret, apiBaseUrl, portalBaseUrl };
  }

  // TallySale API: Create Invoice (Signs with HMAC-SHA256 and calls POST /v1/invoices)
  const handleCreateInvoiceRoute = async (req, res) => {
    try {
      const {
        customer_name,
        customer_email,
        customer_phone,
        userId = 'guest',
        userEmail = '',
        userName = '',
        items,
        currency = 'MMK',
        plan = 'pro',
        notes = '',
        metadata = {},
        _config = {}
      } = req.body || {};

      const { appKey, appSecret, apiBaseUrl } = getTallyConfig(_config);
      const appUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
      const priceAmount = currency === 'USD' ? (plan === 'pro' ? 29 : 10) : (plan === 'pro' ? 15000 : 5000);
      const orderRef = 'DBMAPS-' + (plan.toUpperCase()) + '-' + Date.now();

      const invoicePayload = {
        customer_name: customer_name || userName || (userEmail ? userEmail.split('@')[0] : 'dbmaps Developer'),
        customer_email: customer_email || userEmail || 'developer@dbmaps.io',
        customer_phone: customer_phone || null,
        external_reference_id: orderRef,
        external_customer_id: userId || null,
        currency: currency || 'MMK',
        invoice_date: new Date().toISOString().split('T')[0],
        items: items && items.length > 0 ? items : [
          {
            description: plan === 'pro' ? 'Pro Tier Subscription (1,000,000 AI Credits)' : 'AI Credits Top-Up',
            quantity: 1,
            unit_price: priceAmount
          }
        ],
        metadata: {
          source: 'dbmaps',
          userId,
          plan,
          ...metadata
        },
        backend_callback_url: `${appUrl}/api/tallysale/webhook`,
        frontend_redirect_url: `${appUrl}/?paid=1`
      };

      // HMAC Signing: Signature = HMAC-SHA256(timestamp + "." + raw_json_body, app_secret)
      const jsonBody = JSON.stringify(invoicePayload);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = crypto.createHmac('sha256', appSecret).update(timestamp + '.' + jsonBody).digest('hex');

      console.log(`[TallySale API] Calling ${apiBaseUrl}/invoices with appKey: ${appKey.slice(0, 8)}...`);

      let tallyResponse = null;
      let rawText = '';
      let responseData = null;
      let networkError = null;

      try {
        tallyResponse = await fetch(`${apiBaseUrl}/invoices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-App-Key': appKey,
            'X-Signature': signature,
            'X-Timestamp': timestamp
          },
          body: jsonBody
        });

        rawText = await tallyResponse.text();
        try {
          responseData = JSON.parse(rawText);
        } catch (parseErr) {
          responseData = { message: rawText };
        }
      } catch (err) {
        networkError = err;
        console.warn('[TallySale API] Direct fetch error:', err.message);
      }

      // Handle successful response from TallySale
      if (tallyResponse && tallyResponse.ok && responseData) {
        const invoiceData = responseData.data || responseData;
        const checkoutUrl = invoiceData.checkout_url || invoiceData.payment_url || invoiceData.url || (responseData.data && responseData.data.checkout_url) || null;
        invoiceData.checkout_url = checkoutUrl;

        // Save record in Firestore
        if (db) {
          const reqId = 'pay-' + (invoiceData.id || Date.now());
          await setDoc(doc(db, 'payment_requests', reqId), {
            id: reqId,
            userId,
            userEmail: invoicePayload.customer_email,
            invoiceRef: invoiceData.invoice_number || invoicePayload.external_reference_id,
            tallyInvoiceId: invoiceData.id || null,
            checkoutUrl,
            requestedTier: plan,
            currency,
            amountPaid: invoiceData.total_amount || priceAmount,
            status: invoiceData.status || 'PENDING',
            notes: notes || 'TallySale Invoicing Created',
            createdAt: new Date().toISOString()
          }, { merge: true }).catch(e => console.warn('Firestore write note:', e.message));
        }

        return res.json({
          status: 'success',
          success: true,
          isConfigured: true,
          data: invoiceData,
          invoice: invoiceData,
          checkout_url: checkoutUrl
        });
      }

      // Fallback if TallySale host is not responding or returned error
      console.log('[TallySale Fallback/Simulated] Logging invoice request:', networkError ? networkError.message : (responseData?.message || tallyResponse?.status));
      const simulatedInvoiceId = 'inv_' + Date.now().toString(36);
      const simulatedInvoice = {
        id: simulatedInvoiceId,
        invoice_number: 'TS-' + Date.now().toString().slice(-6),
        external_reference_id: orderRef,
        customer_name: invoicePayload.customer_name,
        customer_email: invoicePayload.customer_email,
        currency,
        total_amount: priceAmount,
        status: 'PENDING',
        checkout_url: null,
        created_at: new Date().toISOString(),
        items: invoicePayload.items
      };

      if (db) {
        const reqId = 'pay-' + Date.now();
        await setDoc(doc(db, 'payment_requests', reqId), {
          id: reqId,
          userId,
          userEmail: invoicePayload.customer_email,
          invoiceRef: simulatedInvoice.invoice_number,
          requestedTier: plan,
          currency,
          amountPaid: priceAmount,
          status: 'PENDING',
          notes: notes || (networkError ? `Local fallback (${networkError.message})` : 'Invoice reference logged'),
          createdAt: new Date().toISOString()
        }, { merge: true }).catch(e => console.warn('Firestore write note:', e.message));
      }

      return res.status(tallyResponse ? tallyResponse.status : 200).json({
        status: tallyResponse && tallyResponse.ok ? 'success' : 'pending',
        success: true,
        isConfigured: true,
        offlineMode: !tallyResponse?.ok,
        message: networkError ? `TallySale API reached offline fallback: ${networkError.message}` : (responseData?.message || 'Invoice created and logged.'),
        data: responseData?.data || simulatedInvoice,
        invoice: responseData?.data || simulatedInvoice,
        rawResponse: responseData
      });
    } catch (err) {
      console.error('Create Invoice Error:', err);
      res.status(500).json({ error: err.message });
    }
  };

  app.post('/api/tallysale/create-invoice', handleCreateInvoiceRoute);
  app.post('/api.php', (req, res, next) => {
    if (req.query.action === 'create-invoice') return handleCreateInvoiceRoute(req, res);
    if (req.query.action === 'merchant-sso-url') return handleMerchantSsoRoute(req, res);
    if (req.query.action === 'verify-payment') return handleVerifyPaymentRoute(req, res);
    if (req.query.action === 'webhook') return handleWebhookRoute(req, res);
    if (req.query.action === 'webhook-logs') return handleWebhookLogsRoute(req, res);
    next();
  });

  // Merchant SSO URL: Generates SSO URL with HMAC signature for Customer Portal
  const handleMerchantSsoRoute = async (req, res) => {
    try {
      const { email, _config = {}, portal_base_url } = req.body || {};
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const { appKey, appSecret, portalBaseUrl: defaultPortalUrl } = getTallyConfig(_config);
      const targetPortalUrl = (portal_base_url || defaultPortalUrl).replace(/\/+$/, '');

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = crypto.createHmac('sha256', appSecret).update(timestamp + '.' + email).digest('hex');

      const ssoUrl = `${targetPortalUrl}/auth/merchant-sso?app_key=${encodeURIComponent(appKey)}&email=${encodeURIComponent(email)}&timestamp=${encodeURIComponent(timestamp)}&signature=${encodeURIComponent(signature)}`;

      res.json({ success: true, url: ssoUrl });
    } catch (err) {
      console.error('Merchant SSO Error:', err);
      res.status(500).json({ error: err.message });
    }
  };

  app.post('/api/tallysale/merchant-sso-url', handleMerchantSsoRoute);

  // Payment Status Verification & PGW AYA Verification Forwarding
  const handleVerifyPaymentRoute = async (req, res) => {
    try {
      const {
        payload,
        checkSum,
        merchOrderId,
        requestId,
        invoiceRef,
        invoiceId,
        userId = 'guest',
        _config = {}
      } = req.body || {};

      const { apiBaseUrl } = getTallyConfig(_config);
      const sysConfig = await getSystemConfig();

      // 1. Forward AYA PGW payment callback to customer-backend verification endpoint
      if (payload && checkSum && merchOrderId) {
        console.log('[TallySale Verify] Forwarding AYA PGW callback to backend:', `${apiBaseUrl}/payments/verify/apg`);
        let pgwVerifyResult = null;
        try {
          const verifyRes = await fetch(`${apiBaseUrl}/payments/verify/apg`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ payload, checkSum, merchOrderId })
          });
          const verifyText = await verifyRes.text();
          try { pgwVerifyResult = JSON.parse(verifyText); } catch (e) { pgwVerifyResult = { message: verifyText }; }
        } catch (fetchErr) {
          console.warn('[TallySale Verify] PGW forwarding error:', fetchErr.message);
        }

        // Activate Pro Tier for user in Firestore
        if (db && userId) {
          await setDoc(doc(db, 'users', userId), {
            uid: userId,
            tier: 'pro',
            creditsRemaining: sysConfig.proTierMonthlyCredits,
            monthlyCreditAllowance: sysConfig.proTierMonthlyCredits,
            maxPromptLength: sysConfig.proMaxPromptLength,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }

        return res.json({
          success: true,
          paid: true,
          message: 'Payment verification completed! Pro Tier activated on your account.',
          tier: 'pro',
          details: pgwVerifyResult
        });
      }

      // 2. Query Firestore / Invoice directly
      let targetReqId = requestId;
      let targetRef = invoiceRef;
      let existingPayDoc = null;

      if (db) {
        if (targetReqId) {
          const docSnap = await getDoc(doc(db, 'payment_requests', targetReqId));
          if (docSnap.exists()) existingPayDoc = docSnap.data();
        }
        if (!existingPayDoc && targetRef) {
          const snap = await getDocs(query(collection(db, 'payment_requests'), where('invoiceRef', '==', targetRef)));
          snap.forEach(d => {
            targetReqId = d.id;
            existingPayDoc = d.data();
          });
        }
      }

      if (existingPayDoc && existingPayDoc.status === 'APPROVED') {
        if (db && userId) {
          await setDoc(doc(db, 'users', userId), {
            uid: userId,
            tier: 'pro',
            creditsRemaining: sysConfig.proTierMonthlyCredits,
            monthlyCreditAllowance: sysConfig.proTierMonthlyCredits,
            maxPromptLength: sysConfig.proMaxPromptLength,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
        return res.json({
          success: true,
          paid: true,
          message: 'Payment verified! Pro Tier has been activated on your account.',
          tier: 'pro'
        });
      }

      // If user confirms payment or verified
      return res.json({
        success: true,
        paid: false,
        status: existingPayDoc?.status || 'PENDING',
        message: 'Payment verification is pending. Please complete checkout on the TallySale portal.'
      });
    } catch (err) {
      console.error('Verify Payment error:', err);
      res.status(500).json({ error: err.message });
    }
  };

  app.post('/api/tallysale/verify-payment', handleVerifyPaymentRoute);

  // Webhook Receiver (Strict HMAC-SHA256 verified)
  const handleWebhookRoute = async (req, res) => {
    try {
      const { appSecret } = getTallyConfig();
      if (!appSecret) {
        console.error('[Webhook] TallySale App Secret is not configured on server.');
        return res.status(500).json({ error: 'Webhook secret is not configured on server.' });
      }

      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
      const appKey = req.headers['x-app-key'] || req.headers['x-api-key'] || '';
      const signature = req.headers['x-signature'] || req.headers['x-api-signature'] || '';
      const timestamp = req.headers['x-timestamp'] || req.headers['x-api-timestamp'] || '';

      if (!signature || !timestamp) {
        console.warn('[Webhook] Rejected webhook request with missing signature or timestamp headers.');
        return res.status(401).json({ error: 'Missing x-signature or x-timestamp headers.' });
      }

      // Enforce timestamp freshness (within 5 minutes = 300 seconds) to prevent replay attacks
      const tsNum = parseInt(timestamp, 10);
      const currentEpoch = Math.floor(Date.now() / 1000);
      if (isNaN(tsNum) || Math.abs(currentEpoch - tsNum) > 300) {
        console.warn(`[Webhook] Rejected webhook with stale or future timestamp: ${timestamp} (server: ${currentEpoch})`);
        return res.status(401).json({ error: 'Webhook timestamp expired or invalid.' });
      }

      // Verify HMAC-SHA256 signature using constant-time comparison
      const expectedSig = crypto.createHmac('sha256', appSecret).update(timestamp + '.' + rawBody).digest('hex');
      const expectedBuf = Buffer.from(expectedSig, 'utf8');
      const signatureBuf = Buffer.from(signature, 'utf8');
      const verified = expectedBuf.length === signatureBuf.length && crypto.timingSafeEqual(expectedBuf, signatureBuf);

      if (!verified) {
        console.warn('[Webhook] Rejected webhook with invalid HMAC signature.');
        return res.status(401).json({ error: 'Invalid webhook signature.' });
      }

      const logEntry = {
        received_at: new Date().toISOString(),
        verified: true,
        app_key: appKey,
        headers: {
          'x-app-key': appKey,
          'x-signature': signature,
          'x-timestamp': timestamp
        },
        payload: typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
      };

      webhookLogsList.unshift(logEntry);
      if (webhookLogsList.length > 50) webhookLogsList.pop();

      console.log('[TallySale Webhook Verified & Received]', logEntry);

      const parsedPayload = logEntry.payload;
      const data = parsedPayload.data || parsedPayload;
      const status = (data.status || parsedPayload.status || '').toUpperCase();
      const event = (parsedPayload.event || parsedPayload.action || '').toLowerCase();
      const isPaid = event.includes('paid') || status === 'PAID' || status === 'COMPLETED' || status === 'SUCCESS';

      if (isPaid) {
        const sysConfig = await getSystemConfig();
        const customerEmail = data.customer_email || parsedPayload.customer_email;
        const externalRef = data.external_reference_id || parsedPayload.external_reference_id || data.invoice_number;

        if (db) {
          // Update matching payment request
          if (externalRef) {
            const paySnap = await getDocs(query(collection(db, 'payment_requests'), where('invoiceRef', '==', String(externalRef))));
            paySnap.forEach(pDoc => {
              updateDoc(doc(db, 'payment_requests', pDoc.id), {
                status: 'APPROVED',
                reviewedAt: new Date().toISOString()
              }).catch(e => console.warn(e.message));
            });
          }

          // Update user tier by email
          if (customerEmail) {
            const usersSnap = await getDocs(query(collection(db, 'users'), where('email', '==', customerEmail)));
            usersSnap.forEach(uDoc => {
              updateDoc(doc(db, 'users', uDoc.id), {
                tier: 'pro',
                creditsRemaining: sysConfig.proTierMonthlyCredits,
                monthlyCreditAllowance: sysConfig.proTierMonthlyCredits,
                maxPromptLength: sysConfig.proMaxPromptLength,
                updatedAt: new Date().toISOString()
              }).catch(e => console.warn(e.message));
            });
          }
        }
      }

      if (req.method === 'GET') {
        return res.redirect('/?paid=1');
      }

      res.json({ status: 'ok', success: true, message: 'Webhook received and verified successfully.' });
    } catch (err) {
      console.error('Webhook Error:', err);
      res.status(500).json({ error: err.message });
    }
  };

  app.all(['/api/tallysale/webhook', '/api/tallysale/callback', '/api/tallysale/return'], handleWebhookRoute);

  // Webhook Logs Viewer (Restricted to Administrators)
  const handleWebhookLogsRoute = (req, res) => {
    if (req.headers.accept && req.headers.accept.includes('text/plain')) {
      const formatted = webhookLogsList.map(l => JSON.stringify(l, null, 2)).join('\n---\n');
      return res.type('text/plain').send(formatted || 'No webhooks received yet. Complete a payment to see callbacks here.');
    }
    res.json({ logs: webhookLogsList, count: webhookLogsList.length });
  };

  app.get('/api/tallysale/webhook-logs', requireAdmin, handleWebhookLogsRoute);

  // Fetch or Sync User Profile with Tier & Credits (Uses verified user if logged in)
  app.get('/api/user-profile', optionalAuth, async (req, res) => {
    try {
      let { userId = 'guest', email = '', displayName = '' } = req.query;
      if (req.user) {
        userId = req.user.uid;
        email = req.user.email;
        displayName = req.user.displayName || displayName;
      }
      const profile = await getUserProfile(userId, email, displayName);
      const sysConfig = await getSystemConfig();
      res.json({ success: true, profile, sysConfig });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Mark First-Time Onboarding Tour as Completed for User Profile
  app.post('/api/user-profile/complete-tour', optionalAuth, async (req, res) => {
    try {
      let { userId } = req.body || {};
      if (req.user && req.user.uid) {
        userId = req.user.uid;
      }
      if (!userId || userId === 'guest') {
        return res.json({ success: true, message: 'Guest tour completed locally' });
      }

      if (db) {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
          uid: userId,
          hasCompletedTour: true,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      res.json({ success: true, userId, hasCompletedTour: true });
    } catch (err) {
      console.warn('Error marking tour completed:', err.message);
      res.json({ success: true, warning: err.message, hasCompletedTour: true });
    }
  });

  // AI Schema Generation Endpoint with Token Metering & Tier Limits
  app.post('/api/generate-schema', optionalAuth, async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please add your API key in AI Studio Settings.'
        });
      }

      const {
        prompt,
        dialect = 'postgres',
        mode = 'new',
        existingTables = [],
        userId = 'guest',
        userEmail = '',
        userName = ''
      } = req.body;

      // Bind identity strictly to authenticated token credentials if signed in
      const effectiveUserId = req.user ? req.user.uid : (userId || 'guest');
      const effectiveEmail = req.user ? req.user.email : (userEmail || '');
      const effectiveName = req.user ? (req.user.displayName || userName || '') : (userName || '');

      // Guard: Presto AI is available exclusively for signed-in users to onboard on the platform
      if (!req.user && (!userId || userId === 'guest')) {
        return res.status(401).json({
          error: 'Sign in required: Presto AI Schema Assistant is available for registered users. Please sign in with Google to claim 50,000 free monthly AI credits.',
          requiresAuth: true
        });
      }

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ error: 'Please provide a prompt describing your database requirements.' });
      }

      const sysConfig = await getSystemConfig();
      const userProfile = await getUserProfile(effectiveUserId, effectiveEmail, effectiveName);

      // 1. Validate Prompt Length against User Tier Max Prompt Limit
      const maxPromptLength = userProfile.maxPromptLength || (userProfile.tier === 'pro' ? sysConfig.proMaxPromptLength : sysConfig.freeMaxPromptLength);
      if (prompt.length > maxPromptLength) {
        return res.status(400).json({
          error: `Prompt length (${prompt.length} characters) exceeds your ${userProfile.tier.toUpperCase()} tier limit of ${maxPromptLength} characters. Please shorten your prompt or upgrade to Pro via TallySale.`,
          tier: userProfile.tier,
          promptLength: prompt.length,
          maxPromptLength
        });
      }

      // 2. Estimate required tokens for prompt (approx 1 token per 3.5 chars)
      const estimatedPromptTokens = Math.ceil(prompt.length / 3.5) + 350; // prompt + system instruction
      if (userProfile.creditsRemaining <= 0 || userProfile.creditsRemaining < estimatedPromptTokens) {
        return res.status(402).json({
          error: `Insufficient AI credits. You have ${userProfile.creditsRemaining.toLocaleString()} credits remaining, but this request requires approx ${estimatedPromptTokens.toLocaleString()} credits. Please upgrade your tier or top up credits via TallySale!`,
          creditsRemaining: userProfile.creditsRemaining,
          estimatedPromptTokens,
          tier: userProfile.tier,
          tallySaleInvoiceUrl: sysConfig.tallySaleInvoiceUrl
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `You are an expert principal database architect and ERD schema designer.
Your task is to generate or extend a clean relational database schema based on the user's prompt.
Target SQL Dialect: ${dialect}.

Guidelines:
1. Generate intuitive snake_case table and column names (e.g. user_id, created_at, total_amount).
2. Set 'pk': true for Primary Keys (usually 'id').
3. Set 'fk': true for Foreign Keys (e.g. 'user_id', 'order_id').
4. Set 'notNull': true for compulsory fields.
5. Set 'unique': true for email, username, sku, slug, etc.
6. Provide accurate, dialect-specific data types (e.g., integer, varchar(255), text, boolean, timestamp, decimal(10,2), uuid).
7. Generate valid foreign key relationships:
   - fromTable: table containing the foreign key (child)
   - fromColumn: foreign key column name
   - toTable: referenced parent table
   - toColumn: primary key column name in parent table (usually 'id')
   - type: '1:N', '1:1', or 'N:M'
8. Pick attractive hex header colors for tables (#3b82f6, #10b981, #f59e0b, #8b5cf6, #ec4899, #06b6d4, #6366f1, #ef4444).`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          schemaName: { type: Type.STRING, description: "Short descriptive title for the generated schema" },
          description: { type: Type.STRING, description: "Detailed architectural summary of the generated schema" },
          tables: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Table name in snake_case" },
                comment: { type: Type.STRING, description: "Purpose of the table" },
                headerColor: { type: Type.STRING, description: "Hex color code" },
                columns: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      type: { type: Type.STRING },
                      pk: { type: Type.BOOLEAN },
                      fk: { type: Type.BOOLEAN },
                      notNull: { type: Type.BOOLEAN },
                      unique: { type: Type.BOOLEAN },
                      comment: { type: Type.STRING }
                    },
                    required: ["name", "type"]
                  }
                }
              },
              required: ["name", "columns"]
            }
          },
          relationships: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                fromTable: { type: Type.STRING },
                fromColumn: { type: Type.STRING },
                toTable: { type: Type.STRING },
                toColumn: { type: Type.STRING },
                type: { type: Type.STRING }
              },
              required: ["fromTable", "fromColumn", "toTable", "toColumn"]
            }
          }
        },
        required: ["schemaName", "tables", "relationships"]
      };

      let contentPrompt = `User Requirement: ${prompt}`;
      if (mode === 'extend' && existingTables.length > 0) {
        contentPrompt += `\n\nExtend the existing database schema structure: ${JSON.stringify(
          existingTables.map(t => ({ name: t.name, columns: t.columns.map(c => c.name) }))
        )}`;
      }

      const chosenModel = (sysConfig.aiModel && typeof sysConfig.aiModel === 'string' && sysConfig.aiModel.trim())
        ? sysConfig.aiModel.trim()
        : (process.env.GEMINI_MODEL || 'gemini-3.8-flash');

      console.log(`[AI Engine] Executing schema generation with Gemini model: ${chosenModel}`);

      const response = await ai.models.generateContent({
        model: chosenModel,
        contents: contentPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Received empty response from Gemini API');
      }

      const parsedSchema = JSON.parse(responseText);

      // Extract exact token counts from response.usageMetadata
      let promptTokens = response.usageMetadata?.promptTokenCount;
      let completionTokens = response.usageMetadata?.candidatesTokenCount;
      let totalTokens = response.usageMetadata?.totalTokenCount;

      if (!totalTokens) {
        promptTokens = Math.ceil((contentPrompt.length + systemInstruction.length) / 3.5);
        completionTokens = Math.ceil(responseText.length / 3.5);
        totalTokens = promptTokens + completionTokens;
      }

      // Calculate model-specific credit deductions and estimated API costs
      const rawTokens = totalTokens;
      const modelMetrics = getModelMetrics(chosenModel);
      const creditsDeducted = calculateCreditsDeducted(chosenModel, rawTokens);
      const estimatedCostUsd = calculateEstimatedCostUsd(chosenModel, promptTokens, completionTokens);

      console.log(`[AI Metering] Model: ${chosenModel} | Raw Tokens: ${rawTokens} (Prompt: ${promptTokens}, Comp: ${completionTokens}) | Multiplier: ${modelMetrics.creditMultiplier}x | Deducting Credits: ${creditsDeducted} | Est Cost: $${estimatedCostUsd}`);

      // Deduct model-calculated credits from user balance in Firestore
      let updatedCredits = Math.max(0, userProfile.creditsRemaining - creditsDeducted);
      let updatedCreditsUsed = (userProfile.creditsUsedTotal || 0) + creditsDeducted;

      if (db && effectiveUserId && effectiveUserId !== 'guest') {
        try {
          const userRef = doc(db, 'users', effectiveUserId);
          await updateDoc(userRef, {
            creditsRemaining: updatedCredits,
            creditsUsedTotal: updatedCreditsUsed,
            updatedAt: new Date().toISOString()
          });

          // Log token, credit, and estimated USD cost usage entry
          const logId = 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
          await setDoc(doc(db, 'usage_logs', logId), {
            id: logId,
            userId: effectiveUserId,
            email: effectiveEmail || userProfile.email || '',
            tier: userProfile.tier,
            promptLength: prompt.length,
            promptTokens,
            completionTokens,
            rawTokens,
            creditMultiplier: modelMetrics.creditMultiplier,
            totalTokens: creditsDeducted, // Backward-compatible field
            creditsDeducted,
            estimatedCostUsd,
            dialect,
            model: chosenModel,
            timestamp: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn('Failed to deduct user credits in Firestore:', dbErr.message);
        }
      }

      res.json({
        success: true,
        schema: parsedSchema,
        model: chosenModel,
        usage: {
          promptTokens,
          completionTokens,
          rawTokens,
          creditMultiplier: modelMetrics.creditMultiplier,
          totalTokensDeducted: creditsDeducted,
          creditsDeducted,
          estimatedCostUsd,
          creditsRemaining: updatedCredits,
          tier: userProfile.tier
        }
      });
    } catch (err) {
      console.error('API /api/generate-schema Error:', err);
      let errorMsg = err.message || 'An error occurred while generating the database schema.';
      if (errorMsg.includes('resource_exhausted') || errorMsg.includes('quota') || errorMsg.includes('429')) {
        errorMsg = `Gemini API quota exceeded or model overloaded for current model. You can switch to another model (e.g., gemini-3.8-flash, gemini-3.1-flash-lite, or gemini-2.5-flash) directly in the Admin Control Center (System Config) or retry shortly.`;
      }
      res.status(500).json({ error: errorMsg });
    }
  });

  // Submit Payment Request (TallySale Invoice Proof) - Authenticated users only
  app.post('/api/payment-request', requireAuth, async (req, res) => {
    try {
      const { invoiceRef, requestedTier = 'pro', notes = '' } = req.body;
      if (!invoiceRef || typeof invoiceRef !== 'string' || !invoiceRef.trim()) {
        return res.status(400).json({ error: 'Please provide your TallySale Invoice Reference Number.' });
      }

      const reqId = 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const paymentDoc = {
        id: reqId,
        userId: req.user.uid,
        userEmail: req.user.email || 'user@dbmap.io',
        invoiceRef: invoiceRef.trim(),
        requestedTier,
        amountPaid: requestedTier === 'pro' ? 29 : 10,
        status: 'PENDING',
        notes: (notes || '').trim(),
        createdAt: new Date().toISOString()
      };

      if (db) {
        await setDoc(doc(db, 'payment_requests', reqId), paymentDoc);
      }

      res.json({ success: true, payment: paymentDoc });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get User's Payment Requests - Authenticated users only (users can see own, admin can query any)
  app.get('/api/payment-requests', requireAuth, async (req, res) => {
    try {
      if (!db) return res.json({ success: true, requests: [] });

      const isAdmin = await checkIsAdmin(req.user);
      const targetUserId = (isAdmin && req.query.userId) ? req.query.userId : req.user.uid;

      const q = query(
        collection(db, 'payment_requests'),
        where('userId', '==', targetUserId)
      );
      const snap = await getDocs(q);
      const requests = [];
      snap.forEach(docSnap => requests.push(docSnap.data()));
      requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.json({ success: true, requests });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Get All Users & Usage (Restricted to Administrators)
  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      if (!db) return res.json({ success: true, users: [] });

      const snap = await getDocs(collection(db, 'users'));
      const users = [];
      snap.forEach(d => users.push(d.data()));
      users.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

      res.json({ success: true, users });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Update User Tier or Top Up Credits (Restricted to Administrators)
  app.post('/api/admin/update-user', requireAdmin, async (req, res) => {
    try {
      const { targetUserId, newTier, addBonusCredits = 0, exactCredits, role } = req.body;
      if (!db || !targetUserId) {
        return res.status(400).json({ error: 'Missing target user ID' });
      }

      const sysConfig = await getSystemConfig();
      const userRef = doc(db, 'users', targetUserId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userSnap.data();
      const tier = newTier || userData.tier || 'free';
      const monthlyAllowance = tier === 'pro' ? sysConfig.proTierMonthlyCredits : sysConfig.freeTierMonthlyCredits;
      const promptLimit = tier === 'pro' ? sysConfig.proMaxPromptLength : sysConfig.freeMaxPromptLength;

      let creditsRemaining = userData.creditsRemaining || monthlyAllowance;
      if (typeof exactCredits === 'number') {
        creditsRemaining = Math.max(0, Math.round(exactCredits));
      } else {
        if (newTier && newTier !== userData.tier) {
          creditsRemaining = monthlyAllowance; // Reset allowance when tier changes
        }
        if (addBonusCredits > 0) {
          creditsRemaining += addBonusCredits;
        }
      }

      const updates = {
        tier,
        creditsRemaining,
        monthlyCreditAllowance: monthlyAllowance,
        maxPromptLength: promptLimit,
        updatedAt: new Date().toISOString()
      };
      if (role) updates.role = role;

      await updateDoc(userRef, updates);
      res.json({ success: true, updatedUser: { ...userData, ...updates } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Create / Provision User Account (Restricted to Administrators)
  app.post('/api/admin/create-user', requireAdmin, async (req, res) => {
    try {
      const { email, displayName, tier = 'free', role = 'user', initialCredits } = req.body;
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'A valid email address is required' });
      }

      if (!db) {
        return res.status(500).json({ error: 'Database is not initialized' });
      }

      const cleanEmail = email.toLowerCase().trim();
      const sysConfig = await getSystemConfig();
      const targetTier = tier === 'pro' ? 'pro' : 'free';
      const targetRole = role === 'admin' ? 'admin' : 'user';
      const monthlyAllowance = targetTier === 'pro' ? sysConfig.proTierMonthlyCredits : sysConfig.freeTierMonthlyCredits;
      const promptLimit = targetTier === 'pro' ? sysConfig.proMaxPromptLength : sysConfig.freeMaxPromptLength;
      const credits = typeof initialCredits === 'number' && initialCredits >= 0 ? Math.round(initialCredits) : monthlyAllowance;

      // Check if user with this email already exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', cleanEmail));
      const existingSnaps = await getDocs(q);
      if (!existingSnaps.empty) {
        return res.status(409).json({ error: `A user account with email "${cleanEmail}" already exists` });
      }

      const generatedUid = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      const newUserDoc = {
        uid: generatedUid,
        email: cleanEmail,
        displayName: (displayName || cleanEmail.split('@')[0]).trim(),
        tier: targetTier,
        role: targetRole,
        creditsRemaining: credits,
        monthlyCreditAllowance: monthlyAllowance,
        creditsUsedTotal: 0,
        maxPromptLength: promptLimit,
        hasCompletedTour: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastResetDate: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', generatedUid), newUserDoc);
      res.json({ success: true, user: newUserDoc });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Delete User Account (Restricted to Administrators)
  app.post('/api/admin/delete-user', requireAdmin, async (req, res) => {
    try {
      const { targetUserId } = req.body;
      if (!targetUserId) {
        return res.status(400).json({ error: 'Target user ID is required' });
      }
      if (!db) {
        return res.status(500).json({ error: 'Database is not initialized' });
      }
      await deleteDoc(doc(db, 'users', targetUserId));
      res.json({ success: true, deletedUserId: targetUserId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Get All Payment Requests & Usage Logs (Restricted to Administrators)
  app.get('/api/admin/payment-requests', requireAdmin, async (req, res) => {
    try {
      if (!db) return res.json({ success: true, requests: [], logs: [], metricsSummary: null });

      const paySnap = await getDocs(collection(db, 'payment_requests'));
      const requests = [];
      paySnap.forEach(d => requests.push(d.data()));
      requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const logSnap = await getDocs(collection(db, 'usage_logs'));
      const rawLogs = [];
      logSnap.forEach(d => rawLogs.push(d.data()));
      rawLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Enrich logs with model-specific metrics & cost breakdowns
      const logs = rawLogs.slice(0, 100).map(log => {
        const modelName = log.model || 'gemini-3.8-flash';
        const metrics = getModelMetrics(modelName);
        const pTokens = log.promptTokens || Math.round((log.totalTokens || 0) * 0.7);
        const cTokens = log.completionTokens || Math.round((log.totalTokens || 0) * 0.3);
        const rTokens = log.rawTokens || (pTokens + cTokens);
        const multiplier = typeof log.creditMultiplier === 'number' ? log.creditMultiplier : metrics.creditMultiplier;
        const creditsDeducted = typeof log.creditsDeducted === 'number'
          ? log.creditsDeducted
          : Math.max(1, Math.round(rTokens * multiplier));
        const estimatedCostUsd = typeof log.estimatedCostUsd === 'number'
          ? log.estimatedCostUsd
          : calculateEstimatedCostUsd(modelName, pTokens, cTokens);

        return {
          ...log,
          model: modelName,
          promptTokens: pTokens,
          completionTokens: cTokens,
          rawTokens: rTokens,
          creditMultiplier: multiplier,
          creditsDeducted,
          estimatedCostUsd
        };
      });

      const metricsSummary = {
        totalRequests: logs.length,
        totalRawTokens: logs.reduce((acc, l) => acc + (l.rawTokens || 0), 0),
        totalCreditsDeducted: logs.reduce((acc, l) => acc + (l.creditsDeducted || 0), 0),
        totalEstimatedCostUsd: Number(logs.reduce((acc, l) => acc + (l.estimatedCostUsd || 0), 0).toFixed(5))
      };

      res.json({ success: true, requests, logs, metricsSummary });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Approve Payment & Grant Pro Tier (Restricted to Administrators)
  app.post('/api/admin/approve-payment', requireAdmin, async (req, res) => {
    try {
      const { requestId, status = 'APPROVED' } = req.body;
      if (!db || !requestId) {
        return res.status(400).json({ error: 'Missing request ID' });
      }

      const sysConfig = await getSystemConfig();
      const reqRef = doc(db, 'payment_requests', requestId);
      const reqSnap = await getDoc(reqRef);

      if (!reqSnap.exists()) {
        return res.status(404).json({ error: 'Payment request not found' });
      }

      const reqData = reqSnap.data();
      await updateDoc(reqRef, {
        status,
        reviewedAt: new Date().toISOString()
      });

      if (status === 'APPROVED' && reqData.userId) {
        const userRef = doc(db, 'users', reqData.userId);
        await setDoc(userRef, {
          uid: reqData.userId,
          email: reqData.userEmail || '',
          tier: 'pro',
          creditsRemaining: sysConfig.proTierMonthlyCredits,
          monthlyCreditAllowance: sysConfig.proTierMonthlyCredits,
          maxPromptLength: sysConfig.proMaxPromptLength,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      res.json({ success: true, requestId, status });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Public / User: Get System Configurations
  app.get('/api/system-config', async (req, res) => {
    try {
      const config = await getSystemConfig();
      res.json({
        success: true,
        config,
        modelRates: MODEL_RATES,
        currentModelMetrics: getModelMetrics(config.aiModel)
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Get/Update System Configurations (Restricted to Administrators)
  app.post('/api/admin/system-config', requireAdmin, async (req, res) => {
    try {
      const {
        aiModel,
        freeTierMonthlyCredits,
        proTierMonthlyCredits,
        freeMaxPromptLength,
        proMaxPromptLength,
        tallySaleInvoiceUrl,
        applyToExistingFreeUsers
      } = req.body;

      const parseNumber = (val, fallback) => {
        const num = Number(val);
        return !isNaN(num) && num >= 0 ? Math.round(num) : fallback;
      };

      const validAiModel = (aiModel && typeof aiModel === 'string' && aiModel.trim())
        ? aiModel.trim()
        : (process.env.GEMINI_MODEL || DEFAULT_SYSTEM_CONFIG.aiModel);

      const updatedConfig = {
        aiModel: validAiModel,
        freeTierMonthlyCredits: parseNumber(freeTierMonthlyCredits, DEFAULT_SYSTEM_CONFIG.freeTierMonthlyCredits),
        proTierMonthlyCredits: parseNumber(proTierMonthlyCredits, DEFAULT_SYSTEM_CONFIG.proTierMonthlyCredits),
        freeMaxPromptLength: parseNumber(freeMaxPromptLength, DEFAULT_SYSTEM_CONFIG.freeMaxPromptLength),
        proMaxPromptLength: parseNumber(proMaxPromptLength, DEFAULT_SYSTEM_CONFIG.proMaxPromptLength),
        tallySaleInvoiceUrl: tallySaleInvoiceUrl || DEFAULT_SYSTEM_CONFIG.tallySaleInvoiceUrl,
        updatedAt: new Date().toISOString()
      };

      let updatedUsersCount = 0;
      if (db) {
        await setDoc(doc(db, 'system', 'config'), updatedConfig);

        if (applyToExistingFreeUsers) {
          const usersSnap = await getDocs(collection(db, 'users'));
          const updatePromises = [];
          usersSnap.forEach((userDoc) => {
            const data = userDoc.data();
            if (!data.tier || data.tier === 'free') {
              updatedUsersCount++;
              updatePromises.push(
                updateDoc(doc(db, 'users', userDoc.id), {
                  monthlyCreditAllowance: updatedConfig.freeTierMonthlyCredits,
                  creditsRemaining: updatedConfig.freeTierMonthlyCredits,
                  updatedAt: new Date().toISOString()
                })
              );
            }
          });
          if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
          }
        }
      }

      res.json({ success: true, config: updatedConfig, updatedUsersCount });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  const publicPath = path.join(process.cwd(), 'public');
  app.use(express.static(publicPath));

  const httpServer = http.createServer(app);

  let vite = null;
  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is in use, retrying in 1s...`);
      setTimeout(() => {
        try { httpServer.close(); } catch (_) {}
        httpServer.listen(PORT, '0.0.0.0');
      }, 1000);
    } else {
      console.error('Server error:', err);
    }
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });

  const handleShutdown = async (signal) => {
    console.log(`Received ${signal}, shutting down server gracefully...`);
    if (vite) {
      try { await vite.close(); } catch (_) {}
    }
    httpServer.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 3000);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
