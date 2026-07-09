import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about CETER Technology's mission, vision, and business values.",
};

export default function AboutPage() {
  return (
    <div className="bg-white">
      <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-wide text-orange-300">
            About CETER Technology
          </p>
          <h1 className="mt-3 text-4xl font-black">
            Reliable printing and technology solutions
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            CETER Technology provides reliable printing and technology solutions
            for individuals, businesses, and organizations.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        {[
          [
            "Mission",
            "To supply dependable printing products and responsive support that help customers work without avoidable downtime.",
          ],
          [
            "Vision",
            "To become a trusted technology partner for offices, institutions, and growing businesses across the region.",
          ],
          [
            "Values",
            "Reliability, professionalism, genuine products, practical guidance, and long-term customer relationships.",
          ],
        ].map(([title, text]) => (
          <article key={title} className="rounded-lg bg-slate-50 p-6">
            <h2 className="text-xl font-black text-slate-950">{title}</h2>
            <p className="mt-4 leading-7 text-slate-600">{text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
