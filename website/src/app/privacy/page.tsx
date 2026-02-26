export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 sm:px-6">
      <h1 className="text-4xl font-bold text-foreground mb-4">
        Privacy Policy
      </h1>
      <p className="text-foreground/50 text-sm mb-8">
        Last updated: February 2026
      </p>

      <div className="prose prose-invert max-w-none space-y-8 text-foreground/70 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">1. Introduction</h2>
          <p>
            Project POH (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website
            projectpoh.com and associated services (the &quot;Service&quot;). This Privacy Policy
            explains how we collect, use, disclose, and safeguard your information when you
            use our Service.
          </p>
          <p className="mt-3">
            By using the Service, you consent to the data practices described in this policy.
            If you do not agree, please discontinue use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">2. Information We Collect</h2>

          <h3 className="text-lg font-semibold text-foreground/90 mt-4 mb-2">2.1 Information You Provide</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-foreground/90">Wallet Address</strong> — Your public blockchain
              wallet address when you connect to the mining app or claim rewards.
            </li>
            <li>
              <strong className="text-foreground/90">Fitness Data</strong> — If you connect Strava,
              we receive activity data (type, duration, distance, effort scores) via the Strava API.
              We do not receive your Strava password.
            </li>
            <li>
              <strong className="text-foreground/90">Contact Information</strong> — If you email us
              at contact@projectpoh.com, we retain the correspondence.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground/90 mt-4 mb-2">2.2 Information Collected Automatically</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-foreground/90">Device Information</strong> — A hashed device ID
              generated from your browser and hardware characteristics for Sybil resistance. We do
              not collect device serial numbers.
            </li>
            <li>
              <strong className="text-foreground/90">Geolocation (H3 Cell)</strong> — A coarse
              geographic cell (H3 resolution 4, ~1,770 km&sup2;) used for geographic diversity scoring.
              This is not precise enough to identify your street address.
            </li>
            <li>
              <strong className="text-foreground/90">Compute Metrics</strong> — Mining performance data
              (hash rates, task completion times, benchmark scores) for reward calculations.
            </li>
            <li>
              <strong className="text-foreground/90">Usage Data</strong> — Pages visited, browser type,
              and referral URLs via Vercel Analytics. This data is aggregated and not linked to
              individual identities.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Calculate and distribute mining rewards fairly</li>
            <li>Prevent Sybil attacks and fraudulent mining activity</li>
            <li>Compute fitness mining bonuses from connected Strava accounts</li>
            <li>Display leaderboard rankings (wallet address only, opt-in)</li>
            <li>Improve the Service and fix bugs</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">4. Third-Party Services</h2>
          <p>We share data with the following third-party services:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>
              <strong className="text-foreground/90">Supabase</strong> — Database hosting for mining
              data, reward calculations, and node registration. Supabase stores data in secure,
              SOC 2 Type II compliant data centers.
            </li>
            <li>
              <strong className="text-foreground/90">Strava</strong> — If you connect your Strava
              account, we access your activity data via OAuth. You can disconnect Strava at any time
              through the mining dashboard.
            </li>
            <li>
              <strong className="text-foreground/90">Vercel</strong> — Website hosting and analytics.
              Vercel may collect anonymized usage data.
            </li>
            <li>
              <strong className="text-foreground/90">Base Blockchain</strong> — Wallet addresses and
              transaction data are publicly visible on the Base blockchain by design. Blockchain data
              is immutable and cannot be deleted.
            </li>
            <li>
              <strong className="text-foreground/90">Sentry</strong> — Error tracking to identify and
              fix bugs. Sentry may receive anonymized error reports.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">5. Cookies and Local Storage</h2>
          <p>
            We use browser localStorage to store your mining session data (wallet address, device ID,
            mining preferences). We do not use tracking cookies. Vercel Analytics may set a first-party
            cookie for aggregated page view counts.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">6. Data Retention</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-foreground/90">Mining data</strong> is retained for the duration
              of the mining epoch (7 days) plus a 30-day archival period for dispute resolution.
            </li>
            <li>
              <strong className="text-foreground/90">Wallet addresses</strong> are retained
              indefinitely as they are necessary for reward distribution and on-chain verification.
            </li>
            <li>
              <strong className="text-foreground/90">Fitness data</strong> is retained for 90 days
              after the last sync, then automatically deleted.
            </li>
            <li>
              <strong className="text-foreground/90">Blockchain data</strong> is permanent and
              immutable by nature.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">7. Your Rights (GDPR / CCPA)</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>
              <strong className="text-foreground/90">Access</strong> — Request a copy of the personal
              data we hold about you.
            </li>
            <li>
              <strong className="text-foreground/90">Rectification</strong> — Request correction of
              inaccurate data.
            </li>
            <li>
              <strong className="text-foreground/90">Deletion</strong> — Request deletion of your
              data, except where retention is required by law or blockchain immutability.
            </li>
            <li>
              <strong className="text-foreground/90">Portability</strong> — Request your data in a
              machine-readable format.
            </li>
            <li>
              <strong className="text-foreground/90">Opt-Out</strong> — California residents may opt
              out of the sale of personal information. We do not sell personal information.
            </li>
            <li>
              <strong className="text-foreground/90">Withdraw Consent</strong> — You may disconnect
              third-party integrations (e.g., Strava) at any time.
            </li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:contact@projectpoh.com" className="text-accent-light hover:underline">
              contact@projectpoh.com
            </a>.
            We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">8. Data Security</h2>
          <p>
            We implement industry-standard security measures including encrypted connections (HTTPS),
            hashed device identifiers, rate-limited API endpoints, and access controls on our
            database. However, no method of electronic storage or transmission is 100% secure,
            and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">9. Children&apos;s Privacy</h2>
          <p>
            The Service is not directed to individuals under 18 years of age. We do not knowingly
            collect personal information from children. If you believe we have inadvertently
            collected such data, contact us and we will delete it promptly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">10. International Transfers</h2>
          <p>
            Your data may be processed in the United States or other countries where our service
            providers operate. By using the Service, you consent to the transfer of your data
            to these jurisdictions, which may have different data protection laws than your
            country of residence.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this
            page with an updated date. Continued use of the Service after changes constitutes
            acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">12. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our data practices, contact us at:{" "}
            <a href="mailto:contact@projectpoh.com" className="text-accent-light hover:underline">
              contact@projectpoh.com
            </a>
          </p>
          <p className="mt-3">
            You can also reach us via GitHub at{" "}
            <a href="https://github.com/chatde/poh-coin" className="text-accent-light hover:underline">
              github.com/chatde/poh-coin
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
