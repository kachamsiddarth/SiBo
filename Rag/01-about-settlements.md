> ## Documentation Index
> Fetch the complete documentation index at: https://razorpay-881012b3.mintlify.site/llms.txt
> Use this file to discover all available pages before exploring further.

# About Settlements

> Check how Razorpay settles money received from your customers to your bank account- Settlement Cycle, Partial Settlements and Settlement States.

<div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:"0.35rem 0.9rem",border:"1px solid rgba(128,128,128,0.28)",borderRadius:"0.5rem",padding:"0.45rem 0.75rem",margin:"0 0 1.25rem",fontSize:"0.875rem"}}>
  <span style={{fontWeight:600}}>Available in</span>
  <span>🇮🇳 India</span>
  <span>🇸🇬 Singapore</span>
  <span>🇺🇸 United States</span>
</div>

Settlement is the process in which the money received from your customers is settled in your bank account. Settlements for all payments are done in INR (Indian Rupees), irrespective of the currency in which the customer made the payment. Once Razorpay receives the amount, it is settled in your bank account after deducting fees.

#### Prerequisites

Following are some of the prerequisites for settlements of payments from customers to your bank account:

* Your account must be KYC approved.
* Your account must be fully activated for payments to be settled to your bank account. Know more about [KYC Verification](/docs/payments/set-up#2-submit-kyc-details).
* The payment must be captured. Know more about [capturing payments](/docs/payments/payments/capture-settings).

## Settlement Cycle

We automatically settle captured payments to the bank account you submitted to us during your [KYC verification](/docs/payments/set-up#2-submit-kyc-details) following our settlement cycle. The settlement cycle is subject to bank approval and can vary based on your business vertical, risk factors and so on.

<img src="https://razorpay.com/docs/build/browser/assets/images/dashboard-guide-settlement_cycle.jpg" alt="Checkout screen with details of Settlement Cycle" width="300" />

<Info>
  **Handy Tips**

  Working days do not include the bank holidays.
</Info>

## Domestic Settlements

The standard settlement cycle for domestic payments is **T+2** working days (where **T** is the date of transaction capture).

<AccordionGroup>
  <Accordion title="Example">
    You captured 20 payments on February 02, 2019 at 9:00 a.m., and your settlement schedule is **T+2** days. The payments you captured on February 02, 2019 is settled to your bank account on February 04, 2019 at 9:00 a.m. If the settlement day is a bank holiday, the settlement is made on the next working day after the bank holiday.
  </Accordion>
</AccordionGroup>

## International Settlements

The default settlement cycle for international payments is as per applicable law(s). You can view your settlement cycle on the Razorpay Dashboard.

Settlements for all payments is done in INR (Indian Rupees), irrespective of the currency in which the payment was made. The payment is converted using the exchange rate at the time of payment creation.

Razorpay allows you to accept payments in any of the [supported international currencies](/docs/payments/international-payments#supported-currencies).

<AccordionGroup>
  <Accordion title="Example">
    You captured 7 international payments on February 02, 2019 and your settlement schedule is T+7 days 9:00 a.m. The payments you captured on February 02, 2019 is settled in your account on February 09, 2019 at 9:00 a.m.If the settlement day is a bank holiday, the settlement is made on the next working day after the bank holiday.
  </Accordion>
</AccordionGroup>

## Instant Settlements

Using Instant Settlements, you can access your funds as and when you want. Normally, you would receive settlements according to your settlement cycle. Razorpay Instant Settlements helps you reduce your settlement period from **T+2** days (default settlement cycle) to a few minutes (from the time of the transaction), thus enabling your business to avoid cash-flow challenges and prepare better for working capital requirements. Know more about [Instant Settlements](/docs/payments/settlements/instant).

<Info>
  **Feature Request**

  This is an on-demand feature. Please raise a request with our [Support team](https://razorpay.com/support/#request) to get this feature activated on your Razorpay account.
</Info>

## Partial Settlements

Razorpay initiates partial settlements when your amount that requires settlement exceeds your current live balance (when the settlement is scheduled). Razorpay accurately calculates the amount that requires settlement based on the live balance, ensuring that settlements are not skipped. When settling transactions, we will only choose the ones that add up to your current live balance.

This ensures that your settlements are timely and regular and you can maintain stable cash flow.

<AccordionGroup>
  <Accordion title="Example 1">
    You captured a payment of ₹1000 on July 02, 2023, and your settlement schedule is T+2 days 5:00 p.m. Hence, the live balance is ₹1000, which will be the settlement amount.

    However, on July 02, 2023, you had to refund your customer ₹100. Due to this, your live balance is ₹900. As the current live balance is lesser than the settlement scheduled, Razorpay will initiate partial settlements and settle your current live balance of ₹900.
  </Accordion>

  <Accordion title="Example 2">
    You captured three payments of P1 - ₹500, P2 - ₹300 and P3 - ₹200 on July 02, 2023, and your settlement schedule is T+2 days 5:00 p.m. Hence, the live balance is ₹1000, which will be the settlement amount.

    However, on July 02, 2023, you had to refund your customer ₹100. Due to this, your live balance is ₹900. As the current live balance is lesser than the settlement scheduled, Razorpay will initiate partial settlements and settle transactions P1 and P2 on T+2 as it adds upto ₹900. P3 will be scheduled for the next day, shown as an upcoming settlement, and paid in the next slot.
  </Accordion>
</AccordionGroup>

## Settlement States

Following are the various states of a settlement:

<img src="https://razorpay.com/docs/build/browser/assets/images/dashboard-guide-settlement_life_cycle.jpg" class="click-zoom" alt="Settlement Life Cycle flow" width="700" />

Some reasons for settlement failure:

* Your bank account is inactive or frozen.
* Incorrect bank account details.
* The settlement was rejected by your bank.

## Dashboard Actions

You can perform the following actions from the Razorpay Dashboard:

* [View settlement details](/docs/payments/settlements/dashboard#view-settlements-using-dashboard)
* [Check settlements break-up](/docs/payments/settlements/dashboard#settlements-break-up-description)
* [Enable settlements on hold](/docs/payments/settlements/dashboard#enable-settlements-placed-on-hold)
* [View reports related to settlements](/docs/payments/settlements/dashboard#reports)

### Related Information

* [Settlements APIs](/docs/payments/settlements/apis)
* [Settlement FAQs](/docs/payments/settlements/faqs)
