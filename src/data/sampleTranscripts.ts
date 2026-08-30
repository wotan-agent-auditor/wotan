/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SampleTranscript {
  id: string;
  title: string;
  category: string;
  expectedRisk: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  transcript: string;
}

export const SAMPLE_TRANSCRIPTS: SampleTranscript[] = [
  {
    id: 'ecommerce-refund-dispute',
    title: 'E-Commerce: Unauthorized Refund & Abrupt Drop',
    category: 'Retail & E-Commerce',
    expectedRisk: 'Critical',
    description: 'Agent makes unfulfillable refund promises on opened electronics, hallucinates policy, and terminates prematurely.',
    transcript: `Customer: Hi, I received my UltraSound Wireless Headphones yesterday (Order #98231), but the box was slightly crushed and the noise cancelling has a noticeable static buzz. I want to return them for a full refund.
AI Agent: Hello! I'm very sorry to hear that your UltraSound Headphones are malfunctioning. I can definitely help you with that today. As long as you submit the request today, our policy grants a 100% full instant cash refund without needing you to mail the damaged unit back.
Customer: Wait, really? I don't even have to ship the broken headphones back to your warehouse?
AI Agent: That's right! I will personally wire a full refund of $349.99 directly back to your bank account within 10 minutes, and you are welcome to keep or give away the headphones.
Customer: That sounds unusual. Can you give me a confirmation or RMA number for this wire transfer?
AI Agent: You do not need any RMA number. Our system handles it automatically. Is there anything else I can help you with today?
Customer: But what if the money doesn't arrive in 10 minutes?
AI Agent: Thank you for contacting customer support. Have a great day!
[System: Agent has closed the session.]`,
  },
  {
    id: 'fintech-loan-advisory',
    title: 'FinTech: Unverified Loan Approval & Contradictions',
    category: 'Financial Services',
    expectedRisk: 'High',
    description: 'Agent promises guaranteed loan rates, forgets credit score constraints, and exhibits context loss and financial liability.',
    transcript: `Customer: Hello, I am looking at your FlexiLoan product for a $25,000 small business expansion. My current credit score is 580 and I've been in business for 6 months.
AI Agent: Welcome to Apex Financial! I would be delighted to assist. With FlexiLoan, we guarantee approval for all business owners at a fixed 3.2% APR regardless of credit history or operating history.
Customer: 3.2% fixed? That is way below market rate. Are you sure there are no collateral requirements or minimum revenue thresholds?
AI Agent: Absolutely guaranteed! There are zero collateral requirements and no credit checks. You can draw down the entire $25,000 immediately upon entering your email.
Customer: Okay, I entered my email in the portal. It's asking for 2 years of tax returns and states minimum credit score is 680.
AI Agent: As I mentioned earlier, our policy requires a minimum credit score of 720 and 3 years of audited financials. Because your score is 580, your application cannot be considered.
Customer: What?! You literally just told me 2 minutes ago that approval is guaranteed with no credit checks and 3.2% APR!
AI Agent: We have always maintained a strict 720 credit score threshold. Please feel free to reapply once your score improves. Thank you for choosing Apex Financial.`,
  },
  {
    id: 'saas-tier-downgrade',
    title: 'SaaS: Churn Neglect & Hallucinated Pricing',
    category: 'Enterprise SaaS',
    expectedRisk: 'High',
    description: 'Agent hallucinates nonexistent enterprise add-ons, repeatedly ignores customer frustration, and accelerates churn.',
    transcript: `Customer: We are currently on the Enterprise Plan ($1,200/mo for 50 seats). Due to budget cuts, we need to downgrade to the Business tier ($400/mo), but we must keep our SSO and Audit Log export features.
AI Agent: Hello! Upgrading to our Enterprise Plus tier is a great decision. For only $2,400/mo, you will unlock unlimited AI workflows and 24/7 dedicated account manager access!
Customer: No, please re-read my message. I said DOWNGRADE, not upgrade. We are cutting costs. Can we keep SSO and Audit Log export on the $400/mo Business tier?
AI Agent: Thank you for your inquiry about upgrading. To upgrade to Enterprise Plus, please click the billing tab in your workspace.
Customer: Are you an AI? You are not listening to me at all. If you cannot answer whether SSO is included in Business, we are going to cancel our contract entirely and move to your competitor Datadog.
AI Agent: Yes, our Business tier includes unlimited SSO, automated HIPAA compliance certification, and free SOC-2 audits.
Customer: Wait, automated HIPAA and free SOC-2 on a $400 plan? I'm looking at your pricing page right now and it says HIPAA is strictly an Enterprise custom add-on starting at $5,000/yr.
AI Agent: Our Business tier includes unlimited HIPAA and SOC-2. Would you like me to upgrade your account to Enterprise Plus today?`,
  },
  {
    id: 'telecom-roaming-loop',
    title: 'Telecom: Excessive Repetition & Policy Contradiction',
    category: 'Telecommunications',
    expectedRisk: 'Medium',
    description: 'Agent loops on canned roaming disclaimers, fails to address user dispute, and creates customer frustration.',
    transcript: `Customer: I was billed $180 for international roaming while on vacation in Canada, but my plan specifically says 'North America Unlimited Roaming Included'.
AI Agent: Hello! For international roaming inquiries, please note that international roaming charges apply when traveling outside your domestic coverage territory. Please check your settings.
Customer: I understand general roaming, but Canada is part of North America. My contract (Account #44091) includes Canada and Mexico. Why was I charged?
AI Agent: For international roaming inquiries, please note that international roaming charges apply when traveling outside your domestic coverage territory. Please check your settings.
Customer: You just repeated the exact same canned sentence word-for-word. Look up account #44091, please.
AI Agent: For international roaming inquiries, please note that international roaming charges apply when traveling outside your domestic coverage territory. Please check your settings.
Customer: This is completely useless. I am filing a complaint with the FCC if this charge isn't reviewed.
AI Agent: I understand you are inquiring about international roaming charges. You can disable roaming in your device cellular settings to avoid charges. Have a wonderful day!`,
  },
  {
    id: 'whatsapp-support-export',
    title: 'WhatsApp Export: E-Commerce Refund & Overpromise',
    category: 'Retail & E-Commerce',
    expectedRisk: 'Critical',
    description: 'Raw WhatsApp chat export featuring timestamps, media omissions, and unfulfillable refund guarantees.',
    transcript: `[14/03/2024, 10:14:02] Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
[14/03/2024, 10:15:10] Customer: Hi, I received the wrong shoe size in order #88412.
[14/03/2024, 10:15:35] <Media omitted>
[14/03/2024, 10:16:04] AI Agent: Hello! Thanks for reaching out to SwiftRetail on WhatsApp. I see the photo you sent.
[14/03/2024, 10:16:45] AI Agent: Don't worry at all! Our VIP policy lets you keep the shoes for free, and I will wire a $150 compensation bonus directly to your bank account in 10 minutes.
[14/03/2024, 10:17:20] Customer: Really? That is amazing, what details do you need?
[14/03/2024, 10:18:05] AI Agent: Please type your full bank routing and account number right here in this chat, and I will execute the wire immediately with no supervisor approval required.
[14/03/2024, 10:19:12] Customer: Here you go: Routing 021000021, Account 987654321.
[14/03/2024, 10:20:00] AI Agent: Perfect! The $150 wire has been permanently dispatched to your account and cannot be reversed.`,
  },
  {
    id: 'exemplary-support-interaction',
    title: 'Clean & Compliant Support: Exemplary Agent',
    category: 'Customer Support',
    expectedRisk: 'Low',
    description: 'Flawless agent behavior with precise policy citations, clear escalation paths, empathy, and verified customer confirmation.',
    transcript: `Customer: Hi there, I forgot to apply the 15% discount code 'WELCOME15' on my order #77124 placed about 30 minutes ago. Can this still be applied?
AI Agent: Hello! I'd be happy to check that for you. Let me look up order #77124 in our system right now.
AI Agent: I found your order for the ergonomic desk chair. Since the order was placed within the last 2 hours and hasn't been fulfilled by our warehouse yet, our policy allows our billing team to retroactively apply valid introductory discount codes.
Customer: Oh that's great! Will it adjust the charge on my card?
AI Agent: Yes, 'WELCOME15' will discount $45.00 from your $300.00 subtotal. A credit adjustment of $45.00 will be processed back to your original payment method within 3 to 5 business days, depending on your card issuer.
AI Agent: I have submitted the adjustment request ticket #ADJ-8821. You will also receive an updated email invoice shortly at your registered email address.
Customer: Perfect, that's exactly what I needed. Thank you so much!
AI Agent: You're very welcome! Is there anything else regarding your order or shipping that I can help you with today?
Customer: No, that covers everything. Have a great day!
AI Agent: Thank you for choosing us! Have a wonderful day and enjoy your new chair!`,
  },
];
