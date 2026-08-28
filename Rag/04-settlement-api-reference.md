> ## Documentation Index
> Fetch the complete documentation index at: https://razorpay-881012b3.mintlify.site/llms.txt
> Use this file to discover all available pages before exploring further.

# Settlements

> Fetch Settlements and Settlements Recon information using Razorpay APIs.

<div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:"0.35rem 0.9rem",border:"1px solid rgba(128,128,128,0.28)",borderRadius:"0.5rem",padding:"0.45rem 0.75rem",margin:"0 0 1.25rem",fontSize:"0.875rem"}}>
  <span style={{fontWeight:600}}>Available in</span>
  <span>🇮🇳 India</span>
  <span>🇸🇬 Singapore</span>
</div>

Razorpay [Settlements](/docs/payments/settlements) is the process in which the money received from your customers is settled to your bank account. You can manage settlements using APIs or from the [Dashboard](/docs/payments/settlements/dashboard).<br /><br />

Captured payments are automatically settled to the bank account submitted to us as part of your KYC verification as per your [settlement cycle](/docs/payments/settlements#settlement-cycle).<br /><br />

Fork the Razorpay Postman Public Workspace and try the Settlements APIs using your [Test API Keys](/docs/payments/dashboard/account-settings/api-keys#generate-api-keys).

<CardGroup cols={2}>
  <Card title="Fetch All Settlements" href="/docs/api/settlements/fetch-all">
    `GET` `/v1/settlements/`

    Retrieves all settlements.
  </Card>

  <Card title="Fetch Settlements With ID" href="/docs/api/settlements/fetch-with-id">
    `GET` `/v1/settlements/:id`

    Retrieves settlements with id.
  </Card>

  <Card title="Fetch Settlement Recon Details" href="/docs/api/settlements/fetch-recon">
    `GET` `/v1/settlements/recon/combined?year=yyyy&month=mm`

    Retrieves details of all Settlement Recon.
  </Card>
</CardGroup>

## Related Guides

* [About Settlements](/docs/payments/settlements)
