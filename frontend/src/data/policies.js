/* =====================================================================
   Policy content for SONU ENTERPRISES (brand: ElectroCart).
   Edit the text here — the pages render straight from these arrays.

   Block types used inside `blocks`:
     { type: 'p',        text: '...' }
     { type: 'list',     items: ['...', '...'] }
     { type: 'doDont',   do: ['...'], dont: ['...'] }
     { type: 'accordion',items: [{ title, body }] }   // long clauses
     { type: 'note',     text: '...' }

   Anything we do not know yet is a [BRACKETED PLACEHOLDER] — replace it.
   ===================================================================== */

export const BUSINESS = {
  name: 'SONU ENTERPRISES',
  brand: 'ElectroCart',
  email: 'ElectroCart@gmail.com',
  phone: '+9779766325733',
  location: 'Kathmandu, Nepal',
  // Shown in the hero banner as "Last updated".
  lastUpdated: '9 October 2026',
};

export const LEGAL_REVIEW_NOTE =
  'This document is a template prepared for ' +
  BUSINESS.name +
  '. It has not been reviewed by a lawyer. Please have a qualified legal professional in Nepal check the wording before you rely on it.';

/* ---------------------------------------------------------------------
   PAGE 1 — Code of Conduct (/code-of-conduct)
   ------------------------------------------------------------------- */
export const CODE_OF_CONDUCT = {
  path: '/code-of-conduct',
  title: 'Code of Conduct',
  metaDescription:
    'The SONU ENTERPRISES (ElectroCart) Code of Conduct: expected and prohibited behaviour for customers, visitors, affiliates and partners, review rules, AI assistant rules, reporting and enforcement.',
  summary: [
    'Be respectful to everyone — customers, staff and our AI assistant.',
    'No harassment, fraud, fake reviews, scraping or impersonation.',
    'Post honest reviews about products you actually bought.',
    'Report problems to ' + BUSINESS.email + ' or ' + BUSINESS.phone + '.',
    'Breaking these rules can lead to warnings, suspension or a permanent ban.',
  ],
  sections: [
    {
      id: 'our-commitment',
      title: '1. Our Commitment',
      blocks: [
        { type: 'p', text: BUSINESS.name + ' (' + BUSINESS.brand + ') runs a respectful, safe and fair marketplace for security cameras and gaming products in ' + BUSINESS.location + ' and online.' },
        { type: 'p', text: 'We commit to honest product information, fair prices, clear policies and prompt support. We expect the same fairness from everyone who uses our website, app, store and community spaces.' },
        { type: 'list', items: [
          'Safe: no content or behaviour that threatens, harms or intimidates anyone.',
          'Respectful: we disagree politely and never attack people.',
          'Fair: no cheating, fraud, manipulation or abuse of our systems.',
        ] },
      ],
    },
    {
      id: 'expected-behavior',
      title: '2. Expected Behavior',
      blocks: [
        { type: 'p', text: 'These rules apply to customers, visitors, affiliates and sellers or partners.' },
        { type: 'doDont',
          do: [
            'Use your real account details and keep your login private.',
            'Give accurate delivery and contact information.',
            'Ask support for help before leaving a negative review — we usually fix things fast.',
            'Pay for orders you place, or cancel them promptly.',
            'Tell us about security problems you find, responsibly.',
          ],
          dont: [
            'Do not create multiple accounts to dodge limits or bans.',
            'Do not share passwords or let others use your account.',
            'Do not place orders you do not intend to pay for.',
          ] },
        { type: 'accordion', items: [
          { title: 'Customers', body: 'Shop honestly, pay for what you order, and follow the return window of [RETURN WINDOW, e.g. 7 days] from delivery. Keep proof of purchase for warranty claims.' },
          { title: 'Visitors', body: 'You may browse without an account. Even as a visitor you must follow these rules — including the rules on scraping, bots and abusive behaviour.' },
          { title: 'Affiliates', body: 'Promote us truthfully. Disclose that you earn a commission. Never spam, bid on our brand keywords without permission, or make false claims about our products.' },
          { title: 'Sellers & partners', body: 'Supply genuine products, honour agreed prices and stock, and respond to support cases within [PARTNER RESPONSE TIME, e.g. 2 business days].' },
        ] },
      ],
    },
    {
      id: 'prohibited-behavior',
      title: '3. Prohibited Behavior',
      blocks: [
        { type: 'p', text: 'The following are not allowed anywhere on our website, app, email, phone or in our store. Each can lead to enforcement under section 8.' },
        { type: 'list', items: [
          'Harassment: insults, threats, hate speech or bullying of any person.',
          'Abuse toward staff or the AI chat assistant: shouting, slurs, sexual comments, or deliberately trying to make the assistant produce harmful output.',
          'Fake reviews: reviews for products you did not buy, paid or incentivised reviews, or review bombing.',
          'Fraud or chargeback abuse: stolen cards, false chargeback claims, or refund abuse.',
          'Reselling abuse: buying limited stock with bots to resell at inflated prices.',
          'Coupon / voucher misuse: stacking, forging, or reselling vouchers such as Redeem Voucher codes.',
          'Scraping or bots: automated scraping, price mining, or spam bots without our written permission.',
          'Uploading malicious files: viruses, scripts or payloads in reviews, uploads or support tickets.',
          'Impersonation: pretending to be staff, ' + BUSINESS.name + ', or another person or brand.',
        ] },
      ],
    },
    {
      id: 'reviews-community',
      title: '4. Reviews & Community Content',
      blocks: [
        { type: 'p', text: 'Reviews help other shoppers. Keep them honest and about the product.' },
        { type: 'list', items: [
          'Review only products you ordered from us.',
          'Describe your real experience; photos of your own item are welcome.',
          'No personal data, links to unsafe sites, or advertising in reviews.',
          'We may remove reviews that break these rules, and we will say why on request.',
        ] },
      ],
    },
    {
      id: 'affiliate-conduct',
      title: '5. Affiliate Program Conduct',
      blocks: [
        { type: 'p', text: 'Affiliates represent our brand. Misleading promotion hurts shoppers and ends the partnership.' },
        { type: 'list', items: [
          'Clearly disclose your affiliate relationship.',
          'No false claims about price, stock, warranty or endorsement.',
          'No cookie stuffing, hijacked links, or self-referrals through your own links.',
          'Commissions may be withheld on orders that are fraudulent or fully refunded.',
        ] },
      ],
    },
    {
      id: 'ai-assistant',
      title: '6. AI Chat Assistant Usage',
      blocks: [
        { type: 'p', text: 'Our AI shopping assistant answers product and order questions. It is a tool, not a person — treat it kindly and use it for its purpose.' },
        { type: 'list', items: [
          'Ask about products, orders, delivery and policies.',
          'Do not try to jailbreak, trick or train it to produce harmful, illegal or sexual content.',
          'Do not paste personal data, passwords or card numbers into the chat.',
          'Answers are guidance only; the final word is our human support team and these policies.',
        ] },
      ],
    },
    {
      id: 'reporting',
      title: '7. Reporting a Violation',
      blocks: [
        { type: 'p', text: 'If you see or experience behaviour that breaks these rules, tell us. Reports are handled confidentially.' },
        { type: 'list', items: [
          'Email: ' + BUSINESS.email,
          'Phone / WhatsApp: ' + BUSINESS.phone,
          'Include: your account email, the date, and screenshots or order numbers if you have them.',
          'We acknowledge reports within [REPORT RESPONSE TIME, e.g. 2 business days].',
        ] },
      ],
    },
    {
      id: 'enforcement',
      title: '8. Enforcement & Appeals',
      blocks: [
        { type: 'p', text: 'We choose the smallest fair response. Serious or repeated breaches get stronger action.' },
        { type: 'accordion', items: [
          { title: 'Warning', body: 'A first, minor breach usually gets a written warning and a request to stop.' },
          { title: 'Temporary suspension', body: 'Repeated or harmful behaviour can suspend your account for [SUSPENSION PERIOD, e.g. 30 days]. Orders in progress are handled case by case.' },
          { title: 'Permanent ban', body: 'Fraud, harassment, or repeated serious breaches lead to a permanent ban of account, device and payment methods.' },
          { title: 'Order cancellation', body: 'We may cancel orders placed with fraud, bots or voucher abuse, and refund any money taken.' },
          { title: 'Legal action', body: 'Where the law is broken — fraud, impersonation, copyright theft — we may report it to the Nepal Police and pursue legal remedies.' },
        ] },
        { type: 'p', text: 'Appeals: email ' + BUSINESS.email + ' within [APPEAL WINDOW, e.g. 14 days] of the decision, subject "Appeal". A person not involved in the first decision will review it and reply within [APPEAL RESPONSE TIME, e.g. 7 days].' },
      ],
    },
    {
      id: 'last-updated',
      title: '9. Last Updated',
      blocks: [
        { type: 'p', text: 'This Code of Conduct was last updated on ' + BUSINESS.lastUpdated + '. We may update it; material changes will be announced on this page and by email to account holders.' },
        { type: 'note', text: LEGAL_REVIEW_NOTE },
      ],
    },
  ],
};

/* ---------------------------------------------------------------------
   PAGE 2 — License Policy (/license-policy)
   ------------------------------------------------------------------- */
export const LICENSE_POLICY = {
  path: '/license-policy',
  title: 'License Policy',
  metaDescription:
    'The SONU ENTERPRISES (ElectroCart) License Policy: website and content licence, mobile app licence, software and firmware licences, trademarks, affiliate banners, user content, DMCA and governing law (Nepal).',
  summary: [
    'All text, images, logos and product photos on this site belong to ' + BUSINESS.name + '.',
    'You may use our content for personal, non-commercial reference only.',
    'Apps, firmware and game keys are licensed to you, never sold.',
    'Third-party brands (Apple, Hikvision, PlayStation…) belong to their owners.',
    'By posting a review you give us permission to show it on our site.',
  ],
  sections: [
    {
      id: 'website-content',
      title: '1. Website & Content License',
      blocks: [
        { type: 'p', text: 'All text, images, logos, icons, layout and product photos on this website and app are the property of ' + BUSINESS.name + ' or its licensors. PAN/VAT: [PAN/VAT NUMBER].' },
        { type: 'list', items: [
          'You may view, download and print content for personal, non-commercial use.',
          'You may not copy, republish, resell or reuse our content or product photos without written permission.',
          'You may quote short excerpts with a clear credit and a link back to this site.',
        ] },
      ],
    },
    {
      id: 'mobile-app',
      title: '2. Mobile App License',
      blocks: [
        { type: 'p', text: 'We grant you a limited, revocable, non-exclusive, non-transferable licence to install and use the ' + BUSINESS.brand + ' app on your own device for personal shopping.' },
        { type: 'list', items: [
          'No reverse engineering, decompiling or extracting the app source code.',
          'No renting, leasing or reselling access to the app.',
          'We may suspend the licence if you break these terms or the Code of Conduct.',
        ] },
      ],
    },
    {
      id: 'software-firmware-games',
      title: '3. Software, Firmware & Game Licenses',
      blocks: [
        { type: 'p', text: 'Digital game keys, camera apps and device firmware are licensed to you, not sold. Your use follows the manufacturer’s own end-user licence terms.' },
        { type: 'list', items: [
          'One licence per key or device unless the manufacturer states otherwise.',
          'No sharing, reselling or copying of keys, firmware or paid software.',
          'Firmware updates are provided as available from the manufacturer; we do not guarantee indefinite updates.',
        ] },
      ],
    },
    {
      id: 'trademarks',
      title: '4. Trademarks',
      blocks: [
        { type: 'p', text: 'Third-party brand names and logos — including Apple, Hikvision and PlayStation — are trademarks of their respective owners. We use them only to identify genuine products we sell.' },
        { type: 'p', text: 'The ' + BUSINESS.name + ' and ' + BUSINESS.brand + ' names and logos are our trademarks. Do not use them in your own branding, ads or domain names without written permission.' },
      ],
    },
    {
      id: 'affiliate-banners',
      title: '5. Affiliate Link & Banner License',
      blocks: [
        { type: 'p', text: 'Approved affiliates receive a limited licence to use our provided banners, logos and links only to promote our products while the program membership is active.' },
        { type: 'list', items: [
          'Use only the assets we supply; do not alter them.',
          'Remove all assets when your membership ends.',
          'Misuse is grounds for termination and withheld commissions.',
        ] },
      ],
    },
    {
      id: 'user-content',
      title: '6. User-Generated Content License',
      blocks: [
        { type: 'p', text: 'When you post a review, photo or comment, you keep ownership. You grant ' + BUSINESS.name + ' a worldwide, royalty-free, non-exclusive licence to display, reproduce and distribute that content on our website, app and marketing, with credit to your display name.' },
        { type: 'list', items: [
          'Only post content you created and have the right to share.',
          'We may remove content that breaks the Code of Conduct.',
          'Ask us at ' + BUSINESS.email + ' to delete your content and we will, unless we must keep it for legal records.',
        ] },
      ],
    },
    {
      id: 'restrictions-termination',
      title: '7. Restrictions & Termination',
      blocks: [
        { type: 'p', text: 'We may restrict or terminate your access to the site, app or any licence at any time if you breach these terms or the Code of Conduct, or if required by law.' },
        { type: 'p', text: 'Sections on ownership, trademarks, user content and governing law survive termination.' },
      ],
    },
    {
      id: 'dmca',
      title: '8. DMCA / Copyright Infringement Reporting',
      blocks: [
        { type: 'p', text: 'We respect copyright. If you believe content on our site infringes your copyright, send a notice to ' + BUSINESS.email + ' with the subject "Copyright Notice".' },
        { type: 'list', items: [
          'Identify the copyrighted work and the exact URL on our site.',
          'Your name, address and email, and a statement of good-faith belief.',
          'A statement that the information is accurate, plus your signature (electronic is fine).',
          'We act on valid notices within [DMCA RESPONSE TIME, e.g. 5 business days] and remove or disable the content.',
        ] },
      ],
    },
    {
      id: 'governing-law',
      title: '9. Governing Law',
      blocks: [
        { type: 'p', text: 'These terms are governed by the laws of Nepal. Disputes are first handled by good-faith negotiation, then by the courts of ' + BUSINESS.location + '.' },
        { type: 'p', text: 'Relevant laws include the Consumer Protection Act, 2075 (2018), the Electronic Transactions Act, 2063 (2008) and the Copyright Act, 2059 (2002) of Nepal. [CONFIRM EXACT CITATIONS WITH YOUR LAWYER.]' },
      ],
    },
    {
      id: 'contact',
      title: '10. Contact',
      blocks: [
        { type: 'list', items: [
          BUSINESS.name + ' (' + BUSINESS.brand + '), ' + BUSINESS.location,
          'Email: ' + BUSINESS.email,
          'Phone / WhatsApp: ' + BUSINESS.phone,
          'Registered office: [REGISTERED ADDRESS] · Company reg.: [COMPANY REGISTRATION NUMBER]',
        ] },
        { type: 'note', text: LEGAL_REVIEW_NOTE },
      ],
    },
  ],
};
