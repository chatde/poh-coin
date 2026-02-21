"use client";

export default function SchoolsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 sm:px-6">
          {/* Hero */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Schools Program
            </h1>
            <p className="text-xl text-gray-300">
              Empower students to contribute to real science while earning POH tokens.
              Schools get up to 10 devices mining at full rates.
            </p>
          </div>

          {/* How it works */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: "1",
                  title: "Register Your School",
                  desc: "Contact us with your school name and admin details. We'll verify and set up your school account on the blockchain.",
                },
                {
                  step: "2",
                  title: "Connect Devices",
                  desc: "Register up to 10 devices (old phones, tablets, lab computers) under your school. Each earns mining rewards at full rates.",
                },
                {
                  step: "3",
                  title: "Students Mine for Science",
                  desc: "Devices run compute tasks (protein folding, climate models, signal analysis) while earning POH tokens for the school.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="bg-[var(--surface)] rounded-xl p-6 border border-gray-800"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--charity-green)]/20 flex items-center justify-center mb-4">
                    <span className="text-[var(--charity-green)] font-bold">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Benefits */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              Why Schools?
            </h2>
            <div className="space-y-4">
              {[
                {
                  title: "10-Device Cap",
                  desc: "Schools can register up to 10 devices, all earning at full rates without the economic decay that individual multi-device setups face.",
                },
                {
                  title: "Real Science Education",
                  desc: "Students learn about distributed computing, protein folding, climate science, and blockchain — hands-on.",
                },
                {
                  title: "Equal Rates",
                  desc: "School devices earn the same rates as everyone else. No special treatment, just a higher device cap to reflect classroom use.",
                },
                {
                  title: "Leaderboard Recognition",
                  desc: "Schools appear on the public leaderboard. Compete with schools worldwide to contribute the most to science.",
                },
                {
                  title: "Sustainability Lesson",
                  desc: "POH's Voyager-inspired emission model teaches students about long-term thinking — this system is designed to run for 20+ years.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-[var(--surface)] rounded-lg p-4 border border-gray-800"
                >
                  <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Requirements */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              Requirements
            </h2>
            <ul className="space-y-2 text-gray-300">
              <li className="flex gap-3">
                <span className="text-[var(--charity-green)]">&#10003;</span>
                Registered educational institution (K-12, university, community center)
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--charity-green)]">&#10003;</span>
                Designated admin with a Base network wallet
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--charity-green)]">&#10003;</span>
                Up to 10 devices (old phones/tablets work great)
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--charity-green)]">&#10003;</span>
                WiFi connection for heartbeat and task distribution
              </li>
            </ul>
          </section>

          {/* CTA */}
          <section className="text-center bg-[var(--surface)] rounded-xl p-8 border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-4">
              Get Your School Started
            </h2>
            <p className="text-gray-400 mb-6">
              Contact us to register your school for the Proof of Planet program.
            </p>
            <a
              href="mailto:schools@pursuitofhappiness.com?subject=Schools Program Registration"
              className="inline-block bg-[var(--charity-green)] text-white font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-opacity"
            >
              Register Your School
            </a>
            <p className="text-gray-500 text-xs mt-4">
              Or reach out on Discord or Telegram for faster response.
            </p>
          </section>
    </div>
  );
}
