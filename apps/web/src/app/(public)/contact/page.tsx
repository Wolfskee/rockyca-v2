import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <section className="bg-slate-900 py-24">
        <div className="mx-auto max-w-7xl px-4 text-center text-white sm:px-6 lg:px-8">
          <h1 className="mb-4 text-4xl font-bold">Contact Us</h1>
          <p className="text-xl text-slate-300">Get in touch with our team</p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-8 text-3xl font-bold text-slate-900">
                Get In Touch
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-1.5 text-lg font-semibold text-slate-900">
                    Address
                  </h3>
                  <p className="text-slate-600">
                    1383 Dugald Road,
                    <br />
                    Winnipeg, MB R2J 0H3
                  </p>
                </div>
                <div>
                  <h3 className="mb-1.5 text-lg font-semibold text-slate-900">
                    Phone
                  </h3>
                  <p className="text-slate-600">
                    <a
                      href="tel:+12042565277"
                      className="text-blue-700 hover:underline"
                    >
                      +1 (204)-256-5277
                    </a>
                  </p>
                </div>
                <div>
                  <h3 className="mb-1.5 text-lg font-semibold text-slate-900">
                    Email
                  </h3>
                  <p className="text-slate-600">
                    <a
                      href="mailto:sales@rockyca.com"
                      className="text-blue-700 hover:underline"
                    >
                      sales@rockyca.com
                    </a>
                  </p>
                </div>
                <div>
                  <h3 className="mb-1.5 text-lg font-semibold text-slate-900">
                    Business Hours
                  </h3>
                  <p className="text-slate-600">
                    Monday - Saturday: 9:00 AM - 6:00 PM
                    <br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
              <h2 className="mb-6 text-2xl font-bold text-slate-900">
                Send Us a Message
              </h2>
              <ContactForm defaultSubject={params.subject} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-3xl font-bold text-slate-900">
            Visit Our Showroom
          </h2>
          <iframe
            title="Rocky Trading Company Showroom Map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2570.668234416054!2d-97.05937162370357!3d49.886256627826626!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x52ea779f892758a3%3A0xa2a61d4f9af4dfd9!2sRocky%20Trading%20Company!5e0!3m2!1sen!2sca!4v1751519795984!5m2!1sen!2sca"
            className="h-96 w-full rounded-xl border-0 shadow-sm"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </>
  );
}
