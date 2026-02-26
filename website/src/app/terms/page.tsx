import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Project POH",
  description:
    "Terms of Service for Project POH, the Pursuit of Happiness charity cryptocurrency on the Base network.",
  openGraph: {
    title: "Terms of Service — Project POH",
    description:
      "Terms of Service for Project POH, the Pursuit of Happiness charity cryptocurrency on the Base network.",
  },
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 sm:px-6">
      <h1 className="text-4xl font-bold text-foreground mb-4">
        Terms of Service
      </h1>
      <p className="text-foreground/50 text-sm mb-8">
        Last updated: February 2026
      </p>

      <div className="prose prose-invert max-w-none space-y-8 text-foreground/70 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Project POH website (projectpoh.com), mining application,
            smart contracts, or any associated services (collectively, the &quot;Service&quot;), you agree
            to be bound by these Terms of Service. If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">2. Description of Service</h2>
          <p>
            Project POH provides: (a) an ERC20 token (POH) on the Base blockchain;
            (b) a &quot;Proof of Planet&quot; phone-based computing system that runs scientific compute
            tasks; (c) a reward distribution system for compute contributors; and (d) a
            charity treasury funded by transaction fees.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">3. Eligibility</h2>
          <p>
            You must be at least 18 years old (or the age of legal majority in your jurisdiction)
            to use the Service. By using the Service, you represent and warrant that you meet
            this requirement and that your use complies with all applicable laws in your jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">4. Not Financial Advice</h2>
          <p>
            Nothing on the Service constitutes financial, investment, legal, or tax advice.
            POH tokens have no guaranteed value. You may lose your entire contribution.
            Always do your own research and consult qualified professionals before making
            any financial decisions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">5. Token Nature</h2>
          <p>
            POH is a utility and charity token. It is not a security, commodity, or regulated
            financial instrument. POH does not represent ownership, equity, shares, or rights
            in any entity. There is no expectation of profit from the efforts of others.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">6. Mining and Compute</h2>
          <p>
            The Proof of Planet mining system uses your device&apos;s processing power to run
            scientific compute tasks. By participating, you acknowledge that: (a) mining
            consumes battery and processing resources; (b) rewards are not guaranteed and
            depend on network conditions; (c) the system includes thermal safety limits
            but you are responsible for monitoring your device; (d) compute results are
            verified by redundant computation and outlier results may reduce your reputation score.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">7. Wallet and Keys</h2>
          <p>
            If you create a wallet through the Service, you are solely responsible for
            securing your recovery phrase and private keys. We do not store, have access to,
            or can recover your private keys. Loss of your keys means permanent loss of
            access to any associated tokens.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">8. Smart Contract Risk</h2>
          <p>
            The Service relies on smart contracts deployed on the Base blockchain. Smart
            contracts are immutable once deployed and may contain bugs despite testing.
            Contracts have been analyzed with Slither and Mythril but have not been
            audited by a third-party security firm. You interact with smart contracts
            at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">9. Charity Distributions</h2>
          <p>
            Transaction fees are collected in the POHCharity smart contract with a timelock
            mechanism. Charity distributions are discretionary and subject to governance
            decisions. Project POH is not a registered charity or 501(c)(3) organization.
            Contributions to POH are not tax-deductible donations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">10. Prohibited Use</h2>
          <p>
            You may not: (a) use the Service for money laundering, terrorist financing, or
            other illegal activities; (b) attempt to exploit, hack, or manipulate smart
            contracts or backend systems; (c) run automated scripts to gain unfair mining
            advantages; (d) create fake devices or spoof heartbeats; (e) use the Service
            in any jurisdiction where doing so is prohibited by law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">11. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, the Project POH team, contributors,
            and affiliates shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, including but not limited to loss of
            tokens, loss of data, or loss of profits, arising from your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">12. Modifications</h2>
          <p>
            We reserve the right to modify these Terms at any time. Changes will be posted
            on this page with an updated date. Continued use of the Service after changes
            constitutes acceptance of the modified Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">13. Open Source</h2>
          <p>
            The Project POH codebase is open source under the MIT License. Smart contract
            source code is verified on Basescan. You are encouraged to review and audit
            the code independently.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">14. Contact</h2>
          <p>
            For questions about these Terms, contact us via GitHub at{" "}
            <a href="https://github.com/chatde/poh-coin" className="text-accent-light hover:underline">
              github.com/chatde/poh-coin
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
