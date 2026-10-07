import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { FaqItem } from "@/lib/siteConfig";

interface FaqSectionProps {
  title?: string;
  faqs: FaqItem[];
}

/** Visible FAQ block. Pair it with faqJsonLd(faqs) in <Seo jsonLd={...}>. */
const FaqSection = ({ title = "Frequently asked questions", faqs }: FaqSectionProps) => (
  <section className="container py-12 max-w-3xl" aria-labelledby="faq-heading">
    <h2 id="faq-heading" className="text-2xl font-bold text-foreground mb-6">
      {title}
    </h2>
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, i) => (
        <AccordionItem key={faq.q} value={`faq-${i}`}>
          <AccordionTrigger className="text-left font-semibold">{faq.q}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </section>
);

export default FaqSection;
