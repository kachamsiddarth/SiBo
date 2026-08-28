> ## Documentation Index
> Fetch the complete documentation index at: https://razorpay-881012b3.mintlify.site/llms.txt
> Use this file to discover all available pages before exploring further.

# Settlements - Dashboard Actions

> View settlement details, check the settlements break-up, enable settlements on hold and view reports from the Razorpay Dashboard.

<div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:"0.35rem 0.9rem",border:"1px solid rgba(128,128,128,0.28)",borderRadius:"0.5rem",padding:"0.45rem 0.75rem",margin:"0 0 1.25rem",fontSize:"0.875rem"}}>
  <span style={{fontWeight:600}}>Available in</span>
  <span>🇮🇳 India</span>
  <span>🇸🇬 Singapore</span>
  <span>🇺🇸 United States</span>
</div>

## View Settlements Using Dashboard

You can view details of settlements made to you from the Dashboard.

* View a detailed break-down of the amount settled to you from the Dashboard.
* View details, such as the total settlement amount (credit + debit amount), applicable service fees, service tax, adjustments, and so on.

Watch this video to see how to view settlements from the Dashboard.

<iframe width="560" height="315" src="https://www.youtube.com/embed/mmn2WkrmKwI?si=y3kf7FxP07YhHEpZ" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />

To view settlement details:

1. Log in to the Dashboard.
2. Navigate to **Settlements**.
3. Click on the **details** of the settlement ID that you wish to refer to.

### View Channel-Wise Settlements

<AccordionGroup>
  <Accordion title="Benefits of Channel-Wise Settlements">
    * **Zero cross-channel failures**: POS settlements will not fail due to online refunds.
    * **Clear fund visibility**: Know exactly how much you have in each channel.
  </Accordion>
</AccordionGroup>

If you are an omni-channel business (Online (Domestic transactions + International Cards)) or cross-border business (Alternate Payment Method (International)), your settlements are processed separately for each channel type. This provides complete fund isolation and eliminates cross-channel settlement failures.

### Understand Segregated Settlements

With balance segregation, settlements are organised by channel type:

| Channel Type                                         | Description                                                                                              | Transactions Included                                                                      | Additional Details                                                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Online (Domestic transactions + International Cards) | Domestic online payments and international card transactions                                             | PG domestic transactions (cards, UPI, netbanking and wallets), international card payments | Supports Instant Settlements.                                                                                      |
| In-Person                                            | POS terminal transactions                                                                                | All POS/offline transactions                                                               | POS device rentals are automatically collected from this balance. Operates independently from online transactions. |
| Alternate Payment Method (International)             | Balance from international payment methods such as PayPal, Stripe and other cross-border payment methods | International bank transfers, cross-border payments via supported APM providers            | Settled separately from domestic balances. Subject to forex conversion and international settlement timelines.     |

<img src="https://razorpay.com/docs/build/browser/assets/images/account-settings-settlements-details-segg-bal.jpg" alt="razorpay settlements details" width="800" />

Each channel type has its own settlement schedule and settlement history.

#### View Settlements by Channel

To view channel-wise settlements:

1. Log in to the Dashboard.
2. Navigate to **Settlements**.
3. Use the **Balance Type** filter to select the channel you want to view:

   * **Online (Domestic transactions + International Cards)**
   * **In-Person**
   * **Alternate Payment Method (International)**

The settlements list will display only settlements for the selected channel.

#### Settlement Cards on Home Page

On the Dashboard home page, you will see separate settlement cards for each active balance:

* Each card shows the current balance, last settlement amount and next settlement date.
* Click on any card to view detailed settlement history for that channel.

<Info>
  **Handy Tips**

  With segregated balances, you can now enable Instant Settlements for your PG Online balance even if you have POS or Cross-Border enabled. Previously, Instant setting were restricted for cross-border and omni-channel businesses.
</Info>

### View Settlements Using API

You can view settlement details using the [Settlements API](/docs/api/settlements).

### Settlements Break-Up Description

The following screenshot displays the settlement break-up:

<img src="https://razorpay.com/docs/build/browser/assets/images/settlements-2.jpg" alt="Settlement break-up description image" width="400" />

A settlement has the following components:

`Payment`
: The total payment amount that is being settled before deductions.

`Adjustment`
: Adjustments to transactions, if any.

`Tax`
: Tax deducted on the payment.

`Fee`
: Fees deducted by Razorpay for the transactions.

`Transfer`
: Transfers made if any, Transfers are payouts made to your [linked accounts](/docs/payments/route/linked-account).

Linked accounts are accounts created for third-party sellers by you after onboarding them onto the Razorpay platform.

`Refunds`
: Refunds made if any, are refunds you have issued to your customer.

<AccordionGroup>
  <Accordion title="Example">
    In this example, the amount settled to your account = Payment - Adjustment - Tax - Fee - Transfer + Refunds

    | Transaction Details                  | Amount(₹) |
    | ------------------------------------ | --------- |
    | Payment                              | 50.00     |
    | Refunds                              | 10.00     |
    | Tax                                  | 2.88      |
    | Fee                                  | 16.00     |
    | Total amount settled in your account | 20.94     |
  </Accordion>
</AccordionGroup>

<AccordionGroup>
  <Accordion title="Example: Gross Settelements and Deductions Calculations">
    Following is an example of gross settlements and deductions calculations of your settlement:

    <img src="https://razorpay.com/docs/build/browser/assets/images/settlement-components-view.jpg" alt="settlement components detail view" width="800" />

    The gross settlements and deductions calculations only apply to merchants on the prepaid model.
  </Accordion>
</AccordionGroup>

## View Settlement Timeline on Dashboard

You can view the settlement timeline to check when the settlement for a particular payment will be credited.

To view the settlement timeline:

1. Log in to the Dashboard.
2. Navigate to **Settlements**.
3. Click on the **details** of the settlement id for which you want to view the timeline.
4. You will be able to see the settlement timeline for that particular settlement id.

<img src="https://razorpay.com/docs/build/browser/assets/images/settlements-details-timeline.jpg" alt="Razorpay Dashboard - View settlement timeline" width="800" />

## Enable Settlements Placed On Hold

Your settlement can be placed on hold if we detect some risk with your payments or with your Razorpay account. You are notified about this on your Dashboard.

Contact the [support team](https://razorpay.com/support) to enable settlements that are placed on hold.

<img src="https://razorpay.com/docs/build/browser/assets/images/settlements-risk-soh-notice.jpg" alt="Settlements placed on hold" width="800" />

To enable settlements when they are put on hold:

1. Log in to the Dashboard.
2. Navigate to **Home**.
3. Click **Resolve** on the notification as shown above..

## Reports

Detailed insights can be gained using reports and real-time data on the Dashboard. These reports can then be used for accounting and reconciliation purposes. Know more about [reports.](/docs/payments/dashboard/reports)

### Channel-Wise Settlement Reports

For businesses with segregated balances, settlement reports include:

* **Channel Type**: Identifies whether the transaction was from Online (Domestic transactions + International Cards), In-person and Alternate Payment Method (International).
* **Balance Account id**: Unique identifier for the specific balance account.

You can filter reports by channel type to reconcile settlements for each balance separately.

### Related Information

* [About Settlements](/docs/payments/settlements)
* [Settlements API](/docs/payments/settlements/apis)
* [Settlement FAQs](/docs/payments/settlements/faqs)
