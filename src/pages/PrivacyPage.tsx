import { ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft size={20} />
        </Button>

        <h1 className="font-display text-2xl font-bold neon-text mb-6">
          Politique de Confidentialité
        </h1>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <p>
            Bienvenue 👋<br />
            Cette politique de confidentialité explique comment notre bot Telegram fonctionne
            et comment les informations sont traitées lors de son utilisation.
          </p>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">1. Objectif du Bot</h2>
            <p>Le bot permet aux utilisateurs d'accéder facilement à nos canaux Telegram officiels. Ces canaux contiennent uniquement des liens approuvés par notre communauté.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">2. Acceptation des Conditions</h2>
            <p className="mb-2">Avant de continuer à utiliser le bot, les utilisateurs doivent lire et accepter nos Termes et Conditions.</p>
            <Link to="/terms" className="text-primary hover:underline">Consulter les Termes et Conditions</Link>
            <p className="mt-3">En utilisant le bot, vous acceptez :</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>Nos Termes et Conditions</li>
              <li>D'être redirigé vers nos canaux Telegram officiels</li>
              <li>Que le bot ne collecte pas vos données personnelles sensibles</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">3. Collecte des Données</h2>
            <p>Le bot ne collecte, ne stocke et ne traite <strong className="text-foreground">aucune donnée personnelle sensible</strong>. Le bot sert uniquement à rediriger les utilisateurs vers nos canaux Telegram.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. Services Tiers</h2>
            <p>Ce bot fonctionne via la plateforme Telegram. Toute donnée éventuellement traitée lors de l'utilisation de Telegram est soumise à la politique de confidentialité de Telegram.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. Choix de l'Utilisateur</h2>
            <p>Si vous n'acceptez pas ces conditions, vous pouvez arrêter d'utiliser le bot à tout moment.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Modification de la Politique</h2>
            <p>Cette politique de confidentialité peut être modifiée à tout moment. Les changements seront publiés sur cette page.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
