import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { parseBBCode } from "@/lib/bbcode";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQSection = () => {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFAQ = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("admin-faq", {
          body: { action: "get_faq" },
        });
        if (!error && data?.success) {
          setItems(data.items || []);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchFAQ();
  }, []);

  return (
    <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
      <h2 className="font-display text-2xl font-bold neon-text mb-6">
        Questions fréquentes
      </h2>
      {loading ? (
        <p className="text-muted-foreground text-center py-12">Chargement...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Aucune question pour le moment</p>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {items.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="card-neon-border rounded-xl bg-card px-4"
            >
              <AccordionTrigger className="text-foreground text-sm font-medium hover:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm">
                <div dangerouslySetInnerHTML={{ __html: parseBBCode(faq.answer) }} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default FAQSection;
