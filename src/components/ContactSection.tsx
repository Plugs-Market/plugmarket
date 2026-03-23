import { Mail, MessageCircle, Send } from "lucide-react";

const ContactSection = () => {
  return (
    <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
      <h2 className="font-display text-2xl font-bold neon-text mb-6">
        Contactez-nous
      </h2>
      <div className="space-y-4">
        <a
          href="https://t.me/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-4 rounded-xl bg-card card-neon-border hover:neon-glow transition-shadow"
        >
          <Send className="text-primary" size={24} />
          <div>
            <p className="text-foreground font-medium">Telegram</p>
            <p className="text-muted-foreground text-sm">Rejoignez-nous sur Telegram</p>
          </div>
        </a>
        <a
          href="mailto:contact@plugsmarket.com"
          className="flex items-center gap-4 p-4 rounded-xl bg-card card-neon-border hover:neon-glow transition-shadow"
        >
          <Mail className="text-primary" size={24} />
          <div>
            <p className="text-foreground font-medium">Email</p>
            <p className="text-muted-foreground text-sm">contact@plugsmarket.com</p>
          </div>
        </a>
        <a
          href="#"
          className="flex items-center gap-4 p-4 rounded-xl bg-card card-neon-border hover:neon-glow transition-shadow"
        >
          <MessageCircle className="text-primary" size={24} />
          <div>
            <p className="text-foreground font-medium">WhatsApp</p>
            <p className="text-muted-foreground text-sm">Discutez avec nous</p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default ContactSection;
