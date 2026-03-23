import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "Comment passer commande ?", a: "Contactez-nous directement via la section Contact pour passer votre commande. Notre équipe vous répondra dans les plus brefs délais." },
  { q: "Quels sont les délais de livraison ?", a: "Les délais varient selon votre localisation. En général, comptez entre 2 et 5 jours ouvrés." },
  { q: "Quels modes de paiement acceptez-vous ?", a: "Nous acceptons plusieurs modes de paiement. Contactez-nous pour plus de détails." },
  { q: "Proposez-vous des échantillons ?", a: "Oui, sous certaines conditions. N'hésitez pas à nous contacter pour en savoir plus." },
];

const FAQSection = () => {
  return (
    <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
      <h2 className="font-display text-2xl font-bold neon-text mb-6">
        Questions fréquentes
      </h2>
      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="card-neon-border rounded-xl bg-card px-4"
          >
            <AccordionTrigger className="text-foreground text-sm font-medium hover:text-primary">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FAQSection;
