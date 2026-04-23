import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.post('/create-payment', async (req, res) => {
  try {
    const { gateway, amount, currency, invoiceIds, clientEmail, testMode, clientId } = req.body;

    if (!gateway || !amount || !invoiceIds) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const paymentConfig = await prisma.paymentConfig.findFirst({
      where: { gateway, enabled: true },
    });

    if (!paymentConfig) {
      return res.status(404).json({ error: 'Pasarela de pago no configurada. Configure en Settings.' });
    }

    const frontUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const amountCents = Math.round(amount * 100);

    if (gateway === 'stripe') {
      const Stripe = require('stripe');
      const stripeKey = paymentConfig.clientSecret || process.env.STRIPE_SECRET_KEY;
      const isTest = testMode || paymentConfig.testMode;
      
      if (!stripeKey) {
        return res.status(400).json({ error: 'Stripe secret key no configurada' });
      }
      
      const stripe = new Stripe(stripeKey);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: currency.toLowerCase(),
            product_data: { name: `Facturas ISP -${invoiceIds}` },
            unit_amount: amountCents,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${frontUrl}/portal/payment/success?invoices=${invoiceIds}`,
        cancel_url: `${frontUrl}/portal/payment/failure?invoices=${invoiceIds}`,
        customer_email: clientEmail,
        metadata: { invoiceIds },
      });

      return res.json({ url: session.url, sessionId: session.id, sandbox: isTest });
    }

    if (gateway === 'mercadopago') {
      const mpToken = paymentConfig.accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN;
      const isTest = testMode || paymentConfig.testMode;
      
      if (!mpToken) {
        return res.status(400).json({ error: 'Mercado Pago access token no configurado' });
      }
      
      try {
        const apiUrl = isTest 
          ? 'https://api.mercadopago.com/checkout/preferences?access_token=' + mpToken + '&sandbox_mode=true'
          : 'https://api.mercadopago.com/checkout/preferences?access_token=' + mpToken;
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{
              title: `Facturas ISP - ${invoiceIds}`,
              quantity: 1,
              unit_price: amount,
              currency_id: currency,
            }],
            external_reference: invoiceIds,
            back_urls: {
              success: `${frontUrl}/portal/payment/success?invoices=${invoiceIds}`,
              failure: `${frontUrl}/portal/payment/failure?invoices=${invoiceIds}`,
              pending: `${frontUrl}/portal/payment/pending?invoices=${invoiceIds}`,
            },
            sandbox_init_point: isTest ? 'https://sandbox.mercadopago.com.co/checkout/v1/start?pref_id=' : undefined,
          }),
        });
        
        const result = await response.json();
        
        if (result.error) {
          return res.status(400).json({ error: result.error });
        }
        
        const paymentUrl = isTest && result.sandbox_init_point 
          ? result.sandbox_init_point 
          : result.init_point;
        
        return res.json({ url: paymentUrl, prefId: result.id, sandbox: isTest });
      } catch (err) {
        console.error('MercadoPago error:', err);
        return res.status(500).json({ error: String(err) });
      }
    }

    if (gateway === 'wompi') {
      const wompiKey = paymentConfig.clientSecret || process.env.WOMPI_SECRET_KEY;
      const wompiPub = paymentConfig.publicKey || process.env.WOMPI_PUBLIC_KEY;
      const isTest = testMode || paymentConfig.testMode;
      
      if (!wompiKey || !wompiPub) {
        return res.status(400).json({ error: 'Wompi credentials no configuradas' });
      }

      const reference = `INV-${invoiceIds.split(',')[0]}-${Date.now()}`;
      const wompiUrl = isTest ? 'https://sandbox.wompi.co' : 'https://wompi.co';
      
      const redirectUrl = `${wompiUrl}/colombia-gateway?amount=${amountCents}&currency=${currency}&reference=${reference}&redirectUrl=${encodeURIComponent(frontUrl + '/portal/payment/success?invoices=' + invoiceIds)}&returnUrl=${encodeURIComponent(frontUrl + '/portal/payment/failure?invoices=' + invoiceIds)}`;
      
      return res.json({ url: redirectUrl, reference, sandbox: isTest });
    }

    if (gateway === 'placeto_pay') {
      const placetoKey = paymentConfig.clientSecret || process.env.PLACETO_PAY_KEY;
      const placetoId = paymentConfig.merchantId || process.env.PLACETO_PAY_MERCHANT_ID;
      const isTest = testMode || paymentConfig.testMode;
      
      if (!placetoKey || !placetoId) {
        return res.status(400).json({ error: 'PlacetoPay credentials no configuradas' });
      }

      const reference = `INV-${invoiceIds.split(',')[0]}-${Date.now()}`;
      const placetoUrl = isTest ? 'https://checkout.placetopay.com' : 'https://checkout.placetopay.com';
      
      return res.json({ 
        url: `${placetoUrl}/colombia-gateway?amount=${amountCents}&currency=${currency}&reference=${reference}&redirectUrl=${encodeURIComponent(frontUrl + '/portal/payment/success?invoices=' + invoiceIds)}`,
        reference,
        sandbox: isTest,
      });
    }

    if (gateway === 'payu') {
      const payuKey = paymentConfig.clientSecret || process.env.PAYU_API_KEY;
      const payuMerchant = paymentConfig.merchantId || process.env.PAYU_MERCHANT_ID;
      const isTest = testMode || paymentConfig.testMode;
      
      if (!payuKey || !payuMerchant) {
        return res.status(400).json({ error: 'PayU credentials no configuradas' });
      }

      const reference = `INV-${invoiceIds.split(',')[0]}-${Date.now()}`;
      const payuUrl = isTest ? 'https://sandbox.checkout.payulatam.com' : 'https://checkout.payulatam.com';
      
      return res.json({
        url: `${payuUrl}/colombia-gateway?amount=${amountCents}&currency=${currency}&reference=${reference}&merchantId=${payuMerchant}&redirectUrl=${encodeURIComponent(frontUrl + '/portal/payment/success?invoices=' + invoiceIds)}`,
        reference,
        sandbox: isTest,
      });
    }

    return res.status(400).json({ error: `Gateway ${gateway} no soportado` });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: String(error) });
  }
});

router.post('/pay-invoices', async (req, res) => {
  try {
    const { invoiceIds, paymentMethod, paymentRef, notes } = req.body;

    if (!invoiceIds) {
      return res.status(400).json({ error: 'Se requieren invoiceIds' });
    }

    const ids = invoiceIds.split(',').filter(Boolean);
    
    if (ids.length === 0) {
      return res.status(400).json({ error: 'IDs de facturas inválidos' });
    }

    await prisma.invoice.updateMany({
      where: { id: { in: ids } },
      data: { status: 'paid', paidDate: new Date() },
    });

    if (paymentMethod || paymentRef || notes) {
      for (const id of ids) {
        await prisma.notification.create({
          data: {
            title: 'Pago Registrado',
            message: `Factura pagada mediante ${paymentMethod || 'manual'}. Ref: ${paymentRef || 'N/A'}. Notas: ${notes || 'Sin notas'}`,
            type: 'success',
            invoiceId: id,
          },
        });
      }
    }

    res.json({ success: true, updated: ids.length });
  } catch (error) {
    console.error('Pay invoices error:', error);
    res.status(500).json({ error: String(error) });
  }
});

router.post('/webhook/:gateway', async (req, res) => {
  try {
    const { gateway } = req.params;
    const body = req.body;

    if (gateway === 'stripe') {
      const invoiceIds = body.data?.object?.metadata?.invoiceIds;
      if (invoiceIds && body.type === 'checkout.session.completed') {
        const ids = invoiceIds.split(',');
        await prisma.invoice.updateMany({
          where: { id: { in: ids } },
          data: { status: 'paid', paidDate: new Date() },
        });
      }
    }

    if (gateway === 'mercadopago') {
      const externalRef = body.external_reference;
      if (body.status === 'approved' && externalRef) {
        const ids = externalRef.split(',');
        await prisma.invoice.updateMany({
          where: { id: { in: ids } },
          data: { status: 'paid', paidDate: new Date() },
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.get('/invoices', async (req, res) => {
  try {
    const { dni, email } = req.query;
    
    if (!dni || !email) {
      return res.status(400).json({ error: 'Se requiere DNI y email' });
    }
    
    const client = await prisma.client.findFirst({
      where: {
        dni: String(dni),
        email: String(email).toLowerCase(),
      },
    });
    
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    const invoices = await prisma.invoice.findMany({
      where: { clientId: client.id },
      include: {
        client: {
          select: { name: true, lastName: true, email: true }
        }
      },
      orderBy: { dueDate: 'desc' },
    });
    
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.get('/client/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    
    const client = await prisma.client.findFirst({
      where: { dni },
      include: { plan: true, mikrotik: true },
    });
    
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.get('/invoices-by-ids', async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ error: 'Se requieren IDs' });
    }
    
    const idArray = String(ids).split(',');
    
    const invoices = await prisma.invoice.findMany({
      where: { id: { in: idArray } },
      select: { id: true, amount: true, status: true, period: true },
    });
    
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;